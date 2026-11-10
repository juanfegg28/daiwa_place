// @ts-nocheck
// MIEMBROS · Círculo Lunar — decoraciones de avatar MÍTICAS, parte 1 (Luna Creciente y Luna Llena).
// Lienzo 288, avatar r=111 en (144,144). 10 paletas: 5 oscuras y 5 rosas/pastel. Todo original, hecho con código.
import { f, pol, rng } from '../core/util.js'
import { pal } from '../core/kit.js'
import {
  SP_CSS, metal, metalB, eng, bevel, bloom, flare, twink, dust, jewel, drop, arc, moonPhase, pearlGrad, pearlG, crystal, satin, glowRing, ticks, petals, orb,
} from './spArt.js'

const pt = (x, y) => `${f(x)} ${f(y)}`
const BASE = { rarity: 'mitico', price: 0, coll: 'supporters', custom: true }

// 5 oscuras + 5 rosas/pastel (d1 principal · d2 base oscura · d3 luz · d4 acento)
export const SP_PAL = [
  pal('medianoche', 'Medianoche', '#9DB4FF', '#070A1C', '#E6EEFF', '#5B6CFF'),
  pal('sangre-lunar', 'Sangre lunar', '#FF3B58', '#12040A', '#FFC2CC', '#B0102F'),
  pal('obsidiana', 'Obsidiana y hielo', '#C9CEDA', '#08080C', '#FFFFFF', '#55E0FF'),
  pal('orquidea', 'Orquídea noir', '#B65CFF', '#0E0418', '#EBCBFF', '#FF4FD8'),
  pal('abismo', 'Abismo esmeralda', '#38F0B0', '#04120F', '#CFFFEF', '#12A58F'),
  pal('rosa-eclipse', 'Rosa eclipse', '#FF5CAE', '#26081B', '#FFD3EA', '#FF2E8E'),
  pal('algodon', 'Algodón de azúcar', '#FFA6D5', '#3A1632', '#FFF0F8', '#A5B4FF'),
  pal('chicle', 'Chicle neón', '#FF3DA5', '#1E0716', '#FFE5F3', '#4DE2FF'),
  pal('sakura', 'Sakura', '#FFB7C9', '#2A0F1D', '#FFFFFF', '#F58AA8'),
  pal('rosa-oro', 'Rosa y oro', '#F2A488', '#2B1117', '#FFE6D6', '#E86F95'),
]

const heart = (x, y, s, c, dl = 0, cls = 'sp-bob') => `<g class="${cls}" style="--d:${3 + (dl % 3)}s;animation-delay:${-dl}s"><path transform="translate(${pt(x, y)}) scale(${s})" d="M0 4C-9 -2 -7 -9 -3 -9C-1 -9 0 -7 0 -6C0 -7 1 -9 3 -9C7 -9 9 -2 0 4Z" fill="${c}" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/></g>`

