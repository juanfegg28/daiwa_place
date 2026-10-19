'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchRingStatus, queueRingStatus, STORIES_CHANGED_EVENT, type RingStatus } from '../../lib/stories'

type Segment = { seen: boolean; friends: boolean }

const GAP_DEG = 3

/**
 * Anillo de historias dividido en segmentos (uno por historia activa, como Instagram), con 3° entre segmentos.
 *  · no vista + «Seguidores»: degradado ámbar → granate (usa garnet-*, así respeta el color de acento)
 *  · no vista + «Amigos»: verde-azulado
 *  · ya vista: gris (si TODO está visto, el anillo es más fino)
 * El avatar va adentro con 2 px de separación.
 */
export default function StoryRing({
  avatarSize,
  segments,
  children,
  className = '',
  pulse = false,
  uid = 'r',
}: {
  /** diámetro del avatar en px */
  avatarSize: number
  segments: Segment[]
  children: ReactNode
  className?: string
  pulse?: boolean
  uid?: string
}) {
  const scale = Math.min(1, avatarSize / 64)
  const maxT = Math.max(1.75, 2.5 * scale)
  const gap = Math.max(1.5, 2 * scale)
  const outer = avatarSize + 2 * (maxT + gap)
  const n = segments.length
  const allSeen = n > 0 && segments.every((s) => s.seen)
  const t = allSeen ? Math.max(1, 1.5 * scale) : maxT
  const r = outer / 2 - t / 2
  const C = 2 * Math.PI * r
  const gapLen = n > 1 ? (C * GAP_DEG) / 360 : 0
  const segLen = C / Math.max(1, n) - gapLen
  const gid = `ring-${uid}`

  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${pulse ? 'story-ring-pulse' : ''} ${className}`} style={{ width: outer, height: outer }}>
      {n > 0 && (
        <svg viewBox={`0 0 ${outer} ${outer}`} width={outer} height={outer} className="absolute inset-0" aria-hidden="true">
          <defs>
            <linearGradient id={`${gid}-a`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: '#f59e0b' }} />
              <stop offset="0.45" style={{ stopColor: 'var(--color-garnet-400)' }} />
              <stop offset="1" style={{ stopColor: 'var(--color-garnet-600)' }} />
            </linearGradient>
            <linearGradient id={`${gid}-f`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: '#34d399' }} />
              <stop offset="1" style={{ stopColor: '#14b8a6' }} />
            </linearGradient>
          </defs>
          {segments.map((s, i) => {
            const start = -90 + (i * 360) / n + (n > 1 ? GAP_DEG / 2 : 0)
            const stroke = s.seen ? 'var(--color-ink-500)' : s.friends ? `url(#${gid}-f)` : `url(#${gid}-a)`
            return (
              <circle
                key={i}
                cx={outer / 2}
                cy={outer / 2}
                r={r}
                fill="none"
                stroke={stroke}
                strokeWidth={t}
                strokeDasharray={n === 1 ? undefined : `${segLen} ${C - segLen}`}
                transform={`rotate(${start} ${outer / 2} ${outer / 2})`}
              />
            )
          })}
        </svg>
      )}
      <span className="relative inline-flex rounded-full" style={{ width: avatarSize, height: avatarSize }}>
        {children}
      </span>
    </span>
  )
}

/** Resumen del anillo para avatares fuera de la bandeja (una sola «vuelta»: nueva o vista) */
export function statusSegments(s: RingStatus | undefined): Segment[] {
  if (!s || !s.has_story) return []
  return [{ seen: !s.has_unseen, friends: s.friends_only }]
}

/** Estado de anillo de varias personas con UNA consulta (caché de 60 s). Se refresca solo si cambian las historias. */
export function useRingStatuses(ids: (string | null | undefined)[]): Record<string, RingStatus> {
  const key = useMemo(() => Array.from(new Set(ids.filter((x): x is string => !!x))).sort().join(','), [ids])
  const [map, setMap] = useState<Record<string, RingStatus>>({})
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const on = () => setTick((v) => v + 1)
    window.addEventListener(STORIES_CHANGED_EVENT, on)
    return () => window.removeEventListener(STORIES_CHANGED_EVENT, on)
  }, [])

  useEffect(() => {
    if (!key) return
    let alive = true
    fetchRingStatus(key.split(',')).then((res) => {
      if (alive) setMap((prev) => ({ ...prev, ...res }))
    })
    return () => {
      alive = false
    }
  }, [key, tick])

  return map
}

/** Guarda de dónde se tocó (para que el visor «crezca» desde ese círculo) */
export function rememberOrigin(el: Element | null) {
  try {
    if (!el) return
    const r = el.getBoundingClientRect()
    window.sessionStorage.setItem('daiwa_story_origin', JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }))
  } catch {
    /* sin almacenamiento */
  }
}

/** Estado de anillo de UNA persona; las peticiones de muchas tarjetas se juntan en una sola consulta */
export function useRingStatus(userId: string | null | undefined): RingStatus | undefined {
  const [status, setStatus] = useState<RingStatus | undefined>(undefined)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const on = () => setTick((v) => v + 1)
    window.addEventListener(STORIES_CHANGED_EVENT, on)
    return () => window.removeEventListener(STORIES_CHANGED_EVENT, on)
  }, [])
  useEffect(() => {
    if (!userId) return
    let alive = true
    queueRingStatus(userId).then((v) => {
      if (alive) setStatus(v)
    })
    return () => {
      alive = false
    }
  }, [userId, tick])
  return status
}

/** Anillo que se dibuja ALREDEDOR de un avatar ya existente (no cambia su tamaño) */
export function RingOverlay({ status, uid }: { status: RingStatus | undefined; uid: string }) {
  if (!status?.has_story) return null
  const id = `ro-${uid}`
  const stroke = !status.has_unseen ? 'var(--color-ink-500)' : status.friends_only ? `url(#${id}-f)` : `url(#${id}-a)`
  return (
    <svg viewBox="0 0 100 100" className="absolute -inset-[3px] w-[calc(100%+6px)] h-[calc(100%+6px)] pointer-events-none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: '#f59e0b' }} />
          <stop offset="0.45" style={{ stopColor: 'var(--color-garnet-400)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-garnet-600)' }} />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: '#34d399' }} />
          <stop offset="1" style={{ stopColor: '#14b8a6' }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke={stroke} strokeWidth={status.has_unseen ? 5 : 3.5} />
    </svg>
  )
}

/** Envuelve un avatar con su anillo de historias (publicaciones y bandeja de mensajes) */
export function AvatarWithRing({ userId, children, className = '' }: { userId: string | null | undefined; children: ReactNode; className?: string }) {
  const status = useRingStatus(userId)
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {children}
      <RingOverlay status={status} uid={userId ?? 'x'} />
    </span>
  )
}
