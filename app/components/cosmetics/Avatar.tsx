'use client'

import type { ReactNode } from 'react'
import AvatarPhoto from '../AvatarPhoto'

/**
 * EL avatar de DaiwaPlace (v1.3.0): todas las fotos de perfil de la app pasan por aquí.
 * Estructura pensada para las decoraciones animadas de la tienda (v1.4.0):
 *   caja exterior (overflow visible, mide lo que mide el avatar)
 *     ├─ capa «back»  (detrás de la foto: alas, aura)  ← aquí irá la decoración
 *     ├─ foto redonda (overflow-hidden)
 *     ├─ capa «front» (delante: marco, corona)         ← aquí irá la decoración
 *     └─ puntito de «conectado»
 * Los hijos (children) se dibujan encima de la foto (p. ej. el anillo de historias).
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
  children?: ReactNode
}) {
  const initial = (username || '?').charAt(0).toUpperCase()
  return (
    <span className={`relative inline-block shrink-0 align-middle ${size} ${className}`}>
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
      {online && (
        <span
          title="Conectado"
          aria-label="Conectado"
          className="absolute bottom-0 right-0 w-[28%] h-[28%] min-w-[9px] min-h-[9px] rounded-full bg-emerald-500 border-2 border-ink-950"
        />
      )}
    </span>
  )
}
