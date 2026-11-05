// @ts-nocheck
// LESTAT DE LIONCOURT — 6 tarjetas de perfil MÍTICAS (exclusivas de @renshsh). Escenas de película: terciopelo, oro y luz de vela.
// Reglas: el banner es del usuario (nada se dibuja encima), el centro queda tranquilo y las cajas llevan panel casi opaco.
import { fl } from './kit.js'
import { rng, f } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'
import { LS_PAL, LS_CSS, candelabra, taper, flame, goldG, goblet, rosePetal, fleur } from '../avatar/lsArt.js'
import { LS2_CSS, sunRays, bloom, bat } from '../avatar/lsArt2.js'
import { BROC } from '../avatar/ls1.js'

const HIDE = (slug) => `.sk-${slug} .show-sm{display:none}@container (max-width:560px){.sk-${slug} .hide-sm{display:none}.sk-${slug} .show-sm{display:block}}`
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const C = (slug, name, palettes, build, css = '', extra = {}) => ({ slug, name, rarity: 'mitico', price: 0, coll: 'lestat', tone: 'dark', custom: true, palettes, css, build, ...extra })
const dotp = (c, g = 8) => `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${c};box-shadow:0 0 ${g}px ${c}"></b>`
const petalSvg = (c) => `<svg viewBox="-7 -8 14 16" width="100%" height="100%">${rosePetal(c, 1)}</svg>`
const PANEL = (P, a = 0.8) => rgba(dk(P.d2, 0.12), a)
const VARS = (P, over = {}) => ({ '--sk-panel': PANEL(P), '--sk-line': rgba(P.d1, 0.45), '--sk-accent': P.d1, '--sk-accent-2': P.d4, ...over })
const GOLD_FR = (P, glow) => `linear-gradient(155deg,${rgba(lt(P.d1, 0.4), 1)},${rgba(P.d1, 0.55)} 30%,${rgba(dk(P.d1, 0.4), 0.9)} 55%,${rgba(P.d1, 0.7)} 78%,${rgba(lt(P.d1, 0.35), 1)})`
// marco mítico: doble filete de oro + rombos en las esquinas
const FRAME = (K, P, { spin = 12, inset = 7, r = 14 } = {}) =>
  K.frame({ w: 2.4, spin, beam: lt(P.d3, 0.3), grad: GOLD_FR(P), glow: rgba(P.d1, 0.45) }) +
  `<div class="sk-b" style="inset:${inset}px;border-radius:${r}px;border:1px solid ${rgba(P.d1, 0.5)};box-shadow:inset 0 0 22px rgba(0,0,0,.45)"></div>` +
  [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => `<i class="sk-b" style="${x ? 'right' : 'left'}:${inset - 4}px;${y ? 'bottom' : 'top'}:${inset - 4}px;width:9px;height:9px;rotate:45deg;background:${goldG({ lin: () => '' }, P) || P.d1};background:linear-gradient(135deg,${lt(P.d1, 0.5)},${dk(P.d1, 0.4)});border:1px solid #1a0e04;box-shadow:0 0 8px ${rgba(P.d1, 0.7)}"></i>`).join('')

// ───────── pliegues de terciopelo (gradiente repetido) y cortina recogida con cordón dorado
let CID = 0
function curtain(K, P, side, { c = P.d4, W = 'clamp(40px,14cqw,150px)', tie = 58, fold = 0.2 } = {}) {
  const id = 'lsc' + K.id + CID++, sh = 'lss' + K.id + CID++
  const d = 'M0 0H100C100 12 96 24 80 38C64 50 52 55 48 60C54 66 68 78 84 88C93 94 98 98 100 100H0Z'
  const defs = `<defs><linearGradient id="${id}" x1="0" x2="${fold}" y1="0" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="${dk(c, 0.78)}"/><stop offset=".35" stop-color="${c}"/><stop offset=".62" stop-color="${lt(c, 0.28)}"/><stop offset=".8" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, 0.8)}"/></linearGradient><linearGradient id="${sh}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".6" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient></defs>`
  const body = `${defs}<path d="${d}" fill="url(#${id})"/><path d="${d}" fill="url(#${sh})"/><path d="${d}" fill="none" stroke="${rgba(P.d1, 0.8)}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`
  const cord = `<path d="M0 ${tie - 3}C30 ${tie + 2} 44 ${tie + 1} 50 ${tie + 1}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="7" vector-effect="non-scaling-stroke" stroke-linecap="round"/><path d="M0 ${tie - 3}C30 ${tie + 2} 44 ${tie + 1} 50 ${tie + 1}" fill="none" stroke="${P.d1}" stroke-width="4.4" vector-effect="non-scaling-stroke" stroke-linecap="round"/><path d="M0 ${tie - 3}C30 ${tie + 2} 44 ${tie + 1} 50 ${tie + 1}" fill="none" stroke="${lt(P.d3, 0.5)}" stroke-width="1.2" vector-effect="non-scaling-stroke" stroke-dasharray="3 5"/>`
  const pos = side === 'l' ? `left:0;right:auto` : `right:0;left:auto;transform:scaleX(-1)`
  let o = K.svg('0 0 100 100', body + cord, { pos: 'none', style: `${pos};width:${W};filter:drop-shadow(4px 0 10px rgba(0,0,0,.6))` })
  // borla en el cordón
  const tx = side === 'l' ? 'left:calc(' + W + ' * .44)' : 'right:calc(' + W + ' * .44)'
  o += K.box('-14 -4 28 74', `<rect x="-1.6" y="-4" width="3.2" height="9" fill="${P.d1}"/><ellipse cx="0" cy="10" rx="6.4" ry="8" fill="${goldG(K.S, P)}" stroke="#1a0e04" stroke-width=".8"/><path d="M-6 14L-7 54M-3 16L-3.4 60M0 17V64M3 16L3.4 60M6 14L7 54" stroke="${P.d1}" stroke-width="1.8" stroke-linecap="round"/><path d="M-7 54Q0 58 7 54" stroke="${dk(P.d1, 0.4)}" stroke-width="1.4" fill="none"/>`, { w: 'width:clamp(11px,2.6cqw,26px)', t: `calc(${tie}% - 2px)`, style: `${tx};translate:-50% 0;transform-origin:50% 0;animation:ls-sh 5s ease-in-out infinite alternate;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6))` })
  return o
}

