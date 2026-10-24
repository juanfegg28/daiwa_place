// @ts-nocheck
// MÍTICAS — no se compran directo: logro / evento / beta. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth, sector } from '../core/util.js'
import { ctr, sparkle, glow, mirror, featherD, wingLeft, starD, crescentD, leafD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

export const MITICAS = [
  // ───────────────────────── Corona de eclipse (logro: completar 3 colecciones)
  {
    slug: 'corona-de-eclipse', name: 'Corona de eclipse', rarity: 'mitico', price: 0, coll: 'miticas', how: 'Logro: completar 3 colecciones', min: 64, pad: 40, custom: true,
    palettes: [
      pal('eclipse', 'Eclipse', '#FFD98A', '#0A0614', '#FFFFFF', '#FF9A4A'),
      pal('sangre', 'Luna de sangre', '#FF6B5A', '#12040A', '#FFE3DD', '#FFB04A'),
      pal('aurora', 'Aurora', '#7CF2FF', '#050B1C', '#F0FFFF', '#B98BFF'),
    ],
    css: `${spin('me-a', 'me-o', 140)}${spin('me-b', 'me-o', 200, true)}.me-d{transform-box:fill-box;transform-origin:50% 50%;animation:me-d 3.6s ease-in-out infinite}${KF('me-d', '0%,100%{transform:scale(.85) rotate(0);opacity:.85}50%{transform:scale(1.15) rotate(8deg);opacity:1}')}.me-p{animation:k-pu 4s ease-in-out infinite}`,
    back: (S, P) => {
      const R = rng(7)
      const mask = S.mask(`<circle cx="144" cy="144" r="190" fill="${S.rad([[0.58, '#fff', 0], [0.6, '#fff', 1], [0.8, '#fff', 0.55], [1, '#fff', 0]], 144, 144, 190)}"/>`)
      const ray = (a, L, w) => { const [x0, y0] = pol(0, 0, 112, a - w), [x1, y1] = pol(0, 0, 112, a + w), [x2, y2] = pol(0, 0, 112 + L, a); return `M${f(x0)} ${f(y0)}L${f(x2)} ${f(y2)}L${f(x1)} ${f(y1)}Z` }
      let rays1 = '', rays2 = ''
      for (let i = 0; i < 48; i++) { const a = (360 / 48) * i + R() * 3; rays1 += `<path d="${ray(a, 14 + R() * 30, 2.6)}" fill="${P.d1}" opacity="${f(0.45 + R() * 0.4)}"/>` }
      for (let i = 0; i < 24; i++) { const a = (360 / 24) * i + 4 + R() * 4; rays2 += `<path d="${ray(a, 34 + R() * 40, 1.8)}" fill="${P.d3}" opacity="${f(0.3 + R() * 0.3)}"/>` }
      return glow(S, P.d1, 0.45, 0.58, 0.72) + `<g mask="${mask}">` + ctr(`<g class="me-a">${rays1}</g><g class="me-b">${rays2}</g>`) + '</g>'
    },
    front: (S, P) => {
      const ring = S.linU([[0, P.d3], [0.5, P.d1], [1, P.d4]], 40, 40, 250, 250)
      const [dx, dy] = pol(144, 144, 113, -58)
      let beads = ''
      for (let i = -3; i <= 3; i++) { if (!i) continue; const [x, y] = pol(144, 144, 113, -58 + i * 4.6); beads += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.4 - Math.abs(i) * 0.4)}" fill="#fff" opacity="${f(0.95 - Math.abs(i) * 0.2)}"/>` }
      const diamond = `<g transform="translate(${f(dx)} ${f(dy)})"><circle r="26" fill="${S.radB([[0, '#fff', 0.9], [0.4, P.d1, 0.45], [1, P.d1, 0]])}" class="me-p"/><g class="me-d"><path d="M0 -22L3 -3L22 0L3 3L0 22L-3 3L-22 0L-3 -3Z" fill="#fff"/><path d="M0 -12L1.6 -1.6L12 0L1.6 1.6L0 12L-1.6 1.6L-12 0L-1.6 -1.6Z" fill="${P.d1}"/></g></g>`
      return `<circle cx="144" cy="144" r="116" fill="none" stroke="${P.d2}" stroke-width="10"/><circle cx="144" cy="144" r="111.4" fill="none" stroke="${ring}" stroke-width="2.6"/><circle cx="144" cy="144" r="121.4" fill="none" stroke="${P.d1}" stroke-width="1" opacity=".7"/>` + beads + diamond + sparkle(40, 236, 3.4, P.d3, 'k-tw') + sparkle(250, 240, 3, P.d1, 'k-tw').replace('<path', '<path style="animation-delay:-1.4s"')
    },
  },
  // ───────────────────────── Alas de fénix (evento de aniversario)
  {
    slug: 'alas-de-fenix', name: 'Alas de fénix', rarity: 'mitico', price: 0, coll: 'miticas', how: 'Evento de aniversario', min: 80, pad: 90, custom: true,
    palettes: [
      pal('fenix', 'Fénix', '#FF8A2B', '#5A0A0A', '#FFE08A', '#FF3B1F'),
      pal('celeste', 'Fénix celeste', '#3FA8FF', '#06204A', '#BFF0FF', '#7A5CFF'),
      pal('esmeralda', 'Fénix esmeralda', '#2EE59D', '#043524', '#D6FFE9', '#E8FF5A'),
    ],
    css: `.mf-f{transform-box:view-box;transform-origin:0 0;animation:mf-f 4.6s ease-in-out infinite alternate}${KF('mf-f', 'from{transform:rotate(3deg)}to{transform:rotate(-5deg)}')}.mf-t{transform-box:fill-box;transform-origin:50% 100%;animation:mf-t 1.7s ease-in-out infinite alternate}${KF('mf-t', '0%{transform:scale(.94,.9) skewX(-2deg)}100%{transform:scale(1.03,1.07) skewX(3deg)}')}.mf-e{animation:mf-e 4s ease-out infinite}${KF('mf-e', '0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(-10px,-80px);opacity:0}')}`,
    back: (S, P) => {
      const cols = [P.d2, P.d4, P.d1, P.d3]
      const rows = [
        { n: 11, a: [124, 200], len: [64, 130], w: 17, stops: [[0, P.d2], [0.32, P.d4], [0.7, P.d1], [1, P.d3, 0.0]], style: 'flame', edgeOp: 0.2, span: [0.0, 1], bend: 0.08 },
        { n: 11, a: [134, 204], len: [50, 102], w: 16, stops: [[0, P.d4], [0.4, P.d1], [1, P.d3, 0.0]], style: 'flame', edgeOp: 0.3, span: [0.03, 0.98], bend: 0.08 },
        { n: 9, a: [146, 208], len: [30, 60], w: 14, stops: [[0, P.d1], [0.55, P.d3], [1, '#fff', 0.0]], style: 'flame', edgeOp: 0.4, span: [0.06, 0.95], bend: 0.08 },
      ]
      const wl = wingLeft(S, { arm: [[92, 148], [26, 130], [2, 58]], rows, cols, shaft: false, edge: false })
      const wing = () => `<g transform="translate(92 148)"><g class="mf-f"><g transform="translate(-92 -148)"><g class="mf-t">${wl}</g></g></g></g>`
      const R = rng(18)
      let em = ''
      for (let i = 0; i < 16; i++) em += `<g transform="translate(${f(-20 + R() * 100)} ${f(60 + R() * 140)})"><circle class="mf-e" style="animation-delay:${-(R() * 4).toFixed(2)}s;animation-duration:${(3 + R() * 2.4).toFixed(2)}s" r="${f(1 + R() * 1.8)}" fill="${R() > 0.5 ? P.d3 : P.d4}"/></g>`
      return glow(S, P.d1, 0.38, 0.66, 0.82) + wing() + mirror(wing()) + em + mirror(em)
    },
    front: () => '',
  },
  // ───────────────────────── Marco Fundador (solo beta)
  {
    slug: 'marco-fundador', name: 'Marco Fundador', rarity: 'mitico', price: 0, coll: 'miticas', how: 'Solo cuentas beta (antes del 13-oct-2026)', min: 40, pad: 12, custom: true,
    palettes: [
      pal('fundador', 'Fundador', '#E8C46A', '#2A1A05', '#FFF4D2', '#A8741A'),
      pal('noche', 'Fundador noche', '#C9D4F0', '#0E1430', '#FFFFFF', '#6677B0'),
      pal('rosa', 'Fundador rosa', '#F0B8C4', '#3A1020', '#FFF0F3', '#B0607A'),
    ],
    css: `${spin('mu-a', 'mu-o', 12)}${selfc('mu-m')}.mu-m{animation:k-pu 4.6s ease-in-out infinite}`,
    back: (S, P) => glow(S, P.d1, 0.26),
    front: (S, P) => {
      const g = S.linU([[0, P.d3], [0.3, P.d1], [0.6, P.d4], [0.85, P.d1], [1, P.d3]], 30, 20, 260, 270)
      const pid = S.nid('t')
      S.defs.push(`<path id="${pid}" d="M144 144m-121 0a121 121 0 1 1 242 0a121 121 0 1 1 -242 0"/>`)
      const txt = `<text font-family="Cinzel,'Times New Roman',Georgia,serif" font-weight="700" font-size="11.5" fill="${P.d3}" letter-spacing="2.4"><textPath href="#${pid}" xlink:href="#${pid}" startOffset="0" textLength="${f(2 * Math.PI * 121 - 6)}" lengthAdjust="spacing">FUNDADOR • DAIWAPLACE • FUNDADOR • DAIWAPLACE • FUNDADOR • DAIWAPLACE • </textPath></text>`
      const sprig = (dir) => { let o = ''; for (let i = 0; i < 6; i++) { const a = 78 + dir * (i * 13); const [x, y] = pol(0, 0, 138, a); o += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90 + dir * 38})"><path d="${leafD(12 - i * 0.6, 4.2)}" fill="${g}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".6"/></g>` } return o }
      const moon = `<g transform="translate(144 8)"><circle r="22" fill="${S.radB([[0, P.d3, 0.6], [1, P.d3, 0]])}" class="mu-m"/><path d="${crescentD(14, 11.2, 5.6)}" fill="${g}" stroke="${P.d2}" stroke-width=".8" transform="rotate(-22)"/><path d="${starD(5, 5, 2.2)}" fill="#fff" transform="translate(7 -2)"/></g>`
      const gem = (a) => { const [x, y] = pol(0, 0, 118, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M0 -5L4 0L0 5L-4 0Z" fill="${P.d3}" stroke="${P.d4}" stroke-width=".8"/></g>` }
      return `<circle cx="144" cy="144" r="112.6" fill="none" stroke="${g}" stroke-width="3.4"/><circle cx="144" cy="144" r="132" fill="none" stroke="${g}" stroke-width="2.4"/><circle cx="144" cy="144" r="121.6" fill="none" stroke="${P.d2}" stroke-width="17" opacity=".78"/><circle cx="144" cy="144" r="129.6" fill="none" stroke="${P.d4}" stroke-width=".8"/><circle cx="144" cy="144" r="114" fill="none" stroke="${P.d4}" stroke-width=".8"/>${txt}` + ctr(`<g class="mu-a"><circle r="126.5" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="1 90" stroke-linecap="round" opacity=".9"/></g>${[30, 150, 210, 330].map(gem).join('')}${sprig(1)}${sprig(-1)}`) + moon + sparkle(30, 232, 3, P.d3, 'k-tw') + sparkle(256, 230, 3, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1.4s"')
    },
  },
]
