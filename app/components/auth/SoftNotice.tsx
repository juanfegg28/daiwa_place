import type { ReactNode } from 'react'

const TONES = {
  error: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
  info: 'border-white/10 bg-white/[0.04] text-neutral-300',
  good: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
} as const

/** Aviso suave (sin rojo gigante): para errores del servidor, ánimo o información. */
export default function SoftNotice({ tone = 'error', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`auth-fade-up rounded-2xl border px-4 py-3 text-sm leading-relaxed ${TONES[tone]}`}>
      {children}
    </div>
  )
}
