// @ts-nocheck
// NOCTIS GÓTICO — tarjetas: Cadenas vivas · Catedral nocturna · Vitral roto
import { META } from './meta.js'
import { rng } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'

const M = (slug, o) => ({ ...META[slug], ...o })
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`

// eslabón de cadena (cara + canto) que se repite hacia abajo
const link = (P) => `<defs><linearGradient id="m" x1="0" x2="1"><stop offset="0" stop-color="${dk(P.d3, 0.5)}"/><stop offset=".45" stop-color="${lt(P.d3, 0.15)}"/><stop offset="1" stop-color="${dk(P.d3, 0.6)}"/></linearGradient></defs>
<rect x="3.5" y="1" width="19" height="30" rx="9.5" fill="none" stroke="url(#m)" stroke-width="4.4"/><rect x="3.5" y="1" width="19" height="30" rx="9.5" fill="none" stroke="${rgba('#fff', 0.35)}" stroke-width=".8" transform="translate(-.6 -.6)"/>
<rect x="10.2" y="23" width="5.6" height="25" rx="2.8" fill="url(#m)"/><rect x="10.2" y="23" width="1.6" height="25" rx=".8" fill="${rgba('#fff', 0.4)}"/>`

const brick = (P) => {
  const st = rgba(P.d1, 0.22), fl_ = rgba(P.d1, 0.05)
  const b = (x, y, w) => `<rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="15.8" rx="1.6" fill="${fl_}" stroke="${st}"/>`
  return b(0, 0, 36) + b(36, 0, 36) + b(-18, 17, 36) + b(18, 17, 36) + b(54, 17, 36)
}

export const N1 = [
  M('cadenas-vivas', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.14)} 0,${P.d2} 36%,${dk(P.d2, 0.35)} 100%)`)
      bg += K.pattern(72, 34, brick(P), { style: fade() })
      bg += K.fill(`background:radial-gradient(ellipse 60% 50% at 86% 0,${rgba(P.d3, 0.34)},transparent 70%),radial-gradient(ellipse 50% 40% at 0 60%,${rgba(P.d1, 0.2)},transparent 70%),linear-gradient(112deg,transparent 40%,${rgba(P.d3, 0.05)} 48%,transparent 58%)`)
      bg += K.fill(`background:radial-gradient(ellipse 90% 40% at 50% 100%,${rgba(P.d1, 0.16)},transparent 70%)`)
      // cadenas que cuelgan del borde del banner, se mecen con calma
      const ch = (side, off, h, d) => K.tile(link(P), 26, 44, { x: false, y: true, t: '-4px', [side[0]]: off, w: '26px', h, style: `transform-origin:50% 0;animation:sk-sway ${6 + d}s ease-in-out ${-d}s infinite;${fade('#000 0,#000 78%,transparent 100%')};filter:drop-shadow(0 3px 5px rgba(0,0,0,.5))` })
      bg += ch('left', '-6px', '58%', 1) + ch('left', '20px', '30%', 2.4) + ch('right', '-6px', '50%', 3.1) + ch('right', '20px', '27%', 4.4)
      bg += K.fill('background:linear-gradient(180deg,rgba(0,0,0,.6),transparent 96px)')
      bg += K.parts(9, { kind: 'float', seed: 4, html: `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${rgba(P.d3, 0.8)};box-shadow:0 0 8px ${P.d3}"></b>`, size: [2, 4], dur: [9, 16] })
      bg += K.grain(0.07)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(160deg,${rgba(P.d3, 0.7)},${rgba(P.d1, 0.35)} 35%,${rgba(P.d1, 0.1)} 70%,${rgba(P.d3, 0.4)})`, spin: 18, beam: P.d3, glow: rgba(P.d1, 0.3) }) }
    },
  }),

  M('catedral-nocturna', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.2)} 0,${P.d2} 42%,${dk(P.d2, 0.3)} 100%)`)
      // haces de luz que bajan desde las vidrieras
      bg += K.fill(`background:conic-gradient(from 166deg at 50% -6%,transparent 0 3deg,${rgba(P.d3, 0.13)} 8deg,transparent 15deg 22deg,${rgba(P.d3, 0.10)} 29deg,transparent 36deg 42deg,${rgba(P.d3, 0.12)} 50deg,transparent 58deg);${fade('#000 0,#000 25%,transparent 78%')}`)
      // hilera de vidrieras ojivales (se repite a lo ancho)
      const win = `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.d3}" stop-opacity=".95"/><stop offset=".5" stop-color="${P.d1}" stop-opacity=".8"/><stop offset="1" stop-color="${P.d1}" stop-opacity=".25"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(P.d2, P.d1, 0.35)}"/><stop offset="1" stop-color="${dk(P.d2, 0.3)}"/></linearGradient></defs>
<rect width="132" height="200" fill="url(#s)"/><path d="M26 200V84Q26 44 66 12Q106 44 106 84V200Z" fill="url(#w)"/><path d="M66 12V200M26 100H106M26 150H106" stroke="${rgba(P.d2, 0.9)}" stroke-width="3.2" fill="none"/><path d="M26 84Q66 100 106 84" stroke="${rgba(P.d2, 0.9)}" stroke-width="3" fill="none"/><circle cx="66" cy="62" r="11" fill="none" stroke="${rgba(P.d2, 0.9)}" stroke-width="3"/><path d="M26 200V84Q26 44 66 12Q106 44 106 84V200Z" fill="none" stroke="${rgba(P.d3, 0.55)}" stroke-width="2.2"/><rect x="0" width="8" height="200" fill="${rgba('#000', 0.25)}"/><rect x="124" width="8" height="200" fill="${rgba('#000', 0.25)}"/>`
      bg += K.tile(win, 132, 200, { x: true, t: '0', l: '0', r: '0', h: '200px', style: `${fade('#000 0,#000 52%,transparent 100%')};opacity:.9;animation:sk-pulse 7s ease-in-out infinite` })
      // pilares laterales
      const col = `<defs><linearGradient id="c" x1="0" x2="1"><stop offset="0" stop-color="${rgba('#000', 0.55)}"/><stop offset=".5" stop-color="${rgba(P.d1, 0.14)}"/><stop offset="1" stop-color="${rgba('#000', 0.5)}"/></linearGradient></defs><rect width="22" height="40" fill="url(#c)"/><path d="M7 0V40M15 0V40" stroke="${rgba(P.d3, 0.07)}"/>`
      bg += K.tile(col, 22, 40, { x: false, y: true, t: '0', l: '0', b: '0', w: '18px' }) + K.tile(col, 22, 40, { x: false, y: true, t: '0', r: '0', b: '0', w: '18px' })
      bg += K.fill(`background:radial-gradient(ellipse 90% 35% at 50% 100%,${rgba(P.d1, 0.22)},transparent 70%)`)
      bg += K.fill('background:linear-gradient(180deg,rgba(0,0,0,.55),transparent 80px)')
      bg += K.parts(10, { kind: 'rise', seed: 8, html: `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${rgba(P.d3, 0.7)};filter:blur(.4px)"></b>`, size: [2, 4], dur: [14, 24], dx: [-14, 14], o: 0.7 })
      bg += K.grain(0.06)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(180deg,${rgba(P.d3, 0.55)},${rgba(P.d1, 0.2)} 50%,${rgba(P.d3, 0.35)})`, glow: rgba(P.d1, 0.25) }) + `<div class="sk-b" style="inset:7px;border:1px solid ${rgba(P.d1, 0.25)};border-radius:inherit;border-radius:calc(var(--sk-r,28px) - 5px)"></div>` }
    },
  }),

  M('vitral-roto', {
    css: '',
    build: (K, P) => {
      const R = rng(21), cols = 9, rows = 12, cw = 1000 / cols, rh = 1250 / rows
      const V = []
      for (let j = 0; j <= rows; j++) { V[j] = []; for (let i = 0; i <= cols; i++) V[j][i] = [i * cw + (i > 0 && i < cols ? (R() - 0.5) * cw * 0.55 : 0), j * rh + (j > 0 && j < rows ? (R() - 0.5) * rh * 0.55 : 0)] }
      const jew = [P.d1, P.d4, mix(P.d1, P.d3, 0.45), P.rot(P.d1, 38), P.rot(P.d1, -38), mix(P.d2, P.d1, 0.45), P.rot(P.d4, 25)]
      let polys = '', leads = ''
      const tri = (a, b, c, k) => {
        const broken = R() < 0.1
        const pts = [a, b, c].map((p) => `${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(' ')
        const col = jew[Math.floor(R() * jew.length)], o = (0.5 + R() * 0.38).toFixed(2)
        if (!broken) polys += `<polygon points="${pts}" fill="${col}" fill-opacity="${o}"/>`
        else polys += `<polygon points="${pts}" fill="${dk(P.d2, 0.4)}" fill-opacity=".8"/>`
        leads += `<polygon points="${pts}" fill="none" stroke="${dk(P.d2, 0.55)}" stroke-width="5" stroke-linejoin="round"/>`
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i]
        if (R() < 0.5) { tri(a, b, c); tri(a, c, d) } else { tri(a, b, d); tri(b, c, d) }
      }
      let bg = K.fill(`background:${dk(P.d2, 0.2)}`)
      bg += K.svg('0 0 1000 1250', polys + leads, { pos: 'xMidYMin slice', style: 'opacity:.95' })
      // la luz atraviesa el vidrio
      bg += K.fill(`background:linear-gradient(115deg,transparent 35%,${rgba('#fff', 0.14)} 47%,transparent 60%);background-size:260% 100%;animation:sk-glass 9s ease-in-out infinite;mix-blend-mode:soft-light`)
      // el centro queda oscuro y tranquilo para leer; el vidrio brilla en los bordes
      bg += `<div class="sk-b" style="left:clamp(22px,5.5cqw,52px);right:clamp(22px,5.5cqw,52px);top:0;bottom:0;background:linear-gradient(180deg,${rgba(P.d2, 0.3)} 0,${rgba(P.d2, 0.78)} 250px,${rgba(P.d2, 0.86)} 100%)"></div>`
      bg += K.fill('background:linear-gradient(180deg,rgba(0,0,0,.55),transparent 90px)')
      bg += K.grain(0.08)
      return { bg, fg: K.frame({ w: 3, grad: `linear-gradient(135deg,${dk(P.d2, 0.6)},${rgba(P.d3, 0.7)} 30%,${dk(P.d2, 0.6)} 55%,${rgba(P.d1, 0.7)} 80%,${dk(P.d2, 0.6)})`, glow: rgba(P.d1, 0.3) }) }
    },
  }),
]
