// @ts-nocheck
// FONDOS Día de Muertos (1.5.10): 4 fondos animados — Ofrenda de cempasúchil · Panteón de las velas · Cielo de papel picado · Camino de monarcas
// Arte original hecho con código. Tono festivo y cálido (nada de terror). Las clases dm-* vienen de DM_CSS (avatar/dm1.js); las dmb-* son propias.
import { KF } from '../core/kit.js'
import { BW, BHt, full, vg, bl, vig, stars, f, rng, pol } from './lib.js'
import { DM_PAL } from '../avatar/dm1.js'
import { fiesta, marigoldFlat, flagP, monarchFlat } from '../avatar/dmArt.js'

const mgs = (P, x, y, r, rot = 0) => `<g transform="translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}">${marigoldFlat(P, r)}</g>`
const monG = (P) => monarchFlat(P).replace(/^<svg[^>]*>|<\/svg>$/g, '')
const mon = (P, x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})">${monG(P)}</g>`
const fogBand = (y, op, cls, c = '#fff', rx = 320, ry = 20) => `<g class="${cls}"><ellipse cx="240" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${op}"/></g>`
const drift = (p, a = 30, t = 20) => `.${p}-d{animation:${p}-d ${t}s ease-in-out infinite alternate}${KF(p + '-d', `from{transform:translateX(-${a}px)}to{transform:translateX(${a}px)}`)}`
const twk = (p) => `.${p}-t{animation:${p}-t 3s ease-in-out infinite}${KF(p + '-t', '0%,100%{opacity:.3}50%{opacity:1}')}`
const flick = (p) => `.${p}-g{transform-box:fill-box;transform-origin:50% 50%;animation:${p}-g 2.2s ease-in-out infinite alternate}${KF(p + '-g', 'from{opacity:.55;transform:scale(.92)}to{opacity:1;transform:scale(1.08)}')}`
const fall = (p) => `.${p}-p{animation:${p}-p 11s linear infinite}${KF(p + '-p', '0%{transform:translate(0,-20px) rotate(0);opacity:0}10%{opacity:.95}90%{opacity:.8}100%{transform:translate(34px,330px) rotate(300deg);opacity:0}')}`
const flyR = (p, t = 22) => `.${p}-y{animation:${p}-y ${t}s linear infinite}${KF(p + '-y', '0%{transform:translate(-60px,20px)}50%{transform:translate(230px,-26px)}100%{transform:translate(540px,10px)}')}`

