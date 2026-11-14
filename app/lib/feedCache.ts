// v1.10.0 · Caché EN MEMORIA del feed del Inicio (nunca se guarda en el disco ni en localStorage).
// Sirve para que, al abrir una publicación y volver (o al saltar entre secciones), el Inicio reaparezca AL INSTANTE, en el mismo punto
// donde ibas, sin volver a pedir todo a Supabase. Reglas de privacidad y consistencia:
//  · Está atada a UNA cuenta: si otra cuenta entra (cambio rápido de personaje) o se cierra sesión, no se puede leer ni se conserva.
//  · Dura poco: dentro de FEED_CACHE_FRESH_MS se muestra tal cual; hasta FEED_CACHE_MAX_MS se muestra y se renueva por debajo
//    (así nunca ves algo viejo sin que se actualice); pasado eso se descarta.
//  · Solo vive mientras la pestaña esté abierta. Un «recargar» siempre pide todo de nuevo.
import type { FeedItem } from './types'
import { supabase } from './supabaseClient'

export const FEED_CACHE_FRESH_MS = 45_000
export const FEED_CACHE_MAX_MS = 20 * 60_000

type Entry = { userId: string; items: FeedItem[]; hasMore: boolean; limit: number; newestSeen: string | null; scrollY: number; at: number }
let entry: Entry | null = null

export type FeedSnapshot = Omit<Entry, 'at'> & { fresh: boolean }

export function readFeedCache(userId: string | null | undefined): FeedSnapshot | null {
  if (!entry || !userId || entry.userId !== userId) return null
  const age = Date.now() - entry.at
  if (age > FEED_CACHE_MAX_MS) {
    entry = null
    return null
  }
  const { at: _at, ...rest } = entry
  void _at
  return { ...rest, fresh: age < FEED_CACHE_FRESH_MS }
}

/** Guarda el estado actual del feed (conserva la posición de scroll si es la misma cuenta). `at` solo se renueva cuando los datos vienen de Supabase. */
export function writeFeedCache(next: Omit<Entry, 'scrollY' | 'at'>, fromServer: boolean) {
  const same = entry && entry.userId === next.userId
  entry = { ...next, scrollY: same ? entry!.scrollY : 0, at: fromServer || !same ? Date.now() : entry!.at }
}

export function setFeedScroll(y: number) {
  if (entry) entry.scrollY = Math.max(0, Math.round(y))
}

export function clearFeedCache() {
  entry = null
}

// Al cerrar sesión se borra todo; y también cuando cambia lo que el feed muestra (seguir/dejar de seguir, silenciar/ocultar: ver supabaseClient.ts)
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') entry = null
  })
  window.addEventListener('daiwa:feed-dirty', () => {
    entry = null
  })
}
