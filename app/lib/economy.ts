// Lunas ☾, misiones y códigos (v1.3.0). El servidor decide todo: aquí solo se pide y se muestra.
import { supabase } from './supabaseClient'

export type WalletSummary = {
  balance: number
  currency: string
  claimable: number
  founder_available: boolean
  streak: number
  multiplier: number
}

export type Mission = {
  id: string
  template_id: string
  period: 'daily' | 'weekly' | 'onboarding' | 'achievement' | 'event'
  difficulty: 'easy' | 'medium' | 'hard' | 'challenge' | null
  category: 'social' | 'creacion' | 'descubrimiento' | 'comunidad' | 'personalizacion'
  text: string
  target: number
  progress: number
  reward: number
  claimed: boolean
  claimable: boolean
  rerolled: boolean
  go_href: string | null
}

export type DayMissions = {
  period_key: string
  ends_at: string
  server_now: string
  missions: Mission[]
  rerolls_free_left: number
  reroll_cost: number
  bonus_amount: number
  bonus_paid: boolean
  multiplier: number
}

export type WeekMissions = {
  period_key: string
  ends_at: string
  server_now: string
  missions: Mission[]
  chest_amount: number
  chest_ready: boolean
  chest_paid: boolean
  multiplier: number
}

export type StreakState = {
  current: number
  best: number
  cycle_day: number
  today_done: boolean | null
  milestones: { day: number; amount: number; reached: boolean; claimed: boolean }[]
}

export type LedgerRow = {
  id: number
  delta: number
  balance_after: number
  reason: string
  ref_type: string | null
  ref_id: string | null
  created_at: string
}

/** Formato: 1 250 ☾ */
export function formatLunas(n: number): string {
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')}\u00A0☾`
}

export function formatNumber(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
}

export const REASON_LABELS: Record<string, string> = {
  welcome: 'Bienvenida a DaiwaPlace',
  founder: 'Pack Fundador',
  mission_claim: 'Misión completada',
  daily_bonus: 'Bono: las 3 misiones del día',
  chest: 'Cofre semanal',
  streak: 'Premio de racha',
  achievement: 'Logro',
  code: 'Código canjeado',
  admin_adjust: 'Ajuste del equipo',
  mission_reroll: 'Cambio de misión',
  shop_buy: 'Compra en la tienda',
  event: 'Evento',
}

export const CATEGORY_LABELS: Record<Mission['category'], string> = {
  social: 'Social',
  creacion: 'Creación',
  descubrimiento: 'Descubrimiento',
  comunidad: 'Comunidad',
  personalizacion: 'Personalización',
}

/** Lunas que de verdad se pagan al reclamar: las diarias/semanales/de evento se multiplican con los eventos de «Lunas x2/x3». */
export function effectiveReward(m: Pick<Mission, 'reward' | 'period'>, multiplier: number | undefined): number {
  const x = m.period === 'daily' || m.period === 'weekly' || m.period === 'event' ? multiplier ?? 1 : 1
  return Math.round(m.reward * x)
}

export const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Fácil', medium: 'Media', hard: 'Difícil', challenge: 'Desafío' }

// ───────── Caché del resumen (se comparte entre páginas para no pedirlo en cada navegación) ─────────
let cached: { at: number; value: WalletSummary | null } | null = null
let lastTouch = 0
const listeners = new Set<(w: WalletSummary | null) => void>()

export function subscribeWallet(fn: (w: WalletSummary | null) => void): () => void {
  listeners.add(fn)
  if (cached) fn(cached.value)
  return () => {
    listeners.delete(fn)
  }
}

function publish(value: WalletSummary | null) {
  cached = { at: Date.now(), value }
  listeners.forEach((l) => l(value))
}

/** Lee el resumen. `touch` marca el día de entrada (racha) y asigna misiones; se limita a una vez cada 5 minutos. */
export async function refreshWallet(force = false): Promise<WalletSummary | null> {
  const now = Date.now()
  if (!force && cached && now - cached.at < 20000) return cached.value
  const doTouch = now - lastTouch > 5 * 60 * 1000
  if (doTouch) lastTouch = now
  const { data, error } = doTouch ? await supabase.rpc('economy_touch') : await supabase.rpc('wallet_summary')
  if (error || !data) {
    // Si falta el SQL de la v1.3.0, el chip simplemente no aparece
    publish(null)
    return null
  }
  publish(data as WalletSummary)
  return data as WalletSummary
}

export function clearWalletCache() {
  cached = null
  lastTouch = 0
}

/** Cuenta atrás: «5 h 12 min» */
export function countdown(endsAt: string, serverNow?: string, clientStart?: number): string {
  const skew = serverNow ? new Date(serverNow).getTime() - (clientStart ?? Date.now()) : 0
  const ms = new Date(endsAt).getTime() - (Date.now() + skew)
  if (ms <= 0) return 'Se renueva ahora'
  const mins = Math.floor(ms / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d} d ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}
