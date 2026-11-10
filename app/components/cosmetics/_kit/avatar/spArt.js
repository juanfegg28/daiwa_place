// @ts-nocheck
// MIEMBROS (Círculo Lunar) — librería de arte: materiales metálicos, brillos, destellos, perlas, cristal, satén y más.
// Lienzo 288, avatar r=111 en (144,144). Todo original, hecho con código. Clases CSS propias con prefijo sp-.
import { f, pol, rng } from '../core/util.js'
import { KF } from '../core/kit.js'

const pt = (x, y) => `${f(x)} ${f(y)}`
const DARK = '#1a0e04'

// ───────── CSS propio (prefijo sp-)
export const SP_CSS =
  `.sp-fa{transform-box:fill-box;transform-origin:var(--ox,100%) var(--oy,50%);animation:sp-fa var(--d,5s) ease-in-out infinite alternate}${KF('sp-fa', 'from{transform:rotate(calc(var(--r,5deg)*-1))}to{transform:rotate(var(--r,5deg))}')}` +
  `.sp-fb{transform-box:fill-box;transform-origin:var(--ox,50%) var(--oy,50%);animation:sp-fb var(--d,6s) ease-in-out infinite alternate}${KF('sp-fb', 'from{transform:scale(1,.9)}to{transform:scale(1,1.06)}')}` +
  `.sp-sw{transform-box:fill-box;transform-origin:50% 0;animation:sp-sw var(--d,4s) ease-in-out infinite alternate}${KF('sp-sw', 'from{transform:rotate(-5deg) skewX(-3deg)}to{transform:rotate(5deg) skewX(3deg)}')}` +
  `.sp-bob{animation:sp-bob var(--d,5s) ease-in-out infinite alternate}${KF('sp-bob', 'from{transform:translateY(-4px)}to{transform:translateY(5px)}')}` +
  `.sp-fall{animation:sp-fall var(--d,9s) linear infinite}${KF('sp-fall', '0%{transform:translate(0,-14px) rotate(0);opacity:0}12%{opacity:1}88%{opacity:.9}100%{transform:translate(var(--dx,24px),90px) rotate(260deg);opacity:0}')}` +
  `.sp-run{stroke-dasharray:34 166;animation:sp-run 6s linear infinite}${KF('sp-run', 'to{stroke-dashoffset:-200}')}` +
  `.sp-rise{animation:sp-rise var(--d,6s) ease-in infinite}${KF('sp-rise', '0%{transform:translate(0,0) scale(.5);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx,6px),-60px) scale(1.1);opacity:0}')}` +
  `.sp-sh{animation:sp-sh2 6.5s ease-in-out infinite}${KF('sp-sh2', '0%{transform:translateX(-170px) skewX(-18deg)}40%,100%{transform:translateX(190px) skewX(-18deg)}')}` +
  `.sp-bobb{animation:sp-bobb 3.6s ease-in-out infinite alternate}${KF('sp-bobb', 'from{transform:translate(-3px,2px)}to{transform:translate(3px,-3px)}')}` +
  `.sp-ra{transform-box:view-box;transform-origin:144px 144px;animation:sp-ra 170s linear infinite}${KF('sp-ra', 'to{transform:rotate(360deg)}')}` +
  `.sp-rb{transform-box:view-box;transform-origin:144px 144px;animation:sp-rb 120s linear infinite}${KF('sp-rb', 'to{transform:rotate(-360deg)}')}` +
  `.sp-rc{transform-box:view-box;transform-origin:144px 144px;animation:sp-ra 46s linear infinite}` +
  `.sp-rd{transform-box:view-box;transform-origin:144px 144px;animation:sp-rb 64s linear infinite}` +
  `.sp-pu{transform-box:fill-box;transform-origin:50% 50%;animation:sp-pu 3.8s ease-in-out infinite}${KF('sp-pu', '0%,100%{transform:scale(.78);opacity:.7}50%{transform:scale(1.12);opacity:1}')}` +
  `.sp-tw{transform-box:fill-box;transform-origin:50% 50%;animation:sp-tw 3.4s ease-in-out infinite}${KF('sp-tw', '0%,100%{transform:scale(.3) rotate(0);opacity:.2}50%{transform:scale(1.1) rotate(45deg);opacity:1}')}` +
  `.sp-wf{transform-box:view-box;transform-origin:50px 134px;animation:sp-wf 4.6s ease-in-out infinite alternate}${KF('sp-wf', 'from{transform:rotate(-7deg)}to{transform:rotate(5deg)}')}` +
  `.sp-wg{animation:sp-wg 5.2s ease-in-out infinite}${KF('sp-wg', '0%,100%{opacity:.5}50%{opacity:.95}')}` +
  `.sp-bw{transform-box:fill-box;transform-origin:50% 60%;animation:sp-bw .42s ease-in-out infinite alternate}${KF('sp-bw', 'from{transform:scaleY(1)}to{transform:scaleY(.4)}')}` +
  `.sp-sh{animation:sp-sh 7s ease-in-out infinite}${KF('sp-sh', '0%{transform:translateX(-190px)}38%,100%{transform:translateX(190px)}')}` +
  `.sp-fw{stroke-dasharray:26 74;animation:sp-fw 5s linear infinite}${KF('sp-fw', 'to{stroke-dashoffset:-100}')}` +
  `.sp-dp{animation:sp-dp 3.4s ease-in infinite}${KF('sp-dp', '0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(2px) scale(1)}85%{opacity:1}100%{transform:translateY(40px) scale(.9);opacity:0}')}` +
  `.sp-pt{animation:sp-pt 7s linear infinite}${KF('sp-pt', '0%{transform:translate(0,-8px) rotate(0);opacity:0}12%{opacity:1}100%{transform:translate(22px,76px) rotate(220deg);opacity:0}')}` +
  `.sp-bb{animation:sp-bb 5s ease-in-out infinite alternate}${KF('sp-bb', 'from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}')}` +
  `.sp-fl{transform-box:fill-box;transform-origin:50% 100%;animation:sp-fl 1.9s ease-in-out infinite}${KF('sp-fl', '0%,100%{transform:scale(1,1) rotate(0)}22%{transform:scale(.88,1.14) rotate(-3deg)}48%{transform:scale(1.06,.93) rotate(2deg)}74%{transform:scale(.94,1.1) rotate(-1.4deg)}')}`

