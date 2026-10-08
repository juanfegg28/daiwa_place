'use client'

import { useEffect, useState } from 'react'
import type { PostImage } from '../lib/types'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './icons'

/** Visor de fotos a pantalla completa: muestra la foto entera, sin recortes. */
export default function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: PostImage[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const total = images.length

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + total) % total)
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % total)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [total, onClose])

  const current = images[index]
  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
      >
        <CloseIcon className="w-5 h-5" />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/80 bg-black/50 rounded-full px-3 py-1">
            {index + 1} / {total}
          </div>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async"
        src={current.url}
        alt={`Foto ${index + 1} de ${total}`}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[94vw] max-h-[88vh] object-contain select-none"
        draggable={false}
      />
    </div>
  )
}
