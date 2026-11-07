'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MOOD_PRESETS, STATUS_MAX, clearMyStatus, emitStatusChanged, setMyStatus, type StatusRow } from '../lib/status'

/**
 * v1.6.2 · Hoja para poner, cambiar o quitar tu Estado («Estado: Vegetal»).
 * Celular: sube desde abajo. PC: diálogo centrado.
 */
export default function StatusSheet({
  open,
  current,
  onClose,
  onSaved,
}: {
  open: boolean
  current: StatusRow | null
  onClose: () => void
  onSaved: (s: StatusRow | null) => void
}) {
  const [emoji, setEmoji] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      setEmoji(current?.emoji ?? '')
      setText(current?.text ?? '')
      setError('')
    }, 0)
    return () => window.clearTimeout(t)
  }, [open, current])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const save = async () => {
    const clean = text.trim()
    if (!clean || busy) return
    setBusy(true)
    setError('')
    const res = await setMyStatus(emoji, clean)
    setBusy(false)
    if (res.error || !res.status) {
      setError(res.error ?? 'No se pudo guardar el estado.')
      return
    }
    emitStatusChanged()
    onSaved(res.status)
    onClose()
  }

  const remove = async () => {
    if (busy) return
    setBusy(true)
    const err = await clearMyStatus()
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    emitStatusChanged()
    onSaved(null)
    onClose()
  }

  // v1.8.0 · La hoja se dibuja directamente en <body> (portal). Antes vivía DENTRO de la tarjeta del perfil / del feed y, como esas
  // tarjetas tienen efectos (transform, filtros, decoraciones), el «fixed» se quedaba atrapado dentro y las historias y fotos del
  // Inicio se le montaban encima. Fuera de ahí no hay nada que la tape (z-index por encima de historias y visores).
  const sheet = (
    <div className="fixed inset-0 z-[130] bg-black/70 flex items-end md:items-center justify-center md:px-4 sheet-backdrop" onClick={() => !busy && onClose()}>
      <div
        className="surface-raised border border-ink-600 sheet-panel rounded-t-2xl md:rounded-2xl border-b-0 md:border-b p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-5 w-full md:max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tu estado"
      >
        <h2 className="text-base font-semibold text-neutral-50">¿Cómo andas hoy?</h2>
        <p className="text-sm text-neutral-400 mt-0.5 mb-4">Tu estado se ve en tu perfil y le aparece a quienes te siguen en el Inicio.</p>

        <div className="flex items-center gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(Array.from(e.target.value).slice(-2).join(''))}
            placeholder="🙂"
            aria-label="Emoji del estado"
            className="w-14 shrink-0 text-center text-2xl bg-ink-900 border border-ink-600 rounded-xl py-2 focus:outline-none focus:border-garnet-600"
          />
          <div className="flex-1 min-w-0 flex items-center bg-ink-900 border border-ink-600 rounded-xl px-3 focus-within:border-garnet-600">
            <span className="text-sm font-semibold text-neutral-400 shrink-0">Estado:</span>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, STATUS_MAX))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save()
              }}
              placeholder="Vegetal"
              maxLength={STATUS_MAX}
              aria-label="Texto del estado"
              className="flex-1 min-w-0 bg-transparent py-2.5 pl-2 text-[16px] focus:outline-none placeholder:text-neutral-600"
            />
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 text-right mt-1 tabular-nums">{text.length}/{STATUS_MAX}</p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {MOOD_PRESETS.map((m) => (
            <button
              key={m.text}
              type="button"
              onClick={() => {
                setEmoji(m.emoji)
                setText(m.text)
                inputRef.current?.focus()
              }}
              className="text-[13px] rounded-full border border-ink-600 bg-ink-900 hover:bg-ink-800 px-3 py-1.5 text-neutral-200"
            >
              <span className="mr-1">{m.emoji}</span>
              {m.text}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-garnet-400 mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          {current ? (
            <button type="button" onClick={remove} disabled={busy} className="border border-ink-500 text-neutral-300 rounded-full px-4 py-3 md:py-2 text-sm hover:bg-ink-800 disabled:opacity-60">
              Quitar
            </button>
          ) : (
            <button type="button" onClick={onClose} disabled={busy} className="border border-ink-500 text-neutral-300 rounded-full px-4 py-3 md:py-2 text-sm hover:bg-ink-800 disabled:opacity-60">
              Cancelar
            </button>
          )}
          <button type="button" onClick={save} disabled={busy || !text.trim()} className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-3 md:py-2 text-sm font-medium disabled:opacity-50">
            {busy ? 'Guardando...' : current ? 'Actualizar estado' : 'Poner estado'}
          </button>
        </div>
      </div>
    </div>
  )
  return typeof document === 'undefined' ? null : createPortal(sheet, document.body)
}