// ───────── materiales
/** Oro metálico: degradado diagonal con brillo especular y zonas profundas (se ve a metal, no a color plano) */
export const metal = (S, P, { c, x1 = 36, y1 = 28, x2 = 252, y2 = 262 } = {}) => {
  c = c || P.d1
  return S.linU([[0, P.lt(c, 0.82)], [0.2, P.lt(c, 0.3)], [0.42, P.dk(c, 0.28)], [0.6, P.lt(c, 0.45)], [0.8, P.dk(c, 0.42)], [1, P.dk(c, 0.7)]], x1, y1, x2, y2)
}
/** Oro metálico en unidades de la caja del elemento (para piezas dentro de grupos trasladados/rotados) */
export const metalB = (S, P, c) => {
  c = c || P.d1
  return S.lin([[0, P.lt(c, 0.82)], [0.2, P.lt(c, 0.3)], [0.42, P.dk(c, 0.28)], [0.6, P.lt(c, 0.45)], [0.8, P.dk(c, 0.42)], [1, P.dk(c, 0.7)]], 0, 0, 1, 1)
}
/** Forma de oro grabado: relleno metálico + contorno oscuro + hilo de luz interior */
export const eng = (d, fill, { sw = 0.9, hl = 0.32, op = 1 } = {}) =>
  `<path d="${d}" fill="${fill}" stroke="${DARK}" stroke-width="${sw}" stroke-linejoin="round" stroke-opacity=".85" opacity="${op}"/><path d="${d}" fill="none" stroke="#fff" stroke-width=".5" stroke-opacity="${hl}" stroke-linejoin="round" transform="translate(-.35 -.35)"/>`
