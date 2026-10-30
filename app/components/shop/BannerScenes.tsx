'use client'

// v1.5.10 · Escenas ilustradas de los banners de la tienda. Todo es SVG propio (sin imágenes ni material de terceros),
// con posiciones fijas (nada de Math.random: el dibujo es idéntico en cada render) y pocas animaciones CSS baratas.
import type { ShopTheme } from './shopThemes'

type SceneProps = { c: ShopTheme; u: string }
const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">{children}</svg>
)
const STARS: [number, number, number][] = [[60, 40, 2], [140, 90, 1.5], [230, 30, 2.2], [330, 70, 1.4], [420, 28, 1.8], [510, 85, 1.3], [610, 36, 2], [700, 66, 1.5], [790, 24, 1.8], [980, 50, 2.2], [1070, 92, 1.4], [1150, 34, 2], [900, 110, 1.3], [380, 130, 1.2], [1110, 150, 1.6], [250, 150, 1.2], [560, 150, 1.4]]
const Stars = ({ n = STARS.length, op = 0.7, maxY = 999 }: { n?: number; op?: number; maxY?: number }) => (
  <>{STARS.slice(0, n).filter((s) => s[1] < maxY).map(([x, y, r], i) => <circle key={i} className="shop-twinkle" style={{ animationDelay: `${(i % 5) * 0.6}s` }} cx={x} cy={y} r={r} fill="#fff" opacity={op} />)}</>
)
const Grad = ({ id, stops, vertical = true }: { id: string; stops: [number, string][]; vertical?: boolean }) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>{stops.map(([o, col], i) => <stop key={i} offset={o} stopColor={col} />)}</linearGradient>
)

