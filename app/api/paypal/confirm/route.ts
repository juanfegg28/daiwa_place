import { NextResponse } from 'next/server'
import { getUserIdFromRequest, tooManyRequests } from '../../music/_shared'
import { adminClient, getSubscription, paidUntil, planTier } from '../../../lib/paypalServer'

// El navegador avisa «ya aprobé la suscripción». NO se le cree: el servidor le pregunta a PayPal directamente
// (estado, plan, precio y de quién es) y solo entonces activa la membresía. Si PayPal aún no la marca ACTIVA,
// el webhook la activará apenas se complete el primer cobro.
export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Inicia sesión primero.' }, { status: 401 })
  if (tooManyRequests(userId, 8, 60_000)) return NextResponse.json({ ok: false, error: 'Vas muy rápido. Espera un momento.' }, { status: 429 })

  const body = (await request.json().catch(() => ({}))) as { subscriptionId?: string }
  const subId = (body.subscriptionId ?? '').trim()
  if (!/^I-[A-Z0-9]{6,40}$/.test(subId)) return NextResponse.json({ ok: false, error: 'Suscripción no válida.' }, { status: 400 })

  try {
    const sub = await getSubscription(subId)
    if (!sub) return NextResponse.json({ ok: false, error: 'PayPal no encontró esa suscripción.' }, { status: 404 })
    if (sub.custom_id !== userId) return NextResponse.json({ ok: false, error: 'Esa suscripción no pertenece a tu cuenta.' }, { status: 403 })
    const tier = await planTier(sub.plan_id)
    if (!tier) return NextResponse.json({ ok: false, error: 'Ese plan no es de DaiwaPlace.' }, { status: 400 })
    if (sub.status !== 'ACTIVE') {
      // APPROVED / APPROVAL_PENDING: PayPal todavía está procesando el primer cobro
      return NextResponse.json({ ok: true, status: 'pending' })
    }
    const { data, error } = await adminClient().rpc('supporter_server_activate', {
      p_user: userId, p_tier: tier, p_sub: sub.id, p_plan: sub.plan_id, p_paypal_status: sub.status,
      p_paid_until: paidUntil(sub), p_last_payment_at: sub.billing_info?.last_payment?.time ?? null,
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, status: 'active', tier, first_bonus: (data as { first_bonus?: boolean } | null)?.first_bonus ?? false })
  } catch {
    // El pago, si ocurrió, lo recoge el webhook. Nunca se activa nada a ciegas.
    return NextResponse.json({ ok: false, error: 'No pudimos confirmarlo ahora. Si PayPal ya te cobró, tu membresía se activará sola en unos minutos.' }, { status: 502 })
  }
}