// ══════════ 1 · HALO NACIENTE (Luna Creciente) — luna creciente que sale detrás del avatar y un ciclo de fases en órbita
const halo = {
  ...BASE, slug: 'halo-naciente', name: 'Halo Naciente', min: 56, pad: 44, palettes: SP_PAL, css: SP_CSS,
  back: (S, P) => {
    const mk = S.mask(`<rect x="-100" y="-100" width="500" height="500" fill="#fff"/><circle cx="196" cy="34" r="46" fill="#000"/>`)
    let phases = ''
    for (let i = 0; i < 8; i++) {
      const [x, y] = pol(144, 144, 132, -90 + i * 45), t = i / 8
      phases += `<g transform="translate(${pt(x, y)})"><circle r="8.6" fill="#000" opacity=".5"/><circle r="7" fill="${P.dk(P.d2, 0.1)}" stroke="${P.d1}" stroke-width="1.1"/>${t === 0 ? '' : `<g ${t > 0.5 ? 'transform="scale(-1 1)"' : ''}><path d="${moonPhase(6.2, t > 0.5 ? 1 - t : t)}" fill="${P.d3}"/></g>`}${t === 0 ? '' : ''}<circle r="7" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".5"/></g>`
    }
    return bloom(S, P.d1, 0.42, 106, 128, 196) +
      `<circle cx="222" cy="62" r="84" fill="${S.rad([[0.5, P.d1, 0.45], [1, P.d1, 0]], 222, 62, 84)}" class="sp-pu"/>` +
      `<g mask="${mk}"><circle cx="222" cy="62" r="54" fill="${S.linU([[0, P.lt(P.d3, 0.2)], [0.5, P.d1], [1, P.dk(P.d4, 0.3)]], 180, 24, 252, 106)}"/>` +
      [[214, 98, 8], [240, 84, 5], [200, 112, 4], [250, 108, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000" opacity=".16"/>`).join('') + `</g>` +
      `<path d="${arc(222, 62, 54, 70, 330)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>` +
      `<circle cx="144" cy="144" r="132" fill="none" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".7" stroke-dasharray="1.5 4.5"/>` +
      `<g class="sp-rc">${phases}</g>` +
      `<g class="sp-rd">${dust(P, { n: 14, r0: 142, r1: 170, seed: 4 })}</g>`
  },
  front: (S, P) => {
    const g = S.linU([[0, P.d3, 0], [0.5, P.d3, 1], [1, P.d1, 0]], 20, 60, 270, 240)
    return `<path d="${arc(144, 144, 117, -206, 26)}" fill="none" stroke="${P.d1}" stroke-opacity=".25" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="${arc(144, 144, 117, -206, 26)}" fill="none" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="${arc(144, 144, 117, -206, 26)}" class="sp-run" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>` +
      bevel(S, P, 111.6, 2.6) +
      flare(S, P, 186, 30, 17) + flare(S, P, 52, 214, 11, { streak: false }) +
      `<path d="M24 34L58 60" stroke="${S.linU([[0, '#fff', 0], [1, P.d3, 1]], 24, 34, 58, 60)}" stroke-width="1.4" stroke-linecap="round"/><circle cx="58" cy="60" r="2.4" fill="#fff"/>` +
      twink(30, 120, 5, '#fff', 0.3) + twink(256, 200, 5.6, P.d3, 1.2) + twink(80, 252, 4, P.d3, 2.1) + twink(246, 120, 4, '#fff', 0.8)
  },
}

// ══════════ 2 · LAZO DE SEDA Y PERLAS — gran lazo de satén, collar de perlas con luna, borde de encaje y corazoncitos
const lazo = {
  ...BASE, slug: 'lazo-de-seda-y-perlas', name: 'Lazo de seda y perlas', min: 56, pad: 40, palettes: SP_PAL,
  back: (S, P) => {
    // borde de encaje con festón
    let lace = '', N = 40
    for (let i = 0; i < N; i++) { const a0 = (i * 360) / N, a1 = ((i + 1) * 360) / N, [x0, y0] = pol(144, 144, 119, a0), [x1, y1] = pol(144, 144, 119, a1); lace += `M${pt(x0, y0)}A5 5 0 0 1 ${pt(x1, y1)}` }
    let eyelets = ''
    for (let i = 0; i < N; i++) { const [x, y] = pol(144, 144, 115.4, (i + 0.5) * (360 / N)); eyelets += `<circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="${P.d3}" opacity=".8"/>` }
    return bloom(S, P.d4, 0.3, 106, 128, 190) +
      `<circle cx="144" cy="144" r="117" fill="none" stroke="${P.lt(P.d1, 0.7)}" stroke-opacity=".22" stroke-width="9"/>` +
      `<path d="${lace}" fill="none" stroke="${P.d3}" stroke-width="1.5" stroke-opacity=".9"/><path d="${lace}" fill="none" stroke="${P.d1}" stroke-width=".6" stroke-opacity=".8" transform="translate(0 -.4)"/>` + eyelets
  },
  front: (S, P) => {
    const pg = pearlGrad(S, '#fff4f0'), pg2 = pearlGrad(S, P.lt(P.d1, 0.78))
    let pearls = ''
    for (let a = 8; a <= 172; a += 4.6) { const [x, y] = pol(144, 144, 121, a); pearls += pearlG(pg, x, y + Math.sin(((a - 8) / 164) * Math.PI) * 3, 3.1 + 1.1 * Math.sin(((a - 8) / 164) * Math.PI)) }
    for (let a = 22; a <= 158; a += 9) { const [x, y] = pol(144, 144, 131, a); pearls += pearlG(pg2, x, y + Math.sin(((a - 22) / 136) * Math.PI) * 5, 3.6 + 1.2 * Math.sin(((a - 22) / 136) * Math.PI)) }
    // dije de luna colgando del centro
    const charm = `<g transform="translate(144 270)"><path d="M0 -8V-2" stroke="${metal(S, P)}" stroke-width="1.4"/><g transform="translate(0 10)"><path d="M-8 -6A10 10 0 1 0 8 -6A7.2 7.2 0 1 1 -8 -6Z" fill="${metalB(S, P)}" stroke="#2a1218" stroke-width=".7"/><path d="M-8 -6A10 10 0 1 0 8 -6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".5" transform="translate(-.4 -.4)"/>${pearlG(pg, 0, 12, 3.2)}</g></g>`
    // lazo de satén (local 0,0 = nudo)
    const loop = (m) => `<g transform="scale(${m} 1)"><path d="M0 0C-12 -34 -56 -40 -64 -12C-68 12 -34 26 0 3Z" fill="${satin(S, P, P.d1)}" stroke="${P.dk(P.d1, 0.62)}" stroke-width="1" stroke-linejoin="round"/><path d="M-4 -2C-18 -22 -44 -26 -52 -10C-56 4 -34 14 -6 2Z" fill="${P.dk(P.d4, 0.2)}" opacity=".28"/><path d="M-3 -4C-14 -26 -46 -34 -58 -14M-8 0C-26 -8 -46 -2 -56 -4M-6 4C-24 8 -44 10 -56 2" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width=".7"/><path d="M0 0C-12 -34 -56 -40 -64 -12C-68 12 -34 26 0 3Z" fill="none" stroke="${P.d3}" stroke-width=".6" stroke-dasharray="1.4 1.6" transform="scale(.93) translate(2 0)" opacity=".8"/></g>`
    const tail = (m, len) => `<g transform="scale(${m} 1)"><path d="M-3 4C-16 ${len * 0.35} -28 ${len * 0.68} -38 ${len}L-26 ${len - 10}L-18 ${len + 4}C-12 ${len * 0.62} -4 ${len * 0.32} 3 8Z" fill="${satin(S, P, P.d4)}" stroke="${P.dk(P.d4, 0.62)}" stroke-width="1" stroke-linejoin="round"/><path d="M-6 10C-16 ${len * 0.42} -24 ${len * 0.7} -30 ${len - 4}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".8"/></g>`
    const bow = `<g transform="translate(60 58) rotate(-34)">${tail(1, 74)}${tail(-1, 56)}${loop(1)}${loop(-1)}<rect x="-10" y="-9" width="20" height="18" rx="7" fill="${satin(S, P, P.d1)}" stroke="${P.dk(P.d1, 0.62)}" stroke-width="1"/><path d="M-7 -4C-3 -8 3 -8 7 -4M-7 3C-3 7 3 7 7 3" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".7"/>${pearlG(pearlGrad(S, '#fff'), 0, 0, 5)}</g>`
    return bevel(S, P, 111.6, 2.4) + pearls + charm + bow +
      heart(244, 66, 1.4, P.d1, 0.2) + heart(262, 108, 0.9, P.d3, 1.4) + heart(40, 214, 1.1, P.d4, 2.2) + heart(228, 238, 0.8, P.d1, 0.9) +
      twink(34, 138, 5, '#fff', 0.5) + twink(254, 150, 4.6, P.d3, 1.6) + twink(210, 30, 4, P.d3, 2.2) + twink(100, 20, 3.6, '#fff', 0.9)
  },
}

// ══════════ 3 · JARDÍN DE LUNA — corona de flores nocturnas (cereus), hojas, capullos y luciérnagas
const jardin = {
  ...BASE, slug: 'jardin-de-luna', name: 'Jardín de luna', min: 56, pad: 40, palettes: SP_PAL,
  back: (S, P) => {
    // enredadera cerrada y ondulada
    let d = '', pts = []
    for (let i = 0; i <= 240; i++) { const a = (i * 360) / 240, r = 121 + 4.4 * Math.sin((a * Math.PI * 7) / 180); const [x, y] = pol(144, 144, r, a); pts.push([x, y]); d += (i ? 'L' : 'M') + pt(x, y) }
    const leafC = P.dk(P.d4, 0.5), leaf = (x, y, a, s) => `<g transform="translate(${pt(x, y)}) rotate(${f(a)}) scale(${s})"><path d="M0 0C-6 -4 -7 -13 0 -21C7 -13 6 -4 0 0Z" fill="${leafC}" stroke="${P.d4}" stroke-width=".6"/><path d="M0 0V-18" stroke="${P.lt(P.d4, 0.4)}" stroke-width=".5" opacity=".8"/></g>`
    let leaves = ''
    for (let i = 0; i < 44; i++) { const a = i * (360 / 44) + 2, [x, y] = pol(144, 144, 121 + 4.4 * Math.sin((a * Math.PI * 7) / 180), a); leaves += leaf(x, y, a + 90 + (i % 2 ? 38 : -38), 0.62 + 0.3 * ((i * 7) % 5) / 5) }
    let buds = ''
    for (const a of [-20, 58, 146, 212, 250]) { const [x, y] = pol(144, 144, 126, a); buds += `<g transform="translate(${pt(x, y)}) rotate(${a + 90})"><path d="M0 0C-4 -4 -4 -11 0 -16C4 -11 4 -4 0 0Z" fill="${P.lt(P.d1, 0.7)}" stroke="${P.d1}" stroke-width=".6"/><path d="M0 0C-3 -2 -3 -6 0 -8" fill="none" stroke="${P.d3}" stroke-width=".5"/></g>` }
    return bloom(S, P.d1, 0.3, 108, 130, 194) + `<path d="${d}Z" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3.8" stroke-linejoin="round"/><path d="${d}Z" fill="none" stroke="${leafC}" stroke-width="2.4" stroke-linejoin="round"/><path d="${d}Z" fill="none" stroke="${P.d4}" stroke-width=".6" stroke-opacity=".8" transform="translate(-.4 -.4)"/>` + leaves + buds
  },
  front: (S, P) => {
    const flower = (x, y, s, rot) => {
      let stam = ''
      for (let i = 0; i < 16; i++) { const a = (i * 360) / 16 + 8, [sx, sy] = pol(0, 0, 11, a); stam += `<path d="M0 0L${pt(sx, sy)}" stroke="${P.d3}" stroke-width=".5"/><circle cx="${f(sx)}" cy="${f(sy)}" r=".9" fill="${P.lt(P.d1, 0.2)}"/>` }
      return `<g transform="translate(${pt(x, y)}) rotate(${rot}) scale(${s})"><circle r="19" fill="${S.radB([[0, P.d3, 0.55], [1, P.d3, 0]])}" class="sp-pu"/>` +
        petals(14, 20, 5.4, P.lt(P.d1, 0.78), P.d1, { rot: 6, sw: 0.5 }) +
        petals(11, 15.6, 5.2, '#fff', P.lt(P.d1, 0.35), { rot: 0, sw: 0.45 }) +
        petals(9, 11, 3.6, P.lt(P.d3, 0.2), P.lt(P.d1, 0.2), { rot: 20, sw: 0.4 }) +
        `<circle r="4.2" fill="${P.lt(P.d1, 0.2)}" opacity=".7"/>` + stam + `</g>`
    }
    const spec = [[-130, 1.18, 0], [-96, 0.84, 20], [-160, 0.8, 10], [-44, 0.7, 5], [-6, 0.92, 12], [34, 0.74, 3], [76, 0.96, 18], [118, 0.7, 7], [160, 1.0, 15], [200, 0.86, 9]]
    let fl = ''
    for (const [a, s, r] of spec) { const [x, y] = pol(144, 144, 122, a); fl += flower(x, y, s, r + a) }
    let flies = ''
    ;[[40, 120, 0], [250, 90, 1.4], [232, 236, 0.6], [64, 250, 2.1], [150, 12, 1], [20, 176, 2.6]].forEach(([x, y, d]) => { flies += orb(S, x, y, 1.7, P.d3, d) })
    // dije de luna en lo alto
    const charm = `<g transform="translate(144 16)"><path d="M-8 -6A10 10 0 1 0 8 -6A7.2 7.2 0 1 1 -8 -6Z" transform="scale(1.1)" fill="${metalB(S, P)}" stroke="#2a1218" stroke-width=".7"/></g>`
    return bevel(S, P, 111.6, 2.4) + fl + flies + charm + twink(30, 60, 4.8, '#fff', 0.6) + twink(262, 156, 4.2, P.d3, 1.8) + twink(120, 270, 3.8, '#fff', 1.1)
  },
}

// ══════════ 4 · ÓRBITA DE PLATA (Luna Llena) — esfera armilar: tres anillos grabados, lunas y estrella polar
const orbita = {
  ...BASE, slug: 'orbita-de-plata', name: 'Órbita de plata', min: 56, pad: 70, palettes: SP_PAL,
  back: (S, P) => {
    const ring = (rot, rx, ry, w) => `<g transform="rotate(${rot} 144 144)"><ellipse cx="144" cy="144" rx="${rx}" ry="${ry}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="${w + 2}"/><ellipse cx="144" cy="144" rx="${rx}" ry="${ry}" fill="none" stroke="${P.dk(P.d1, 0.35)}" stroke-width="${w}"/><ellipse cx="144" cy="144" rx="${rx}" ry="${ry}" fill="none" stroke="${P.lt(P.d1, 0.2)}" stroke-width="${f(w * 0.28)}" stroke-opacity=".6"/></g>`
    return bloom(S, P.d1, 0.3, 106, 130, 200) +
      `<circle cx="144" cy="144" r="131" fill="none" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".6"/>` + ticks(P.d1, 144, 144, 128, 120, 2.4, { every: 10, long: 6, w: 0.7, op: 0.8 }) +
      ring(-38, 160, 52, 3.2) + ring(38, 160, 52, 3.2) + ring(90, 156, 40, 2.4)
  },
  front: (S, P) => {
    const half = (rot, rx, ry, w) => `<g transform="rotate(${rot} 144 144)"><path d="M${144 - rx} 144A${rx} ${ry} 0 0 0 ${144 + rx} 144" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="${w + 2}"/><path d="M${144 - rx} 144A${rx} ${ry} 0 0 0 ${144 + rx} 144" fill="none" stroke="${S.linU([[0, P.dk(P.d1, 0.4)], [0.3, P.lt(P.d1, 0.55)], [0.5, P.dk(P.d1, 0.2)], [0.75, P.lt(P.d1, 0.3)], [1, P.dk(P.d1, 0.5)]], 144 - rx, 144, 144 + rx, 144)}" stroke-width="${w}"/><path d="M${144 - rx} 144A${rx} ${ry} 0 0 0 ${144 + rx} 144" class="sp-run" fill="none" stroke="#fff" stroke-width="${f(w * 0.5)}" stroke-linecap="round"/></g>`
    const sphere = (x, y, r, c) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3)}" fill="${S.rad([[0, c, 0.5], [1, c, 0]], x, y, r * 3)}" class="sp-pu"/><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${S.radB([[0, '#fff', 1], [0.3, P.lt(c, 0.4), 1], [0.8, c, 1], [1, P.dk(c, 0.7), 1]], 0.34, 0.3, 0.85)}" stroke="#000" stroke-opacity=".4" stroke-width=".5"/>`
    const pl = (rot, rx, ry, a) => { const t = (rot * Math.PI) / 180, ex = rx * Math.cos((a * Math.PI) / 180), ey = ry * Math.sin((a * Math.PI) / 180); return [144 + ex * Math.cos(t) - ey * Math.sin(t), 144 + ex * Math.sin(t) + ey * Math.cos(t)] }
    return bevel(S, P, 111.6, 2.2) +
      sphere(...pl(-38, 160, 52, 0), 7.4, P.d4) + sphere(...pl(38, 160, 52, 180), 5.4, P.d3) + sphere(...pl(90, 156, 40, 0), 4.6, P.d1) + sphere(...pl(-38, 160, 52, 180), 3.6, P.d3) + sphere(...pl(38, 160, 52, 0), 3.6, P.d4) +
      flare(S, P, 144, 4, 22) + jewel(S, 144, 26, 3.6, P.d4, { bezel: P.d1 }) + jewel(S, 144, 262, 3.6, P.d4, { bezel: P.d1 }) +
      twink(34, 36, 5, '#fff', 0.4) + twink(256, 250, 5.4, P.d3, 1.4) + twink(250, 40, 4, P.d3, 2.2) + twink(36, 254, 4, '#fff', 0.8)
  },
}

// ══════════ 5 · ASTROLABIO DE SELENE — anillo de limbo con marcas y astros, engranajes que engranan, trono y argolla
const gearPath = (cx, cy, r, n, h, tw = 0.5) => {
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = (i * 360) / n, s = 180 / n * tw
    const p = [pol(cx, cy, r, a - s * 1.6), pol(cx, cy, r + h, a - s), pol(cx, cy, r + h, a + s), pol(cx, cy, r, a + s * 1.6)]
    d += (i ? 'L' : 'M') + pt(...p[0]) + 'L' + pt(...p[1]) + 'L' + pt(...p[2]) + 'L' + pt(...p[3])
  }
  return d + 'Z'
}
const astro = {
  ...BASE, slug: 'astrolabio-de-selene', name: 'Astrolabio de Selene', min: 60, pad: 52, palettes: SP_PAL,
  back: (S, P) => {
    const sym = (i) => { const [x, y] = pol(144, 144, 133, -90 + i * 30); return i % 3 === 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="none" stroke="${P.d3}" stroke-width=".9"/><circle cx="${f(x)}" cy="${f(y)}" r="1.2" fill="${P.d3}"/>` : i % 3 === 1 ? twink(x, y, 4.2, P.d3, i * 0.2, 'sp-tw') : `<path transform="translate(${pt(x, y)}) rotate(${-90 + i * 30 + 90})" d="M-3 -2A3.6 3.6 0 1 0 3 -2A2.6 2.6 0 1 1 -3 -2Z" fill="${P.d3}"/>` }
    let syms = ''
    for (let i = 0; i < 12; i++) syms += sym(i)
    // anillo exterior calado: 6 cuadrifolios que giran despacio
    let quat = ''
    for (let i = 0; i < 6; i++) { const [x, y] = pol(144, 144, 150, i * 60 + 30); quat += `<g transform="translate(${pt(x, y)}) rotate(${i * 60})">${petals(4, 9, 3.6, P.dk(P.d1, 0.5), P.d1, { sw: 0.6 })}<circle r="2" fill="${P.d3}"/></g>` }
    return bloom(S, P.d1, 0.3, 108, 132, 200) +
      `<g class="sp-rb" style="animation-duration:200s">${quat}<circle cx="144" cy="144" r="150" fill="none" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".6"/><circle cx="144" cy="144" r="141" fill="none" stroke="${P.d1}" stroke-opacity=".4" stroke-width=".5" stroke-dasharray="2 3"/></g>` +
      `<circle cx="144" cy="144" r="126" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="15"/><circle cx="144" cy="144" r="126" fill="none" stroke="${metal(S, P)}" stroke-width="13"/>` +
      ticks('#1a0e04', 144, 144, 120, 72, 3, { every: 6, long: 6, w: 0.9, op: 0.85 }) + syms +
      `<circle cx="144" cy="144" r="132.4" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".8"/><circle cx="144" cy="144" r="119.6" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".6"/>`
  },
  front: (S, P) => {
    const gear = (cx, cy, r, n, h, dir, dur) => `<g class="${dir}" style="transform-box:fill-box;transform-origin:50% 50%;animation-duration:${dur}s"><path d="${gearPath(cx, cy, r, n, h)}" fill="${metalB(S, P)}" stroke="#1a0e04" stroke-width=".8" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.62)}" fill="none" stroke="#1a0e04" stroke-width=".8" stroke-opacity=".7"/>${[0, 72, 144, 216, 288].map((a) => { const [x, y] = pol(cx, cy, r * 0.62, a); return `<path d="M${pt(cx, cy)}L${pt(x, y)}" stroke="#1a0e04" stroke-opacity=".7" stroke-width="1.6"/>` }).join('')}<circle cx="${cx}" cy="${cy}" r="${f(r * 0.2)}" fill="${P.d4}" stroke="#1a0e04" stroke-width=".7"/></g>`
    const throne = `<g transform="translate(144 6)"><circle cy="-4" r="6.6" fill="none" stroke="${metal(S, P)}" stroke-width="2.4"/><path d="M-9 14C-13 6 -6 2 0 8C6 2 13 6 9 14L0 22Z" fill="${metalB(S, P)}" stroke="#1a0e04" stroke-width=".8"/><path d="M-5 8L0 -2L5 8" fill="none" stroke="#1a0e04" stroke-width=".6" stroke-opacity=".6"/></g>`
    return gear(236, 224, 21, 12, 5, 'sp-ra', 36) + gear(58, 232, 14, 9, 4, 'sp-rb', 28) +
      throne + bevel(S, P, 111.8, 2.4) +
      jewel(S, 144, 270, 5, P.d4, { bezel: P.d1 }) + jewel(S, 144 - 134, 144, 3.6, P.d3, { bezel: P.d1 }) + jewel(S, 144 + 134, 144, 3.6, P.d3, { bezel: P.d1 }) +
      drop(S, P, 144, 282, 0.7) + flare(S, P, 144, 28, 13, { streak: false }) +
      twink(250, 64, 5, '#fff', 0.5) + twink(32, 70, 4.4, P.d3, 1.5) + twink(262, 150, 4, P.d3, 2.2)
  },
}

