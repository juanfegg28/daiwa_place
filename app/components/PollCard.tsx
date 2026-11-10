'use client'

// v1.9.0 · Encuesta dentro de una publicación. Un voto por persona (lo garantiza Supabase); resultados en porcentaje.
import { memo, useMemo, useState } from 'react'
import { CheckIcon } from './icons'
import { isPollOpen, normalizePoll, pollPercents, pollTimeLeft, votePoll, type PostPoll } from '../lib/polls'

type Props = {
  raw: unknown
  /** quien la publicó: ve los resultados siempre */
  isAuthor: boolean
  /** sin sesión, cuenta congelada, etc. */
  disabled?: boolean
}

function PollCard({ raw, isAuthor, disabled = false }: Props) {
  const initial = useMemo(() => normalizePoll(raw), [raw])
  const [poll, setPoll] = useState<PostPoll | null>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [peek, setPeek] = useState(false)

  if (!poll) return null
  const open = isPollOpen(poll)
  const voted = poll.myOption !== null
  const showResults = voted || !open || isAuthor || peek
  const votes = poll.options.map((o) => o.votes)
  const total = votes.reduce((a, b) => a + b, 0)
  const pct = pollPercents(votes)
  const top = Math.max(...votes)

  const vote = async (optionId: string) => {
    if (busy || disabled || !open || voted) return
    setBusy(optionId)
    setError('')
    const { result, error: err } = await votePoll(poll.id, optionId)
    setBusy(null)
    if (err || !result) {
      setError(err || 'No se pudo votar')
      return
    }
    setPoll((p) => {
      if (!p) return p
      const byId = new Map(result.options.map((o) => [o.id, o.votes]))
      return { ...p, myOption: result.myOption, options: p.options.map((o) => ({ ...o, votes: byId.get(o.id) ?? o.votes + (o.id === result.myOption ? 1 : 0) })) }
    })
  }

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/70 p-3 space-y-2" role="group" aria-label="Encuesta">
      {poll.question && <p className="text-sm font-medium text-neutral-100 break-words">{poll.question}</p>}
      <ul className="space-y-1.5">
        {poll.options.map((o, i) => {
          const mine = poll.myOption === o.id
          if (!showResults) {
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => vote(o.id)}
                  disabled={disabled || !!busy}
                  className="w-full text-left rounded-lg border border-ink-600 bg-ink-700/40 px-3 py-2 text-sm text-neutral-200 hover:border-garnet-500 hover:bg-ink-700 disabled:opacity-60 transition break-words"
                >
                  {o.label}
                </button>
              </li>
            )
          }
          return (
            <li key={o.id} className="relative overflow-hidden rounded-lg border border-ink-600 bg-ink-700/40">
              <div
                className={`absolute inset-y-0 left-0 transition-[width] duration-500 motion-reduce:transition-none ${mine ? 'bg-garnet-500/35' : o.votes === top && top > 0 ? 'bg-garnet-500/20' : 'bg-neutral-500/15'}`}
                style={{ width: `${pct[i]}%` }}
                aria-hidden
              />
              <div className="relative flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 min-w-0 break-words text-neutral-100">
                  {mine && <CheckIcon className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-garnet-400" />}
                  {o.label}
                </span>
                <span className="tabular-nums text-xs text-neutral-300 shrink-0">{pct[i]}%</span>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500">
        <span className="tabular-nums">{total} {total === 1 ? 'voto' : 'votos'}</span>
        <span aria-hidden>·</span>
        <span>{pollTimeLeft(poll.endsAt)}</span>
        {!showResults && open && (
          <button type="button" onClick={() => setPeek(true)} className="ml-auto text-garnet-400 hover:text-garnet-300 transition">
            Ver resultados
          </button>
        )}
      </div>
      {error && <p className="text-xs text-garnet-400">{error}</p>}
    </div>
  )
}

export default memo(PollCard)
