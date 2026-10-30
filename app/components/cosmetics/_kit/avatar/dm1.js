// @ts-nocheck
// DÍA DE MUERTOS (1.5.10) — «Ofrenda de Día de Muertos»: cempasúchil, catrinas, pan de muerto, calaveritas de azúcar, papel picado y monarcas.
// Diseños originales hechos con código. Tono celebratorio y respetuoso (es una tradición viva): colores cálidos, nada de terror.
import { f, pol, rng } from '../core/util.js'
import { ctr, glow, rose, orbit, sparkle } from '../core/svg.js'
import { pal } from '../core/kit.js'
import { DM_CSS, ring, fiesta, mg, monarch, candle, skull, skullSet, catrinaMini, flag, pan, steam, laceRing, plumeFan, dmStar, fallPetal, sprig, dmAt } from './dmArt.js'

export const DM_PAL = [
  pal('cempasuchil', 'Cempasúchil', '#FF9A1F', '#140A06', '#FFD27A', '#E0307A'),
  pal('magenta', 'Magenta', '#E0307A', '#14060E', '#FFB3D4', '#FFB020'),
  pal('morado', 'Morado noche', '#9A5CFF', '#0C0818', '#E0CCFF', '#FF9A1F'),
  pal('turquesa', 'Turquesa', '#2EC4C0', '#04100F', '#BFF5F0', '#FF8A3D'),
]
const GREEN = (P) => P.mix('#3E9B57', P.d1, 0.1)
const on = (r, a) => pol(144, 144, r, a)
const base = (P, c = P.d1) => ring(113.6, 1.6, '#000', 0.6) + ring(112, 2.2, c) + ring(109.8, 1, P.d3, 0.7)
const tw = (x, y, r, c, d = 0) => dmStar(x, y, r, c, 'dm-tw', d)
const bob = (inner, d = 0) => `<g class="dm-bob" style="animation-delay:${-d}s">${inner}</g>`

// ───────── 1 · Marco de cempasúchil (común)
const marco = {
  slug: 'marco-de-cempasuchil', name: 'Marco de cempasúchil', rarity: 'comun', price: 700, coll: 'muertos', min: 52, pad: 20, palettes: DM_PAL, css: DM_CSS,
  back: (S, P) => glow(S, P.d1, 0.24),
  front: (S, P) => {
    let lv = '', fl = ''
    for (let i = 0; i < 16; i++) {
      const a = i * 22.5, [x, y] = on(120, a + 11.25)
      lv += `<g transform="translate(${f(x - 144)} ${f(y - 144)}) rotate(${a + 11.25 + 90})">${sprig(P, GREEN(P), 0.8)}</g>`
      const [fx, fy] = on(123, a)
      fl += mg(S, P, fx - 144, fy - 144, i % 2 ? 1.02 : 1.3, a * 1.7)
    }
    return ring(111.4, 1.8, '#000', 0.6) + ctr(`<g class="dm-sw">${lv}${fl}</g>`) + tw(36, 238, 7, P.d3) + tw(250, 52, 5.4, P.d3, 1.2) + tw(256, 226, 4.4, '#fff', 2) +
      fallPetal(70, 262, P.d1, 0) + fallPetal(214, 266, P.mix(P.d1, P.d3, 0.4), 2.2, 0.9)
  },
}

