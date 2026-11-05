// @ts-nocheck
// LESTAT DE LIONCOURT — 10 decoraciones de avatar MÍTICAS (exclusivas de @renshsh). Rediseño: oro grabado, rayos, terciopelo, cera y noche.
// Lienzo 288, avatar r=111 en (144,144). Paleta base: oro y carmesí sobre negro (como el perfil del dueño).
import { f, pol, rng } from '../core/util.js'
import { pal } from '../core/kit.js'
import { mirror } from '../core/svg.js'
import { LS_PAL, LS_CSS, taper, ruff, lace, fleur, goblet, fangs, brocadeRing, rosePetal, petalFall } from './lsArt.js'
import { LS2_CSS, metal, metalB, bloodSwirl, eng, bevel, bloom, flare, twink, dust, sunRays, jewel, drop, bat, velvetWing, royalCrown, shell, scroll, acanthus, thornVine, bloodRibbon } from './lsArt2.js'
import { rose } from '../core/svg.js'

const pt = (x, y) => `${f(x)} ${f(y)}`
const BASE = { rarity: 'mitico', price: 0, coll: 'lestat', custom: true }
const CSS = LS_CSS + LS2_CSS

// ───────── 1 · Eclipse del Príncipe — corona solar de dos capas que giran en sentidos opuestos
const eclipse = {
  ...BASE, slug: 'eclipse-del-principe', name: 'Eclipse del Príncipe', min: 56, pad: 46, palettes: LS_PAL, css: CSS,
  back: (S, P) =>
    bloom(S, P.d1, 0.6, 106, 128, 196) +
    `<g class="ls2-rb">${sunRays(S, P, { n: 40, off: 4.5, r0: 113, long: 72, short: 38, w: 1.5, c0: P.d3, c1: P.d3, op: 0.6, seed: 9 })}</g>` +
    `<g class="ls2-ra">${sunRays(S, P, { n: 40, r0: 113, long: 52, short: 27, w: 3.2, seed: 3 })}</g>` +
    `<g class="ls2-ra">${sunRays(S, P, { n: 10, off: 18, r0: 114, long: 34, short: 34, w: 5.5, c0: P.lt(P.d1, 0.7), c1: P.d4, op: 0.5, seed: 4 })}</g>`,
  front: (S, P) => {
    let ticks = ''
    for (let i = 0; i < 96; i++) { const a = (i * 360) / 96, [x0, y0] = pol(144, 144, 118.6, a), [x1, y1] = pol(144, 144, i % 4 ? 121.4 : 123.6, a); ticks += `M${pt(x0, y0)}L${pt(x1, y1)}` }
    const [bx, by] = pol(144, 144, 112, 90)
    return `<circle cx="144" cy="144" r="117.4" fill="none" stroke="#040203" stroke-width="11"/><circle cx="144" cy="144" r="122.6" fill="none" stroke="${P.d1}" stroke-width=".9" stroke-opacity=".8"/><path d="${ticks}" stroke="${P.d1}" stroke-width=".7" stroke-opacity=".75" fill="none"/>` +
      bevel(S, P, 111.8, 3.4) +
      `<path d="M${pt(...pol(144, 144, 113, 70))}Q${pt(144 + 30, 262)} ${pt(144 + 2, 262)}M${pt(...pol(144, 144, 113, 110))}Q${pt(144 - 30, 262)} ${pt(144 - 2, 262)}" fill="none" stroke="${metal(S, P)}" stroke-width="1.2"/>` +
      drop(S, P, 144, 266, 1.2) + jewel(S, bx, by + 1, 4.2, P.d4) +
      flare(S, P, 144, 22, 32) +
      jewel(S, ...pol(144, 144, 117.4, 20), 3, P.d3) + jewel(S, ...pol(144, 144, 117.4, 160), 3, P.d3) + jewel(S, ...pol(144, 144, 117.4, 200), 3, P.d3) + jewel(S, ...pol(144, 144, 117.4, 340), 3, P.d3) +
      `<g class="ls2-rc">${dust(P, { n: 12, r0: 126, r1: 168, seed: 5 })}</g><g class="ls2-rd">${dust(P, { n: 10, r0: 130, r1: 176, seed: 8, c: P.lt(P.d1, 0.5) })}</g>` +
      twink(34, 54, 6, '#fff', 0.4) + twink(256, 232, 6.4, P.d3, 1.6) + twink(250, 62, 4.6, P.d3, 2.4) + twink(40, 232, 4.4, '#fff', 0.9)
  },
}

