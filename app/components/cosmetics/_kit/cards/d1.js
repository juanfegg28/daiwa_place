// @ts-nocheck
// DÍA DE MUERTOS — 5 tarjetas fluidas: Altar de ofrenda · Papel picado · Mesa de pan de muerto · Salón de la catrina · Cielo de monarcas.
// El banner es del usuario: nada se dibuja sobre él. Arte fuerte en bordes y esquinas libres; centro tranquilo; cajas con panel casi opaco.
import { fl } from './kit.js'
import { rng, pol, f } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'
import { rose, featherD, leafD } from '../core/svg.js'
import { DM_PAL } from '../avatar/dm1.js'
import { fiesta, mg, marigoldFlat, marigoldId, flagP, monarchFlat, skull, skullSet, pan, panId, catrinaMini, sprig, plumeFan, steam, petalShape, dmStar } from '../avatar/dmArt.js'

const HIDE = (slug) => `@container (max-width:560px){.sk-${slug} .hide-sm{display:none}}`
const dotp = (c, g = 8) => `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${c};box-shadow:0 0 ${g}px ${c}"></b>`
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const C = (slug, name, rarity, price, coll, palettes, build, css = '', extra = {}) => ({ slug, name, rarity, price, coll, tone: 'dark', palettes, css, build, ...extra })
const petalSvg = (c) => `<svg viewBox="-6 -7 12 14" width="100%" height="100%"><path d="M0 -5C3 -5 5 -2 4 1C3 4 1 6 0 6C-1 6 -3 4 -4 1C-5 -2 -3 -5 0 -5Z" fill="${c}"/></svg>`
// vela plana con llama animada (sin gradientes): para teselas y adornos de tarjeta
const flatCandle = (P, x, y, h, w = 7, d = 0) => `<g transform="translate(${x} ${y})"><circle cx="0" cy="${-h - 9}" r="${w * 2.2}" fill="${rgba(P.d3, 0.22)}" style="animation:sk-pulse ${2.4 + d * 0.3}s ${-d}s ease-in-out infinite"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="1.4" fill="#f4e6cf" stroke="#3a2418" stroke-width="1"/><ellipse cx="0" cy="${-h}" rx="${w / 2}" ry="1.5" fill="#fff8ec" stroke="#3a2418" stroke-width=".7"/><g class="dm-fl" style="animation-delay:${-d}s"><path d="M0 ${-h - 15}C3.4 ${-h - 10} 4.4 ${-h - 7} 4.4 ${-h - 5.4}C4.4 ${-h - 3.2} 2.4 ${-h - 2} 0 ${-h - 2}C-2.4 ${-h - 2} -4.4 ${-h - 3.2} -4.4 ${-h - 5.4}C-4.4 ${-h - 7} -3.4 ${-h - 10} 0 ${-h - 15}Z" fill="${P.d1}" stroke="${dk(P.d1, 0.4)}" stroke-width=".5"/><path d="M0 ${-h - 10}C1.6 ${-h - 8} 2 ${-h - 6.6} 2 ${-h - 5.6}C2 ${-h - 4.4} 1 ${-h - 3.6} 0 ${-h - 3.6}C-1 ${-h - 3.6} -2 ${-h - 4.4} -2 ${-h - 5.6}C-2 ${-h - 6.6} -1.6 ${-h - 8} 0 ${-h - 10}Z" fill="#fffbe2"/></g></g>`
// cuerda de banderines de papel picado: viewBox 0 0 1000 H. devuelve el contenido SVG
const strings = (P, { y0, sag, n, s = 2.7, h = 0, off = 0, delay = 0 }) => {
  const F = fiesta(P)
  const q = (t) => [1000 * t, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + 2 * sag) + t * t * y0]
  let o = `<path d="M0 ${y0}Q500 ${y0 + 2 * sag} 1000 ${y0}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3.4"/><path d="M0 ${y0}Q500 ${y0 + 2 * sag} 1000 ${y0}" fill="none" stroke="${P.d3}" stroke-width="1.5"/>`
  for (let i = 0; i < n; i++) { const [x, y] = q((i + 0.5) / n); o += `<g transform="translate(${f(x)} ${f(y)})"><g class="dm-fs" style="animation-delay:${-(i * 0.6 + delay)}s"><g transform="scale(${s})">${flagP((i + off) % 3, F[(i + off) % 6])}</g></g></g>` }
  return o
}

