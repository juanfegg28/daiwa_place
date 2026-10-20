'use client'

import type { CSSProperties, ElementType, ReactNode } from 'react'
import { isValidHex, nameColorVars } from '../../lib/color'

/**
 * EL nombre de DaiwaPlace: aplica el color de nombre que eligió la persona (v1.3.0).
 * El color se ajusta solo para que siempre se lea en el tema oscuro y en el claro.
 * Más adelante (tienda) aquí mismo se añadirán fuentes y efectos.
 *   density: 'full' (cabecera de perfil) · 'lite' (feed) · 'plain' (listas pequeñas) — por ahora igual,
 *   queda listo para los efectos animados de pago.
 */
export default function NameText({
  name,
  color,
  className = '',
  as: Tag = 'span',
  children,
}: {
  name?: string
  color?: string | null
  density?: 'full' | 'lite' | 'plain'
  className?: string
  as?: ElementType
  children?: ReactNode
}) {
  const ok = !!color && isValidHex(color)
  return (
    <Tag className={`${ok ? 'name-colored' : ''} ${className}`} style={ok ? (nameColorVars(color as string) as CSSProperties) : undefined}>
      {children ?? name}
    </Tag>
  )
}
