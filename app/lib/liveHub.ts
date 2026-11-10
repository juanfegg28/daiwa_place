// v1.9.0 · Canales Realtime que sobreviven al cambio de página.
// Cada página monta su propio AppShell: antes, CADA navegación cerraba y volvía a abrir 3 canales (avisos, chats, «conectado»),
// y cada apertura/cierre es tráfico y registros en Supabase (y un aviso a todas las personas conectadas por Presence).
// Ahora el canal se queda abierto unos segundos después de que se va la última página que lo usa; si la siguiente página lo pide
// enseguida (lo normal), reutiliza el MISMO canal y no pasa nada en Supabase.
import type { RealtimeChannel } from '@supabase/supabase-js'

type Listener = (payload?: unknown) => void
type Entry = { channel: RealtimeChannel; listeners: Set<Listener>; closeTimer: number | null; last: unknown; hasLast: boolean }

const entries = new Map<string, Entry>()
/** Tiempo que un canal sin oyentes sigue abierto esperando a la siguiente página */
export const HUB_GRACE_MS = 10_000

type Remover = (ch: RealtimeChannel) => unknown

let remover: Remover | null = null
/** Se llama una vez (desde supabaseClient o el primer uso) para poder cerrar canales sin importar el cliente aquí */
export function setHubRemover(fn: Remover) {
  remover = fn
}

export function hubOpen(
  key: string,
  /** crea y SUSCRIBE el canal; llama a emit(payload) cuando llegue algo (se hace una sola vez por canal) */
  build: (emit: (payload?: unknown) => void) => RealtimeChannel,
  listener: Listener,
  opts: { replay?: boolean } = {}
): () => void {
  let e = entries.get(key)
  if (e) {
    if (e.closeTimer !== null) {
      window.clearTimeout(e.closeTimer)
      e.closeTimer = null
    }
  } else {
    const listeners = new Set<Listener>()
    const created: Entry = { channel: null as unknown as RealtimeChannel, listeners, closeTimer: null, last: undefined, hasLast: false }
    const emit = (payload?: unknown) => {
      created.last = payload
      created.hasLast = true
      listeners.forEach((l) => l(payload))
    }
    created.channel = build(emit)
    entries.set(key, created)
    e = created
  }
  const entry = e
  entry.listeners.add(listener)
  // quien llega después se entera enseguida de lo último que se sabía (p. ej. quién está conectado)
  if (opts.replay && entry.hasLast) listener(entry.last)
  return () => {
    const cur = entries.get(key)
    if (!cur || cur !== entry) return
    cur.listeners.delete(listener)
    if (cur.listeners.size === 0 && cur.closeTimer === null) {
      cur.closeTimer = window.setTimeout(() => hubClose(key), HUB_GRACE_MS)
    }
  }
}

export function hubChannel(key: string): RealtimeChannel | null {
  return entries.get(key)?.channel ?? null
}

/** ¿El canal está unido? (para decidir si hace falta el respaldo por consulta) */
export function hubJoined(key: string): boolean {
  return entries.get(key)?.channel.state === 'joined'
}

/** Cierra el canal YA (cerrar sesión, apagar «conectado»…) */
export function hubClose(key: string) {
  const e = entries.get(key)
  if (!e) return
  if (e.closeTimer !== null) window.clearTimeout(e.closeTimer)
  entries.delete(key)
  try {
    void remover?.(e.channel)
  } catch {}
}

export function hubCloseAll() {
  for (const k of Array.from(entries.keys())) hubClose(k)
}
