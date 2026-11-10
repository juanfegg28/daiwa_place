// @ts-nocheck
// MIEMBROS · Círculo Lunar — 5 TARJETAS DE PERFIL MÍTICAS (10 paletas + color libre cada una).
// Reglas del kit: el banner es del usuario (nada se dibuja encima), el centro queda tranquilo y los bloques llevan panel casi opaco.
// Keyframes propios con prefijo spc-. Todo original, hecho con código.
import { fl, f, rng, mix, lt, dk, rgba } from '../cards/kit.js'
import { SP_PAL } from '../avatar/sp1.js'
import { moonPhase, petals, pearlGrad, pearlG, satin, sunRays, twink } from '../avatar/spArt.js'

const pt = (x, y) => `${f(x)} ${f(y)}`
const C = (slug, name, build, css = '') => ({ slug, name, rarity: 'mitico', price: 0, coll: 'supporters', tone: 'dark', custom: true, palettes: SP_PAL, css, build })
const SHARED = `@keyframes spc-sw{0%,100%{transform:rotate(-1.8deg)}50%{transform:rotate(2deg)}}.spc-sw{transform-origin:50% 0;animation:spc-sw 7s ease-in-out infinite}.spc-sw2{animation-delay:-3.5s}` +
  `@keyframes spc-tw{0%,100%{transform:scale(.35) rotate(0);opacity:.2}50%{transform:scale(1) rotate(45deg);opacity:1}}.spc-tw{transform-box:fill-box;transform-origin:50% 50%;animation:spc-tw 3.6s ease-in-out infinite}` +
  `@keyframes spc-ra{to{transform:rotate(360deg)}}.spc-ra{transform-box:fill-box;transform-origin:50% 50%;animation:spc-ra 200s linear infinite}.spc-rb{transform-box:fill-box;transform-origin:50% 50%;animation:spc-ra 140s linear infinite reverse}` +
  `@keyframes spc-wv{from{transform:translateX(0)}to{transform:translateX(-80px)}}.spc-wv{animation:spc-wv 9s linear infinite}.spc-wv2{animation-duration:14s;animation-direction:reverse}.spc-wv3{animation-duration:22s}` +
  `@keyframes spc-gl{0%,100%{opacity:.2}50%{opacity:1}}.spc-gl{animation:spc-gl 3.4s ease-in-out infinite}` +
  `@keyframes spc-pu{0%,100%{opacity:.6;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}.spc-pu{transform-box:fill-box;transform-origin:50% 50%;animation:spc-pu 6s ease-in-out infinite}` +
  `@keyframes spc-sh{0%{transform:translateX(-160%) skewX(-18deg)}45%,100%{transform:translateX(260%) skewX(-18deg)}}.spc-sh{animation:spc-sh 9s ease-in-out infinite}` +
  `@keyframes spc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}.spc-bob{animation:spc-bob 5s ease-in-out infinite}`

const HIDE = (slug) => `.sk-${slug} .show-sm{display:none}@container (max-width:560px){.sk-${slug} .hide-sm{display:none}.sk-${slug} .show-sm{display:block}}`
const VARS = (P, a = 0.78) => ({ '--sk-panel': rgba(dk(P.d2, 0.12), a), '--sk-line': rgba(P.d1, 0.42), '--sk-accent': P.d1, '--sk-accent-2': P.d4, '--sk-glow': rgba(P.d1, 0.55) })
const METAL = (P) => `linear-gradient(155deg,${lt(P.d1, 0.55)},${P.d1} 28%,${dk(P.d1, 0.45)} 55%,${P.d1} 78%,${lt(P.d1, 0.5)})`
// marco metálico con haz de luz que gira + filete interior + rombos en las esquinas
const FRAME = (K, P, { spin = 14, inset = 7, r = 14, gem = P.d3 } = {}) =>
  K.frame({ w: 2.2, spin, beam: lt(P.d3, 0.3), grad: METAL(P), glow: rgba(P.d1, 0.4) }) +
  `<div class="sk-b" style="inset:${inset}px;border-radius:${Math.max(4, r - 3)}px;border:1px solid ${rgba(P.d1, 0.45)};box-shadow:inset 0 0 24px rgba(0,0,0,.4)"></div>` +
  [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => `<i class="sk-b" style="${x ? 'right' : 'left'}:${inset - 4}px;${y ? 'bottom' : 'top'}:${inset - 4}px;width:9px;height:9px;rotate:45deg;background:linear-gradient(135deg,${lt(gem, 0.6)},${gem} 50%,${dk(gem, 0.4)});box-shadow:0 0 8px ${rgba(P.d1, 0.7)};border:1px solid ${rgba(dk(P.d1, 0.6), 0.9)}"></i>`).join('')
const tw = (x, y, r, c, dl = 0) => twink(x, y, r, c, dl, 'spc-tw')
const dotp = (c, g = 8) => `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${c};box-shadow:0 0 ${g}px ${c}"></b>`

