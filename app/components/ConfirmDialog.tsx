'use client'

import { useEffect } from 'react'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center md:px-4 sheet-backdrop"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        className="surface-raised border border-ink-600 sheet-panel rounded-t-2xl md:rounded-2xl border-b-0 md:border-b p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-5 w-full md:max-w-sm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <h2 className="text-base font-semibold text-neutral-50 mb-1.5">{title}</h2>
        <p className="text-sm text-neutral-400 mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-3 md:py-2 text-sm hover:bg-ink-800 transition active:scale-95 active:opacity-80 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-3 md:py-2 text-sm font-medium transition active:scale-95 active:opacity-80 disabled:opacity-60"
          >
            {busy ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
