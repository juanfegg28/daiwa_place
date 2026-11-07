'use client'

import Link from 'next/link'
import { countdown } from '../../lib/economy'
import type { MissionsPanelState } from './MissionsPanel'

/** v1.8.0 · Pastilla del Inicio: días de racha y cuándo se apaga. Toca para ver el detalle en Misiones. */
export default function StreakChip({ state }: { state: MissionsPanelState }) {
  const st = state.streak
  if (!st) return null
  const alive = st.current > 0
  const left = st.ends_at ? countdown(st.ends_at, st.server_now, state.loadedAt) : ''
  const urgent = alive && !st.today_done
  return (
    <Link
      href="/misiones"
      className={`mb-3 sm:mb-4 flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 transition ${
        urgent ? 'border-orange-400/50 bg-orange-500/10 hover:bg-orange-500/15' : alive ? 'border-ink-700 bg-ink-900/60 hover:bg-ink-800/70' : 'border-ink-800 bg-ink-900/40 hover:bg-ink-800/60'
      }`}
      aria-label={alive ? `Racha de ${st.current} días` : 'Todavía no tienes racha'}
    >
      <span className={`text-xl leading-none ${alive ? '' : 'grayscale opacity-60'}`} aria-hidden="true">🔥</span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13.5px] font-semibold text-neutral-50">
          {alive ? `${st.current} ${st.current === 1 ? 'día' : 'días'} de racha` : 'Empieza tu racha hoy'}
        </span>
        <span className="block text-[11.5px] text-neutral-400 truncate">
          {alive ? (st.today_done ? `Hoy ya cuenta ✓ · se apaga en ${left} si no entras` : `¡Se apaga en ${left}! Entra hoy para mantenerla`) : 'Entra cada día y gana Lunas'}
        </span>
      </span>
      {!st.daily.claimed && <span className="rounded-full bg-amber-500 text-ink-950 text-[11px] font-bold px-2.5 py-1">🎁 +{st.daily.amount} ☾</span>}
    </Link>
  )
}