// media luna (cuernos a la derecha) como ruta: R radio exterior, k cuánto se «come» el disco interior (0..1)
const crescent = (R, k = 0.62) => `M0 ${-R}A${R} ${R} 0 1 0 0 ${R}A${f(R * (1 + k * 0.9))} ${f(R * (1 + k * 0.9))} 0 0 1 0 ${-R}Z`

// ───────── luna llena con mares y brillo (viewBox centrado en 0,0)
const fullMoon = (S, P, R, id = '') => {
  const g = S.radB([[0, '#fff', 1], [0.3, lt(P.d3, 0.35), 1], [0.78, P.d3, 1], [1, dk(P.d1, 0.35), 1]], 0.38, 0.34, 0.85)
  const cr = [[-0.32, -0.12, 0.2], [0.18, -0.3, 0.13], [0.3, 0.2, 0.22], [-0.12, 0.36, 0.14], [-0.4, 0.28, 0.09], [0.05, 0.02, 0.08]]
  return `<circle r="${R * 1.55}" fill="${S.rad([[0.55, P.d1, 0.42], [1, P.d1, 0]], 0, 0, R * 1.55)}" class="spc-pu"/><circle r="${R}" fill="${g}"/>` +
    cr.map(([x, y, r]) => `<circle cx="${f(x * R)}" cy="${f(y * R)}" r="${f(r * R)}" fill="${dk(P.d1, 0.55)}" opacity=".22"/><circle cx="${f(x * R - r * R * 0.18)}" cy="${f(y * R - r * R * 0.18)}" r="${f(r * R * 0.8)}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".8"/>`).join('') +
    `<circle r="${R}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>`
}

// ───────── rosa de pétalos en espiral (centro 0,0)
const rose = (S, P, s, c, rot = 0) => {
  let o = ''
  ;[P.dk ? 0 : 0].length
  const cols = [dk(c, 0.55), dk(c, 0.2), c, lt(c, 0.3), lt(c, 0.55)]
  cols.forEach((col, i) => { o += petals(5 - (i > 2 ? 1 : 0), 22 * (1 - i * 0.17), 8.5 - i * 1.2, col, dk(c, 0.7), { rot: 10 + i * 31, sw: 0.55, curve: 0.55 }) })
  o += `<path d="M-3 0a3 3 0 1 1 3 3a5 5 0 1 1 -5 -5a8 8 0 1 1 8 8" fill="none" stroke="${dk(c, 0.7)}" stroke-width=".8" stroke-linecap="round"/><path d="M-14 -12C-8 -18 4 -19 11 -14" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/><circle cx="6" cy="-6" r="1.4" fill="#fff" opacity=".9"/>`
  return `<g transform="rotate(${rot}) scale(${s})"><circle r="30" fill="${S.radB([[0, c, 0.38], [1, c, 0]])}"/>${o}</g>`
}
const leaf = (c, x, y, a, s) => `<g transform="translate(${pt(x, y)}) rotate(${a}) scale(${s})"><path d="M0 0C-6 -4 -7 -13 0 -21C7 -13 6 -4 0 0Z" fill="${dk(c, 0.45)}" stroke="${c}" stroke-width=".6"/><path d="M0 0V-18" stroke="${lt(c, 0.4)}" stroke-width=".5" opacity=".8"/></g>`

