'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { MusicTrack } from '../../../lib/music'
import type { MusicStyle, MusicTheme, StoryMusicEl } from '../../../lib/stories'
import { coverColors } from '../../../lib/storyBake'

export type MusicCtx = {
  track: MusicTrack | null
  /** el audio está sonando ahora mismo (mueve el ecualizador y el vinilo) */
  playing: boolean
  /** 0–1: avance del fragmento (para la barra del reproductor) */
  progress: number
  /** solo en el editor: la canción no tiene fragmento de audio */
  noAudio?: boolean
}

function glassFor(theme: MusicTheme, colors: string[] | null): CSSProperties {
  if (theme === 'dark') return { background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid rgba(255,255,255,.14)' }
  if (theme === 'accent') return { background: 'linear-gradient(135deg, var(--color-garnet-500), var(--color-garnet-700))', border: '1px solid rgba(255,255,255,.2)' }
  if (theme === 'cover' && colors) return { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, border: '1px solid rgba(255,255,255,.2)' }
  if (theme === 'cover') return { background: 'linear-gradient(135deg, var(--color-garnet-500), var(--color-garnet-700))', border: '1px solid rgba(255,255,255,.2)' }
  return { background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid rgba(255,255,255,.28)' }
}

const TEXT_SHADOW = '0 1px 1px rgba(0,0,0,.35)'

function Cover({ track, size, round, ring }: { track: MusicTrack; size: number; round?: boolean; ring?: boolean }) {
  const [failed, setFailed] = useState(false)
  const style: CSSProperties = {
    width: `${size}cqw`,
    height: `${size}cqw`,
    borderRadius: round ? '50%' : `${size * 0.18}cqw`,
    flexShrink: 0,
    background: 'var(--color-ink-700)',
    boxShadow: ring ? '0 0 0 0.35cqw rgba(255,255,255,.9)' : '0 0.6cqw 2cqw rgba(0,0,0,.3)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: `${size * 0.45}cqw`,
  }
  if (!track.cover || failed) return <div style={style}>♪</div>
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={track.cover} alt="" draggable={false} onError={() => setFailed(true)} style={{ ...style, objectFit: 'cover' }} />
}

function Eq({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '0.5cqw', height: '3.4cqw' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="music-eq-bar"
          style={{ width: '0.7cqw', height: '3.4cqw', animationPlayState: playing ? 'running' : 'paused', transform: playing ? undefined : 'scaleY(0.35)' }}
        />
      ))}
    </span>
  )
}

function Line({ children, size, weight = 400, opacity = 1, extra }: { children: ReactNode; size: number; weight?: number; opacity?: number; extra?: CSSProperties }) {
  return (
    <div
      style={{ fontSize: `${size}cqw`, fontWeight: weight, opacity, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: TEXT_SHADOW, lineHeight: 1.25, ...extra }}
    >
      {children}
    </div>
  )
}

