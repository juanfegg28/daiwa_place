'use client'

import type { CSSProperties } from 'react'
import type { PostImage } from '../lib/types'
import { CloseIcon } from './icons'

type Orientation = 'square' | 'vertical' | 'horizontal'

function orientationOf(img: PostImage): Orientation {
  const ratio = img.w / img.h
  if (ratio > 1.15) return 'horizontal'
  if (ratio < 0.87) return 'vertical'
  return 'square'
}

type Layout = {
  aspect: string // ancho / alto del contenedor completo
  columns: string
  rows: string
  // estilo extra por celda (para que la primera ocupe varias filas/columnas)
  cell: (index: number) => CSSProperties
}

/**
 * Marcos tipo Facebook (2, 3 y 4 fotos) según la forma de la PRIMERA foto:
 *  - 2 cuadradas: lado a lado · 2 verticales: lado a lado altas · 2 horizontales: una encima de otra
 *  - 3 verticales: una alta a la izquierda + 2 a la derecha · 3 cuadradas/horizontales: una ancha arriba + 2 abajo
 *  - 4 cuadradas: cuadrícula 2x2 · 4 verticales: una grande + 3 chicas a la derecha · 4 horizontales: una grande arriba + 3 chicas abajo
 */
function getLayout(count: 2 | 3 | 4, orientation: Orientation): Layout {
  const none = () => ({})

  if (count === 2) {
    if (orientation === 'horizontal') {
      return { aspect: '1 / 1', columns: '1fr', rows: '1fr 1fr', cell: none }
    }
    if (orientation === 'vertical') {
      return { aspect: '1 / 1', columns: '1fr 1fr', rows: '1fr', cell: none }
    }
    return { aspect: '2 / 1', columns: '1fr 1fr', rows: '1fr', cell: none }
  }

  if (count === 3) {
    if (orientation === 'vertical') {
      return {
        aspect: '1 / 1',
        columns: '1fr 1fr',
        rows: '1fr 1fr',
        cell: (i) => (i === 0 ? { gridRow: 'span 2' } : {}),
      }
    }
    return {
      aspect: '1 / 1',
      columns: '1fr 1fr',
      rows: '1fr 1fr',
      cell: (i) => (i === 0 ? { gridColumn: 'span 2' } : {}),
    }
  }

  // 4 fotos
  if (orientation === 'vertical') {
    return {
      aspect: '1 / 1',
      columns: '2fr 1fr',
      rows: '1fr 1fr 1fr',
      cell: (i) => (i === 0 ? { gridRow: 'span 3' } : {}),
    }
  }
  if (orientation === 'horizontal') {
    return {
      aspect: '1 / 1',
      columns: '1fr 1fr 1fr',
      rows: '2fr 1fr',
      cell: (i) => (i === 0 ? { gridColumn: 'span 3' } : {}),
    }
  }
  return { aspect: '1 / 1', columns: '1fr 1fr', rows: '1fr 1fr', cell: none }
}

/**
 * Muestra las fotos de una publicación (1 a 4).
 * - Modo normal: al tocar una foto se llama onOpen(indice) para abrir el visor.
 * - Modo edición (onRemove): muestra una X en cada foto para quitarla (vista previa al publicar).
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
  if (list.length === 0) return null

  const removeButton = (i: number) =>
    onRemove ? (
      <span
        role="button"
        tabIndex={0}
        aria-label="Quitar foto"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(i)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            onRemove(i)
          }
        }}
        className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition"
      >
        <CloseIcon className="w-4 h-4" />
      </span>
    ) : null

  // Una sola foto: se ve completa (con su proporción real, hasta un alto máximo)
  if (list.length === 1) {
    const img = list[0]
    return (
      <div className="relative rounded-xl overflow-hidden bg-ink-900">
        <button
          type="button"
          onClick={() => onOpen?.(0)}
          className="block w-full cursor-zoom-in"
          aria-label="Ver foto completa"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt="Foto de la publicación"
            loading="lazy"
            className="block w-full object-contain"
            style={{ aspectRatio: `${img.w} / ${img.h}`, maxHeight: 560 }}
          />
        </button>
        {removeButton(0)}
      </div>
    )
  }

  const count = list.length as 2 | 3 | 4
  const layout = getLayout(count, orientationOf(list[0]))

  return (
    <div
      className="grid gap-[3px] rounded-xl overflow-hidden bg-ink-900"
      style={{
        aspectRatio: layout.aspect,
        gridTemplateColumns: layout.columns,
        gridTemplateRows: layout.rows,
      }}
    >
      {list.map((img, i) => (
        <div key={img.path || img.url} className="relative min-w-0 min-h-0 overflow-hidden" style={layout.cell(i)}>
          <button
            type="button"
            onClick={() => onOpen?.(i)}
            className="absolute inset-0 w-full h-full cursor-zoom-in"
            aria-label={`Ver foto ${i + 1} completa`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={`Foto ${i + 1} de la publicación`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
          {removeButton(i)}
        </div>
      ))}
    </div>
  )
}
