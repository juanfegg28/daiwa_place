// v1.8.0 · Ventajas de tu cuenta (las decide Supabase con my_perks(); aquí solo se piden y se recuerdan 10 min).
import { supabase } from './supabaseClient'

export type MyPerks = {
  tier: 'creciente' | 'llena' | 'eclipse' | null
  rank: number
  /** cuántas cuentas puedes guardar para el cambio rápido (2 para todos; sin límite para @renshsh) */
  account_cap: number
  /** Lunas extra (%) en cada misión completada y en el cofre semanal */
  mission_bonus_pct: number
  /** tamaño máximo de un banner GIF, en MB */
  gif_mb: number
  /** multiplicador del bono diario de entrada */
  daily_mult: number
  /** cada cuántos días se recarga tu escudo de racha */
  shield_days: number
}

export const FREE_PERKS: MyPerks = { tier: null, rank: 0, account_cap: 2, mission_bonus_pct: 0, gif_mb: 6, daily_mult: 1, shield_days: 30 }

let cache: { at: number; value: MyPerks } | null = null
let inflight: Promise<MyPerks> | null = null

export function clearPerksCache() {
  cache = null
}

export async function fetchMyPerks(): Promise<MyPerks> {
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache.value
  if (inflight) return inflight
  inflight = (async () => {
    const { data, error } = await supabase.rpc('my_perks')
    const value = !error && data ? ({ ...FREE_PERKS, ...(data as Partial<MyPerks>) } as MyPerks) : FREE_PERKS
    cache = { at: Date.now(), value }
    inflight = null
    return value
  })()
  return inflight
}
