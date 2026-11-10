// @ts-nocheck
// MIEMBROS · Círculo Lunar — parte 2: nivel ECLIPSE (las 6 decoraciones más espectaculares).
import { f, pol, rng } from '../core/util.js'
import {
  SP_CSS, metal, metalB, bevel, bloom, flare, twink, dust, jewel, drop, arc, pearlGrad, pearlG, crystal, satin, glowRing, ticks, petals, orb, sunRays,
} from './spArt.js'
import { SP_PAL } from './sp1.js'

const pt = (x, y) => `${f(x)} ${f(y)}`
const BASE = { rarity: 'mitico', price: 0, coll: 'supporters', custom: true }
const heart = (x, y, s, c, dl = 0) => `<g class="sp-bob" style="--d:${3 + (dl % 3)}s;animation-delay:${-dl}s"><path transform="translate(${pt(x, y)}) scale(${s})" d="M0 4C-9 -2 -7 -9 -3 -9C-1 -9 0 -7 0 -6C0 -7 1 -9 3 -9C7 -9 9 -2 0 4Z" fill="${c}" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/></g>`

// ══════════ 9 · CORONA DE LA TOTALIDAD — eclipse total: el avatar es la luna; corona solar, anillo de diamante y rayos
const corona = {
  ...BASE, slug: 'corona-de-la-totalidad', name: 'Corona de la Totalidad', min: 60, pad: 66, palettes: SP_PAL,
  back: (S, P) =>
    bloom(S, P.d1, 0.55, 104, 130, 210) +
    `<g class="sp-ra" style="animation-duration:240s">${sunRays(S, P, { n: 40, r0: 112, long: 52, short: 30, w: 2.6, c0: P.d3, c1: P.d1, seed: 2 })}</g>` +
    `<g class="sp-rb" style="animation-duration:180s">${sunRays(S, P, { n: 24, r0: 112, long: 38, short: 22, w: 3.6, off: 7, c0: P.lt(P.d4, 0.4), c1: P.d4, op: 0.8, seed: 5 })}</g>` +
    `<circle cx="144" cy="144" r="118" fill="none" stroke="${P.d3}" stroke-opacity=".22" stroke-width="12" class="sp-pu"/>` +
    `<g class="sp-rd">${dust(P, { n: 18, r0: 150, r1: 180, seed: 9 })}</g>`,
  front: (S, P) => {
    const [dx, dy] = pol(144, 144, 114, -42)
    return `<circle cx="144" cy="144" r="113.5" fill="none" stroke="#000" stroke-width="4"/>` +
      `<path d="${arc(144, 144, 115.4, -140, 60)}" fill="none" stroke="${S.linU([[0, P.d3, 0], [0.5, P.d3, 1], [1, P.d1, 0]], 20, 20, 260, 260)}" stroke-width="2.2" stroke-linecap="round"/>` +
      bevel(S, P, 112, 2.2) +
      // anillo de diamante
      `<circle cx="${f(dx)}" cy="${f(dy)}" r="26" fill="${S.rad([[0, '#fff', 0.95], [0.3, P.d3, 0.7], [1, P.d1, 0]], dx, dy, 26)}" class="sp-pu"/>` +
      flare(S, P, dx, dy, 34) + jewel(S, dx + 4, dy - 6, 5.4, '#ffffff', { bezel: P.d1 }) +
      twink(46, 62, 5.6, '#fff', 0.4) + twink(250, 232, 5, P.d3, 1.3) + twink(30, 208, 4, P.d3, 2.1) + twink(262, 150, 4, '#fff', 0.9) +
      `<g class="sp-rc">${dust(P, { n: 8, r0: 124, r1: 140, seed: 14, c: '#fff' })}</g>`
  },
}

