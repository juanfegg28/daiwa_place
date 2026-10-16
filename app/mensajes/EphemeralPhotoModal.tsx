'use client'

import { useEffect, useState } from 'react'
import { CloseIcon, TimerIcon } from '../components/icons'
import { DM_IMAGE_DURATIONS, MAX_MESSAGE_LENGTH, imageDurationLabel, type DmImageHours } from '../lib/dm'
import type { PreparedImage } from '../lib/images'

/**
 * Antes de mandar una foto por mensaje directo hay que ELEGIR cuánto dura (1, 4, 8, 12 o 24 horas).
 * No hay ninguna opción marcada de entrada: el botón de enviar sigue apagado hasta que elijas una.
 */
export default function EphemeralPhotoModal({
  image,
  sending,
  onCancel,
  onSend,
}: {
  image: PreparedImage
  sending: boolean
  onCancel: () => void
  onSend: (hours: DmImageHours, caption: string) => void
}) {
  const [hours, setHours] = useState<DmImageHours | null>(null)
  const [caption, setCaption] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sending, onCancel])

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end md:items-center justify-center md:px-4 sheet-backdrop" onClick={() => !sending && onCancel()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enviar foto que se autodestruye"
        onClick={(e) => e.stopPropagation()}
        className="surface-raised border border-ink-600 sheet-panel rounded-t-2xl md:rounded-2xl border-b-0 md:border-b p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-5 w-full md:max-w-sm max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-50">Foto que se autodestruye</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Se borra sola cuando pase el tiempo que elijas.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={sending} aria-label="Cancelar" className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-ink-600 transition shrink-0 disabled:opacity-50">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl overflow-hidden bg-ink-900 mb-3 flex items-center justify-center max-h-[42dvh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.previewUrl} alt="Vista previa" className="max-h-[42dvh] w-auto max-w-full object-contain" />
        </div>

        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 mb-2">
          <TimerIcon className="w-4 h-4 text-garnet-400" />
          ¿Cuánto tiempo dura? <span className="text-garnet-400">(obligatorio)</span>
        </p>
        <div className="grid grid-cols-5 gap-1.5 mb-3" role="radiogroup" aria-label="Duración de la foto">
          {DM_IMAGE_DURATIONS.map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={hours === h}
              onClick={() => setHours(h)}
              className={`rounded-xl border py-2 text-center transition ${
                hours === h ? 'border-garnet-500 bg-garnet-600/20 text-garnet-300' : 'border-ink-600 text-neutral-300 hover:bg-ink-700'
              }`}
            >
              <span className="block text-base font-semibold leading-none">{h}</span>
              <span className="block text-[10px] mt-1 text-neutral-500">{h === 1 ? 'hora' : 'horas'}</span>
            </button>
          ))}
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder="Añade un mensaje (opcional)"
          className="w-full bg-ink-900 border border-ink-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-garnet-600 mb-3"
        />

        <p className="text-[11px] text-neutral-500 leading-snug mb-4">
          La foto desaparece del chat y deja de poder abrirse al cumplirse el tiempo. No se puede impedir que la otra persona haga una captura de pantalla: envía solo lo que te sientas cómodo/a compartiendo.
        </p>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={sending} className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2.5 text-sm hover:bg-ink-800 transition disabled:opacity-60">
            Cancelar
          </button>
          <button
            type="button"
            disabled={hours === null || sending}
            onClick={() => hours !== null && onSend(hours, caption.trim())}
            className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2.5 text-sm font-medium transition disabled:opacity-40"
          >
            {sending ? 'Enviando...' : hours === null ? 'Elige una duración' : `Enviar · ${imageDurationLabel(hours)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
