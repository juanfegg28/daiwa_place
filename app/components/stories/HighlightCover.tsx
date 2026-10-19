import { coverStyleCss, type HighlightCover as Cover } from '../../lib/stories'

/** Círculo de la portada de una destacada (foto horneada o estilo con icono) */
export default function HighlightCover({ cover, size }: { cover: Cover; size: number }) {
  if (cover.type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cover.url} alt="" draggable={false} loading="lazy" className="rounded-full object-cover bg-ink-700 shrink-0" style={{ width: size, height: size }} />
  }
  const s = coverStyleCss(cover.id)
  return (
    <span className="rounded-full shrink-0 flex items-center justify-center" style={{ width: size, height: size, background: s.background, color: s.iconColor, fontSize: size * 0.45 }}>
      {s.icon}
    </span>
  )
}