// ───────── 2 · Alas de ónix y oro — alas de terciopelo con falanges de oro, aleteo lento
const wings = {
  ...BASE, slug: 'alas-de-onix-y-oro', name: 'Alas de ónix y oro', min: 80, pad: 86, palettes: LS_PAL,
  back: (S, P) => {
    const w = () => `<g class="ls2-wf" style="animation-delay:-2s">${velvetWing(S, P, { sc: 1.1, dark: true })}</g><g class="ls2-wf">${velvetWing(S, P)}</g>`
    return bloom(S, P.d4, 0.42, 110, 150, 210) + `<ellipse cx="144" cy="144" rx="150" ry="70" fill="${S.radB([[0, P.d4, 0.35], [1, P.d4, 0]])}" opacity=".7"/>` + w() + mirror(w())
  },
  front: (S, P) =>
    bevel(S, P, 112, 3.6) + jewel(S, 31, 144, 5.6, P.d4) + jewel(S, 257, 144, 5.6, P.d4) +
    jewel(S, ...pol(144, 144, 112, -120), 2.6, P.d3) + jewel(S, ...pol(144, 144, 112, -60), 2.6, P.d3) +
    `<g transform="translate(144 254)">${fangs(S, P, 0.95)}</g>` +
    twink(60, 40, 5, '#fff', 0.5) + twink(228, 36, 5.6, P.d3, 1.8) + twink(144, 8, 4, P.d3, 2.6),
}

// ───────── 3 · Corona de Lioncourt — corona real con arcos, perlas, rubí y zafiros
const crownAv = {
  ...BASE, slug: 'corona-de-lioncourt', name: 'Corona de Lioncourt', min: 60, pad: 58, palettes: LS_PAL,
  back: (S, P) => {
    const top = S.clip(`<rect x="-120" y="-120" width="520" height="262"/>`)
    return bloom(S, P.d1, 0.5, 108, 130, 196) + `<g clip-path="${top}">${sunRays(S, P, { n: 56, r0: 113, long: 70, short: 36, w: 1.7, seed: 12 })}</g>`
  },
  front: (S, P) =>
    bevel(S, P, 112, 3.6) +
    `<g transform="translate(144 22)">${royalCrown(S, P, 1.18)}</g>` +
    jewel(S, ...pol(144, 144, 112, -150), 3.4, '#3F6FE0') + jewel(S, ...pol(144, 144, 112, -30), 3.4, '#3F6FE0') + jewel(S, ...pol(144, 144, 112, 0), 2.6, P.d4) + jewel(S, ...pol(144, 144, 112, 180), 2.6, P.d4) +
    `<g transform="translate(144 258)">${fleur(S, P, 1.15, metalB(S, P))}</g>` + jewel(S, 144, 270, 4.6, P.d4) + jewel(S, 120, 266, 2.6, '#3F6FE0') + jewel(S, 168, 266, 2.6, '#3F6FE0') +
    twink(40, 70, 5.4, '#fff', 0.3) + twink(250, 74, 5, P.d3, 1.5) + twink(24, 150, 4, P.d3, 2.2) + twink(266, 164, 4, '#fff', 0.8) + twink(80, 22, 4.4, P.d3, 1.1) + twink(208, 20, 4.4, '#fff', 2.1),
}

