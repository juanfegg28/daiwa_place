'use client'

import ResilientImage from './ResilientImage'

/** La foto dentro de un círculo de perfil; si no carga, se queda la inicial del usuario. */
export default function AvatarPhoto({
  src,
  username,
  sizes,
  priority = false,
  textClass = 'text-sm',
}: {
  src: string
  username: string
  sizes: string
  priority?: boolean
  textClass?: string
}) {
  return (
    <ResilientImage
      src={src}
      alt={username}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      fallback={
        <span className={`absolute inset-0 flex items-center justify-center font-semibold text-garnet-400 ${textClass}`}>
          {(username || '?').charAt(0).toUpperCase()}
        </span>
      }
    />
  )
}
