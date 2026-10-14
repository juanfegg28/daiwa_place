'use client'

import type { RefObject } from 'react'
import type { FormatMarker, MentionFieldHandle } from './MentionField'

const BUTTONS: { marker: FormatMarker; label: string; title: string; cls: string }[] = [
  { marker: '**', label: 'B', title: 'Negrita (Ctrl + B)', cls: 'font-bold' },
  { marker: '*', label: 'I', title: 'Cursiva (Ctrl + I)', cls: 'italic font-serif' },
  { marker: '__', label: 'U', title: 'Subrayado (Ctrl + U)', cls: 'underline underline-offset-2' },
]

/**
 * Tres botones para dar formato al texto de una publicación: negrita, cursiva y subrayado.
 * Funcionan sobre lo que tengas seleccionado (o abren la marca para que escribas adentro).
 */
export default function FormatToolbar({
  target,
  disabled = false,
  className = '',
}: {
  target: RefObject<MentionFieldHandle | null>
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} role="group" aria-label="Formato del texto">
      {BUTTONS.map((b) => (
        <button
          key={b.marker}
          type="button"
          title={b.title}
          aria-label={b.title}
          disabled={disabled}
          // mousedown (y no click) para que el texto no pierda la selección al darle formato
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => target.current?.wrap(b.marker)}
          className={`w-8 h-8 rounded-full text-[15px] leading-none text-neutral-400 hover:text-garnet-400 hover:bg-ink-700 disabled:opacity-40 transition ${b.cls}`}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
