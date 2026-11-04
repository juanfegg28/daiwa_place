// v1.7.0 · PayPal (lado servidor). Solo lo usan las rutas /api/paypal/*.
// Las llaves secretas viven SOLO en las variables de entorno de Vercel; nunca llegan al navegador.
import { createClient } from '@supabase/supabase-js'

export type TierKey = 'creciente' | 'llena' | 'eclipse'
const PRICE_TO_TIER: Record<string, TierKey> = { '1.00': 'creciente', '2.00': 'llena', '5.00': 'eclipse' }

export const PAYPAL_ENV: 'live' | 'sandbox' = process.env.PAYPAL_ENV === 'sandbox' ? 'sandbox' : 'live'
const BASE = PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'

// El Client ID es PÚBLICO por diseño (PayPal lo muestra en el botón). El secreto NO.
const DEFAULT_CLIENT_ID = 'BAAeVWJlIDbZZElV42MZWHt7hPMusQE8Uo6iRfeedFrsCV50Onm4uR4I_VDwB9WS2iHBBYZLQqSwmNOaII'
const DEFAULT_PLAN_IDS = 'P-12M44345KA179801XNLVJBMA,P-5S82278884936931KNLVJFOI,P-2WE95953LC4454440NLVJGBQ'

export const publicClientId = () => process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || DEFAULT_CLIENT_ID
export const serverClientId = () => process.env.PAYPAL_CLIENT_ID || publicClientId()
export const hasSecret = () => !!process.env.PAYPAL_CLIENT_SECRET
export const candidatePlanIds = (): string[] =>
  (process.env.PAYPAL_PLAN_IDS || DEFAULT_PLAN_IDS).split(',').map((s) => s.trim()).filter(Boolean)

export function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

let tokenCache: { token: string; exp: number } | null = null
async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token
  const basic = Buffer.from(`${serverClientId()}:${process.env.PAYPAL_CLIENT_SECRET ?? ''}`).toString('base64')
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal no aceptó las credenciales (${res.status}). Revisa PAYPAL_CLIENT_SECRET, PAYPAL_CLIENT_ID y PAYPAL_ENV.`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

async function pp(path: string, init: RequestInit = {}) {
  const token = await accessToken()
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  })
}

// ---------- planes: el nivel se deduce del PRECIO REAL que PayPal tiene en el plan (no del orden ni de un nombre) ----------
export type PlanInfo = { planId: string; tier: TierKey | null; status: string; price: string; currency: string; interval: string }

async function fetchPlan(planId: string): Promise<PlanInfo | null> {
  const res = await pp(`/v1/billing/plans/${encodeURIComponent(planId)}`)
  if (!res.ok) return null
  const j = (await res.json()) as {
    status?: string
    billing_cycles?: { tenure_type?: string; frequency?: { interval_unit?: string; interval_count?: number }; pricing_scheme?: { fixed_price?: { value?: string; currency_code?: string } } }[]
  }
  const cyc = (j.billing_cycles ?? []).find((c) => c.tenure_type === 'REGULAR')
  const value = Number.parseFloat(cyc?.pricing_scheme?.fixed_price?.value ?? '0').toFixed(2)
  const currency = cyc?.pricing_scheme?.fixed_price?.currency_code ?? ''
  const monthly = cyc?.frequency?.interval_unit === 'MONTH' && (cyc?.frequency?.interval_count ?? 1) === 1
  const ok = j.status === 'ACTIVE' && currency === 'USD' && monthly
  return { planId, tier: ok ? PRICE_TO_TIER[value] ?? null : null, status: j.status ?? '?', price: value, currency, interval: `${cyc?.frequency?.interval_count ?? '?'} ${cyc?.frequency?.interval_unit ?? '?'}` }
}

let planCache: { at: number; plans: PlanInfo[] } | null = null
export async function loadPlans(force = false): Promise<PlanInfo[]> {
  if (!force && planCache && Date.now() - planCache.at < 10 * 60_000) return planCache.plans
  const out: PlanInfo[] = []
  for (const id of candidatePlanIds()) {
    const p = await fetchPlan(id).catch(() => null)
    if (p) out.push(p)
  }
  planCache = { at: Date.now(), plans: out }
  return out
}
export async function planTier(planId: string): Promise<TierKey | null> {
  const plans = await loadPlans()
  return plans.find((p) => p.planId === planId)?.tier ?? null
}

// ---------- suscripciones ----------
export type PaypalSub = {
  id: string
  status: string
  plan_id: string
  custom_id?: string
  billing_info?: { next_billing_time?: string; last_payment?: { time?: string; amount?: { value?: string; currency_code?: string } } }
}
export async function getSubscription(id: string): Promise<PaypalSub | null> {
  const res = await pp(`/v1/billing/subscriptions/${encodeURIComponent(id)}`)
  if (!res.ok) return null
  return (await res.json()) as PaypalSub
}
export async function cancelPaypalSubscription(id: string, reason: string): Promise<boolean> {
  const res = await pp(`/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: JSON.stringify({ reason: reason.slice(0, 120) }) })
  return res.ok || res.status === 422 // 422 = ya estaba cancelada
}

/** Hasta cuándo está cubierta la mensualidad: lo que diga PayPal (próximo cobro) + 1 día de margen por reintentos. */
export function paidUntil(sub: PaypalSub, fallbackFrom?: string): string {
  const next = sub.billing_info?.next_billing_time ? Date.parse(sub.billing_info.next_billing_time) : NaN
  const last = Date.parse(sub.billing_info?.last_payment?.time ?? fallbackFrom ?? '')
  const lastPlus = Number.isFinite(last) ? last + 32 * 86400_000 : NaN
  const base = Number.isFinite(next) && (!Number.isFinite(last) || next > last) ? next + 86400_000 : lastPlus
  return new Date(Number.isFinite(base) ? base : Date.now() + 32 * 86400_000).toISOString()
}

// ---------- firma del webhook ----------
export async function verifyWebhook(headers: Headers, event: unknown): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return false
  const body = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: event,
  }
  if (!body.auth_algo || !body.cert_url || !body.transmission_id || !body.transmission_sig || !body.transmission_time) return false
  const res = await pp('/v1/notifications/verify-webhook-signature', { method: 'POST', body: JSON.stringify(body) })
  if (!res.ok) return false
  const j = (await res.json()) as { verification_status?: string }
  return j.verification_status === 'SUCCESS'
}
