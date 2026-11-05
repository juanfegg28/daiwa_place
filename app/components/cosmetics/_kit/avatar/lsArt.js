// @ts-nocheck
// COLECCIÓN «LESTAT DE LIONCOURT» (exclusiva) — librería de arte compartida: encaje y gola, candelabros con cera derretida,
// copa de cristal, melena, alas de terciopelo, brocado azul, corona de fleurs-de-lis, colmillos, rosas y destellos.
// Todo original, hecho con código. Estética: siglo XVIII — terciopelo, oro, cera y noche. Nada de sangre explícita (solo gotas estilizadas).
import { f, pol, rng } from '../core/util.js'
import { KF, pal } from '../core/kit.js'
import { featherD, rose } from '../core/svg.js'

const pt = (x, y) => `${f(x)} ${f(y)}`
export const LS_PAL = [
  pal('lioncourt', 'Oro y carmesí', '#E0B14A', '#0B0508', '#FFEFB8', '#B3122E'),
  pal('brocado', 'Brocado azul', '#5C86D6', '#060A18', '#EAF1FF', '#E0B14A'),
  pal('sangre', 'Sangre y marfil', '#C0142E', '#0C0306', '#FFD0D6', '#EFE6D2'),
  pal('marfil', 'Marfil y rosa', '#EFE6D2', '#0A0809', '#FFFFFF', '#B3122E'),
]

// ───────── CSS global de la colección (prefijo ls-)
export const LS_CSS =
  `.ls-fl{transform-box:fill-box;transform-origin:50% 100%;animation:ls-fl 1.7s ease-in-out infinite}${KF('ls-fl', '0%,100%{transform:scale(1,1) rotate(0)}20%{transform:scale(.9,1.12) rotate(-3deg)}45%{transform:scale(1.07,.92) rotate(2.5deg)}70%{transform:scale(.94,1.08) rotate(-1.5deg)}')}` +
  `.ls-gl{transform-box:fill-box;transform-origin:50% 50%;animation:ls-gl 2.6s ease-in-out infinite}${KF('ls-gl', '0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}')}` +
  `.ls-tw{transform-box:fill-box;transform-origin:50% 50%;animation:ls-tw 3.2s ease-in-out infinite}${KF('ls-tw', '0%,100%{transform:scale(.35);opacity:.35}50%{transform:scale(1.1);opacity:1}')}` +
  `.ls-sw{transform-box:fill-box;transform-origin:50% 100%;animation:ls-sw 5.2s ease-in-out infinite alternate}${KF('ls-sw', 'from{transform:rotate(-2.4deg)}to{transform:rotate(2.4deg)}')}` +
  `.ls-sh{transform-box:fill-box;transform-origin:50% 0;animation:ls-sh 6s ease-in-out infinite alternate}${KF('ls-sh', 'from{transform:rotate(-3deg)}to{transform:rotate(3deg)}')}` +
  `.ls-fp{transform-box:view-box;transform-origin:144px 150px;animation:ls-fp 4.8s ease-in-out infinite alternate}${KF('ls-fp', 'from{transform:rotate(-3.5deg) scaleX(.97)}to{transform:rotate(3.5deg) scaleX(1.03)}')}` +
  `.ls-fpr{animation-direction:alternate-reverse}` +
  `.ls-dr{animation:ls-dr 3.6s ease-in infinite}${KF('ls-dr', '0%{transform:translateY(-3px);opacity:0}12%{opacity:1}80%{opacity:1}100%{transform:translateY(34px);opacity:0}')}` +
  `.ls-fa{animation:ls-fa 6s linear infinite}${KF('ls-fa', '0%{transform:translate(0,-6px) rotate(0);opacity:0}12%{opacity:1}100%{transform:translate(18px,66px) rotate(200deg);opacity:0}')}` +
  `.ls-pl{animation:ls-pl 3.6s ease-in-out infinite}${KF('ls-pl', '0%,100%{opacity:.55}50%{opacity:1}')}` +
  `.ls-bob{animation:ls-bob 5s ease-in-out infinite alternate}${KF('ls-bob', 'from{transform:translateY(-2.5px)}to{transform:translateY(2.5px)}')}` +
  `.ls-spin{transform-box:view-box;transform-origin:144px 144px;animation:ls-spin 90s linear infinite}${KF('ls-spin', 'to{transform:rotate(360deg)}')}` +
  `.ls-ray{transform-box:view-box;transform-origin:144px 144px;animation:ls-ray 9s ease-in-out infinite alternate}${KF('ls-ray', 'from{opacity:.55;transform:scale(.97)}to{opacity:1;transform:scale(1.03)}')}` +
  `.ls-sq{animation:ls-sq 2.8s ease-in-out infinite}${KF('ls-sq', '0%,100%{opacity:.2}50%{opacity:1}')}`

