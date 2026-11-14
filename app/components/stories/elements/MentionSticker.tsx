import type { CSSProperties } from 'react'
import type { StoryMention } from '../../../lib/stories'

function palette(theme: StoryMention['theme']): { bg: string; fg: string } {
  if (theme === 'dark') return { bg: 'rgba(12,12,15,.85)', fg: '#FFFFFF' }
  if (theme === 'accent') return { bg: 'linear-gradient(135deg, var(--color-garnet-500), var(--color-garnet-700))', fg: '#FFFFFF' }
  return { bg: '#FFFFFF', fg: '#0C0C0F' }
}

/** v1.6.2 · Sticker de mención (@usuario). `data-story-mention` lo usa el visor para abrir el perfil al tocarlo. */
export default function MentionSticker({ el }: { el: StoryMention }) {
  const { bg, fg } = palette(el.theme)
  const font = 'var(--font-geist-sans), system-ui, sans-serif'
  const label = `@${el.username}`
  const common: CSSProperties = { fontFamily: font, maxWidth: '88cqw', width: 'max-content', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

  if (el.style === 'glass') {
    const glassBg = el.theme === 'dark' ? 'rgba(0,0,0,.55)' : el.theme === 'accent' ? 'rgba(78,53,89,.62)' : 'rgba(255,255,255,.18)'
    return (
      <div data-story-mention={el.username} style={{ ...common, color: '#fff', background: glassBg, backdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid rgba(255,255,255,.28)', borderRadius: '99px', padding: '2cqw 5cqw', fontSize: '4.4cqw', fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
        {label}
      </div>
    )
  }

  if (el.style === 'neon') {
    const glow = el.theme === 'accent' ? '#C8BBE9' : el.theme === 'dark' ? '#38BDF8' : '#FFFFFF'
    return (
      <div data-story-mention={el.username} style={{ ...common, color: '#fff', fontSize: '6cqw', fontWeight: 800, letterSpacing: '0.02em', padding: '1.5cqw 3cqw', textShadow: `0 0 1.2cqw ${glow}, 0 0 3cqw ${glow}, 0 0 6cqw ${glow}` }}>
        {label}
      </div>
    )
  }

  if (el.style === 'plain') {
    const ink = el.theme === 'dark' ? '#0C0C0F' : '#FFFFFF'
    return (
      <div data-story-mention={el.username} style={{ ...common, color: ink, fontSize: '6.4cqw', fontWeight: 800, padding: '1.5cqw 3cqw', textShadow: el.theme === 'dark' ? 'none' : '0 1px 8px rgba(0,0,0,.55)' }}>
        {label}
      </div>
    )
  }

  // pill
  return (
    <div data-story-mention={el.username} style={{ ...common, color: fg, background: bg, borderRadius: '99px', padding: '2cqw 5cqw', fontSize: '4.4cqw', fontWeight: 800, boxShadow: '0 0.6cqw 2.4cqw rgba(0,0,0,.25)' }}>
      {label}
    </div>
  )
}