// ───────── 2 · Papel picado (raro)
const garland = (S, P, [x0, y0], [cx, cy], [x1, y1], n, scl, sizes, d0 = 0) => {
  const F = fiesta(P)
  const q = (t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]
  let o = `<path d="M${f(x0)} ${f(y0)}Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2.6"/><path d="M${f(x0)} ${f(y0)}Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}" fill="none" stroke="${P.d3}" stroke-width="1.1"/>`
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, [x, y] = q(t)
    o += flag(S, i % 3, F[(i + d0) % F.length], x, y, scl * (sizes ? sizes[i % sizes.length] : 1), 0, 'dm-fs', i * 0.55)
  }
  return o
}
const papel = {
  slug: 'papel-picado', name: 'Papel picado', rarity: 'raro', price: 1400, coll: 'muertos', min: 52, pad: 22, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d4, 0.2),
  front: (S, P) => {
    const F = fiesta(P)
    let conf = ''
    for (let i = 0; i < 4; i++) conf += `<g transform="translate(${[40, 120, 190, 246][i]} ${[150, 136, 160, 142][i]})"><g class="dm-fall" style="animation-delay:${-i * 1.3}s"><rect x="-2.6" y="-3.2" width="5.2" height="6.4" rx=".8" fill="${F[(i + 1) % 6]}" stroke="#1a0a08" stroke-width=".6"/></g></g>`
    return base(P, P.d4) + garland(S, P, [4, 40], [144, 84], [284, 40], 8, 1.4, [1, 0.92]) + garland(S, P, [22, 232], [144, 292], [266, 232], 8, 1.4, [0.95, 1.05], 3) + conf + tw(34, 96, 5, P.d3) + tw(254, 100, 4.6, '#fff', 1.4)
  },
}

// ───────── 3 · Calaveritas de colores (raro)
const calaveritas = {
  slug: 'calaveritas-de-colores', name: 'Calaveritas de colores', rarity: 'raro', price: 1600, coll: 'muertos', min: 52, pad: 24, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d4, 0.22),
  front: (S, P) => {
    const F = fiesta(P), K = skullSet(P)
    let beads = ''
    for (let i = 0; i < 44; i++) { const [x, y] = on(117, i * (360 / 44)); beads += `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 2 ? 2.2 : 3}" fill="${F[i % 6]}" stroke="#1a0a08" stroke-width=".8"/>` }
    return ring(113.2, 1.8, '#000', 0.55) + `<g class="dm-pl">${beads}</g>` + ring(122.6, 1, P.d3, 0.5) +
      bob(skull(S, K[0], 56, 230, 1.5, -10), 0) + bob(skull(S, K[1], 238, 212, 1.18, 8), 1.4) + bob(skull(S, K[2], 44, 68, 0.84, -12), 2.4) + bob(skull(S, K[4], 246, 62, 0.68, 10), 0.8) +
      tw(110, 266, 6, P.d3, 0.3) + tw(206, 258, 5, '#fff', 1.7) + tw(18, 150, 4.4, P.d3, 2.4)
  },
}

// ───────── 4 · Pan de muerto (raro)
const panAv = {
  slug: 'pan-de-muerto', name: 'Pan de muerto', rarity: 'raro', price: 1500, coll: 'muertos', min: 52, pad: 22, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d1, 0.2),
  front: (S, P) =>
    base(P) + mg(S, P, 22, 190, 1.25) + mg(S, P, 268, 186, 1.05) + pan(S, P, 62, 222, 1.95, -8) + pan(S, P, 130, 268, 1.3, 12) + mg(S, P, 100, 252, 0.95) + pan(S, P, 230, 230, 1.6, 14) + mg(S, P, 190, 270, 1.1) + mg(S, P, 270, 250, 0.9) +
    steam(P.d3, 48, 176, 0, 1.5) + steam(P.d3, 66, 172, 1.2, 1.5) + steam(P.d3, 86, 178, 2.3, 1.3) + steam(P.d3, 222, 190, 0.7, 1.3) + steam(P.d3, 242, 194, 1.9, 1.2) +
    tw(250, 58, 6, P.d3) + tw(40, 56, 5, '#fff', 1.1) + fallPetal(150, 268, P.d1, 0.4),
}