// ───────── utilidades de dibujo
export const ring = (r, w, c, op = 1) => `<circle cx="144" cy="144" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"${op !== 1 ? ` opacity="${op}"` : ''}/>`
export const spark = (x, y, r, fill, cls = 'ls-tw', dl = 0, stroke = '#1a0a08') =>
  `<path class="${cls}" style="animation-delay:${-dl}s" transform="translate(${f(x)} ${f(y)})" d="M0 ${-r}Q${f(r * 0.14)} ${f(-r * 0.14)} ${r} 0Q${f(r * 0.14)} ${f(r * 0.14)} 0 ${r}Q${f(-r * 0.14)} ${f(r * 0.14)} ${-r} 0Q${f(-r * 0.14)} ${f(-r * 0.14)} 0 ${-r}Z" fill="${fill}" stroke="${stroke}" stroke-width=".7" stroke-opacity=".7"/>`
// oro bruñido: degradado vertical claro→oscuro
export const goldG = (S, P, k = 0) => S.lin([[0, P.lt(P.d1, 0.55)], [0.45, P.d1], [1, P.dk(P.d1, 0.5 + k)]], 0, 0, 0, 1)

// ───────── llama + vela de cera derretida
export function flame(S, P, x, y, s = 1, d = 0) {
  const gl = S.radB([[0, P.d3, 0.95], [0.35, P.mix(P.d1, '#FFB040', 0.5), 0.5], [1, P.d1, 0]])
  const fl = S.lin([[0, '#FF9A2A'], [0.55, '#FFD27A'], [1, '#FFF6D0']], 0, 1, 0, 0)
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><circle class="ls-gl" style="animation-delay:${-d * 0.7}s" cx="0" cy="-9" r="17" fill="${gl}"/><g class="ls-fl" style="animation-delay:${-d * 0.55}s"><path d="M0 -17C3.6 -11 4.6 -8 4.6 -6C4.6 -3.4 2.5 -2 0 -2C-2.5 -2 -4.6 -3.4 -4.6 -6C-4.6 -8 -3.6 -11 0 -17Z" fill="${fl}" stroke="#7a2a06" stroke-width=".5" stroke-opacity=".5"/><path d="M0 -11C1.6 -8.6 2.1 -7.2 2.1 -6.2C2.1 -4.8 1.1 -4 0 -4C-1.1 -4 -2.1 -4.8 -2.1 -6.2C-2.1 -7.2 -1.6 -8.6 0 -11Z" fill="#fffbe6"/></g></g>`
}
// vela larga (base en 0,0, crece hacia arriba) con chorreras de cera irregulares
export function taper(S, P, { x = 0, y = 0, h = 30, w = 6, d = 0, s = 1, fl = true, drips = [10, 4, 16] } = {}) {
  const wax = S.lin([[0, '#fff6e2'], [0.5, '#efdcbc'], [1, '#b8996e']], 0, 0, 1, 0)
  let o = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="1.4" fill="${wax}" stroke="#3a2418" stroke-width=".9" stroke-opacity=".75"/>`
  // charco de cera arriba + chorreras
  o += `<ellipse cx="0" cy="${-h}" rx="${w / 2 + 0.7}" ry="1.9" fill="#fff8ec" stroke="#3a2418" stroke-width=".6" stroke-opacity=".6"/>`
  drips.forEach((L, i) => {
    const px = -w / 2 + 0.6 + (i * (w - 1.8)) / Math.max(1, drips.length - 1), r = 1 + (i % 2) * 0.4
    o += `<path d="M${f(px - r)} ${-h + 1}V${f(-h + L)}Q${f(px)} ${f(-h + L + r * 2.2)} ${f(px + r)} ${f(-h + L)}V${-h + 1}Z" fill="#fff8ec" stroke="#3a2418" stroke-width=".4" stroke-opacity=".5"/>`
  })
  o += `<path d="M0 ${-h}V${-h - 3.2}" stroke="#241410" stroke-width="1" stroke-linecap="round"/>`
  if (fl) o += flame(S, P, 0, -h - 2.4, 1, d)
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">${o}</g>`
}
// candelabro dorado de 3 brazos (base en 0,0; alto ≈ 74). `lit` = nº de velas
export function candelabra(S, P, { x = 0, y = 0, s = 1, d = 0, arms = 3 } = {}) {
  const G = goldG(S, P)
  let o = `<ellipse cx="0" cy="-2" rx="15" ry="4.6" fill="${G}" stroke="#1a0e04" stroke-width=".9" stroke-opacity=".8"/>`
  o += `<path d="M-6 -4Q-3 -12 -2.6 -24Q-2.4 -32 -1.4 -36H1.4Q2.4 -32 2.6 -24Q3 -12 6 -4Z" fill="${G}" stroke="#1a0e04" stroke-width=".9" stroke-opacity=".8"/>`
  o += `<circle cx="0" cy="-22" r="3.6" fill="${G}" stroke="#1a0e04" stroke-width=".8" stroke-opacity=".8"/><circle cx="0" cy="-33" r="2.6" fill="${G}" stroke="#1a0e04" stroke-width=".7" stroke-opacity=".8"/>`
  const A = arms === 3 ? [-22, 0, 22] : arms === 5 ? [-30, -15, 0, 15, 30] : [0]
  const cx = []
  A.forEach((a, i) => {
    const ax = a, top = a === 0 ? -38 : -36 + Math.abs(a) * 0.1
    if (a !== 0) o += `<path d="M0 -26Q${f(a * 0.55)} -22 ${f(ax)} ${f(top + 4)}" fill="none" stroke="${G}" stroke-width="2.4" stroke-linecap="round"/><path d="M0 -26Q${f(a * 0.55)} -22 ${f(ax)} ${f(top + 4)}" fill="none" stroke="#1a0e04" stroke-opacity=".5" stroke-width=".7"/>`
    o += `<path d="M${f(ax - 5)} ${f(top + 4)}h10l-1.8 4h-6.4Z" fill="${G}" stroke="#1a0e04" stroke-width=".7" stroke-opacity=".8"/>`
    cx.push(taper(S, P, { x: ax, y: top + 4, h: 15 + ((i * 7) % 11), w: 5.2, d: d + i * 0.9, drips: [7 + (i % 3) * 3, 3, 10 - (i % 2) * 3] }))
  })
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">${o}${cx.join('')}</g>`
}

