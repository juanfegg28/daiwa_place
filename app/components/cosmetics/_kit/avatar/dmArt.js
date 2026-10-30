// @ts-nocheck
// DÍA DE MUERTOS — librería de dibujo compartida (avatares, tarjetas y fondos de la colección «muertos»).
// Todo es original y está hecho con código: cempasúchil, monarcas, calaveritas de azúcar, papel picado, pan de muerto, plumas y encaje.
// Las piezas con colores fijos de la tradición (pan, papel) mezclan un poco de la paleta; las demás usan solo P.d1…P.d4.
import { f, pol, rng } from '../core/util.js'
import { heartD, leafD, featherD } from '../core/svg.js'
import { KF } from '../core/kit.js'

// ───────── CSS compartido (prefijo dm-) · se declara UNA vez, en la primera decoración de la colección
export const DM_CSS =
  `.dm-fl{transform-box:fill-box;transform-origin:50% 100%;animation:dm-fl 1.9s ease-in-out infinite}${KF('dm-fl', '0%,100%{transform:scale(1,1) rotate(0)}18%{transform:scale(.9,1.1) rotate(-3deg)}42%{transform:scale(1.06,.93) rotate(2.5deg)}68%{transform:scale(.94,1.07) rotate(-1.5deg)}}')}` +
  `.dm-wg{transform-box:fill-box;transform-origin:50% 50%;animation:dm-wg .42s ease-in-out infinite alternate}${KF('dm-wg', 'from{transform:scaleX(1)}to{transform:scaleX(.28)}')}` +
  `.dm-tw{transform-box:fill-box;transform-origin:50% 50%;animation:dm-tw 3s ease-in-out infinite}${KF('dm-tw', '0%,100%{transform:scale(.4);opacity:.4}50%{transform:scale(1.1);opacity:1}')}` +
  `.dm-pl{animation:dm-pl 3.4s ease-in-out infinite}${KF('dm-pl', '0%,100%{opacity:.55}50%{opacity:1}')}` +
  `.dm-sw{transform-box:view-box;transform-origin:0 0;animation:dm-sw 6s ease-in-out infinite alternate}${KF('dm-sw', 'from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}')}` +
  `.dm-fs{transform-box:fill-box;transform-origin:50% 0;animation:dm-fs 3.6s ease-in-out infinite alternate}${KF('dm-fs', 'from{transform:rotate(-7deg)}to{transform:rotate(7deg)}')}` +
  `.dm-pw{transform-box:fill-box;transform-origin:50% 100%;animation:dm-pw 5.5s ease-in-out infinite alternate}${KF('dm-pw', 'from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}')}` +
  `.dm-bob{animation:dm-bob 4.6s ease-in-out infinite alternate}${KF('dm-bob', 'from{transform:translateY(-2.6px)}to{transform:translateY(2.6px)}')}` +
  `.dm-spin{transform-box:view-box;transform-origin:0 0;animation:dm-spin 70s linear infinite}${KF('dm-spin', 'to{transform:rotate(360deg)}')}.dm-spinr{animation-direction:reverse}` +
  `.dm-fall{transform-box:fill-box;transform-origin:50% 50%;animation:dm-fall 5.2s ease-in infinite}${KF('dm-fall', '0%{transform:translate(0,-4px) rotate(0);opacity:0}14%{opacity:1}100%{transform:translate(16px,48px) rotate(140deg);opacity:0}')}` +
  `.dm-st{animation:dm-st 3.4s ease-out infinite}${KF('dm-st', '0%{transform:translateY(0);opacity:0}25%{opacity:.8}100%{transform:translateY(-22px);opacity:0}')}` +
  `.dm-gl{animation:dm-gl 3.1s ease-in-out infinite}${KF('dm-gl', '0%,100%{opacity:.35}50%{opacity:1}')}`

// ───────── utilidades
export const ring = (r, w, c, op = 1, x = '') => `<circle cx="144" cy="144" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"${op !== 1 ? ` opacity="${op}"` : ''} ${x}/>`
// colores de fiesta que se adaptan a cada paleta (y al matiz del legendario): [principal, acento, luz, y tres rotaciones]
export const fiesta = (P) => [P.d1, P.d4, P.rot(P.d1, 150), P.rot(P.d4, 140), P.rot(P.d1, -75), P.lt(P.d3, 0.15)]
const pt = (x, y) => `${f(x)} ${f(y)}`
const at = (x, y, inner, r = 0, s = 1) => `<g transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}">${inner}</g>`
export { at as dmAt }