// ══════════ 10 · CÁLIZ DE ROSAS — rosas enormes de pétalos en espiral, enredadera con espinas, rocío y pétalos que caen
const rose = (S, P, x, y, s, rot, c) => {
  let o = '', R = 22
  const cols = [P.dk(c, 0.55), P.dk(c, 0.2), c, P.lt(c, 0.3), P.lt(c, 0.55)]
  cols.forEach((col, i) => { o += petals(5 - (i > 2 ? 1 : 0), R * (1 - i * 0.17), 8.5 - i * 1.2, col, P.dk(c, 0.7), { rot: 10 + i * 31, sw: 0.55, curve: 0.55 }) })
  o += `<path d="M0 0m-3 0a3 3 0 1 1 3 3a5 5 0 1 1 -5 -5a8 8 0 1 1 8 8" fill="none" stroke="${P.dk(c, 0.7)}" stroke-width=".8" stroke-linecap="round"/>`
  o += `<path d="M-14 -12C-8 -18 4 -19 11 -14" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/><circle cx="6" cy="-6" r="1.4" fill="#fff" opacity=".9"/>`
  return `<g transform="translate(${pt(x, y)}) rotate(${rot}) scale(${s})"><circle r="26" fill="${S.radB([[0, c, 0.4], [1, c, 0]])}" class="sp-pu"/>${o}</g>`
}
const caliz = {
  ...BASE, slug: 'caliz-de-rosas', name: 'Cáliz de rosas', min: 60, pad: 58, palettes: SP_PAL,
  back: (S, P) => {
    let d = ''
    for (let i = 0; i <= 220; i++) { const a = (i * 360) / 220, r = 123 + 4 * Math.sin((a * Math.PI * 9) / 180); const [x, y] = pol(144, 144, r, a); d += (i ? 'L' : 'M') + pt(x, y) }
    let thorns = ''
    for (let i = 0; i < 36; i++) { const a = i * 10 + 3, r = 123 + 4 * Math.sin((a * Math.PI * 9) / 180), [x, y] = pol(144, 144, r, a), [tx, ty] = pol(144, 144, r + (i % 2 ? 7 : -7), a + 7); thorns += `<path d="M${pt(x, y)}L${pt(tx, ty)}L${pt(...pol(144, 144, r, a + 11))}Z" fill="${P.dk(P.d4, 0.55)}"/>` }
    let leaves = ''
    for (let i = 0; i < 26; i++) { const a = i * (360 / 26) + 5, [x, y] = pol(144, 144, 123 + 4 * Math.sin((a * Math.PI * 9) / 180), a); leaves += `<path transform="translate(${pt(x, y)}) rotate(${f(a + 90 + (i % 2 ? 40 : -40))})" d="M0 0C-5 -3 -7 -11 0 -17C7 -11 5 -3 0 0Z" fill="${P.dk(P.d4, 0.4)}" stroke="${P.d4}" stroke-width=".5"/>` }
    return bloom(S, P.d1, 0.3, 108, 130, 196) + `<path d="${d}Z" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="4.4"/><path d="${d}Z" fill="none" stroke="${P.dk(P.d4, 0.45)}" stroke-width="2.8"/><path d="${d}Z" fill="none" stroke="${P.d4}" stroke-width=".6" transform="translate(-.4 -.4)"/>` + thorns + leaves
  },
  front: (S, P) => {
    const spec = [[-140, 1.3, P.d1], [-100, 0.9, P.d4], [-60, 1.15, P.d1], [-14, 0.8, P.d4], [30, 1.0, P.d1], [72, 0.78, P.d4], [112, 1.18, P.d1], [158, 0.86, P.d4], [196, 0.8, P.d1]]
    let o = ''
    spec.forEach(([a, s, c], i) => { const [x, y] = pol(144, 144, 124, a); o += rose(S, P, x, y, s, a + 20 + i * 17, c) })
    let fall = ''
    ;[[40, 34, 0], [250, 60, 1.6], [262, 196, 0.8], [30, 190, 2.4]].forEach(([x, y, d], i) => { fall += `<g class="sp-fall" style="--dx:${i % 2 ? -14 : 14}px;--d:${6 + i}s;animation-delay:${-d * 2}s"><path transform="translate(${pt(x, y)}) rotate(${i * 50})" d="M0 0C-5 -3 -5 -10 0 -13C5 -10 5 -3 0 0Z" fill="${P.lt(P.d1, 0.35)}" stroke="${P.d1}" stroke-width=".5"/></g>` })
    let dew = ''
    ;[[-120, 0], [-80, 1], [-30, 2], [50, 3], [140, 4]].forEach(([a], i) => { const [x, y] = pol(144, 144, 140, a); dew += drop(S, P, x, y, 0.6, '#fff') })
    return bevel(S, P, 111.6, 2.2) + o + fall + twink(150, 8, 4.4, '#fff', 0.5) + twink(20, 100, 4, P.d3, 1.4) + twink(274, 110, 4.4, P.d3, 2.1) + twink(150, 284, 4, '#fff', 0.9)
  },
}

