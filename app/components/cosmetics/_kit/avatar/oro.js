// @ts-nocheck
// Colección ORO BARROCO — destellos, filigrana, laurel y marco barroco. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth, sector } from '../core/util.js'
import { ctr, sparkle, glow, mirror, leafD, starD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('oro', 'Oro', '#E8B84A', '#3A2406', '#FFF1BF', '#B5701D'),
  pal('rosa', 'Oro rosa', '#E8A58F', '#3A1A14', '#FFE7DD', '#B86A55'),
  pal('plata', 'Plata', '#C9D1DF', '#1F2432', '#FFFFFF', '#7E8AA6'),
  pal('cobre', 'Cobre', '#D9824A', '#3A1A08', '#FFE3C9', '#8A4A1E'),
]
const metal = (S, P, vertical = false) => S.linU([[0, P.lt(P.d3, 0)], [0.28, P.d1], [0.55, P.d4], [0.78, P.d1], [1, P.d3]], 30, 20, 260, 270)

export const ORO = [
  // ───────────────────────── Destellos de oro
  {
    slug: 'destellos-de-oro', name: 'Destellos de oro', rarity: 'comun', price: 500, coll: 'oro', min: 28, palettes: PAL,
    css: `${spin('dd-a', 'dd-o', 90)}`,
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      const R = rng(88)
      const g = metal(S, P)
      let o = ''
      const N = 16
      for (let i = 0; i < N; i++) {
        const a = (360 / N) * i + (R() - 0.5) * 10
        const r = 118 + R() * 18
        const [x, y] = pol(0, 0, r, a)
        const big = i % 4 === 0
        const s = big ? 8.4 + R() * 3 : 3 + R() * 3.4
        o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 1.7)}" fill="${S.radB([[0, P.d1, 0.55], [1, P.d1, 0]])}"/>` + (i % 3 === 1 ? `<g transform="translate(${f(x)} ${f(y)}) rotate(45)"><rect x="${-s * 0.6}" y="${-s * 0.6}" width="${s * 1.2}" height="${s * 1.2}" fill="${g}" stroke="${P.d3}" stroke-width=".6" class="k-tw" style="animation-delay:${-(R() * 3).toFixed(1)}s"/></g>` : sparkle(x, y, s, big ? '#fff' : P.d3, 'k-tw', 1, 0.14).replace('<path', `<path style="animation-delay:${-(R() * 3).toFixed(1)}s"`))
      }
      return `<circle cx="144" cy="144" r="112.5" fill="none" stroke="${g}" stroke-width="3"/><circle cx="144" cy="144" r="115.6" fill="none" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".8"/>` + ctr(`<g class="dd-a">${o}</g>`)
    },
  },
  // ───────────────────────── Filigrana
  {
    slug: 'filigrana', name: 'Filigrana', rarity: 'raro', price: 1100, coll: 'oro', min: 52, palettes: PAL,
    css: `.fl-s{transform-box:view-box;transform-origin:0 0;animation:fl-s 8s linear infinite}${KF('fl-s', '0%{opacity:.7}50%{opacity:1}100%{opacity:.7}')}`,
    back: (S, P) => glow(S, P.d1, 0.16),
    front: (S, P) => {
      const g = metal(S, P)
      const spiral = (dir, size) => { const pts = []; for (let i = 0; i <= 26; i++) { const t = i / 26, a = t * 4.7, r = size * (1 - t * 0.9); pts.push([dir * Math.sin(a) * r * 0.9 + dir * size * 0.1, -Math.cos(a) * r + size * 0.05]) } return smooth(pts) }
      let units = ''
      const N = 14
      for (let i = 0; i < N; i++) {
        const a = (360 / N) * i
        const [x, y] = pol(0, 0, 122, a)
        units += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M-2 4C-6 -4 -12 -4 -14 -9" fill="none" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/><path d="M2 4C6 -4 12 -4 14 -9" fill="none" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/><g transform="translate(-17 -11)"><path d="${spiral(-1, 9)}" fill="none" stroke="${g}" stroke-width="2.2" stroke-linecap="round"/></g><g transform="translate(17 -11)"><path d="${spiral(1, 9)}" fill="none" stroke="${g}" stroke-width="2.2" stroke-linecap="round"/></g><path d="M0 4C-3 -6 -2 -14 0 -22C2 -14 3 -6 0 4Z" fill="${g}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".6"/><circle cy="-26" r="2.6" fill="${P.d3}" stroke="${P.d4}" stroke-width=".7"/></g>`
      }
      let beads = ''
      for (let i = 0; i < 56; i++) { const [x, y] = pol(0, 0, 114.4, i * (360 / 56)); beads += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="${P.d3}"/>` }
      return `<circle cx="144" cy="144" r="113" fill="none" stroke="${g}" stroke-width="3.6"/><circle cx="144" cy="144" r="117.8" fill="none" stroke="${P.d4}" stroke-width="1" opacity=".8"/>` + ctr(`<g class="fl-s">${units}${beads}</g>`) + sparkle(36, 52, 4, '#fff', 'k-tw') + sparkle(252, 232, 3.4, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1.4s"')
    },
  },
  // ───────────────────────── Laurel dorado
  {
    slug: 'laurel-dorado', name: 'Laurel dorado', rarity: 'raro', price: 1300, coll: 'oro', min: 52, palettes: PAL,
    css: `.ld-g{animation:ld-g 5s ease-in-out infinite}${KF('ld-g', '0%,100%{opacity:.8}50%{opacity:1}')}.ld-sw{transform-box:view-box;transform-origin:0 0;animation:ld-sw 8s ease-in-out infinite alternate}${KF('ld-sw', 'from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}')}`,
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      const g = S.lin([[0, P.d3], [0.45, P.d1], [1, P.d4]], 0, 0, 1, 1)
      const side = (dir) => {
        let o = ''
        const N = 14
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1)
          const a = 88 + dir * (t * 176)
          const r = 120
          const [x, y] = pol(0, 0, r, a)
          const tang = a + 90 * dir
          const L = 26 - t * 8
          const leaf = (rot, sc) => `<g transform="rotate(${f(rot)}) scale(${sc})"><path d="M0 0C9 -${L * 0.3} 9 -${L * 0.8} 0 -${L}C-9 -${L * 0.8} -9 -${L * 0.3} 0 0Z" fill="${g}" stroke="${P.d4}" stroke-width=".8"/><path d="M0 -3L0 -${L - 4}" stroke="${P.d2}" stroke-opacity=".45" stroke-width=".8"/><path d="M0 -9L4 -13M0 -15L4 -19M0 -9L-4 -13M0 -15L-4 -19" stroke="${P.d2}" stroke-opacity=".3" stroke-width=".6"/></g>`
          o += `<g transform="translate(${f(x)} ${f(y)})">${leaf(tang + 90 - dir * 34, 1)}${leaf(tang + 90 + dir * 34, 0.84)}</g>`
          if (i % 3 === 1) { const [bx, by] = pol(0, 0, r + 13, a + dir * 2); o += `<circle cx="${f(bx)}" cy="${f(by)}" r="3.4" fill="${S.radB([[0, '#fff'], [0.6, P.d3], [1, P.d1]], 0.35, 0.3, 0.8)}" stroke="${P.d4}" stroke-width=".7"/>` }
        }
        const stem = []
        for (let i = 0; i <= 20; i++) stem.push(pol(0, 0, 120, 88 + dir * ((i / 20) * 176)))
        return `<path d="${smooth(stem)}" fill="none" stroke="${P.d4}" stroke-width="3.4" stroke-linecap="round"/><path d="${smooth(stem)}" fill="none" stroke="${P.d3}" stroke-width="1.2" stroke-linecap="round"/>` + o
      }
      const gem = `<g transform="translate(0 -128)"><path d="M0 -12L9 0L0 12L-9 0Z" fill="${S.radB([[0, '#fff'], [0.5, P.d3], [1, P.d1]], 0.4, 0.35, 0.8)}" stroke="${P.d4}" stroke-width="1.2"/><path d="M0 -12L0 12M-9 0L9 0" stroke="${P.d4}" stroke-opacity=".5" stroke-width=".7"/></g>`
      const tie = `<g transform="translate(0 130)"><path d="M0 0C-9 -7 -18 -7 -22 0C-18 7 -9 7 0 0ZM0 0C9 -7 18 -7 22 0C18 7 9 7 0 0Z" fill="${g}" stroke="${P.d4}" stroke-width=".9"/><circle r="3.4" fill="${P.d3}" stroke="${P.d4}" stroke-width=".7"/><path d="M-2 4L-8 18M2 4L8 18" stroke="${P.d1}" stroke-width="3.4" stroke-linecap="round"/></g>`
      return ctr(`<g class="ld-sw ld-g">${side(1)}${side(-1)}</g>${gem}${tie}`)
    },
  },
  // ───────────────────────── Marco barroco
  {
    slug: 'marco-barroco', name: 'Marco barroco', rarity: 'epico', price: 2500, coll: 'oro', min: 56, pad: 14, palettes: PAL,
    css: `${spin('mb-a', 'mb-o', 8)}${selfc('mb-g')}.mb-g{animation:k-pu 3.6s ease-in-out infinite}`,
    back: (S, P) => glow(S, P.d1, 0.22),
    front: (S, P) => {
      const g = metal(S, P)
      const gd = S.linU([[0, P.d3], [0.5, P.d1], [1, P.d4]], 40, 20, 250, 270)
      // aro principal acanalado
      let flutes = ''
      for (let i = 0; i < 72; i++) { const a = i * 5; const [x0, y0] = pol(0, 0, 113, a), [x1, y1] = pol(0, 0, 124, a); flutes += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${P.d2}" stroke-opacity=".38" stroke-width=".9"/>` }
      const gemC = (a, r, s) => { const [x, y] = pol(0, 0, r, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M0 -${s * 1.35}C${s * 0.9} -${s} ${s} ${s * 0.6} 0 ${s * 1.3}C-${s} ${s * 0.6} -${s * 0.9} -${s} 0 -${s * 1.35}Z" fill="${S.radB([[0, '#fff'], [0.4, P.d4], [1, P.d2]], 0.35, 0.3, 0.9)}" stroke="${g}" stroke-width="1.8"/></g>` }
      // cartelas en puntos cardinales (hojas de acanto + remates)
      const acanthus = (a, big) => { const [x, y] = pol(0, 0, 124, a); const s = big ? 1.25 : 0.9; return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90}) scale(${s})"><path d="M0 0C-8 -4 -17 -2 -21 -10C-14 -9 -9 -12 -7 -17C-5 -9 -2 -6 0 -4C2 -6 5 -9 7 -17C9 -12 14 -9 21 -10C17 -2 8 -4 0 0Z" fill="${g}" stroke="${P.d2}" stroke-opacity=".6" stroke-width=".9"/><path d="M0 0C-2 -9 -1 -18 0 -27C1 -18 2 -9 0 0Z" fill="${g}" stroke="${P.d2}" stroke-opacity=".6" stroke-width=".8"/></g>` }
      const scal = (a) => { const [x, y] = pol(0, 0, 130, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M-13 6C-16 -4 -9 -12 0 -12C9 -12 16 -4 13 6C8 2 -8 2 -13 6Z" fill="${g}" stroke="${P.d2}" stroke-opacity=".7" stroke-width="1"/><path d="M-9 4C-9 -2 -5 -7 0 -7M9 4C9 -2 5 -7 0 -7M0 4V-8" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".8" fill="none"/></g>` }
      let beads = ''
      for (let i = 0; i < 60; i++) { const [x, y] = pol(0, 0, 127.4, i * 6); beads += `<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="${P.d3}" stroke="${P.d4}" stroke-width=".4"/>` }
      const card = [0, 90, 180, 270].map((a) => scal(a) + gemC(a, 118.5, 4.6)).join('')
      const diag = [45, 135, 225, 315].map((a) => acanthus(a, true)).join('') + [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((a) => acanthus(a, false)).join('')
      const sh = `<g class="mb-a"><path d="${sector(112, 130, -6, 6, 0, 0)}" fill="#fff" opacity=".6"/></g>`
      return `<circle cx="144" cy="144" r="118.4" fill="none" stroke="${P.d2}" stroke-width="14.4" opacity=".45"/><circle cx="144" cy="144" r="118.4" fill="none" stroke="${g}" stroke-width="12"/><circle cx="144" cy="144" r="112.6" fill="none" stroke="${P.d3}" stroke-width="1" opacity=".8"/><circle cx="144" cy="144" r="124.4" fill="none" stroke="${P.d2}" stroke-width=".8" opacity=".6"/>` + ctr(flutes + diag + beads + card + sh)
    },
  },
]
