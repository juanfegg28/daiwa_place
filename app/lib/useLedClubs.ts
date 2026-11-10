// v1.9.0 · Clubes que lidera la persona (para crear eventos de club). Una consulta, guardada 10 minutos en este dispositivo.
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export type LedClub = { id: string; name: string; slug: string }
const TTL = 10 * 60_000

export function useLedClubs(userId: string | null): LedClub[] {
  const [clubs, setClubs] = useState<LedClub[]>([])
  useEffect(() => {
    if (!userId) return
    const key = `daiwa.ledClubs.v1:${userId}`
    let alive = true
    const t = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(key)
        if (raw) {
          const c = JSON.parse(raw) as { at: number; clubs: LedClub[] }
          if (Date.now() - c.at < TTL) {
            setClubs(c.clubs)
            return
          }
        }
      } catch {}
      supabase
        .from('clubs')
        .select('id, name, slug')
        .eq('leader_id', userId)
        .then(({ data }) => {
          if (!alive) return
          const list = (data as LedClub[] | null) ?? []
          setClubs(list)
          try {
            sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), clubs: list }))
          } catch {}
        })
    }, 0)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [userId])
  return clubs
}