// ══════════ 6 · POLILLA LUNAR — alas translúcidas con venas, ojos y colas largas; antenas plumosas
const mothWing = (S, P) => {
  const fore = 'M70 132C44 62 -6 8 -66 12C-96 40 -90 112 -54 162C-22 198 30 192 70 160Z'
  const hind = 'M72 152C54 204 24 238 -2 292C0 298 6 296 10 290C48 262 76 226 82 182Z'
  const fill = S.linU([[0, P.lt(P.d1, 0.7), 0.92], [0.5, P.d1, 0.55], [1, P.d4, 0.74]], 70, 120, -60, 240)
  let veins = ''
  ;[[-52, 26], [-78, 62], [-80, 106], [-56, 152], [-14, 184], [30, 178]].forEach(([x, y]) => { veins += `M66 132Q${f((66 + x) / 2 + 4)} ${f((132 + y) / 2 - 8)} ${x} ${y}` })
  ;[[6, 276], [34, 250], [62, 220]].forEach(([x, y]) => { veins += `M70 160Q${f((70 + x) / 2)} ${f((160 + y) / 2)} ${x} ${y}` })
  let dots = ''
  for (let i = 0; i < 22; i++) { const t = i / 21, x = 64 + (-56 - 64) * t * 0.96, y = 124 - 66 * Math.sin(t * 3.1) + 100 * t * t; dots += `<circle cx="${f(x * 0.92 + 4)}" cy="${f(y)}" r="${f(0.8 + (i % 3) * 0.4)}" fill="${P.d3}" opacity=".7"/>` }
  const eye = (x, y, s) => `<g transform="translate(${pt(x, y)}) rotate(-24) scale(${s})"><ellipse rx="13" ry="16" fill="${P.d4}" stroke="#000" stroke-opacity=".5" stroke-width=".8"/><ellipse rx="9.6" ry="12" fill="${P.d3}"/><ellipse rx="6.4" ry="8.4" fill="${P.dk(P.d2, 0.1)}"/><ellipse cx="-2" cy="-3" rx="2.4" ry="3.4" fill="#fff" opacity=".9"/><ellipse rx="13" ry="16" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".5"/></g>`
  return `<path d="${hind}" fill="${fill}" stroke="${P.d3}" stroke-width="1.6" stroke-linejoin="round"/><path d="${fore}" fill="${fill}" stroke="${P.d3}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="${fore}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".6" transform="translate(5 3) scale(.93)"/>` +
    `<path d="${veins}" fill="none" stroke="${P.lt(P.d1, 0.6)}" stroke-width=".8" stroke-opacity=".7"/>` + dots + eye(-28, 96, 1) + eye(40, 214, 0.6)
}
const antenna = (S, P) => {
  let d = 'M132 38C118 24 108 8 96 -6', o = `<path d="${d}" fill="none" stroke="${P.d3}" stroke-width="1.6" stroke-linecap="round"/>`
  for (let i = 0; i < 16; i++) { const t = i / 15, x = 132 - 36 * t, y = 38 - 44 * t - 4 * Math.sin(t * 3), l = 14 * (1 - t * 0.55); o += `<path d="M${pt(x, y)}l${f(-l * 0.5)} ${f(-l * 0.9)}M${pt(x, y)}l${f(l * 0.9)} ${f(-l * 0.5)}" stroke="${P.lt(P.d1, 0.5)}" stroke-width=".8" stroke-linecap="round"/>` }
  return o
}
const polilla = {
  ...BASE, slug: 'polilla-lunar', name: 'Polilla lunar', min: 80, pad: 100, palettes: SP_PAL,
  back: (S, P) => {
    const wing = mothWing(S, P)
    return bloom(S, P.d1, 0.3, 108, 134, 210) +
      `<g class="sp-fa" style="--ox:100%;--oy:55%;--r:4deg;--d:5s">${wing}</g>` +
      `<g transform="translate(288 0) scale(-1 1)"><g class="sp-fa" style="--ox:100%;--oy:55%;--r:4deg;--d:5s">${wing}</g></g>` +
      antenna(S, P) + `<g transform="translate(288 0) scale(-1 1)">${antenna(S, P)}</g>` +
      `<g class="sp-rd">${dust(P, { n: 14, r0: 130, r1: 190, seed: 11 })}</g>`
  },
  front: (S, P) =>
    bevel(S, P, 111.6, 2.6) + jewel(S, 144, 32, 4, P.d4, { bezel: P.d1 }) +
    flare(S, P, 30, 74, 10, { streak: false }) + flare(S, P, 258, 98, 10, { streak: false }) + twink(40, 230, 5, '#fff', 0.6) + twink(250, 236, 5, P.d3, 1.4) + twink(144, 280, 4, P.d3, 2),
}

