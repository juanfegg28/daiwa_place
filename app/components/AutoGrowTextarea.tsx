'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string
}

/**
 * Textarea que crece a medida que escribes, para que el texto nunca quede recortado
 * en una cajita chiquita. Si el texto es larguísimo, la caja deja de crecer en el
 * límite de altura (max-h) y a partir de ahí hace scroll por dentro.
 */
export default function AutoGrowTextarea({ value, className = '', rows = 3, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const cs = window.getComputedStyle(el)
    const border = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
    el.style.height = `${el.scrollHeight + border}px`
  }, [])

  // Cada vez que cambia el texto (o se vacía al publicar) se recalcula la altura
  useLayoutEffect(() => {
    resize()
  }, [value, resize])

  // Si cambia el ancho (girar el celular, redimensionar la ventana) el texto se re-acomoda
  useEffect(() => {
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={rows}
      className={`overflow-y-auto ${className}`}
      {...props}
    />
  )
}
