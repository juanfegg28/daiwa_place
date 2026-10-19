'use client'

import { useState } from 'react'
import Sheet from './Sheet'
import { reportStory } from '../../lib/stories'

const REASONS: { id: string; label: string }[] = [
  { id: 'ofensivo', label: 'Contenido ofensivo' },
  { id: 'acoso', label: 'Acoso o bullying' },
  { id: 'datos_personales', label: 'Datos personales' },
  { id: 'odio', label: 'Odio o discriminación' },
  { id: 'ubicacion', label: 'Muestra una ubicación peligrosa' },
  { id: 'spam', label: 'Spam' },
  { id: 'otro', label: 'Otro motivo' },
]

/** Reportar una historia: se guarda una copia (snapshot) para el equipo y el cron no la borra mientras esté pendiente */
export default function StoryReportDialog({ open, storyId, onClose }: { open: boolean; storyId: string | null; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setReason('')
    setDetails('')
    setError('')
    setDone(false)
    onClose()
  }

  const submit = async () => {
    if (!storyId || !reason) return
    setSending(true)
    setError('')
    const err = await reportStory(storyId, reason, details.trim())
    setSending(false)
    if (err) setError(err)
    else setDone(true)
  }

  return (
    <Sheet open={open} onClose={close} title={done ? 'Reporte enviado' : 'Reportar esta historia'} z={150}>
      {done ? (
        <div>
          <p className="text-sm text-neutral-300 mb-4">Gracias. El equipo de DaiwaPlace va a revisarla. La otra persona no se entera de que la reportaste.</p>
          <button type="button" onClick={close} className="w-full rounded-full bg-garnet-600 py-2.5 text-sm font-medium text-white">Listo</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={`w-full text-left rounded-xl border px-3.5 py-2.5 text-[14px] transition ${reason === r.id ? 'border-garnet-500 bg-garnet-600/15 text-white' : 'border-white/10 text-neutral-200 hover:bg-white/5'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            value={details}
            maxLength={300}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Cuéntanos más (opcional)"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-[14px] outline-none focus:border-garnet-500 placeholder:text-neutral-500"
          />
          {error && <p className="text-xs text-garnet-300">{error}</p>}
          <button type="button" onClick={submit} disabled={!reason || sending} className="w-full rounded-full bg-garnet-600 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {sending ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </div>
      )}
    </Sheet>
  )
}
