// @ts-nocheck
// Colección CIELO E INFIERNO — aureolas, llamas, cuernos y alas. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, sparkle, glow, mirror, featherD, wingLeft, leafD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('celestial', 'Celestial', '#FFD76A', '#4A3A0A', '#FFFBEA', '#9BD4FF'),
  pal('infernal', 'Infernal', '#FF4B2B', '#3A0805', '#FFE0A8', '#FF9A1F'),
  pal('eclipse', 'Eclipse', '#9D7BFF', '#1C0F42', '#F0E8FF', '#FF6BA8'),
  pal('hielo', 'Hielo', '#8FE3FF', '#0A2A3F', '#F2FCFF', '#C8B6FF'),
]

export const CIELO = [
  // ───────────────────────── Aureola
  {
    slug: 'aureola', name: 'Aureola', rarity: 'raro', price: 1000, coll: 'cielo', min: 40, palettes: PAL,
    css: `.ar-h{animation:ar-h 4.4s ease-in-out infinite alternate}${KF('ar-h', 'from{transform:translateY(-2px) rotate(-1.5deg)}to{transform:translateY(3px) rotate(1.5deg)}')}.ar-b{animation:ar-b 3.4s ease-in-out infinite}${KF('ar-b', '0%,100%{opacity:.5}50%{opacity:1}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const gold = S.linU([[0, P.lt(P.d1, 0.7)], [0.4, P.d1], [0.7, P.dk(P.d1, 0.2)], [1, P.lt(P.d1, 0.5)]], 90, 0, 200, 40)
      const halo = `<g transform="translate(144 22) scale(1.25)"><g class="ar-h"><ellipse rx="62" ry="22" fill="${S.radB([[0, P.d1, 0.0], [0.62, P.d1, 0.0], [0.8, P.d1, 0.5], [1, P.d1, 0]])}" class="ar-b"/><ellipse rx="46" ry="12.5" fill="none" stroke="${P.d2}" stroke-opacity=".5" stroke-width="9.6"/><ellipse rx="46" ry="12.5" fill="none" stroke="${gold}" stroke-width="7"/><ellipse rx="46" ry="12.5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" transform="translate(0 -2.5)"/><ellipse rx="46" ry="12.5" fill="none" stroke="${P.d2}" stroke-opacity=".3" stroke-width="1" transform="translate(0 2.8)"/></g></g>`
      return halo + sparkle(86, 12, 4.6, '#fff', 'k-tw') + sparkle(206, 14, 3.6, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1s"') + sparkle(144, 2, 3, '#fff', 'k-tw').replace('<path', '<path style="animation-delay:-2s"') + `<circle cx="144" cy="144" r="112" fill="none" stroke="${P.d1}" stroke-width="1.6" opacity=".7"/>`
    },
  },
  // ───────────────────────── Llamas
  {
    slug: 'llamas', name: 'Llamas', rarity: 'raro', price: 1300, coll: 'cielo', min: 52, pad: 20, palettes: PAL,
    css: `.cf-t{transform-box:fill-box;transform-origin:50% 100%;animation:cf-t 1.5s ease-in-out infinite alternate}${KF('cf-t', '0%{transform:scale(.86,.8) skewX(-5deg)}50%{transform:scale(1.04,1.12) skewX(3deg)}100%{transform:scale(.92,.92) skewX(6deg)}')}.cf-e{animation:cf-e 3s ease-out infinite}${KF('cf-e', '0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-52px);opacity:0}')}`,
    back: (S, P) => glow(S, P.d1, 0.28, 0.74, 0.86),
    front: (S, P) => {
      const R = rng(55)
      const tongue = (L, w, bend, colTop, colMid) => `<path d="M${-w} 0C${-w * 1.1} ${-L * 0.35} ${-w * 0.3 + bend} ${-L * 0.65} ${bend} ${-L}C${w * 0.4 + bend} ${-L * 0.6} ${w * 1.15} ${-L * 0.34} ${w} 0Z" fill="${S.lin([[0, colMid], [0.5, colMid], [1, colTop, 0.15]], 0, 1, 0, 0)}"/>`
      let outer = '', mid = '', core = ''
      const N = 18
      for (let i = 0; i < N; i++) {
        const a = (360 / N) * i + R() * 6
        const [x, y] = pol(0, 0, 108, a)
        const up = Math.max(0, Math.sin(((a + 90) * Math.PI) / 180) * -1) // mayor hacia arriba
        const L = 30 + R() * 22 + up * 14
        const bend = (R() - 0.5) * 10
        const d = -(R() * 1.5).toFixed(2)
        const tr = `transform="translate(${f(x)} ${f(y)}) rotate(${f(a + 90)})"`
        outer += `<g ${tr}><g class="cf-t" style="animation-delay:${d}s">${tongue(L, 9, bend, P.d4, P.d1)}</g></g>`
        mid += `<g ${tr}><g class="cf-t" style="animation-delay:${d - 0.3}s">${tongue(L * 0.72, 6.2, bend * 0.8, P.d3, P.d4)}</g></g>`
        core += `<g ${tr}><g class="cf-t" style="animation-delay:${d - 0.6}s">${tongue(L * 0.42, 3.6, bend * 0.5, '#fff', P.d3)}</g></g>`
      }
      let em = ''
      for (let i = 0; i < 12; i++) { const [x, y] = pol(0, 0, 118 + R() * 30, R() * 360); em += `<g transform="translate(${f(x)} ${f(y)})"><circle class="cf-e" style="animation-delay:${-(R() * 3).toFixed(2)}s;animation-duration:${(2 + R() * 2).toFixed(1)}s" r="${f(0.9 + R() * 1.5)}" fill="${R() > 0.5 ? P.d3 : P.d4}"/></g>` }
      const rim = `<circle cx="144" cy="144" r="112.4" fill="none" stroke="${S.linU([[0, P.d3], [0.5, P.d4], [1, P.d1]], 30, 30, 260, 260)}" stroke-width="3"/>`
      return ctr(outer + mid + core + em) + rim
    },
  },
  // ───────────────────────── Cuernos de brasa
  {
    slug: 'cuernos-de-brasa', name: 'Cuernos de brasa', rarity: 'epico', price: 2200, coll: 'cielo', min: 52, pad: 20, palettes: PAL,
    css: `.ch-c{animation:ch-c 2.6s ease-in-out infinite}${KF('ch-c', '0%,100%{opacity:.5}50%{opacity:1}')}.ch-e{animation:ch-e 3.2s ease-out infinite}${KF('ch-e', '0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-44px) translateX(6px);opacity:0}')}`,
    back: (S, P) => glow(S, P.d1, 0.18),
    front: (S, P) => {
      const horn = S.lin([[0, P.mix('#3a2430', P.d1, 0.35)], [0.5, P.mix('#5a3a46', P.d1, 0.45)], [1, P.mix('#1a1018', P.d1, 0.2)]], 0, 0, 1, 0)
      const hornD = 'M0 0C-10 -6 -16 -22 -12 -40C-8 -58 4 -70 24 -78C14 -64 14 -52 18 -40C22 -26 20 -10 14 0Z'
      const half = () =>
        `<g transform="translate(0 0)"><path d="${hornD}" fill="#000" opacity=".35" transform="translate(2 3)"/><path d="${hornD}" fill="${horn}" stroke="${P.d2}" stroke-width="1.3"/><path d="M-6 -4C-12 -16 -10 -34 -6 -48M2 -8C-2 -24 0 -40 8 -56" stroke="${P.d1}" stroke-width="1.4" fill="none" stroke-linecap="round" class="ch-c"/><path d="M-9 -22L-1 -20M-8 -34L2 -32M-3 -46L6 -44" stroke="${P.d4}" stroke-width="1.6" stroke-linecap="round" class="ch-c" style="animation-delay:-1s"/><path d="M-10 -30C-9 -44 -2 -58 12 -68" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`
      let em = ''
      const R = rng(71)
      for (let i = 0; i < 8; i++) em += `<g transform="translate(${f(60 + R() * 168)} ${f(20 + R() * 22)})"><circle class="ch-e" style="animation-delay:${-(R() * 3).toFixed(2)}s" r="${f(0.9 + R() * 1.6)}" fill="${i % 2 ? P.d3 : P.d4}"/></g>`
      return `<g transform="translate(100 50) rotate(-16) scale(1.55)">${half()}</g><g transform="translate(188 50) rotate(16) scale(-1.55 1.55)">${half()}</g>` + em + `<circle cx="144" cy="144" r="112" fill="none" stroke="${P.d1}" stroke-width="1.6" opacity=".7"/>`
    },
  },
  // ───────────────────────── Alas de plumas
  {
    slug: 'alas-de-plumas', name: 'Alas de plumas', rarity: 'legendario', price: 5500, coll: 'cielo', min: 80, pad: 80, custom: true, palettes: PAL,
    css: `.cw-f{transform-box:view-box;transform-origin:0 0;animation:cw-f 5.2s ease-in-out infinite alternate}${KF('cw-f', 'from{transform:rotate(3deg)}to{transform:rotate(-4.5deg)}')}.cw-d{animation:cw-d 9s ease-in infinite}${KF('cw-d', '0%{transform:translate(0,0) rotate(0);opacity:0}12%{opacity:.95}100%{transform:translate(-16px,86px) rotate(150deg);opacity:0}')}`,
    back: (S, P) => {
      const cols = [P.mix('#ffffff', P.d1, 0.25), '#ffffff', P.lt(P.d1, 0.8), P.d1]
      const rows = [
        { n: 11, a: [120, 196], len: [66, 126], w: 16, stops: [[0, P.lt(P.d1, 0.55)], [0.5, '#fff'], [1, '#fff']], style: 'round', edgeOp: 0.55, span: [0.0, 1] },
        { n: 11, a: [132, 202], len: [52, 100], w: 16, stops: [[0, P.lt(P.d1, 0.35)], [0.45, '#fff'], [1, P.lt(P.d1, 0.85)]], style: 'round', edgeOp: 0.6, span: [0.03, 0.98] },
        { n: 9, a: [142, 206], len: [30, 58], w: 14, stops: [[0, P.d1], [0.5, P.lt(P.d1, 0.55)], [1, '#fff']], style: 'round', edgeOp: 0.7, span: [0.06, 0.95] },
      ]
      const wl = wingLeft(S, { arm: [[92, 148], [26, 132], [4, 62]], rows, cols, shaft: true })
      const wing = () => `<g transform="translate(92 148)"><g class="cw-f"><g transform="translate(-92 -148)">${wl}</g></g></g>`
      let fe = ''
      for (let i = 0; i < 4; i++) fe += `<g transform="translate(${6 + i * 16} ${180 + i * 12}) rotate(${-30 + i * 20})"><path class="cw-d" style="animation-delay:${-i * 2.2}s" d="${featherD(22, 6, 'round')}" fill="#fff" stroke="${P.d1}" stroke-opacity=".6" stroke-width=".6"/></g>`
      return glow(S, P.d1, 0.28, 0.7, 0.84) + wing() + mirror(wing()) + fe + mirror(fe)
    },
    front: () => '',
  },
]