// ══════════ 7 · DIADEMA DE SELENE — tiara de luna con piedra lunar, perlas y cadenas que caen a los lados
const diadema = {
  ...BASE, slug: 'diadema-de-selene', name: 'Diadema de Selene', min: 60, pad: 62, palettes: SP_PAL,
  back: (S, P) => bloom(S, P.d1, 0.4, 108, 130, 196) + `<g class="sp-rd">${dust(P, { n: 10, r0: 140, r1: 176, seed: 6 })}</g>`,
  front: (S, P) => {
    const pg = pearlGrad(S, '#fff4f0'), M = metal(S, P)
    // banda: arco grabado
    const band = (r, w, st) => `<path d="${arc(144, 144, r, -148, -32)}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round"/>`
    // filigrana: volutas en S a lo largo de la banda
    let fil = ''
    for (let i = 0; i < 10; i++) { const a = -140 + i * 10.6, [x0, y0] = pol(144, 144, 119.5, a), [x1, y1] = pol(144, 144, 119.5, a + 8), [cx, cy] = pol(144, 144, i % 2 ? 114 : 125, a + 4); fil += `M${pt(x0, y0)}Q${pt(cx, cy)} ${pt(x1, y1)}` }
    // espigas
    let spikes = '', pearls = ''
    const ang = [-136, -120, -105, -75, -60, -44]
    ang.forEach((a, i) => { const h = [16, 26, 36, 36, 26, 16][i], [bx, by] = pol(144, 144, 119, a), [tx, ty] = pol(144, 144, 119 + h, a), [lx, ly] = pol(144, 144, 119, a - 4.2), [rx, ry] = pol(144, 144, 119, a + 4.2); spikes += `<path d="M${pt(lx, ly)}L${pt(tx, ty)}L${pt(rx, ry)}Q${pt(bx, by + 0)} ${pt(lx, ly)}Z" fill="${M}" stroke="#2a1218" stroke-width=".8" stroke-linejoin="round"/><path d="M${pt(bx, by)}L${pt(tx, ty)}" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/>`; pearls += pearlG(pg, tx, ty, 3.4 + h / 14) })
    // luna creciente central con piedra lunar
    const [cx, cy] = pol(144, 144, 119, -90)
    const moon = `<g transform="translate(${pt(cx, cy - 20)})"><path d="M-17 -2C-17 -26 17 -26 17 -2C11 -14 -11 -14 -17 -2Z" transform="rotate(180) translate(0 -2)" fill="${metalB(S, P)}" stroke="#2a1218" stroke-width=".9"/><path d="M-19 -6C-19 -34 19 -34 19 -6C12 -20 -12 -20 -19 -6Z" fill="${metalB(S, P)}" stroke="#2a1218" stroke-width=".9" transform="translate(0 10)"/>` + `<circle cy="0" r="13" fill="${P.d1}" opacity=".18" class="sp-pu"/>${jewel(S, 0, 2, 7.4, P.d3, { bezel: P.d1 })}</g>`
    // cadenas de perlas que cuelgan
    const chain = (sg) => {
      const [x0, y0] = pol(144, 144, 119, sg < 0 ? -148 : -32), x1 = sg < 0 ? 20 : 268, y1 = 196, mx = (x0 + x1) / 2 + sg * -22, my = (y0 + y1) / 2 - 10
      let o = '', N = 12
      for (let i = 0; i <= N; i++) { const t = i / N, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1; o += pearlG(pg, x, y, 2.5 + 1.6 * Math.sin(t * Math.PI)) }
      return `<path d="M${pt(x0, y0)}Q${pt(mx, my)} ${pt(x1, y1)}" fill="none" stroke="${M}" stroke-width=".8"/>` + o + drop(S, P, x1, y1 + 6, 0.8, P.d4)
    }
    return bevel(S, P, 111.6, 2.2) + chain(-1) + chain(1) +
      band(119, 9, '#000') + band(119, 7.6, M) + `<path d="${fil}" fill="none" stroke="#2a1218" stroke-width="1.1" stroke-linecap="round"/><path d="${fil}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".4" stroke-linecap="round" transform="translate(-.3 -.3)"/>` +
      spikes + pearls + moon + flare(S, P, cx, cy - 22, 15) +
      twink(40, 60, 5, '#fff', 0.4) + twink(250, 70, 5, P.d3, 1.2) + twink(70, 18, 3.8, P.d3, 2) + twink(220, 18, 3.8, '#fff', 0.9)
  },
}

