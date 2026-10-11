'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreIcon } from './icons'

export type MenuItem = {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

/**
 * Menú de tres puntitos.
 *  · PC: lista desplegable junto al botón.
 *  · Celular: "bottom sheet" que sube desde abajo, con botones grandes y fáciles de tocar.
 * Se cierra al tocar afuera o con Escape.
 */
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
  const sheetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      // el bottom sheet vive fuera del botón (en document.body), por eso también se revisa
      if (ref.current?.contains(target) || sheetRef.current?.contains(target)) return
      setOpen(false)
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

  const choose = (item: MenuItem) => {
    setOpen(false)
    item.onClick()
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-100 hover:bg-ink-700 transition active:scale-95 active:opacity-80 ${
          small ? 'w-8 h-8 md:w-6 md:h-6' : 'w-9 h-9 md:w-8 md:h-8'
        }`}
      >
        <MoreIcon className={small ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>

      {/* PC: desplegable */}
      {open && (
        <div
          role="menu"
          className="hidden md:block absolute right-0 top-full mt-1 z-30 min-w-[190px] rounded-xl border border-ink-600 bg-ink-800 py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => choose(item)}
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

      {/* Celular: bottom sheet (en document.body para que ningún contenedor con efecto de cristal lo atrape) */}
      {open &&
        createPortal(
          <div className="md:hidden fixed inset-0 z-[80] bg-black/60 flex items-end sheet-backdrop" onClick={() => setOpen(false)}>
            <div
              ref={sheetRef}
              role="menu"
              aria-label={label}
              onClick={(e) => e.stopPropagation()}
              className="sheet-panel w-full rounded-t-2xl border border-b-0 border-ink-600 bg-ink-800 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.85)]"
            >
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => choose(item)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-[15px] text-left transition active:bg-ink-700 ${
                        item.danger ? 'text-garnet-400' : 'text-neutral-100'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-xl bg-ink-700 py-3 text-[15px] font-medium text-neutral-200 transition active:opacity-80"
              >
                Cancelar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
