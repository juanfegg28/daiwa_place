import { NextResponse } from 'next/server'
import { adminClient, getSubscription, paidUntil, planTier, verifyWebhook } from '../../../lib/paypalServer'

export const dynamic = 'force-dynamic'

type PaypalEvent = {
  id: string
  event_type: string
  resource?: {
    id?: string
    billing_agreement_id?: string
    sale_id?: string
    create_time?: string
    amount?: { total?: string; value?: string; currency?: string; currency_code?: string }
  }
}

// Endpoint que PayPal llama solo (webhook). TODO se verifica con la firma de PayPal antes de tocar nada,
// y cada aviso se procesa una sola vez (paypal_events.event_id es único).
export async function POST(request: Request) {
  const raw = await request.text()
  let event: PaypalEvent
  try {
    event = JSON.parse(raw) as PaypalEvent
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!event?.id || !event?.event_type) return NextResponse.json({ ok: false }, { status: 400 })
  if (!(await verifyWebhook(request.headers, event).catch(() => false))) {
    return NextResponse.json({ ok: false, error: 'firma no válida' }, { status: 400 })
  }

  const db = adminClient()
  const res = event.resource ?? {}
  const type = event.event_type
  const subId = type.startsWith('PAYMENT.SALE.') ? res.billing_agreement_id ?? '' : res.id ?? ''
  const { data: fresh, error: beginErr } = await db.rpc('paypal_event_begin', { p_event_id: event.id, p_type: type, p_resource: res.id ?? subId ?? null })
  if (beginErr) return NextResponse.json({ ok: false }, { status: 500 })   // PayPal reintenta
  if (!fresh) return NextResponse.json({ ok: true, duplicate: true })

  try {
    let result = 'ignorado'

    if (type === 'BILLING.SUBSCRIPTION.ACTIVATED' || type === 'BILLING.SUBSCRIPTION.RE-ACTIVATED' || type === 'PAYMENT.SALE.COMPLETED') {
      if (!subId) throw new Error('falta la suscripción')
      const sub = await getSubscription(subId)
      if (!sub) throw new Error('suscripción no encontrada')
      const { data: owner } = await db.rpc('supporter_server_sub_owner', { p_sub: subId })
      const userId = sub.custom_id || (Array.isArray(owner) ? owner[0]?.user_id : undefined)
      const tier = await planTier(sub.plan_id)
      if (!userId || !tier) {
        result = 'sin dueño o plan desconocido'      // p. ej. una suscripción que no es de DaiwaPlace
      } else if (sub.status === 'APPROVAL_PENDING' || sub.status === 'APPROVED') {
        throw new Error('PayPal todavía está procesando la suscripción')   // se reintenta solo
      } else if (sub.status !== 'ACTIVE') {
        result = `suscripción ${sub.status}`
      } else {
        const until = paidUntil(sub, res.create_time)
        const { error } = await db.rpc('supporter_server_activate', {
          p_user: userId, p_tier: tier, p_sub: sub.id, p_plan: sub.plan_id, p_paypal_status: sub.status,
          p_paid_until: until, p_last_payment_at: res.create_time ?? sub.billing_info?.last_payment?.time ?? null,
        })
        if (error) throw new Error(error.message)
        if (type === 'PAYMENT.SALE.COMPLETED' && res.id) {
          const amount = Number.parseFloat(res.amount?.total ?? res.amount?.value ?? '0') || 0
          await db.rpc('supporter_server_payment', {
            p_user: userId, p_sub: sub.id, p_tx: res.id, p_amount: amount,
            p_currency: res.amount?.currency ?? res.amount?.currency_code ?? 'USD', p_paid_at: res.create_time ?? null, p_tier: tier,
          })
        }
        result = 'membresía activada/renovada'
      }
    } else if (type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      await db.rpc('supporter_server_status', { p_sub: subId, p_paypal_status: 'CANCELLED', p_kind: 'cancelled' })
      result = 'cancelada (conserva lo pagado)'
    } else if (type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      await db.rpc('supporter_server_status', { p_sub: subId, p_paypal_status: 'SUSPENDED', p_kind: 'suspended' })
      result = 'suspendida'
    } else if (type === 'BILLING.SUBSCRIPTION.EXPIRED') {
      await db.rpc('supporter_server_status', { p_sub: subId, p_paypal_status: 'EXPIRED', p_kind: 'expired' })
      result = 'vencida'
    } else if (type === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      await db.rpc('supporter_server_status', { p_sub: subId, p_paypal_status: 'ACTIVE', p_kind: 'past_due' })
      result = 'pago fallido (conserva lo pagado)'
    } else if (type === 'PAYMENT.SALE.REFUNDED' || type === 'PAYMENT.SALE.REVERSED') {
      const tx = type === 'PAYMENT.SALE.REFUNDED' ? res.sale_id : res.id
      if (tx) await db.rpc('supporter_server_reverse', { p_tx: tx, p_kind: type === 'PAYMENT.SALE.REFUNDED' ? 'refunded' : 'reversed' })
      result = 'reembolso/reversión aplicado'
    }

    await db.rpc('paypal_event_done', { p_event_id: event.id, p_result: result })
    return NextResponse.json({ ok: true })
  } catch {
    // No se marca como procesado: PayPal vuelve a intentarlo y el aviso se reprocesa.
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