// ───────── 4 · Gola de encaje real — tres volantes plisados, puntilla, gargantilla de terciopelo y camafeo
const gola = {
  ...BASE, slug: 'gola-de-encaje-real', name: 'Gola de encaje real', min: 56, pad: 8, palettes: LS_PAL,
  back: (S, P) =>
    bloom(S, P.d1, 0.28, 112, 138, 190) +
    `<g class="ls2-bb" style="transform-origin:144px 144px">${ruff(S, P, { r0: 100, r1: 140, n: 22, off: 0, bulge: 9, tone: -0.06 })}</g>` +
    `<g class="ls2-bb" style="transform-origin:144px 144px;animation-delay:-2s">${ruff(S, P, { r0: 100, r1: 128, n: 22, off: 8.2, bulge: 7, tone: 0.1 })}</g>` +
    ruff(S, P, { r0: 100, r1: 116, n: 22, off: 0, bulge: 5, tone: 0.2 }) + lace(P, 142, 66, P.d3, 0.95) + lace(P, 130, 44, P.d3, 0.5),
  front: (S, P) => {
    let pearls = ''
    for (let i = 0; i <= 26; i++) { const a = 36 + i * (108 / 26), [x, y] = pol(144, 144, 119 + Math.sin((i / 26) * Math.PI) * 6, a); pearls += `<circle cx="${f(x)}" cy="${f(y)}" r="2.1" fill="${S.radB([[0, '#fff'], [0.6, '#f3ead8'], [1, '#b3a78f']], 0.35, 0.3, 0.8)}" stroke="#4a3f30" stroke-width=".3"/>` }
    const prof = `<ellipse cx="0" cy="-3.4" rx="5" ry="6.6" fill="#f3ead8"/><path d="M-9 13Q-8 3 0 3Q8 3 9 13Z" fill="#f3ead8"/><path d="M3.6 -6L6.4 -3.4L4 -2.6Z" fill="#f3ead8"/>`
    return `<circle cx="144" cy="144" r="113.4" fill="none" stroke="#07040a" stroke-width="8.6"/><circle cx="144" cy="144" r="117.9" fill="none" stroke="${metal(S, P)}" stroke-width="1.1"/><circle cx="144" cy="144" r="109" fill="none" stroke="${metal(S, P)}" stroke-width=".9"/><circle cx="144" cy="144" r="113.4" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1.6" transform="translate(-.8 -.8)"/>` +
      pearls +
      `<g transform="translate(144 256)"><ellipse rx="17" ry="21" fill="${metal(S, P)}" stroke="${'#1a0e04'}" stroke-width="1"/><ellipse rx="14" ry="18" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".6"/><ellipse rx="12" ry="16" fill="${S.radB([[0, P.lt(P.d4, 0.1)], [1, P.dk(P.d4, 0.7)]], 0.5, 0.3, 0.9)}" stroke="#000" stroke-opacity=".6" stroke-width=".8"/>${prof}</g>` +
      jewel(S, 144, 234, 3.4, P.d4) + jewel(S, 144, 280, 2.6, '#fff') +
      twink(48, 66, 5, P.d3, 0.7) + twink(242, 72, 5, '#fff', 1.7) + twink(22, 160, 3.8, P.d3, 2.4) + twink(268, 172, 3.8, P.d3, 1.2)
  },
}