// ───────── gola / jabot de encaje: lóbulos plisados alrededor del avatar
export function ruff(S, P, { r0 = 102, r1 = 132, n = 28, off = 0, bulge = 7, tone = 0, sway = false } = {}) {
  let o = ''
  const w = 360 / n / 2
  for (let i = 0; i < n; i++) {
    const a = off + (i * 360) / n
    const i1 = pol(144, 144, r0, a - w * 0.55), i2 = pol(144, 144, r0, a + w * 0.55)
    const o1 = pol(144, 144, r1, a - w * 0.96), o2 = pol(144, 144, r1, a + w * 0.96)
    const c = pol(144, 144, r1 + bulge, a)
    const shade = i % 2 ? 0.0 : 0.16
    const fill = S.linU([[0, P.dk('#d8cdb4', 0.25 + shade)], [0.55, P.mix('#efe6d2', P.d3, 0.18 + tone)], [1, P.mix('#fffaf0', P.d3, 0.35 + tone)]], i1[0], i1[1], c[0], c[1])
    o += `<path d="M${pt(...i1)}L${pt(...o1)}Q${pt(...c)} ${pt(...o2)}L${pt(...i2)}Z" fill="${fill}" stroke="#2a1a14" stroke-opacity=".38" stroke-width=".8" stroke-linejoin="round"/>`
    // pliegue central
    const m1 = pol(144, 144, r0 + (r1 - r0) * 0.22, a), m2 = pol(144, 144, r1 + bulge * 0.55, a)
    o += `<path d="M${pt(...m1)}L${pt(...m2)}" stroke="#3a2a22" stroke-opacity=".22" stroke-width=".9" fill="none"/>`
  }
  return sway ? `<g class="ls-pl" style="animation-duration:7s">${o}</g>` : o
}
// puntilla fina (borde de encaje con pequeños arcos y perlitas)
export function lace(P, r = 138, n = 48, col, op = 0.95) {
  col = col || P.d3
  let d = '', dots = ''
  for (let i = 0; i < n; i++) {
    const a0 = (i * 360) / n, a1 = ((i + 1) * 360) / n
    const p0 = pol(144, 144, r, a0), p1 = pol(144, 144, r, a1)
    d += (i ? 'L' : 'M') + pt(...p0) + `A${f(r * 0.09)} ${f(r * 0.09)} 0 0 1 ${pt(...p1)}`
    const q = pol(144, 144, r + 4.6, (a0 + a1) / 2)
    dots += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="1.1" fill="${col}"/>`
  }
  return `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="3"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.3" opacity="${op}"/><g opacity="${op}">${dots}</g>`
}

// ───────── gema (rubí/zafiro) facetada
export function gem(S, x, y, r, c, id = 0) {
  const g = S.radB([[0, '#ffffff', 0.9], [0.25, c, 1], [1, '#000000', 0.55]], 0.35, 0.3, 0.8)
  return `<g transform="translate(${f(x)} ${f(y)})"><circle r="${r + 1.6}" fill="#1a0e04" opacity=".7"/><circle r="${r + 0.9}" fill="${'#E0B14A'}" stroke="#4a2c06" stroke-width=".5"/><circle r="${r}" fill="${g}"/><path d="M${-r * 0.55} ${-r * 0.2}L0 ${-r * 0.75}L${r * 0.55} ${-r * 0.2}L0 ${r * 0.7}Z" fill="#fff" opacity=".2"/><circle class="ls-tw" style="animation-delay:${-id}s" cx="${-r * 0.35}" cy="${-r * 0.4}" r="${r * 0.2}" fill="#fff"/></g>`
}

// ───────── flor de lis (centrada en 0,0; ancho ≈ 20)
export function fleur(S, P, s = 1, c) {
  const G = c || goldG(S, P)
  return `<g transform="scale(${s})"><path d="M0 -13C3.4 -9 4.4 -4 0 3C-4.4 -4 -3.4 -9 0 -13Z" fill="${G}" stroke="#2a1604" stroke-width=".6" stroke-opacity=".8"/><path d="M-1.6 0C-6 -3 -10 -8 -8.6 -11.6C-4.6 -10.4 -2.6 -6 -3.2 -2Z" fill="${G}" stroke="#2a1604" stroke-width=".6" stroke-opacity=".8" transform="translate(0 2)"/><path d="M1.6 0C6 -3 10 -8 8.6 -11.6C4.6 -10.4 2.6 -6 3.2 -2Z" fill="${G}" stroke="#2a1604" stroke-width=".6" stroke-opacity=".8" transform="translate(0 2)"/><rect x="-7" y="4.4" width="14" height="2.2" rx="1" fill="${G}" stroke="#2a1604" stroke-width=".5" stroke-opacity=".8"/><path d="M-4 6.6Q0 13 4 6.6Z" fill="${G}" stroke="#2a1604" stroke-width=".5" stroke-opacity=".8"/></g>`
}

// ───────── corona (centrada en 0,0; ancho ≈ 64, alto ≈ 36)
export function crown(S, P, s = 1) {
  const G = goldG(S, P)
  let o = `<path d="M-30 14L-34 -10L-18 2L-9 -16L0 0L9 -16L18 2L34 -10L30 14Z" fill="${G}" stroke="#2a1604" stroke-width="1" stroke-linejoin="round"/>`
  o += `<rect x="-30" y="12" width="60" height="7" rx="2" fill="${G}" stroke="#2a1604" stroke-width="1"/>`
  o += `<path d="M-30 12H30" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>`
  ;[[-34, -12, P.d4], [-9, -18, '#EAF1FF'], [9, -18, '#EAF1FF'], [34, -12, P.d4]].forEach(([x, y, c], i) => (o += `<circle cx="${x}" cy="${y}" r="3.2" fill="${c}" stroke="#2a1604" stroke-width=".8"/>`))
  o += gem(S, 0, 15.5, 3.2, P.d4, 1) + gem(S, -16, 15.5, 2.4, '#3F6FE0', 2) + gem(S, 16, 15.5, 2.4, '#3F6FE0', 3)
  o += `<path d="M-4 -4L0 -12L4 -4L0 2Z" fill="${P.d4}" opacity=".0"/>`
  return `<g transform="scale(${s})">${o}</g>`
}

// ───────── copa de cristal con vino (base en 0,0; alto ≈ 46)
export function goblet(S, P, { x = 0, y = 0, s = 1, rot = 0 } = {}) {
  const gl = S.lin([[0, '#ffffff', 0.55], [0.5, '#cfe0ff', 0.18], [1, '#ffffff', 0.4]], 0, 0, 1, 0)
  const wine = S.lin([[0, P.mix(P.d4, '#ff3a52', 0.2)], [1, P.dk(P.d4, 0.5)]], 0, 0, 0, 1)
  let o = `<ellipse cx="0" cy="0" rx="11" ry="3" fill="${gl}" stroke="#9fb6d8" stroke-width=".8"/><path d="M-1.4 -1V-17H1.4V-1Z" fill="${gl}" stroke="#9fb6d8" stroke-width=".7"/>`
  o += `<path d="M-13 -46C-14 -34 -9 -22 0 -19C9 -22 14 -34 13 -46Z" fill="${gl}" stroke="#b4c8e8" stroke-width="1"/>`
  o += `<path class="ls-pl" style="animation-duration:5s" d="M-12.2 -36C-9 -32 -4 -34 0 -35C4 -36 9 -32 12.2 -36C11 -28 7 -22 0 -19.6C-7 -22 -11 -28 -12.2 -36Z" fill="${wine}"/>`
  o += `<path d="M-9 -44C-10 -34 -7 -26 -3 -22" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
  o += `<ellipse cx="0" cy="-46" rx="13" ry="2.4" fill="none" stroke="#c8d8f0" stroke-width="1"/>`
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">${o}</g>`
}

// ───────── colmillos con gotas estilizadas (centrados en 0,0 hacia abajo; ancho ≈ 44)
export function fangs(S, P, s = 1, drop = true) {
  const t = S.lin([[0, '#fffaf0'], [1, '#e8d9c0']], 0, 0, 0, 1)
  let o = `<path d="M-20 -6Q-10 -9 0 -6Q10 -9 20 -6Q18 0 8 1Q0 3 -8 1Q-18 0 -20 -6Z" fill="${P.mix(P.d4, '#000', 0.2)}" stroke="#2a0a10" stroke-width=".8"/>`
  o += `<path d="M-15 -4C-14.6 4 -13 12 -11.6 17C-10 12 -8 4 -7 -4Z" fill="${t}" stroke="#4a3a2a" stroke-width=".8" stroke-linejoin="round"/>`
  o += `<path d="M7 -4C8 4 10 12 11.6 17C13 12 14.6 4 15 -4Z" fill="${t}" stroke="#4a3a2a" stroke-width=".8" stroke-linejoin="round"/>`
  if (drop) o += `<g class="ls-dr"><path d="M-11.6 18C-9.6 22 -9 24 -9 25.6C-9 27.4 -10.2 28.4 -11.6 28.4C-13 28.4 -14.2 27.4 -14.2 25.6C-14.2 24 -13.6 22 -11.6 18Z" fill="${P.d4}" stroke="#4a0610" stroke-width=".6"/></g><g class="ls-dr" style="animation-delay:-1.8s"><path d="M11.6 18C13.4 21.6 14 23.4 14 24.8C14 26.4 12.9 27.2 11.6 27.2C10.3 27.2 9.2 26.4 9.2 24.8C9.2 23.4 9.8 21.6 11.6 18Z" fill="${P.d4}" stroke="#4a0610" stroke-width=".6"/></g>`
  return `<g transform="scale(${s})">${o}</g>`
}

// ───────── pétalo de rosa roja
export const rosePetal = (c, s = 1) => `<path d="M0 -6C4 -6 6.4 -2.4 5.2 1.4C4.2 4.6 1.8 7 0 7C-1.8 7 -4.2 4.6 -5.2 1.4C-6.4 -2.4 -4 -6 0 -6Z" transform="scale(${s})" fill="${c}"/><path d="M0 -5Q1 0 0 6" transform="scale(${s})" stroke="#000" stroke-opacity=".25" stroke-width=".7" fill="none"/>`
export const petalFall = (x, y, c, dl, s = 1) => `<g transform="translate(${f(x)} ${f(y)})"><g class="ls-fa" style="animation-delay:${-dl}s">${rosePetal(c, s)}</g></g>`

// ───────── mechón dorado afilado (ondulado en S, ancho en la raíz y fino en la punta). Nace en (0,0) y crece hacia -y
export function curl(S, P, { L = 70, w = 9, dir = 1, k = 1, light = 0 } = {}) {
  const A = L * 0.3 * k * dir
  const p0 = [0, 0], p1 = [A, -L * 0.3], p2 = [-A * 0.9, -L * 0.66], p3 = [A * 0.35, -L]
  const bz = (t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]] }
  const N = 14, L1 = [], L2 = [], C = []
  for (let i = 0; i <= N; i++) {
    const t = i / N, [x, y] = bz(t), [x2, y2] = bz(Math.min(1, t + 0.02)), [x1, y1] = bz(Math.max(0, t - 0.02))
    let dx = x2 - x1, dy = y2 - y1; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m
    const ww = (w / 2) * Math.pow(1 - t, 0.8) * (0.55 + 0.45 * Math.min(1, t * 6)) + 0.25
    L1.push([x - dy * ww, y + dx * ww]); L2.push([x + dy * ww, y - dx * ww]); C.push([x, y])
  }
  const d = 'M' + L1.map((q) => pt(q[0], q[1])).join('L') + 'L' + L2.reverse().map((q) => pt(q[0], q[1])).join('L') + 'Z'
  const gr = S.lin([[0, P.dk(P.d1, 0.55 - light)], [0.5, P.d1], [1, P.lt(P.d1, 0.5 + light)]], 0, 1, 0, 0)
  const hl = 'M' + C.slice(2, 11).map((q) => pt(q[0] - w * 0.14, q[1])).join('L')
  return `<path d="${d}" fill="${gr}" stroke="#2a1604" stroke-opacity=".65" stroke-width=".9" stroke-linejoin="round"/><path d="${hl}" fill="none" stroke="${P.lt(P.d1, 0.78)}" stroke-opacity=".75" stroke-width="${f(Math.max(0.8, w * 0.16))}" stroke-linecap="round" stroke-linejoin="round"/>`
}

