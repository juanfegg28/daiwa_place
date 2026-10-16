'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Lista de cuentas bloqueadas (en cualquier dirección) de la persona actual. Se pide una sola vez por usuario
// y se comparte entre todas las tarjetas del feed, para no hacer una consulta por publicación.
const cache = new Map<string, { at: number; promise: Promise<Set<string>> }>()

function load(userId: string): Promise<Set<string>> {
  const hit = cache.get(userId)
  if (hit && Date.now() - hit.at < 60_000) return hit.promise
  const promise = (async () => {
    const { data } = await supabase.from('blocks').select('blocker_id, blocked_id')
    const ids = new Set<string>()
    for (const row of (data as { blocker_id: string; blocked_id: string }[] | null) ?? []) {
      ids.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id)
    }
    return ids
  })()
  cache.set(userId, { at: Date.now(), promise })
  return promise
}

export function useBlockedIds(userId: string | null): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    load(userId).then((s) => {
      if (!cancelled) setIds(s)
    })
    return () => {
      cancelled = true
    }
  }, [userId])
  return ids
}
