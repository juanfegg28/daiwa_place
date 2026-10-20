'use client'

import type { ReactNode } from 'react'
import { cardStyle } from '../../lib/color'

/**
 * La tarjeta del perfil (v1.3.0): una sola superficie que envuelve biografía, canción, identidad, chips y contadores.
 * Si la persona eligió un color de tarjeta se aplica (sólida · degradado · vidrio). Sin color, se ve casi como antes.
 * Más adelante (tienda) los estilos animados de pago se aplican sobre esta misma superficie.
 */
export default function ProfileCard({
  color,
  mode,
  children,
  className = '',
}: {
  color?: string | null
  mode?: string | null
  children: ReactNode
  className?: string
}) {
  const style = cardStyle(color, mode)
  return (
    <div
      className={`relative rounded-2xl px-4 py-4 mb-5 ${style ? 'border' : ''} ${className}`}
      style={style}
    >
      {/* capa interior: garantiza que el texto siempre se lea, sea cual sea el color elegido */}
      {style && <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-ink-950/45 pointer-events-none" />}
      <div className="relative">{children}</div>
    </div>
  )
}