// ───────── CEMPASÚCHIL (flor de pompón, radio ≈ 12)
export function marigoldId(S, P) {
  if (S._dmMg) return S._dmMg
  const edge = P.dk(P.d1, 0.55)
  const ringOf = (n, rr, pr, fill, off) => {
    let o = ''
    for (let i = 0; i < n; i++) { const [x, y] = pol(0, 0, rr, off + (i * 360) / n); o += `<circle cx="${f(x)}" cy="${f(y)}" r="${pr}" fill="${fill}" stroke="${edge}" stroke-width=".7" stroke-opacity=".8"/>` }
    return o
  }
  const shade = S.radB([[0.55, '#000', 0], [1, '#000', 0.36]], 0.5, 0.5, 0.5)
  const spot = S.radB([[0, '#fff', 0.5], [1, '#fff', 0]], 0.36, 0.3, 0.5)
  const inner = `<circle r="12.2" fill="${P.dk(P.d1, 0.6)}"/>` + ringOf(13, 8.7, 3.8, P.d1, 0) + ringOf(10, 5.7, 3.2, P.mix(P.d1, P.d3, 0.3), 18) + ringOf(7, 3, 2.5, P.mix(P.d1, P.d3, 0.55), 0) +
    `<circle r="1.5" fill="${P.dk(P.d1, 0.25)}"/><circle r="12.4" fill="${shade}"/><circle r="12.4" fill="${spot}"/>`
  S._dmMg = S.sym(inner)
  return S._dmMg
}
export const mg = (S, P, x, y, s = 1, r = 0, extra = '') => `<g transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''} scale(${f(s)})"${extra}>${S.use(marigoldId(S, P))}</g>`

// pétalo suelto de cempasúchil (cae suave)
export const petalShape = (c, s = 1, op = 1) => `<path d="M0 -5C3 -5 5 -2 4 1C3 4 1 6 0 6C-1 6 -3 4 -4 1C-5 -2 -3 -5 0 -5Z" transform="scale(${s})" fill="${c}" opacity="${op}"/>`
export const fallPetal = (x, y, c, dl, s = 1) => `<g transform="translate(${f(x)} ${f(y)})"><g class="dm-fall" style="animation-delay:${-dl}s">${petalShape(c, s)}</g></g>`

// hojas doradas / verdes en ramita (apunta hacia -y desde el origen)
export function sprig(P, c, s = 1) {
  const L = (a, len) => `<path transform="rotate(${a})" d="${leafD(len, len * 0.34)}" fill="${c}" stroke="${P.dk(c, 0.5)}" stroke-width=".6" stroke-opacity=".7"/>`
  return `<g transform="scale(${s})">${L(-48, 15)}${L(48, 15)}${L(-22, 19)}${L(22, 19)}${L(0, 22)}</g>`
}