// ───────── pabellón/cenefa superior: festones de terciopelo entre rosetones de oro y borlas
function swags(K, P, { n = 6, c = P.d4, depth = 54 } = {}) {
  const S = K.S, W = 1000, id = 'lsw' + K.id + CID++
  const defs = `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${lt(c, 0.3)}"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, 0.7)}"/></linearGradient></defs>`
  let o = defs + `<rect x="0" y="0" width="1000" height="9" fill="${goldG(S, P)}"/>`
  for (let i = 0; i < n; i++) {
    const x0 = (i * W) / n, x1 = ((i + 1) * W) / n, m = (x0 + x1) / 2, dd = depth + (i % 2) * 8
    o += `<path d="M${f(x0)} 9H${f(x1)}C${f(x1 - 14)} ${dd * 0.6} ${f(m + 40)} ${dd + 14} ${f(m)} ${dd + 16}C${f(m - 40)} ${dd + 14} ${f(x0 + 14)} ${dd * 0.6} ${f(x0)} 9Z" fill="url(#${id})" stroke="${rgba(P.d1, 0.85)}" stroke-width="1.6"/>`
    for (let k = 1; k < 6; k++) o += `<path d="M${f(x0 + (k * (x1 - x0)) / 6)} 10Q${f(m + (k - 3) * 8)} ${f(dd * 0.55)} ${f(m + (k - 3) * 9)} ${f(dd + 10)}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.6"/>`
    o += `<path d="M${f(m - 70)} ${dd + 6}C${f(m - 30)} ${dd + 20} ${f(m + 30)} ${dd + 20} ${f(m + 70)} ${dd + 6}" fill="none" stroke="${P.d1}" stroke-width="3" stroke-linecap="round" opacity=".9"/>`
    // fleco
    for (let k = 0; k < 11; k++) { const fx = m - 50 + k * 10; o += `<path d="M${f(fx)} ${dd + 14 + Math.abs(5 - k) * -0.4}v10" stroke="${P.d1}" stroke-width="2" stroke-linecap="round" opacity=".85"/>` }
    // rosetón
    o += `<g transform="translate(${f(x1)} 16)"><circle r="11" fill="${goldG(S, P)}" stroke="#1a0e04" stroke-width="1"/>${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse transform="rotate(${a}) translate(0 -6)" rx="2.6" ry="4.4" fill="${dk(P.d1, 0.35)}"/>`).join('')}<circle r="3" fill="${lt(P.d3, 0.4)}"/><circle cx="-1" cy="-1" r="1" fill="#fff"/></g>`
  }
  return K.box('0 0 1000 96', o, { w: 'width:100%', t: '0', l: '0', style: 'height:auto;aspect-ratio:1000/96;filter:drop-shadow(0 5px 7px rgba(0,0,0,.65))' })
}

// ───────── eclipse dorado (corona + rayos + disco negro)
const eclipse = (S, P, { n = 44, long = 76 } = {}) =>
  bloom(S, P.d1, 0.55, 98, 118, 180) +
  `<g class="ls2-ra" style="animation-duration:160s;transform-origin:144px 144px">${sunRays(S, P, { n, r0: 104, long, short: long * 0.5, w: 2.4, seed: 7 })}</g>` +
  `<circle cx="144" cy="144" r="102" fill="#030203"/><circle cx="144" cy="144" r="102" fill="none" stroke="${S.lin([[0, lt(P.d3, 0.5)], [0.5, P.d1], [1, lt(P.d3, 0.3)]], 0, 0, 1, 1)}" stroke-width="3.2"/><circle cx="144" cy="144" r="96" fill="none" stroke="${P.d1}" stroke-opacity=".55" stroke-width=".8" stroke-dasharray="1 4.6"/>` +
  `<path d="M70 82A100 100 0 0 1 214 70" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`

export const LS2 = [
  // ─────────── 1 · SALÓN DE TERCIOPELO CARMESÍ
  C('salon-de-terciopelo-carmesi', 'Salón de terciopelo carmesí', LS_PAL, (K, P) => {
    const S = K.S
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d4, 0.3)} 0,${mix(P.d2, P.d4, 0.5)} 40%,${dk(P.d4, 0.82)} 100%)`)
    // boiserie: paneles de pared enmarcados en oro muy tenue
    bg += K.pattern(120, 190, `<g fill="none" stroke="${rgba(P.d1, 0.26)}" stroke-width="1.2"><rect x="14" y="14" width="92" height="162" rx="3"/><rect x="22" y="22" width="76" height="146" rx="2" stroke-opacity=".6"/><path d="M60 36l7 12-7 12-7-12Z" fill="${rgba(P.d1, 0.2)}"/><path d="M60 140l7-12-7-12-7 12Z" fill="${rgba(P.d1, 0.2)}"/></g>`, { style: fade('#000 0,#000 60%,rgba(0,0,0,.4) 100%') })
    bg += K.fill(`background:radial-gradient(ellipse 62% 56% at 50% 36%,${rgba(P.d3, 0.2)},transparent 70%),radial-gradient(ellipse 46% 40% at 100% 100%,${rgba(P.d1, 0.34)},transparent 70%),radial-gradient(ellipse 46% 40% at 0 100%,${rgba(P.d1, 0.28)},transparent 70%)`)
    bg += curtain(K, P, 'l', { tie: 56 }) + curtain(K, P, 'r', { tie: 56 })
    bg += swags(K, P, { n: 6 })
    // candelabros de pared (apliques) a ambos lados, bajo el festón
    bg += K.box('-44 -92 88 100', candelabra(S, P, { x: 0, y: 0, s: 1.7, d: 0 }), { w: fl(100, 0.6), b: '10px', r: '5%', style: `filter:drop-shadow(0 0 24px ${rgba(P.d1, 0.6)})` })
    bg += K.box('-18 -52 36 56', goblet(S, P, { x: 0, y: 0, s: 1 }), { w: fl(46, 0.6), b: '10px', r: '22%', cls: 'hide-sm', style: 'filter:drop-shadow(0 6px 8px rgba(0,0,0,.6))' })
    bg += K.parts(11, { kind: 'float', seed: 3, html: dotp(rgba(P.d3, 0.95), 10), size: [2, 5], dur: [7, 13], o: 0.85, y0: 20, y1: 95, dx: [-14, 14] })
    bg += K.parts(5, { kind: 'fall', seed: 8, html: (i) => petalSvg(i % 2 ? P.d4 : lt(P.d4, 0.18)), size: [10, 16], dur: [11, 18], dx: [-40, 40], rot: 260, o: 0.9 })
    bg += K.grain(0.12) + K.vignette('#000', 0.55, 46)
    return { bg, radius: '22px', fg: FRAME(K, P, { r: 16 }), vars: VARS(P, { '--sk-panel': rgba(dk(P.d2, 0.1), 0.82) }) }
  }, HIDE('salon-de-terciopelo-carmesi') + LS_CSS + LS2_CSS),

  // ─────────── 2 · BANQUETE A LA LUZ DE LAS VELAS
  C('banquete-a-la-luz-de-las-velas', 'Banquete a la luz de las velas', LS_PAL, (K, P) => {
    const S = K.S, R = rng(21)
    let bg = K.fill(`background:linear-gradient(180deg,${dk(P.d2, 0.35)} 0,${P.d2} 55%,${mix(P.d2, P.d4, 0.3)} 100%)`)
    // papel de pared con flor de lis (muy tenue)
    bg += K.pattern(86, 104, `<g transform="translate(43 52) scale(1.5)" opacity=".13">${fleur(S, P, 1, P.d1)}</g><g transform="translate(0 0) scale(.5)" opacity=".1">${fleur(S, P, 1, P.d1)}</g><g transform="translate(86 104) scale(.5)" opacity=".1">${fleur(S, P, 1, P.d1)}</g>`, { rotate: 0, style: fade('#000 0,#000 50%,transparent 100%') })
    // gran halo cálido bajo, entre los candelabros
    bg += K.fill(`background:radial-gradient(ellipse 70% 44% at 50% 100%,${rgba(P.d1, 0.34)},transparent 70%),radial-gradient(ellipse 30% 40% at 6% 92%,${rgba(P.d3, 0.4)},transparent 70%),radial-gradient(ellipse 30% 40% at 94% 92%,${rgba(P.d3, 0.4)},transparent 70%);animation:sk-pulse 7s ease-in-out infinite`)
    // mantel (tela marfil con pliegues, atenuada por la luz) + borde de oro
    const cl = `<path d="M0 62Q125 44 250 62T500 62T750 62T1000 62V120H0Z" fill="${S.lin([[0, '#cdb892'], [0.45, '#5a4630'], [1, '#1a120a']], 0, 0, 0, 1)}"/><path d="M0 62Q125 44 250 62T500 62T750 62T1000 62" fill="none" stroke="${P.d1}" stroke-width="3"/>` +
      Array.from({ length: 24 }, (_, i) => `<path d="M${i * 42 + 10} 64Q${i * 42 + 6 + R() * 10} 90 ${i * 42 + 14} 120" stroke="#000" stroke-opacity=".2" stroke-width="3" fill="none"/>`).join('') +
      Array.from({ length: 50 }, (_, i) => `<circle cx="${i * 20 + 10}" cy="${63 + 4 * Math.sin(i * 0.9)}" r="2.2" fill="${P.d1}" opacity=".85"/>`).join('')
    bg += K.box('0 40 1000 80', cl, { w: 'width:100%', b: '0', l: '0', style: 'height:auto;aspect-ratio:1000/80;filter:drop-shadow(0 -4px 10px rgba(0,0,0,.5))' })
    // candelabros de cinco brazos sobre la mesa, en la esquina derecha (a la izquierda va el texto)
    const cd = (x, y, s, d) => candelabra(S, P, { x, y, s, d, arms: 5 })
    bg += K.box('690 118 310 150', cd(930, 262, 1.7, 0) + cd(790, 264, 1.25, 2) + `<g transform="translate(715 262)">${goblet(S, P, { s: 1.1 })}</g>`, { w: fl(310, 0.55), b: '0', r: '1%', style: `height:auto;filter:drop-shadow(0 0 20px ${rgba(P.d1, 0.55)})` })
    bg += K.box('0 0 60 120', cd(30, 112, 0.9, 1), { w: 'width:52px', b: '36px', l: '12px', cls: 'show-sm', style: `filter:drop-shadow(0 0 14px ${rgba(P.d1, 0.55)})` })
    // brasas ascendentes
    bg += K.parts(12, { kind: 'rise', seed: 11, html: dotp(P.d3, 8), size: [2, 4.4], dur: [7, 13], dx: [-30, 30], o: 0.9 })
    bg += K.grain(0.12) + K.vignette('#000', 0.6, 40)
    return { bg, radius: '22px', fg: FRAME(K, P, { spin: 15, r: 16 }), vars: VARS(P) }
  }, HIDE('banquete-a-la-luz-de-las-velas')),

  // ─────────── 3 · BROCADO AZUL Y ORO (la casaca)
  C('brocado-azul-y-oro', 'Brocado azul y oro', BROC, (K, P) => {
    const S = K.S
    let bg = K.fill(`background:linear-gradient(170deg,${mix(P.d1, P.d2, 0.7)} 0,${mix(P.d1, P.d2, 0.86)} 50%,${P.d2} 100%)`)
    // damasco bordado: flor de ocho pétalos + hojas + perlas (tesela grande, se nota la mano del bordador)
    const flw = (x, y, s, o) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}">${[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => `<path transform="rotate(${a})" d="M0 -3C-5 -9 -4 -17 0 -22C4 -17 5 -9 0 -3Z" fill="${i % 2 ? P.d4 : lt(P.d4, 0.3)}" stroke="${dk(P.d4, 0.6)}" stroke-width=".6"/>`).join('')}<circle r="4.2" fill="${dk(P.d4, 0.4)}" stroke="${lt(P.d4, 0.4)}" stroke-width=".8"/><circle r="1.8" fill="${lt(P.d3, 0.5)}"/></g>`
    const leaf = (x, y, a, s) => `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0C-7 -7 -7 -19 0 -28C7 -19 7 -7 0 0Z" fill="${rgba(P.d4, 0.5)}" stroke="${P.d4}" stroke-width=".8"/><path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0V-25" stroke="${lt(P.d4, 0.3)}" stroke-width=".6"/>`
    bg += K.pattern(104, 120, `${flw(52, 60, 1, 0.55)}${[45, 135, 225, 315].map((a) => leaf(52 + Math.cos(((a - 90) * Math.PI) / 180) * 24, 60 + Math.sin(((a - 90) * Math.PI) / 180) * 24, a, 0.7)).join('')}${flw(0, 0, 0.6, 0.4)}${flw(104, 0, 0.6, 0.4)}${flw(0, 120, 0.6, 0.4)}${flw(104, 120, 0.6, 0.4)}${[[26, 60], [78, 60], [52, 12], [52, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${lt(P.d3, 0.5)}" opacity=".7"/>`).join('')}`)
    // brillo de seda que recorre la tela
    bg += K.fill(`background:linear-gradient(105deg,transparent 38%,${rgba('#fff', 0.14)} 48%,${rgba(P.d3, 0.18)} 51%,transparent 62%);width:50%;animation:sk-slide 9s ease-in-out infinite;mix-blend-mode:soft-light`)
    bg += K.fill(`background:radial-gradient(ellipse 60% 45% at 0 0,${rgba(P.d3, 0.16)},transparent 70%),radial-gradient(ellipse 60% 44% at 100% 100%,${rgba(P.d4, 0.4)},transparent 70%)`)
    // galones de oro laterales + botones
    const gal = `<rect width="22" height="40" fill="${rgba(P.d4, 0.18)}"/><path d="M11 0V40" stroke="${P.d4}" stroke-width="1"/><path d="M0 0Q11 10 22 0M0 20Q11 30 22 20" fill="none" stroke="${P.d4}" stroke-width="2.4"/><path d="M0 10Q11 20 22 10M0 30Q11 40 22 30" fill="none" stroke="${lt(P.d4, 0.4)}" stroke-width="1.4"/><circle cx="11" cy="10" r="1.6" fill="${lt(P.d3, 0.5)}"/><circle cx="11" cy="30" r="1.6" fill="${lt(P.d3, 0.5)}"/>`
    const bd = `clamp(14px,2.6cqw,26px)`
    bg += K.tile(gal, 22, 40, { x: false, y: true, t: '0', b: '0', l: '0', w: '22px', style: 'opacity:.95' }) + K.tile(gal, 22, 40, { x: false, y: true, t: '0', b: '0', r: '0', w: '22px', style: 'opacity:.95' })
    const btn = `<g transform="translate(14 22)"><circle r="9.4" fill="${goldG(S, P)}" stroke="#1a0e04" stroke-width="1.2"/><circle r="5.8" fill="none" stroke="#1a0e04" stroke-opacity=".5" stroke-width="1"/><path d="M-3 0h6M0 -3v6" stroke="#1a0e04" stroke-opacity=".55" stroke-width="1"/><circle cx="-3" cy="-3.4" r="1.7" fill="#fff" opacity=".85"/></g>`
    bg += K.tile(btn, 28, 56, { x: false, y: true, t: '46px', b: '46px', l: '26px', w: '28px', cls: 'hide-sm', style: 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.65))' })
    // galón superior e inferior
    const gh = `<rect width="40" height="14" fill="${rgba(P.d4, 0.2)}"/><path d="M0 7Q10 -1 20 7T40 7" fill="none" stroke="${P.d4}" stroke-width="2.6"/><path d="M0 7Q10 15 20 7T40 7" fill="none" stroke="${lt(P.d4, 0.4)}" stroke-width="1.4"/><circle cx="20" cy="7" r="2" fill="${lt(P.d3, 0.6)}"/>`
    bg += K.tile(gh, 40, 14, { x: true, t: '0', l: '0', r: '0', h: '14px' }) + K.tile(gh, 40, 14, { x: true, b: '0', l: '0', r: '0', h: '14px' })
    bg += K.stars(40, { seed: 9, color: P.d3, area: [1100, 900], tw: 5, size: 1.6 })
    bg += K.grain(0.12) + K.vignette('#000', 0.5, 50)
    return { bg, radius: '16px', fg: `<div class="sk-b" style="inset:0;border-radius:inherit;box-shadow:inset 0 0 0 2px ${P.d4},inset 0 0 0 5px #000,inset 0 0 0 6.4px ${rgba(P.d4, 0.7)},inset 0 0 30px ${rgba(P.d4, 0.25)}"></div>` + K.frame({ w: 1.6, spin: 16, beam: P.d3, grad: GOLD_FR(P), glow: rgba(P.d4, 0.4) }), vars: VARS(P, { '--sk-panel': rgba(dk(P.d2, 0.05), 0.84) }) }
  }, HIDE('brocado-azul-y-oro')),

  // ─────────── 4 · NOCHE EN NUEVA ORLEANS, 1794
  C('noche-en-nueva-orleans-1794', 'Noche en Nueva Orleans, 1794', LS_PAL, (K, P) => {
    const S = K.S, R = rng(17)
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, '#1a1038', 0.7)} 0,${mix(P.d2, P.d4, 0.4)} 62%,${mix(P.d4, P.d1, 0.35)} 100%)`)
    bg += K.stars(70, { seed: 4, color: P.d3, area: [1100, 700], tw: 6, size: 1.5 })
    // luna llena con halo y cráteres
    bg += K.glow('84%', '14%', 520, P.d3, 0.4, { anim: 'sk-pulse 9s ease-in-out infinite' })
    const moonSvg = `<circle r="36" fill="${S.rad([[0, lt(P.d3, 0.6)], [0.7, P.d3], [1, dk(P.d3, 0.15)]], -10, -10, 46)}"/><circle cx="-12" cy="-8" r="7" fill="#000" opacity=".07"/><circle cx="10" cy="10" r="5.4" fill="#000" opacity=".08"/><circle cx="14" cy="-16" r="3.4" fill="#000" opacity=".07"/><circle cx="-6" cy="18" r="4" fill="#000" opacity=".06"/>`
    bg += K.box('-44 -44 88 88', moonSvg, { w: fl(92, 0.6), t: '70px', r: '9%', cls: 'hide-sm', style: `filter:drop-shadow(0 0 24px ${rgba(P.d3, 0.85)})` })
    bg += K.box('-44 -44 88 88', moonSvg, { w: 'width:44px', t: '10px', l: '40%', cls: 'show-sm', style: `filter:drop-shadow(0 0 14px ${rgba(P.d3, 0.85)})` })
    // murciélagos cruzando
    bg += K.box('-30 -20 60 40', bat('#07040a', 1.5, 0, rgba(P.d1, 0.5)), { w: fl(46, 0.6), t: '8%', r: '18%', cls: 'hide-sm', style: 'animation:sk-float 6s ease-in-out infinite alternate;--dx:-26px;--dy:12px' })
    bg += K.box('-30 -20 60 40', bat('#07040a', 1, 0, rgba(P.d1, 0.5)), { w: fl(30, 0.6), t: '17%', r: '29%', cls: 'hide-sm', style: 'animation:sk-float 7.5s ease-in-out infinite alternate;--dx:20px;--dy:-10px' })
    // niebla
    bg += K.fill(`background:radial-gradient(ellipse 80% 14% at 30% 88%,rgba(255,255,255,.1),transparent 70%),radial-gradient(ellipse 70% 12% at 80% 74%,rgba(255,255,255,.07),transparent 70%);animation:sk-drift 22s ease-in-out infinite`)
    // casas criollas: siluetas con balcones de hierro forjado, ventanas encendidas y faroles de gas
    let sk = '', x = -10, i = 0
    while (x < 1010) {
      const w = 96 + Math.floor(R() * 62), h = 62 + Math.floor(R() * 34), top = 230 - h
      sk += `<path d="M${x} 232V${top}${i % 3 === 1 ? `L${x + w / 2} ${top - 24}L${x + w} ${top}` : `H${x + w}`}V232Z" fill="#06040a" stroke="${rgba(P.d1, 0.2)}" stroke-width="1"/>`
      if (i % 2 === 0) sk += `<rect x="${x + w * 0.7}" y="${top - 22}" width="9" height="22" fill="#06040a"/>`
      // ventanas
      const cols = Math.max(2, Math.floor(w / 36))
      for (let r = 0; r < 1; r++) for (let c = 0; c < cols; c++) { const wx = x + 10 + c * ((w - 20) / cols) + 2, wy = top + 12, on = R() < 0.5; sk += `<rect x="${f(wx)}" y="${wy}" width="11" height="20" rx="5.5" fill="${on ? P.d3 : '#120a14'}" opacity="${on ? 0.62 : 1}" ${on ? 'class="ls-gl" style="animation-delay:' + -R() * 3 + 's"' : ''}/>` }
      // balcón de hierro
      sk += `<path d="M${x - 4} ${top + 46}H${x + w + 4}" stroke="#000" stroke-width="4"/><path d="M${x - 4} ${top + 46}H${x + w + 4}" stroke="${rgba(P.d1, 0.4)}" stroke-width="1"/>`
      for (let p = x; p < x + w; p += 9) sk += `<path d="M${p} ${top + 46}V${top + 58}" stroke="#000" stroke-width="2"/>`
      for (let p = x; p < x + w - 9; p += 18) sk += `<path d="M${p} ${top + 58}q4.5 -8 9 0t9 0" fill="none" stroke="#000" stroke-width="2"/>`
      x += w + 2; i++
    }
    for (const lx of [150, 520, 860]) sk += `<g transform="translate(${lx} 232)"><rect x="-2" y="-70" width="4" height="70" fill="#000"/><path d="M-9 -70L-6 -92H6L9 -70Z" fill="${P.d3}" stroke="#000" stroke-width="2"/><path d="M-12 -92L0 -106L12 -92Z" fill="#000"/><circle cy="-80" r="30" fill="${S.rad([[0, P.d3, 0.7], [0.4, P.d1, 0.28], [1, P.d1, 0]], 0, -80, 30)}" class="ls-gl"/></g>`
    sk += `<rect x="0" y="230" width="1000" height="40" fill="#000"/><path d="M0 232H1000" stroke="${rgba(P.d1, 0.4)}" stroke-width="2"/>`
    bg += K.box('0 60 1000 190', sk, { w: 'width:100%', b: '0', l: '0', style: 'height:auto;aspect-ratio:1000/190' })
    bg += K.parts(10, { kind: 'float', seed: 7, html: dotp(rgba(P.d1, 0.95), 8), size: [2, 4], dur: [7, 13], o: 0.85, y0: 30, y1: 92, dx: [-14, 14] })
    bg += K.grain(0.1) + K.vignette('#000', 0.5, 50)
    return { bg, radius: '22px', fg: FRAME(K, P, { spin: 14, r: 16 }), vars: VARS(P) }
  }, HIDE('noche-en-nueva-orleans-1794')),

  // ─────────── 5 · TEATRO DE LOS VAMPIROS
  C('teatro-de-los-vampiros', 'Teatro de los vampiros', LS_PAL, (K, P) => {
    const S = K.S
    let bg = K.fill(`background:linear-gradient(180deg,${dk(P.d2, 0.4)} 0,${P.d2} 50%,${mix(P.d2, P.d4, 0.35)} 100%)`)
    // dos focos que se cruzan en el escenario
    bg += K.fill(`background:conic-gradient(from 160deg at 12% -6%,transparent 0,${rgba(P.d3, 0)} 4deg,${rgba(P.d3, 0.26)} 13deg,${rgba(P.d3, 0)} 26deg,transparent 30deg);animation:sk-pulse 8s ease-in-out infinite`)
    bg += K.fill(`background:conic-gradient(from 200deg at 88% -6%,transparent 0,${rgba(P.d3, 0)} 4deg,${rgba(P.d1, 0.24)} 13deg,${rgba(P.d3, 0)} 26deg,transparent 30deg);animation:sk-pulse 8s ease-in-out -4s infinite`)
    bg += K.fill(`background:radial-gradient(ellipse 50% 24% at 50% 100%,${rgba(P.d1, 0.34)},transparent 70%)`)
    // entarimado en perspectiva
    let pl = ''
    for (let i = -12; i <= 12; i++) pl += `<path d="M${500 + i * 14} 0L${500 + i * 62} 90" stroke="${rgba(P.d1, 0.2)}" stroke-width="1"/>`
    for (let k = 1; k < 5; k++) pl += `<path d="M0 ${k * k * 5.5}H1000" stroke="${rgba(P.d1, 0.14)}" stroke-width="1"/>`
    bg += K.box('0 0 1000 90', pl, { w: 'width:100%', b: '0', l: '0', style: `height:auto;aspect-ratio:1000/90;${fade('transparent 0,#000 80%', '180deg')}` })
    bg += curtain(K, P, 'l', { W: 'clamp(46px,17cqw,170px)', tie: 52, fold: 0.16 }) + curtain(K, P, 'r', { W: 'clamp(46px,17cqw,170px)', tie: 52, fold: 0.16 })
    // proscenio: festón + arco con emblema de corona al centro
    bg += swags(K, P, { n: 5, depth: 46 })
    bg += K.box('-40 -34 80 56', `<path d="M-34 14Q-34 -10 0 -30Q34 -10 34 14Z" fill="${goldG(S, P)}" stroke="#1a0e04" stroke-width="1.2"/><path d="M-26 10Q-26 -6 0 -22Q26 -6 26 10Z" fill="${dk(P.d4, 0.45)}"/><g transform="translate(0 4) scale(.9)">${fleur(S, P, 1, goldG(S, P))}</g>`, { w: fl(96, 0.5), t: '-2px', l: '50%', style: 'translate:-50% 0;filter:drop-shadow(0 4px 6px rgba(0,0,0,.7))' })
    // candilejas
    let bulbs = ''
    for (let i = 0; i < 26; i++) bulbs += `<circle class="ls-gl" style="animation-delay:${-(i % 5) * 0.5}s" cx="${20 + i * 38}" cy="14" r="5" fill="${P.d3}"/><circle cx="${20 + i * 38}" cy="14" r="13" fill="${P.d1}" opacity=".25"/>`
    bg += K.box('0 0 1000 28', bulbs, { w: 'width:100%', b: '0', l: '0', style: 'height:auto;aspect-ratio:1000/28' })
    // máscaras
    const mask = (c, s) => `<g transform="scale(${s})"><path d="M-22 -26C-22 -8 -16 20 0 26C16 20 22 -8 22 -26C10 -32 -10 -32 -22 -26Z" fill="${c}" stroke="#1a0e04" stroke-width="1.6"/><path d="M-14 -12Q-9 -17 -4 -12Q-9 -9 -14 -12ZM4 -12Q9 -17 14 -12Q9 -9 4 -12Z" fill="#12020a"/><path d="M-9 8Q0 18 9 8" fill="none" stroke="#12020a" stroke-width="2.4" stroke-linecap="round"/></g>`
    bg += K.box('-60 -50 120 100', `<g transform="translate(-16 -4) rotate(-12)">${mask(goldG(S, P), 1)}</g><g transform="translate(22 8) rotate(12)">${mask(P.d4, 0.92)}</g>`, { w: fl(150, 0.5), b: '44px', r: '4%', cls: 'hide-sm', style: `filter:drop-shadow(0 6px 12px rgba(0,0,0,.7)) drop-shadow(0 0 20px ${rgba(P.d1, 0.4)})` })
    bg += K.parts(14, { kind: 'float', seed: 5, html: dotp(rgba(P.d3, 0.9), 4), size: [1.5, 3.4], dur: [8, 15], o: 0.7, y0: 8, y1: 88, dx: [-10, 10] })
    bg += K.grain(0.1) + K.vignette('#000', 0.5, 48)
    return { bg, radius: '20px', fg: FRAME(K, P, { spin: 16, r: 14 }), vars: VARS(P) }
  }, HIDE('teatro-de-los-vampiros')),

  // ─────────── 6 · ARCO DE LAS VELAS (su perfil: arco, velas y eclipse dorado)
  C('arco-de-las-velas', 'Arco de las velas', LS_PAL, (K, P) => {
    const S = K.S
    let bg = K.fill(`background:linear-gradient(180deg,${dk(P.d2, 0.3)} 0,${P.d2} 55%,${mix(P.d2, P.d4, 0.4)} 100%)`)
    bg += K.fill(`background:radial-gradient(ellipse 40% 50% at 82% 30%,${rgba(P.d1, 0.28)},transparent 70%),radial-gradient(ellipse 50% 30% at 50% 100%,${rgba(P.d4, 0.4)},transparent 70%)`)
    // arco gótico de oro con tracería (a la derecha), eclipse en la clave
    const arch = (c) => `<path d="M10 500V170C10 80 70 20 150 -20C230 20 290 80 290 170V500" fill="none" stroke="${c}" stroke-width="3.4"/><path d="M26 500V176C26 92 80 36 150 0C220 36 274 92 274 176V500" fill="none" stroke="${c}" stroke-width="1.2" opacity=".7"/>` +
      `<path d="M60 500V230Q60 150 150 90Q240 150 240 230V500" fill="none" stroke="${c}" stroke-width="1.4" opacity=".5"/><path d="M150 90V500M104 170V500M196 170V500" stroke="${c}" stroke-width=".9" opacity=".4"/>` +
      `<circle cx="150" cy="190" r="22" fill="none" stroke="${c}" stroke-width="1.2" opacity=".6"/>` + [0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${f(150 + 22 * Math.cos((a * Math.PI) / 180))}" cy="${f(190 + 22 * Math.sin((a * Math.PI) / 180))}" r="9" fill="none" stroke="${c}" stroke-width=".9" opacity=".5"/>`).join('')
    bg += K.box('0 -30 300 530', arch(rgba(P.d1, 0.8)), { w: fl(300, 0.6), t: '0', r: '7%', style: `filter:drop-shadow(0 0 10px ${rgba(P.d1, 0.45)});${fade('#000 0,#000 55%,transparent 100%')}` })
    bg += K.box('-40 -40 368 368', eclipse(S, P, { n: 46, long: 80 }), { w: fl(190, 0.5), t: '60px', r: '9%', style: 'overflow:visible' })
    // dos grupos de velas encendidas a alturas distintas con charcos de cera
    const grp = (x, y, s, d, hs) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="2" rx="${hs.length * 9 + 6}" ry="5" fill="#fff4dc" opacity=".92" stroke="#3a2418" stroke-width=".6"/>${hs.map((h, i) => taper(S, P, { x: (i - (hs.length - 1) / 2) * 16, y: 0, h, w: 9, d: d + i * 0.8, s: 1, drips: [h * 0.4, h * 0.2, h * 0.55] })).join('')}</g>`
    bg += K.box('690 120 310 150', grp(930, 252, 1.45, 3, [50, 72, 40]) + grp(790, 254, 1.1, 6, [46, 62]), { w: fl(310, 0.55), b: '0', r: '1%', style: `height:auto;filter:drop-shadow(0 0 22px ${rgba(P.d1, 0.55)})` })
    bg += K.box('-30 -20 60 40', bat('#07040a', 1.6, 0, rgba(P.d1, 0.55)), { w: fl(54, 0.6), t: '36%', l: '5%', cls: 'hide-sm', style: 'animation:sk-float 6s ease-in-out infinite alternate;--dx:24px;--dy:-14px' })
    bg += K.parts(6, { kind: 'fall', seed: 14, html: (i) => petalSvg(i % 2 ? P.d4 : dk(P.d4, 0.25)), size: [10, 16], dur: [12, 19], dx: [-40, 40], rot: 260, o: 0.9 })
    bg += K.parts(9, { kind: 'rise', seed: 2, html: dotp(P.d3, 8), size: [2, 4], dur: [8, 14], dx: [-24, 24], o: 0.9 })
    bg += K.grain(0.12) + K.vignette('#000', 0.55, 48)
    return { bg, radius: '22px', fg: FRAME(K, P, { spin: 13, r: 16 }), vars: VARS(P) }
  }, HIDE('arco-de-las-velas')),
]