// ───────── 5 · Candelabro de los condenados — corona de velas con cera derretida
const candles = {
  ...BASE, slug: 'candelabro-de-los-condenados', name: 'Candelabro de los condenados', min: 56, pad: 62, palettes: LS_PAL,
  back: (S, P) => `<ellipse cx="144" cy="40" rx="150" ry="74" fill="${S.radB([[0, '#FF9A2A', 0.5], [0.5, P.d1, 0.2], [1, P.d1, 0]])}" class="ls-gl"/>` + bloom(S, P.d1, 0.2, 112, 134, 190),
  front: (S, P) => {
    const H = [34, 52, 40, 64, 46, 60, 40, 52, 34], D = [[9, 4, 14], [16, 6, 24], [8, 20, 10], [26, 10, 18], [12, 5, 22], [20, 9, 12], [7, 17, 11], [22, 8, 15], [10, 4, 17]]
    const wax = S.lin([[0, '#fff6e2'], [0.5, '#f0dcb8'], [1, '#b8996e']], 0, 0, 1, 0)
    // charco de cera sobre el aro y chorreras
    let band = '', drips = ''
    const a0 = -164, a1 = -16
    const [sx, sy] = pol(144, 144, 112, a0), [ex, ey] = pol(144, 144, 112, a1)
    band = `<path d="M${pt(sx, sy)}A112 112 0 0 1 ${pt(ex, ey)}" fill="none" stroke="#3a2418" stroke-opacity=".7" stroke-width="10.4" stroke-linecap="round"/><path d="M${pt(sx, sy)}A112 112 0 0 1 ${pt(ex, ey)}" fill="none" stroke="${wax}" stroke-width="8.2" stroke-linecap="round"/><path d="M${pt(sx, sy)}A112.6 112.6 0 0 1 ${pt(ex, ey)}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round" transform="translate(0 -2.4)"/>`
    ;[-150, -138, -122, -112, -96, -84, -70, -58, -44, -32, -20].forEach((a, i) => {
      const [x, y] = pol(144, 144, 112, a), L = [16, 9, 24, 12, 30, 10, 22, 12, 26, 9, 15][i], w = 2.5 + (i % 3) * 0.6
      drips += `<g transform="translate(${pt(x, y)}) rotate(${a + 90})"><path d="M${-w} -3V${L - w}Q0 ${L + w * 1.5} ${w} ${L - w}V-3Z" fill="${wax}" stroke="#3a2418" stroke-width=".55" stroke-opacity=".65"/><path d="M${-w * 0.4} 0V${L * 0.7}" stroke="#fff" stroke-opacity=".6" stroke-width=".7" stroke-linecap="round"/></g>`
    })
    let cs = ''
    for (let i = 0; i < 9; i++) {
      const a = -156 + i * 16.5, [x, y] = pol(144, 144, 111, a), lean = (a + 90) * 0.3
      cs += `<g transform="translate(${pt(x, y)}) rotate(${f(lean)})"><ellipse cx="0" cy="1" rx="6.6" ry="2.6" fill="${metalB(S, P)}" stroke="#1a0e04" stroke-width=".7"/>${taper(S, P, { x: 0, y: 0, h: H[i], w: 6.4, d: i * 0.9, drips: D[i] })}</g>`
    }
    return bevel(S, P, 112, 3.4) + band + drips + cs +
      `<path d="M${pt(...pol(144, 144, 112, 52))}A112 112 0 0 1 ${pt(...pol(144, 144, 112, 128))}" fill="none" stroke="#3a2418" stroke-opacity=".6" stroke-width="9" stroke-linecap="round"/><path d="M${pt(...pol(144, 144, 112, 52))}A112 112 0 0 1 ${pt(...pol(144, 144, 112, 128))}" fill="none" stroke="${wax}" stroke-width="7" stroke-linecap="round"/>` +
      [60, 72, 86, 100, 114, 124].map((a, i) => { const [x, y] = pol(144, 144, 112, a), L = [12, 22, 9, 28, 14, 10][i]; return `<g transform="translate(${pt(x, y)}) rotate(${a + 90})"><path d="M-2.4 -2V${L - 2.4}Q0 ${L + 3} 2.4 ${L - 2.4}V-2Z" fill="${wax}" stroke="#3a2418" stroke-width=".5" stroke-opacity=".6"/></g>` }).join('') +
      twink(30, 82, 4.6, P.d3, 0.4) + twink(258, 86, 4.6, '#fff', 1.4) + twink(36, 200, 3.8, P.d3, 2.2) + twink(252, 206, 3.8, P.d3, 0.9)
  },
}