/** Anillo de oro biselado (oscuro por fuera, brillo en medio, hilo claro dentro) */
export const bevel = (S, P, r = 112, w = 3.6) =>
  `<circle cx="144" cy="144" r="${f(r + w / 2 + 0.6)}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.6"/><circle cx="144" cy="144" r="${r}" fill="none" stroke="${metal(S, P)}" stroke-width="${w}"/><circle cx="144" cy="144" r="${f(r - w / 2 + 0.3)}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".6"/><circle cx="144" cy="144" r="${f(r + w / 2 - 0.3)}" fill="none" stroke="${DARK}" stroke-opacity=".6" stroke-width=".6"/>`
/** Resplandor suave detrás del avatar (pico entre r0 y r1, en px) */
export const bloom = (S, c, op = 0.5, r0 = 100, r1 = 124, R = 190) =>
  `<circle cx="144" cy="144" r="${R}" fill="${S.rad([[Math.max(0, (r0 - 14) / R), c, 0], [r1 / R, c, op], [1, c, 0]], 144, 144, R)}"/>`

// ───────── destello de 4 puntas (lente) con rayas finas
export function flare(S, P, x, y, L = 26, { c, cls = 'sp-pu', streak = true } = {}) {
  c = c || P.d3
  const k = L * 0.1
  const star = `M${pt(x, y - L)}Q${pt(x + k, y - k)} ${pt(x + L * 0.62, y)}Q${pt(x + k, y + k)} ${pt(x, y + L)}Q${pt(x - k, y + k)} ${pt(x - L * 0.62, y)}Q${pt(x - k, y - k)} ${pt(x, y - L)}Z`
  let o = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(L * 0.95)}" fill="${S.rad([[0, '#fff', 0.85], [0.3, c, 0.45], [1, c, 0]], x, y, L * 0.95)}" class="${cls}"/>`
  if (streak) o += `<path d="M${pt(x - L * 1.5, y)}L${pt(x + L * 1.5, y)}" stroke="${S.linU([[0, c, 0], [0.5, '#fff', 0.9], [1, c, 0]], x - L * 1.5, y, x + L * 1.5, y)}" stroke-width="1.1" stroke-linecap="round"/>`
  return o + `<path d="${star}" fill="#fff" class="${cls}" style="animation-delay:-.6s"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(L * 0.12)}" fill="#fff"/>`
}
/** Destellito de 4 puntas que titila */
export const twink = (x, y, r, c, dl = 0, cls = 'sp-tw') => {
  const k = r * 0.18
  return `<path class="${cls}" style="animation-delay:${-dl}s" d="M${pt(x, y - r)}Q${pt(x + k, y - k)} ${pt(x + r, y)}Q${pt(x + k, y + k)} ${pt(x, y + r)}Q${pt(x - k, y + k)} ${pt(x - r, y)}Q${pt(x - k, y - k)} ${pt(x, y - r)}Z" fill="${c}"/>`
}

// ───────── polvo dorado orbitando (círculos pequeños en 2 anillos)
export function dust(P, { n = 16, r0 = 120, r1 = 150, seed = 3, c, size = [0.8, 2.1] } = {}) {
  const R = rng(seed)
  let o = ''
  for (let i = 0; i < n; i++) {
    const a = R() * 360, r = r0 + R() * (r1 - r0), [x, y] = pol(144, 144, r, a), s = size[0] + R() * (size[1] - size[0])
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${c || P.d3}" opacity="${f(0.45 + R() * 0.5)}" class="sp-tw" style="animation-delay:${-R() * 3}s"/>`
  }
  return o
}

// ───────── rayos de sol que se desvanecen hacia afuera (una sola radial para todos)
export function sunRays(S, P, { n = 36, r0 = 113, long = 46, short = 24, w = 3.4, off = 0, c0, c1, op = 1, seed = 1 } = {}) {
  const R = rng(seed)
  const g = S.rad([[r0 / (r0 + long + 6), c0 || P.lt(P.d1, 0.6), 1], [1, c1 || P.d1, 0]], 144, 144, r0 + long + 6)
  let o = ''
  for (let i = 0; i < n; i++) {
    const a = off + (i * 360) / n, L = (i % 2 ? short : long) * (0.86 + R() * 0.28)
    const b0 = pol(144, 144, r0, a - w), b1 = pol(144, 144, r0, a + w), t = pol(144, 144, r0 + L, a)
    o += `<path d="M${pt(...b0)}L${pt(...t)}L${pt(...b1)}Z" fill="${g}" opacity="${op}"/>`
  }
  return o
}

