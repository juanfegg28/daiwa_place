// @ts-nocheck
// Utilidades geométricas compartidas por TODOS los diseños (sin dependencias).
// Lienzo de diseño: 288 x 288. Avatar = círculo de radio 111 centrado en (144,144).

export const CX = 144
export const CY = 144
export const R = 111 // radio del avatar dentro del lienzo de 288
export const TAU = Math.PI * 2

export const f = (n) => Math.round(n * 100) / 100
export const rad = (d) => (d * Math.PI) / 180
export const pol = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))]
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// Generador pseudoaleatorio determinista (mulberry32): los mismos números siempre,
// así el diseño nunca "salta" entre renderizados.
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const pts = (arr) => arr.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')

// Arco simple (para stroke). a0 -> a1 en grados (sentido horario en pantalla si a1>a0).
export function arc(r, a0, a1, cx = CX, cy = CY, move = true) {
  const [x0, y0] = pol(cx, cy, r, a0)
  const [x1, y1] = pol(cx, cy, r, a1)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const sweep = a1 > a0 ? 1 : 0
  return `${move ? 'M' : 'L'}${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 ${large} ${sweep} ${f(x1)} ${f(y1)}`
}

// Sector anular (a1 > a0).
export function sector(r0, r1, a0, a1, cx = CX, cy = CY) {
  const [x0, y0] = pol(cx, cy, r1, a0)
  const [x1, y1] = pol(cx, cy, r1, a1)
  const [x2, y2] = pol(cx, cy, r0, a1)
  const [x3, y3] = pol(cx, cy, r0, a0)
  const lg = a1 - a0 > 180 ? 1 : 0
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 ${lg} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 ${lg} 0 ${f(x3)} ${f(y3)}Z`
}

// Banda curva de grosor variable: sigue el radio rm entre a0 y a1; half(t) = medio grosor (t en 0..1).
// Sirve para segmentos con puntas, hojas de katana, colmillos, etc.
export function band(rm, a0, a1, half, steps = 28, cx = CX, cy = CY) {
  const out = []
  const inn = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = a0 + (a1 - a0) * t
    const h = half(t)
    out.push(pol(cx, cy, rm + h, a))
    inn.push(pol(cx, cy, rm - h, a))
  }
  return 'M' + out.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'L' + inn.reverse().map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z'
}

// Polilínea suave a partir de puntos (Catmull-Rom -> Bézier).
export function smooth(points, closed = false) {
  const n = points.length
  if (n < 3) return 'M' + points.map((p) => f(p[0]) + ' ' + f(p[1])).join('L')
  const P = (i) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]
  let d = `M${f(points[0][0])} ${f(points[0][1])}`
  const m = closed ? n : n - 1
  for (let i = 0; i < m; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + (closed ? 'Z' : '')
}

export const T = (x = 0, y = 0, r = 0, s = 1) =>
  `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`