// ───────── 5 · Velas de ofrenda (raro)
const velas = {
  slug: 'velas-de-ofrenda', name: 'Velas de ofrenda', rarity: 'raro', price: 1600, coll: 'muertos', min: 52, pad: 24, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d3, 0.26) + `<ellipse cx="144" cy="262" rx="104" ry="34" fill="${S.radB([[0, P.d1, 0.45], [1, P.d1, 0]])}" class="dm-gl"/>`,
  front: (S, P) => {
    const c = (x, y, h, w, id) => `<g transform="translate(${x} ${y}) scale(1.35)">${candle(S, P, { h, w, id })}</g>`
    return base(P, P.d3) + mg(S, P, 30, 226, 1.3) + mg(S, P, 258, 222, 1.2) + mg(S, P, 116, 280, 1.05) + mg(S, P, 174, 282, 1) +
      c(50, 252, 22, 6.5, 3) + c(98, 270, 28, 7.5, 1) + c(144, 278, 38, 9, 0) + c(190, 270, 30, 8, 2) + c(238, 250, 24, 7, 4) +
      mg(S, P, 144, 288, 0.9) + tw(30, 70, 6, P.d3) + tw(258, 80, 5, '#fff', 1) + fallPetal(76, 270, P.d1, 1)
  },
}

// ───────── 6 · Mariposas monarca (raro)
const monarcas = {
  slug: 'mariposas-monarca', name: 'Mariposas monarca', rarity: 'raro', price: 1500, coll: 'muertos', min: 56, pad: 30, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d1, 0.2) + orbit(S, { rx: 138, ry: 54, tilt: -22, items: [{ th: 30, T: 18, art: monarch(S, P, 0, 0, 1.25) }, { th: 150, T: 18, art: monarch(S, P, 0, 0, 1.05) }, { th: 270, T: 18, art: monarch(S, P, 0, 0, 1.15) }] }).back,
  front: (S, P) => base(P) + orbit(S, { rx: 138, ry: 54, tilt: -22, items: [{ th: 30, T: 18, art: monarch(S, P, 0, 0, 1.25) }, { th: 150, T: 18, art: monarch(S, P, 0, 0, 1.05) }, { th: 270, T: 18, art: monarch(S, P, 0, 0, 1.15) }] }).front +
    mg(S, P, 36, 234, 1.2) + mg(S, P, 62, 258, 0.9) + tw(244, 232, 6, P.d3) + tw(46, 60, 5, '#fff', 1.3) + tw(252, 64, 4.6, P.d3, 2.2),
}

// ───────── 7 · Corona de catrina (épico)
function corona(S, P, { full = false } = {}) {
  const G = P.mix(P.d3, P.d1, 0.32)
  const c4 = [P.d4, P.dk(P.d4, 0.55), P.lt(P.d4, 0.5)]
  const c1 = [P.d1, P.dk(P.d1, 0.55), P.lt(P.d1, 0.5)]
  const arc = full ? [-175, -5] : [-160, -20]
  let o = ''
  const sp = (a, r, s) => { const [x, y] = on(r, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})">${sprig(P, G, s)}</g>` }
  const marks = full ? [-100, -80, -122, -58, -144, -36, -164, -16] : [-100, -80, -124, -56, -146, -34]
  marks.forEach((a) => (o += sp(a, 130, 0.95)))
  const fl = full
    ? [[-90, 'r', 24], [-116, 'm', 1.55], [-64, 'm', 1.55], [-141, 'r2', 17], [-39, 'r2', 17], [-162, 'm', 1.2], [-18, 'm', 1.2], [-177, 'r2', 11], [-3, 'r2', 11]]
    : [[-90, 'r', 23], [-115, 'm', 1.5], [-65, 'm', 1.5], [-139, 'r2', 16], [-41, 'r2', 16], [-159, 'm', 1.15], [-21, 'm', 1.15]]
  fl.forEach(([a, k, s]) => {
    const [x, y] = on(121, a)
    o += k === 'r' ? rose(S, x, y, s, ...c4, { rot: a }) : k === 'r2' ? rose(S, x, y, s, ...c1, { rot: a }) : mg(S, P, x, y, s, a)
  })
  return o
}
const catrina = {
  slug: 'corona-de-catrina', name: 'Corona de catrina', rarity: 'epico', price: 3000, coll: 'muertos', min: 56, pad: 40, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d4, 0.3) + plumeFan(S, P, { a0: -158, a1: -22, n: 9, r: 112, len: [58, 84], w: 12, swayCls: 'dm-pw' }),
  front: (S, P) => laceRing(P, 113.4, 44) + ring(111.2, 1.6, '#000', 0.5) + corona(S, P) +
    `<g transform="translate(222 232) rotate(8)"><g class="dm-bob">${catrinaMini(S, P, skullSet(P)[0]).replace(/^/, '<g transform="scale(1.25)">') + '</g>'}</g></g>` +
    tw(34, 220, 7, P.d3) + tw(250, 130, 5, '#fff', 1.1) + fallPetal(60, 190, P.d1, 0.5) + fallPetal(228, 168, P.d4, 2.3, 0.9),
}

