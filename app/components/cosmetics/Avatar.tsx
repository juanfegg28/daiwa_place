'use client'

import dynamic from 'next/dynamic'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import AvatarPhoto from '../AvatarPhoto'
import type { Equip } from '../../lib/cosmetics'

// El kit de diseños pesa: solo se descarga cuando alguien en pantalla lleva una decoración.
const DecoLayer = dynamic(() => import('./cosmetics').then((m) => m.DecoLayer), { ssr: false })

/**
 * EL avatar de DaiwaPlace (v1.3.0 → decoraciones en v1.4.0): todas las fotos de perfil de la app pasan por aquí.
 *   caja exterior (overflow visible, mide lo que mide el avatar)
 *     ├─ capa «back»  (detrás de la foto: alas, aura)
 *     ├─ foto redonda (overflow-hidden)
 *     ├─ children     (el anillo de historias, pegado al borde de la foto)
 *     ├─ capa «front» (delante: marco, corona, orejitas)
 *     └─ puntito de «conectado» (siempre por encima)
 * Sin `deco` se ve exactamente igual que antes. La decoración solo se dibuja si el avatar mide al menos el tamaño mínimo
 * de ese diseño (por debajo se ve solo la foto).
 */
export default function Avatar({
  username,
  avatarUrl,
  size = 'w-12 h-12',
  online = false,
  textSize = 'text-base',
  ring = false,
  priority = false,
  sizes = '96px',
  photoClassName = '',
  className = '',
  deco = null,
  decoContext = 'feed',
  children,
}: {
  username: string
  avatarUrl: string | null | undefined
  /** clases de Tailwind con el tamaño, p. ej. «w-12 h-12» */
  size?: string
  online?: boolean
  textSize?: string
  ring?: boolean
  priority?: boolean
  /** atributo sizes de la imagen */
  sizes?: string
  /** clases extra para el círculo de la foto (bordes, sombras…) */
  photoClassName?: string
  className?: string
  /** decoración equipada (viene en la misma consulta que el avatar; nunca se pide aparte) */
  deco?: Equip | null
  /** 'profile' = perfil abierto/estudio (se anima aunque el ajuste sea «solo en perfiles»); 'feed' = listas */
  decoContext?: 'feed' | 'profile'
  children?: ReactNode
}) {
  const initial = (username || '?').charAt(0).toUpperCase()
  const boxRef = useRef<HTMLSpanElement>(null)
  const [px, setPx] = useState(0)
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!deco || !el) return
    const read = () => setPx(el.getBoundingClientRect().width)
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [deco])

  return (
    <span ref={boxRef} className={`relative inline-block shrink-0 align-middle ${size} ${className}`}>
      {deco && px > 0 && <DecoLayer deco={deco} part="back" px={px} context={decoContext} />}
      <span
        className={`relative w-full h-full rounded-full overflow-hidden bg-ink-700 flex items-center justify-center ${
          ring ? 'ring-2 ring-garnet-500/70' : ''
        } ${photoClassName}`}
      >
        {avatarUrl ? (
          <AvatarPhoto src={avatarUrl} username={username} sizes={sizes} priority={priority} textClass={textSize} />
        ) : (
          <span className={`${textSize} font-semibold text-garnet-400`}>{initial}</span>
        )}
      </span>
      {children}
      {deco && px > 0 && <DecoLayer deco={deco} part="front" px={px} context={decoContext} />}
      {online && (
        <span
          title="Conectado"
          aria-label="Conectado"
          className="absolute z-[4] bottom-0 right-0 w-[28%] h-[28%] min-w-[9px] min-h-[9px] rounded-full bg-emerald-500 border-2 border-ink-950"
        />
      )}
    </span>
  )
}
