// @ts-nocheck
// Colección DARK ACADEMIA — pergamino, tinta, sellos de cera, velas, libros. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, at, sparkle, glow, mirror, leafD, orbit, starD, crescentD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('pergamino', 'Pergamino', '#C79A5B', '#2E1B0C', '#F2E2BC', '#8E2F2F'),
  pal('esmeralda', 'Esmeralda', '#2E8B6A', '#082A1E', '#CFF3E2', '#D9B85C'),
  pal('burdeos', 'Burdeos', '#8A1F3C', '#2A0710', '#F3C7D0', '#D9B85C'),
  pal('tinta', 'Tinta', '#3E5AA8', '#0B1230', '#CFD9F7', '#D9B85C'),
]

export const ACADEMIA = [
  // ───────────────────────── Sello de cera
  {
    slug: 'sello-de-cera', name: 'Sello de cera', rarity: 'comun', price: 500, coll: 'academia', min: 40, palettes: PAL,
    css: `.ac-r{transform-box:fill-box;transform-origin:50% 0;animation:ac-r 5s ease-in-out infinite alternate}${KF('ac-r', 'from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}')}.ac-sh{animation:ac-s 5s ease-in-out infinite}${KF('ac-s', '0%,100%{opacity:.25}50%{opacity:.7}')}`,
    back: (S, P) => glow(S, P.d4, 0.14),
    front: (S, P) => {
      const wax = S.radB([[0, P.lt(P.d4, 0.35)], [0.55, P.d4], [1, P.dk(P.d4, 0.45)]], 0.38, 0.32, 0.85)
      const blob = 'M0 -26C9 -30 18 -27 22 -19C30 -18 33 -9 29 -2C35 5 32 15 24 18C23 26 14 31 7 28C1 33 -9 31 -13 26C-21 27 -29 20 -27 12C-34 6 -33 -4 -27 -9C-28 -18 -20 -25 -12 -24C-8 -29 -4 -29 0 -26Z'
      const ribbon = `<g class="ac-r"><path d="M-6 20C-10 40 -16 56 -26 70L-14 70L-8 80L0 40Z" fill="${S.lin([[0, P.d3], [1, P.mix(P.d3, P.d1, 0.5)]], 0, 0, 1, 1)}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".8"/><path d="M6 22C12 40 20 56 32 66L38 56L26 78L10 50Z" fill="${S.lin([[0, P.d3], [1, P.mix(P.d3, P.d1, 0.5)]], 1, 0, 0, 1)}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".8"/></g>`
      const emblem = `<g fill="none" stroke="${P.lt(P.d4, 0.45)}" stroke-width="1.6" stroke-linecap="round" opacity=".95"><circle r="15" stroke-width="2.2"/><path d="M-1 -9C-8 -4 -8 5 -1 9C-5 5 -5 -3 -1 -9Z" fill="${P.lt(P.d4, 0.45)}" stroke="none"/><path d="M6 -4L7.4 -1L10.4 -0.6L8.2 1.6L8.8 4.6L6 3.2L3.2 4.6L3.8 1.6L1.6 -0.6L4.6 -1Z" fill="${P.lt(P.d4, 0.45)}" stroke="none"/></g>`
      const seal = `<g transform="translate(212 212) rotate(-10) scale(1.5)">${ribbon}<path d="${blob}" fill="#000" opacity=".3" transform="translate(1.5 3)"/><path d="${blob}" fill="${wax}" stroke="${P.dk(P.d4, 0.5)}" stroke-width="1"/>${emblem}<path d="M-18 -16Q-10 -24 4 -24" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round" class="ac-sh"/></g>`
      const ink = `<path d="${arc(116, 196, 318)}" fill="none" stroke="${P.d4}" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="1 5" opacity=".85"/><path d="${arc(121, 205, 300)}" fill="none" stroke="${P.d1}" stroke-width="1.1" opacity=".7"/>`
      return ink + seal + sparkle(40, 56, 3.4, P.d3, 'k-tw') + sparkle(250, 70, 2.6, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1.4s"')
    },
  },
  // ───────────────────────── Laurel ceniza
  {
    slug: 'laurel-ceniza', name: 'Laurel ceniza', rarity: 'raro', price: 900, coll: 'academia', min: 52, palettes: PAL,
    css: `.al-s{transform-box:view-box;transform-origin:0 0;animation:al-s 7s ease-in-out infinite alternate}${KF('al-s', 'from{transform:rotate(-.9deg)}to{transform:rotate(.9deg)}')}.al-a{animation:al-a 7s ease-out infinite}${KF('al-a', '0%{transform:translate(0,0);opacity:0}15%{opacity:.8}100%{transform:translate(8px,-46px);opacity:0}')}`,
    back: (S, P) => glow(S, P.d1, 0.16),
    front: (S, P) => {
      const ash = P.mix('#8f8b92', P.d1, 0.22)
      const lf = S.lin([[0, P.lt(ash, 0.42)], [0.55, ash], [1, P.dk(ash, 0.35)]], 0, 1, 0, 0)
      const side = (dir) => {
        let o = ''
        const N = 17
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1)
          const a = 94 + dir * (t * 168)   // desde abajo hacia arriba
          const r = 118 + Math.sin(t * 5) * 1.4
          const [x, y] = pol(0, 0, r, a)
          const tang = a + 90 * dir
          const L = 22 - t * 6
          o += `<g transform="translate(${f(x)} ${f(y)})"><g transform="rotate(${f(tang + 90 - dir * 36)})"><path d="${leafD(L, 6.4)}" fill="${lf}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".7"/><path d="M0 -2L0 ${-L + 3}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".7"/></g><g transform="rotate(${f(tang + 90 + dir * 36)})"><path d="${leafD(L * 0.82, 5.4)}" fill="${lf}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".7"/></g></g>`
          if (i % 4 === 2) { const [bx, by] = pol(0, 0, r + 10, a + dir * 3); o += `<circle cx="${f(bx)}" cy="${f(by)}" r="2.6" fill="${P.d4}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".6"/>` }
        }
        const stem = []
        for (let i = 0; i <= 20; i++) stem.push(pol(0, 0, 118 + Math.sin((i / 20) * 5) * 1.4, 94 + dir * ((i / 20) * 168)))
        return `<path d="${smooth(stem)}" fill="none" stroke="${P.dk(ash, 0.4)}" stroke-width="2.4" stroke-linecap="round"/>` + o
      }
      const bowTie = `<g transform="translate(0 124)"><path d="M0 0C-8 -6 -16 -6 -20 0C-16 6 -8 6 0 0ZM0 0C8 -6 16 -6 20 0C16 6 8 6 0 0Z" fill="${P.d4}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".8"/><circle r="3.2" fill="${P.lt(P.d4, 0.3)}"/><path d="M-1 4L-6 16M1 4L6 16" stroke="${P.d4}" stroke-width="3" stroke-linecap="round"/></g>`
      let ashes = ''
      const R = rng(19)
      for (let i = 0; i < 7; i++) { const [x, y] = pol(0, 0, 118 + R() * 14, 200 + R() * 140); ashes += `<g transform="translate(${f(x)} ${f(y)})"><circle class="al-a" style="animation-delay:${-(R() * 7).toFixed(2)}s;animation-duration:${(5 + R() * 4).toFixed(2)}s" r="${f(0.9 + R() * 1.2)}" fill="${P.d3}"/></g>` }
      return ctr(`<g class="al-s">${side(1)}${side(-1)}</g>${bowTie}${ashes}`)
    },
  },
  // ───────────────────────── Libros en órbita
  (() => {
    const book = (P, col, w = 30, h = 22) => `<g><rect x="${-w / 2 + 1.4}" y="${-h / 2 + 1.6}" width="${w}" height="${h}" rx="2" fill="#000" opacity=".28"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2" fill="${col}" stroke="${P.d2}" stroke-width="1"/><rect x="${-w / 2 + 3.6}" y="${-h / 2 + 2}" width="${w - 6}" height="${h - 4}" fill="${P.d3}" opacity=".95"/><rect x="${-w / 2}" y="${-h / 2}" width="5" height="${h}" rx="1.6" fill="${P.dk(col, 0.25)}"/><path d="M${-w / 2 + 2.6} ${-h / 2 + 3}v${h - 6}" stroke="${P.d4}" stroke-width="1"/><rect x="${w / 2 - 12}" y="${-3.5}" width="9" height="7" rx="1" fill="${P.d4}" opacity=".9"/><path d="M${-w / 2 + 8} ${-h / 2 + 4}h${w - 18}" stroke="${P.d2}" stroke-opacity=".4"/></g>`
    const build = (S, P) => {
      const cs = [P.d1, P.mix(P.d1, P.d4, 0.5), P.dk(P.d1, 0.35), P.mix(P.d1, P.d3, 0.3), P.d4]
      return orbit(S, { rx: 140, ry: 46, tilt: -14, items: [{ th: 20, T: 14, art: book(P, cs[0], 44, 33) }, { th: 92, T: 14, art: book(P, cs[1], 36, 26) }, { th: 164, T: 14, art: book(P, cs[2], 42, 31) }, { th: 236, T: 14, art: book(P, cs[3], 38, 28) }, { th: 308, T: 14, art: book(P, cs[4], 42, 31) }] })
    }
    return {
      slug: 'libros-en-orbita', name: 'Libros en órbita', rarity: 'raro', price: 1200, coll: 'academia', min: 52, palettes: PAL, css: '',
      back: (S, P) => glow(S, P.d1, 0.14) + build(S, P).back,
      front: (S, P) => build(S, P).front + sparkle(40, 50, 3.4, P.d3, 'k-tw') + sparkle(250, 240, 3, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1s"'),
    }
  })(),
  // ───────────────────────── Velas flotantes
  {
    slug: 'velas-flotantes', name: 'Velas flotantes', rarity: 'epico', price: 2000, coll: 'academia', min: 56, palettes: PAL,
    css: `.av-f{transform-box:fill-box;transform-origin:50% 100%;animation:av-f .9s ease-in-out infinite alternate}${KF('av-f', '0%{transform:scale(.92,1.06) skewX(-3deg)}100%{transform:scale(1.05,.94) skewX(4deg)}')}.av-b{animation:av-b 5.5s ease-in-out infinite alternate}${KF('av-b', 'from{transform:translateY(-3px)}to{transform:translateY(4px)}')}.av-g{animation:av-g 1.4s ease-in-out infinite alternate}${KF('av-g', 'from{opacity:.55}to{opacity:.95}')}`,
    back: (S, P) => glow(S, P.d4, 0.2, 0.74, 0.86),
    front: (S, P) => {
      const wax = S.lin([[0, P.lt(P.d3, 0.4)], [0.5, P.d3], [1, P.mix(P.d3, P.d1, 0.45)]], 0, 0, 1, 0)
      const candle = (x, y, s, h, d, rot = 0) => {
        const halo = S.radB([[0, '#ffd27a', 0.7], [1, '#ffd27a', 0]])
        return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><g class="av-b" style="animation-delay:${-d * 1.3}s"><circle cy="${-h - 10}" r="26" fill="${halo}" class="av-g" style="animation-delay:${-d}s"/><path d="M-5.4 0V${-h}C-5.4 ${-h - 2.4} 5.4 ${-h - 2.4} 5.4 ${-h}V0C5.4 3 -5.4 3 -5.4 0Z" fill="${wax}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".8"/><ellipse cy="${-h}" rx="5.4" ry="2.1" fill="${P.lt(P.d3, 0.5)}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".6"/><path d="M-2.6 ${-h + 1}V${-h + 8}C-2.6 ${-h + 11} -0.6 ${-h + 11} -0.6 ${-h + 8}V${-h + 1}Z" fill="${P.lt(P.d3, 0.5)}" opacity=".9"/><path d="M0 ${-h}v-3" stroke="#3a2a14" stroke-width="1.1"/><g class="av-f" style="animation-delay:${-d * 0.4}s"><path d="M0 ${-h - 4}C4.6 ${-h - 9} 4.2 ${-h - 14} 0 ${-h - 20}C-4.2 ${-h - 14} -4.6 ${-h - 9} 0 ${-h - 4}Z" fill="${S.lin([[0, '#fff4c2'], [0.5, '#ffb13c'], [1, '#e8531c']], 0, 0, 0, 1)}"/><path d="M0 ${-h - 5}C2 ${-h - 8} 1.8 ${-h - 11} 0 ${-h - 14}C-1.8 ${-h - 11} -2 ${-h - 8} 0 ${-h - 5}Z" fill="#fffbe8"/></g></g></g>`
      }
      const cs = [[56, 70, 1.05, 30, 0, -12], [96, 38, 0.9, 26, 0.8, -4], [146, 22, 1.15, 34, 1.5, 0], [196, 38, 0.9, 24, 2.2, 5], [236, 66, 1.0, 30, 2.9, 12], [26, 150, 0.8, 22, 3.4, -16], [262, 156, 0.85, 24, 1.1, 16], [220, 248, 0.72, 20, 0.4, 8]]
      return cs.map((c) => candle(...c)).join('') + sparkle(80, 18, 2.8, '#ffe9a6', 'k-tw') + sparkle(210, 14, 3.2, '#ffe9a6', 'k-tw').replace('<path', '<path style="animation-delay:-1s"') + sparkle(268, 100, 2.4, '#ffe9a6', 'k-tw').replace('<path', '<path style="animation-delay:-2s"')
    },
  },
]
