'use client'

// v1.10.0 · ItemPreview = cáscara ligera (tipos, «lazy» por cercanía a la pantalla y reposo/animación). El dibujo real vive en
// ItemPreviewBody.tsx y se descarga solo cuando la miniatura se va a mostrar: así el kit de cosméticos (≈650 KB) deja de viajar en el
// JavaScript inicial de la tienda, el inventario, el closet y Supporter → Estilos.
import dynamic from 'next/dynamic'
import type { CosmeticType } from '../../lib/cosmetics'
import { PlayCtx, useSeenOnce } from './usePlay'

const Preview = dynamic(() => import('./ItemPreviewBody'), { ssr: false, loading: () => <div aria-hidden="true" style={{ minHeight: 96 }} /> })

export type PreviewSubject = { username: string; name: string; avatarUrl: string | null; bio?: string | null; bannerUrl?: string | null }

export type ItemPreviewProps = {
  type: CosmeticType
  slug: string
  palette?: string
  hue?: number
  me: PreviewSubject
  /** slug de fuente (solo para type = font) */
  font?: string
  compact?: boolean
  /** false = en reposo (sin animación). Por defecto se anima (hoja de detalle, estudio). Las cuadrículas pasan el estado del cursor. */
  playing?: boolean
  /** cuadrículas largas: no dibuja la miniatura hasta que se acerca a la pantalla */
  lazy?: boolean
}

/**
 * Cómo se ve un cosmético SOBRE TI (tu foto y tu nombre, no un maniquí).
 * v1.4.5: en cuadrículas se dibuja solo lo cercano a la pantalla (`lazy`) y queda quieto hasta que lo señalas (`playing`).
 */
export default function ItemPreview({ playing = true, lazy = false, ...p }: ItemPreviewProps) {
  const [ref, seen] = useSeenOnce<HTMLDivElement>(lazy)
  return (
    <div ref={ref} className={`w-full h-full ${playing ? '' : 'pv-idle'}`} style={seenFallback(seen)}>
      {seen && (
        <PlayCtx.Provider value={playing}>
          <Preview {...p} playing={playing} />
        </PlayCtx.Provider>
      )}
    </div>
  )
}
const seenFallback = (seen: boolean) => (seen ? undefined : { minHeight: 96 })

