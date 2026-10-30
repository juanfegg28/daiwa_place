'use client'

import { useEffect } from 'react'

export default function Toast({ message, onClose, tone = 'ok' }: { message: string | null; onClose: () => void; tone?: 'ok' | 'error' }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 3800)
    return () => clearTimeout(t)
  }, [message, onClose])
  if (!message) return null
  return (
    <div
      role="status"
      className={`fixed inset-x-0 mx-auto w-fit bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-[70] max-w-[92vw] text-center px-4 py-2.5 rounded-xl text-sm shadow-xl border ${
        tone === 'error' ? 'bg-red-950/90 border-red-800 text-red-100' : 'bg-ink-800 border-ink-600 text-neutral-100'
      }`}
    >
      {message}
    </div>
  )
}
