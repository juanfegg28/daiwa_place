import type { CSSProperties } from 'react'
import { readableOn, type StoryLocation } from '../../../lib/stories'
import { MapPinIcon } from '../../icons'

function palette(theme: StoryLocation['theme'], color?: string): { bg: string; fg: string } {
  if (theme === 'dark') return { bg: 'rgba(12,12,15,.85)', fg: '#FFFFFF' }
  if (theme === 'accent') return { bg: 'linear-gradient(135deg, var(--color-garnet-500), var(--color-garnet-700))', fg: '#FFFFFF' }
  if (theme === 'color') {
    const c = color || '#38BDF8'
    return { bg: c, fg: readableOn(c) }
  }
  return { bg: '#FFFFFF', fg: '#0C0C0F' }
}

export default function LocationSticker({ el }: { el: StoryLocation }) {
  const { bg, fg } = palette(el.theme, el.color)
  const font = 'var(--font-geist-sans), system-ui, sans-serif'

  if (el.style === 'ribbon') {
    const translucent = el.theme === 'light' ? 'rgba(255,255,255,.2)' : el.theme === 'dark' ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.12)'
    const line = el.theme === 'light' ? '#fff' : fg
    return (
      <div style={{ fontFamily: font, color: el.theme === 'light' ? '#fff' : fg, background: translucent, backdropFilter: 'blur(6px)', borderTop: `0.35cqw solid ${line}`, borderBottom: `0.35cqw solid ${line}`, padding: '1.8cqw 6cqw', fontSize: '3.6cqw', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap', maxWidth: '88cqw', textShadow: el.theme === 'light' ? '0 1px 6px rgba(0,0,0,.4)' : undefined }}>
        {el.label}
      </div>
    )
  }

  if (el.style === 'stamp') {
    const ink = el.theme === 'light' ? '#fff' : el.theme === 'dark' ? '#0C0C0F' : el.theme === 'accent' ? 'var(--color-garnet-300)' : el.color || '#38BDF8'
    const s: CSSProperties = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', color: ink, border: `0.5cqw dashed ${ink}`, borderRadius: '1.6cqw', padding: '1.8cqw 4cqw', fontSize: '4cqw', fontWeight: 600, transform: 'rotate(-6deg)', whiteSpace: 'nowrap', maxWidth: '88cqw', textShadow: el.theme === 'light' ? '0 1px 6px rgba(0,0,0,.4)' : undefined }
    return <div style={s}>{el.label}</div>
  }

  if (el.style === 'glass') {
    const glassBg = el.theme === 'dark' ? 'rgba(0,0,0,.55)' : el.theme === 'accent' ? 'rgba(163,18,46,.5)' : el.theme === 'color' ? `${el.color || '#38BDF8'}88` : 'rgba(255,255,255,.16)'
    return (
      <div style={{ fontFamily: font, color: '#fff', background: glassBg, backdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid rgba(255,255,255,.28)', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '2cqw', padding: '1.2cqw 4.2cqw 1.2cqw 1.2cqw', fontSize: '4cqw', fontWeight: 700, maxWidth: '88cqw', width: 'max-content', textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
        <span style={{ width: '6.4cqw', height: '6.4cqw', borderRadius: '50%', background: 'var(--color-garnet-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MapPinIcon className="w-[60%] h-[60%] text-white" filled />
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.label}</span>
      </div>
    )
  }

  // pill
  return (
    <div style={{ fontFamily: font, color: fg, background: bg, borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '1.6cqw', padding: '2cqw 4.4cqw 2cqw 3.4cqw', fontSize: '4cqw', fontWeight: 700, maxWidth: '88cqw', width: 'max-content', boxShadow: '0 0.6cqw 2.4cqw rgba(0,0,0,.25)' }}>
      <span style={{ width: '4.8cqw', height: '4.8cqw', display: 'inline-flex', flexShrink: 0 }}><MapPinIcon className="w-full h-full" filled /></span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.label}</span>
    </div>
  )
}
