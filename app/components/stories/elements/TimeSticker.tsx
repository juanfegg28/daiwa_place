'use client'

import type { CSSProperties } from 'react'
import { timeParts, type StoryTime } from '../../../lib/stories'

const SANS = 'var(--font-geist-sans), system-ui, sans-serif'
const SH = '0 1px 8px rgba(0,0,0,.3)'

function Hands({ h24, minute, color, gold }: { h24: number; minute: number; color: string; gold?: boolean }) {
  const hourDeg = ((h24 % 12) + minute / 60) * 30
  const minDeg = minute * 6
  const c = gold ? '#E7C873' : color
  return (
    <g>
      <g transform={`rotate(${hourDeg} 50 50)`}>
        <rect x="48.2" y={gold ? 25 : 27} width="3.6" height={gold ? 29 : 27} rx="1.8" fill={c} />
        {gold && <rect x="49" y="50" width="2" height="9" fill={c} />}
      </g>
      <g transform={`rotate(${minDeg} 50 50)`}>
        <rect x="49.1" y={gold ? 14 : 16} width="1.8" height={gold ? 42 : 40} rx="0.9" fill={c} />
        {gold && <rect x="49.6" y="50" width="0.9" height="11" fill={c} />}
      </g>
      <circle cx="50" cy="50" r={gold ? 2.6 : 2.4} fill={c} />
    </g>
  )
}

function FlipCard({ txt, animate }: { txt: string; animate: boolean }) {
  const card: CSSProperties = {
    position: 'relative', width: '17cqw', height: '22cqw', borderRadius: '2cqw', background: 'linear-gradient(#3a3a40 0 50%, #2b2b30 50% 100%)', color: '#f3f3f5',
    fontFamily: SANS, fontWeight: 700, fontSize: '15cqw', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '-0.02em', boxShadow: '0 1cqw 3cqw rgba(0,0,0,.4)',
  }
  return (
    <div className={animate ? 'story-flip-in' : undefined} style={card}>
      {txt}
      <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '0.4cqw', background: 'rgba(0,0,0,.65)', transform: 'translateY(-50%)' }} />
      <span style={{ position: 'absolute', left: '-0.7cqw', top: '50%', width: '1.4cqw', height: '3cqw', borderRadius: '0.6cqw', background: '#111', transform: 'translateY(-50%)' }} />
      <span style={{ position: 'absolute', right: '-0.7cqw', top: '50%', width: '1.4cqw', height: '3cqw', borderRadius: '0.6cqw', background: '#111', transform: 'translateY(-50%)' }} />
    </div>
  )
}

const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

