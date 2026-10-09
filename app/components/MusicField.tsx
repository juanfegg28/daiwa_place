'use client'

import { useState } from 'react'
import { MusicIcon } from './icons'
import MusicChip from './MusicChip'
import MusicPicker from './MusicPicker'
import { normalizeTrack, toStoredTrack, type MusicTrack } from '../lib/music'

/**
 * Campo para añadir una canción (publicaciones, notas, perfil).
 * Sin canción: botón bonito. Con canción: su tarjeta con X para quitarla y botón para cambiarla.
 * `value` es lo que se guarda en la base de datos (sin enlace de audio).
 */
export default function MusicField({
  value,
  onChange,
  variant = 'compact',
  label = 'Añadir canción',
  pickerTitle,
  disabled = false,
}: {
  value: unknown
  onChange: (track: ReturnType<typeof toStoredTrack> | null) => void
  variant?: 'card' | 'compact'
  label?: string
  pickerTitle?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const current = normalizeTrack(value)

  return (
    <div>
      {current ? (
        <div className="space-y-2">
          <MusicChip track={current} variant={variant} onRemove={disabled ? undefined : () => onChange(null)} />
          {!disabled && (
            <button type="button" onClick={() => setOpen(true)} className="text-xs text-garnet-400 hover:text-garnet-300 transition">
              Cambiar canción
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-ink-500 text-neutral-300 hover:border-garnet-500 hover:text-garnet-300 hover:bg-garnet-600/10 px-4 py-2 text-sm transition disabled:opacity-50"
        >
          <MusicIcon className="w-4 h-4" />
          {label}
        </button>
      )}

      <MusicPicker
        open={open}
        title={pickerTitle}
        onClose={() => setOpen(false)}
        onPick={(t: MusicTrack) => {
          onChange(toStoredTrack(t))
          setOpen(false)
        }}
      />
    </div>
  )
}
