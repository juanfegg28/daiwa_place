'use client'

import dynamic from 'next/dynamic'
import type { CSSProperties, ElementType, ReactNode } from 'react'
import { isValidHex, nameColorVars } from '../../lib/color'
import { useCosmeticFont, useCosmeticPrefs, type NameStyle } from '../../lib/cosmetics'

const NameFxLazy = dynamic(() => import('./cosmetics').then((m) => m.NameFx), { ssr: false })

/**
 * EL nombre de DaiwaPlace: color (v1.3.0) + fuente y efecto de la tienda (v1.4.0).
 *   density: 'full' (cabecera de perfil) · 'lite' (feed: efecto sin animar) · 'plain' (listas pequeñas: solo el color).
 * La persona también manda con Configuración → Apariencia → «Efectos de nombre» (completa / ligera / plana)
 * y con «reducir movimiento» de su sistema. El color se ajusta solo para que siempre se lea en tema claro y oscuro.
 * El @usuario NO pasa por aquí: siempre va en texto normal.
 */
export default function NameText({
  name,
  color,
  nameStyle,
  density = 'full',
  className = '',
  as: Tag = 'span',
  children,
}: {
  name?: string
  color?: string | null
  /** fuente + efecto equipados (columna name_style) */
  nameStyle?: NameStyle | null
  density?: 'full' | 'lite' | 'plain'
  className?: string
  as?: ElementType
  children?: ReactNode
}) {
  const prefs = useCosmeticPrefs()
  const plain = density === 'plain' || prefs.nameFx === 'plain'
  const fontSlug = !plain ? nameStyle?.font ?? null : null
  const fontFamily = useCosmeticFont(fontSlug)
  const effect = !plain && children === undefined && name ? nameStyle?.effect ?? null : null

  if (effect) {
    return (
      <Tag className={className}>
        <NameFxLazy effect={effect} text={name as string} density={density} fontFamily={fontFamily} />
      </Tag>
    )
  }
  const ok = !!color && isValidHex(color)
  const style: CSSProperties | undefined = ok || fontFamily ? { ...(ok ? (nameColorVars(color as string) as CSSProperties) : {}), ...(fontFamily ? { fontFamily } : {}) } : undefined
  return (
    <Tag className={`${ok ? 'name-colored' : ''} ${className}`} style={style}>
      {children ?? name}
    </Tag>
  )
}