export default function TimeSticker({ el, animate = true }: { el: StoryTime; animate?: boolean }) {
  const p = timeParts(el)
  const color = el.color || '#FFFFFF'
  const dateLine = [p.date, p.zone].filter(Boolean).join(' · ')
  const dayNum = new Date(el.iso).toLocaleDateString('es', { day: 'numeric', timeZone: el.tz || 'UTC' })

  if (el.style === 'neon') {
    const glow = `0 0 1.2cqw ${color}, 0 0 3.4cqw ${color}`
    return (
      <div className="story-neon-glow" style={{ fontFamily: 'var(--font-orbitron), var(--font-geist-mono), monospace', color, padding: '2.4cqw 5.4cqw', borderRadius: '4cqw', background: 'rgba(0,0,0,.35)', border: `0.5cqw solid ${color}`, boxShadow: `0 0 2cqw ${color}66, inset 0 0 2cqw ${color}33`, textAlign: 'center', width: 'max-content' }}>
        <div style={{ fontSize: '12cqw', fontWeight: 600, letterSpacing: '0.04em', textShadow: glow, lineHeight: 1.05 }}>
          {p.time}
          {p.period && <span style={{ fontSize: '4.4cqw', marginLeft: '1.6cqw' }}>{p.period}</span>}
        </div>
        {dateLine && <div style={{ fontSize: '3cqw', letterSpacing: '0.12em', marginTop: '1cqw', textShadow: `0 0 1cqw ${color}`, textTransform: 'uppercase' }}>{dateLine}</div>}
      </div>
    )
  }

  if (el.style === 'analog' || el.style === 'analog-gold') {
    const gold = el.style === 'analog-gold'
    return (
      <div style={{ width: '34cqw', textAlign: 'center' }}>
        <svg viewBox="0 0 100 100" style={{ width: '34cqw', height: '34cqw', display: 'block', filter: 'drop-shadow(0 1.2cqw 3cqw rgba(0,0,0,.35))' }}>
          {gold ? (
            <>
              <defs>
                <linearGradient id="gold-bezel" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F6E7B4" />
                  <stop offset="0.5" stopColor="#C9A24B" />
                  <stop offset="1" stopColor="#8A6A1F" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48.5" fill="url(#gold-bezel)" />
              <circle cx="50" cy="50" r="43.5" fill="#15130e" />
              <circle cx="50" cy="50" r="43.5" fill="none" stroke="#C9A24B" strokeWidth="0.5" />
              {ROMAN.map((r, i) => {
                const a = (i * 30 * Math.PI) / 180
                return (
                  <text key={i} x={50 + Math.sin(a) * 34.5} y={50 - Math.cos(a) * 34.5} fontSize="7" textAnchor="middle" dominantBaseline="central" fill="#E7C873" style={{ fontFamily: 'var(--font-cinzel), serif', fontWeight: 600 }}>
                    {r}
                  </text>
                )
              })}
              <Hands h24={p.h24} minute={p.minute} color={color} gold />
            </>
          ) : (
            <>
              <circle cx="50" cy="50" r="48" fill="rgba(12,12,15,.42)" stroke={color} strokeOpacity="0.9" strokeWidth="1.2" />
              {Array.from({ length: 12 }).map((_, i) => (
                <rect key={i} x="49.4" y="5.5" width="1.2" height={i % 3 === 0 ? 6 : 3.4} rx="0.6" fill={color} transform={`rotate(${i * 30} 50 50)`} />
              ))}
              {el.showDate !== 'none' && (
                <g>
                  <rect x="42" y="64" width="16" height="9" rx="2" fill="rgba(255,255,255,.14)" />
                  <text x="50" y="68.7" fontSize="6.4" textAnchor="middle" dominantBaseline="central" fill={color} style={{ fontFamily: SANS, fontWeight: 600 }}>
                    {dayNum}
                  </text>
                </g>
              )}
              <Hands h24={p.h24} minute={p.minute} color={color} />
            </>
          )}
        </svg>
        {dateLine && gold && <div style={{ fontFamily: 'var(--font-cinzel), serif', color: '#E7C873', fontSize: '3.2cqw', marginTop: '1.4cqw', textShadow: SH }}>{dateLine}</div>}
        {dateLine && !gold && <div style={{ fontFamily: SANS, color, fontSize: '3.2cqw', marginTop: '1.4cqw', textShadow: SH, fontWeight: 600 }}>{dateLine}</div>}
      </div>
    )
  }

  if (el.style === 'flip') {
    return (
      <div style={{ textAlign: 'center', width: 'max-content', perspective: '120cqw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.6cqw', justifyContent: 'center' }}>
          <FlipCard txt={p.hourText.padStart(2, '0')} animate={animate} />
          <span style={{ color, fontSize: '10cqw', fontFamily: SANS, fontWeight: 700, textShadow: SH }}>:</span>
          <FlipCard txt={p.minuteText} animate={animate} />
          {p.period && <span style={{ color, fontSize: '4cqw', fontFamily: SANS, fontWeight: 700, alignSelf: 'flex-end', marginBottom: '2cqw', textShadow: SH }}>{p.period}</span>}
        </div>
        {dateLine && <div style={{ fontFamily: SANS, color, fontSize: '3.4cqw', marginTop: '2cqw', fontWeight: 600, textShadow: SH }}>{dateLine}</div>}
      </div>
    )
  }

  if (el.style === 'ticket') {
    const sideDate = [p.dateShort ? p.dateShort.toUpperCase().replace(/\s+/g, ' · ') : '', p.zone].filter(Boolean).join(' · ')
    return (
      <div style={{ position: 'relative', width: '62cqw', height: '24cqw', color: '#1B1B20', filter: 'drop-shadow(0 1cqw 3cqw rgba(0,0,0,.35))' }}>
        <div
          style={{
            position: 'absolute', inset: 0, background: '#FAF7F2', borderRadius: '2cqw',
            WebkitMask: 'radial-gradient(circle at 0 50%, #0000 2.6cqw, #000 2.7cqw) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, #0000 2.6cqw, #000 2.7cqw) right / 51% 100% no-repeat',
            mask: 'radial-gradient(circle at 0 50%, #0000 2.6cqw, #000 2.7cqw) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, #0000 2.6cqw, #000 2.7cqw) right / 51% 100% no-repeat',
          }}
        />
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: '0 4cqw 0 6cqw', gap: '3cqw' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: '12cqw', letterSpacing: '-0.03em', lineHeight: 1, color: el.color && el.color.toLowerCase() !== '#ffffff' ? el.color : '#1B1B20' }}>
            {p.time}
            {p.period && <span style={{ fontSize: '3.4cqw', marginLeft: '1cqw', fontWeight: 700 }}>{p.period}</span>}
          </div>
          <div style={{ flex: 1, height: '70%', borderLeft: '0.5cqw dotted #1B1B2055' }} />
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '3cqw', fontWeight: 600, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
            {sideDate || 'HOY'}
          </div>
        </div>
      </div>
    )
  }

  if (el.style === 'handwritten') {
    return (
      <div style={{ textAlign: 'center', width: 'max-content', color }}>
        <div style={{ fontFamily: 'var(--font-caveat), cursive', fontWeight: 700, fontSize: '10cqw', lineHeight: 1.05, textShadow: SH }}>
          son las {p.time}{p.period ? ` ${p.period}` : ''} ✦
        </div>
        <svg viewBox="0 0 200 14" style={{ width: '52cqw', height: '3.6cqw', display: 'block', margin: '0.4cqw auto 0' }}>
          <path d="M3 8 C 30 2, 60 13, 100 7 S 170 3, 197 8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </svg>
        {dateLine && <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: '5cqw', fontWeight: 700, marginTop: '0.8cqw', textShadow: SH }}>{dateLine}</div>}
      </div>
    )
  }

  if (el.style === 'lock') {
    return (
      <div style={{ textAlign: 'center', width: 'max-content', fontFamily: SANS }}>
        <div style={{ fontSize: '4.2cqw', fontWeight: 500, color, textShadow: SH }}>{p.dateLong || p.date}</div>
        <div style={{ fontSize: '22cqw', fontWeight: 200, lineHeight: 1.0, letterSpacing: '-0.04em', backgroundImage: `linear-gradient(180deg, ${color}, ${color}66)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }}>
          {p.time}
        </div>
        {(p.period || p.zone) && <div style={{ fontSize: '3.2cqw', color, opacity: 0.85, textShadow: SH }}>{[p.period, p.zone].filter(Boolean).join(' · ')}</div>}
      </div>
    )
  }

  // digital
  return (
    <div style={{ textAlign: 'center', width: 'max-content', fontFamily: SANS, color }}>
      <div style={{ fontSize: '16cqw', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, textShadow: SH }}>
        {p.time}
        {p.period && <span style={{ fontSize: '5cqw', marginLeft: '1.6cqw', letterSpacing: 0 }}>{p.period}</span>}
      </div>
      {dateLine && <div style={{ fontSize: '3.8cqw', fontWeight: 600, marginTop: '1cqw', textShadow: SH }}>{dateLine}</div>}
    </div>
  )
}
