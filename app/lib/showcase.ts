// v1.9.0 · Vitrina personal del perfil. Quién la puede ver y qué cabe lo decide Supabase (showcase_get / showcase_save).
import { supabase } from './supabaseClient'

export type ShowcasePostPreview = { id: string; content: string; created_at: string; image?: { url?: string; w?: number; h?: number } | null }
export type ShowcaseItem =
  | { id: string; type: 'post'; post_id: string; post?: ShowcasePostPreview }
  | { id: string; type: 'quote'; text: string; by?: string }
  | { id: string; type: 'song'; track: unknown; note?: string }
  | { id: string; type: 'memory'; title: string; text?: string; date?: string }
export type Showcase = { enabled: boolean; title: string | null; items: ShowcaseItem[]; limit: number | null }

export const SHOWCASE_DEFAULT_TITLE = 'Vitrina'
export const newItemId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `i${Date.now()}${Math.random().toString(36).slice(2, 8)}`)

const cache = new Map<string, { at: number; data: Showcase | null }>()
const TTL = 2 * 60_000

export async function getShowcase(profileId: string, force = false): Promise<Showcase | null> {
  const hit = cache.get(profileId)
  if (!force && hit && Date.now() - hit.at < TTL) return hit.data
  const { data, error } = await supabase.rpc('showcase_get', { p_user: profileId })
  if (error) return hit?.data ?? null
  const d = (data as Showcase | null) ?? null
  const clean = d ? { enabled: !!d.enabled, title: d.title ?? null, items: Array.isArray(d.items) ? d.items : [], limit: d.limit ?? null } : null
  cache.set(profileId, { at: Date.now(), data: clean })
  return clean
}

export async function saveShowcase(enabled: boolean, title: string, items: ShowcaseItem[], myId: string): Promise<{ showcase: Showcase | null; error: string }> {
  // solo viaja lo mínimo: el servidor vuelve a validar todo y arma la vista previa de las publicaciones
  const payload = items.map((it) => {
    if (it.type === 'post') return { id: it.id, type: 'post', post_id: it.post_id }
    if (it.type === 'quote') return { id: it.id, type: 'quote', text: it.text, by: it.by || null }
    if (it.type === 'song') return { id: it.id, type: 'song', track: it.track, note: it.note || null }
    return { id: it.id, type: 'memory', title: it.title, text: it.text || null, date: it.date || null }
  })
  const { data, error } = await supabase.rpc('showcase_save', { p_enabled: enabled, p_title: title.trim() || null, p_items: payload })
  cache.delete(myId)
  if (error) return { showcase: null, error: error.message }
  const d = data as Showcase | null
  return { showcase: d ? { enabled: !!d.enabled, title: d.title ?? null, items: d.items ?? [], limit: d.limit ?? null } : null, error: '' }
}
