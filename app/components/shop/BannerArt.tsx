'use client'

import { memo, useId } from 'react'
import { themeOf } from './shopThemes'
import { Aurora, Atardecer, Bosque, Cosmos, Invierno, Muertos, Neon, Otono, Oceano, Sakura, Velvet } from './BannerScenes'

// Posiciones fijas (nada de Math.random: el dibujo es idéntico en cada render y no parpadea)
const STARS: [number, number, number][] = [[60, 40, 2], [140, 90, 1.5], [230, 30, 2.2], [330, 70, 1.4], [420, 28, 1.8], [510, 85, 1.3], [610, 36, 2], [700, 66, 1.5], [790, 24, 1.8], [980, 50, 2.2], [1070, 92, 1.4], [1150, 34, 2], [900, 110, 1.3], [380, 130, 1.2], [1110, 150, 1.6]]
const SPIKES = Array.from({ length: 40 }, (_, i) => i * 31)

function Bat({ x, y, s = 1, d = 0 }: { x: number; y: number; s?: number; d?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="shop-bat" style={{ animationDelay: `${d}s` }} fill="#0a0314" d="M0 0 C-6 -9 -18 -10 -30 -4 C-24 -3 -22 2 -18 6 C-14 2 -8 3 -5 8 C-3 4 3 4 5 8 C8 3 14 2 18 6 C22 2 24 -3 30 -4 C18 -10 6 -9 0 0Z" />
    </g>
  )
}
function Pumpkin({ x, y, s = 1, glow = true }: { x: number; y: number; s?: number; glow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow && <ellipse cx="0" cy="-8" rx="62" ry="50" fill="#f59e0b" opacity="0.16" />}
      <path d="M-6 -50 C-6 -62 4 -64 8 -58 C6 -54 4 -52 2 -50Z" fill="#1a4d1f" />
      <ellipse cx="0" cy="-2" rx="48" ry="38" fill="#d9621a" />
      <ellipse cx="-24" cy="-2" rx="22" ry="37" fill="#ef7b24" />
      <ellipse cx="24" cy="-2" rx="22" ry="37" fill="#ef7b24" />
      <ellipse cx="0" cy="-2" rx="16" ry="38" fill="#f08a34" />
      <path d="M-26 -14 L-12 -14 L-19 -26Z M12 -14 L26 -14 L19 -26Z" fill="#fde68a" opacity=".95" />
      <path d="M-24 8 L-14 14 L-8 6 L0 16 L8 6 L14 14 L24 8 L18 22 L-18 22Z" fill="#fde68a" opacity=".95" />
    </g>
  )
}

function Halloween({ c }: { c: ReturnType<typeof themeOf> }) {
  return (
    <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="hw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.a} /><stop offset=".6" stopColor={c.b} /><stop offset="1" stopColor="#7a2a55" /></linearGradient>
        <radialGradient id="hw-moon" cx=".4" cy=".35" r=".75"><stop offset="0" stopColor="#fff6d6" /><stop offset=".7" stopColor="#f9dca0" /><stop offset="1" stopColor="#e9b872" /></radialGradient>
        <radialGradient id="hw-glow"><stop offset="0" stopColor="#ffd88a" stopOpacity=".55" /><stop offset="1" stopColor="#ffd88a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#hw-sky)" />
      {STARS.map(([x, y, r], i) => <circle key={i} className="shop-twinkle" style={{ animationDelay: `${(i % 5) * 0.6}s` }} cx={x} cy={y} r={r} fill="#fff" opacity=".7" />)}
      <circle cx="900" cy="170" r="230" fill="url(#hw-glow)" />
      <circle cx="900" cy="170" r="108" fill="url(#hw-moon)" />
      <circle cx="868" cy="142" r="14" fill="#d9a35f" opacity=".35" /><circle cx="926" cy="200" r="20" fill="#d9a35f" opacity=".3" /><circle cx="934" cy="130" r="8" fill="#d9a35f" opacity=".3" />
      {/* torre curva en silueta, de cuento (diseño propio) */}
      <path d="M700 420 C720 330 760 300 830 292 C900 285 960 300 980 340 C1000 300 960 262 900 262 C830 262 770 290 748 360 C740 380 738 400 740 420Z" fill="#0b0418" opacity=".92" />
      <path d="M-10 420 L-10 300 C60 270 130 330 200 310 C280 288 330 330 420 318 C520 304 560 350 640 340 L700 420Z" fill="#0d051c" />
      {/* árbol seco */}
      <g stroke="#0a0314" strokeLinecap="round" fill="none">
        <path d="M150 330 C152 270 140 230 150 180" strokeWidth="14" />
        <path d="M148 235 C120 215 96 205 70 160" strokeWidth="8" /><path d="M150 205 C180 190 200 170 214 132" strokeWidth="7" />
        <path d="M146 268 C176 258 204 250 232 232" strokeWidth="6" /><path d="M96 190 C84 178 70 176 56 182" strokeWidth="4" />
        <path d="M206 150 C220 150 232 144 244 132" strokeWidth="4" />
      </g>
      {/* reja de lanzas */}
      <g fill="#07020f">
        <rect x="-10" y="372" width="1220" height="9" /><rect x="-10" y="396" width="1220" height="8" />
        {SPIKES.map((x) => <path key={x} d={`M${x} 404 L${x} 352 L${x + 6} 336 L${x + 12} 352 L${x + 12} 404Z`} />)}
      </g>
      <rect x="-10" y="404" width="1220" height="30" fill="#05010b" />
      <Pumpkin x={470} y={372} s={0.9} /><Pumpkin x={565} y={384} s={0.62} /><Pumpkin x={1090} y={380} s={0.8} />
      <Bat x={640} y={84} s={1.1} /><Bat x={720} y={140} s={0.7} d={1.4} /><Bat x={1040} y={70} s={0.9} d={0.7} />
    </svg>
  )
}

