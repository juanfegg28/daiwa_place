// v1.6.2 · Estado (tipo «mood» de SpaceHey): una frase corta + emoji que se ve en tu perfil y, cuando es nuevo, en el Inicio.
import { supabase } from './supabaseClient'

export const STATUS_MAX = 60
/** Cuántos días un estado nuevo sigue apareciendo como tarjetita en el Inicio (el del perfil dura hasta que lo cambies) */
export const STATUS_FEED_DAYS = 3

export type StatusRow = {
  user_id: string
  emoji: string | null
  text: string
  updated_at: string
  like_count: number
  liked_by_me: boolean
}

export type FeedStatus = StatusRow & {
  username: string
  id_student: string | null
  avatar_url: string | null
}

/** Ideas rápidas para no empezar en blanco (se pueden editar) */
export const MOOD_PRESETS: { emoji: string; text: string }[] = [
  { emoji: '🥬', text: 'Vegetal' },
  { emoji: '😴', text: 'Con sueño' },
  { emoji: '🤪', text: 'Sicosiao' },
  { emoji: '😊', text: 'Feliz' },
  { emoji: '🥲', text: 'Sentimental' },
  { emoji: '📚', text: 'Estudiando' },
  { emoji: '🎧', text: 'Escuchando música' },
  { emoji: '🔥', text: 'Con toda' },
  { emoji: '🫠', text: 'Derretida' },
  { emoji: '😎', text: 'Tranqui' },
  { emoji: '🥰', text: 'Enamorada' },
  { emoji: '💀', text: 'Muerta de sueño' },
]

function friendly(message: string | undefined | null): string {
  if (!message) return 'No se pudo guardar el estado.'
  if (/Failed to fetch|NetworkError|network/i.test(message)) return 'Parece que no hay internet. Inténtalo de nuevo.'
  if (/Could not find the function|does not exist|schema cache/i.test(message)) return 'Falta correr el SQL de la v1.6.2 en Supabase.'
  return message
}

export async function fetchStatus(userId: string): Promise<StatusRow | null> {
  const { data, error } = await supabase.rpc('status_get', { p_user: userId })
  if (error || !data) return null
  return data as StatusRow
}

export async function fetchFeedStatuses(limit = 20): Promise<FeedStatus[]> {
  const { data, error } = await supabase.rpc('status_feed', { p_limit: limit, p_days: STATUS_FEED_DAYS })
  if (error) return []
  return ((data as FeedStatus[] | null) ?? []).map((r) => ({ ...r, like_count: Number(r.like_count) || 0 }))
}

export async function setMyStatus(emoji: string, text: string): Promise<{ status: StatusRow | null; error: string | null }> {
  const { data, error } = await supabase.rpc('status_set', { p_emoji: emoji.trim() || null, p_text: text })
  if (error) return { status: null, error: friendly(error.message) }
  return { status: data as StatusRow, error: null }
}

export async function clearMyStatus(): Promise<string | null> {
  const { error } = await supabase.rpc('status_clear')
  return error ? friendly(error.message) : null
}

export async function toggleStatusLike(ownerId: string): Promise<{ liked: boolean | null; error: string | null }> {
  const { data, error } = await supabase.rpc('status_like_toggle', { p_owner: ownerId })
  if (error) return { liked: null, error: friendly(error.message) }
  return { liked: !!data, error: null }
}

export const STATUS_CHANGED_EVENT = 'daiwa-status-changed'
export function emitStatusChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STATUS_CHANGED_EVENT))
}

/** «hace 3 h» */
export function statusAgo(iso: string, now = Date.now()): string {
  const min = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}