export const D1 = [
  // ─────────── ALTAR DE OFRENDA (épico)
  C('altar-de-ofrenda', 'Altar de ofrenda', 'epico', 3000, 'muertos', DM_PAL, (K, P) => {
    const S = K.S, F = fiesta(P), K0 = skullSet(P)
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d4, 0.2)} 0,${P.d2} 46%,${dk(P.d2, 0.35)})`)
    bg += K.fill(`background:radial-gradient(ellipse 70% 52% at 100% 100%,${rgba(P.d1, 0.36)},transparent 70%),radial-gradient(ellipse 60% 40% at 0 0,${rgba(P.d4, 0.22)},transparent 70%)`)
    bg += K.pattern(46, 46, `<path d="M23 6L27 18L40 23L27 28L23 40L19 28L6 23L19 18Z" fill="${rgba(P.d1, 0.07)}"/>`, { style: fade('#000 0,#000 40%,rgba(0,0,0,.3) 100%') })
    bg += K.box('0 0 1000 64', strings(P, { y0: 5, sag: 12, n: 14, s: 1.8 }), { w: 'width:100%', t: '0', l: '0', style: `height:auto;aspect-ratio:1000/64;opacity:.85;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));${fade('#000 0,#000 70%,rgba(0,0,0,.35) 100%', '90deg')}` })
    const strip = `<path d="M11 0V24" stroke="${rgba(P.d3, 0.35)}" stroke-width="1"/><g transform="translate(11 12)">${marigoldFlat(P, 11)}</g>`
    bg += K.tile(strip, 22, 24, { x: false, y: true, t: '70px', b: '0', l: '-8px', w: '22px', style: 'opacity:.85' }) + K.tile(strip, 22, 24, { x: false, y: true, t: '70px', b: '0', r: '-8px', w: '22px', style: 'opacity:.85' })
    // altar de tres niveles con arco de cempasúchil (esquina inferior derecha)
    let alt = ''
    const cloth = (x, y, w, h, c) => `<path d="M${x} ${y}H${x + w}V${y + h - 5}${Array.from({ length: Math.round(w / 12) }, (_, i) => `l-${(w / Math.round(w / 12)) / 2} 5l-${(w / Math.round(w / 12)) / 2} -5`).join('')}Z" fill="${c}" stroke="#000" stroke-opacity=".5" stroke-width="1"/>`
    for (let i = 0; i < 15; i++) { const a = 200 + i * (140 / 14); const [x, y] = pol(120, 112, 92, a); alt += mg(S, P, x, y, 0.62 + (i % 2) * 0.1, i * 40) }
    alt += cloth(10, 150, 220, 36, dk(P.d4, 0.35)) + `<rect x="10" y="150" width="220" height="5" fill="${P.d3}" opacity=".55"/>`
    alt += cloth(40, 108, 160, 36, dk(P.d1, 0.55)) + `<rect x="40" y="108" width="160" height="5" fill="${P.d3}" opacity=".55"/>`
    alt += cloth(72, 70, 96, 34, dk(P.d4, 0.2)) + `<rect x="72" y="70" width="96" height="5" fill="${P.d3}" opacity=".55"/>`
    ;[30, 52, 74, 96, 120, 144, 166, 188, 210].forEach((x, i) => (alt += `<g transform="translate(${x} 176)">${marigoldFlat(P, 6.6)}</g>`))
    ;[56, 80, 104, 136, 160, 184].forEach((x, i) => (alt += `<g transform="translate(${x} 134)">${marigoldFlat(P, 5.4)}</g>`))
    alt += skull(S, K0[1], 120, 128, 0.62) + skull(S, K0[2], 70, 140, 0.5) + skull(S, K0[4], 170, 140, 0.5) + pan(S, P, 28, 140, 0.72) + pan(S, P, 212, 140, 0.72)
    alt += flatCandle(P, 90, 70, 18, 6, 0) + flatCandle(P, 120, 70, 24, 7, 1.1) + flatCandle(P, 150, 70, 16, 6, 2.2) + flatCandle(P, 52, 108, 16, 6, 0.6) + flatCandle(P, 188, 108, 18, 6, 1.7) + flatCandle(P, 22, 150, 14, 6, 2.8) + flatCandle(P, 218, 150, 14, 6, 0.3)
    alt += mg(S, P, 120, 60, 0.7)
    bg += K.box('0 0 240 190', alt, { w: fl(330, 0.5), b: '4px', r: '2.4%', cls: 'hide-sm', style: `filter:drop-shadow(0 0 22px ${rgba(P.d1, 0.45)})` })
    bg += K.parts(9, { kind: 'float', seed: 6, html: dotp(rgba(P.d3, 0.95), 10), size: [3, 7], dur: [6, 12], o: 0.8, y0: 20, y1: 95, dx: [-14, 14] })
    bg += K.parts(5, { kind: 'fall', seed: 3, html: (i) => petalSvg(i % 2 ? P.d1 : P.mix(P.d1, P.d3, 0.4)), size: [9, 15], dur: [11, 18], dx: [-40, 40], rot: 260, o: 0.8 })
    bg += K.grain(0.08) + K.vignette('#000', 0.5, 50)
    return { bg, radius: '22px', fg: K.frame({ w: 2.2, grad: `linear-gradient(160deg,${rgba(P.d1, 0.95)},${rgba(P.d4, 0.3)} 45%,${rgba(P.d3, 0.65)})`, glow: rgba(P.d1, 0.35) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.4), 0.8), '--sk-line': rgba(P.d1, 0.42), '--sk-accent': P.d1 } }
  }, HIDE('altar-de-ofrenda')),

  // ─────────── PAPEL PICADO (raro)
  C('papel-picado-tarjeta', 'Papel picado', 'raro', 1500, 'muertos', DM_PAL, (K, P) => {
    const F = fiesta(P)
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d4, 0.26)} 0,${P.d2} 50%,${dk(P.d2, 0.3)})`)
    bg += K.fill(`background:radial-gradient(ellipse 60% 40% at 85% 8%,${rgba(P.d1, 0.26)},transparent 70%),radial-gradient(ellipse 50% 36% at 8% 92%,${rgba(P.d4, 0.26)},transparent 70%)`)
    bg += K.pattern(34, 34, `<path d="M17 2L32 17L17 32L2 17Z" fill="none" stroke="${rgba(P.d3, 0.07)}" stroke-width="1.2"/>`, { style: fade('#000 0,#000 36%,rgba(0,0,0,.25) 100%') })
    bg += K.box('0 0 1000 70', strings(P, { y0: 5, sag: 14, n: 13, s: 2, off: 0 }), { w: 'width:100%', t: '0', l: '0', style: `height:auto;aspect-ratio:1000/70;opacity:.85;filter:drop-shadow(0 3px 5px rgba(0,0,0,.55));${fade('#000 0,#000 70%,rgba(0,0,0,.35) 100%', '90deg')}` })
    // esquinas inferiores: banderas grandes y tenues
    bg += K.box('-14 -2 28 26', flagP(0, F[1], 0, 0, 1) + '', { w: fl(120, 0.45), b: '8px', r: '2.5%', rot: -10, cls: 'hide-sm', style: 'opacity:.26' })
    bg += K.box('-14 -2 28 26', flagP(1, F[2], 0, 0, 1) + '', { w: fl(96, 0.45), b: '60px', r: '12%', rot: 12, cls: 'hide-sm', style: 'opacity:.2' })
    // flequillo de papel en el borde inferior
    const fr = [0, 1, 2, 3].map((i) => `<path transform="translate(${i * 20} 0)" d="M0 0H20V9Q15 15 10 9Q5 15 0 9Z" fill="${F[i]}"/>`).join('')
    bg += K.tile(fr, 80, 16, { x: true, b: '0', l: '0', r: '0', h: '16px', style: 'opacity:.9;transform:scaleY(-1)' })
    bg += K.parts(12, { kind: 'fall', seed: 11, html: (i) => `<svg viewBox="-12 0 24 23" width="100%" height="100%"><path d="M-12 0H12V19Q9 23.4 6 19Q3 23.4 0 19Q-3 23.4 -6 19Q-9 23.4 -12 19Z" fill="${F[i % 6]}"/></svg>`, size: [8, 14], dur: [10, 18], dx: [-50, 50], rot: 300, o: 0.85 })
    bg += K.grain(0.07) + K.vignette('#000', 0.45, 55)
    return { bg, radius: '18px', fg: K.frame({ w: 2, spin: 12, beam: P.d3, grad: `linear-gradient(160deg,${rgba(P.d4, 0.8)},${rgba(P.d1, 0.2)} 45%,${rgba(P.d3, 0.5)})`, glow: rgba(P.d4, 0.3) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.35), 0.78), '--sk-line': rgba(P.d4, 0.4), '--sk-accent': P.d4, '--sk-accent-2': P.d1 } }
  }, HIDE('papel-picado-tarjeta')),

  // ─────────── MESA DE PAN DE MUERTO (raro)
  C('mesa-de-pan-de-muerto', 'Mesa de pan de muerto', 'raro', 1600, 'muertos', DM_PAL, (K, P) => {
    const S = K.S, F = fiesta(P)
    const cloth = mix(P.d2, P.d1, 0.16)
    let bg = K.fill(`background:linear-gradient(180deg,${mix(cloth, '#ffffff', 0.04)} 0,${cloth} 50%,${dk(cloth, 0.35)})`)
    bg += K.pattern(44, 44, `<rect width="22" height="22" fill="${rgba(P.d1, 0.1)}"/><rect x="22" y="22" width="22" height="22" fill="${rgba(P.d1, 0.1)}"/><rect x="22" width="22" height="22" fill="${rgba(P.d1, 0.04)}"/><rect y="22" width="22" height="22" fill="${rgba(P.d1, 0.04)}"/>`, { style: fade('#000 0,#000 50%,rgba(0,0,0,.5) 100%') })
    bg += K.fill(`background:radial-gradient(ellipse 60% 44% at 12% 0,${rgba(P.d3, 0.22)},transparent 70%),radial-gradient(ellipse 70% 50% at 100% 100%,${rgba(P.d1, 0.34)},transparent 70%)`)
    bg += K.box('-26 -26 52 52', pan(S, P, 0, 0, 1), { w: fl(240, 0.5), b: '-22px', r: '-10px', cls: 'hide-sm', rot: -14, style: 'filter:drop-shadow(0 8px 14px rgba(0,0,0,.6))' })
    bg += K.box('-26 -26 52 52', pan(S, P, 0, 0, 1), { w: fl(140, 0.5), b: '4px', r: '25%', cls: 'hide-sm', rot: 22, style: 'filter:drop-shadow(0 6px 10px rgba(0,0,0,.6))' })
    bg += K.box('-14 -34 28 40', `<g>${steam(P.d3, -8, 0, 0, 1)}${steam(P.d3, 0, 2, 1.3, 1)}${steam(P.d3, 8, 0, 2.4, 1)}</g>`, { w: fl(90, 0.5), b: '210px', r: '14%', cls: 'hide-sm', style: 'opacity:.8' })
    bg += K.box('-14 -14 28 28', marigoldFlat(P, 12), { w: fl(60, 0.5), b: '150px', r: '3%', cls: 'hide-sm', style: 'filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))' })
    bg += K.box('-14 -14 28 28', marigoldFlat(P, 12), { w: fl(54, 0.5), b: '110px', r: '5%', cls: 'hide-sm', style: 'filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))' })
    bg += K.box('-14 -14 28 28', marigoldFlat(P, 12), { w: fl(46, 0.5), b: '14px', r: '38%', cls: 'hide-sm', style: 'filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))' })
    const sc = [0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 22} 0)" d="M0 0H22V8Q16.5 15 11 8Q5.5 15 0 8Z" fill="${F[i % 6]}"/>`).join('')
    bg += K.tile(sc, 110, 16, { x: true, t: '0', l: '0', r: '0', h: '16px', style: 'opacity:.85' })
    bg += K.parts(12, { kind: 'fall', seed: 2, html: dotp('rgba(255,248,230,.95)', 3), size: [2, 4], dur: [9, 16], dx: [-20, 20], o: 0.7 })
    bg += K.grain(0.1) + K.vignette('#000', 0.42, 55)
    return { bg, radius: '16px', fg: `<div class="sk-b" style="inset:7px;border-radius:12px;border:1.6px dashed ${rgba(P.d3, 0.5)}"></div><div class="sk-b" style="inset:0;border-radius:inherit;box-shadow:inset 0 0 0 2px ${rgba(P.d1, 0.7)}"></div>`, vars: { '--sk-panel': rgba(dk(cloth, 0.55), 0.8), '--sk-line': rgba(P.d1, 0.4), '--sk-accent': P.d1 } }
  }, HIDE('mesa-de-pan-de-muerto')),

  // ─────────── SALÓN DE LA CATRINA (épico)
  C('salon-de-la-catrina', 'Salón de la catrina', 'epico', 2900, 'muertos', DM_PAL, (K, P) => {
    const S = K.S, K0 = skullSet(P), G = P.mix(P.d3, P.d1, 0.32)
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d4, 0.16)} 0,${dk(P.d2, 0.1)} 50%,${dk(P.d2, 0.45)})`)
    bg += K.pattern(64, 84, `<g fill="none" stroke="${rgba(P.d3, 0.1)}" stroke-width="1.2"><path d="M32 6C42 18 42 34 32 42C22 34 22 18 32 6Z"/><path d="M32 42C42 54 42 68 32 80C22 68 22 54 32 42Z"/><path d="M0 42C10 36 18 40 22 44M64 42C54 36 46 40 42 44"/></g><circle cx="32" cy="42" r="2.4" fill="${rgba(P.d3, 0.12)}"/>`, { style: fade('#000 0,#000 40%,rgba(0,0,0,.4) 100%') })
    bg += K.fill(`background:radial-gradient(ellipse 60% 40% at 0 40%,${rgba(P.d4, 0.2)},transparent 70%),radial-gradient(ellipse 60% 44% at 100% 100%,${rgba(P.d1, 0.26)},transparent 70%)`)
    const lace = `<path d="M0 0H26V4A13 13 0 0 1 0 4Z" fill="${dk(P.d2, 0.2)}" stroke="${rgba(P.d3, 0.85)}" stroke-width="1.1"/><circle cx="13" cy="10.4" r="1.7" fill="${rgba(P.d3, 0.85)}"/>`
    bg += K.tile(lace, 26, 22, { x: true, t: '0', l: '0', r: '0', h: '22px', style: 'opacity:.9' })
    bg += K.tile(lace, 26, 22, { x: true, b: '0', l: '0', r: '0', h: '22px', style: 'opacity:.9;transform:scaleY(-1)' })
    // ramo de plumas, rosas y cempasúchil + catrina en miniatura (esquina inferior derecha)
    let sp = ''
    const fea = [[-62, 120], [-46, 138], [-30, 150], [-14, 156], [2, 150], [18, 138], [34, 120]]
    const grad = S.lin([[0, dk(P.d1, 0.62)], [0.7, mix(dk(P.d1, 0.62), P.d1, 0.65)], [1, P.d1]], 0, 1, 0, 0)
    fea.forEach(([a, L], i) => { sp += `<g transform="rotate(${a})"><g class="dm-pw" style="animation-delay:${-i * 0.5}s"><path d="${featherD(L, 22, 'round', 0.1)}" fill="${grad}" stroke="${lt(P.d1, 0.35)}" stroke-opacity=".55" stroke-width="1.2"/><path d="M0 0Q2 ${-L * 0.5} 3 ${-L * 0.92}" stroke="${lt(P.d1, 0.55)}" stroke-opacity=".5" stroke-width="1.1" fill="none"/></g></g>` })
    ;[-70, -42, -14, 14, 42, 70].forEach((a) => (sp += `<g transform="rotate(${a}) translate(0 -22)">${sprig(P, G, 1.1)}</g>`))
    sp += rose(S, 0, -10, 34, P.d4, dk(P.d4, 0.55), lt(P.d4, 0.5)) + rose(S, -42, 8, 24, P.d1, dk(P.d1, 0.55), lt(P.d1, 0.5)) + rose(S, 42, 8, 24, P.d1, dk(P.d1, 0.55), lt(P.d1, 0.5)) + mg(S, P, -22, 30, 1.7) + mg(S, P, 24, 30, 1.7) + mg(S, P, 0, 44, 1.3)
    bg += K.box('-100 -190 200 270', sp, { w: fl(230, 0.5), b: '-34px', r: '-8px', cls: 'hide-sm', style: `filter:drop-shadow(0 0 20px ${rgba(P.d4, 0.4)})` })
    bg += K.box('-40 -50 80 92', `<g transform="translate(0 6)">${catrinaMini(S, P, K0[0])}</g>`, { w: fl(120, 0.5), b: '10px', r: '30%', cls: 'hide-sm', rot: -6, style: `filter:drop-shadow(0 6px 10px rgba(0,0,0,.6))` })
    bg += K.parts(8, { kind: 'twinkle', seed: 5, html: `<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0-9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" fill="${P.d3}"/></svg>`, size: [8, 15], dur: [3, 6], y0: 10, y1: 94 })
    bg += K.grain(0.1) + K.vignette('#000', 0.5, 50)
    return { bg, radius: '16px', fg: `<div class="sk-b" style="inset:0;border-radius:inherit;box-shadow:inset 0 0 0 6px #000,inset 0 0 0 8px ${P.d3},inset 0 0 0 11px #000,inset 0 0 22px ${rgba(P.d4, 0.18)}"></div>`, vars: { '--sk-panel': rgba('#000', 0.76), '--sk-line': rgba(P.d3, 0.38), '--sk-accent': P.d4, '--sk-accent-2': P.d3 }, pad: 'clamp(24px,4cqw,38px)' }
  }, HIDE('salon-de-la-catrina')),

  // ─────────── CIELO DE MONARCAS (legendario · color libre)
  C('cielo-de-monarcas', 'Cielo de monarcas', 'legendario', 6500, 'muertos', DM_PAL, (K, P) => {
    const S = K.S, R = rng(9)
    let bg = K.fill(`background:linear-gradient(180deg,${P.d2} 0,${mix(P.d2, P.d4, 0.32)} 55%,${mix(P.d2, P.d1, 0.4)} 100%)`)
    bg += K.stars(70, { seed: 8, color: P.d3, area: [1100, 700], tw: 6 })
    bg += K.fill(`background:radial-gradient(ellipse 80% 22% at 30% 40%,${rgba(P.d4, 0.3)},transparent 70%),radial-gradient(ellipse 70% 18% at 80% 62%,${rgba(P.d1, 0.28)},transparent 70%);animation:sk-drift 20s ease-in-out infinite`)
    bg += K.glow('86%', '8%', 360, P.d3, 0.28, { anim: 'sk-pulse 9s ease-in-out infinite' })
    // montañas lejanas
    bg += K.box('0 0 1000 120', `<path d="M0 120V70Q120 20 260 62T520 50T780 66T1000 40V120Z" fill="${mix(P.d2, P.d1, 0.2)}" opacity=".85"/><path d="M0 120V92Q160 56 320 88T640 78T1000 90V120Z" fill="${dk(P.d2, 0.3)}"/>`, { w: 'width:100%', b: '20px', l: '0', style: 'height:auto;aspect-ratio:1000/120;opacity:.8' })
    // cama de cempasúchil en la base
    const bedT = `<g transform="translate(14 22)">${marigoldFlat(P, 14)}</g><g transform="translate(36 30)">${marigoldFlat(P, 10)}</g>`
    bg += K.tile(bedT, 40, 40, { x: true, b: '-14px', l: '0', r: '0', h: '40px', style: `filter:drop-shadow(0 -4px 10px ${rgba(P.d1, 0.35)})` })
    // monarcas grandes (esquina inferior derecha / lateral) y bandada
    bg += K.box('-36 -24 72 46', monarchFlat(P).replace(/^<svg[^>]*>|<\/svg>$/g, ''), { w: fl(190, 0.5), b: '60px', r: '4%', rot: -16, cls: 'hide-sm', style: `opacity:.9;filter:drop-shadow(0 0 20px ${rgba(P.d1, 0.6)})` })
    bg += K.box('-36 -24 72 46', monarchFlat(P).replace(/^<svg[^>]*>|<\/svg>$/g, ''), { w: fl(110, 0.5), b: '210px', r: '15%', rot: 14, cls: 'hide-sm', style: `opacity:.75;filter:drop-shadow(0 0 14px ${rgba(P.d1, 0.5)})` })
    bg += K.parts(9, { kind: 'float', seed: 13, html: () => monarchFlat(P), size: [24, 46], dur: [8, 15], dx: [-90, 90], o: 0.9, y0: 10, y1: 90 })
    bg += K.parts(6, { kind: 'fall', seed: 4, html: (i) => petalSvg(i % 2 ? P.d1 : P.d4), size: [8, 14], dur: [12, 20], dx: [-40, 40], rot: 260, o: 0.8 })
    bg += K.grain(0.07) + K.vignette('#000', 0.42, 55)
    return { bg, radius: '24px', fg: K.frame({ w: 2.4, spin: 12, beam: P.d3, grad: `linear-gradient(160deg,${rgba(P.d1, 0.95)},${rgba(P.d4, 0.35)} 40%,${rgba(P.d3, 0.7)} 70%,${rgba(P.d1, 0.9)})`, glow: rgba(P.d1, 0.45) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.3), 0.76), '--sk-line': rgba(P.d1, 0.42), '--sk-accent': P.d1, '--sk-accent-2': P.d4 } }
  }, HIDE('cielo-de-monarcas'), { custom: true }),
]