// ══════════ 11 · SERAFÍN LUNAR — alas de plumas de cristal con aureola flotante
const feather = (S, P, L, w, c, op = 1) => `<path d="M0 0C${f(-w)} ${f(-L * 0.25)} ${f(-w)} ${f(-L * 0.75)} 0 ${f(-L)}C${f(w)} ${f(-L * 0.75)} ${f(w)} ${f(-L * 0.25)} 0 0Z" fill="${crystal(S, P, c, { a: op })}" stroke="${P.lt(c, 0.5)}" stroke-width=".7"/><path d="M0 -2V${f(-L * 0.94)}" stroke="#fff" stroke-opacity=".7" stroke-width=".7"/><path d="M0 ${f(-L * 0.2)}L${f(-w * 0.8)} ${f(-L * 0.38)}M0 ${f(-L * 0.4)}L${f(-w * 0.8)} ${f(-L * 0.56)}M0 ${f(-L * 0.6)}L${f(-w * 0.6)} ${f(-L * 0.72)}M0 ${f(-L * 0.2)}L${f(w * 0.8)} ${f(-L * 0.38)}M0 ${f(-L * 0.4)}L${f(w * 0.8)} ${f(-L * 0.56)}M0 ${f(-L * 0.6)}L${f(w * 0.6)} ${f(-L * 0.72)}" stroke="#fff" stroke-opacity=".35" stroke-width=".4" fill="none"/>`
const wing = (S, P) => {
  // hombro en (84,150); tres filas de plumas abanicadas hacia la izquierda
  let o = ''
  const rows = [[10, 13, 88, 10.5, 'd4', 0.6], [9, 13, 72, 9, 'd1', 0.74], [8, 13, 56, 7.4, 'd3', 0.88]]
  rows.forEach(([n, sp, L, w, k, op], r) => { for (let i = 0; i < n; i++) { const a = -104 - i * (sp - r * 0.6) + r * 7; o += `<g transform="translate(${34 + r * 6} ${150 - r * 3}) rotate(${f(a + 90)})">${feather(S, P, L - i * 1.6, w, P[k], op)}</g>` } })
  // arco superior (hueso del ala)
  o += `<path d="M36 152C12 120 -14 86 -44 94" fill="none" stroke="${metal(S, P)}" stroke-width="3" stroke-linecap="round"/><path d="M36 152C12 120 -14 86 -44 94" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".7" stroke-linecap="round" transform="translate(0 -1)"/>`
  return o
}
const serafin = {
  ...BASE, slug: 'serafin-lunar', name: 'Serafín lunar', min: 80, pad: 112, palettes: SP_PAL,
  back: (S, P) => {
    const w = wing(S, P)
    return bloom(S, P.d1, 0.35, 108, 134, 210) +
      `<g class="sp-fa" style="--ox:100%;--oy:60%;--r:3deg;--d:6s">${w}</g>` +
      `<g transform="translate(288 0) scale(-1 1)"><g class="sp-fa" style="--ox:100%;--oy:60%;--r:3deg;--d:6s">${w}</g></g>` +
      `<g class="sp-rd">${dust(P, { n: 14, r0: 130, r1: 190, seed: 31 })}</g>`
  },
  front: (S, P) =>
    bevel(S, P, 111.6, 2.4) +
    `<g class="sp-bob" style="--d:5s">${glowRing(S, P.d3, 144, 10, 40, 9, 4.2, 0.95)}<ellipse cx="144" cy="10" rx="40" ry="9" fill="none" stroke="${metal(S, P)}" stroke-width="1.4" opacity=".9"/>${jewel(S, 144, 1, 3.4, P.d4, { bezel: P.d1 })}</g>` +
    flare(S, P, 144, 10, 14, { streak: false }) + jewel(S, 144, 270, 4.4, P.d4, { bezel: P.d1 }) + drop(S, P, 144, 282, 0.7) +
    twink(26, 40, 5, '#fff', 0.5) + twink(262, 44, 5, P.d3, 1.4) + twink(30, 250, 4.4, P.d3, 2.2) + twink(258, 252, 4.4, '#fff', 0.8),
}