const petalG = (c, x, y, s, cls, d) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><g class="${cls}" style="animation-delay:${-d}s"><path d="M0 -5C3 -5 5 -2 4 1C3 4 1 6 0 6C-1 6 -3 4 -4 1C-5 -2 -3 -5 0 -5Z" fill="${c}"/></g></g>`
// cuerda de banderines de papel picado entre (x0,y0) y (x1,y1) con caída 'sag'
const bunting = (P, { x0 = -10, x1 = 490, y0, y1 = y0, sag, n, s = 1.2, off = 0, d = 0 }) => {
  const F = fiesta(P)
  const q = (t) => [x0 + (x1 - x0) * t, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (Math.max(y0, y1) + 2 * sag) + t * t * y1]
  let o = `<path d="M${x0} ${y0}Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 2 * sag} ${x1} ${y1}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1.8"/><path d="M${x0} ${y0}Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 2 * sag} ${x1} ${y1}" fill="none" stroke="${P.d3}" stroke-width=".8"/>`
  for (let i = 0; i < n; i++) { const [x, y] = q((i + 0.5) / n); o += `<g transform="translate(${f(x)} ${f(y)})"><g class="dm-fs" style="animation-delay:${-(i * 0.55 + d)}s"><g transform="scale(${s})">${flagP((i + off) % 3, F[(i + off) % 6])}</g></g></g>` }
  return o
}
const candleG = (S, P, x, y, h, w, d = 0) => `<g transform="translate(${f(x)} ${f(y)})"><g class="dmb-g" style="animation-delay:${-d}s">${bl(S, 0, -h - 6, w * 5.5, P.d1, 0.55)}</g><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="1" fill="#f4e6cf" stroke="#3a2418" stroke-width=".6"/><g class="dm-fl" style="animation-delay:${-d}s"><path d="M0 ${-h - 11}C2.6 ${-h - 7} 3.4 ${-h - 5} 3.4 ${-h - 3.6}C3.4 ${-h - 2} 1.8 ${-h - 1} 0 ${-h - 1}C-1.8 ${-h - 1} -3.4 ${-h - 2} -3.4 ${-h - 3.6}C-3.4 ${-h - 5} -2.6 ${-h - 7} 0 ${-h - 11}Z" fill="${P.d1}"/><path d="M0 ${-h - 7.4}C1.1 ${-h - 5.8} 1.4 ${-h - 4.8} 1.4 ${-h - 4}C1.4 ${-h - 3} 0.8 ${-h - 2.6} 0 ${-h - 2.6}C-0.8 ${-h - 2.6} -1.4 ${-h - 3} -1.4 ${-h - 4}C-1.4 ${-h - 4.8} -1.1 ${-h - 5.8} 0 ${-h - 7.4}Z" fill="#fffbe2"/></g></g>`
const MON = DM_PAL

// ───────── 1 · Ofrenda de cempasúchil (raro)
export const ofrendaCempasuchil = {
  slug: 'ofrenda-de-cempasuchil', name: 'Ofrenda de cempasúchil', rarity: 'raro', price: 1400, coll: 'muertos',
  palettes: MON,
  css: flick('dmb') + fall('dmb') + twk('dmb'),
  art: (S, P) => {
    const R = rng(21)
    let o = vg(S, [[0, P.mix(P.d2, P.d4, 0.18)], [0.6, P.d2], [1, P.dk(P.d2, 0.35)]]) + bl(S, 240, 190, 210, P.d1, 0.38) + bl(S, 240, 120, 120, P.d3, 0.18)
    // arco de cempasúchil
    for (let i = 0; i < 26; i++) { const a = 188 + i * (164 / 25); const [x, y] = pol(240, 232, 150, a); o += mgs(P, x, y, 11 + (i % 3) * 1.2, i * 37) }
    for (let i = 0; i < 20; i++) { const a = 192 + i * (156 / 19); const [x, y] = pol(240, 232, 128, a); o += mgs(P, x, y, 8, i * 53) }
    // papel picado colgando del arco
    o += bunting(P, { y0: 12, sag: 14, n: 11, s: 1.3, d: 0 })
    // altar de tres niveles
    const step = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y}" width="${w}" height="3" fill="${P.d3}" opacity=".55"/>`
    o += step(60, 252, 360, 60, P.dk(P.d4, 0.42)) + step(100, 214, 280, 44, P.dk(P.d1, 0.55)) + step(150, 180, 180, 38, P.dk(P.d4, 0.25))
    for (let x = 80; x <= 400; x += 24) o += mgs(P, x, 258, 7.5, x * 3)
    for (let x = 116; x <= 364; x += 22) o += mgs(P, x, 220, 6, x * 5)
    for (let x = 160; x <= 320; x += 20) o += mgs(P, x, 184, 5, x * 7)
    // velas
    ;[[84, 252, 22], [140, 214, 20], [196, 180, 26], [284, 180, 22], [340, 214, 20], [396, 252, 24], [240, 180, 30]].forEach(([x, y, h], i) => (o += candleG(S, P, x, y, h, 6, i * 0.7)))
    // pétalos que caen y brillos
    for (let i = 0; i < 12; i++) o += petalG(i % 2 ? P.d1 : P.mix(P.d1, P.d3, 0.4), R() * BW, 0, 0.8 + R() * 0.5, 'dmb-p', R() * 11)
    for (let i = 0; i < 16; i++) o += `<circle class="dmb-t" cx="${f(R() * BW)}" cy="${f(40 + R() * 200)}" r="${f(0.8 + R() * 1.4)}" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    return o + vig(S, '#000', 0.55)
  } }

// ───────── 2 · Panteón de las velas (épico)
export const panteonVelas = {
  slug: 'panteon-de-las-velas', name: 'Panteón de las velas', rarity: 'epico', price: 2200, coll: 'muertos',
  palettes: MON,
  css: flick('dmp') + twk('dmp') + drift('dmp', 26, 22) + flyR('dmp', 24),
  art: (S, P) => {
    const R = rng(33)
    let o = vg(S, [[0, P.dk(P.d2, 0.25)], [0.55, P.d2], [1, P.mix(P.d2, P.d1, 0.2)]]) + stars(S, P, 46, 4, 150, P.d3)
    // luna grande
    o += bl(S, 370, 70, 110, P.d3, 0.3) + `<circle cx="370" cy="70" r="34" fill="${P.d3}"/><circle cx="360" cy="62" r="7" fill="#000" opacity=".07"/><circle cx="380" cy="82" r="5" fill="#000" opacity=".07"/>`
    // colinas
    o += `<path d="M-10 190Q100 150 220 184T490 170V300H-10Z" fill="${P.mix(P.d2, P.d1, 0.14)}"/>`
    // cruces y lápidas con velas
    const cross = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><rect x="-2" y="-28" width="4" height="44"/><rect x="-10" y="-18" width="20" height="4"/></g>`
    const stone = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M-11 0V-22Q-11 -34 0 -34Q11 -34 11 -22V0Z" fill="${c}"/>`
    const dark = P.dk(P.d2, 0.45)
    ;[[40, 216], [118, 204], [190, 214], [306, 206], [408, 214], [452, 200]].forEach(([x, y], i) => { o += (i % 2 ? stone : cross)(x, y, 0.9 + (i % 3) * 0.12, dark) })
    // luz de las velas sobre el suelo
    ;[[60, 232, 0], [150, 228, 1.1], [244, 236, 2.2], [350, 230, 0.6], [430, 234, 1.7]].forEach(([x, y, d]) => { o += `<g class="dmp-g" style="animation-delay:${-d}s">${bl(S, x, y - 14, 46, P.d1, 0.45)}</g>` })
    o += `<path d="M-10 238Q120 214 250 236T490 226V300H-10Z" fill="${P.dk(P.d2, 0.35)}"/>`
    // camino de cempasúchil
    o += `<path d="M236 238L252 238L372 300L112 300Z" fill="${P.dk(P.d1, 0.6)}" opacity=".5"/>`
    for (let row = 0; row < 7; row++) {
      const t = (row + 1) / 7, y = 240 + Math.pow(t, 1.3) * 58, half = 8 + t * 112, r = 3 + t * 8.5, n = 2 + Math.round(t * 6)
      for (let k = 0; k < n; k++) { const x = 244 + (-half + (2 * half * (k + 0.5 + ((row * 0.41) % 1) * 0.3)) / n); o += mgs(P, x, y, r, row * 31 + k * 47) }
    }
    // velas en primer plano
    ;[[44, 284, 0.2], [96, 292, 1.3], [392, 290, 2.1], [440, 282, 0.8]].forEach(([x, y, d]) => { o += candleG(S, P, x, y, 24 + (d > 1 ? 4 : 0), 8, d) })
    o += fogBand(250, 0.12, 'dmp-d') + fogBand(278, 0.12, 'dmp-d', '#fff', 380, 16)
    for (let i = 0; i < 3; i++) o += `<g class="dmp-y" style="animation-delay:${-i * 8}s;animation-duration:${22 + i * 3}s">${mon(P, 0, 60 + i * 42, 0.5 - i * 0.07, -8 + i * 6)}</g>`
    for (let i = 0; i < 12; i++) o += `<circle class="dmp-t" cx="${f(R() * BW)}" cy="${f(190 + R() * 100)}" r="1.4" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    return o + vig(S, '#000', 0.55)
  } }

// ───────── 3 · Cielo de papel picado (común)
export const cieloPapelPicado = {
  slug: 'cielo-de-papel-picado', name: 'Cielo de papel picado', rarity: 'comun', price: 700, coll: 'muertos',
  palettes: MON,
  css: twk('dmc') + fall('dmc') + drift('dmc', 18, 18),
  art: (S, P) => {
    const R = rng(7)
    let o = vg(S, [[0, P.mix(P.d2, P.d4, 0.3)], [0.55, P.mix(P.d2, P.d1, 0.22)], [1, P.d2]]) + bl(S, 380, 40, 160, P.d3, 0.28) + bl(S, 80, 250, 170, P.d4, 0.2)
    // luces bokeh
    for (let i = 0; i < 22; i++) o += `<circle class="dmc-t" cx="${f(R() * BW)}" cy="${f(R() * BHt)}" r="${f(2 + R() * 5)}" fill="${i % 2 ? P.d3 : P.d1}" opacity=".35" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    // cuerdas escalonadas de banderines
    o += bunting(P, { x0: -10, x1: 490, y0: 14, y1: 30, sag: 16, n: 12, s: 1.35, off: 0, d: 0 })
    o += bunting(P, { x0: -10, x1: 490, y0: 98, y1: 80, sag: 22, n: 11, s: 1.5, off: 1, d: 1.6 })
    o += bunting(P, { x0: -10, x1: 490, y0: 170, y1: 188, sag: 22, n: 10, s: 1.7, off: 2, d: 3.1 })
    o += bunting(P, { x0: -10, x1: 490, y0: 252, y1: 240, sag: 18, n: 9, s: 1.9, off: 0, d: 4.4 })
    for (let i = 0; i < 9; i++) o += petalG(i % 2 ? P.d1 : P.d4, R() * BW, 0, 0.7 + R() * 0.5, 'dmc-p', R() * 11)
    return o + vig(S, '#000', 0.5)
  } }

