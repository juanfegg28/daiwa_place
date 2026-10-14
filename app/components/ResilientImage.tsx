'use client'

import Image, { type ImageProps } from 'next/image'
import { useState, type ReactNode } from 'react'

type Props = ImageProps & {
  /** Qué mostrar si la foto no carga de ninguna manera (por defecto, un aviso discreto) */
  fallback?: ReactNode
}

function Inner({ fallback, unoptimized, onError, alt, ...rest }: Props) {
  // 0 = normal (con el optimizador de Next/Vercel) · 1 = reintento directo desde el almacenamiento · 2 = no cargó
  const [stage, setStage] = useState<0 | 1 | 2>(0)

  if (stage === 2) {
    return (
      <>
        {fallback ?? (
          <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-neutral-500">
            No se pudo cargar la foto
          </span>
        )}
      </>
    )
  }

  return (
    <Image
      {...rest}
      alt={alt}
      unoptimized={unoptimized || stage === 1}
      onError={(e) => {
        onError?.(e)
        setStage((s) => (s === 0 && !unoptimized ? 1 : 2))
      }}
    />
  )
}

/**
 * Igual que next/image, pero si la foto falla (por ejemplo, porque el optimizador de imágenes de Vercel
 * se quedó sin cupo o hubo un corte de red) la vuelve a pedir directo al almacenamiento, y si tampoco
 * carga muestra un respaldo en lugar del texto alternativo roto.
 */
export default function ResilientImage(props: Props) {
  return <Inner key={typeof props.src === 'string' ? props.src : 'static'} {...props} />
}
