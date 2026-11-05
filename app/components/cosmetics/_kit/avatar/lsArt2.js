// @ts-nocheck
// LESTAT — librería 2 (rediseño mítico): materiales de oro grabado, rayos que se desvanecen, destellos de 4 puntas,
// alas de terciopelo con falanges, corona real, espejo rococó, enredadera de espinas, cinta de sangre, murciélagos.
// Lienzo 288, avatar r=111 en (144,144). Todo original, hecho con código.
import { f, pol, rng } from '../core/util.js'
import { KF } from '../core/kit.js'

const pt = (x, y) => `${f(x)} ${f(y)}`
const DARK = '#1a0e04'

// ───────── CSS propio (prefijo ls2-)
export const LS2_CSS =
  `.ls2-bobb{animation:ls2-bobb 3.6s ease-in-out infinite alternate}${KF('ls2-bobb', 'from{transform:translate(-3px,2px)}to{transform:translate(3px,-3px)}')}` +
  `.ls2-ra{transform-box:view-box;transform-origin:144px 144px;animation:ls2-ra 170s linear infinite}${KF('ls2-ra', 'to{transform:rotate(360deg)}')}` +
  `.ls2-rb{transform-box:view-box;transform-origin:144px 144px;animation:ls2-rb 120s linear infinite}${KF('ls2-rb', 'to{transform:rotate(-360deg)}')}` +
  `.ls2-rc{transform-box:view-box;transform-origin:144px 144px;animation:ls2-ra 46s linear infinite}` +
  `.ls2-rd{transform-box:view-box;transform-origin:144px 144px;animation:ls2-rb 64s linear infinite}` +
  `.ls2-pu{transform-box:fill-box;transform-origin:50% 50%;animation:ls2-pu 3.8s ease-in-out infinite}${KF('ls2-pu', '0%,100%{transform:scale(.78);opacity:.7}50%{transform:scale(1.12);opacity:1}')}` +
  `.ls2-tw{transform-box:fill-box;transform-origin:50% 50%;animation:ls2-tw 3.4s ease-in-out infinite}${KF('ls2-tw', '0%,100%{transform:scale(.3) rotate(0);opacity:.2}50%{transform:scale(1.1) rotate(45deg);opacity:1}')}` +
  `.ls2-wf{transform-box:view-box;transform-origin:50px 134px;animation:ls2-wf 4.6s ease-in-out infinite alternate}${KF('ls2-wf', 'from{transform:rotate(-7deg)}to{transform:rotate(5deg)}')}` +
  `.ls2-wg{animation:ls2-wg 5.2s ease-in-out infinite}${KF('ls2-wg', '0%,100%{opacity:.5}50%{opacity:.95}')}` +
  `.ls2-bw{transform-box:fill-box;transform-origin:50% 60%;animation:ls2-bw .42s ease-in-out infinite alternate}${KF('ls2-bw', 'from{transform:scaleY(1)}to{transform:scaleY(.4)}')}` +
  `.ls2-sh{animation:ls2-sh 7s ease-in-out infinite}${KF('ls2-sh', '0%{transform:translateX(-190px)}38%,100%{transform:translateX(190px)}')}` +
  `.ls2-fw{stroke-dasharray:26 74;animation:ls2-fw 5s linear infinite}${KF('ls2-fw', 'to{stroke-dashoffset:-100}')}` +
  `.ls2-dp{animation:ls2-dp 3.4s ease-in infinite}${KF('ls2-dp', '0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(2px) scale(1)}85%{opacity:1}100%{transform:translateY(40px) scale(.9);opacity:0}')}` +
  `.ls2-pt{animation:ls2-pt 7s linear infinite}${KF('ls2-pt', '0%{transform:translate(0,-8px) rotate(0);opacity:0}12%{opacity:1}100%{transform:translate(22px,76px) rotate(220deg);opacity:0}')}` +
  `.ls2-bb{animation:ls2-bb 5s ease-in-out infinite alternate}${KF('ls2-bb', 'from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}')}` +
  `.ls2-fl{transform-box:fill-box;transform-origin:50% 100%;animation:ls2-fl 1.9s ease-in-out infinite}${KF('ls2-fl', '0%,100%{transform:scale(1,1) rotate(0)}22%{transform:scale(.88,1.14) rotate(-3deg)}48%{transform:scale(1.06,.93) rotate(2deg)}74%{transform:scale(.94,1.1) rotate(-1.4deg)}')}`

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
export function flare(S, P, x, y, L = 26, { c, cls = 'ls2-pu', streak = true } = {}) {
  c = c || P.d3
  const k = L * 0.1
  const star = `M${pt(x, y - L)}Q${pt(x + k, y - k)} ${pt(x + L * 0.62, y)}Q${pt(x + k, y + k)} ${pt(x, y + L)}Q${pt(x - k, y + k)} ${pt(x - L * 0.62, y)}Q${pt(x - k, y - k)} ${pt(x, y - L)}Z`
  let o = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(L * 0.95)}" fill="${S.rad([[0, '#fff', 0.85], [0.3, c, 0.45], [1, c, 0]], x, y, L * 0.95)}" class="${cls}"/>`
  if (streak) o += `<path d="M${pt(x - L * 1.5, y)}L${pt(x + L * 1.5, y)}" stroke="${S.linU([[0, c, 0], [0.5, '#fff', 0.9], [1, c, 0]], x - L * 1.5, y, x + L * 1.5, y)}" stroke-width="1.1" stroke-linecap="round"/>`
  return o + `<path d="${star}" fill="#fff" class="${cls}" style="animation-delay:-.6s"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(L * 0.12)}" fill="#fff"/>`
}
/** Destellito de 4 puntas que titila */
export const twink = (x, y, r, c, dl = 0, cls = 'ls2-tw') => {
  const k = r * 0.18
  return `<path class="${cls}" style="animation-delay:${-dl}s" d="M${pt(x, y - r)}Q${pt(x + k, y - k)} ${pt(x + r, y)}Q${pt(x + k, y + k)} ${pt(x, y + r)}Q${pt(x - k, y + k)} ${pt(x - r, y)}Q${pt(x - k, y - k)} ${pt(x, y - r)}Z" fill="${c}"/>`
}

