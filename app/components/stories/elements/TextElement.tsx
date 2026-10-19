import type { CSSProperties } from 'react'
import { readableOn, type StoryText, type TextFont } from '../../../lib/stories'

const FONT: Record<TextFont, CSSProperties> = {
  clasica: { fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 700 },
  maquina: { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', fontWeight: 600, letterSpacing: '0.02em' },
  elegante: { fontFamily: 'var(--font-playfair), Georgia, serif', fontStyle: 'italic', fontWeight: 600 },
  fuerte: { fontFamily: 'var(--font-anton), Impact, sans-serif', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.02em' },
  manuscrita: { fontFamily: 'var(--font-caveat), cursive', fontWeight: 700 },
  cinzel: { fontFamily: 'var(--font-cinzel), serif', fontWeight: 700 },
  neon: { fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 600 },
  marcador: { fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 700 },
}

/** Estilo CSS de una capa de texto. Se usa igual en el escenario y en las muestras del editor. */
export function textStyle(el: Pick<StoryText, 'font' | 'color' | 'bgMode' | 'bgColor' | 'align' | 'size'>, sizeUnit = 'cqw'): CSSProperties {
  const boxColor = el.bgColor ?? el.color
  const size = el.font === 'manuscrita' ? el.size * 1.2 : el.size
  const base: CSSProperties = {
    ...FONT[el.font],
    fontSize: `${size}${sizeUnit}`,
    lineHeight: 1.15,
    textAlign: el.align,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    color: el.color,
  }
  if (el.bgMode === 'none') {
    base.textShadow = '0 1px 8px rgba(0,0,0,.35)'
    if (el.font === 'neon') base.textShadow = '0 0 .15em currentColor, 0 0 .5em currentColor, 0 0 1em currentColor'
  } else if (el.bgMode === 'solid') {
    base.background = boxColor
    base.color = readableOn(boxColor)
    base.padding = '0.18em 0.45em'
    base.borderRadius = '0.35em'
    base.boxDecorationBreak = 'clone'
    base.WebkitBoxDecorationBreak = 'clone'
  } else if (el.bgMode === 'soft') {
    base.background = `${boxColor}8c`
    base.color = readableOn(boxColor)
    base.backdropFilter = 'blur(6px)'
    base.padding = '0.18em 0.45em'
    base.borderRadius = '0.35em'
  } else {
    base.border = `0.12em solid ${el.color}`
    base.padding = '0.15em 0.4em'
    base.borderRadius = '0.35em'
  }
  return base
}

export default function TextElement({ el }: { el: StoryText }) {
  return (
    <div
      className={el.font === 'neon' && el.bgMode === 'none' ? 'story-neon-glow' : undefined}
      style={{ ...textStyle(el), maxWidth: '84cqw', width: 'max-content' }}
    >
      {el.text}
    </div>
  )
}
