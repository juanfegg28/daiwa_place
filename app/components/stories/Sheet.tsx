'use client'

import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from '../icons'

/**
 * Hoja de las pantallas de historias (siempre oscura, como el visor y el editor).
 * Celular: sube desde abajo. PC: diálogo centrado, o panel lateral derecho si side = true.
 */
export default function Sheet({
  open,
  onClose,
  title,
  children,
  side = false,
  tall = false,
  footer,
  z = 130,
  noClose = false,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: boolean
  tall?: boolean
  footer?: ReactNode
  z?: number
  noClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className={`fixed inset-0 flex ${side ? 'items-end md:items-stretch md:justify-end' : 'items-end md:items-center justify-center md:px-4'} bg-black/60`}
      style={{ zIndex: z, animation: 'daiwa-fade .18s ease-out' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex flex-col w-full bg-[#17171b] text-neutral-100 border border-white/10 shadow-2xl ${
          side
            ? 'rounded-t-2xl max-h-[75dvh] h-[75dvh] md:h-full md:max-h-none md:w-[380px] md:rounded-none md:rounded-l-2xl'
            : `rounded-t-2xl md:rounded-2xl md:max-w-md ${tall ? 'max-h-[92dvh] md:max-h-[88dvh] h-[92dvh] md:h-auto' : 'max-h-[88dvh]'}`
        }`}
        style={{ animation: 'daiwa-sheet-up .22s cubic-bezier(.22,1,.36,1)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {(title || !noClose) && (
          <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 shrink-0">
            <h2 className="text-[15px] font-semibold text-neutral-50 truncate">{title}</h2>
            {!noClose && (
              <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10">
                <CloseIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 story-scroll-hide">{children}</div>
        {footer && <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/10">{footer}</div>}
      </div>
    </div>
  )
}
