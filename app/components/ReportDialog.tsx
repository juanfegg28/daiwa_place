'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ReportDialog({
  open,
  targetUsername,
  targetUserId,
  reporterId,
  onClose,
}: {
  open: boolean
  targetUsername: string
  targetUserId: string
  reporterId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const close = () => {
    setReason('')
    setError('')
    setDone(false)
    onClose()
  }

  const submit = async () => {
    setSending(true)
    setError('')
    const { error: err } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      reported_user_id: targetUserId,
      reason: reason.trim() || null,
    })
    setSending(false)
    if (err) {
      setError('No se pudo enviar el reporte. Intenta de nuevo.')
      return
    }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={close}>
      <div
        className="surface-raised border border-ink-600 rounded-2xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {done ? (
          <>
            <h2 className="text-base font-semibold text-neutral-50 mb-1.5">Reporte enviado</h2>
            <p className="text-sm text-neutral-400 mb-5 leading-relaxed">
              Gracias por avisar. Por ahora el reporte queda guardado para cuando esté listo el panel de
              administrador — mientras tanto, si es urgente, escríbele directo al admin por Discord.
            </p>
            <button
              type="button"
              onClick={close}
              className="w-full bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition"
            >
              Listo
            </button>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold text-neutral-50 mb-1.5">Reportar a @{targetUsername}</h2>
            <p className="text-sm text-neutral-400 mb-3 leading-relaxed">
              Cuéntale al administrador qué está pasando. Es opcional, pero ayuda a revisar el caso más rápido.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="¿Qué regla rompió o qué pasó? (opcional)"
              className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-garnet-600 mb-3"
            />
            {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={close}
                disabled={sending}
                className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition disabled:opacity-60"
              >
                {sending ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
