'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import AccountsPanel from './AccountsPanel'

/** v1.8.0 · Hoja rápida «Cambiar de cuenta» (celular: sube desde abajo; PC: diálogo centrado). */
export default function AccountSwitcherSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[130] bg-black/70 flex items-end md:items-center justify-center md:px-4 sheet-backdrop" onClick={onClose}>
      <div
        className="surface-raised border border-ink-600 sheet-panel rounded-t-2xl md:rounded-2xl border-b-0 md:border-b p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-5 w-full md:max-w-md max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Cambiar de cuenta"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-50">Cambiar de cuenta</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Tus personajes y cuentas guardadas en este dispositivo.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 shrink-0 rounded-full text-neutral-400 hover:bg-ink-800 text-lg leading-none">×</button>
        </div>
        <AccountsPanel compact onDone={onClose} />
      </div>
    </div>,
    document.body
  )
}
