import { NextResponse } from 'next/server'
import { adminClient, pushConfigured, sendToUser, userFromRequest } from '../../../lib/pushServer'

// v1.6.1 · «Enviar notificación de prueba» (Configuración → Notificaciones). Solo te la manda a ti.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const userId = await userFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Inicia sesión de nuevo' }, { status: 401 })
  if (!pushConfigured()) return NextResponse.json({ ok: false, reason: 'config' })
  const r = await sendToUser(adminClient(), userId, { kind: 'test', title: 'DaiwaPlace 🌙', body: '¡Funciona! Así te van a llegar los avisos y los mensajes.', url: '/notificaciones', tag: 'prueba' })
  return NextResponse.json({ ok: r.sent > 0, ...r, reason: r.devices === 0 ? 'sin-dispositivos' : r.sent === 0 ? 'no-llego' : undefined })
}
