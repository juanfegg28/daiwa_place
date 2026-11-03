// v1.6.2 · Sugerencias de seguimiento del Inicio.
import { supabase } from './supabaseClient'

export type Suggestion = {
  user_id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  reason: 'friends' | 'follows_you' | 'club' | 'new'
  via_names: string[]
  via_count: number
}

const HIDE_KEY = 'daiwa_sugg_hidden_until'
const SKIP_KEY = 'daiwa_sugg_skipped'
/** Si cierras la sección completa, no vuelve a salir en 1 día */
const HIDE_MS = 24 * 60 * 60 * 1000

function ls(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function suggestionsHidden(): boolean {
  const v = Number(ls()?.getItem(HIDE_KEY) ?? 0)
  return v > Date.now()
}
export function hideSuggestionsForADay() {
  ls()?.setItem(HIDE_KEY, String(Date.now() + HIDE_MS))
}

/** Personas que descartaste con la ✕ (se recuerdan 14 días) */
export function skippedIds(): Set<string> {
  try {
    const raw = JSON.parse(ls()?.getItem(SKIP_KEY) ?? '{}') as Record<string, number>
    const now = Date.now()
    return new Set(Object.entries(raw).filter(([, t]) => now - t < 14 * 24 * 60 * 60 * 1000).map(([id]) => id))
  } catch {
    return new Set()
  }
}
export function skipSuggestion(id: string) {
  try {
    const raw = JSON.parse(ls()?.getItem(SKIP_KEY) ?? '{}') as Record<string, number>
    raw[id] = Date.now()
    const entries = Object.entries(raw).sort((a, b) => b[1] - a[1]).slice(0, 80)
    ls()?.setItem(SKIP_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export async function fetchSuggestions(limit = 12): Promise<Suggestion[]> {
  const { data, error } = await supabase.rpc('follow_suggestions', { p_limit: limit })
  if (error) return []
  return ((data as Suggestion[] | null) ?? []).map((r) => ({ ...r, via_names: r.via_names ?? [], via_count: Number(r.via_count) || 0 }))
}

export function reasonText(s: Suggestion): string {
  if (s.reason === 'friends') {
    const [a, b] = s.via_names
    if (!a) return 'La siguen tus amigos'
    if (s.via_count > 2) return `Seguida por ${a}, ${b} y ${s.via_count - 2} más`
    if (s.via_count === 2 && b) return `Seguida por ${a} y ${b}`
    return `Seguida por ${a}`
  }
  if (s.reason === 'follows_you') return 'Te sigue'
  if (s.reason === 'club') return 'Está en tus clubes'
  return 'Nueva en DaiwaPlace'
}