// ══════════ 12 · RELOJ DE SELENE — bisel de reloj de luna: engranajes, esferas de fases y péndulo con luna
const reloj = {
  ...BASE, slug: 'reloj-de-selene', name: 'Reloj de Selene', min: 60, pad: 66, palettes: SP_PAL,
  back: (S, P) => {
    const gear = (cx, cy, r, n, h, cls, dur) => {
      let d = ''
      for (let i = 0; i < n; i++) { const a = (i * 360) / n, s = 180 / n * 0.5, p = [pol(cx, cy, r, a - s * 1.6), pol(cx, cy, r + h, a - s), pol(cx, cy, r + h, a + s), pol(cx, cy, r, a + s * 1.6)]; d += (i ? 'L' : 'M') + pt(...p[0]) + 'L' + pt(...p[1]) + 'L' + pt(...p[2]) + 'L' + pt(...p[3]) }
      return `<g class="${cls}" style="transform-box:fill-box;transform-origin:50% 50%;animation-duration:${dur}s"><path d="${d}Z" fill="${metalB(S, P)}" stroke="#1a0e04" stroke-width=".8" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.6)}" fill="${P.dk(P.d2, 0.1)}" stroke="#1a0e04" stroke-width=".8"/>${[0, 60, 120, 180, 240, 300].map((a) => { const [x, y] = pol(cx, cy, r * 0.6, a); return `<path d="M${pt(cx, cy)}L${pt(x, y)}" stroke="${metal(S, P)}" stroke-width="1.6"/>` }).join('')}<circle cx="${cx}" cy="${cy}" r="${f(r * 0.18)}" fill="${P.d4}" stroke="#1a0e04" stroke-width=".7"/></g>`
    }
    return bloom(S, P.d1, 0.28, 108, 130, 196) +
      gear(40, 52, 22, 14, 5, 'sp-ra', 40) + gear(248, 52, 16, 11, 4, 'sp-rb', 30) + gear(252, 238, 24, 14, 5, 'sp-rb', 44) + gear(38, 236, 15, 10, 4, 'sp-ra', 30) +
      `<circle cx="144" cy="144" r="125" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="16"/><circle cx="144" cy="144" r="125" fill="none" stroke="${metal(S, P)}" stroke-width="14"/>` +
      ticks('#1a0e04', 144, 144, 119, 60, 3, { every: 5, long: 6, w: 0.9, op: 0.85 })
  },
  front: (S, P) => {
    let ph = ''
    for (let i = 0; i < 12; i++) { const [x, y] = pol(144, 144, 125, -90 + i * 30); ph += jewel(S, x, y, i % 3 === 0 ? 4.4 : 2.8, i % 3 === 0 ? P.d4 : P.d3, { bezel: P.d1 }) }
    const pend = `<g class="sp-sw" style="--d:4s;transform-origin:144px 262px"><path d="M144 262V298" stroke="${metal(S, P)}" stroke-width="1.6"/><g transform="translate(144 304)"><circle r="13" fill="${P.d1}" opacity=".22" class="sp-pu"/><circle r="9.4" fill="${metalB(S, P)}" stroke="#1a0e04" stroke-width=".8"/><path d="M-4 -6A7 7 0 1 0 4 -6A5 5 0 1 1 -4 -6Z" fill="${P.d3}" transform="translate(0 1)"/></g></g>`
    return pend + bevel(S, P, 111.8, 2.4) + ph + flare(S, P, 144, 19, 12, { streak: false }) +
      `<path d="M0 0" /><rect x="136" y="256" width="16" height="9" rx="3" fill="${metalB(S, P)}" stroke="#1a0e04" stroke-width=".8"/>` +
      twink(24, 130, 4.4, '#fff', 0.4) + twink(268, 140, 4.4, P.d3, 1.2) + twink(150, 274, 3, '#fff', 2)
  },
}