// ───────── MONARCA (alas abiertas, envergadura ≈ 64)
export function monarchId(S, P) {
  if (S._dmMo) return S._dmMo
  const ink = '#160b07'
  const fill = S.radB([[0, P.lt(P.d1, 0.35)], [0.55, P.d1], [1, P.dk(P.d1, 0.2)]], 0.05, 0.35, 0.95)
  const fw = 'M1 -3C4 -15 20 -25 32 -17C37 -12 33 -4 25 -1C17 2 8 2 1 1Z'
  const hw = 'M1 1C10 1 23 2 26 8C28 15 20 20 12 17C6 14 2 8 1 3Z'
  const wing = `<g><path d="${hw}" fill="${fill}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="${fw}" fill="${fill}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M2 -2L29 -14M2 -1L33 -7M2 0L27 -1M2 3L23 10M2 3L15 15M2 3L9 12" stroke="${ink}" stroke-width=".95" fill="none" stroke-linecap="round"/>` +
    `<circle cx="25" cy="-16.4" r="1.3" fill="#fff"/><circle cx="30" cy="-13.4" r="1.2" fill="#fff"/><circle cx="33" cy="-8.6" r="1.1" fill="#fff"/><circle cx="26" cy="-3.2" r="1" fill="#fff" opacity=".9"/><circle cx="24" cy="12.4" r="1" fill="#fff"/><circle cx="19" cy="16.6" r="1" fill="#fff"/><circle cx="14" cy="16.8" r=".9" fill="#fff"/></g>`
  const inner = `<g class="dm-wg">${wing}<g transform="scale(-1 1)">${wing}</g></g><ellipse cx="0" cy="3" rx="1.7" ry="9" fill="${ink}"/><circle cx="0" cy="-7" r="2.3" fill="${ink}"/><path d="M-.8 -9L-5 -17M.8 -9L5 -17" stroke="${ink}" stroke-width=".8" fill="none" stroke-linecap="round"/><circle cx="-5" cy="-17.4" r=".9" fill="${ink}"/><circle cx="5" cy="-17.4" r=".9" fill="${ink}"/>`
  S._dmMo = S.sym(inner)
  return S._dmMo
}
export const monarch = (S, P, x, y, s = 1, r = 0, cls = '') => `<g transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''} scale(${f(s)})">${cls ? `<g class="${cls}">` : ''}${S.use(monarchId(S, P))}${cls ? '</g>' : ''}</g>`

