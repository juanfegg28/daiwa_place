'use client'

import { ArrowDownIcon, ArrowUpIcon } from '../components/icons'

/** Votos estilo Reddit: flecha arriba, puntaje y flecha abajo. */
export default function VoteColumn({
  score,
  myVote,
  disabled,
  disabledReason,
  orientation = 'vertical',
  onVote,
}: {
  score: number
  myVote: number
  disabled: boolean
  disabledReason?: string
  orientation?: 'vertical' | 'horizontal'
  onVote: (value: 1 | -1) => void
}) {
  const scoreColor = myVote === 1 ? 'text-garnet-400' : myVote === -1 ? 'text-sky-400' : 'text-neutral-300'
  return (
    <div
      className={`flex items-center gap-0.5 ${orientation === 'vertical' ? 'flex-col' : 'flex-row bg-ink-900 rounded-full px-1'}`}
      title={disabled ? disabledReason : undefined}
    >
      <button
        type="button"
        onClick={() => onVote(1)}
        disabled={disabled}
        aria-label="Voto positivo"
        aria-pressed={myVote === 1}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-40 ${
          myVote === 1 ? 'text-garnet-400 bg-garnet-600/15' : 'text-neutral-500 hover:text-garnet-400 hover:bg-ink-700'
        }`}
      >
        <ArrowUpIcon filled={myVote === 1} className="w-[18px] h-[18px]" />
      </button>
      <span className={`min-w-[2ch] text-center text-sm font-semibold tabular-nums ${scoreColor}`}>{score}</span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        disabled={disabled}
        aria-label="Voto negativo"
        aria-pressed={myVote === -1}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-40 ${
          myVote === -1 ? 'text-sky-400 bg-sky-500/15' : 'text-neutral-500 hover:text-sky-400 hover:bg-ink-700'
        }`}
      >
        <ArrowDownIcon filled={myVote === -1} className="w-[18px] h-[18px]" />
      </button>
    </div>
  )
}
