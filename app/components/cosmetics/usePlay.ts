'use client'
import { createContext, useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react'

/** v1.4.5: las miniaturas de la tienda y del clóset se quedan quietas y solo se animan con el cursor encima (o al tocarlas).
 *  ItemPreview envuelve su contenido con esto: `false` = en reposo (sin animación y sin gastar cupo), `true` = animar, `null` = no es una miniatura. */
export const PlayCtx = createContext<boolean | null>(null)

/**
 * v1.4.5 · «Se anima solo si lo señalas».
 * PC: la miniatura se anima mientras el cursor está encima (o con el foco del teclado).
 * Celular: no hay cursor, así que NO se anima sola; `forced` la anima cuando la persona la toca/selecciona
 * (en la tienda el toque abre la hoja de detalle, que sí se anima; en el clóset se anima la prenda elegida).
 */
export function useHoverPlay(forced = false) {
  const [hot, setHot] = useState(false)
  const bind = {
    onPointerEnter: (e: PointerEvent) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setHot(true) },
    onPointerLeave: () => setHot(false),
    onFocus: (e: FocusEvent) => { if ((e.target as HTMLElement).matches?.(':focus-visible')) setHot(true) },
    onBlur: () => setHot(false),
  }
  return { playing: hot || forced, bind }
}

/** Se vuelve true (y se queda así) la primera vez que el elemento se acerca a la pantalla: las tarjetas lejanas no se dibujan todavía. */
export function useSeenOnce<T extends Element>(enabled: boolean, margin = '240px'): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(!enabled)
  useEffect(() => {
    if (!enabled || seen) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setSeen(true), 0)
      return () => clearTimeout(t)
    }
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setSeen(true); io.disconnect() } }, { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [enabled, seen, margin])
  return [ref, seen]
}

/** Escala un contenido de tamaño fijo (side × side px) para que quepa en el ancho disponible, sin recortarlo (alas, llamas, anillos…). */
export function useFitScale(side: number, gap = 10): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [k, setK] = useState(1)
  const read = useCallback(() => {
    const el = ref.current
    if (!el || !el.clientWidth) return
    setK(Math.min(1, Math.max(0.25, (el.clientWidth - gap * 2) / side)))
  }, [side, gap])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [read])
  return [ref, k]
}
