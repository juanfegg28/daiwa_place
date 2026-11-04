// v1.7.0 · Círculo Lunar (membresías Supporter): configuración compartida y funciones del navegador.
// Los precios y ventajas REALES viven en la tabla supporter_tiers (Supabase); esto es solo lo que se muestra.
import { useEffect, useReducer } from 'react'
import { supabase } from './supabaseClient'

export type TierKey = 'creciente' | 'llena' | 'eclipse'
export const TIER_KEYS: TierKey[] = ['creciente', 'llena', 'eclipse']

/** PayPal.Me: solo como alternativa MANUAL (revisión de un admin). Nunca activa nada solo. */
export const PAYPAL_ME_BASE = 'https://paypal.me/juanfe280206'
export const DISCORD_CONTACT = '@juanfegg28'
export const paypalMeUrl = (usd: number) => `${PAYPAL_ME_BASE}/${usd}USD`

export type PerkLine = { label: string; text: string; soon?: boolean }
export type TierInfo = {
  key: TierKey
  rank: number
  name: string
  short: string
  priceUsd: number
  weeklyLunas: number
  stories: number
  discountPct: number
  accent: string // color principal
  glow: string // brillo
  tagline: string
  includes?: string
  perks: PerkLine[]
}

export const TIERS: Record<TierKey, TierInfo> = {
  creciente: {
    key: 'creciente', rank: 1, name: 'Luna Creciente', short: 'Creciente', priceUsd: 1, weeklyLunas: 500, stories: 4, discountPct: 5,
    accent: '#A78BFA', glow: 'rgba(167,139,250,.45)',
    tagline: 'El primer paso para sostener DaiwaPlace.',
    perks: [
      { label: 'Lunas', text: '500 Lunas cada semana' },
      { label: 'Insignia', text: 'Insignia de Supporter junto a tu nombre' },
      { label: 'Historias', text: 'Hasta 4 historias cada 24 horas' },
      { label: 'Tienda', text: '5 % de descuento en la tienda' },
      { label: 'Extra', text: 'Decoración Halo Naciente', soon: true },
      { label: 'Título', text: '«Bajo la Luna»', soon: true },
    ],
  },
  llena: {
    key: 'llena', rank: 2, name: 'Luna Llena', short: 'Llena', priceUsd: 2, weeklyLunas: 1000, stories: 5, discountPct: 10,
    accent: '#E2E8F0', glow: 'rgba(226,232,240,.4)',
    tagline: 'Más brillo para ti y para el proyecto.',
    includes: 'Incluye todo lo de Luna Creciente y suma:',
    perks: [
      { label: 'Lunas', text: '1.000 Lunas cada semana' },
      { label: 'Historias', text: 'Hasta 5 historias cada 24 horas' },
      { label: 'Tienda', text: '10 % de descuento en la tienda' },
      { label: 'Extra', text: 'Decoración Órbita de Plata', soon: true },
      { label: 'Tarjeta', text: 'Tarjeta de perfil Marea de Plata', soon: true },
      { label: 'Título', text: '«Heredero de Selene»', soon: true },
    ],
  },
  eclipse: {
    key: 'eclipse', rank: 3, name: 'Eclipse', short: 'Eclipse', priceUsd: 5, weeklyLunas: 2500, stories: 7, discountPct: 15,
    accent: '#F59E0B', glow: 'rgba(245,158,11,.5)',
    tagline: 'El máximo apoyo. Beneficios exclusivos que llegarán pronto.',
    includes: 'Incluye todo lo de los niveles anteriores y suma:',
    perks: [
      { label: 'Lunas', text: '2.500 Lunas cada semana' },
      { label: 'Historias', text: 'Hasta 7 historias cada 24 horas' },
      { label: 'Tienda', text: '15 % de descuento en la tienda' },
      { label: 'Extra', text: 'Decoración animada Corona de Totalidad', soon: true },
      { label: 'Tarjeta', text: 'Tarjeta de perfil Umbra', soon: true },
      { label: 'Entrada', text: 'Efecto de entrada Eclipse Total', soon: true },
      { label: 'Nombre', text: 'Efecto especial para tu nombre', soon: true },
      { label: 'Título', text: '«Testigo de la Totalidad»', soon: true },
    ],
  },
}

export const tierName = (k: string | null | undefined): string => (k && k in TIERS ? TIERS[k as TierKey].name : '')

// ---------- datos que devuelve supporter_me() ----------
export type SupporterMe = {
  tiers: { tier: TierKey; rank: number; name: string; price_usd: number; weekly_lunas: number; story_limit: number; shop_discount_pct: number }[]
  membership: null | {
    tier: TierKey
    status: 'active' | 'cancelled' | 'past_due' | 'expired' | 'suspended'
    source: 'paypal' | 'manual' | 'admin'
    active: boolean
    paid_until: string
    started_at: string
    hide_badge: boolean
    has_subscription: boolean
  }
  week_start: string
  weekly_granted_now: boolean
  weekly_granted: boolean
  payments: { tier: TierKey; amount: number; currency: string; source: string; status: string; paid_at: string }[]
  requests: { id: string; tier: TierKey; status: 'pending' | 'approved' | 'rejected'; created_at: string; review_note: string | null }[]
  perks: { code: string; kind: string; name: string; min_tier: TierKey; available: boolean; claimed: boolean; unlocked: boolean }[]
}

