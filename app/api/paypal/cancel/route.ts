import { NextResponse } from 'next/server'
import { getUserIdFromRequest, tooManyRequests } from '../../music/_shared'
import { adminClient, cancelPaypalSubscription } from '../../../lib/paypalServer'

// Cancela la suscripción de PayPal de la persona. Conserva lo ya pagado hasta que termine el mes.
export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Inicia sesión primero.' }, { status: 401 })
  if (tooManyRequests(userId, 4, 60_000)) return NextResponse.json({ ok: false, error: 'Vas muy rápido. Espera un momento.' }, { status: 429 })
  try {
    const admin = adminClient()
    const { data: subId } = await admin.rpc('supporter_server_current_sub', { p_user: userId })
    if (!subId || typeof subId !== 'string') return NextResponse.json({ ok: false, error: 'No tienes una suscripción de PayPal activa.' }, { status: 404 })
    const done = await cancelPaypalSubscription(subId, 'Cancelada por la persona desde DaiwaPlace')
    if (!done) return NextResponse.json({ ok: false, error: 'PayPal no pudo cancelarla. Puedes cancelarla desde tu cuenta de PayPal → Pagos automáticos.' }, { status: 502 })
    await admin.rpc('supporter_server_status', { p_sub: subId, p_paypal_status: 'CANCELLED', p_kind: 'cancelled' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cancelar ahora. Puedes hacerlo desde tu cuenta de PayPal → Pagos automáticos.' }, { status: 502 })
  }
}
