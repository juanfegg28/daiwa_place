// v1.9.0 · Caché mínima del navegador para gastar menos Supabase (egress y logs):
//  · «una sola petición a la vez»: si dos componentes piden lo mismo, sale UNA consulta
//  · caducidad (TTL) en memoria y, opcionalmente, en sessionStorage (sobrevive a recargar la pestaña)
// Úsala solo para datos que no cambian cada segundo (explorar, catálogos, listas públicas).
type Entry<T> = { at: number; data: T }

const mem = new Map<string, Entry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()
const PREFIX = 'daiwa.nc.v1:'

export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
  opts: { persist?: boolean; shouldCache?: (data: T) => boolean } = {}
): Promise<T> {
  const now = Date.now()
  const hit = mem.get(key) as Entry<T> | undefined
  if (hit && now - hit.at < ttlMs) return hit.data
  if (opts.persist && typeof sessionStorage !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(PREFIX + key)
      if (raw) {
        const e = JSON.parse(raw) as Entry<T>
        if (now - e.at < ttlMs) {
          mem.set(key, e)
          return e.data
        }
      }
    } catch {}
  }
  const running = inflight.get(key) as Promise<T> | undefined
  if (running) return running
  const p = load()
    .then((data) => {
      if (!opts.shouldCache || opts.shouldCache(data)) {
        const e: Entry<T> = { at: Date.now(), data }
        mem.set(key, e)
        if (opts.persist && typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.setItem(PREFIX + key, JSON.stringify(e))
          } catch {}
        }
      }
      return data
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

/** Borra lo guardado cuyo nombre empiece así (p. ej. al publicar algo que cambia el resultado) */
export function invalidateCache(prefix: string) {
  for (const k of Array.from(mem.keys())) if (k.startsWith(prefix)) mem.delete(k)
  if (typeof sessionStorage === 'undefined') return
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(PREFIX + prefix)) sessionStorage.removeItem(k)
    }
  } catch {}
}
