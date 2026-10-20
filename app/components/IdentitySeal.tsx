'use client'

// Sellos temáticos animados de las identidades especiales (v1.3.0). Son SVG/CSS de código, ligeros,
// decorativos (aria-hidden) y se apagan con «reducir movimiento» (ver globals.css).
import type { ReactNode } from 'react'

const A = 'seal-anim'

function Sparkle({ x, y, d = 0, c = 'currentColor' }: { x: number; y: number; d?: number; c?: string }) {
  return (
    <path
      d={`M${x} ${y - 4}l1.2 2.8L${x + 4} ${y}l-2.8 1.2L${x} ${y + 4}l-1.2-2.8L${x - 4} ${y}l2.8-1.2Z`}
      fill={c}
      className={A}
      style={{ animationName: 'seal-twinkle', animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` }}
    />
  )
}

const SEALS: Record<string, () => ReactNode> = {
  Ángel: () => (
    <g>
      <ellipse cx="32" cy="14" rx="15" ry="4.5" fill="none" stroke="#fcd34d" strokeWidth="2.4" className={A} style={{ animationName: 'seal-breathe', transformOrigin: '32px 14px' }} />
      <path d="M32 24c-8-4-14 0-14 7 5-3 9-2 14 1 5-3 9-4 14-1 0-7-6-11-14-7Z" fill="#fde68a" fillOpacity=".5" />
    </g>
  ),
  Demonio: () => (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={16 + i * 11} cy="40" r="1.8" fill="#f97316" className={A} style={{ animationName: 'seal-rise', animationDelay: `${i * 0.7}s` }} />
      ))}
      <path d="M22 18 18 8l7 5M42 18l4-10-7 5" fill="#dc2626" fillOpacity=".7" />
    </g>
  ),
  Bruja: () => (
    <g>
      <path d="M44 12a10 10 0 1 0 4 15 8 8 0 0 1-4-15Z" fill="#c4b5fd" fillOpacity=".85" />
      {[0, 1].map((i) => (
        <circle key={i} cx={18 + i * 9} cy="34" r="4" fill="#a78bfa" fillOpacity=".35" className={A} style={{ animationName: 'seal-rise', animationDelay: `${i * 1.1}s` }} />
      ))}
    </g>
  ),
  'Hombre lobo': () => (
    <g className={A} style={{ animationName: 'seal-breathe', transformOrigin: '32px 22px' }}>
      <circle cx="32" cy="22" r="11" fill="#e2e8f0" fillOpacity=".9" />
      <circle cx="28" cy="19" r="2" fill="#94a3b8" fillOpacity=".6" />
      <circle cx="36" cy="26" r="2.6" fill="#94a3b8" fillOpacity=".5" />
    </g>
  ),
  Hada: () => (
    <g color="#f9a8d4">
      <Sparkle x={14} y={14} />
      <Sparkle x={34} y={8} d={0.8} />
      <Sparkle x={48} y={22} d={1.6} />
      <Sparkle x={24} y={32} d={2.2} />
    </g>
  ),
  'Ángel caído': () => (
    <path d="M30 6c8 6 4 14 0 20-5-7-6-14 0-20Z" fill="#94a3b8" fillOpacity=".7" className={A} style={{ animationName: 'seal-fall' }} />
  ),
  Entidad: () => (
    <g className={A} style={{ animationName: 'seal-glitch', animationDuration: '4s' }}>
      <path d="M8 22c8-10 40-10 48 0-8 10-40 10-48 0Z" fill="none" stroke="#a3a3a3" strokeWidth="2" />
      <circle cx="32" cy="22" r="6" fill="#171717" stroke="#ef4444" strokeWidth="2" />
      <circle cx="32" cy="22" r="2" fill="#ef4444" />
    </g>
  ),
  Alien: () => (
    <g fill="none" stroke="#4ade80" strokeWidth="1.8">
      <ellipse cx="32" cy="22" rx="20" ry="7" className={A} style={{ animationName: 'seal-spin', animationDuration: '8s', transformOrigin: '32px 22px', animationTimingFunction: 'linear' }} />
      <circle cx="32" cy="22" r="4" fill="#4ade80" fillOpacity=".5" />
    </g>
  ),
  Doll: () => (
    <g stroke="#e9d5ff" strokeWidth="1.2" fill="none" strokeOpacity=".8">
      <path d="M10 8c6 4 4 9 10 10M54 6c-6 4-4 9-10 10M30 34c2-5-1-8 3-12" />
      <circle cx="32" cy="20" r="9" strokeOpacity=".5" />
    </g>
  ),
  Estrella: () => <g color="#fde047" className={A} style={{ animationName: 'seal-breathe', transformOrigin: '32px 22px' }}><path d="M32 8l4.2 9 9.8 1.2-7.2 6.8 1.9 9.7L32 29.8 23.3 34.7l1.9-9.7L18 18.2 27.8 17Z" fill="currentColor" /></g>,
  Diva: () => (
    <g>
      <path d="M6 4h10l-6 40H0Z" fill="#fde68a" fillOpacity=".55" className={A} style={{ animationName: 'seal-sweep', animationDuration: '4.5s' }} />
    </g>
  ),
  NPC: () => (
    <g fontFamily="monospace" fontSize="8" fill="#e5e5e5">
      <rect x="6" y="10" width="52" height="22" fill="#0a0a0a" fillOpacity=".7" stroke="#e5e5e5" strokeWidth="1.5" />
      <text x="10" y="24">¡Hola!</text>
      <rect x="44" y="18" width="5" height="9" className={A} style={{ animationName: 'seal-blink', animationDuration: '1s', animationTimingFunction: 'steps(1)' }} />
    </g>
  ),
  Supernova: () => (
    <g fill="none" stroke="#fb923c" strokeWidth="2">
      <circle cx="32" cy="22" r="14" className={A} style={{ animationName: 'seal-wave', transformOrigin: '32px 22px' }} />
      <circle cx="32" cy="22" r="14" className={A} style={{ animationName: 'seal-wave', transformOrigin: '32px 22px', animationDelay: '1.6s' }} />
      <circle cx="32" cy="22" r="4" fill="#fde047" stroke="none" />
    </g>
  ),
  Batman: () => (
    <path d="M32 12c-3 4-8 3-14 1 2 4 3 9 6 11 3-2 5 1 8 6 3-5 5-8 8-6 3-2 4-7 6-11-6 2-11 3-14-1Z" fill="#404040" fillOpacity=".8" className={A} style={{ animationName: 'seal-float' }} />
  ),
  Fantasma: () => (
    <path d="M18 34V18a14 14 0 0 1 28 0v16l-5-3-4 3-5-3-5 3-4-3Z" fill="#e5e7eb" fillOpacity=".45" className={A} style={{ animationName: 'seal-float' }} />
  ),
  'Vampiro/a': () => (
    <g>
      <path d="M20 14l3 9 3-9M38 14l3 9 3-9" fill="#fff" fillOpacity=".85" stroke="#fca5a5" strokeWidth=".8" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${24 + i * 8} 26c2 3 2 5 0 6-2-1-2-3 0-6Z`} fill="#dc2626" className={A} style={{ animationName: 'seal-drip', animationDelay: `${i * 0.9}s` }} />
      ))}
    </g>
  ),
}

export function hasSeal(identity: string | null | undefined): boolean {
  return !!identity && identity in SEALS
}

/** Sello decorativo en la esquina de la tarjeta de identidad */
export default function IdentitySeal({ identity, className = '' }: { identity: string; className?: string }) {
  const Seal = SEALS[identity]
  if (!Seal) return null
  return (
    <svg viewBox="0 0 64 44" aria-hidden="true" className={`pointer-events-none select-none ${className}`}>
      <Seal />
    </svg>
  )
}
