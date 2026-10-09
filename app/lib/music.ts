// Música (Deezer) — v0.14.0
//
// Lo que se GUARDA en la base de datos (notas, publicaciones, perfiles): solo el número de la canción,
// el título, el artista, la carátula y el enlace a Deezer. NO se guarda el enlace del audio, porque
// Deezer lo hace caducar: se pide uno fresco cada vez que alguien le da play.
// Solo se oyen fragmentos de 30 segundos (así lo permite Deezer).

import { supabase } from './supabaseClient'

/** Volumen del reproductor: 70 % (ni muy bajo ni muy alto) */
export const MUSIC_VOLUME = 0.7
export const MUSIC_PAGE = 25

export type MusicTrack = {
  provider: 'deezer'
  /** número de la canción en Deezer */
  id: number
  title: string
  artist: string
  cover: string | null
  link: string | null
  // Solo viven en la memoria mientras se busca (no se guardan):
  explicit?: boolean
  duration?: number
  hasPreview?: boolean
  preview?: string | null
}

const MAX_TEXT = 200

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : ''
}

function cleanHttps(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** El enlace solo se acepta si es de deezer.com (así nadie puede colar enlaces raros en una canción) */
function cleanDeezerLink(value: unknown): string | null {
  const url = cleanHttps(value)
  if (!url) return null
  const host = new URL(url).hostname.toLowerCase()
  return host === 'deezer.com' || host === 'www.deezer.com' ? url : null
}

/** Convierte lo que venga (de la base de datos o de Deezer) en una canción segura, o null si no sirve. */
export function normalizeTrack(raw: unknown): MusicTrack | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'number' ? r.id : Number(r.id)
  const title = cleanText(r.title)
  if (!Number.isInteger(id) || id <= 0 || !title) return null
  return {
    provider: 'deezer',
    id,
    title,
    artist: cleanText(r.artist),
    cover: cleanHttps(r.cover),
    link: cleanDeezerLink(r.link),
    explicit: typeof r.explicit === 'boolean' ? r.explicit : undefined,
    duration: typeof r.duration === 'number' ? r.duration : undefined,
    hasPreview: typeof r.hasPreview === 'boolean' ? r.hasPreview : undefined,
    preview: cleanHttps(r.preview),
  }
}

/** Lo único que se guarda en la base de datos */
export function toStoredTrack(t: MusicTrack): Pick<MusicTrack, 'provider' | 'id' | 'title' | 'artist' | 'cover' | 'link'> {
  return { provider: 'deezer', id: t.id, title: t.title, artist: t.artist, cover: t.cover, link: t.link }
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

async function authHeader(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : null
}

export type SearchResult = { tracks: MusicTrack[]; hasMore: boolean; nextIndex: number; error: string | null }

/** Quita las canciones repetidas (mismo número de Deezer), dejando la primera */
export function uniqueById(list: MusicTrack[]): MusicTrack[] {
  const seen = new Set<number>()
  return list.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}

/** Busca canciones usando nuestro propio servidor (que a su vez consulta Deezer). */
export async function searchTracks(query: string, index = 0): Promise<SearchResult> {
  const q = query.trim()
  if (q.length < 2) return { tracks: [], hasMore: false, nextIndex: 0, error: null }
  const headers = await authHeader()
  if (!headers) return { tracks: [], hasMore: false, nextIndex: index, error: 'Inicia sesión para buscar música.' }
  try {
    const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}&index=${index}`, { headers })
    const json = (await res.json()) as { tracks?: unknown[]; hasMore?: boolean; nextIndex?: number; error?: string }
    if (!res.ok) return { tracks: [], hasMore: false, nextIndex: index, error: json.error ?? 'No se pudo buscar música.' }
    const tracks = uniqueById((json.tracks ?? []).map(normalizeTrack).filter((t): t is MusicTrack => !!t))
    return {
      tracks,
      hasMore: !!json.hasMore,
      nextIndex: typeof json.nextIndex === 'number' ? json.nextIndex : index + tracks.length,
      error: null,
    }
  } catch {
    return {
      tracks: [],
      hasMore: false,
      nextIndex: index,
      error: 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.',
    }
  }
}

/** Pide el enlace del fragmento de audio FRESCO de una canción (los enlaces guardados caducan). */
export async function fetchPreview(id: number): Promise<string | null> {
  const headers = await authHeader()
  if (!headers) return null
  try {
    const res = await fetch(`/api/music/track?id=${id}`, { headers })
    if (!res.ok) return null
    const json = (await res.json()) as { preview?: string | null }
    return cleanHttps(json.preview)
  } catch {
    return null
  }
}
