'use client'

// v1.10.0 · Carrusel horizontal con flechas (Sugerencias de amistad, Clubes y pandillas de Explorar, vitrinas, tienda…).
// - Las flechas solo mueven el desplazamiento del contenido que YA está cargado: no hacen ninguna petición a Supabase.
// - Solo aparecen en equipos con ratón/trackpad (CSS .carousel-arrow en globals.css); en el celular se sigue deslizando con el dedo.
// - Se ocultan solas si todo cabe, y se atenúan/deshabilitan (aria-disabled) al llegar al principio o al final.
// - Teclado: las flechas son botones (Tab + Enter/Espacio) y, con el foco dentro del carrusel, ← y → desplazan.
// - Lectores de pantalla: grupo con «carrusel» + nombre, botones con etiqueta propia; respeta «reducir movimiento».
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

type Props = {
  children: ReactNode
  /** Nombre del carrusel para lectores de pantalla (p. ej. «Personas que quizás conozcas») */
  label: string
  /** Clases del contenedor que desliza (flex, gap, snap, padding, márgenes negativos…) */
  className?: string
  /** Clases extra del contenedor exterior (el que lleva las flechas) */
  wrapperClassName?: string
  /** Fracción del ancho visible que avanza cada clic (0–1) */
  step?: number
  prevLabel?: string
  nextLabel?: string
}

const ARROW =
  'carousel-arrow absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center ' +
  'bg-ink-900/90 border border-ink-600 text-neutral-200 shadow-lg backdrop-blur-sm transition ' +
  'opacity-70 group-hover/carousel:opacity-100 focus-visible:opacity-100 hover:bg-garnet-600 hover:border-garnet-500 hover:text-white ' +
  'aria-disabled:opacity-25 aria-disabled:cursor-default aria-disabled:hover:bg-ink-900/90 aria-disabled:hover:border-ink-600 aria-disabled:hover:text-neutral-200'

export default function ScrollCarousel({
  children,
  label,
  className = 'flex gap-3 overflow-x-auto snap-x pb-2 [scrollbar-width:none]',
  wrapperClassName = '',
  step = 0.8,
  prevLabel = 'Anterior',
  nextLabel = 'Siguiente',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const [edge, setEdge] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const left = el.scrollLeft > 2
    const right = max > 2 && el.scrollLeft < max - 2
    setEdge((p) => (p.left === left && p.right === right ? p : { left, right }))
  }, [])

  // Cada vez que cambian los hijos (carga de la lista, seguir/ocultar a alguien…) se vuelve a medir. Solo hace setState si cambió algo.
  useLayoutEffect(() => {
    measure()
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const onChange = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        measure()
      })
    }
    el.addEventListener('scroll', onChange, { passive: true })
    window.addEventListener('resize', onChange)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onChange) : null
    ro?.observe(el)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      el.removeEventListener('scroll', onChange)
      window.removeEventListener('resize', onChange)
      ro?.disconnect()
    }
  }, [measure])

  const go = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    if (dir === 1 ? !edge.right : !edge.left) return
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * step), behavior: reduce ? 'auto' : 'smooth' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const t = e.target as HTMLElement
    if (t.closest('input, textarea, select, [contenteditable="true"]')) return
    e.preventDefault()
    go(e.key === 'ArrowRight' ? 1 : -1)
  }

  const overflowing = edge.left || edge.right
  return (
    <div
      className={`relative group/carousel ${wrapperClassName}`}
      role="group"
      aria-roledescription="carrusel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div ref={ref} id={id} className={className}>
        {children}
      </div>
      {overflowing && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={prevLabel} aria-controls={id} aria-disabled={!edge.left} className={`${ARROW} left-1`}>
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label={nextLabel} aria-controls={id} aria-disabled={!edge.right} className={`${ARROW} right-1`}>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )
}