// ───────── VELA con llama (base centrada en 0,0; crece hacia arriba)
export function candle(S, P, { h = 26, w = 7, flame = true, drip = true, id = 0 } = {}) {
  const wax = S.lin([[0, '#fff6e6'], [0.5, '#f1dfc4'], [1, '#c9ae88']], 0, 0, 1, 0)
  const fl = S.lin([[0, P.d1], [0.55, P.mix(P.d1, P.d3, 0.6)], [1, P.d3]], 0, 1, 0, 0)
  const glowF = S.radB([[0, P.d3, 0.95], [0.35, P.d1, 0.5], [1, P.d1, 0]])
  let o = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="1.3" fill="${wax}" stroke="#3a2418" stroke-width="1" stroke-opacity=".8"/>`
  o += `<ellipse cx="0" cy="${-h}" rx="${w / 2}" ry="1.5" fill="#fff8ec" stroke="#3a2418" stroke-width=".7" stroke-opacity=".7"/>`
  if (drip) o += `<path d="M${-w / 2 + 1.2} ${-h + 1}V${-h + 8}Q${-w / 2 + 1.2} ${-h + 10} ${-w / 2 + 2.6} ${-h + 8}V${-h + 1}Z" fill="#fff8ec" stroke="#3a2418" stroke-width=".4" stroke-opacity=".5"/>`
  o += `<path d="M0 ${-h}V${-h - 3}" stroke="#2a1810" stroke-width=".9" stroke-linecap="round"/>`
  if (flame) o += `<circle class="dm-gl" style="animation-delay:${-id * 0.7}s" cx="0" cy="${-h - 9}" r="${f(w * 2.1)}" fill="${glowF}"/><g class="dm-fl" style="animation-delay:${-id * 0.55}s"><path d="M0 ${-h - 15}C3.4 ${-h - 10} 4.4 ${-h - 7} 4.4 ${-h - 5.4}C4.4 ${-h - 3.2} 2.4 ${-h - 2} 0 ${-h - 2}C-2.4 ${-h - 2} -4.4 ${-h - 3.2} -4.4 ${-h - 5.4}C-4.4 ${-h - 7} -3.4 ${-h - 10} 0 ${-h - 15}Z" fill="${fl}" stroke="${P.dk(P.d1, 0.35)}" stroke-width=".5" stroke-opacity=".6"/><path d="M0 ${-h - 10}C1.6 ${-h - 8} 2 ${-h - 6.6} 2 ${-h - 5.6}C2 ${-h - 4.4} 1 ${-h - 3.6} 0 ${-h - 3.6}C-1 ${-h - 3.6} -2 ${-h - 4.4} -2 ${-h - 5.6}C-2 ${-h - 6.6} -1.6 ${-h - 8} 0 ${-h - 10}Z" fill="#fffbe2"/></g>`
  return o
}

// ───────── CALAVERITA DE AZÚCAR (cara frontal, ancho ≈ 46, alto ≈ 52, centrada)
// o = { base, a, b, c }  base = color del azúcar · a/b/c = colores de los adornos
export function skullId(S, o) {
  S._dmSk = S._dmSk || {}
  const key = [o.base, o.a, o.b, o.c].join('|')
  if (S._dmSk[key]) return S._dmSk[key]
  const ink = '#2a1030'
  const mixC = (x, y, t) => {
    const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const A = h(x), B = h(y)
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
  }
  const body = S.lin([[0, mixC(o.base, '#ffffff', 0.55)], [0.5, o.base], [1, mixC(o.base, '#000000', 0.22)]], 0.2, 0, 0.8, 1)
  const skull = 'M0 -25C15 -25 24 -15 24 -3C24 6 21 11 18 14V22C18 25 16 26.5 14 26.5H-14C-16 26.5 -18 25 -18 22V14C-21 11 -24 6 -24 -3C-24 -15 -15 -25 0 -25Z'
  const scal = (cx, cy, r, n, pr, c) => { let s = ''; for (let i = 0; i < n; i++) { const [x, y] = pol(cx, cy, r, i * (360 / n)); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${pr}" fill="${c}" stroke="${ink}" stroke-width=".55" stroke-opacity=".8"/>` } return s }
  const eye = (cx) => scal(cx, -2, 8.2, 10, 2.2, o.a) + `<circle cx="${cx}" cy="-2" r="7.2" fill="${o.b}" stroke="${ink}" stroke-width=".8"/><circle cx="${cx}" cy="-2" r="4.7" fill="${ink}"/><circle cx="${cx + 1.5}" cy="-3.4" r="1.5" fill="${o.c}"/>`
  let inner = `<path d="${skull}" fill="${body}" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>`
  // flor de la frente y hojitas
  inner += scal(0, -16.5, 3.6, 6, 1.7, o.a) + `<circle cx="0" cy="-16.5" r="2.1" fill="${o.c}" stroke="${ink}" stroke-width=".5"/>`
  inner += `<path d="M-6.5 -14.5Q-10 -17 -12.5 -13.5M6.5 -14.5Q10 -17 12.5 -13.5" stroke="${o.b}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
  inner += `<circle cx="-15" cy="-11" r="1.2" fill="${o.b}"/><circle cx="15" cy="-11" r="1.2" fill="${o.b}"/>`
  inner += eye(-9.8) + eye(9.8)
  // nariz de corazón
  inner += `<path d="M0 4.6C-1.4 2.6 -4.4 3.4 -3.4 6.4C-2.8 8.2 -1.2 9.8 0 11C1.2 9.8 2.8 8.2 3.4 6.4C4.4 3.4 1.4 2.6 0 4.6Z" fill="${ink}"/>`
  // mejillas
  inner += `<path d="M-20.5 3Q-17 6 -16 12M20.5 3Q17 6 16 12" stroke="${o.a}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="-14" cy="8" r="1.5" fill="${o.b}"/><circle cx="14" cy="8" r="1.5" fill="${o.b}"/><circle cx="-18" cy="9.4" r="1.1" fill="${o.c}"/><circle cx="18" cy="9.4" r="1.1" fill="${o.c}"/>`
  // dientes
  inner += `<path d="M-12.4 14.6H12.4V21.2Q12.4 23.2 10.4 23.2H-10.4Q-12.4 23.2 -12.4 21.2Z" fill="#fffaf0" stroke="${ink}" stroke-width="1.1"/><path d="M-6.2 14.6V23.2M0 14.6V23.2M6.2 14.6V23.2" stroke="${ink}" stroke-width=".95"/><path d="M-12.4 18.9H12.4" stroke="${o.a}" stroke-width=".9"/>`
  inner += `<path d="M-14 13.6Q0 16.6 14 13.6" stroke="${o.b}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
  inner += `<path d="M-17 -19Q-14 -23 -8 -23.6" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
  S._dmSk[key] = S.sym(inner)
  return S._dmSk[key]
}
// cabeza de calavera con sombrero y flor (catrina en miniatura): la misma cara con ala ancha, pluma y rosa
export const skull = (S, o, x, y, s = 1, r = 0, cls = '') => `<g transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''} scale(${f(s)})">${cls ? `<g class="${cls}">` : ''}${S.use(skullId(S, o))}${cls ? '</g>' : ''}</g>`
// colores de calaverita según paleta: arreglo de {base,a,b,c}
export const skullSet = (P) => {
  const F = fiesta(P)
  return [
    { base: '#fff7ea', a: F[0], b: F[1], c: F[2] },
    { base: P.lt(F[1], 0.62), a: F[0], b: F[2], c: '#fff7ea' },
    { base: P.lt(F[2], 0.6), a: F[1], b: F[4], c: F[0] },
    { base: P.lt(F[4], 0.6), a: F[3], b: F[0], c: F[1] },
    { base: P.lt(F[0], 0.62), a: F[1], b: F[3], c: F[2] },
  ]
}

