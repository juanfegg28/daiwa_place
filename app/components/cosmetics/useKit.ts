'use client'

// v1.10.0 · Carga el kit de cosméticos (kit.ts, ≈650 KB) BAJO DEMANDA en vez de importarlo de forma estática.
// Las pantallas que solo lo necesitan para pintar miniaturas o listar paletas (Supporter → Estilos…) lo piden con este hook:
// la página se pinta primero y el kit llega justo después (una sola descarga compartida por toda la sesión).
import { useEffect, useState } from 'react'

export type Kit = typeof import('./kit')
let loaded: Kit | null = null
let pending: Promise<Kit> | null = null

export function loadKit(): Promise<Kit> {
  if (loaded) return Promise.resolve(loaded)
  pending ??= import('./kit').then((m) => (loaded = m))
  return pending
}

/** `null` hasta que el kit llega (normalmente unas décimas de segundo); después, el módulo completo */
export function useKit(): Kit | null {
  const [kit, setKit] = useState<Kit | null>(loaded)
  useEffect(() => {
    if (kit) return
    let alive = true
    void loadKit().then((m) => {
      if (alive) setKit(m)
    })
    return () => {
      alive = false
    }
  }, [kit])
  return kit
}
