'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Tira horizontal desplazable (fuentes, colores, categorías…):
 *  · celular: se desliza con el dedo
 *  · PC: flechas ‹ › a los lados, arrastrar con el ratón y rueda del ratón
 * Las flechas solo aparecen cuando hay más contenido escondido hacia ese lado.
 */
export default function ScrollStrip({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const t = window.setTimeout(update, 0)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      window.clearTimeout(t)
      ro.disconnect()
    }
  }, [update])

  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(120, (ref.current?.clientWidth ?? 240) * 0.7), behavior: 'smooth' })

  const arrow = 'absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-black/90 active:scale-95'

  return (
    <div className={`relative ${className}`}>
      {canLeft && (
        <button type="button" onClick={() => by(-1)} aria-label="Ver los anteriores" className={`${arrow} left-0`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
        </button>
      )}
      {canRight && (
        <button type="button" onClick={() => by(1)} aria-label="Ver más" className={`${arrow} right-0`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      )}
      <div
        ref={ref}
        onScroll={update}
        onWheel={(e) => {
          const el = ref.current
          if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || !ref.current) return
          drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          const el = ref.current
          if (!d || !el) return
          const dx = e.clientX - d.x
          if (!d.moved && Math.abs(dx) > 5) {
            d.moved = true
            el.setPointerCapture(e.pointerId)
          }
          if (d.moved) el.scrollLeft = d.left - dx
        }}
        onPointerUp={() => {
          window.setTimeout(() => (drag.current = null), 0)
        }}
        onPointerCancel={() => (drag.current = null)}
        onClickCapture={(e) => {
          // si se estaba arrastrando con el ratón, ese «clic» no debe elegir nada
          if (drag.current?.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className="flex items-center gap-1.5 overflow-x-auto pb-1 px-0.5 story-scroll-hide cursor-grab"
        style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  )
}