// ───────── gema facetada con engaste y reflejo
export function jewel(S, x, y, r, c, { bezel = '#E0B14A', rot = 0 } = {}) {
  const g = S.radB([[0, '#fff', 0.95], [0.22, c, 1], [0.8, c, 1], [1, '#000', 0.5]], 0.34, 0.3, 0.85)
  return `<g transform="translate(${pt(x, y)}) rotate(${rot})"><circle r="${f(r + 1.7)}" fill="#000" opacity=".5"/><circle r="${f(r + 1)}" fill="${bezel}" stroke="${DARK}" stroke-width=".6"/><circle r="${f(r)}" fill="${g}" stroke="#000" stroke-opacity=".5" stroke-width=".5"/><path d="M${f(-r * 0.7)} ${f(-r * 0.1)}L0 ${f(-r * 0.78)}L${f(r * 0.7)} ${f(-r * 0.1)}L0 ${f(r * 0.8)}Z" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".5"/><ellipse cx="${f(-r * 0.32)}" cy="${f(-r * 0.4)}" rx="${f(r * 0.3)}" ry="${f(r * 0.17)}" fill="#fff" opacity=".8" transform="rotate(-30 ${f(-r * 0.32)} ${f(-r * 0.4)})"/></g>`
}
/** Gema en gota (colgante) con argolla */
export function drop(S, P, x, y, s = 1, c) {
  c = c || P.d4
  const g = S.radB([[0, '#fff', 0.9], [0.25, P.lt(c, 0.3), 1], [0.7, c, 1], [1, P.dk(c, 0.7), 1]], 0.36, 0.34, 0.9)
  const d = 'M0 -13C6 -7 11 0 11 6C11 14 6 19 0 19C-6 19 -11 14 -11 6C-11 0 -6 -7 0 -13Z'
  return `<g transform="translate(${pt(x, y)}) scale(${s})"><path d="M-3.6 -13Q0 -22 3.6 -13Q0 -10 -3.6 -13Z" fill="none" stroke="${metalB(S, P)}" stroke-width="2.2"/><path d="${d}" transform="translate(0 -2)" fill="${metalB(S, P)}" stroke="${DARK}" stroke-width=".8"/><path d="${d}" transform="translate(0 -2) scale(.8)" fill="${g}" stroke="#000" stroke-opacity=".55" stroke-width=".6"/><path d="M-4.4 3L0 -5L4.4 3L0 12Z" transform="translate(0 -2)" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".5"/><ellipse cx="-3.4" cy="-3.4" rx="2.4" ry="1.4" fill="#fff" opacity=".85" transform="rotate(-35 -3.4 -3.4)"/></g>`
}