// ───────── ala de terciopelo (murciélago) con falanges doradas y borde festoneado. Ala DERECHA saliendo de (0,0); y<0 = arriba
export function wing(S, P, { L = 190, H = 150 } = {}) {
  const vel = S.linU([[0, P.dk(P.d4, 0.55)], [0.5, P.d4], [1, P.mix(P.d4, '#000', 0.45)]], 0, 0, L, -H)
  const W = [L * 0.42, -H * 0.8]
  const T = [[L, -H * 0.86], [L * 1.0, -H * 0.22], [L * 0.78, H * 0.2], [L * 0.46, H * 0.38]]
  const B = [L * 0.1, H * 0.34]
  let d = `M0 0Q${f(L * 0.16)} ${f(-H * 0.7)} ${f(W[0])} ${f(W[1])}Q${f(L * 0.7)} ${f(-H * 1.08)} ${f(T[0][0])} ${f(T[0][1])}`
  for (let i = 0; i < T.length - 1; i++) { const a = T[i], b = T[i + 1], mx = (a[0] + b[0]) / 2 - L * 0.1, my = (a[1] + b[1]) / 2 - H * 0.04; d += `Q${f(mx)} ${f(my)} ${f(b[0])} ${f(b[1])}` }
  d += `Q${f(L * 0.22)} ${f(H * 0.24)} ${f(B[0])} ${f(B[1])}Q${f(-L * 0.02)} ${f(H * 0.12)} 0 0Z`
  let o = `<path d="${d}" fill="${vel}" stroke="#12020a" stroke-width="1.8" stroke-linejoin="round"/>`
  // brillo de terciopelo (pliegues)
  T.forEach(([x, y]) => (o += `<path d="M${f(W[0])} ${f(W[1])}L${f(x)} ${f(y)}" stroke="#000" stroke-opacity=".28" stroke-width="9" stroke-linecap="round"/>`))
  const G = goldG(S, P)
  const bone = (x, y, w1) => `<path d="M${f(W[0])} ${f(W[1])}L${f(x)} ${f(y)}" fill="none" stroke="#12020a" stroke-opacity=".75" stroke-width="${w1 + 2.2}" stroke-linecap="round"/><path d="M${f(W[0])} ${f(W[1])}L${f(x)} ${f(y)}" fill="none" stroke="${G}" stroke-width="${w1}" stroke-linecap="round"/>`
  T.forEach(([x, y], i) => (o += bone(x, y, 2.6 - i * 0.15)))
  o += `<path d="M0 0Q${f(L * 0.16)} ${f(-H * 0.7)} ${f(W[0])} ${f(W[1])}" fill="none" stroke="#12020a" stroke-opacity=".75" stroke-width="8" stroke-linecap="round"/><path d="M0 0Q${f(L * 0.16)} ${f(-H * 0.7)} ${f(W[0])} ${f(W[1])}" fill="none" stroke="${G}" stroke-width="5.4" stroke-linecap="round"/>`
  o += `<circle cx="${f(W[0])}" cy="${f(W[1])}" r="5.4" fill="${P.d3}" stroke="#2a1604" stroke-width="1"/>`
  T.forEach(([x, y]) => (o += `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="${P.d3}" stroke="#2a1604" stroke-width=".7"/>`))
  return o
}

