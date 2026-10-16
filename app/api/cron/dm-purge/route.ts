import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Borrado REAL de las fotos que se autodestruyen en los mensajes directos (v1.1.0).
//
// Lo llama un cron job de Supabase (pg_cron + pg_net) cada hora, con la cabecera
//   Authorization: Bearer <CRON_SECRET>
// Busca en la base de datos las fotos cuyo `expires_at` ya pasó (o de mensajes eliminados), borra el archivo
// con la API de Storage y las marca como borradas. Las fotos que tienen un reporte pendiente NO se tocan
// hasta que el equipo resuelva el reporte. Cómo programarlo: ver el SQL de la v1.1.0, sección 2.6.
//
// Variables de entorno necesarias en Vercel: SUPABASE_SERVICE_ROLE_KEY (ya la tienes) y CRON_SECRET (nueva).
export const dynamic = 'force-dynamic'

const BUCKET = 'dm-images'
const BATCH = 200

async function purge(request: Request) {
  const secret = process.env.CRON_SECRET
  const given = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!secret || given !== secret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data, error } = await admin.rpc('dm_images_to_purge', { p_limit: BATCH })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data as { id: string; image_path: string }[] | null) ?? []
  if (rows.length === 0) return NextResponse.json({ purged: 0 })

  const { error: removeError } = await admin.storage.from(BUCKET).remove(rows.map((r) => r.image_path))
  if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 })

  const { error: markError } = await admin.rpc('dm_images_mark_purged', { p_ids: rows.map((r) => r.id) })
  if (markError) return NextResponse.json({ error: markError.message }, { status: 500 })

  return NextResponse.json({ purged: rows.length })
}

export const GET = purge
export const POST = purge