// ───────── 8 · Camino de pétalos (épico)
const camino = {
  slug: 'camino-de-petalos', name: 'Camino de pétalos', rarity: 'epico', price: 2800, coll: 'muertos', min: 56, pad: 26, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d1, 0.26),
  front: (S, P) => {
    const N = 66, R = rng(4)
    let o = ''
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1), th = 190 + t * 560, r = 152 - t * 34
      const [x, y] = pol(0, 0, r, th)
      const c = k % 5 === 0 ? P.d4 : k % 2 ? P.d1 : P.mix(P.d1, P.d3, 0.42)
      const sc = 0.95 + t * 0.7
      o += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(th + 90 + 30 + R() * 20)})"><g class="dm-pl" style="animation-delay:${-(k * 0.09).toFixed(2)}s"><path d="M0 -6C3.4 -6 5.6 -2.4 4.6 1.2C3.6 4.6 1.4 7 0 7C-1.4 7 -3.6 4.6 -4.6 1.2C-5.6 -2.4 -3.4 -6 0 -6Z" transform="scale(${f(sc)})" fill="${c}" stroke="${P.dk(P.d1, 0.55)}" stroke-width=".8"/></g></g>`
    }
    const [sx, sy] = pol(0, 0, 152, 190), [ex, ey] = pol(0, 0, 118, 750)
    return base(P) + ctr(`<g class="dm-spin" style="animation-duration:90s">${o}${mg(S, P, sx, sy, 1.15, 20)}${mg(S, P, ex, ey, 0.8, 0)}</g>`) +
      tw(44, 52, 6.5, P.d3) + tw(250, 236, 5.4, '#fff', 1.3) + tw(246, 56, 4.4, P.d3, 2.2) + fallPetal(70, 252, P.d1, 0.6) + fallPetal(206, 258, P.d4, 2.4, 0.9)
  },
}

// ───────── 9 · Altar de calaveritas (épico)
const altar = {
  slug: 'altar-de-calaveritas', name: 'Altar de calaveritas', rarity: 'epico', price: 3200, coll: 'muertos', min: 56, pad: 46, palettes: DM_PAL,
  back: (S, P) => glow(S, P.d1, 0.28) + `<ellipse cx="144" cy="268" rx="116" ry="30" fill="${S.radB([[0, P.d1, 0.5], [1, P.d1, 0]])}" class="dm-gl"/>`,
  front: (S, P) => {
    const F = fiesta(P), K = skullSet(P)
    let beads = ''
    for (let i = 0; i < 48; i++) { const [x, y] = on(117.4, i * 7.5); beads += `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 2 ? 1.8 : 2.5}" fill="${F[i % 6]}" stroke="#1a0a08" stroke-width=".7"/>` }
    let bed = ''
    ;[40, 54, 68, 82, 98, 112, 126, 140].forEach((a, i) => { const [x, y] = on(138, a); bed += mg(S, P, x, y + 8, 1.15 + (i % 2) * 0.2, a * 3) })
    const sk = [[48, 0.98, 4], [132, 0.98, 3], [67, 1.28, 1], [113, 1.28, 2], [90, 1.58, 0]]
    let skl = ''
    sk.forEach(([a, s, k], i) => { const [x, y] = on(134, a); skl += bob(skull(S, K[k], x, y, s, (a - 90) * 0.35), i * 0.9) })
    const cl = (a, h, id) => { const [x, y] = on(136, a); return `<g transform="translate(${f(x)} ${f(y + 10)}) scale(1.4)">${candle(S, P, { h, w: 8, id })}</g>` }
    return ring(113.2, 1.8, '#000', 0.55) + `<g class="dm-pl">${beads}</g>` + bed + cl(24, 34, 1) + cl(156, 34, 3) + skl +
      mg(S, P, 30, 74, 0.9) + mg(S, P, 258, 88, 0.76) + tw(40, 40, 6, P.d3) + tw(246, 38, 5.4, '#fff', 1.2) + tw(150, 14, 4.4, P.d3, 2)
  },
}

