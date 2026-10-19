'use client'

import { memo, type CSSProperties, type ReactNode } from 'react'
import type { MusicTrack } from '../../lib/music'
import { bgToCss, type StoryBg, type StoryElement } from '../../lib/stories'
import TextElement from './elements/TextElement'
import EmojiElement from './elements/EmojiElement'
import MusicSticker, { type MusicCtx } from './elements/MusicSticker'
import LocationSticker from './elements/LocationSticker'
import TimeSticker from './elements/TimeSticker'

/** Estilo de posición de una capa: x/y en % del escenario (referidas al centro), giro y escala */
export function elementBoxStyle(el: Pick<StoryElement, 'x' | 'y' | 'scale' | 'rotation' | 'z'>): CSSProperties {
  return {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    zIndex: el.z,
    transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
    transformOrigin: 'center',
  }
}

/** Lo que hay DENTRO de una capa (sin posicionarla) */
export function StoryElementView({ el, ctx, animate = true }: { el: StoryElement; ctx: MusicCtx; animate?: boolean }) {
  switch (el.type) {
    case 'text':
      return <TextElement el={el} />
    case 'emoji':
      return <EmojiElement el={el} />
    case 'music':
      return <MusicSticker el={el} ctx={ctx} />
    case 'location':
      return <LocationSticker el={el} />
    case 'time':
      return <TimeSticker el={el} animate={animate} />
    default:
      return null
  }
}

/**
 * El escenario 9:16 con `container-type: size`: todo lo de adentro se mide relativo a esta caja
 * (cqw = 1 % de su ancho). Ocupa el 100 % del ancho de su contenedor, que debe tener relación 9:16.
 */
export function StageFrame({
  bg,
  mediaUrl,
  children,
  className = '',
  style,
}: {
  bg: StoryBg | null
  mediaUrl?: string | null
  children?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{ aspectRatio: '9 / 16', containerType: 'size', background: mediaUrl ? '#0c0c0f' : bgToCss(bg), ...style }}
    >
      {mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" draggable={false} decoding="async" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      )}
      {children}
    </div>
  )
}

/** Escenario de solo lectura (visor, vistas previas y editor comparten esta misma pintura) */
function StoryCanvasBase({
  bg,
  mediaUrl,
  elements,
  track,
  playing = false,
  progress = 0,
  animate = true,
  className,
  style,
  children,
}: {
  bg: StoryBg | null
  mediaUrl?: string | null
  elements: StoryElement[]
  track: MusicTrack | null
  playing?: boolean
  progress?: number
  animate?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  const ctx: MusicCtx = { track, playing, progress }
  const sorted = [...elements].sort((a, b) => a.z - b.z)
  return (
    <StageFrame bg={bg} mediaUrl={mediaUrl} className={className} style={style}>
      {sorted.map((el) => (
        <div key={el.id} style={elementBoxStyle(el)}>
          <StoryElementView el={el} ctx={ctx} animate={animate} />
        </div>
      ))}
      {children}
    </StageFrame>
  )
}

const StoryCanvas = memo(StoryCanvasBase)
export default StoryCanvas