// calavera catrina en miniatura: cráneo + sombrero de ala ancha con rosa y pluma
export function catrinaMini(S, P, o) {
  const hat = P.dk(P.d2, 0.1), band = P.d1
  const brim = `<path d="M-14 -13C-14 -34 14 -34 14 -13Z" fill="${hat}" stroke="${P.d3}" stroke-width="1.2"/><path d="M-14 -19Q0 -15 14 -19" stroke="${band}" stroke-width="3.6" fill="none"/><ellipse cx="0" cy="-13" rx="31" ry="8" fill="${hat}" stroke="${P.d3}" stroke-width="1.2"/>`
  const plume = `<g transform="translate(9 -30) rotate(28)"><path d="${featherD(26, 6.5, 'round', 0.1)}" fill="${P.d4}" stroke="${P.dk(P.d4, 0.5)}" stroke-width=".8"/><path d="M0 0Q.8 -12 1.2 -24" stroke="${P.lt(P.d4, 0.5)}" stroke-width=".8" fill="none"/></g>`
  const flo = mg(S, P, -9, -21, 0.72)
  return `<g transform="translate(0 6)">${S.use(skullId(S, o))}</g>` + brim + plume + flo
}

// ───────── PAPEL PICADO (bandera de papel calado; ancho 24, alto ≈ 22, cuelga desde (0,0))
export function flagId(S, v) {
  S._dmFg = S._dmFg || {}
  if (S._dmFg[v]) return S._dmFg[v]
  const paper = 'M-12 0H12V19Q9 23.4 6 19Q3 23.4 0 19Q-3 23.4 -6 19Q-9 23.4 -12 19Z'
  let holes = ''
  for (let i = -4; i <= 4; i++) holes += `<circle cx="${i * 2.7}" cy="4.4" r=".78" fill="#000"/>`
  for (let i = -3; i <= 3; i++) holes += `<path d="M${i * 3.4 - 1.1} 17.6L${i * 3.4} 15.6L${i * 3.4 + 1.1} 17.6Z" fill="#000"/>`
  let main = ''
  if (v === 0) {
    main = `<path d="M0 6.2C4.6 6.2 7.4 8.8 7.4 12.2C7.4 14.6 6.4 15.6 5.4 16.4V17.4H-5.4V16.4C-6.4 15.6 -7.4 14.6 -7.4 12.2C-7.4 8.8 -4.6 6.2 0 6.2Z" fill="#000"/>` +
      `<circle cx="-2.8" cy="11.4" r="1.9" fill="#fff"/><circle cx="2.8" cy="11.4" r="1.9" fill="#fff"/><path d="M0 13.4L-1 15.2H1Z" fill="#fff"/><path d="M-3.2 16.6V17.4M-1.1 16.4V17.4M1.1 16.4V17.4M3.2 16.6V17.4" stroke="#fff" stroke-width=".7"/>` +
      `<circle cx="-9" cy="11" r=".9" fill="#000"/><circle cx="9" cy="11" r=".9" fill="#000"/><circle cx="-9.8" cy="14" r=".7" fill="#000"/><circle cx="9.8" cy="14" r=".7" fill="#000"/>`
  } else if (v === 1) {
    let pet = ''
    for (let i = 0; i < 8; i++) pet += `<ellipse transform="translate(0 11.4) rotate(${i * 45}) translate(0 -6.1)" rx="1.5" ry="3" fill="#000"/>`
    main = pet + `<circle cx="0" cy="11.4" r="3.3" fill="#000"/><circle cx="0" cy="11.4" r="1.7" fill="#fff"/><circle cx="-9.6" cy="9" r=".8" fill="#000"/><circle cx="9.6" cy="9" r=".8" fill="#000"/>`
  } else {
    main = `<path d="M0 6.4L3.6 10.6L0 14.8L-3.6 10.6Z" fill="#000"/><path d="M0 8.6L1.8 10.6L0 12.6L-1.8 10.6Z" fill="#fff"/>` +
      `<g transform="translate(-8 11.2) scale(.2)"><path d="${heartD(10)}" fill="#000"/></g><g transform="translate(8 11.2) scale(.2)"><path d="${heartD(10)}" fill="#000"/></g>` +
      `<path d="M-6.4 7L-5 8.6L-6.4 10.2L-7.8 8.6Z M6.4 7L7.8 8.6L6.4 10.2L5 8.6Z" fill="#000"/>`
  }
  const m = S.mask(`<rect x="-30" y="-8" width="60" height="50" fill="#fff"/>${holes}${main}`)
  const sheen = S.lin([[0, '#fff', 0.38], [0.6, '#fff', 0.02], [1, '#000', 0.16]], 0, 0, 1, 1)
  const inner = `<g mask="${m}"><path d="${paper}" fill="currentColor"/><path d="${paper}" fill="${sheen}"/></g><path d="M-12 0H12" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>`
  S._dmFg[v] = S.sym(inner)
  return S._dmFg[v]
}
export const flag = (S, v, color, x, y, s = 1, r = 0, cls = '', d = 0) =>
  `<g transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''} scale(${f(s)})"><g${cls ? ` class="${cls}"` : ''}${d ? ` style="animation-delay:${-d}s"` : ''}><use href="#${flagId(S, v)}" xlink:href="#${flagId(S, v)}" style="color:${color}"/></g></g>`