export const SP_CARDS = [
  // ═════════ 1 · VELO DE LUNA (Creciente) — cielo nocturno, cortinas de gasa que se mecen, media luna y friso de fases
  C('velo-de-luna', 'Velo de Luna', (K, P) => {
    const S = K.S, R = rng(31)
    let bg = K.fill(`background:linear-gradient(180deg,${dk(P.d2, 0.3)} 0,${P.d2} 42%,${mix(P.d2, P.d4, 0.34)} 100%)`)
    bg += K.fill(`background:radial-gradient(ellipse 62% 46% at 90% 0,${rgba(P.d1, 0.42)},transparent 70%),radial-gradient(ellipse 56% 38% at 0 100%,${rgba(P.d4, 0.32)},transparent 70%),radial-gradient(ellipse 40% 30% at 100% 100%,${rgba(P.d1, 0.2)},transparent 70%)`)
    // aurora: dos bandas de luz diagonales que derivan despacio
    bg += K.fill(`background:linear-gradient(104deg,transparent 30%,${rgba(P.d3, 0.1)} 42%,${rgba(P.d1, 0.17)} 50%,transparent 62%);width:60%;animation:sk-slide 16s ease-in-out infinite;mix-blend-mode:screen`)
    bg += K.fill(`background:linear-gradient(112deg,transparent 40%,${rgba(P.d4, 0.12)} 50%,transparent 62%);width:46%;animation:sk-slide 23s ease-in-out -9s infinite;mix-blend-mode:screen`)
    bg += K.stars(64, { seed: 12, color: P.d3, area: [1100, 1000], tw: 6, size: 1.6 })
    // media luna gigante arriba a la derecha
    const mk = S.mask(`<rect x="-200" y="-200" width="400" height="400" fill="#fff"/><circle cx="44" cy="-22" r="74" fill="#000"/>`)
    const mg = S.linU([[0, lt(P.d3, 0.45)], [0.45, P.d1], [1, dk(P.d4, 0.35)]], -90, -90, 90, 90)
    const moon = `<circle r="150" fill="${S.rad([[0.4, P.d1, 0.4], [1, P.d1, 0]], 0, 0, 150)}" class="spc-pu"/><g mask="${mk}"><circle r="84" fill="${mg}"/>${[[-30, 40, 12], [-52, -10, 8], [-14, 66, 7], [-62, 28, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000" opacity=".16"/>`).join('')}</g><path d="${crescent(84, 0.62)}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" transform="translate(0 0)" clip-path="none" opacity="0"/>`
    bg += K.box('-150 -150 300 300', moon, { w: fl(300, 0.5), t: '-56px', r: '-26px', style: `filter:drop-shadow(0 0 30px ${rgba(P.d1, 0.55)})` })
    // friso de fases lunares
    let ph = ''
    for (let i = 0; i < 9; i++) {
      const t = i / 8, x = 22 + i * 44
      ph += `<g transform="translate(${x} 16)"><circle r="9" fill="${dk(P.d2, 0.3)}" stroke="${P.d1}" stroke-width="1.1"/>` +
        (i === 0 || i === 8 ? '' : `<g ${t > 0.5 ? 'transform="scale(-1 1)"' : ''}><path d="${moonPhase(7.4, t > 0.5 ? 1 - t : t)}" fill="${P.d3}"/></g>`) +
        (i === 4 ? `<circle r="7.4" fill="${P.d3}"/>` : '') + `<circle r="9" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".5"/></g>`
    }
    ph += `<path d="M0 16H8M392 16H400" stroke="${P.d1}" stroke-width="1" opacity=".7"/>`
    bg += K.box('0 0 400 32', ph, { w: fl(400, 0.55), t: '10px', l: '50%', style: 'translate:-50% 0;filter:drop-shadow(0 0 8px rgba(0,0,0,.5))' })
    // cortinas de gasa en los costados (se mecen)
    const drape = (flip, dl) => {
      const g = S.lin([[0, lt(P.d3, 0.4), 0.55], [0.5, P.d1, 0.34], [1, P.d4, 0.1]], 0, 0, 1, 1)
      const folds = [0.2, 0.42, 0.66, 0.86].map((x) => `<path d="M${f(100 * x * 0.9)} 0C${f(100 * x * 0.8)} 120 ${f(100 * x * 1.1)} 240 ${f(100 * x * 0.95)} 330" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>`).join('')
      return `<g class="spc-sw ${dl ? 'spc-sw2' : ''}"><path d="M0 0H100C98 70 82 120 88 190C92 250 74 296 80 340C60 330 20 336 0 340Z" fill="${g}" stroke="${P.d3}" stroke-opacity=".5" stroke-width="1"/>${folds}<path d="M6 0V330" stroke="${P.d1}" stroke-width="2" opacity=".6"/></g>`
    }
    bg += K.box('0 0 100 340', drape(0, 0), { w: 'width:clamp(34px,11cqw,110px)', t: '0', l: '0', style: 'height:62%' })
    bg += K.box('0 0 100 340', drape(1, 1), { w: 'width:clamp(34px,11cqw,110px)', t: '0', r: '0', flipX: true, style: 'height:62%' })
    // polvo estelar flotando y pétalos de luz
    bg += K.parts(12, { kind: 'rise', seed: 7, html: dotp(rgba(P.d3, 0.95), 9), size: [2, 4.6], dur: [9, 16], dx: [-24, 24], o: 0.85 })
    bg += K.parts(6, { kind: 'float', seed: 19, html: dotp(rgba(P.d1, 0.9), 12), size: [3, 6], dur: [6, 11], dx: [-12, 12], y0: 8, y1: 92, o: 0.9 })
    bg += K.grain(0.1) + K.vignette('#000', 0.5, 48)
    return { bg, radius: '22px', fg: FRAME(K, P, { spin: 16, r: 18 }), vars: VARS(P) }
  }, SHARED + HIDE('velo-de-luna')),

  // ═════════ 2 · MAREA DE PLATA (Llena) — luna llena sobre el mar, olas de plata en capas y reflejo vertical
  C('marea-de-plata', 'Marea de Plata', (K, P) => {
    const S = K.S
    let bg = K.fill(`background:linear-gradient(180deg,${dk(P.d2, 0.35)} 0,${P.d2} 38%,${mix(P.d2, P.d4, 0.3)} 70%,${dk(P.d2, 0.2)} 100%)`)
    bg += K.fill(`background:radial-gradient(ellipse 52% 40% at 50% 8%,${rgba(P.d3, 0.3)},transparent 70%),radial-gradient(ellipse 80% 30% at 50% 100%,${rgba(P.d1, 0.3)},transparent 72%)`)
    bg += K.stars(70, { seed: 5, color: P.d3, area: [1100, 560], tw: 6, size: 1.5 })
    // luna llena sobre el horizonte (a la derecha para dejar el texto a salvo)
    bg += K.box('-130 -130 260 260', fullMoon(S, P, 70), { w: fl(250, 0.5), t: '5%', r: '6%', style: `filter:drop-shadow(0 0 34px ${rgba(P.d3, 0.5)})` })
    // nubes finas de plata
    const cloud = (x, y, w, o) => `<path d="M${x} ${y}c${w * 0.2} -8 ${w * 0.3} -8 ${w * 0.5} -2c${w * 0.2} -8 ${w * 0.4} -6 ${w * 0.5} 2" fill="none" stroke="${P.d3}" stroke-opacity="${o}" stroke-width="3" stroke-linecap="round"/>`
    bg += K.box('0 0 1000 120', cloud(60, 40, 240, 0.28) + cloud(560, 70, 300, 0.22) + cloud(330, 20, 180, 0.18), { w: 'width:100%', t: '12%', l: '0', style: 'height:auto' })
    // columna de reflejo de la luna en el agua (puntos de plata que centellean)
    let refl = ''
    for (let i = 0; i < 18; i++) refl += `<rect class="spc-gl" style="animation-delay:${-(i * 0.37) % 3.4}s" x="${f(150 - 56 + (i % 3) * 7 - i * 1.6)}" y="${i * 11 + 2}" width="${f(112 - i * 2.4 + (i % 2) * 10)}" height="3" rx="1.5" fill="${i % 3 ? P.d3 : '#fff'}" opacity=".8"/>`
    bg += K.box('0 0 300 210', refl, { w: fl(250, 0.5), b: '4%', r: '4%', style: 'opacity:.9;mix-blend-mode:screen' })
    // olas: 4 capas que derivan a distinta velocidad (tira repetida en X)
    const wave = (amp, len, fillTop, fillBot, st) => `<path d="M0 ${amp + 8}${Array.from({ length: Math.round(160 / len) + 2 }, (_, i) => `Q${(i * 2 + 1) * len / 2} ${i % 2 ? amp * 0.2 : -amp * 0.4 + 6} ${(i + 1) * len} ${amp + 8}`).join('')}V120H0Z" fill="${S.lin([[0, fillTop], [1, fillBot]], 0, 0, 0, 1)}" stroke="${st}" stroke-width="1.4"/>`
    const L = 80
    const strip = (amp, top, bot, st) => {
      const d = Array.from({ length: 16 }, (_, i) => `Q${i * L + L / 2} ${i % 2 ? 18 - amp : 18 + amp} ${(i + 1) * L} 18`).join('')
      return `<path d="M0 18${d}V120H0Z" fill="${S.lin([[0, top], [1, bot]], 0, 0, 0, 1)}" stroke="${st}" stroke-width="1.5"/>`
    }
    const mkWave = (cls, amp, top, bot, st, bottom, h, op, dl) => `<div class="sk-b" style="left:-80px;right:-80px;bottom:${bottom};height:${h}px;opacity:${op};overflow:visible"><svg viewBox="0 0 1280 120" preserveAspectRatio="none" class="${cls}" style="width:100%;height:100%;display:block;animation-delay:${dl}s" aria-hidden="true">${strip(amp, top, bot, st)}</svg></div>`
    bg += mkWave('spc-wv3', 10, rgba(P.d4, 0.55), rgba(dk(P.d2, 0.1), 0.95), rgba(P.d3, 0.45), '34px', 96, 0.95, 0)
    bg += mkWave('spc-wv2', 14, rgba(P.d1, 0.6), rgba(dk(P.d2, 0.2), 0.96), rgba(lt(P.d3, 0.2), 0.7), '18px', 84, 1, -4)
    bg += mkWave('spc-wv', 18, rgba(lt(P.d1, 0.2), 0.62), rgba(dk(P.d2, 0.35), 0.98), rgba('#fff', 0.7), '0px', 74, 1, -2)
    // destellos de espuma y burbujas
    bg += K.parts(12, { kind: 'rise', seed: 14, html: `<b style="display:block;width:100%;height:100%;border-radius:50%;border:1px solid ${rgba(P.d3, 0.9)};background:${rgba('#fff', 0.14)}"></b>`, size: [3, 8], dur: [8, 15], dx: [-18, 18], o: 0.85 })
    bg += K.parts(7, { kind: 'twinkle', seed: 3, html: `<svg viewBox="-6 -6 12 12" width="100%" height="100%"><path d="M0 -6L1.2 -1.2L6 0L1.2 1.2L0 6L-1.2 1.2L-6 0L-1.2 -1.2Z" fill="${P.d3}"/></svg>`, y0: 4, y1: 60, size: [8, 14], dur: [3, 6], o: 1 })
    bg += K.grain(0.1) + K.vignette('#000', 0.45, 50)
    // fg: bisel de plata con luz recorriendo + remate de gotas en la base
    return { bg, radius: '22px', fg: FRAME(K, P, { spin: 18, r: 18 }), vars: VARS(P, 0.8) }
  }, HIDE('marea-de-plata')),

  // ═════════ 3 · JARDÍN DE SEDA (Llena) — encaje, collares de perlas, lazos de satén, rosas y pétalos al viento
  C('jardin-de-seda', 'Jardín de seda', (K, P) => {
    const S = K.S
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.1)} 0,${P.d2} 50%,${mix(P.d2, P.d4, 0.3)} 100%)`)
    // papel de pared: celosía de rombos con florecita
    bg += K.pattern(70, 70, `<g fill="none" stroke="${rgba(P.d1, 0.18)}" stroke-width="1"><path d="M35 0L70 35L35 70L0 35Z"/><path d="M35 14L56 35L35 56L14 35Z" stroke-opacity=".6"/></g><g transform="translate(35 35)" opacity=".26">${petals(4, 8, 3, rgba(P.d3, 0.5), rgba(P.d1, 0.6), { sw: 0.5 })}</g><circle cx="0" cy="0" r="1.6" fill="${rgba(P.d3, 0.35)}"/><circle cx="70" cy="70" r="1.6" fill="${rgba(P.d3, 0.35)}"/>`)
    bg += K.fill(`background:radial-gradient(ellipse 60% 50% at 50% 0,${rgba(P.d3, 0.2)},transparent 70%),radial-gradient(ellipse 50% 40% at 0 100%,${rgba(P.d1, 0.28)},transparent 70%),radial-gradient(ellipse 50% 40% at 100% 100%,${rgba(P.d4, 0.26)},transparent 70%)`)
    // encaje festoneado arriba y abajo
    const lace = `<path d="M0 2H40" stroke="${P.d3}" stroke-width="1.4"/><path d="M0 2A20 15 0 0 0 40 2" fill="${rgba(P.d3, 0.2)}" stroke="${P.d3}" stroke-width="1.4"/><path d="M6 4A14 9 0 0 0 34 4" fill="none" stroke="${P.d1}" stroke-width=".9"/><circle cx="20" cy="9" r="1.8" fill="${P.d3}"/><circle cx="6" cy="6" r="1.1" fill="${P.d3}"/><circle cx="34" cy="6" r="1.1" fill="${P.d3}"/><circle cx="0" cy="2" r="1.6" fill="${lt(P.d1, 0.5)}"/>`
    bg += K.tile(lace, 40, 20, { x: true, t: '0', l: '0', r: '0', h: '20px', style: 'filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))' })
    bg += K.tile(lace, 40, 20, { x: true, b: '0', l: '0', r: '0', h: '20px', style: 'transform:scaleY(-1);filter:drop-shadow(0 -2px 4px rgba(0,0,0,.4))' })
    // collares de perlas en festón bajo el encaje
    const pg = pearlGrad(S, '#fff4f0')
    const swag = (x0, x1, sag) => { let o = `<path d="M${x0} 8Q${(x0 + x1) / 2} ${8 + sag * 2} ${x1} 8" fill="none" stroke="${rgba(P.d1, 0.7)}" stroke-width=".8"/>`; const N = Math.round((x1 - x0) / 15); for (let i = 0; i <= N; i++) { const t = i / N, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1, y = (1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * (8 + sag * 2) + t * t * 8; o += pearlG(pg, x, y, 3.6 + 2.2 * Math.sin(t * Math.PI)) } return o + `<g transform="translate(${x1} 8)"><circle r="7" fill="${S.rad([[0, '#fff', 1], [0.5, P.d1, 1], [1, dk(P.d1, 0.5), 1]], 0, 0, 7)}" stroke="#000" stroke-opacity=".35" stroke-width=".6"/></g>` }
    bg += K.box('0 0 1000 80', swag(20, 340, 26) + swag(340, 660, 26) + swag(660, 980, 26), { w: 'width:100%', t: '18px', l: '0', style: 'height:auto;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))' })
    // lazos de satén en las esquinas superiores
    const loop = (m) => `<g transform="scale(${m} 1)"><path d="M0 0C-12 -34 -56 -40 -64 -12C-68 12 -34 26 0 3Z" fill="${satin(S, P, P.d1)}" stroke="${dk(P.d1, 0.62)}" stroke-width="1" stroke-linejoin="round"/><path d="M-3 -4C-14 -26 -46 -34 -58 -14M-8 0C-26 -8 -46 -2 -56 -4" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width=".7"/></g>`
    const tail = (m, len) => `<g transform="scale(${m} 1)"><path d="M-3 4C-16 ${len * 0.35} -28 ${len * 0.68} -38 ${len}L-26 ${len - 10}L-18 ${len + 4}C-12 ${len * 0.62} -4 ${len * 0.32} 3 8Z" fill="${satin(S, P, P.d4)}" stroke="${dk(P.d4, 0.62)}" stroke-width="1" stroke-linejoin="round"/></g>`
    const bow = `<g transform="translate(120 70)">${tail(1, 84)}${tail(-1, 64)}${loop(1)}${loop(-1)}<rect x="-10" y="-9" width="20" height="18" rx="7" fill="${satin(S, P, P.d1)}" stroke="${dk(P.d1, 0.62)}" stroke-width="1"/>${pearlG(pearlGrad(S, '#fff'), 0, 0, 5)}</g>`
    bg += K.box('0 0 240 200', bow, { w: fl(170, 0.5), t: '-6px', l: '-8px', rot: -10, style: 'filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))' })
    bg += K.box('0 0 240 200', bow, { w: fl(170, 0.5), t: '-6px', r: '-8px', flipX: true, rot: 10, style: 'filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))' })
    // ramillete de rosas en las esquinas inferiores
    const bouquet = `${leaf(P.d4, 110, 100, -60, 1.5)}${leaf(P.d4, 130, 120, 20, 1.3)}${leaf(P.d4, 80, 120, -120, 1.2)}<g transform="translate(110 108)">${rose(S, P, 1.35, P.d1, 10)}</g><g transform="translate(62 128)">${rose(S, P, 0.95, P.d4, 40)}</g><g transform="translate(150 134)">${rose(S, P, 0.8, lt(P.d1, 0.2), -20)}</g>`
    bg += K.box('0 0 220 200', bouquet, { w: fl(210, 0.5), b: '4px', l: '-6px', style: 'filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))' })
    bg += K.box('0 0 220 200', bouquet, { w: fl(210, 0.5), b: '4px', r: '-6px', flipX: true, style: 'filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))' })
    // pétalos cayendo y corazones flotando
    const pet = (c) => `<svg viewBox="-7 -8 14 16" width="100%" height="100%"><path d="M0 -7C5 -5 6 3 0 7C-6 3 -5 -5 0 -7Z" fill="${c}" stroke="#fff" stroke-opacity=".5" stroke-width=".5"/></svg>`
    bg += K.parts(8, { kind: 'fall', seed: 9, html: (i) => pet(i % 2 ? P.d1 : lt(P.d3, 0.1)), size: [10, 16], dur: [11, 18], dx: [-50, 50], rot: 280, o: 0.9 })
    bg += K.parts(5, { kind: 'float', seed: 21, html: `<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0 8C-10 -1 -8 -10 -3.4 -10C-1 -10 0 -8 0 -7C0 -8 1 -10 3.4 -10C8 -10 10 -1 0 8Z" fill="${P.d4}" stroke="#fff" stroke-opacity=".55" stroke-width=".7"/></svg>`, size: [10, 16], dur: [6, 10], dx: [-10, 10], y0: 20, y1: 80, o: 0.85 })
    bg += K.parts(8, { kind: 'rise', seed: 4, html: dotp(rgba('#fff', 0.9), 8), size: [2, 4], dur: [8, 14], dx: [-16, 16], o: 0.8 })
    bg += K.grain(0.08) + K.vignette('#000', 0.38, 52)
    return { bg, radius: '24px', fg: FRAME(K, P, { spin: 15, r: 20, gem: lt(P.d1, 0.4) }), vars: VARS(P, 0.8) }
  }, HIDE('jardin-de-seda')),

  // ═════════ 4 · UMBRA (Eclipse) — eclipse total gigante, corona de rayos, anillo de diamante, bruma de sombra
  C('umbra', 'Umbra', (K, P) => {
    const S = K.S
    let bg = K.fill(`background:radial-gradient(ellipse 100% 70% at 85% 0,${mix(P.d2, P.d4, 0.42)} 0,${P.d2} 55%,${dk(P.d2, 0.55)} 100%)`)
    bg += K.stars(90, { seed: 8, color: P.d3, area: [1100, 1100], tw: 6, size: 1.6 })
    // eclipse (gigante, recortado por la esquina superior derecha)
    const rays = sunRays(S, P, { n: 56, r0: 104, long: 90, short: 40, w: 2.2, c0: P.d3, c1: P.d1, seed: 3 }) + sunRays(S, P, { n: 30, r0: 104, long: 56, short: 30, w: 3.4, off: 5, c0: lt(P.d4, 0.4), c1: P.d4, op: 0.7, seed: 6 })
    const ecl = `<circle cx="144" cy="144" r="230" fill="${S.rad([[0.4, P.d1, 0.5], [1, P.d1, 0]], 144, 144, 230)}" class="spc-pu"/>` +
      `<g class="spc-ra">${rays}</g>` +
      `<circle cx="144" cy="144" r="118" fill="none" stroke="${P.d3}" stroke-opacity=".22" stroke-width="14" class="spc-pu"/>` +
      `<circle cx="144" cy="144" r="104" fill="#020103"/><circle cx="144" cy="144" r="104" fill="none" stroke="${S.lin([[0, lt(P.d3, 0.5)], [0.5, P.d1], [1, lt(P.d3, 0.3)]], 0, 0, 1, 1)}" stroke-width="3"/>` +
      `<path d="M62 92A100 100 0 0 1 220 62" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` +
      `<g class="spc-ra" style="animation-duration:90s"><ellipse cx="144" cy="144" rx="150" ry="40" fill="none" stroke="${P.d3}" stroke-opacity=".5" stroke-width=".8" transform="rotate(-24 144 144)"/><ellipse cx="144" cy="144" rx="168" ry="30" fill="none" stroke="${P.d4}" stroke-opacity=".45" stroke-width=".8" stroke-dasharray="2 6" transform="rotate(30 144 144)"/></g>`
    bg += K.box('-90 -90 468 468', ecl, { w: 'width:clamp(260px,64cqw,640px)', t: 'clamp(-190px,-18cqw,-70px)', r: 'clamp(-150px,-12cqw,-40px)', style: `filter:drop-shadow(0 0 40px ${rgba(P.d1, 0.35)})` })
    // anillo de diamante: destello fijo en el borde del disco (se enciende y apaga)
    bg += K.box('-40 -40 80 80', `<circle r="26" fill="${S.rad([[0, '#fff', 0.95], [0.3, P.d3, 0.7], [1, P.d1, 0]], 0, 0, 26)}" class="spc-pu"/><path d="M0 -38L3 -4L38 0L3 4L0 38L-3 4L-38 0L-3 -4Z" fill="#fff" opacity=".95" class="spc-gl"/><circle cx="0" cy="0" r="4" fill="#fff"/>`, { w: 'width:clamp(46px,9cqw,84px)', t: 'clamp(18px,4cqw,44px)', r: 'clamp(150px,30cqw,300px)', style: 'mix-blend-mode:screen' })
    // sombras que suben desde la base + haces de luz
    bg += K.fill(`background:linear-gradient(0deg,${rgba('#000', 0.82)} 0,${rgba(dk(P.d2, 0.4), 0.5)} 30%,transparent 62%)`)
    bg += K.fill(`background:linear-gradient(98deg,transparent 28%,${rgba(P.d3, 0.07)} 40%,${rgba(P.d1, 0.1)} 46%,transparent 58%);width:55%;animation:sk-slide 17s ease-in-out infinite;mix-blend-mode:screen`)
    bg += K.parts(12, { kind: 'rise', seed: 12, html: dotp(rgba(P.d3, 0.95), 10), size: [2, 5], dur: [9, 16], dx: [-26, 26], o: 0.85 })
    bg += K.parts(6, { kind: 'twinkle', seed: 3, html: `<svg viewBox="-8 -8 16 16" width="100%" height="100%"><path d="M0 -8L1.6 -1.6L8 0L1.6 1.6L0 8L-1.6 1.6L-8 0L-1.6 -1.6Z" fill="${P.d3}"/></svg>`, y0: 4, y1: 90, size: [9, 16], dur: [3, 6], o: 1 })
    bg += K.grain(0.12) + K.vignette('#000', 0.55, 44)
    return { bg, radius: '22px', fg: FRAME(K, P, { spin: 12, inset: 8, r: 16, gem: P.d1 }), vars: VARS(P, 0.84) }
  }, HIDE('umbra')),

  // ═════════ 5 · SALÓN DE CRISTAL (Eclipse) — vitral de facetas triangulares, racimos de cristal y luz refractada
  C('salon-de-cristal', 'Salón de cristal', (K, P) => {
    const S = K.S, R = rng(77)
    let bg = K.fill(`background:linear-gradient(165deg,${mix(P.d2, P.d4, 0.4)} 0,${P.d2} 45%,${dk(P.d2, 0.5)} 100%)`)
    // teselado de triángulos con luz desde arriba-izquierda
    const COLS = 13, ROWS = 9, W = 1000, H = 700, cw = W / COLS, ch = H / ROWS
    const pts = []
    for (let j = 0; j <= ROWS; j++) { pts[j] = []; for (let i = 0; i <= COLS; i++) pts[j][i] = [i * cw + (i > 0 && i < COLS ? (R() - 0.5) * cw * 0.7 : 0), j * ch + (j > 0 && j < ROWS ? (R() - 0.5) * ch * 0.7 : 0)] }
    const cols = [P.d1, P.d3, P.d4, lt(P.d1, 0.35), P.d1, dk(P.d4, 0.2)]
    let tess = ''
    const tri = (a, b, c, k) => {
      const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3
      const light = 1 - (cx / W * 0.55 + cy / H * 0.45), base = cols[Math.floor(R() * cols.length)]
      const al = 0.05 + R() * 0.2 + light * 0.2
      tess += `<path d="M${pt(...a)}L${pt(...b)}L${pt(...c)}Z" fill="${rgba(light > 0.55 && R() > 0.5 ? lt(base, 0.4) : base, Math.min(0.5, al))}" stroke="${rgba(lt(P.d3, 0.5), 0.22 + R() * 0.2)}" stroke-width=".8"/>`
    }
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i]
      if ((i + j) % 2) { tri(a, b, d, 0); tri(b, c, d, 1) } else { tri(a, b, c, 0); tri(a, c, d, 1) }
    }
    bg += K.svg(`0 0 ${W} ${H}`, tess, { pos: 'xMidYMid slice' })
    bg += K.fill(`background:radial-gradient(ellipse 60% 44% at 20% 0,${rgba(P.d3, 0.3)},transparent 70%),radial-gradient(ellipse 50% 40% at 100% 100%,${rgba(P.d1, 0.3)},transparent 70%)`)
    // racimos de cristal que brotan de las esquinas inferiores
    const shardP = (x, y, w, h, tilt) => { const L = [x - w / 2, y], Rr = [x + w / 2, y], T = [x + tilt, y - h], M = [x + w * 0.1 + tilt * 0.3, y - h * 0.55]
      return `<path d="M${pt(...L)}L${pt(...T)}L${pt(...M)}Z" fill="${rgba('#fff', 0.18)}"/><path d="M${pt(...M)}L${pt(...T)}L${pt(...Rr)}Z" fill="${rgba(P.d1, 0.55)}"/><path d="M${pt(...L)}L${pt(...M)}L${pt(...Rr)}Z" fill="${rgba(P.d4, 0.5)}"/><path d="M${pt(...L)}L${pt(...T)}L${pt(...Rr)}Z" fill="none" stroke="${rgba(lt(P.d3, 0.5), 0.9)}" stroke-width="1.2" stroke-linejoin="round"/><path d="M${pt(...M)}L${pt(...L)}M${pt(...M)}L${pt(...Rr)}M${pt(...M)}L${pt(...T)}" stroke="#fff" stroke-opacity=".5" stroke-width=".7" fill="none"/>` }
    const cluster = `<g>${shardP(70, 300, 64, 230, -18)}${shardP(120, 300, 50, 160, 14)}${shardP(30, 300, 40, 120, -22)}${shardP(160, 300, 36, 96, 20)}${shardP(95, 300, 30, 262, 4)}</g>`
    bg += K.box('0 0 200 310', cluster, { w: fl(190, 0.5), b: '-2px', l: '0', style: `filter:drop-shadow(0 0 18px ${rgba(P.d3, 0.45)})` })
    bg += K.box('0 0 200 310', cluster, { w: fl(190, 0.5), b: '-2px', r: '0', flipX: true, style: `filter:drop-shadow(0 0 18px ${rgba(P.d3, 0.45)})` })
    // araña de cristal: cadenas con gotas colgando del borde superior
    let chand = ''
    for (let i = 0; i < 7; i++) { const x = 20 + i * 56, L = 34 + (i % 2) * 26 + (i === 3 ? 24 : 0); chand += `<path d="M${x} 0V${L}" stroke="${rgba(P.d3, 0.8)}" stroke-width=".9"/><path transform="translate(${x} ${L + 14})" d="M0 -14L8 0L0 16L-8 0Z" fill="${S.lin([[0, '#fff', 0.9], [0.5, P.d3, 0.7], [1, P.d1, 0.8]], 0, 0, 1, 1)}" stroke="${lt(P.d3, 0.6)}" stroke-width=".8"/><path transform="translate(${x} ${L + 14})" d="M0 -14L0 16M-8 0H8" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/>` }
    bg += K.box('0 0 400 100', chand, { w: fl(400, 0.55), t: '0', l: '50%', style: 'translate:-50% 0;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))' })
    // refracción: dos barridos de luz con destellos prismáticos
    bg += K.fill(`background:linear-gradient(105deg,transparent 40%,${rgba('#fff', 0.2)} 48%,${rgba(P.d3, 0.25)} 51%,transparent 60%);width:42%;animation:spc-sh 9s ease-in-out infinite;mix-blend-mode:screen`)
    bg += K.fill(`background:linear-gradient(115deg,transparent 44%,${rgba(P.d4, 0.2)} 50%,transparent 58%);width:34%;animation:spc-sh 13s ease-in-out -5s infinite;mix-blend-mode:screen`)
    bg += K.parts(9, { kind: 'twinkle', seed: 5, html: `<svg viewBox="-8 -8 16 16" width="100%" height="100%"><path d="M0 -8L1.6 -1.6L8 0L1.6 1.6L0 8L-1.6 1.6L-8 0L-1.6 -1.6Z" fill="#fff"/></svg>`, y0: 2, y1: 92, size: [8, 16], dur: [2.6, 5], o: 1 })
    bg += K.parts(8, { kind: 'rise', seed: 11, html: dotp(rgba(P.d3, 0.95), 9), size: [2, 4], dur: [8, 15], dx: [-20, 20], o: 0.8 })
    bg += K.grain(0.07) + K.vignette('#000', 0.42, 50)
    return { bg, radius: '20px', fg: FRAME(K, P, { spin: 11, inset: 7, r: 16, gem: lt(P.d1, 0.35) }), vars: VARS(P, 0.8) }
  }, HIDE('salon-de-cristal')),
]