export default function MusicSticker({ el, ctx }: { el: StoryMusicEl; ctx: MusicCtx }) {
  const track = ctx.track
  const [colors, setColors] = useState<string[] | null>(null)
  const needsColors = el.theme === 'cover'
  useEffect(() => {
    let alive = true
    if (!needsColors || !track?.cover) return
    coverColors(track.cover).then((c) => {
      if (alive) setColors(c)
    })
    return () => {
      alive = false
    }
  }, [needsColors, track?.cover])

  if (!track) return null
  const glass = glassFor(el.theme, colors)
  const style: MusicStyle = el.style
  const noAudio = ctx.noAudio ? (
    <span style={{ fontSize: '2.2cqw', background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: '99px', padding: '0.3cqw 1.4cqw' }}>Sin audio</span>
  ) : null
  const common: CSSProperties = { color: '#fff', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }

  if (style === 'pill') {
    return (
      <div style={{ ...common, ...glass, height: '8cqw', maxWidth: '70cqw', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '2cqw', padding: '0 3.2cqw 0 1cqw', width: 'max-content' }}>
        <Cover track={track} size={6} round ring />
        <Line size={3.2} weight={700}>♪ {track.title}{track.artist ? ` · ${track.artist}` : ''}</Line>
        {noAudio}
      </div>
    )
  }

  if (style === 'vinyl') {
    return (
      <div style={{ ...common, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2cqw', width: '56cqw' }}>
        <div style={{ position: 'relative', width: '38cqw', height: '38cqw', borderRadius: '50%', boxShadow: '0 1.2cqw 4cqw rgba(0,0,0,.45)' }}>
          <div
            className="music-vinyl-spin"
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'repeating-radial-gradient(circle at center, #0b0b0d 0 0.5cqw, #1d1d21 0.5cqw 1cqw)',
              animationPlayState: ctx.playing ? 'running' : 'paused',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: '40%', height: '40%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
              <Cover track={track} size={15.2} round />
              <span style={{ position: 'absolute', left: '50%', top: '50%', width: '1.6cqw', height: '1.6cqw', borderRadius: '50%', background: '#0c0c0f', transform: 'translate(-50%,-50%)' }} />
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,.22) 0%, transparent 38%, transparent 62%, rgba(255,255,255,.1) 100%)', pointerEvents: 'none' }} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: '100%' }}>
          <Line size={4} weight={700}>{track.title}</Line>
          <Line size={3.1} opacity={0.8}>{track.artist}</Line>
        </div>
        {noAudio}
      </div>
    )
  }

  if (style === 'minimal-text') {
    return (
      <div style={{ ...common, textAlign: 'center', maxWidth: '70cqw', width: 'max-content' }}>
        <div style={{ fontSize: '4cqw', lineHeight: 1, textShadow: TEXT_SHADOW }}>♪</div>
        <div style={{ fontSize: '6cqw', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1, textShadow: '0 0.3cqw 2cqw rgba(0,0,0,.4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {track.title}
        </div>
        <div style={{ fontSize: '2.8cqw', fontVariant: 'small-caps', letterSpacing: '0.18em', opacity: 0.9, marginTop: '0.8cqw', textShadow: TEXT_SHADOW }}>{track.artist}</div>
        {noAudio}
      </div>
    )
  }

  if (style === 'polaroid') {
    return (
      <div style={{ width: '46cqw', background: '#FAF7F2', borderRadius: '1.2cqw', padding: '2.5cqw 2.5cqw 0', boxShadow: '0 1.2cqw 4cqw rgba(0,0,0,.4)', transform: 'rotate(-3deg)', position: 'relative', color: '#1B1B20' }}>
        <span style={{ position: 'absolute', left: '-3cqw', top: '-1.6cqw', width: '14cqw', height: '4.4cqw', background: 'rgba(255,240,200,.65)', transform: 'rotate(-32deg)', boxShadow: '0 0.2cqw 0.6cqw rgba(0,0,0,.15)' }} />
        <Cover track={track} size={41} />
        <div style={{ padding: '2cqw 0.5cqw 3cqw', minHeight: '13cqw' }}>
          <div style={{ fontFamily: 'var(--font-caveat), cursive', fontWeight: 700, fontSize: '5.6cqw', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1B1B20' }}>{track.title}</div>
          <div style={{ fontSize: '2.7cqw', color: '#6b6b73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
        </div>
        {noAudio && <div style={{ position: 'absolute', right: '2cqw', bottom: '2cqw' }}>{noAudio}</div>}
      </div>
    )
  }

  if (style === 'player') {
    return (
      <div style={{ ...common, width: '66cqw', borderRadius: '4cqw', padding: '3cqw', background: 'rgba(12,12,15,.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.6cqw' }}>
          <Cover track={track} size={12} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Line size={3.6} weight={700}>{track.title}</Line>
            <Line size={2.9} opacity={0.75}>{track.artist}</Line>
          </div>
          {noAudio}
        </div>
        <div style={{ height: '0.7cqw', borderRadius: '99px', background: 'rgba(255,255,255,.22)', margin: '3cqw 0 2cqw', overflow: 'hidden' }}>
          <div style={{ width: `${Math.round(Math.min(1, Math.max(0, ctx.progress)) * 100)}%`, height: '100%', background: '#fff', borderRadius: '99px', transition: 'width .1s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6cqw', opacity: 0.6 }}>
          <svg viewBox="0 0 24 24" style={{ width: '4.4cqw', height: '4.4cqw' }} fill="#fff"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
          <svg viewBox="0 0 24 24" style={{ width: '5.4cqw', height: '5.4cqw' }} fill="#fff"><path d="M8 5v14l11-7z" /></svg>
          <svg viewBox="0 0 24 24" style={{ width: '4.4cqw', height: '4.4cqw' }} fill="#fff"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
        </div>
      </div>
    )
  }

  // cover-card (el clásico)
  return (
    <div style={{ ...common, ...glass, width: '64cqw', borderRadius: '5cqw', padding: '3cqw', display: 'flex', alignItems: 'center', gap: '3cqw', position: 'relative' }}>
      <Cover track={track} size={14} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <Line size={3.8} weight={700}>{track.title}</Line>
        <Line size={3.1} opacity={0.8}>{track.artist}</Line>
      </div>
      <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '1.4cqw' }}>
        {noAudio}
        <Eq playing={ctx.playing} />
      </div>
    </div>
  )
}