// ───────── polvo dorado orbitando (círculos pequeños en 2 anillos)
export function dust(P, { n = 16, r0 = 120, r1 = 150, seed = 3, c, size = [0.8, 2.1] } = {}) {
  const R = rng(seed)
  let o = ''
  for (let i = 0; i < n; i++) {
    const a = R() * 360, r = r0 + R() * (r1 - r0), [x, y] = pol(144, 144, r, a), s = size[0] + R() * (size[1] - size[0])
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${c || P.d3}" opacity="${f(0.45 + R() * 0.5)}" class="ls2-tw" style="animation-delay:${-R() * 3}s"/>`
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

// ───────── murciélago (centrado en 0,0, apunta hacia arriba: alas a los lados). w = clase de aleteo
export function bat(c, s = 1, d = 0, edge) {
  const wing = (m) => `<g transform="scale(${m} 1)"><path d="M0 -1C-3 -5 -7 -12 -17 -10C-12 -7 -14 -3 -21 1C-14 0 -11 4 -8 8C-6 4 -3 5 0 9" fill="${c}" ${edge ? `stroke="${edge}" stroke-width=".7"` : ''} stroke-linejoin="round"/></g>`
  return `<g transform="scale(${s})"><g class="ls2-bw" style="animation-delay:${-d}s">${wing(1)}${wing(-1)}</g><ellipse cx="0" cy="1.5" rx="3" ry="6" fill="${c}" ${edge ? `stroke="${edge}" stroke-width=".7"` : ''}/><path d="M-2.6 -3.4L-3.4 -8L0 -5.2L3.4 -8L2.6 -3.4Z" fill="${c}"/></g>`
}

// ───────── ala de terciopelo (ala izquierda; la derecha es el espejo). Hombro (46,132). Devuelve capas ya compuestas.
export function velvetWing(S, P, { sc = 1, dark = false } = {}) {
  const Sh = [46, 132], W = [-6, 52], T = [[-72, 8], [-94, 84], [-86, 154], [-52, 212]], B = [52, 218]
  const m = (p) => [Sh[0] + (p[0] - Sh[0]) * sc, Sh[1] + (p[1] - Sh[1]) * sc]
  const Wm = m(W), Tm = T.map(m), Bm = m(B)
  const mem =
    `M${pt(...Sh)}Q${pt(...m([14, 84]))} ${pt(...Wm)}L${pt(...Tm[0])}` +
    `Q${pt(...m([-40, 40]))} ${pt(...Tm[1])}Q${pt(...m([-52, 112]))} ${pt(...Tm[2])}Q${pt(...m([-38, 176]))} ${pt(...Tm[3])}Q${pt(...m([0, 206]))} ${pt(...Bm)}Q${pt(...m([34, 184]))} ${pt(...Sh)}Z`
  const fill = S.linU(dark ? [[0, '#14040a'], [1, '#050203']] : [[0, P.dk(P.d4, 0.35)], [0.45, P.dk(P.d4, 0.74)], [1, '#06020a']], Sh[0], Sh[1], Tm[1][0], Tm[1][1])
  let o = `<path d="${mem}" fill="${fill}" stroke="#000" stroke-width="1.2" stroke-opacity=".8" stroke-linejoin="round"/>`
  if (dark) return o
  // luz de terciopelo (pliegues entre falanges)
  o += `<path d="${mem}" fill="${S.rad([[0, P.d4, 0.5], [0.6, P.d4, 0.12], [1, P.d4, 0]], ...Wm, 90)}"/>`
  // falanges: oscuro debajo + oro encima
  const me = metal(S, P, { x1: -80, y1: 20, x2: 60, y2: 160 })
  Tm.forEach((t, i) => {
    const bow = [-10, -6, 6, 10][i], cx = (Wm[0] + t[0]) / 2 + bow * 0.4, cy = (Wm[1] + t[1]) / 2 - bow * 0.5
    o += `<path d="M${pt(...Wm)}Q${pt(cx, cy)} ${pt(...t)}" fill="none" stroke="#000" stroke-width="4.6" stroke-linecap="round" stroke-opacity=".7"/><path d="M${pt(...Wm)}Q${pt(cx, cy)} ${pt(...t)}" fill="none" stroke="${me}" stroke-width="2.4" stroke-linecap="round"/><path d="M${pt(...Wm)}Q${pt(cx, cy)} ${pt(...t)}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".6" stroke-linecap="round" transform="translate(-.5 -.5)"/>`
    // vena fina intermedia
    const k = [0.55, 0.45, 0.5, 0.5][i], mx = Wm[0] + (t[0] - Wm[0]) * k, my = Wm[1] + (t[1] - Wm[1]) * k
    o += `<path d="M${pt(mx, my)}L${pt(Bm[0] + (t[0] - Bm[0]) * 0.58, Bm[1] + (t[1] - Bm[1]) * 0.6)}" stroke="${P.d1}" stroke-opacity=".35" stroke-width=".7" fill="none"/>`
    // garra
    if (i === 0) o += `<path d="M${pt(t[0] + 2, t[1] + 1)}Q${pt(t[0] - 7, t[1] - 7)} ${pt(t[0] - 4, t[1] - 17)}Q${pt(t[0] + 1, t[1] - 8)} ${pt(t[0] + 5, t[1] - 3)}Z" fill="${me}" stroke="${DARK}" stroke-width=".7"/>`
  })
  // borde de la membrana (festones) en hilo de oro
  o += `<path d="M${pt(...Tm[0])}Q${pt(...m([-40, 40]))} ${pt(...Tm[1])}Q${pt(...m([-52, 112]))} ${pt(...Tm[2])}Q${pt(...m([-38, 176]))} ${pt(...Tm[3])}Q${pt(...m([0, 206]))} ${pt(...Bm)}" fill="none" stroke="${P.d1}" stroke-width="1" stroke-opacity=".85" stroke-linecap="round"/>`
  // brazo (hombro → muñeca) grueso con articulación
  o += `<path d="M${pt(...Sh)}Q${pt(...m([14, 84]))} ${pt(...Wm)}" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round" stroke-opacity=".75"/><path d="M${pt(...Sh)}Q${pt(...m([14, 84]))} ${pt(...Wm)}" fill="none" stroke="${me}" stroke-width="4.2" stroke-linecap="round"/><path d="M${pt(...Sh)}Q${pt(...m([14, 84]))} ${pt(...Wm)}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".8" stroke-linecap="round" transform="translate(-.8 0)"/>`
  o += jewel(S, Wm[0], Wm[1], 5.4, P.d4)
  return o
}

// ───────── corona real (centrada en 0,0 la base del aro; ancho ≈ 76, alto ≈ 76 con arcos)
export function royalCrown(S, P, s = 1) {
  const G = metal(S, P, { x1: -40, y1: -50, x2: 40, y2: 24 })
  const velvet = S.lin([[0, P.lt(P.d4, 0.2)], [0.6, P.d4], [1, P.dk(P.d4, 0.7)]], 0, 0, 0, 1)
  const pearl = S.radB([[0, '#fff'], [0.55, '#f6efe2'], [1, '#b9ad98']], 0.36, 0.32, 0.8)
  let o = ''
  // cofia de terciopelo
  o += `<path d="M-30 -2C-30 -26 -14 -38 0 -38C14 -38 30 -26 30 -2Z" fill="${velvet}" stroke="#000" stroke-opacity=".6" stroke-width=".8"/>`
  // arcos imperiales
  o += `<path d="M-36 -12C-34 -40 -12 -52 0 -52C12 -52 34 -40 36 -12" fill="none" stroke="#000" stroke-width="6.4" stroke-opacity=".6" stroke-linecap="round"/><path d="M-36 -12C-34 -40 -12 -52 0 -52C12 -52 34 -40 36 -12" fill="none" stroke="${G}" stroke-width="4.2" stroke-linecap="round"/><path d="M-36 -12C-34 -40 -12 -52 0 -52C12 -52 34 -40 36 -12" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".7" stroke-linecap="round" transform="translate(-.4 -.8)"/>`
  // puntas con flor de lis
  const pts = [[-36, -12, 0.78], [-18, -24, 0.9], [0, -33, 1.05], [18, -24, 0.9], [36, -12, 0.78]]
  pts.forEach(([x, y, k]) => {
    o += `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-8 14L-4 -4Q-9 -6 -7 -11Q-3 -9 0 -6Q3 -9 7 -11Q9 -6 4 -4L8 14Z" fill="${G}" stroke="${DARK}" stroke-width=".8" stroke-linejoin="round"/><path d="M0 -20C4 -14 4 -9 0 -4C-4 -9 -4 -14 0 -20Z" fill="${G}" stroke="${DARK}" stroke-width=".8"/><circle cx="0" cy="-22" r="3.3" fill="${pearl}" stroke="#6a5f4c" stroke-width=".5"/></g>`
  })
  // orbe y cruz
  o += `<circle cx="0" cy="-55" r="4.6" fill="${G}" stroke="${DARK}" stroke-width=".8"/><path d="M0 -59L-3.4 -64Q0 -72 3.4 -64Z" fill="${G}" stroke="${DARK}" stroke-width=".7"/><circle cx="0" cy="-66" r="2" fill="${P.d4}" stroke="#000" stroke-width=".4"/>`
  // aro: filetes de oro + banda de armiño
  o += `<rect x="-38" y="6" width="76" height="4.4" rx="1.2" fill="${G}" stroke="${DARK}" stroke-width=".7"/><rect x="-38" y="21" width="76" height="4.4" rx="1.2" fill="${G}" stroke="${DARK}" stroke-width=".7"/>`
  o += `<rect x="-37" y="10" width="74" height="11" fill="#f4eee2" stroke="${DARK}" stroke-width=".5"/>`
  for (let i = 0; i < 9; i++) o += `<path d="M${-33 + i * 8} 11.6l1.4 3.6l1.4 -3.6l-.6 6.2z" fill="#14090c"/>`
  // gemas del aro
  o += jewel(S, 0, 15.5, 4.8, P.d4) + jewel(S, -22, 15.5, 3.4, '#3F6FE0') + jewel(S, 22, 15.5, 3.4, '#3F6FE0') + jewel(S, -33, 15.5, 2.2, '#fff') + jewel(S, 33, 15.5, 2.2, '#fff')
  return `<g transform="scale(${s})">${o}</g>`
}

// ───────── concha rococó (abanico de acanto) centrada en 0,0 apuntando hacia arriba
export function shell(S, P, s = 1) {
  const G = metal(S, P, { x1: -30, y1: -34, x2: 30, y2: 16 })
  let o = ''
  const n = 9
  for (let i = 0; i < n; i++) {
    const a = -90 + (i - (n - 1) / 2) * 17, w = 7.4, L = 30 - Math.abs(i - (n - 1) / 2) * 1.6
    const p0 = pol(0, 0, 4, a - w), p1 = pol(0, 0, 4, a + w), t = pol(0, 0, L, a), c0 = pol(0, 0, L * 0.7, a - w * 2.1), c1 = pol(0, 0, L * 0.7, a + w * 2.1)
    o += eng(`M${pt(...p0)}Q${pt(...c0)} ${pt(...t)}Q${pt(...c1)} ${pt(...p1)}Z`, G, { sw: 0.7 })
    o += `<path d="M${pt(...pol(0, 0, 6, a))}L${pt(...pol(0, 0, L - 3, a))}" stroke="${DARK}" stroke-opacity=".55" stroke-width=".7"/>`
  }
  o += `<path d="M-14 4Q0 -6 14 4Q8 12 0 12Q-8 12 -14 4Z" fill="${G}" stroke="${DARK}" stroke-width=".8"/>`
  return `<g transform="scale(${s})">${o}</g>`
}

// ───────── volutas en C (rococó): espiral de oro que termina en un rizo con hoja. ang = dirección de crecimiento
export function scroll(S, P, { x, y, rot = 0, s = 1, flip = 1 } = {}) {
  const G = metalB(S, P)
  let d = ''
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * 520 * (Math.PI / 180), r = 26 * (1 - t) ** 1.2 + 2.2; d += (i ? 'L' : 'M') + pt(Math.cos(a) * r * 1.0 - 10 * (1 - t) * 0, Math.sin(a) * r * 1.0 + t * 0) }
  return `<g transform="translate(${pt(x, y)}) rotate(${rot}) scale(${s * flip} ${s})"><path d="${d}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${G}" stroke-width="4.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".8" stroke-linecap="round" transform="translate(-.7 -.7)"/><circle cx="0" cy="0" r="3.4" fill="${G}" stroke="${DARK}" stroke-width=".7"/></g>`
}

// ───────── hoja de acanto estilizada (base en 0,0, crece hacia -y)
export const acanthus = (S, P, L = 22, w = 9, tilt = 0) => {
  const G = metalB(S, P)
  return `<g transform="rotate(${tilt})">${eng(`M0 0C${f(-w)} ${f(-L * 0.2)} ${f(-w * 1.3)} ${f(-L * 0.62)} ${f(-w * 0.3)} ${f(-L)}C${f(-w * 0.1)} ${f(-L * 0.75)} ${f(w * 0.2)} ${f(-L * 0.7)} ${f(w * 0.5)} ${f(-L * 0.78)}C${f(w * 1.4)} ${f(-L * 0.5)} ${f(w)} ${f(-L * 0.2)} 0 0Z`, G, { sw: 0.7 })}<path d="M0 -2Q-1 ${f(-L * 0.5)} ${f(-w * 0.3)} ${f(-L * 0.92)}" stroke="${DARK}" stroke-opacity=".5" stroke-width=".6" fill="none"/></g>`
}

// ───────── enredadera de espinas (curva cerrada alrededor del avatar) con espinas, hojas y devuelve los puntos
export function thornVine(S, P, { r = 119, amp = 4, k = 7, seed = 2, leaf, thorn } = {}) {
  const R = rng(seed)
  const pts = []
  for (let i = 0; i <= 240; i++) { const a = (i * 360) / 240, rr = r + amp * Math.sin((a * k * Math.PI) / 180) + 2 * Math.sin((a * 3 * Math.PI) / 180); pts.push([...pol(144, 144, rr, a - 90), a]) }
  const d = pts.map((p, i) => (i ? 'L' : 'M') + pt(p[0], p[1])).join('') + 'Z'
  let o = `<path d="${d}" fill="none" stroke="#000" stroke-width="8" stroke-opacity=".6" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${P.dk(P.d4, 0.82)}" stroke-width="5.4" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${P.lt(P.d4, 0.1)}" stroke-width=".7" stroke-opacity=".45" stroke-linejoin="round" transform="translate(-.8 -.8)"/>`
  for (let i = 0; i < 240; i += 5) {
    const [x, y, a] = pts[i], side = i % 10 === 0 ? 1 : -1, len = 6 + R() * 5
    o += `<g transform="translate(${pt(x, y)}) rotate(${f(a + (side > 0 ? 0 : 180) + (R() - 0.5) * 30)})"><path d="M-1.8 0L0 ${-len}L1.8 0Z" fill="${thorn || '#c9c0b0'}" stroke="#000" stroke-width=".4" stroke-opacity=".6"/></g>`
  }
  for (let i = 4; i < 240; i += 12) {
    const [x, y, a] = pts[i], side = (i / 12) % 2 ? 1 : -1
    o += `<g transform="translate(${pt(x, y)}) rotate(${f(a + side * 62)})"><path d="M0 0C5 -3 9 -9 8 -17C2 -13 -1 -7 0 0Z" fill="${leaf || P.dk(P.d4, 0.7)}" stroke="#000" stroke-width=".5" stroke-opacity=".6"/><path d="M0 0Q3 -8 7.4 -15" stroke="${P.d1}" stroke-opacity=".55" stroke-width=".5" fill="none"/></g>`
  }
  return { d, pts, svg: o }
}

// ───────── espiral de sangre alrededor del avatar (una cinta que baja en espiral). Devuelve el trazo.
export function bloodRibbon(S, P, { turns = 1.15, r0 = 120, r1 = 138, a0 = -210, w = 7.4 } = {}) {
  const pts = []
  const N = 180
  for (let i = 0; i <= N; i++) { const t = i / N, a = a0 + t * 360 * turns, r = r0 + (r1 - r0) * t + 3.4 * Math.sin(t * 14); pts.push(pol(144, 144, r, a)) }
  const d = pts.map((p, i) => (i ? 'L' : 'M') + pt(p[0], p[1])).join('')
  const grad = S.linU([[0, P.lt(P.d4, 0.2)], [0.5, P.d4], [1, P.dk(P.d4, 0.65)]], 40, 20, 250, 270)
  return { d, end: pts[pts.length - 1], svg: `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${grad}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${P.dk(P.d4, 0.6)}" stroke-opacity=".7" stroke-width="${f(w * 0.36)}" stroke-linecap="round" transform="translate(1 1.4)"/><path class="ls2-fw" d="${d}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round" pathLength="100" transform="translate(-1.1 -1.7)"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".9" stroke-linecap="round" transform="translate(-1.2 -1.8)"/>` }
}

// ───────── remolino de sangre: cinta que se retuerce (ancho variable) alrededor del avatar. Relleno cerrado.
export function bloodSwirl(S, P, { R0 = 128, A = 11, k = 3, phase = 0, wmax = 11, w0 = 1.6, pow = 0.8, fillC } = {}) {
  const N = 220, out = [], inn = []
  for (let i = 0; i <= N; i++) {
    const a = (i * 360) / N, t = (a * Math.PI) / 180
    const r = R0 + A * Math.sin(k * t + phase), w = w0 + wmax * Math.abs(Math.cos((k * t) / 2 + phase / 2)) ** pow
    out.push(pol(144, 144, r + w / 2, a)); inn.push(pol(144, 144, r - w / 2, a))
  }
  const d = out.map((p, i) => (i ? 'L' : 'M') + pt(p[0], p[1])).join('') + inn.reverse().map((p) => 'L' + pt(p[0], p[1])).join('') + 'Z'
  const g = fillC || S.linU([[0, P.lt(P.d4, 0.3)], [0.45, P.d4], [1, P.dk(P.d4, 0.7)]], 30, 20, 260, 270)
  const hl = out.map((p, i) => (i ? 'L' : 'M') + pt(p[0], p[1])).join('')
  return `<path d="${d}" fill="#000" fill-opacity=".5" stroke="#000" stroke-opacity=".5" stroke-width="3" stroke-linejoin="round"/><path d="${d}" fill="${g}" stroke="${P.dk(P.d4, 0.75)}" stroke-width=".7" stroke-linejoin="round"/><path d="${hl}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9" transform="translate(-.6 -.9)"/>`
}
