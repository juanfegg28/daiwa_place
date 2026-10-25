'use client'
// v1.4.5 · Tope de animaciones simultáneas.
// Cada decoración / tarjeta visible pide un «cupo» para animarse. Solo las primeras MAX_ANIMATED lo reciben
// (las de perfil abierto van primero); el resto se queda quieta (pose estática) hasta que haya cupo.
// Así un feed lleno de gente con decoraciones animadas no se come el procesador del teléfono.
import { useEffect, useSyncExternalStore } from 'react'

export const MAX_ANIMATED = 8

type Entry = { prio: number; order: number; refs: number }
const entries = new Map<string, Entry>()
let allowed: ReadonlySet<string> = new Set()
let counter = 0
const subs = new Set<() => void>()

function recompute() {
  const sorted = [...entries.entries()].sort((a, b) => a[1].prio - b[1].prio || a[1].order - b[1].order)
  const next = new Set(sorted.slice(0, MAX_ANIMATED).map(([k]) => k))
  let same = next.size === allowed.size
  if (same) for (const k of next) if (!allowed.has(k)) { same = false; break }
  if (same) return
  allowed = next
  subs.forEach((s) => s())
}

function register(key: string, prio: number) {
  const e = entries.get(key)
  if (e) {
    e.refs++
    e.prio = Math.min(e.prio, prio)
  } else {
    entries.set(key, { prio, order: counter++, refs: 1 })
  }
  recompute()
}
function release(key: string) {
  const e = entries.get(key)
  if (!e) return
  if (--e.refs <= 0) entries.delete(key)
  recompute()
}

/** ¿Me toca animarme? `key` debe ser el mismo para las piezas de un mismo avatar (atrás y adelante). */
export function useAnimSlot(key: string, wants: boolean, prio = 1): boolean {
  useEffect(() => {
    if (!wants) return
    register(key, prio)
    return () => release(key)
  }, [key, wants, prio])
  const has = useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    },
    () => allowed.has(key),
    () => false
  )
  return wants && has
}