function friendly(message: string | undefined | null): string {
  if (!message) return 'Algo salió mal. Inténtalo de nuevo.'
  if (/Failed to fetch|NetworkError|network/i.test(message)) return 'Parece que no hay internet. Inténtalo de nuevo.'
  if (/Could not find the function|does not exist|schema cache/i.test(message)) return 'Falta correr el SQL de la v1.7.0 en Supabase.'
  return message
}

export async function fetchSupporterMe(): Promise<{ data: SupporterMe | null; error: string | null }> {
  const { data, error } = await supabase.rpc('supporter_me')
  if (error) return { data: null, error: friendly(error.message) }
  return { data: data as SupporterMe, error: null }
}

export async function setHideBadge(hide: boolean): Promise<string | null> {
  const { error } = await supabase.rpc('supporter_set_hide_badge', { p_hide: hide })
  if (!error) clearSupporterCache()
  return error ? friendly(error.message) : null
}

export async function submitManualRequest(tier: TierKey, reference: string, note: string, months = 1): Promise<string | null> {
  const { error } = await supabase.rpc('supporter_manual_submit', { p_tier: tier, p_reference: reference, p_note: note || null, p_months: months })
  return error ? friendly(error.message) : null
}

export async function claimPerk(code: string): Promise<string | null> {
  const { error } = await supabase.rpc('supporter_claim_perk', { p_code: code })
  return error ? friendly(error.message) : null
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type PaypalConfig = { mode: 'auto' | 'manual'; clientId: string; env: 'live' | 'sandbox'; plans: Partial<Record<TierKey, string>> }

let cfgCache: { at: number; value: PaypalConfig } | null = null
export async function fetchPaypalConfig(): Promise<PaypalConfig> {
  if (cfgCache && Date.now() - cfgCache.at < 5 * 60 * 1000) return cfgCache.value
  try {
    const res = await fetch('/api/paypal/config')
    const json = (await res.json()) as PaypalConfig
    cfgCache = { at: Date.now(), value: json }
    return json
  } catch {
    return { mode: 'manual', clientId: '', env: 'live', plans: {} }
  }
}

export async function confirmSubscription(subscriptionId: string): Promise<{ ok: boolean; status?: string; message?: string }> {
  try {
    const res = await fetch('/api/paypal/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify({ subscriptionId }) })
    const json = (await res.json()) as { ok?: boolean; status?: string; error?: string }
    clearSupporterCache()
    return { ok: !!json.ok, status: json.status, message: json.error }
  } catch {
    return { ok: false, message: 'No se pudo confirmar. Si PayPal ya te cobró, tu membresía se activará sola en unos minutos.' }
  }
}

export async function cancelSubscription(): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/paypal/cancel', { method: 'POST', headers: await authHeader() })
    const json = (await res.json()) as { ok?: boolean; error?: string }
    return { ok: !!json.ok, message: json.error }
  } catch {
    return { ok: false, message: 'No se pudo cancelar. Inténtalo de nuevo.' }
  }
}

// ---------- insignia: se piden de a muchas personas en UNA sola consulta y se recuerdan 10 minutos ----------
const TTL = 10 * 60 * 1000
const cache = new Map<string, { tier: TierKey | null; at: number }>()
const waiters = new Map<string, Set<() => void>>()
let queue = new Set<string>()
let timer: ReturnType<typeof setTimeout> | null = null

export function clearSupporterCache() {
  cache.clear()
}

function schedule() {
  if (timer || queue.size === 0) return
  timer = setTimeout(flush, 60)
}

function flush() {
  timer = null
  const ids = [...queue].slice(0, 120)
  queue = new Set([...queue].slice(120))
  if (ids.length === 0) return
  void supabase.rpc('supporter_tiers_of', { p_ids: ids }).then(({ data, error }) => {
    const found = new Map<string, TierKey>()
    if (!error) for (const r of (data as { user_id: string; tier: TierKey }[] | null) ?? []) found.set(r.user_id, r.tier)
    const at = Date.now()
    for (const id of ids) {
      cache.set(id, { tier: found.get(id) ?? null, at })
      waiters.get(id)?.forEach((fn) => fn())
    }
  })
  schedule()
}

/** Nivel Supporter visible de una persona (null si no tiene o si ocultó su insignia). */
export function useSupporterTier(userId: string | null | undefined): TierKey | null {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!userId) return
    const hit = cache.get(userId)
    let set = waiters.get(userId)
    if (!set) waiters.set(userId, (set = new Set()))
    set.add(bump)
    if (!hit || Date.now() - hit.at > TTL) {
      queue.add(userId)
      schedule()
    }
    return () => {
      set.delete(bump)
    }
  }, [userId])
  if (!userId) return null
  return cache.get(userId)?.tier ?? null
}