// ══════════ 13 · CRISTALES DE ECLIPSE — esquirlas de cristal facetado que orbitan, con rayos de luz y anillo roto
const shard = (S, P, x, y, s, rot, c, dl) => {
  const body = 'M0 -22L9 -10L8 12L0 22L-8 12L-9 -10Z'
  return `<g class="sp-bob" style="--d:${4 + (dl % 3)}s;animation-delay:${-dl}s"><g transform="translate(${pt(x, y)}) rotate(${rot}) scale(${s})"><circle r="26" fill="${S.radB([[0, c, 0.35], [1, c, 0]])}" class="sp-pu"/>` +
    `<path d="${body}" fill="${crystal(S, P, c, { a: 0.9 })}" stroke="${P.lt(c, 0.55)}" stroke-width=".8" stroke-linejoin="round"/>` +
    `<path d="M0 -22L-1 22M9 -10L0 4L-9 -10M8 12L0 4L-8 12" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".6"/>` +
    `<path d="M0 -22L9 -10L0 4Z" fill="#fff" opacity=".32"/><path d="M0 4L8 12L0 22Z" fill="#000" opacity=".22"/></g></g>`
}
const cristales = {
  ...BASE, slug: 'cristales-de-eclipse', name: 'Cristales de eclipse', min: 60, pad: 62, palettes: SP_PAL,
  back: (S, P) => {
    // anillo roto en segmentos con huecos
    let seg = ''
    ;[[-170, -120], [-104, -62], [-44, 8], [26, 78], [96, 140], [156, 196]].forEach(([a, b]) => { seg += `<path d="${arc(144, 144, 120, a, b)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/><path d="${arc(144, 144, 120, a, b)}" fill="none" stroke="${S.linU([[0, P.d3], [1, P.d1]], 20, 20, 270, 270)}" stroke-width="4.4" stroke-linecap="round"/><path d="${arc(144, 144, 120, a + 3, b - 3)}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1" stroke-linecap="round"/>` })
    let beams = ''
    for (let i = 0; i < 8; i++) { const a = -90 + i * 45 + 12, [x0, y0] = pol(144, 144, 112, a), [x1, y1] = pol(144, 144, 168, a - 3), [x2, y2] = pol(144, 144, 168, a + 3); beams += `<path d="M${pt(x0, y0)}L${pt(x1, y1)}L${pt(x2, y2)}Z" fill="${S.rad([[0.68, P.d3, 0.28], [1, P.d3, 0]], 144, 144, 168)}"/>` }
    return bloom(S, P.d4, 0.4, 108, 130, 200) + beams + seg
  },
  front: (S, P) => {
    const spec = [[-120, 150, 1.5, -28, 'd3'], [-62, 150, 1.1, 24, 'd1'], [-18, 146, 0.8, 54, 'd4'], [28, 150, 1.3, -36, 'd1'], [74, 148, 0.9, 20, 'd3'], [118, 152, 1.6, -22, 'd4'], [162, 148, 1.0, 40, 'd1'], [200, 150, 0.8, -10, 'd3']]
    let o = ''
    spec.forEach(([a, r, s, rot, k], i) => { const [x, y] = pol(144, 144, r - 26, a); o += shard(S, P, x, y, s, rot + a + 90, P[k], i * 0.7) })
    return bevel(S, P, 111.6, 2.4) + `<g class="sp-rc">${o}</g>` + flare(S, P, 52, 60, 14) + flare(S, P, 238, 232, 12, { streak: false }) +
      twink(250, 60, 4.4, '#fff', 0.5) + twink(34, 220, 4.4, P.d3, 1.4) + twink(144, 6, 3.8, '#fff', 2.2)
  },
}