// ───────── 6 · Espejo rococó — marco dorado barroco con concha, volutas, acantos y brillo de cristal
const mirrorAv = {
  ...BASE, slug: 'espejo-rococo', name: 'Espejo rococó', min: 56, pad: 40, palettes: LS_PAL,
  back: (S, P) => bloom(S, P.d1, 0.34, 120, 146, 196),
  front: (S, P) => {
    const G = metal(S, P)
    let pearls = '', leaves = ''
    for (let i = 0; i < 72; i++) { const [x, y] = pol(144, 144, 112.6, (i * 360) / 72); pearls += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="${S.radB([[0, '#fff'], [0.7, '#efe3c8'], [1, '#a89b80']], 0.35, 0.3, 0.8)}" stroke="#3a2f20" stroke-width=".25"/>` }
    for (let i = 0; i < 20; i++) { const a = -90 + i * 18; if ([0, 5, 10, 15].includes(i)) continue; const [x, y] = pol(144, 144, 122, a); leaves += `<g transform="translate(${pt(x, y)}) rotate(${a + 90})">${acanthus(S, P, 17, 7.4, i % 2 ? 8 : -8)}</g>` }
    const clip = S.clip(`<circle cx="144" cy="144" r="109"/>`)
    const sh = S.lin([[0, '#fff', 0], [0.5, '#fff', 0.42], [1, '#fff', 0]], 0, 0, 1, 0)
    return `<circle cx="144" cy="144" r="122" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="23"/><circle cx="144" cy="144" r="121.4" fill="none" stroke="${G}" stroke-width="20"/><circle cx="144" cy="144" r="131.2" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".7"/><circle cx="144" cy="144" r="111.8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/><circle cx="144" cy="144" r="121.4" fill="none" stroke="${'#1a0e04'}" stroke-opacity=".5" stroke-width=".8" stroke-dasharray="1.6 3.2"/>` +
      pearls + leaves +
      scroll(S, P, { ...(() => { const [x, y] = pol(144, 144, 126, -45); return { x, y } })(), rot: -45 + 90, s: 0.8 }) + scroll(S, P, { ...(() => { const [x, y] = pol(144, 144, 126, -135); return { x, y } })(), rot: -135 + 90, s: 0.8, flip: -1 }) +
      scroll(S, P, { ...(() => { const [x, y] = pol(144, 144, 126, 45); return { x, y } })(), rot: 45 + 90, s: 0.8, flip: -1 }) + scroll(S, P, { ...(() => { const [x, y] = pol(144, 144, 126, 135); return { x, y } })(), rot: 135 + 90, s: 0.8 }) +
      `<g transform="translate(144 36)">${shell(S, P, 1.05)}</g>` +
      `<g transform="translate(144 10)">${bat('#0b0508', 1.4, 0.3, P.d1)}<circle cx="-1.6" cy="0" r=".7" fill="${P.d4}"/><circle cx="1.6" cy="0" r=".7" fill="${P.d4}"/></g>` +
      jewel(S, 144, 262, 6.2, P.d4) + `<g transform="translate(144 262)"><g transform="translate(-22 4) rotate(100)">${acanthus(S, P, 15, 6.4)}</g><g transform="translate(22 4) rotate(-100)">${acanthus(S, P, 15, 6.4)}</g></g>` +
      `<g clip-path="${clip}"><g class="ls2-sh"><path d="M96 0H128L74 288H42Z" fill="${sh}"/><path d="M146 0H154L100 288H92Z" fill="${sh}" opacity=".6"/></g></g>` +
      twink(30, 60, 4.6, '#fff', 0.5) + twink(262, 70, 4.6, P.d3, 1.6) + twink(258, 220, 4, '#fff', 2.3)
  },
}

// ───────── 7 · Brocado bordado — la casaca azul con bordado de oro, cordón, perlas y borlas
export const BROC = [
  pal('azul', 'Brocado azul', '#3F6FD0', '#050914', '#E8F0FF', '#E0B14A'),
  pal('granate', 'Brocado granate', '#B3122E', '#0C0306', '#FFD9DE', '#E0B14A'),
  pal('esmeralda', 'Brocado verde', '#1F8F5F', '#03100A', '#D8FFEC', '#E0B14A'),
  pal('marfil', 'Brocado marfil', '#D9CDB0', '#0A0809', '#FFFFFF', '#8A1A2E'),
]
const brocado = {
  ...BASE, slug: 'brocado-bordado', name: 'Brocado bordado', min: 56, pad: 22, palettes: BROC,
  back: (S, P) => bloom(S, P.d1, 0.34, 124, 150, 190),
  front: (S, P) => {
    const base = S.lin([[0, P.lt(P.d1, 0.1)], [0.5, P.dk(P.d1, 0.45)], [1, P.dk(P.d1, 0.78)]], 0, 0, 1, 1)
    const cord = (r) => `<circle cx="144" cy="144" r="${r}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="4.6"/><circle cx="144" cy="144" r="${r}" fill="none" stroke="${metal(S, P, { c: P.d4 })}" stroke-width="3.2"/><circle cx="144" cy="144" r="${r}" fill="none" stroke="#1a0e04" stroke-opacity=".45" stroke-width="3.2" stroke-dasharray="1.8 2.4"/>`
    let pearls = '', gems = '', tass = ''
    for (let i = 0; i < 54; i++) { const [x, y] = pol(144, 144, 139.4, (i * 360) / 54); pearls += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="#fff6dc" stroke="#6a5f4c" stroke-width=".3"/>` }
    ;[[-90, P.d4, true], [0, '#E0314A', false], [90, P.d4, true], [180, '#E0314A', false], [-45, '#fff', false], [-135, '#fff', false], [45, '#fff', false], [135, '#fff', false]].forEach(([a, c, big]) => { const [x, y] = pol(144, 144, 125.4, a); gems += jewel(S, x, y, big ? 6 : 3.4, c === P.d4 ? '#2D63D8' : c, { bezel: P.d4 }) })
    ;[68, 112].forEach((a, i) => { const [x, y] = pol(144, 144, 138, a); tass += `<g transform="translate(${pt(x, y)})"><path d="M0 0Q${i ? -4 : 4} 12 0 20" stroke="${metalB(S, P, P.d4)}" stroke-width="2.2" fill="none"/><ellipse cx="0" cy="22" rx="5" ry="6" fill="${metalB(S, P, P.d4)}" stroke="#1a0e04" stroke-width=".7"/><path d="M-5 26L-6.4 40M-2.5 28L-3 43M0 28.4V44M2.5 28L3 43M5 26L6.4 40" stroke="${P.d4}" stroke-width="1.5" stroke-linecap="round"/></g>` })
    return `<circle cx="144" cy="144" r="125" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="29"/><circle cx="144" cy="144" r="125" fill="none" stroke="${base}" stroke-width="26"/>` +
      brocadeRing(S, P, { r: 125, n: 18, flower: P.d4, leaf: P.dk(P.d4, 0.22), pearl: '#fff6dc', rot: 6 }) +
      `<circle cx="144" cy="144" r="125" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="24" stroke-dasharray="4 22" transform="rotate(8 144 144)"/>` +
      cord(112.4) + cord(137.4) + pearls + gems + tass + twink(30, 56, 4.8, P.d3, 0.4) + twink(262, 62, 4.4, '#fff', 1.7) + twink(36, 236, 4, P.d3, 2.4)
  },
}

// ───────── 8 · Rosas negras y espinas — enredadera de espinas con rosas carmesí y negras
const roses = {
  ...BASE, slug: 'rosas-negras-y-espinas', name: 'Rosas negras y espinas', min: 56, pad: 34, palettes: LS_PAL,
  back: (S, P) => bloom(S, P.d4, 0.4, 112, 140, 190) + thornVine(S, P, { r: 120, amp: 4, k: 7, seed: 2 }).svg,
  front: (S, P) => {
    const spec = [[-92, 24, 0], [-44, 18, 1], [10, 22, 0], [64, 17, 1], [118, 24, 0], [172, 18, 1], [222, 21, 0]]
    let o = ''
    spec.forEach(([a, r, black], i) => {
      const [x, y] = pol(144, 144, 120 + (i % 2) * 2, a)
      // hojas a los lados
      o += `<g transform="translate(${pt(x, y)}) rotate(${a + 90})"><path d="M-6 3C-14 0 -22 -6 -22 -14C-14 -12 -8 -7 -6 3Z" fill="${P.dk(P.d4, 0.72)}" stroke="#000" stroke-width=".5" stroke-opacity=".6"/><path d="M6 3C14 0 22 -6 22 -14C14 -12 8 -7 6 3Z" fill="${P.dk(P.d4, 0.72)}" stroke="#000" stroke-width=".5" stroke-opacity=".6"/></g>`
      o += black ? rose(S, x, y, r, '#2a0f18', '#050203', '#74303f', { rot: i * 40 }) : rose(S, x, y, r, P.d4, P.dk(P.d4, 0.55), P.lt(P.d4, 0.4), { rot: i * 40 })
    })
    return bevel(S, P, 112, 3) + o +
      petalFall(60, 262, P.d4, 0.4, 1.1) + petalFall(160, 276, '#14080c', 2.4, 1) + petalFall(226, 250, P.d4, 4.2, 1.1) + petalFall(24, 130, P.dk(P.d4, 0.2), 1.6, 0.9) +
      twink(46, 40, 4.8, '#fff', 0.5) + twink(244, 36, 4.8, P.d3, 1.9) + twink(262, 196, 4, '#fff', 1.1) + twink(26, 214, 3.8, P.d3, 2.6)
  },
}

// ───────── 9 · Luna de sangre y murciélagos — luna carmesí enorme con corona y la bandada cruzándola
const moon = {
  ...BASE, slug: 'luna-de-sangre-y-murcielagos', name: 'Luna de sangre y murciélagos', min: 56, pad: 40, palettes: LS_PAL,
  back: (S, P) => {
    const mg = S.rad([[0, P.lt(P.d4, 0.5)], [0.55, P.d4], [1, P.dk(P.d4, 0.7)]], 202, 46, 76)
    return bloom(S, P.d4, 0.22, 112, 140, 190) +
      `<circle cx="212" cy="58" r="118" fill="${S.rad([[0.5, P.d4, 0.5], [0.7, P.d1, 0.28], [1, P.d4, 0]], 212, 58, 118)}" class="ls2-wg"/>` +
      `<circle cx="212" cy="58" r="74" fill="${mg}"/><circle cx="212" cy="58" r="74" fill="none" stroke="${P.lt(P.d1, 0.3)}" stroke-width="1.2" stroke-opacity=".8"/>` +
      [[190, 34, 13], [232, 52, 9], [206, 82, 15], [242, 24, 7], [174, 62, 8], [236, 92, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000" opacity=".17"/><circle cx="${x - 1}" cy="${y - 1}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width=".7"/>`).join('') +
      `<circle cx="144" cy="144" r="132" fill="none" stroke="${P.d1}" stroke-opacity=".35" stroke-width=".7" stroke-dasharray="1.6 5" class="ls2-rc"/><circle cx="144" cy="144" r="146" fill="none" stroke="${P.d3}" stroke-opacity=".25" stroke-width=".6" stroke-dasharray="1 7" class="ls2-rd"/>`
  },
  front: (S, P) => {
    const fly = [[196, 30, 1.7, 0], [238, 66, 1.2, 0.2], [168, 14, 1.0, 0.4], [30, 76, 1.3, 0.1], [14, 134, 0.8, 0.3], [262, 224, 1.0, 0.5], [60, 262, 0.9, 0.15], [112, 4, 0.7, 0.35]]
    return bevel(S, P, 112, 3.4) +
      fly.map(([x, y, s, d], i) => `<g transform="translate(${x} ${y})"><g class="ls2-bobb" style="animation-delay:${-i * 0.7}s">${bat('#050204', s, d, i < 3 ? P.d1 : P.d4)}</g></g>`).join('') +
      jewel(S, ...pol(144, 144, 112, 90), 4.6, P.d4) + twink(40, 190, 4.4, P.d3, 0.3) + twink(250, 140, 4.4, '#fff', 1.4) + twink(96, 28, 4, P.d3, 2.2)
  },
}

// ───────── 10 · Cáliz y río de sangre — dos cintas de sangre que se retuercen alrededor del avatar y la copa de cristal
const ribbon = {
  ...BASE, slug: 'caliz-y-rio-de-sangre', name: 'Cáliz y río de sangre', min: 56, pad: 40, palettes: LS_PAL,
  back: (S, P) =>
    bloom(S, P.d4, 0.4, 114, 142, 192) +
    `<g class="ls2-rb" style="animation-duration:90s">${bloodSwirl(S, P, { R0: 130, A: 10, k: 3, phase: 0.4, wmax: 11, w0: 1.4 })}</g>` +
    `<g class="ls2-ra" style="animation-duration:120s">${bloodSwirl(S, P, { R0: 128, A: 12, k: 5, phase: 2.2, wmax: 5.4, w0: 1, fillC: S.linU([[0, P.lt(P.d4, 0.4)], [1, P.dk(P.d4, 0.4)]], 30, 20, 260, 270) })}</g>`,
  front: (S, P) =>
    bevel(S, P, 112, 3.4) +
    goblet(S, P, { x: 224, y: 282, s: 1.55, rot: -6 }) +
    `<g transform="translate(231 230)">${[0, 1.1, 2.2].map((d, i) => `<g class="ls2-dp" style="animation-delay:${-d}s"><path d="M${(i - 1) * 3.4} -26C${(i - 1) * 3.4 + 2.2} -23 ${(i - 1) * 3.4 + 2.8} -21 ${(i - 1) * 3.4} -19.6C${(i - 1) * 3.4 - 2.8} -21 ${(i - 1) * 3.4 - 2.2} -23 ${(i - 1) * 3.4} -26Z" fill="${P.d4}" stroke="${P.dk(P.d4, 0.6)}" stroke-width=".4"/></g>`).join('')}</g>` +
    jewel(S, ...pol(144, 144, 112, -90), 3.8, P.d4) + jewel(S, ...pol(144, 144, 112, 180), 2.8, P.d3) + jewel(S, ...pol(144, 144, 112, 0), 2.8, P.d3) +
    twink(38, 60, 5, '#fff', 0.5) + twink(250, 56, 5, P.d3, 1.7) + twink(30, 214, 4, P.d3, 2.4) + twink(264, 150, 3.8, '#fff', 0.9),
}

export const LS1 = [eclipse, wings, crownAv, gola, candles, mirrorAv, brocado, roses, moon, ribbon]
export { LS_PAL, LS_CSS }
