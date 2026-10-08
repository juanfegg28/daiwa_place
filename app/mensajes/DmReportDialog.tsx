'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CloseIcon } from '../components/icons'
import { REPORT_REASONS, type ReportReason } from '../lib/whispers'

/** Ventana para reportar una conversación (o un mensaje puntual) de los mensajes directos. */
export default function DmReportDialog({
  open,
  convId,
  messageId,
  onClose,
  onDone,
}: {
  open: boolean
  convId: string
  messageId: string | null
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    function reset() {
      setReason(null)
      setDetails('')
      setError('')
      setSending(false)
    }
    reset()
  }, [open, messageId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, sending, onClose])

  if (!open) return null

  const submit = async () => {
    if (!reason || sending) return
    setSending(true)
    setError('')
    const { error: err } = await supabase.rpc('dm_report', {
      p_conv: convId,
      p_message: messageId,
      p_reason: reason,
      p_details: details.trim() || null,
    })
    setSending(false)
    if (err) {
      setError(
        /Could not find the function/.test(err.message) ? 'Falta correr el SQL de la v0.13.5 en Supabase.' : err.message
      )
      return
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center md:px-4" onClick={() => !sending && onClose()}>
      <div
        className="surface-raised border border-ink-600 rounded-t-2xl md:rounded-2xl p-5 w-full md:max-w-md max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-neutral-50">{messageId ? 'Reportar mensaje' : 'Reportar conversación'}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-100 hover:bg-ink-600 transition">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
          El equipo solo verá una copia de los últimos mensajes de esta conversación, nada más. La otra persona no sabrá que
          fuiste tú.
        </p>

        <div className="space-y-1.5 mb-4" role="radiogroup" aria-label="Motivo del reporte">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={reason === r.id}
              onClick={() => setReason(r.id)}
              className={`w-full text-left text-sm rounded-xl px-3.5 py-2.5 border transition ${
                reason === r.id ? 'border-garnet-500 bg-garnet-600/15 text-neutral-50' : 'border-ink-600 text-neutral-300 hover:bg-ink-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="Cuéntanos más (opcional)"
          className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-garnet-600"
        />
        <p className="text-[11px] text-neutral-600 text-right mt-1 mb-3">{details.length}/300</p>

        {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={sending} className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={!reason || sending} className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition disabled:opacity-50">
            {sending ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </div>
      </div>
    </div>
  )
}