// ───────── brocado: una enredadera de oro (flor + hojas + perlitas) que se repite en un anillo
export function brocadeRing(S, P, { r = 124, n = 20, flower = '#E0B14A', leaf = '#C9972F', pearl = '#fff6dc', rot = 0 } = {}) {
  let o = ''
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 360) / n, b = a + 180 / n
    const [x, y] = pol(144, 144, r, a)
    const [x2, y2] = pol(144, 144, r, b)
    o += `<g transform="translate(${pt(x, y)}) rotate(${f(a + 90)})">`
    o += [0, 72, 144, 216, 288].map((q) => `<path transform="rotate(${q})" d="M0 0C-3 -3 -3.4 -6.4 0 -8.6C3.4 -6.4 3 -3 0 0Z" fill="${flower}" stroke="#4a3006" stroke-width=".4" stroke-opacity=".7"/>`).join('')
    o += `<circle r="1.7" fill="${pearl}" stroke="#4a3006" stroke-width=".4"/></g>`
    o += `<g transform="translate(${pt(x2, y2)}) rotate(${f(b + 90)})"><path d="M-6 0C-5 -4 -1.6 -6 0 -8C1.6 -6 5 -4 6 0C3 -1 -3 -1 -6 0Z" fill="${leaf}" stroke="#4a3006" stroke-width=".4" stroke-opacity=".7"/><circle cy="3.4" r="1.2" fill="${pearl}"/></g>`
  }
  return o
}