// ══════════ 14 · GATITA CELESTIAL — orejitas de gato con lazo, cascabel de luna, huellitas y corazones
const gatita = {
  ...BASE, slug: 'gatita-celestial', name: 'Gatita celestial', min: 60, pad: 62, palettes: SP_PAL,
  back: (S, P) => bloom(S, P.d1, 0.4, 108, 130, 196) + `<g class="sp-rd">${dust(P, { n: 12, r0: 140, r1: 178, seed: 17 })}</g>` + `<circle cx="144" cy="144" r="118" fill="none" stroke="${P.d1}" stroke-opacity=".4" stroke-width="1" stroke-dasharray="1.6 4.4"/>`,
  front: (S, P) => {
    const pg = pearlGrad(S, '#fff4f0')
    const ear = (sg) => {
      const [bx, by] = pol(144, 144, 114, -90 + sg * 38)
      return `<g transform="translate(${pt(bx, by)}) rotate(${sg * 26})"><g class="sp-fb" style="--ox:50%;--oy:100%;--d:${5 + (sg > 0 ? 1 : 0)}s">` +
        `<path d="M-24 6C-30 -22 -22 -46 -16 -58C-4 -50 18 -34 28 -10C30 -4 28 2 24 6Z" fill="${satin(S, P, P.d1)}" stroke="${P.dk(P.d1, 0.62)}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M-15 2C-19 -18 -14 -36 -11 -44C-2 -38 12 -26 19 -8C20 -3 18 0 15 2Z" fill="${P.lt(P.d4, 0.5)}" stroke="${P.d4}" stroke-width=".7"/>` +
        `<path d="M-10 0C-13 -14 -10 -28 -8 -34M-3 0C-5 -12 -2 -24 0 -28M4 0C3 -10 6 -18 8 -22" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".6" stroke-linecap="round"/>` +
        `<path d="M-24 6C-30 -22 -22 -46 -16 -58" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".8" stroke-dasharray="1.6 2"/>` +
        [[-23, -4], [-24, -14], [-22, -24], [-19, -34], [-17, -44], [-15, -53]].map(([x, y], i) => pearlG(pg, x - 1.4, y, 2 + (i % 2) * 0.4)).join('') +
        `</g></g>`
    }
    const bow = `<g transform="translate(144 268)">${[1, -1].map((m) => `<path transform="scale(${m} 1)" d="M0 0C10 -14 26 -14 28 -2C26 10 10 10 0 2Z" fill="${satin(S, P, P.d4)}" stroke="${P.dk(P.d4, 0.62)}" stroke-width="1"/>`).join('')}<circle r="4.8" fill="${satin(S, P, P.d1)}" stroke="${P.dk(P.d1, 0.62)}" stroke-width=".9"/><g class="sp-sw" style="--d:3s;transform-origin:0 6px"><path d="M0 6V12" stroke="${metal(S, P)}" stroke-width="1.2"/><circle cy="19" r="7" fill="${metalB(S, P)}" stroke="#1a0e04" stroke-width=".8"/><path d="M-5 17H5" stroke="#1a0e04" stroke-width=".9" opacity=".7"/><circle cy="22" r="1.4" fill="#1a0e04"/></g></g>`
    const paw = (x, y, s, c, r = 0) => `<g transform="translate(${pt(x, y)}) rotate(${r}) scale(${s})" opacity=".92"><ellipse cy="3" rx="5" ry="4.2" fill="${c}"/>${[[-6.4, -3], [-2.2, -6.2], [2.2, -6.2], [6.4, -3]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="2" ry="2.5" fill="${c}"/>`).join('')}</g>`
    return bevel(S, P, 111.6, 2.4) + ear(-1) + ear(1) + bow +
      jewel(S, 144, 24, 4.2, P.d3, { bezel: P.d1 }) +
      paw(36, 210, 1.2, P.d1, -20) + paw(252, 200, 1, P.d3, 24) + paw(262, 108, 0.8, P.d1, 14) +
      heart(30, 90, 1.3, P.d1, 0.4) + heart(256, 56, 0.9, P.d3, 1.8) + heart(54, 256, 0.9, P.d4, 2.6) +
      twink(104, 8, 3.8, '#fff', 0.9) + twink(262, 150, 4.4, P.d3, 1.5) + twink(18, 150, 4, '#fff', 0.5)
  },
}

export const SP2 = [corona, caliz, serafin, reloj, cristales, gatita]
export const SP2_TIER = { 'corona-de-la-totalidad': 'eclipse', 'caliz-de-rosas': 'eclipse', 'serafin-lunar': 'eclipse', 'reloj-de-selene': 'eclipse', 'cristales-de-eclipse': 'eclipse', 'gatita-celestial': 'eclipse' }
