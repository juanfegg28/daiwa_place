'use client'

// v1.9.0 · Panel para armar la encuesta de una publicación (opciones, duración). Se valida otra vez en Supabase.
import { CloseIcon, PlusIcon } from './icons'
import { MAX_OPTION_LEN, MAX_POLL_OPTIONS, MAX_QUESTION_LEN, POLL_DURATIONS, type PollDraft } from '../lib/polls'

type Props = {
  value: PollDraft
  onChange: (next: PollDraft) => void
  onRemove: () => void
  disabled?: boolean
}

export default function PollComposer({ value, onChange, onRemove, disabled = false }: Props) {
  const setOption = (i: number, text: string) => onChange({ ...value, options: value.options.map((o, k) => (k === i ? text : o)) })
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/70 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Encuesta</p>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-garnet-400 transition"
          aria-label="Quitar la encuesta"
        >
          <CloseIcon className="w-3.5 h-3.5" /> Quitar
        </button>
      </div>
      <input
        type="text"
        value={value.question}
        onChange={(e) => onChange({ ...value, question: e.target.value.slice(0, MAX_QUESTION_LEN) })}
        placeholder="Pregunta (opcional)"
        maxLength={MAX_QUESTION_LEN}
        disabled={disabled}
        className="w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-garnet-500"
      />
      <div className="space-y-1.5">
        {value.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text"
              value={opt}
              onChange={(e) => setOption(i, e.target.value.slice(0, MAX_OPTION_LEN))}
              placeholder={`Opción ${i + 1}`}
              maxLength={MAX_OPTION_LEN}
              disabled={disabled}
              className="flex-1 min-w-0 rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-garnet-500"
            />
            {value.options.length > 2 && (
              <button
                type="button"
                onClick={() => onChange({ ...value, options: value.options.filter((_, k) => k !== i) })}
                disabled={disabled}
                aria-label={`Quitar la opción ${i + 1}`}
                className="shrink-0 rounded-full p-1.5 text-neutral-500 hover:text-garnet-400 hover:bg-ink-700 transition"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {value.options.length < MAX_POLL_OPTIONS && (
          <button
            type="button"
            onClick={() => onChange({ ...value, options: [...value.options, ''] })}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-garnet-400 hover:text-garnet-300 transition px-1 py-1"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar opción
          </button>
        )}
      </div>
      <div>
        <p className="text-[11px] text-neutral-500 mb-1">Duración</p>
        <div className="flex flex-wrap gap-1.5">
          {POLL_DURATIONS.map((d) => (
            <button
              key={d.hours}
              type="button"
              onClick={() => onChange({ ...value, hours: d.hours })}
              disabled={disabled}
              aria-pressed={value.hours === d.hours}
              className={`rounded-full px-3 py-1 text-xs border transition ${
                value.hours === d.hours ? 'border-garnet-500 bg-garnet-500/15 text-garnet-300' : 'border-ink-600 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
