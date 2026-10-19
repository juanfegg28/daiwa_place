import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Borrado REAL de las historias vencidas (v1.2.0). Mismo patrón que dm-purge.
//
// Lo llama un cron job de Supabase (pg_cron + pg_net) cada hora, con la cabecera
//   Authorization: Bearer <CRON_SECRET>
// Busca las historias eliminadas o cuyo vencimiento + días de archivo ya pasó (y que NO estén en una destacada
// ni tengan un reporte pendiente), borra su archivo del bucket «story-media» y vacía su contenido.
// La privacidad NO depende de este cron: la base de datos y Storage comprueban la fecha en cada lectura.
// Cómo programarlo: ver el SQL de la v1.2.0, sección 7. Usa las mismas variables de Vercel que dm-purge.
export const dynamic = 'force-dynamic'

const BUCKET = 'story-media'
const BATCH = 200

async function purge(request: Request) {
  const secret = process.env.CRON_SECRET
  const given = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!secret || given !== secret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data, error } = await admin.rpc('story_purge_candidates', { p_limit: BATCH })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data as { id: string; media_path: string | null }[] | null) ?? []
  if (rows.length === 0) return NextResponse.json({ purged: 0 })

  const paths = rows.map((r) => r.media_path).filter((p): p is string => !!p)
  if (paths.length > 0) {
    const { error: removeError } = await admin.storage.from(BUCKET).remove(paths)
    if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 })
  }

  const { error: markError } = await admin.rpc('story_mark_purged', { p_ids: rows.map((r) => r.id) })
  if (markError) return NextResponse.json({ error: markError.message }, { status: 500 })

  return NextResponse.json({ purged: rows.length })
}

export const GET = purge
export const POST = purge