// ───────── PAN DE MUERTO (vista desde arriba, radio ≈ 20)
export function panId(S, P) {
  if (S._dmPan) return S._dmPan
  const dome = S.radB([[0, '#f6cf84'], [0.55, '#e0a04a'], [1, '#9a5a22']], 0.4, 0.34, 0.8)
  const bone = S.lin([[0, '#fbe0a6'], [1, '#d99a46']], 0, 0, 1, 1)
  const edge = '#5e3512'
  let b = ''
  for (let k = 0; k < 4; k++) {
    const a = 45 + k * 90
    b += `<g transform="rotate(${a})"><path d="M0 -5.2L-1.9 -5.2C-2.7 -9 -2.7 -13.4 -2.6 -15.6C-4.8 -16.4 -5 -19 -3 -19.6C-1.6 -20.6 -.7 -19.8 0 -18.9C.7 -19.8 1.6 -20.6 3 -19.6C5 -19 4.8 -16.4 2.6 -15.6C2.7 -13.4 2.7 -9 1.9 -5.2Z" fill="${bone}" stroke="${edge}" stroke-width=".75" stroke-linejoin="round"/><path d="M-.5 -7.5V-16" stroke="#fff4d2" stroke-opacity=".6" stroke-width=".9" stroke-linecap="round"/></g>`
  }
  const R = rng(5)
  let sugar = ''
  for (let i = 0; i < 38; i++) { const a = R() * 360, r = Math.sqrt(R()) * 18.5, [x, y] = pol(0, 0, r, a); sugar += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.4 + R() * 0.5)}" fill="${P.lt(P.d3, 0.8)}" opacity="${f(0.55 + R() * 0.4)}"/>` }
  const inner = `<circle r="21" fill="#2a160a" opacity=".35" transform="translate(1.2 1.6)"/><circle r="20.4" fill="${dome}" stroke="${edge}" stroke-width="1.1"/>` + b +
    `<circle r="5.4" fill="${S.radB([[0, '#fff0c8'], [1, '#d9923e']], 0.38, 0.3, 0.8)}" stroke="${edge}" stroke-width=".9"/><path d="M-14 -12Q-8 -18 0 -19" stroke="#fff3cc" stroke-opacity=".5" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + sugar
  S._dmPan = S.sym(inner)
  return S._dmPan
}
export const pan = (S, P, x, y, s = 1, r = 0, cls = '') => `<g transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''} scale(${f(s)})">${cls ? `<g class="${cls}">` : ''}${S.use(panId(S, P))}${cls ? '</g>' : ''}</g>`
export const steam = (c, x, y, d = 0, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path class="dm-st" style="animation-delay:${-d}s" d="M0 0C-4 -5 4 -8 0 -13C-3 -17 3 -19 0 -24" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`

// ───────── ENCAJE (borde festoneado alrededor del avatar)
export function laceRing(P, r = 113, n = 40, col, op = 0.92) {
  col = col || P.d3
  let d = '', dots = ''
  for (let i = 0; i < n; i++) {
    const a0 = (i * 360) / n, a1 = ((i + 1) * 360) / n
    const [x0, y0] = pol(144, 144, r, a0), [x1, y1] = pol(144, 144, r, a1)
    d += (i ? 'L' : 'M') + pt(x0, y0) + `A${f(r * 0.1)} ${f(r * 0.1)} 0 0 1 ${pt(x1, y1)}`
    const [dx, dy] = pol(144, 144, r + 8, (a0 + a1) / 2)
    dots += `<circle cx="${f(dx)}" cy="${f(dy)}" r="1.15" fill="${col}"/>`
  }
  return `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3.2"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.5" opacity="${op}"/>` + `<g opacity="${op}">${dots}</g>`
}

// ───────── PLUMAS en abanico (nacen del círculo en `a0…a1` grados y salen hacia afuera)
export function plumeFan(S, P, { a0, a1, n, r = 118, len = [60, 74], w = 11, style = 'round', swayCls = '', base, tip }) {
  base = base || P.dk(P.d1, 0.62); tip = tip || P.d1
  const grad = S.lin([[0, base], [0.7, P.mix(base, tip, 0.65)], [1, tip]], 0, 1, 0, 0)
  let o = ''
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1)
    const a = a0 + (a1 - a0) * u
    const mid = 1 - Math.abs(u - 0.5) * 2
    const L = len[0] + (len[1] - len[0]) * mid
    const [x, y] = pol(144, 144, r, a)
    o += `<g transform="translate(${pt(x, y)}) rotate(${f(a + 90)})"><g${swayCls ? ` class="${swayCls}" style="animation-delay:${-(i * 0.45).toFixed(2)}s"` : ''}><path d="${featherD(L, w, style, 0.1)}" fill="${grad}" stroke="${P.lt(tip, 0.3)}" stroke-opacity=".55" stroke-width=".9"/><path d="M0 0Q${f(w * 0.1)} ${f(-L * 0.5)} ${f(w * 0.14)} ${f(-L * 0.92)}" stroke="${P.lt(tip, 0.55)}" stroke-opacity=".5" stroke-width=".8" fill="none"/></g></g>`
  }
  return o
}

// destello de cuatro puntas con borde oscuro (firma de la colección)
export const dmStar = (x, y, r, fill, cls = '', dl = 0, stroke = '#1a0a08') =>
  `<path${cls ? ` class="${cls}"` : ''} style="${dl ? `animation-delay:${-dl}s` : ''}" transform="translate(${f(x)} ${f(y)})" d="M0 ${-r}Q${f(r * 0.14)} ${f(-r * 0.14)} ${r} 0Q${f(r * 0.14)} ${f(r * 0.14)} 0 ${r}Q${f(-r * 0.14)} ${f(r * 0.14)} ${-r} 0Q${f(-r * 0.14)} ${f(-r * 0.14)} 0 ${-r}Z" fill="${fill}" stroke="${stroke}" stroke-width="${f(r * 0.2)}" stroke-linejoin="round"/>`

// ───────── versiones «planas» (sin gradientes ni <use>): sirven para teselas de fondo, partículas y canvas
export function marigoldFlat(P, r = 12) {
  const edge = P.dk(P.d1, 0.55)
  const ringOf = (n, rr, pr, fill, off) => { let o = ''; for (let i = 0; i < n; i++) { const [x, y] = pol(0, 0, rr, off + (i * 360) / n); o += `<circle cx="${f(x)}" cy="${f(y)}" r="${pr}" fill="${fill}" stroke="${edge}" stroke-width=".7" stroke-opacity=".8"/>` } return o }
  return `<g transform="scale(${f(r / 12)})"><circle r="12.2" fill="${P.dk(P.d1, 0.6)}"/>${ringOf(13, 8.7, 3.8, P.d1, 0)}${ringOf(10, 5.7, 3.2, P.mix(P.d1, P.d3, 0.3), 18)}${ringOf(7, 3, 2.5, P.mix(P.d1, P.d3, 0.55), 0)}<circle r="1.5" fill="${P.dk(P.d1, 0.25)}"/></g>`
}
// papel picado como UN trazado (agujeros con fill-rule evenodd): para teselas, tarjetas y canvas. Ancho 24, alto ≈ 23.
const cD = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
export function flagD(v) {
  let d = 'M-12 0H12V19Q9 23.4 6 19Q3 23.4 0 19Q-3 23.4 -6 19Q-9 23.4 -12 19Z'
  for (let i = -4; i <= 4; i++) d += cD(i * 2.7, 4.4, 0.78)
  for (let i = -3; i <= 3; i++) d += `M${f(i * 3.4 - 1.1)} 17.6L${f(i * 3.4)} 15.6L${f(i * 3.4 + 1.1)} 17.6Z`
  if (v === 0) d += 'M0 6.2C4.6 6.2 7.4 8.8 7.4 12.2C7.4 14.6 6.4 15.6 5.4 16.4V17.4H-5.4V16.4C-6.4 15.6 -7.4 14.6 -7.4 12.2C-7.4 8.8 -4.6 6.2 0 6.2Z' + cD(-2.8, 11.4, 1.9) + cD(2.8, 11.4, 1.9)
  else if (v === 1) { for (let i = 0; i < 8; i++) { const [x, y] = pol(0, 11.4, 6.1, i * 45); d += `M${f(x - 1.4)} ${f(y)}a1.4 2.6 ${i * 45 + 90} 1 0 2.8 0a1.4 2.6 ${i * 45 + 90} 1 0 -2.8 0Z` } d += cD(0, 11.4, 3.3) + cD(-9.6, 9, 0.8) + cD(9.6, 9, 0.8) }
  else d += 'M0 6.4L3.6 10.6L0 14.8L-3.6 10.6Z' + 'M0 8.6L1.8 10.6L0 12.6L-1.8 10.6Z' + 'M-6.4 7L-5 8.6L-6.4 10.2L-7.8 8.6Z M6.4 7L7.8 8.6L6.4 10.2L5 8.6Z' + cD(-8, 11.2, 1.4) + cD(8, 11.2, 1.4)
  return d
}
export const flagP = (v, color, x = 0, y = 0, s = 1, r = 0, extra = '') => `<path transform="translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''} scale(${f(s)})" d="${flagD(v)}" fill="${color}" fill-rule="evenodd" stroke="#000" stroke-opacity=".28" stroke-width=".5"${extra}/>`
// monarca plana con alas que aletean (para partículas de tarjeta). viewBox -36 -22 72 44
export function monarchFlat(P) {
  const ink = '#160b07'
  const wing = `<path d="M1 1C10 1 23 2 26 8C28 15 20 20 12 17C6 14 2 8 1 3Z" fill="${P.d1}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="M1 -3C4 -15 20 -25 32 -17C37 -12 33 -4 25 -1C17 2 8 2 1 1Z" fill="${P.d1}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="M2 -2L29 -14M2 0L27 -1M2 3L23 10" stroke="${ink}" stroke-width=".95" fill="none"/><circle cx="25" cy="-16.4" r="1.4" fill="#fff"/><circle cx="31" cy="-12" r="1.2" fill="#fff"/><circle cx="24" cy="12.4" r="1" fill="#fff"/>`
  return `<svg viewBox="-36 -24 72 46" style="width:100%;height:auto;display:block;overflow:visible" aria-hidden="true"><g class="dm-wg">${wing}<g transform="scale(-1 1)">${wing}</g></g><ellipse cx="0" cy="3" rx="1.7" ry="9" fill="${ink}"/><circle cy="-7" r="2.3" fill="${ink}"/></svg>`
}
