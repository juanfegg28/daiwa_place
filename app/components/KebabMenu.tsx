'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreIcon } from './icons'

export type MenuItem = {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

/** Menú de tres puntitos con lista desplegable. Se cierra al hacer clic afuera o con Escape. */
export default function KebabMenu({
  items,
  label = 'Más opciones',
  small = false,
}: {
  items: MenuItem[]
  label?: string
  small?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-100 hover:bg-ink-700 transition ${
          small ? 'w-6 h-6' : 'w-8 h-8'
        }`}
      >
        <MoreIcon className={small ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 min-w-[190px] rounded-xl border border-ink-600 bg-ink-800 py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition hover:bg-ink-700 ${
                item.danger ? 'text-garnet-400' : 'text-neutral-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
