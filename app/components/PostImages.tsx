'use client'

import { useEffect, useRef, useState } from 'react'
import type { PostImage } from '../lib/types'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './icons'

const MAX_HEIGHT_VH = 0.62 // nunca más del 62% del alto de la ventana
const MAX_HEIGHT_PX = 620 // tope absoluto, para monitores muy altos

/**
 * Carrusel de fotos estilo Instagram (1 a 4): una foto visible a la vez, con
 * flechas para mouse en escritorio y deslizamiento táctil en móvil. Respeta
 * la proporción real de cada foto (sin recortes) y el alto del contenedor se
 * anima suavemente al cambiar de foto, limitado al alto de la ventana para
 * que el nombre del autor y la barra de interacción siempre queden visibles.
 *
 * - Modo normal: al tocar la foto se llama onOpen(indice) para abrir el visor.
 * - Modo edición (onRemove): muestra una X para quitar la foto actual (composer).
 */
export default function PostImages({
  images,
  onOpen,
  onRemove,
}: {
  images: PostImage[]
  onOpen?: (index: number) => void
  onRemove?: (index: number) => void
}) {
  const list = images.slice(0, 4)
  const total = list.length
  const [index, setIndex] = useState(0)
  const [height, setHeight] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const safeIndex = Math.min(index, Math.max(0, total - 1))
  const current = list[safeIndex]

  const recomputeHeight = () => {
    const el = containerRef.current
    if (!el || !current) return
    const width = el.offsetWidth
    const ratio = current.w / current.h || 1
    const maxH = Math.min(window.innerHeight * MAX_HEIGHT_VH, MAX_HEIGHT_PX)
    setHeight(Math.min(width / ratio, maxH))
  }

  useEffect(() => {
    recomputeHeight()
    window.addEventListener('resize', recomputeHeight)
    return () => window.removeEventListener('resize', recomputeHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, current?.url])

  if (total === 0 || !current) return null

  const goPrev = (e?: React.SyntheticEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i - 1 + total) % total)
  }
  const goNext = (e?: React.SyntheticEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i + 1) % total)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx > 0) goPrev()
    else goNext()
  }

  const handleRemove = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    onRemove?.(safeIndex)
    setIndex((i) => Math.max(0, Math.min(i, total - 2)))
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="group relative rounded-xl overflow-hidden bg-ink-900 select-none transition-[height] duration-300 ease-out"
      style={{ height: height ?? undefined }}
    >
      <button
        type="button"
        onClick={() => onOpen?.(safeIndex)}
        className="absolute inset-0 w-full h-full flex items-center justify-center cursor-zoom-in"
        aria-label={`Ver foto ${safeIndex + 1} de ${total}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={`Foto ${safeIndex + 1} de ${total}`}
          draggable={false}
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </button>

      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Quitar foto"
          onClick={handleRemove}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleRemove(e)
            }
          }}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition"
        >
          <CloseIcon className="w-4 h-4" />
        </span>
      )}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Foto anterior"
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white items-center justify-center transition opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Foto siguiente"
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white items-center justify-center transition opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          <div
            className={`absolute left-2 bg-black/60 text-white text-[11px] rounded-full px-2 py-0.5 z-10 ${
              onRemove ? 'bottom-2' : 'top-2'
            }`}
          >
            {safeIndex + 1}/{total}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {list.map((img, i) => (
              <button
                key={img.path || img.url}
                type="button"
                aria-label={`Ir a la foto ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setIndex(i)
                }}
                className={`w-1.5 h-1.5 rounded-full transition ${i === safeIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
