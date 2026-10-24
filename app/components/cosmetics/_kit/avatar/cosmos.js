// @ts-nocheck
// Colección COSMOS Y SUPERNOVA — constelaciones, meteoritos, nebulosas, planetas y un agujero negro. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, sparkle, glow, mirror, orbit, dot } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('nebulosa', 'Nebulosa', '#8B5CF6', '#0B0722', '#E9DDFF', '#FF7AD9'),
  pal('polar', 'Polar', '#35D0E6', '#041A26', '#DDFAFF', '#9DFFB0'),
  pal('solar', 'Solar', '#FFB43B', '#2B1304', '#FFEFC9', '#FF5A3C'),
  pal('quasar', 'Quásar', '#FF4FA3', '#2A0620', '#FFDCEE', '#6EA8FF'),
]

export const COSMOS = [
  // ───────────────────────── Constelación
  {
    slug: 'constelacion', name: 'Constelación', rarity: 'raro', price: 1000, coll: 'cosmos', min: 52, palettes: PAL,
    css: `${spin('cq-a', 'cq-o', 220)}.cq-l{stroke-dasharray:3 4;animation:cq-d 9s linear infinite}${KF('cq-d', 'to{stroke-dashoffset:-70}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const stars = [[-100, 118, 7], [-70, 130, 4.6], [-40, 121, 5.4], [-8, 133, 8.4], [26, 124, 4.4], [64, 132, 6], [102, 120, 4], [140, 130, 7.4], [176, 122, 4.6], [212, 134, 5.6], [246, 119, 4.2], [-125, 134, 3.6]]
      const pts = stars.map(([a, r]) => pol(0, 0, r, a))
      const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]
      let lines = `<path class="cq-l" d="M${order.map((i) => f(pts[i][0]) + ' ' + f(pts[i][1])).join('L')}" fill="none" stroke="${P.d3}" stroke-width="1.1" opacity=".8"/>`
      let st = ''
      stars.forEach(([a, r, s], i) => {
        const [x, y] = pts[i]
        const big = s > 6
        st += `<circle cx="${f(x)}" cy="${f(y)}" r="${s * 1.9}" fill="${S.radB([[0, P.d3, 0.65], [1, P.d3, 0]])}"/>` + sparkle(x, y, s, big ? '#fff' : P.d3, 'k-tw', 1, 0.13).replace('<path', `<path style="animation-delay:${-i * 0.37}s"`)
      })
      const R = rng(5)
      let dust = ''
      for (let i = 0; i < 22; i++) { const [x, y] = pol(0, 0, 114 + R() * 28, R() * 360); dust += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + R() * 0.9)}" fill="${i % 3 ? P.d3 : P.d4}" opacity="${f(0.4 + R() * 0.5)}"/>` }
      return `<circle cx="144" cy="144" r="112.5" fill="none" stroke="${P.d3}" stroke-width="1" opacity=".5"/>` + ctr(`<g class="cq-a">${lines}${st}</g>${dust}`)
    },
  },
  // ───────────────────────── Meteoritos
  {
    slug: 'meteoritos', name: 'Meteoritos', rarity: 'raro', price: 1100, coll: 'cosmos', min: 52, palettes: PAL,
    css: `${spin('cm-a', 'cm-o', 7)}${spin('cm-b', 'cm-o', 11)}${spin('cm-c', 'cm-o', 9.5, true)}.cm-t{animation:cm-t .8s ease-in-out infinite alternate}${KF('cm-t', 'from{opacity:.75}to{opacity:1}')}`,
    back: (S, P) => glow(S, P.d4, 0.14),
    front: (S, P) => {
      const meteor = (r, a, len, sz, seed) => {
        const R = rng(seed)
        const tail = S.linU([[0, P.d4, 0], [0.5, P.d4, 0.7], [1, P.d3, 1]], pol(0, 0, r, a - len)[0], pol(0, 0, r, a - len)[1], pol(0, 0, r, a)[0], pol(0, 0, r, a)[1])
        const [x, y] = pol(0, 0, r, a)
        let rock = ''
        const n = 8
        for (let i = 0; i < n; i++) { const th = (i / n) * 6.283, rr = sz * (0.78 + R() * 0.4); rock += (i ? 'L' : 'M') + f(Math.cos(th) * rr) + ' ' + f(Math.sin(th) * rr) }
        return `<path d="${band(r, a - len, a, (t) => 0.4 + sz * 0.9 * t, 20, 0, 0)}" fill="${tail}" class="cm-t"/><circle cx="${f(x)}" cy="${f(y)}" r="${sz * 2.6}" fill="${S.radB([[0, P.d4, 0.7], [1, P.d4, 0]])}"/><g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="${rock}Z" fill="${S.radB([[0, P.lt('#8a7a70', 0.3)], [1, '#3a302c']], 0.35, 0.3, 0.9)}" stroke="${P.d4}" stroke-width="1.1"/><path d="M${-sz * 0.4} ${-sz * 0.3}l${sz * 0.3} ${sz * 0.2}M${sz * 0.1} ${sz * 0.35}l${sz * 0.3} ${-sz * 0.1}" stroke="#2a201c" stroke-width=".9"/></g>`
      }
      let bits = ''
      const R = rng(41)
      for (let i = 0; i < 10; i++) { const [x, y] = pol(0, 0, 118 + R() * 24, R() * 360); bits += sparkle(x, y, 1.8 + R() * 2, i % 2 ? P.d3 : P.d4, 'k-tw').replace('<path', `<path style="animation-delay:${-R() * 3}s"`) }
      return ctr(`<g class="cm-a">${meteor(127, 0, 78, 13, 3)}</g><g class="cm-b">${meteor(136, 130, 62, 9.5, 8)}</g><g class="cm-c">${meteor(122, 250, 70, 11, 13)}</g>${bits}`)
    },
  },
  // ───────────────────────── Nebulosa
  {
    slug: 'nebulosa', name: 'Nebulosa', rarity: 'raro', price: 1300, coll: 'cosmos', min: 52, palettes: PAL,
    css: `${spin('nb-a', 'nb-o', 90)}${spin('nb-b', 'nb-o', 130, true)}`,
    back: (S, P) => {
      const R = rng(9)
      const cloud = (col, n, rmin, rmax, seed) => {
        const Rr = rng(seed)
        let o = ''
        for (let i = 0; i < n; i++) {
          const a = Rr() * 360, r = rmin + Rr() * (rmax - rmin)
          const [x, y] = pol(0, 0, r, a)
          const rx = 22 + Rr() * 24, ry = 14 + Rr() * 14
          o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(a + 90 + Rr() * 40 - 20)} ${f(x)} ${f(y)})" fill="${S.radB([[0, col, 0.62], [0.55, col, 0.28], [1, col, 0]])}"/>`
        }
        return o
      }
      let stars = ''
      for (let i = 0; i < 26; i++) { const [x, y] = pol(0, 0, 112 + R() * 30, R() * 360); stars += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + R() * 1.1)}" fill="#fff" opacity="${f(0.4 + R() * 0.6)}"/>` }
      return ctr(`<g class="nb-a">${cloud(P.d1, 9, 116, 130, 2)}</g><g class="nb-b">${cloud(P.d4, 8, 118, 134, 5)}${cloud(P.d3, 4, 120, 132, 7)}</g>${stars}`)
    },
    front: (S, P) => {
      const R = rng(61)
      let st = ''
      for (let i = 0; i < 9; i++) { const [x, y] = pol(CX, CY, 118 + R() * 22, R() * 360); st += sparkle(x, y, 2.4 + R() * 3, '#fff', 'k-tw').replace('<path', `<path style="animation-delay:${-R() * 3}s"`) }
      return `<circle cx="144" cy="144" r="112" fill="none" stroke="${S.linU([[0, P.d3], [0.5, P.d1], [1, P.d4]], 30, 30, 260, 260)}" stroke-width="1.8" opacity=".85"/>` + st
    },
  },
  // ───────────────────────── Anillos de planeta
  (() => {
    const rings = (S, P, half) => {
      const g1 = S.linU([[0, P.d4], [0.5, P.d3], [1, P.d1]], -150, 0, 150, 0)
      const g2 = S.linU([[0, P.d1], [0.5, P.lt(P.d1, 0.5)], [1, P.d4]], -150, 0, 150, 0)
      const hp = (rx, ry) => (half === 'b' ? `M${-rx} 0A${rx} ${ry} 0 0 1 ${rx} 0` : `M${rx} 0A${rx} ${ry} 0 0 1 ${-rx} 0`)
      return `<g transform="translate(144 144) rotate(-16)"><path d="${hp(150, 38)}" fill="none" stroke="${P.d2}" stroke-width="15" opacity=".35" stroke-linecap="butt"/><path d="${hp(150, 38)}" fill="none" stroke="${g1}" stroke-width="11" stroke-linecap="butt" opacity=".95"/><path d="${hp(150, 38)}" fill="none" stroke="#fff" stroke-width="1" opacity=".5" transform="translate(0 -4)"/><path d="${hp(136, 33)}" fill="none" stroke="${g2}" stroke-width="5" opacity=".9"/><path d="${hp(162, 42)}" fill="none" stroke="${P.d3}" stroke-width="1.6" opacity=".7" stroke-dasharray="6 4"/></g>`
    }
    return {
      slug: 'anillos-de-planeta', name: 'Anillos de planeta', rarity: 'epico', price: 2600, coll: 'cosmos', min: 56, pad: 22, palettes: PAL,
      css: `.cp-m{animation:cp-m 14s linear infinite}${KF('cp-m', 'from{offset-distance:0%}to{offset-distance:100%}')}`,
      back: (S, P) => glow(S, P.d1, 0.14) + rings(S, P, 'b'),
      front: (S, P) => rings(S, P, 'f') + sparkle(30, 62, 3.6, P.d3, 'k-tw') + sparkle(262, 58, 2.8, '#fff', 'k-tw').replace('<path', '<path style="animation-delay:-1s"') + sparkle(250, 246, 3.2, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-2s"'),
    }
  })(),
  // ───────────────────────── Agujero negro
  {
    slug: 'agujero-negro', name: 'Agujero negro', rarity: 'legendario', price: 6000, coll: 'cosmos', min: 64, pad: 26, custom: true, palettes: PAL,
    css: `${spin('aq-a', 'aq-o', 30)}${spin('aq-b', 'aq-o', 46, true)}.aq-p{animation:aq-p 4s ease-in-out infinite}${KF('aq-p', '0%,100%{opacity:.7}50%{opacity:1}')}.aq-f{stroke-dasharray:90 22 24 22;animation:aq-f 3.2s linear infinite}${KF('aq-f', 'to{stroke-dashoffset:-316}')}`,
    back: (S, P) => {
      const warm = S.linU([[0, P.d4], [0.5, '#ffffff'], [1, P.d1]], -150, 0, 150, 0)
      const disk = (hp) => [[150, 31, 9, 0.55, P.d4], [141, 28, 13, 0.95, warm], [128, 24, 6, 0.9, P.d3]].map(([rx, ry, w, op, col], i) => `<path class="aq-f" style="animation-duration:${3.2 + i}s;animation-direction:${i % 2 ? 'reverse' : 'normal'}" d="${hp(rx, ry)}" fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`).join('')
      const hp = (rx, ry) => `M${-rx} 0A${rx} ${ry} 0 0 1 ${rx} 0`
      let warp = ''
      const R = rng(66)
      for (let i = 0; i < 30; i++) { const a = R() * 360; const [x0, y0] = pol(0, 0, 150 - R() * 10, a), [x1, y1] = pol(0, 0, 120, a + (R() > 0.5 ? 6 : -6)); warp += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="#fff" stroke-width=".7" opacity="${f(0.2 + R() * 0.5)}"/>` }
      return glow(S, P.d4, 0.3, 0.7, 0.84) + ctr(`<g class="aq-b">${warp}</g><g transform="rotate(-16)">${disk(hp)}</g>`) + `<circle cx="144" cy="144" r="120" fill="none" stroke="${P.d4}" stroke-width="11" opacity=".25"/><circle cx="144" cy="144" r="120" fill="none" stroke="${warm}" stroke-width="4" class="aq-p"/><circle cx="144" cy="144" r="120" fill="none" stroke="#fff" stroke-width="1.4"/>`
    },
    front: (S, P) => {
      const warm = S.linU([[0, P.d4], [0.5, '#ffffff'], [1, P.d1]], -150, 0, 150, 0)
      const hp = (rx, ry) => `M${rx} 0A${rx} ${ry} 0 0 1 ${-rx} 0`
      const disk = [[150, 31, 9, 0.55, P.d4], [141, 28, 13, 0.95, warm], [128, 24, 6, 0.9, P.d3]].map(([rx, ry, w, op, col], i) => `<path class="aq-f" style="animation-duration:${3.2 + i}s;animation-direction:${i % 2 ? 'reverse' : 'normal'}" d="${hp(rx, ry)}" fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`).join('')
      return ctr(`<g transform="rotate(-16)">${disk}</g>`) + sparkle(30, 40, 3.6, '#fff', 'k-tw') + sparkle(262, 244, 3, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1.2s"')
    },
  },
]
