'use client'

import { CheckIcon } from '../icons'
import { PASSWORD_MIN, type PasswordReport } from '../../lib/authRules'

const BAR: Record<number, string> = { 1: 'bg-rose-400', 2: 'bg-amber-400', 3: 'bg-emerald-400' }
const TEXT: Record<number, string> = { 1: 'text-rose-300', 2: 'text-amber-300', 3: 'text-emerald-300' }

/**
 * Medidor de contraseña amigable: 3 tramos que cambian de color, un texto cercano
 * ("Un poco débil" → "Casi lista" → "¡Inquebrantable!") y una lista visual de lo que falta.
 */
export default function PasswordMeter({ report }: { report: PasswordReport }) {
  const { level, label, hint, checks } = report
  return (
    <div className="space-y-2.5 px-1" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((seg) => (
            <span
              key={seg}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level >= seg ? BAR[level] : 'bg-white/10'}`}
            />
          ))}
        </div>
        <span className={`min-w-[6.5rem] text-right text-xs font-semibold transition-colors ${level ? TEXT[level] : 'text-neutral-600'}`}>
          {label || ' '}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-neutral-500">{hint}</p>

      <ul className="flex flex-wrap gap-1.5">
        {(
          [
            { ok: checks.length, text: `${PASSWORD_MIN}+ caracteres` },
            { ok: checks.number, text: 'Un número' },
            { ok: checks.letter, text: 'Una letra' },
          ] as const
        ).map((c) => (
          <li
            key={c.text}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300 ${
              c.ok
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-white/[0.03] text-neutral-500'
            }`}
          >
            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition ${c.ok ? 'bg-emerald-500/25' : 'bg-white/5'}`}>
              {c.ok && <CheckIcon className="h-2.5 w-2.5" />}
            </span>
            {c.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