// ───────── venas finas de porcelana agrietada (se dibujan sobre el borde de la foto)
export function veins(P, { seed = 4, n = 14, r0 = 111, len = 26, col, op = 0.8, w = 1 } = {}) {
  const R = rng(seed)
  col = col || P.d4
  let o = ''
  for (let i = 0; i < n; i++) {
    const a = (i * 360) / n + R() * 14
    let [x, y] = pol(144, 144, r0 + 1, a)
    let ang = a + 180 + (R() - 0.5) * 24
    let d = `M${pt(x, y)}`
    const segs = 3 + Math.floor(R() * 3)
    for (let k = 0; k < segs; k++) {
      ang += (R() - 0.5) * 70
      const l = (len / segs) * (0.7 + R() * 0.7)
      const nx = x + Math.cos((ang * Math.PI) / 180) * l, ny = y + Math.sin((ang * Math.PI) / 180) * l
      d += `L${pt(nx, ny)}`
      if (R() < 0.45) { const bx = nx + Math.cos(((ang + 60) * Math.PI) / 180) * l * 0.6, by = ny + Math.sin(((ang + 60) * Math.PI) / 180) * l * 0.6; d += `M${pt(nx, ny)}L${pt(bx, by)}M${pt(nx, ny)}` }
      x = nx; y = ny
    }
    o += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`
  }
  return o
}
export { rose, featherD, pol, f, rng }
