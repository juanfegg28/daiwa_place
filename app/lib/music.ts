// Música (Deezer) — PRIMEROS PASOS.
//
// En la v0.12.0 solo queda preparado el terreno:
//  · las tablas guardan una canción en el campo "music" (notas, publicaciones y perfiles),
//  · MusicChip sabe mostrar una canción cuando exista,
//  · /api/music/search ya consulta Deezer desde el servidor.
// Todavía NO hay botón para elegir canciones en la pantalla: eso llega en una versión futura.

import { supabase } from './supabaseClient'

export type MusicTrack = {
  provider: 'deezer'
  /** id de la canción en Deezer */
  id: number
  title: string
  artist: string
  /** carátula pequeña (cuadrada) */
  cover: string | null
  /** audio de muestra de 30 s que entrega Deezer */
  preview: string | null
  /** enlace a la canción en deezer.com */
  link: string | null
}

const MAX_TEXT = 120

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : ''
}

function cleanUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Convierte lo que venga (de la base de datos o de Deezer) en una canción segura, o null si no sirve. */
export function normalizeTrack(raw: unknown): MusicTrack | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'number' ? r.id : Number(r.id)
  const title = cleanText(r.title)
  const artist = cleanText(r.artist)
  if (!Number.isFinite(id) || id <= 0 || !title) return null
  return {
    provider: 'deezer',
    id,
    title,
    artist,
    cover: cleanUrl(r.cover),
    preview: cleanUrl(r.preview),
    link: cleanUrl(r.link),
  }
}

/** Busca canciones usando nuestro propio servidor (que a su vez consulta Deezer). */
export async function searchTracks(query: string): Promise<MusicTrack[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return []
  const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  const json = (await res.json()) as { tracks?: unknown[] }
  return (json.tracks ?? []).map(normalizeTrack).filter((t): t is MusicTrack => !!t)
}