// ───────── trazados
/** Arco de círculo (a0→a1 en grados, 0°=derecha, −90=arriba, sentido horario) */
export const arc = (cx, cy, r, a0, a1, mv = true) => {
  const [x0, y0] = pol(cx, cy, r, a0), [x1, y1] = pol(cx, cy, r, a1)
  return `${mv ? 'M' + pt(x0, y0) : ''}A${f(r)} ${f(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${pt(x1, y1)}`
}
/** Fase lunar t∈[0,1): 0 nueva, .25 cuarto creciente, .5 llena, .75 cuarto menguante. Centrada en 0,0 radio r. Devuelve el área ILUMINADA. */
export const moonPhase = (r, t) => {
  const phi = t * Math.PI * 2, rx = Math.abs(Math.cos(phi)) * r, waxing = Math.sin(phi) >= 0
  const d = `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${f(rx)} ${r} 0 0 ${Math.cos(phi) >= 0 ? 0 : 1} 0 ${-r}Z`
  return waxing ? d : d.replace(/^M0 ([-\d.]+)A/, 'M0 $1A') // se espeja con scale(-1,1) al dibujar
}
// ───────── materiales nuevos
/** Degradado de perla (una sola vez por capa; se usa con circle) */
export const pearlGrad = (S, c = '#fff4f0') => S.radB([[0, '#fff', 1], [0.35, c, 1], [0.82, c === '#fff' ? '#d8d0d8' : c, 1], [1, '#00000066', 1]], 0.36, 0.32, 0.8)
/** Perla con degradado ya creado */
export const pearlG = (g, x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${g}" stroke="#00000030" stroke-width=".35"/><circle cx="${f(x - r * 0.34)}" cy="${f(y - r * 0.38)}" r="${f(r * 0.24)}" fill="#fff" opacity=".9"/>`
/** Perla con reflejo (radial en caja) */
export const pearl = (S, x, y, r, c = '#fff4f0') =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${S.radB([[0, '#fff', 1], [0.35, c, 1], [0.8, c === '#fff' ? '#d8d0d8' : c, 1], [1, '#00000066', 1]], 0.36, 0.32, 0.8)}" stroke="#00000030" stroke-width=".35"/><circle cx="${f(x - r * 0.34)}" cy="${f(y - r * 0.38)}" r="${f(r * 0.24)}" fill="#fff" opacity=".9"/>`
/** Cristal translúcido con facetas y filo de luz (relleno en caja) */
export const crystal = (S, P, c, { a = 0.78 } = {}) =>
  S.lin([[0, '#fff', 0.95 * a], [0.3, P.lt(c, 0.55), 0.62 * a], [0.62, c, 0.74 * a], [1, P.dk(c, 0.45), 0.86 * a]], 0, 0, 1, 1)
/** Satén: degradado con brillo que recorre la tela (en caja) */
export const satin = (S, P, c) => S.lin([[0, P.dk(c, 0.5)], [0.22, c], [0.4, P.lt(c, 0.5)], [0.55, c], [0.8, P.dk(c, 0.45)], [1, P.dk(c, 0.7)]], 0, 0, 1, 1)
/** Aro de brillo suave (halo) en una elipse */
export const glowRing = (S, c, cx, cy, rx, ry, w = 5, op = 0.8) =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${c}" stroke-opacity="${op * 0.28}" stroke-width="${f(w * 3)}"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${c}" stroke-opacity="${op}" stroke-width="${f(w * 0.5)}"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#fff" stroke-opacity="${op * 0.9}" stroke-width=".7"/>`
/** Marcas finas alrededor de un círculo */
export function ticks(c, cx, cy, r, n, len, { w = 0.8, op = 0.8, every = 0, long = 0, a0 = 0 } = {}) {
  let o = ''
  for (let i = 0; i < n; i++) {
    const a = a0 + (i * 360) / n, L = every && i % every === 0 ? long || len * 1.7 : len, [x0, y0] = pol(cx, cy, r, a), [x1, y1] = pol(cx, cy, r + L, a)
    o += `M${pt(x0, y0)}L${pt(x1, y1)}`
  }
  return `<path d="${o}" stroke="${c}" stroke-width="${w}" stroke-opacity="${op}" fill="none" stroke-linecap="round"/>`
}
/** Flor/estrella de pétalos: n pétalos puntiagudos alrededor de 0,0 */
export const petals = (n, L, w, fill, stroke, { rot = 0, sw = 0.5, curve = 0.5 } = {}) => {
  let o = ''
  for (let i = 0; i < n; i++) o += `<path transform="rotate(${f(rot + (i * 360) / n)})" d="M0 0C${f(-w)} ${f(-L * curve)} ${f(-w * 0.6)} ${f(-L * 0.85)} 0 ${f(-L)}C${f(w * 0.6)} ${f(-L * 0.85)} ${f(w)} ${f(-L * curve)} 0 0Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`
  return o
}
/** Gotita de luz (corazón de brillo) */
export const spark = (x, y, r, c, dl = 0) => twink(x, y, r, c, dl)
/** Luciérnaga/orbe: núcleo + halo que pulsa */
export const orb = (S, x, y, r, c, dl = 0) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3.2)}" fill="${S.rad([[0, c, 0.7], [0.4, c, 0.22], [1, c, 0]], x, y, r * 3.2)}" class="sp-pu" style="animation-delay:${-dl}s"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff"/>`