// ───────── 10 · Gran catrina (legendario · color libre)
const gran = {
  slug: 'gran-catrina', name: 'Gran catrina', rarity: 'legendario', price: 6200, coll: 'muertos', min: 60, pad: 46, custom: true, palettes: DM_PAL,
  back: (S, P) => {
    let rays = ''
    for (let i = 0; i < 28; i++) rays += `<path d="M0 -158L${i % 2 ? 3.4 : 6} -142L0 -134L${i % 2 ? -3.4 : -6} -142Z" transform="rotate(${i * (360 / 28)})" fill="${P.d4}" opacity="${i % 2 ? 0.4 : 0.8}"/>`
    return glow(S, P.d1, 0.36) + ctr(`<g class="dm-spin" style="animation-duration:90s">${rays}</g>`) +
      plumeFan(S, P, { a0: -166, a1: -14, n: 11, r: 112, len: [66, 100], w: 13, swayCls: 'dm-pw' }) +
      plumeFan(S, P, { a0: -146, a1: -34, n: 7, r: 112, len: [54, 74], w: 10, swayCls: 'dm-pw', base: P.dk(P.d4, 0.6), tip: P.d4 }) +
      orbit(S, { rx: 140, ry: 40, tilt: -14, items: [{ th: 20, T: 22, art: monarch(S, P, 0, 0, 0.8) }, { th: 140, T: 22, art: monarch(S, P, 0, 0, 0.66) }, { th: 260, T: 22, art: monarch(S, P, 0, 0, 0.74) }] }).back
  },
  front: (S, P) => {
    const K = skullSet(P)
    const cl = (x, y, h, id) => `<g transform="translate(${x} ${y})">${candle(S, P, { h, w: 8, id })}</g>`
    return laceRing(P, 113.4, 46) + ring(111.2, 1.6, '#000', 0.5) + ring(124, 1, P.d3, 0.45, 'class="dm-pl"') + corona(S, P, { full: true }) +
      orbit(S, { rx: 140, ry: 40, tilt: -14, items: [{ th: 20, T: 22, art: monarch(S, P, 0, 0, 0.8) }, { th: 140, T: 22, art: monarch(S, P, 0, 0, 0.66) }, { th: 260, T: 22, art: monarch(S, P, 0, 0, 0.74) }] }).front +
      mg(S, P, 96, 268, 0.95) + mg(S, P, 192, 268, 0.95) + cl(70, 270, 30, 1) + cl(218, 270, 30, 2) + mg(S, P, 52, 252, 0.8) + mg(S, P, 236, 252, 0.8) +
      `<g transform="translate(144 262)"><g class="dm-bob">${catrinaMini(S, P, K[0]).replace(/^/, '<g transform="scale(1.5)">') + '</g>'}</g></g>` +
      [[30, 90, 7], [258, 96, 6], [26, 212, 5.4], [262, 206, 6], [144, 6, 5]].map(([x, y, r], i) => tw(x, y, r, i % 2 ? '#fff' : P.d3, i * 0.7)).join('') +
      fallPetal(40, 150, P.d1, 0.3) + fallPetal(250, 150, P.d4, 1.8, 0.9) + fallPetal(110, 222, P.d1, 3.1, 0.8)
  },
}

export const DM1 = [marco, papel, calaveritas, panAv, velas, monarcas, catrina, camino, altar, gran]
