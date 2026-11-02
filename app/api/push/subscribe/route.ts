import { NextResponse } from 'next/server'
import { adminClient, userFromRequest } from '../../../lib/pushServer'

// v1.6.1 · Guarda (POST) o quita (DELETE) este dispositivo para recibir notificaciones. Requiere sesión iniciada.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Body = { endpoint?: string; keys?: { p256dh?: string; auth?: string }; userAgent?: string }

export async function POST(request: Request) {
  const userId = await userFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Inicia sesión de nuevo' }, { status: 401 })
  const b = (await request.json().catch(() => ({}))) as Body
  if (!b.endpoint || !b.endpoint.startsWith('https://') || !b.keys?.p256dh || !b.keys?.auth) return NextResponse.json({ error: 'Dispositivo inválido' }, { status: 400 })
  const admin = adminClient()
  // un mismo celular solo recibe los avisos de la cuenta que está abierta: si cambia de cuenta, el registro se traspasa
  const { error } = await admin.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth, user_agent: (b.userAgent || '').slice(0, 300) },
    { onConflict: 'endpoint' },
  )
  if (error) return NextResponse.json({ error: 'No se pudo guardar el dispositivo' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const userId = await userFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Inicia sesión de nuevo' }, { status: 401 })
  const b = (await request.json().catch(() => ({}))) as Body
  const admin = adminClient()
  let q = admin.from('push_subscriptions').delete().eq('user_id', userId)
  if (b.endpoint) q = q.eq('endpoint', b.endpoint)
  await q
  return NextResponse.json({ ok: true })
}