// ───────── Día de Muertos ─────────
const PAPEL = ['#ff3d9a', '#ff9a1f', '#27d3c3', '#ffd23f', '#9b5cf6', '#ff5a5f']
function Flag({ x, y, col, d }: { x: number; y: number; col: string; d: number }) {
  // banderita de papel picado: rectángulo con borde de picos y recortes
  return (
    <g transform={`translate(${x} ${y})`} className="shop-sway" style={{ animationDelay: `${d}s` }}>
      <path d="M0 0 H54 V56 L47 62 L40 56 L33 62 L27 56 L20 62 L13 56 L7 62 L0 56Z" fill={col} opacity=".95" />
      <circle cx="27" cy="22" r="7" fill="#1a0a14" opacity=".35" /><circle cx="27" cy="22" r="3" fill={col} />
      <path d="M10 10 L16 16 L10 22Z M44 10 L38 16 L44 22Z M10 34 L16 40 L10 46Z M44 34 L38 40 L44 46Z" fill="#1a0a14" opacity=".3" />
      <rect x="22" y="38" width="10" height="10" rx="2" fill="#1a0a14" opacity=".28" />
    </g>
  )
}
function Marigold({ x, y, s = 1, o = 1 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {Array.from({ length: 14 }, (_, i) => <ellipse key={i} cx="0" cy="-15" rx="6.5" ry="13" fill={i % 2 ? '#ff9a1f' : '#ffb938'} transform={`rotate(${(i * 360) / 14})`} />)}
      {Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx="0" cy="-8" rx="4.5" ry="8" fill={i % 2 ? '#ffd24a' : '#ff8a00'} transform={`rotate(${(i * 360) / 9 + 10})`} />)}
      <circle r="4" fill="#b45309" />
    </g>
  )
}
function Candle({ x, y, h = 52 }: { x: number; y: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy={-h - 16} rx="28" ry="34" fill="#ffd27a" opacity=".16" />
      <rect x="-7" y={-h} width="14" height={h} rx="2" fill="#f7ead2" />
      <rect x="-7" y={-h} width="14" height="6" fill="#e7d3ae" />
      <path className="shop-flicker" d={`M0 ${-h - 22} C7 ${-h - 12} 6 ${-h - 4} 0 ${-h - 2} C-6 ${-h - 4} -7 ${-h - 12} 0 ${-h - 22}Z`} fill="#ffb938" />
      <path className="shop-flicker" style={{ animationDelay: '.25s' }} d={`M0 ${-h - 15} C3 ${-h - 10} 3 ${-h - 6} 0 ${-h - 4} C-3 ${-h - 6} -3 ${-h - 10} 0 ${-h - 15}Z`} fill="#fff3b0" />
    </g>
  )
}
function Monarch({ x, y, s = 1, d = 0 }: { x: number; y: number; s?: number; d?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="shop-flap" style={{ animationDelay: `${d}s` }}>
        <path d="M0 0 C-10 -22 -34 -26 -40 -10 C-44 4 -28 12 -10 8 C-26 14 -26 28 -14 30 C-6 30 0 18 0 0Z" fill="#ff8a00" stroke="#1a0a14" strokeWidth="2" />
        <path d="M0 0 C10 -22 34 -26 40 -10 C44 4 28 12 10 8 C26 14 26 28 14 30 C6 30 0 18 0 0Z" fill="#ff8a00" stroke="#1a0a14" strokeWidth="2" />
        <circle cx="-26" cy="-8" r="2.6" fill="#fff" /><circle cx="26" cy="-8" r="2.6" fill="#fff" />
        <path d="M-10 -4 L-30 -14 M10 -4 L30 -14 M-6 8 L-22 20 M6 8 L22 20" stroke="#1a0a14" strokeWidth="1.6" fill="none" />
      </g>
      <rect x="-2" y="-12" width="4" height="34" rx="2" fill="#1a0a14" />
    </g>
  )
}
function SugarSkull({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-26 -4 C-30 -34 -14 -48 0 -48 C14 -48 30 -34 26 -4 C26 8 18 12 14 14 L14 24 H-14 L-14 14 C-18 12 -26 8 -26 -4Z" fill="#fff7ea" stroke="#e7d3ae" strokeWidth="2" />
      <circle cx="-11" cy="-16" r="9" fill="#2a1030" /><circle cx="11" cy="-16" r="9" fill="#2a1030" />
      <circle cx="-11" cy="-16" r="3.4" fill="#ff3d9a" /><circle cx="11" cy="-16" r="3.4" fill="#27d3c3" />
      <path d="M0 -6 L-4 2 H4Z" fill="#2a1030" />
      <path d="M-12 8 H12 M-8 6 V14 M-3 6 V14 M2 6 V14 M7 6 V14" stroke="#2a1030" strokeWidth="1.8" fill="none" />
      <circle cx="0" cy="-34" r="4" fill="#ff9a1f" /><circle cx="-12" cy="-32" r="3" fill="#ff3d9a" /><circle cx="12" cy="-32" r="3" fill="#27d3c3" />
    </g>
  )
}
export function Muertos({ c, u }: SceneProps) {
  return (
    <Svg>
      <defs>
        <Grad id={`m-sky-${u}`} stops={[[0, c.a], [0.55, c.b], [1, '#a03a62']]} />
        <radialGradient id={`m-glow-${u}`}><stop offset="0" stopColor="#ffb938" stopOpacity=".55" /><stop offset="1" stopColor="#ffb938" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="420" fill={`url(#m-sky-${u})`} />
      <Stars n={11} op={0.55} maxY={150} />
      <circle cx="930" cy="240" r="300" fill={`url(#m-glow-${u})`} />
      {/* luna */}
      <circle cx="1040" cy="92" r="46" fill="#fff0cf" opacity=".92" /><circle cx="1054" cy="80" r="46" fill={c.b} opacity=".5" />
      {/* hilos y papel picado */}
      <path d="M-10 36 Q300 96 600 40 T1210 70" stroke="#f5e3c0" strokeWidth="2.2" fill="none" opacity=".85" />
      <path d="M-10 118 Q260 168 560 122 T1210 140" stroke="#f5e3c0" strokeWidth="2.2" fill="none" opacity=".7" />
      {[[26, 52], [100, 68], [176, 79], [252, 83], [330, 80], [408, 70], [486, 56], [566, 48], [646, 48], [726, 54], [806, 60], [886, 62], [966, 62], [1046, 62], [1126, 66]].map(([x, y], i) => <Flag key={i} x={x} y={y - 4} col={PAPEL[i % PAPEL.length]} d={(i % 6) * 0.35} />)}
      {[[40, 128], [130, 146], [220, 155], [310, 154], [400, 146], [490, 136]].map(([x, y], i) => <Flag key={i} x={x} y={y} col={PAPEL[(i + 3) % PAPEL.length]} d={(i % 5) * 0.4 + 0.2} />)}
      {/* altar escalonado */}
      <g>
        <rect x="640" y="330" width="520" height="100" fill="#14060f" /><rect x="700" y="276" width="400" height="60" fill="#1b0914" /><rect x="770" y="226" width="260" height="56" fill="#220b19" />
        <rect x="640" y="326" width="520" height="8" fill="#ff9a1f" opacity=".8" /><rect x="700" y="272" width="400" height="7" fill="#ff3d9a" opacity=".8" /><rect x="770" y="222" width="260" height="7" fill="#27d3c3" opacity=".85" />
        {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${652 + i * 40} 336 l10 -8 l10 8z`} fill={PAPEL[i % PAPEL.length]} opacity=".9" />)}
        <SugarSkull x={900} y={222} s={1.05} />
        <Candle x={800} y={222} h={44} /><Candle x={1000} y={222} h={44} />
        <Candle x={740} y={272} h={36} /><Candle x={1060} y={272} h={36} /><Candle x={850} y={272} h={30} /><Candle x={950} y={272} h={30} />
        <Candle x={680} y={326} h={30} /><Candle x={1120} y={326} h={30} />
        {[[760, 270, 0.8], [1040, 270, 0.8], [900, 266, 0.7], [700, 322, 0.9], [1100, 322, 0.9], [790, 322, 0.8], [1010, 322, 0.8]].map(([x, y, s], i) => <Marigold key={i} x={x} y={y} s={s} />)}
      </g>
      {/* camino de pétalos */}
      <g>
        <rect x="-10" y="392" width="1220" height="40" fill="#0f040a" />
        {[40, 120, 210, 300, 380, 470, 540].map((x, i) => <Marigold key={i} x={x} y={382 + (i % 2) * 8} s={0.55 + (i % 3) * 0.1} />)}
        {Array.from({ length: 18 }, (_, i) => <ellipse key={i} cx={20 + i * 34} cy={398 + (i % 3) * 6} rx="9" ry="4" fill={i % 2 ? '#ffb938' : '#ff8a00'} transform={`rotate(${(i * 37) % 60 - 30} ${20 + i * 34} ${398 + (i % 3) * 6})`} />)}
      </g>
      <Monarch x={560} y={210} s={0.9} /><Monarch x={470} y={290} s={0.62} d={0.3} /><Monarch x={620} y={330} s={0.5} d={0.6} /><Monarch x={300} y={250} s={0.7} d={0.15} />
    </Svg>
  )
}

// ───────── Sakura ─────────
function Blossom({ x, y, s = 1, col = '#ffc2dc' }: { x: number; y: number; s?: number; col?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({ length: 5 }, (_, i) => <path key={i} d="M0 0 C-9 -8 -9 -22 0 -26 C9 -22 9 -8 0 0Z" fill={col} transform={`rotate(${i * 72})`} />)}
      <circle r="3.4" fill="#ffe066" />
    </g>
  )
}
export function Sakura({ c, u }: SceneProps) {
  const petals: [number, number, number][] = [[620, 40, 0], [720, 110, 1.1], [820, 20, 2.2], [900, 160, 0.6], [1000, 60, 1.7], [1090, 140, 2.6], [540, 170, 3.1], [460, 80, 0.9], [700, 250, 1.9], [980, 270, 2.9], [1130, 230, 0.4], [380, 220, 2.4]]
  return (
    <Svg>
      <defs><Grad id={`s-${u}`} stops={[[0, c.a], [0.55, c.b], [1, '#e86aa0']]} /><radialGradient id={`sm-${u}`}><stop offset="0" stopColor="#fff" stopOpacity=".5" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient></defs>
      <rect width="1200" height="420" fill={`url(#s-${u})`} />
      <circle cx="260" cy="150" r="230" fill={`url(#sm-${u})`} /><circle cx="260" cy="150" r="70" fill="#fff0f6" opacity=".9" />
      <path d="M-10 420 L-10 340 C120 300 220 350 330 328 C470 300 560 360 700 346 C860 330 1000 372 1210 350 L1210 420Z" fill="#3a0f2a" opacity=".75" />
      <g stroke="#2a0a1c" fill="none" strokeLinecap="round">
        <path d="M1210 -10 C1090 60 980 90 880 130 C800 160 740 190 690 250" strokeWidth="16" />
        <path d="M960 100 C930 60 900 40 860 30" strokeWidth="8" /><path d="M880 130 C860 170 850 210 820 250" strokeWidth="7" /><path d="M1060 70 C1100 110 1120 150 1130 200" strokeWidth="8" /><path d="M780 170 C730 150 690 150 640 170" strokeWidth="6" />
      </g>
      {[[860, 30, 1.1], [830, 48, 0.9], [900, 62, 1], [1000, 90, 1.2], [1090, 40, 1.1], [1130, 200, 1], [1110, 150, 1.2], [820, 250, 1.1], [850, 205, 0.9], [740, 160, 1.1], [690, 160, 0.9], [645, 172, 1], [700, 250, 1.2], [930, 100, 0.9], [790, 120, 1], [980, 150, 1.1]].map(([x, y, s], i) => <Blossom key={i} x={x} y={y} s={s} col={i % 3 === 0 ? '#ffd6e8' : '#ffc2dc'} />)}
      {petals.map(([x, y, d], i) => <g key={i} className="shop-fall" style={{ animationDelay: `${d}s` }}><ellipse cx={x} cy={y} rx="8" ry="4" fill="#ffd0e4" opacity=".85" transform={`rotate(${(i * 47) % 90} ${x} ${y})`} /></g>)}
    </Svg>
  )
}

// ───────── Aurora ─────────
export function Aurora({ c, u }: SceneProps) {
  return (
    <Svg>
      <defs>
        <Grad id={`a-${u}`} stops={[[0, '#02080f'], [0.7, c.a], [1, c.b]]} />
        <Grad id={`ab1-${u}`} stops={[[0, '#7cf5c8'], [0.6, '#38bdf8'], [1, '#a78bfa']]} vertical />
        <Grad id={`ab2-${u}`} stops={[[0, '#c084fc'], [1, '#34d399']]} vertical />
      </defs>
      <rect width="1200" height="420" fill={`url(#a-${u})`} />
      <Stars op={0.85} maxY={230} />
      <g className="shop-sway-x">
        <path d="M-20 200 C150 60 300 240 470 120 C640 0 780 210 960 90 C1060 30 1150 80 1230 60 L1230 200 C1120 230 1040 180 940 230 C770 320 640 130 470 250 C310 360 140 190 -20 300Z" fill={`url(#ab1-${u})`} opacity=".5" />
        <path d="M-20 260 C180 150 320 300 520 190 C700 90 840 290 1020 170 C1100 120 1170 150 1230 130 L1230 220 C1130 260 1050 220 960 270 C800 350 680 190 520 290 C340 400 170 270 -20 340Z" fill={`url(#ab2-${u})`} opacity=".35" />
      </g>
      <path d="M-10 420 L-10 340 L120 270 L210 330 L330 240 L470 336 L600 280 L720 350 L860 250 L990 340 L1100 290 L1210 350 L1210 420Z" fill="#04101a" />
      <path d="M-10 420 L-10 380 L90 340 L200 390 L340 350 L480 396 L640 360 L800 400 L960 364 L1100 396 L1210 370 L1210 420Z" fill="#020a12" />
    </Svg>
  )
}

// ───────── Neón (synthwave) ─────────
export function Neon({ c, u }: SceneProps) {
  return (
    <Svg>
      <defs>
        <Grad id={`n-${u}`} stops={[[0, c.a], [0.6, c.b], [1, '#d0338a']]} />
        <Grad id={`nsun-${u}`} stops={[[0, '#ffe36e'], [0.55, '#ff6fb1'], [1, '#ff3fa4']]} />
        <clipPath id={`nclip-${u}`}><rect x="0" y="0" width="1200" height="262" /></clipPath>
      </defs>
      <rect width="1200" height="420" fill={`url(#n-${u})`} />
      <Stars n={12} op={0.8} maxY={170} />
      <g clipPath={`url(#nclip-${u})`}>
        <circle cx="880" cy="250" r="150" fill={`url(#nsun-${u})`} />
        {[190, 205, 218, 230, 240, 249, 256].map((y, i) => <rect key={i} x="700" y={y} width="360" height={2 + i * 1.6} fill="#2b0f5a" opacity=".92" />)}
      </g>
      <path d="M-10 262 L120 190 L210 240 L330 170 L450 240 L560 200 L700 262Z M1040 262 L1120 200 L1210 240 L1210 262Z" fill="#1a0a3d" />
      <path d="M-10 262 L120 190 L210 240 L330 170 L450 240 L560 200 L700 262 M1040 262 L1120 200 L1210 240" stroke="#7df9ff" strokeWidth="2" fill="none" opacity=".8" />
      <rect y="262" width="1200" height="160" fill="#12042e" />
      <g stroke="#ff3fa4" strokeWidth="1.8" opacity=".85" fill="none">
        {Array.from({ length: 15 }, (_, i) => <path key={i} d={`M${600 + (i - 7) * 18} 262 L${600 + (i - 7) * 150} 420`} />)}
        {[272, 290, 314, 346, 388].map((y) => <path key={y} d={`M-10 ${y} H1210`} />)}
      </g>
      <rect y="260" width="1200" height="4" fill="#7df9ff" opacity=".7" />
    </Svg>
  )
}

// ───────── Otoño ─────────
const LEAF = 'M0 -14 C10 -10 14 0 0 14 C-14 0 -10 -10 0 -14Z'
export function Otono({ c, u }: SceneProps) {
  const leaves: [number, number, number, string][] = [[640, 60, 0, '#f59e0b'], [740, 140, 1.2, '#dc2626'], [860, 40, 2.1, '#ea580c'], [960, 190, 0.7, '#f59e0b'], [1060, 90, 1.8, '#b91c1c'], [1140, 200, 2.6, '#fb923c'], [560, 180, 3, '#ea580c'], [450, 90, 0.4, '#f59e0b'], [780, 260, 2.3, '#dc2626'], [1000, 280, 1.4, '#f59e0b']]
  return (
    <Svg>
      <defs><Grad id={`o-${u}`} stops={[[0, c.a], [0.6, c.b], [1, '#d97706']]} /></defs>
      <rect width="1200" height="420" fill={`url(#o-${u})`} />
      <circle cx="240" cy="150" r="90" fill="#ffe9b0" opacity=".85" />
      <path d="M-10 420 L-10 320 C140 280 260 340 400 316 C560 290 650 350 820 332 C980 316 1090 350 1210 320 L1210 420Z" fill="#2a1005" />
      <g stroke="#150803" strokeLinecap="round" fill="none">
        <path d="M980 420 C976 330 990 270 982 210" strokeWidth="18" /><path d="M984 260 C940 240 900 200 880 160" strokeWidth="9" /><path d="M984 240 C1030 220 1070 190 1090 150" strokeWidth="9" /><path d="M982 300 C1030 290 1070 270 1100 240" strokeWidth="7" />
      </g>
      {[[880, 160, 22], [900, 120, 18], [1090, 150, 22], [1070, 110, 18], [1000, 140, 24], [940, 200, 18], [1040, 210, 20], [860, 200, 16], [1110, 220, 16]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={['#f59e0b', '#dc2626', '#ea580c'][i % 3]} opacity=".92" />)}
      {leaves.map(([x, y, d, col], i) => <g key={i} className="shop-fall" style={{ animationDelay: `${d}s` }}><path d={LEAF} fill={col} transform={`translate(${x} ${y}) rotate(${(i * 53) % 120 - 60})`} /></g>)}
    </Svg>
  )
}

// ───────── Invierno ─────────
const Pine = ({ x, y, s = 1, col = '#06182a' }: { x: number; y: number; s?: number; col?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M0 -120 L34 -66 H16 L44 -22 H20 L52 24 H-52 L-20 -22 H-44 L-16 -66 H-34Z" fill={col} /><rect x="-6" y="24" width="12" height="16" fill={col} /></g>
)
export function Invierno({ c, u }: SceneProps) {
  const flakes: [number, number, number][] = [[620, 30, 0], [700, 120, 1.2], [800, 60, 2.4], [900, 200, 0.6], [980, 90, 1.8], [1080, 170, 3], [1150, 50, 0.9], [540, 150, 2.1], [460, 60, 1.5], [760, 250, 2.7], [1020, 280, 0.3], [380, 190, 1.1]]
  return (
    <Svg>
      <defs><Grad id={`i-${u}`} stops={[[0, c.a], [0.65, c.b], [1, '#6cb4e8']]} /></defs>
      <rect width="1200" height="420" fill={`url(#i-${u})`} />
      <Stars n={10} maxY={150} />
      <circle cx="260" cy="120" r="54" fill="#f4fbff" opacity=".95" /><circle cx="278" cy="108" r="54" fill={c.b} opacity=".4" />
      <path d="M-10 420 L-10 310 C150 270 300 330 470 300 C640 270 760 340 960 310 C1060 296 1140 320 1210 300 L1210 420Z" fill="#dcefff" opacity=".9" />
      <path d="M-10 420 L-10 360 C200 330 380 380 600 356 C800 336 1000 380 1210 350 L1210 420Z" fill="#f4fbff" />
      {[[700, 330, 1], [770, 346, 0.8], [840, 326, 1.15], [930, 344, 0.9], [1020, 330, 1.05], [1110, 342, 0.85], [100, 340, 0.8], [180, 330, 1]].map(([x, y, s], i) => <Pine key={i} x={x} y={y} s={s} col={i % 2 ? '#0a2236' : '#06182a'} />)}
      {flakes.map(([x, y, d], i) => <g key={i} className="shop-fall" style={{ animationDelay: `${d}s` }}><circle cx={x} cy={y} r={2 + (i % 3)} fill="#fff" opacity=".9" /></g>)}
    </Svg>
  )
}

// ───────── Terciopelo (telón) ─────────
export function Velvet({ c, u }: SceneProps) {
  return (
    <Svg>
      <defs>
        <Grad id={`v-${u}`} stops={[[0, c.a], [1, c.b]]} />
        <Grad id={`vf-${u}`} stops={[[0, '#4a0614'], [0.5, '#a8132f'], [1, '#4a0614']]} vertical={false} />
        <radialGradient id={`vs-${u}`}><stop offset="0" stopColor="#ffe3a1" stopOpacity=".55" /><stop offset="1" stopColor="#ffe3a1" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="420" fill={`url(#v-${u})`} />
      <ellipse cx="760" cy="230" rx="340" ry="230" fill={`url(#vs-${u})`} />
      <rect y="360" width="1200" height="60" fill="#1a0308" /><rect y="356" width="1200" height="6" fill="#e8b34b" opacity=".8" />
      {/* cortinas: dos telones recogidos hacia los lados, con pliegues */}
      <clipPath id={`vl-${u}`}><path d="M0 0 H380 C350 120 330 260 250 420 H0Z" /></clipPath>
      <clipPath id={`vr-${u}`}><path d="M1200 0 H820 C850 120 870 260 950 420 H1200Z" /></clipPath>
      <g clipPath={`url(#vl-${u})`}>{Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 50} y="0" width="50" height="420" fill={`url(#vf-${u})`} opacity={i % 2 ? 0.9 : 1} />)}</g>
      <g clipPath={`url(#vr-${u})`}>{Array.from({ length: 8 }, (_, i) => <rect key={i} x={1200 - (i + 1) * 50} y="0" width="50" height="420" fill={`url(#vf-${u})`} opacity={i % 2 ? 0.9 : 1} />)}</g>
      <path d="M380 0 C350 120 330 260 250 420" stroke="#e8b34b" strokeWidth="2" fill="none" opacity=".5" /><path d="M820 0 C850 120 870 260 950 420" stroke="#e8b34b" strokeWidth="2" fill="none" opacity=".5" />
      <path d={`M0 0 H1200 V46 ${Array.from({ length: 12 }, (_, i) => `Q${1150 - i * 100} 92 ${1100 - i * 100} 46`).join(' ')} V46Z`} fill="#7a0f24" />
      <rect width="1200" height="10" fill="#e8b34b" />
      {Array.from({ length: 12 }, (_, i) => <g key={i}><circle cx={1150 - i * 100} cy="56" r="4" fill="#e8b34b" /></g>)}
      {[[330, 150], [870, 150]].map(([x, y], i) => <g key={i}><path d={`M${x} ${y} v26`} stroke="#e8b34b" strokeWidth="3" /><path d={`M${x - 10} ${y + 26} h20 l4 36 h-28Z`} fill="#e8b34b" /></g>)}
      {[420, 520, 620].map((x, i) => <circle key={i} className="shop-twinkle" style={{ animationDelay: `${i * 0.7}s` }} cx={x + 200} cy={220 - i * 14} r="2.4" fill="#fff3c4" />)}
    </Svg>
  )
}

// ───────── Océano ─────────
export function Oceano({ c, u }: SceneProps) {
  const bubbles: [number, number, number, number][] = [[640, 380, 6, 0], [700, 330, 4, 1.4], [760, 400, 8, 0.7], [860, 360, 5, 2.1], [940, 390, 7, 1], [1020, 340, 4, 2.6], [1100, 400, 6, 0.3], [540, 360, 5, 1.9]]
  return (
    <Svg>
      <defs><Grad id={`oc-${u}`} stops={[[0, '#0a6aa8'], [0.45, c.b], [1, c.a]]} /></defs>
      <rect width="1200" height="420" fill={`url(#oc-${u})`} />
      <g opacity=".16" fill="#fff">{[[380, 0, 120], [620, 0, 90], [850, 0, 140], [1020, 0, 80]].map(([x, , w], i) => <path key={i} d={`M${x} 0 H${x + w} L${x + w * 0.4 - 60} 420 H${x - 70}Z`} />)}</g>
      <path d="M-10 90 C100 60 200 120 320 90 C440 60 540 120 660 90 C780 60 880 120 1000 90 C1100 66 1160 100 1210 90 V0 H-10Z" fill="#7dd3fc" opacity=".35" />
      <path d="M-10 420 V330 C100 300 220 350 350 326 C480 302 580 352 720 330 C860 308 980 350 1210 316 V420Z" fill="#04334f" opacity=".85" />
      <path d="M-10 420 V372 C140 350 260 392 420 372 C580 352 700 396 880 376 C1020 360 1120 388 1210 374 V420Z" fill="#021f33" />
      {[[110, 372, 1], [160, 380, 0.7], [1000, 380, 1.1], [1060, 372, 0.8]].map(([x, y, s], i) => <g key={i} transform={`translate(${x} ${y}) scale(${s})`} stroke="#ff6fb1" strokeWidth="6" strokeLinecap="round" fill="none"><path d="M0 0 C-10 -30 10 -50 0 -80" /><path d="M0 -30 C14 -40 22 -52 20 -66" /><path d="M0 -44 C-14 -52 -20 -62 -18 -74" /></g>)}
      {bubbles.map(([x, y, r, d], i) => <g key={i} className="shop-rise" style={{ animationDelay: `${d}s` }}><circle cx={x} cy={y} r={r} fill="none" stroke="#e0f7ff" strokeWidth="2" opacity=".8" /></g>)}
    </Svg>
  )
}

// ───────── Bosque fae ─────────
export function Bosque({ c, u }: SceneProps) {
  const flies: [number, number][] = [[620, 200], [700, 290], [790, 160], [880, 250], [960, 130], [1040, 300], [1120, 190], [540, 270], [460, 160], [840, 340], [1090, 100], [300, 250]]
  return (
    <Svg>
      <defs><Grad id={`b-${u}`} stops={[[0, c.a], [0.7, c.b], [1, '#1f6b3a']]} /><radialGradient id={`bg-${u}`}><stop offset="0" stopColor="#d9f99d" stopOpacity=".5" /><stop offset="1" stopColor="#d9f99d" stopOpacity="0" /></radialGradient></defs>
      <rect width="1200" height="420" fill={`url(#b-${u})`} />
      <circle cx="900" cy="200" r="260" fill={`url(#bg-${u})`} />
      {[[560, 70], [660, 40], [780, 90], [900, 30], [1010, 80], [1120, 50]].map(([x, h], i) => <rect key={i} x={x} y="0" width={18 + (i % 3) * 8} height={420 - h * 0} fill="#052313" opacity=".55" />)}
      <g fill="#031a0e">
        {[[40, 60], [160, 40], [270, 70], [360, 30]].map(([x, w], i) => <g key={i}><rect x={x} y="0" width={w * 0.45} height="420" /><path d={`M${x} 140 C${x - 40} 120 ${x - 60} 80 ${x - 80} 70 L${x - 70} 90 C${x - 40} 110 ${x - 20} 140 ${x} 170Z`} /></g>)}
        <path d="M-10 420 V350 C120 320 240 370 380 346 C520 322 640 372 800 350 C940 330 1080 372 1210 346 V420Z" />
      </g>
      <g opacity=".22" fill="#d9f99d"><ellipse cx="300" cy="360" rx="320" ry="30" /><ellipse cx="880" cy="372" rx="360" ry="26" /></g>
      {flies.map(([x, y], i) => <g key={i}><circle className="shop-twinkle" style={{ animationDelay: `${(i % 6) * 0.5}s` }} cx={x} cy={y} r="9" fill="#d9f99d" opacity=".25" /><circle className="shop-twinkle" style={{ animationDelay: `${(i % 6) * 0.5}s` }} cx={x} cy={y} r="2.6" fill="#f7ffd0" /></g>)}
    </Svg>
  )
}

// ───────── Cosmos ─────────
export function Cosmos({ c, u }: SceneProps) {
  return (
    <Svg>
      <defs>
        <Grad id={`c-${u}`} stops={[[0, c.a], [1, '#120a33']]} />
        <radialGradient id={`cn1-${u}`}><stop offset="0" stopColor="#8b5cf6" stopOpacity=".7" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" /></radialGradient>
        <radialGradient id={`cn2-${u}`}><stop offset="0" stopColor="#f472b6" stopOpacity=".5" /><stop offset="1" stopColor="#f472b6" stopOpacity="0" /></radialGradient>
        <radialGradient id={`cp-${u}`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#f5d0fe" /><stop offset=".6" stopColor="#a78bfa" /><stop offset="1" stopColor="#3b1c8c" /></radialGradient>
      </defs>
      <rect width="1200" height="420" fill={`url(#c-${u})`} />
      <ellipse cx="780" cy="190" rx="360" ry="170" fill={`url(#cn1-${u})`} /><ellipse cx="1000" cy="290" rx="280" ry="130" fill={`url(#cn2-${u})`} />
      <Stars op={0.95} />
      {[[300, 300], [200, 120], [1150, 120], [560, 320]].map(([x, y], i) => <path key={i} d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z" fill="#fff" className="shop-twinkle" style={{ animationDelay: `${i * 0.5}s` }} transform={`translate(${x} ${y})`} />)}
      <g transform="translate(900 210)">
        <ellipse rx="190" ry="40" fill="none" stroke="#e9d5ff" strokeWidth="9" opacity=".55" transform="rotate(-16)" />
        <circle r="84" fill={`url(#cp-${u})`} />
        <path d="M-86 6 C-40 26 40 -6 86 -22" stroke="#fff" strokeWidth="2" opacity=".25" fill="none" /><path d="M-80 34 C-30 52 50 22 80 14" stroke="#fff" strokeWidth="2" opacity=".18" fill="none" />
        <path d="M-190 -4 A190 40 0 0 1 190 4" stroke="#f5e8ff" strokeWidth="9" fill="none" opacity=".75" transform="rotate(-16) translate(0 18)" />
      </g>
      <circle cx="540" cy="110" r="20" fill="#fde68a" opacity=".9" /><circle cx="546" cy="106" r="20" fill={c.a} opacity=".55" />
    </Svg>
  )
}

// ───────── Atardecer ─────────
export function Atardecer({ c, u }: SceneProps) {
  return (
    <Svg>
      <defs>
        <Grad id={`at-${u}`} stops={[[0, c.a], [0.45, c.b], [0.8, '#f08a4b'], [1, '#ffcf70']]} />
        <radialGradient id={`as-${u}`}><stop offset="0" stopColor="#fff3b8" stopOpacity=".9" /><stop offset="1" stopColor="#fff3b8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1200" height="420" fill={`url(#at-${u})`} />
      <circle cx="860" cy="300" r="240" fill={`url(#as-${u})`} /><circle cx="860" cy="300" r="92" fill="#fff3b8" />
      {[[560, 130, 200], [740, 90, 260], [980, 140, 180], [220, 100, 240]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height="6" rx="3" fill="#ffd2a8" opacity=".45" />)}
      <path d="M-10 420 V330 C140 290 260 350 420 320 C560 294 640 350 800 340 C960 330 1060 300 1210 330 V420Z" fill="#4a1a3a" opacity=".85" />
      <path d="M-10 420 V372 C160 340 300 392 480 366 C660 340 800 392 1000 366 C1100 352 1160 366 1210 360 V420Z" fill="#2a0e26" />
      {[[300, 150, 1], [350, 128, 0.8], [400, 160, 0.9]].map(([x, y, s], i) => <path key={i} d="M0 0 C8 -8 16 -8 22 0 C28 -8 36 -8 44 0 C34 -3 26 2 22 6 C18 2 10 -3 0 0Z" fill="#2a0e26" transform={`translate(${x} ${y}) scale(${s})`} className="shop-sway" style={{ animationDelay: `${i * 0.4}s` }} />)}
    </Svg>
  )
}