// ───────── 4 · Camino de monarcas (legendario · color libre)
export const caminoMonarcas = {
  slug: 'camino-de-monarcas', name: 'Camino de monarcas', rarity: 'legendario', price: 5200, coll: 'muertos', custom: true,
  palettes: MON,
  css: flick('dmm') + twk('dmm') + flyR('dmm', 26) + `.dmm-r{transform-box:fill-box;transform-origin:50% 100%;animation:dmm-r 7s ease-in-out infinite alternate}${KF('dmm-r', 'from{opacity:.45;transform:scaleX(.9)}to{opacity:.9;transform:scaleX(1.08)}')}`,
  art: (S, P) => {
    const R = rng(15)
    let o = vg(S, [[0, P.dk(P.d2, 0.3)], [0.5, P.mix(P.d2, P.d4, 0.3)], [0.78, P.mix(P.d2, P.d1, 0.45)], [1, P.d2]]) + stars(S, P, 60, 9, 140, P.d3)
    // resplandor del portal y rayos
    o += `<g class="dmm-r">${bl(S, 240, 150, 190, P.d3, 0.5)}</g>` + bl(S, 240, 150, 90, '#fff', 0.35)
    for (let i = 0; i < 9; i++) { const a = -160 + i * 40, [x, y] = pol(240, 150, 200, a); o += `<path d="M240 150L${f(x - 10)} ${f(y)}L${f(x + 10)} ${f(y)}Z" fill="${P.d3}" opacity=".07"/>` }
    // montañas
    o += `<path d="M-10 168L80 120L150 156L230 112L300 158L380 118L490 170V300H-10Z" fill="${P.mix(P.d2, P.d1, 0.22)}"/><path d="M-10 188L60 160L140 186L240 150L340 188L420 162L490 190V300H-10Z" fill="${P.dk(P.d2, 0.35)}"/>`
    // portal/arco de cempasúchil al fondo
    for (let i = 0; i < 15; i++) { const a = 190 + i * (160 / 14); const [x, y] = pol(240, 176, 34, a); o += mgs(P, x, y, 4.6, i * 41) }
    o += `<path d="M222 178V150Q240 120 258 150V178Z" fill="${P.d3}" opacity=".85"/>`
    // camino de cempasúchil en perspectiva
    o += `<path d="M236 178L244 178L420 300L60 300Z" fill="${P.dk(P.d1, 0.55)}" opacity=".6"/>`
    for (let row = 0; row < 11; row++) {
      const t = (row + 1) / 11, y = 178 + Math.pow(t, 1.5) * 122, half = 5 + t * 190, r = 2.2 + t * 11, n = 2 + Math.round(t * 8)
      for (let k = 0; k < n; k++) { const x = 240 + (-half + (2 * half * (k + 0.5 + ((row * 0.37) % 1) * 0.3)) / n) * 0.95; o += mgs(P, x, y, r, row * 31 + k * 47) }
    }
    // velas a los lados del camino
    ;[[120, 290, 22, 7, 0], [360, 292, 22, 7, 1.2], [168, 236, 14, 5, 0.6], [312, 236, 14, 5, 1.8], [200, 208, 9, 3.6, 0.3], [280, 208, 9, 3.6, 1.5]].forEach(([x, y, h, w, d]) => (o += candleG(S, P, x, y, h, w, d)))
    // monarcas volando hacia la luz
    for (let i = 0; i < 6; i++) o += `<g class="dmm-y" style="animation-delay:${-i * 4.4}s;animation-duration:${22 + (i % 3) * 3}s">${mon(P, 0, 60 + (i * 37) % 130, 0.34 + (i % 3) * 0.1, -10 + i * 5)}</g>`
    for (let i = 0; i < 18; i++) o += `<circle class="dmm-t" cx="${f(R() * BW)}" cy="${f(20 + R() * 260)}" r="${f(0.8 + R() * 1.3)}" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    return o + vig(S, '#000', 0.5)
  } }

export const B4 = [cieloPapelPicado, ofrendaCempasuchil, panteonVelas, caminoMonarcas]
