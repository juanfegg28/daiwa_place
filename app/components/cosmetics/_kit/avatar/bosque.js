// @ts-nocheck
// Colección BOSQUE FAE — luciérnagas, hongos de luz, flores y alas de hada. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, sparkle, glow, mirror, leafD, petalD, wingLeft } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('esmeralda', 'Esmeralda', '#4FD08A', '#0A2A1A', '#E1FFE9', '#FFE68A'),
  pal('hada', 'Hada', '#C58BFF', '#2A0F44', '#F2E4FF', '#FFD1F2'),
  pal('ambar', 'Ámbar', '#FFB347', '#3A1D05', '#FFF0CF', '#9BE8A4'),
  pal('rocio', 'Rocío', '#6FC7FF', '#06263F', '#E2F5FF', '#B9FFD8'),
]

export const BOSQUE = [
  // ───────────────────────── Luciérnagas
  {
    slug: 'luciernagas', name: 'Luciérnagas', rarity: 'comun', price: 500, coll: 'bosque', min: 40, palettes: PAL,
    css: `.bl-w1{animation:bl-w1 9s ease-in-out infinite}${KF('bl-w1', '0%,100%{transform:translate(0,0)}25%{transform:translate(9px,-7px)}50%{transform:translate(-5px,-13px)}75%{transform:translate(-9px,3px)}')}.bl-w2{animation:bl-w2 11s ease-in-out infinite}${KF('bl-w2', '0%,100%{transform:translate(0,0)}30%{transform:translate(-8px,8px)}60%{transform:translate(7px,11px)}85%{transform:translate(10px,-5px)}')}.bl-b{animation:bl-b 3.2s ease-in-out infinite}${KF('bl-b', '0%,100%{opacity:.25}50%{opacity:1}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const R = rng(14)
      let o = ''
      for (let i = 0; i < 12; i++) {
        const a = (360 / 12) * i + R() * 12
        const [x, y] = pol(0, 0, 118 + R() * 22, a)
        const s = 1.5 + R() * 1.1
        o += `<g transform="translate(${f(x)} ${f(y)})"><g class="${i % 2 ? 'bl-w1' : 'bl-w2'}" style="animation-delay:${-(R() * 9).toFixed(1)}s"><g class="bl-b" style="animation-delay:${-(R() * 3).toFixed(1)}s"><circle r="${f(10 * s)}" fill="${S.radB([[0, P.d4, 0.95], [0.35, P.d4, 0.45], [1, P.d4, 0]])}"/><circle r="${f(2.1 * s)}" fill="${P.lt(P.d4, 0.6)}"/><ellipse cx="${f(-3 * s)}" cy="${f(-2 * s)}" rx="${f(2.8 * s)}" ry="${f(1.3 * s)}" fill="${P.d3}" opacity=".55" transform="rotate(-30 ${f(-3 * s)} ${f(-2 * s)})"/><ellipse cx="${f(3 * s)}" cy="${f(-2 * s)}" rx="${f(2.8 * s)}" ry="${f(1.3 * s)}" fill="${P.d3}" opacity=".55" transform="rotate(30 ${f(3 * s)} ${f(-2 * s)})"/></g></g></g>`
      }
      return ctr(o)
    },
  },
  // ───────────────────────── Hongos de luz
  {
    slug: 'hongos-de-luz', name: 'Hongos de luz', rarity: 'raro', price: 900, coll: 'bosque', min: 52, palettes: PAL,
    css: `.bh-g{animation:bh-g 3.8s ease-in-out infinite}${KF('bh-g', '0%,100%{opacity:.45}50%{opacity:1}')}.bh-s{animation:bh-s 6s ease-out infinite}${KF('bh-s', '0%{transform:translateY(6px);opacity:0}20%{opacity:.95}100%{transform:translateY(-44px);opacity:0}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const mush = (x, y, s, rot, d) => {
        const cap = S.lin([[0, P.lt(P.d1, 0.5)], [0.55, P.d1], [1, P.dk(P.d1, 0.35)]], 0, 0, 0, 1)
        const stem = S.lin([[0, P.d3], [1, P.mix(P.d3, P.d1, 0.4)]], 0, 0, 1, 0)
        return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><ellipse cy="-8" rx="30" ry="22" fill="${S.radB([[0, P.d1, 0.55], [1, P.d1, 0]])}" class="bh-g" style="animation-delay:${-d}s"/><path d="M-4.2 0C-3.6 -8 -5 -14 -6 -18H6C5 -14 3.6 -8 4.2 0Z" fill="${stem}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".6"/><path d="M-19 -17C-19 -31 -9 -38 0 -38C9 -38 19 -31 19 -17C10 -21 -10 -21 -19 -17Z" fill="${cap}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".8"/><path d="M-17 -18C-8 -15 8 -15 17 -18" stroke="${P.d2}" stroke-opacity=".35" stroke-width=".8" fill="none"/><circle cx="-8" cy="-29" r="2.8" fill="${P.d3}" opacity=".9"/><circle cx="6" cy="-32" r="2.2" fill="${P.d3}" opacity=".9"/><circle cx="11" cy="-24" r="1.8" fill="${P.d3}" opacity=".85"/><circle cx="-3" cy="-24" r="1.5" fill="${P.d3}" opacity=".85"/></g>`
      }
      const moss = `<path d="${arc(116, 30, 160)}" fill="none" stroke="${P.mix(P.d2, P.d1, 0.35)}" stroke-width="7" stroke-linecap="round" opacity=".9"/><path d="${arc(116, 30, 160)}" fill="none" stroke="${P.mix(P.d1, P.d3, 0.25)}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 4" opacity=".9"/>`
      let spores = ''
      const R = rng(26)
      for (let i = 0; i < 8; i++) { const [x, y] = pol(144, 144, 124 + R() * 12, 40 + R() * 120); spores += `<g transform="translate(${f(x)} ${f(y)})"><circle class="bh-s" style="animation-delay:${-(R() * 6).toFixed(1)}s;animation-duration:${(4 + R() * 3).toFixed(1)}s" r="${f(1 + R() * 1.4)}" fill="${P.d4}"/></g>` }
      return moss + mush(60, 232, 1.1, -22, 0) + mush(106, 262, 1.4, -6, 1.2) + mush(188, 262, 1.2, 10, 2.1) + mush(232, 234, 1.0, 24, 0.6) + mush(36, 196, 0.7, -34, 2.8) + spores
    },
  },
  // ───────────────────────── Corona de flores
  {
    slug: 'corona-de-flores', name: 'Corona de flores', rarity: 'raro', price: 1000, coll: 'bosque', min: 40, palettes: PAL,
    css: `.bc-s{transform-box:view-box;transform-origin:0 0;animation:bc-s 8s ease-in-out infinite alternate}${KF('bc-s', 'from{transform:rotate(-1deg)}to{transform:rotate(1deg)}')}${selfc('bc-p')}.bc-p{animation:bc-p 4.4s ease-in-out infinite}${KF('bc-p', '0%,100%{transform:scale(1)}50%{transform:scale(1.1)}')}`,
    back: (S, P) => glow(S, P.d1, 0.15),
    front: (S, P) => {
      const green = P.mix(P.d2, '#2f8a4f', 0.65)
      const vine = []
      for (let i = 0; i <= 26; i++) vine.push(pol(0, 0, 118 + Math.sin(i * 0.8) * 3, 176 + (i / 26) * 190))
      const stem = `<path d="${smooth(vine)}" fill="none" stroke="${P.dk(green, 0.4)}" stroke-width="5" stroke-linecap="round"/><path d="${smooth(vine)}" fill="none" stroke="${green}" stroke-width="3" stroke-linecap="round"/>`
      const lf = (a, side) => { const [x, y] = pol(0, 0, 118, a); return `<path transform="translate(${f(x)} ${f(y)}) rotate(${f(a + 90 + side * 60)})" d="${leafD(17, 5.6)}" fill="${S.lin([[0, P.dk(green, 0.2)], [1, P.lt(green, 0.25)]], 0, 1, 0, 0)}" stroke="${P.d2}" stroke-opacity=".35" stroke-width=".6"/>` }
      let leaves = ''
      for (let a = 182; a < 362; a += 11) leaves += lf(a, a % 22 ? 1 : -1)
      const daisy = (a, r, s, col, ctrc) => {
        const [x, y] = pol(0, 0, r, a)
        let p = ''
        for (let i = 0; i < 8; i++) p += `<ellipse transform="rotate(${i * 45}) translate(0 ${-8 * s})" rx="${f(3.2 * s)}" ry="${f(6.6 * s)}" fill="${S.lin([[0, col], [1, P.lt(col, 0.55)]], 0, 1, 0, 0)}" stroke="${P.dk(col, 0.4)}" stroke-opacity=".45" stroke-width=".6"/>`
        return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><g class="bc-p" style="animation-delay:${-(a % 7) * 0.5}s">${p}<circle r="${f(3.6 * s)}" fill="${ctrc}" stroke="${P.dk(ctrc, 0.4)}" stroke-width=".6"/></g></g>`
      }
      const bell = (a, r, s, col) => { const [x, y] = pol(0, 0, r, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90}) scale(${s})"><path d="M-5 0C-6 -9 -2 -13 0 -13C2 -13 6 -9 5 0C3 -2 -3 -2 -5 0Z" fill="${col}" stroke="${P.dk(col, 0.4)}" stroke-opacity=".5" stroke-width=".7"/><circle cy="1" r="1.6" fill="${P.d4}"/></g>` }
      const fl = [[190, 122, 1.5, P.d3, P.d4], [214, 120, 1.1, P.d1, P.d3], [238, 123, 1.7, P.d4, P.d2], [262, 119, 1.3, P.d3, P.d4], [286, 122, 1.8, P.d1, P.d4], [310, 120, 1.2, P.d3, P.d1], [334, 123, 1.5, P.d4, P.d3]]
      return ctr(`<g class="bc-s">${stem}${leaves}${fl.map(([a, r, s, c, cc]) => daisy(a, r, s, c, cc)).join('')}${[200, 226, 250, 274, 298, 322].map((a, i) => bell(a, 130, 0.9, i % 2 ? P.d1 : P.d4)).join('')}</g>`) + sparkle(144, 6, 3.4, P.d3, 'k-tw') + sparkle(36, 70, 2.6, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1s"')
    },
  },
  // ───────────────────────── Alas de hada
  {
    slug: 'alas-de-hada', name: 'Alas de hada', rarity: 'epico', price: 2800, coll: 'bosque', min: 64, pad: 56, palettes: PAL,
    css: `.bw-u{transform-box:view-box;transform-origin:0 0;animation:bw-u 2.6s ease-in-out infinite alternate}${KF('bw-u', 'from{transform:rotate(3deg)}to{transform:rotate(-5deg)}')}.bw-l{transform-box:view-box;transform-origin:0 0;animation:bw-l 2.6s ease-in-out infinite alternate-reverse}${KF('bw-l', 'from{transform:rotate(-2deg)}to{transform:rotate(4deg)}')}`,
    back: (S, P) => {
      const wingFill = S.lin([[0, P.d3, 0.92], [0.45, P.d1, 0.6], [1, P.d4, 0.8]], 1, 1, 0, 0)
      const veinCol = P.d3
      const upper = 'M0 0C-30 -66 -86 -118 -132 -108C-142 -76 -100 -22 0 0Z'
      const lower = 'M0 0C-52 -8 -116 16 -118 58C-84 66 -30 40 0 0Z'
      const clipU = S.clip(`<path d="${upper}"/>`)
      const clipL = S.clip(`<path d="${lower}"/>`)
      const veins = (path, n, tx, ty, spread) => { let o = ''; for (let i = 0; i < n; i++) { const t = i / (n - 1); o += `<path d="M0 0Q${f(tx * 0.5)} ${f(ty * 0.3 + spread * (t - 0.5) * 60)} ${f(tx + spread * (t - 0.5) * 30)} ${f(ty + spread * (t - 0.5) * 80)}" stroke="${veinCol}" stroke-opacity=".5" stroke-width=".7" fill="none"/>` } return o }
      const wing = () =>
        `<g transform="translate(94 150)"><g class="bw-l"><path d="${lower}" fill="${wingFill}" stroke="${P.d3}" stroke-opacity=".9" stroke-width="1.3"/><g clip-path="${clipL}">${veins(lower, 7, -112, 40, 1.4)}</g></g><g class="bw-u"><path d="${upper}" fill="${wingFill}" stroke="${P.d3}" stroke-opacity=".9" stroke-width="1.3"/><g clip-path="${clipU}">${veins(upper, 10, -118, -100, 1.4)}</g><path d="M-20 -22C-52 -52 -86 -84 -118 -100" stroke="${P.d3}" stroke-opacity=".6" stroke-width="1.2" fill="none"/></g></g>`
      const R = rng(33)
      let glit = ''
      for (let i = 0; i < 18; i++) glit += sparkle(-30 + R() * 100, 10 + R() * 160, 1.8 + R() * 2.6, i % 3 ? '#fff' : P.d4, 'k-tw').replace('<path', `<path style="animation-delay:${-R() * 3}s"`)
      return glow(S, P.d1, 0.18) + wing() + mirror(wing()) + glit + mirror(glit)
    },
    front: () => '',
  },
]