// ══════════ 8 · MEDUSAS DE MEDIANOCHE — campanas translúcidas con tentáculos que se mecen y burbujas
const jelly = (S, P, x, y, s, c, seed, dl = 0) => {
  const R = rng(seed)
  let tent = ''
  for (let i = 0; i < 9; i++) {
    const x0 = -17 + i * 4.25, L = 38 + R() * 38, w = 3 + R() * 3, k = R() > 0.5 ? 1 : -1
    let d = `M${f(x0)} 2`
    for (let j = 1; j <= 6; j++) d += `L${f(x0 + k * w * Math.sin(j * 1.6 + i))} ${f(2 + (L * j) / 6)}`
    tent += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(0.7 + R() * 0.5)}" stroke-opacity="${f(0.55 + R() * 0.3)}" stroke-linecap="round" stroke-linejoin="round"/>`
  }
  let arms = ''
  for (let i = 0; i < 4; i++) { const x0 = -9 + i * 6, L = 30 + R() * 22; arms += `<path d="M${x0} 0C${x0 + 5} ${L * 0.3} ${x0 - 5} ${L * 0.6} ${x0 + 2} ${L}" fill="none" stroke="${P.lt(c, 0.4)}" stroke-width="3.4" stroke-opacity=".48" stroke-linecap="round"/><path d="M${x0} 0C${x0 + 5} ${L * 0.3} ${x0 - 5} ${L * 0.6} ${x0 + 2} ${L}" fill="none" stroke="#fff" stroke-width=".6" stroke-opacity=".6" stroke-linecap="round"/>` }
  const bell = 'M-23 3C-24 -22 -11 -34 0 -34C11 -34 24 -22 23 3C16 -2 9 1 0 -1C-9 1 -16 -2 -23 3Z'
  let rim = ''
  for (let i = 0; i < 9; i++) rim += `<circle cx="${f(-20 + i * 5)}" cy="${f(1 + (i % 2) * 1.4)}" r=".9" fill="#fff" opacity=".85"/>`
  return `<g transform="translate(${pt(x, y)}) scale(${s})"><g class="sp-sw" style="--d:${3.2 + (seed % 3)}s;animation-delay:${-dl}s">${tent}${arms}</g><g class="sp-fb" style="--ox:50%;--oy:100%;--d:${2.4 + (seed % 2)}s;animation-delay:${-dl}s"><circle cy="-14" r="34" fill="${S.rad([[0, c, 0.4], [1, c, 0]], 0, -14, 34)}"/><path d="${bell}" fill="${crystal(S, P, c, { a: 0.7 })}" stroke="${P.lt(c, 0.5)}" stroke-width="1"/><path d="M-12 -2C-14 -16 -8 -24 0 -28C8 -24 14 -16 12 -2M-5 -2C-6 -14 -3 -22 0 -26C3 -22 6 -14 5 -2" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width=".7"/><ellipse cy="-14" rx="9" ry="6.4" fill="none" stroke="${P.d4}" stroke-width="1.4" stroke-opacity=".9"/><ellipse cy="-14" rx="9" ry="6.4" fill="none" stroke="#fff" stroke-width=".4" stroke-opacity=".8"/>${rim}<path d="M-14 -22C-10 -28 -4 -31 2 -31" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.2" stroke-linecap="round"/></g></g>`
}
const medusas = {
  ...BASE, slug: 'medusas-de-medianoche', name: 'Medusas de medianoche', min: 56, pad: 56, palettes: SP_PAL,
  back: (S, P) => {
    let bub = ''
    for (let i = 0; i < 12; i++) { const R = rng(i + 3), x = 20 + R() * 250, y = 40 + R() * 230; bub += `<g class="sp-rise" style="--d:${5 + R() * 4}s;--dx:${f(-8 + R() * 16)}px;animation-delay:${-R() * 6}s"><circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + R() * 2.2)}" fill="none" stroke="${P.d3}" stroke-width=".7" stroke-opacity=".85"/><circle cx="${f(x - 0.5)}" cy="${f(y - 0.6)}" r=".5" fill="#fff"/></g>` }
    return bloom(S, P.d4, 0.4, 106, 134, 200) +
      jelly(S, P, 52, 68, 1.6, P.d1, 3, 0) + jelly(S, P, 244, 206, 1.25, P.d4, 5, 1.3) + jelly(S, P, 236, 44, 0.86, P.d3, 7, 0.7) + jelly(S, P, 34, 226, 0.7, P.d3, 8, 2.1) + bub
  },
  front: (S, P) => bevel(S, P, 111.6, 2.2) + jelly(S, P, 266, 128, 0.5, P.d1, 9, 0.4) + twink(30, 150, 4, '#fff', 0.2) + twink(150, 276, 4, P.d3, 1) + twink(252, 280, 3.4, '#fff', 1.8) + `<g class="sp-rc">${dust(P, { n: 14, r0: 126, r1: 160, seed: 21, c: P.lt(P.d4, 0.4) })}</g>`,
}

export const SP1 = [halo, lazo, jardin, orbita, astro, polilla, diadema, medusas]
// nivel mínimo de cada decoración (para el SQL y la tienda de miembros)
export const SP1_TIER = { 'halo-naciente': 'creciente', 'lazo-de-seda-y-perlas': 'creciente', 'jardin-de-luna': 'creciente', 'orbita-de-plata': 'llena', 'astrolabio-de-selene': 'llena', 'polilla-lunar': 'llena', 'diadema-de-selene': 'llena', 'medusas-de-medianoche': 'llena' }