function Motif({ id }: { id: string }) {
  switch (id) {
    case 'rose': return <>{[[820, 90, 25], [900, 200, -30], [1000, 110, 40], [1080, 250, 10], [740, 280, -50], [1120, 60, -20], [960, 320, 60]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="26" ry="12" fill="#fff" opacity=".22" transform={`rotate(${r} ${x} ${y})`} />)}</>
    case 'ice': return <>{STARS.map(([x, y, r], i) => <circle key={i} cx={x * 1.05 + 40} cy={y * 2.2} r={r * 2} fill="#fff" opacity=".35" />)}</>
    case 'gold': return <g stroke="#fff" opacity=".18" strokeWidth="3">{Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI; return <line key={i} x1="900" y1="420" x2={900 + Math.cos(a) * 520} y2={420 - Math.sin(a) * 520} /> })}</g>
    case 'emerald': return <>{[[800, 120, 30], [900, 240, -40], [1010, 100, 50], [1100, 230, -20], [760, 300, 20]].map(([x, y, r], i) => <path key={i} d="M0 0 C18 -22 46 -22 60 0 C46 22 18 22 0 0Z" fill="#fff" opacity=".18" transform={`translate(${x} ${y}) rotate(${r})`} />)}</>
    case 'ember': return <>{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={700 + ((i * 97) % 480)} cy={60 + ((i * 53) % 300)} r={3 + (i % 4) * 2} fill="#fff" opacity=".28" />)}</>
    default: return null
  }
}

function Generic({ id }: { id: string }) {
  const c = themeOf(id)
  return (
    <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.a} /><stop offset=".55" stopColor={c.b} /><stop offset="1" stopColor={c.c} stopOpacity=".85" /></linearGradient>
        <radialGradient id={`o-${id}`}><stop offset="0" stopColor={c.accent} stopOpacity=".9" /><stop offset="1" stopColor={c.c} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="420" fill={`url(#g-${id})`} />
      <circle cx="930" cy="150" r="260" fill={`url(#o-${id})`} opacity=".5" />
      <circle cx="930" cy="150" r="96" fill={c.accent} opacity=".85" />
      <circle cx="905" cy="132" r="96" fill={c.b} opacity=".55" />
      {STARS.map(([x, y, r], i) => <circle key={i} className="shop-twinkle" style={{ animationDelay: `${(i % 5) * 0.6}s` }} cx={x} cy={y * 2.4} r={r} fill="#fff" opacity=".6" />)}
      <Motif id={id} />
    </svg>
  )
}

/** Fondo ilustrado de los banners. Cada tema trae su escena (Halloween, Día de Muertos, Sakura, Aurora…); el resto, degradados con detalles suaves. */
const BannerArt = memo(function BannerArt({ theme }: { theme: string }) {
  const c = themeOf(theme)
  const u = useId().replace(/[^a-zA-Z0-9]/g, '')
  let art: React.ReactNode
  switch (c.scene) {
    case 'halloween': art = <Halloween c={c} />; break
    case 'muertos': art = <Muertos c={c} u={u} />; break
    case 'sakura': art = <Sakura c={c} u={u} />; break
    case 'aurora': art = <Aurora c={c} u={u} />; break
    case 'neon': art = <Neon c={c} u={u} />; break
    case 'otono': art = <Otono c={c} u={u} />; break
    case 'invierno': art = <Invierno c={c} u={u} />; break
    case 'velvet': art = <Velvet c={c} u={u} />; break
    case 'oceano': art = <Oceano c={c} u={u} />; break
    case 'bosque': art = <Bosque c={c} u={u} />; break
    case 'cosmos': art = <Cosmos c={c} u={u} />; break
    case 'atardecer': art = <Atardecer c={c} u={u} />; break
    default: art = <Generic id={c.id} />
  }
  return <div className="absolute inset-0 overflow-hidden" style={{ background: c.a }}>{art}</div>
})
export default BannerArt
