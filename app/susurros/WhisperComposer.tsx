'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CloseIcon } from '../components/icons'
import {
  ANON_NAME,
  MAX_WHISPER_LENGTH,
  MIN_WHISPER_LENGTH,
  WHISPER_CATEGORIES,
  friendlyWhisperError,
  type WhisperCategory,
} from '../lib/whispers'
import AnonAvatar from './AnonAvatar'

/** Ventana para publicar una confesión anónima. */
export default function WhisperComposer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<WhisperCategory>('confesion')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    function reset() {
      setText('')
      setCategory('confesion')
      setError('')
      setSending(false)
    }
    reset()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, sending, onClose])

  if (!open) return null

  const clean = text.trim()
  const canSend = clean.length >= MIN_WHISPER_LENGTH && !sending

  const submit = async () => {
    if (!canSend) return
    setSending(true)
    setError('')
    const { error: err } = await supabase.rpc('whisper_create', { p_content: clean, p_category: category })
    setSending(false)
    if (err) {
      setError(friendlyWhisperError(err.message))
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center md:px-4" onClick={() => !sending && onClose()}>
      <div
        className="surface-raised border border-ink-600 rounded-t-2xl md:rounded-2xl p-5 w-full md:max-w-lg max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-neutral-50">Nuevo susurro</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-100 hover:bg-ink-600 transition">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 mb-3">
          <AnonAvatar />
          <p className="text-sm text-neutral-300">
            Publicarás como <span className="font-semibold text-neutral-100">{ANON_NAME}</span>
          </p>
        </div>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_WHISPER_LENGTH))}
          rows={6}
          placeholder="Confiesa lo que no te atreves a decir…"
          className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3.5 py-3 text-[15px] leading-relaxed resize-none focus:outline-none focus:border-garnet-600"
        />
        <p className="text-[11px] text-neutral-600 text-right mt-1 mb-3">
          {clean.length < MIN_WHISPER_LENGTH ? `Mínimo ${MIN_WHISPER_LENGTH} caracteres · ` : ''}
          {text.length}/{MAX_WHISPER_LENGTH}
        </p>

        <p className="text-xs text-neutral-500 mb-2">Tipo de susurro</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {WHISPER_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`text-xs rounded-full px-3 py-1.5 transition ${
                category === c.id ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300 hover:bg-ink-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-ink-900 border border-ink-700 px-3.5 py-3 mb-4 space-y-1.5">
          <p className="text-xs font-semibold text-neutral-300">Reglas del Muro</p>
          <ul className="text-xs text-neutral-500 leading-relaxed list-disc pl-4 space-y-0.5">
            <li>No des nombres completos, números ni datos con los que se pueda identificar a alguien.</li>
            <li>Nada de insultos, acoso, amenazas ni discriminación.</li>
            <li>No se permiten enlaces. Máximo 5 susurros por día.</li>
            <li>
              Los demás estudiantes no pueden saber quién eres. Solo en casos graves (amenazas, acoso) el equipo de
              administración puede revisar quién escribió un susurro, y cada revisión queda registrada.
            </li>
          </ul>
        </div>

        {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={sending} className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2.5 text-sm hover:bg-ink-800 transition disabled:opacity-60">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={!canSend} className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2.5 text-sm font-medium transition disabled:opacity-50">
            {sending ? 'Publicando...' : 'Susurrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
