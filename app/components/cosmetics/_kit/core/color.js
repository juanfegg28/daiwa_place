// @ts-nocheck
// Colores: mezclas, aclarar/oscurecer, rotar matiz (para "color libre" de Legendarios/Míticos)
// y resolución de paletas a valores HEX ya "horneados" (no dependen de variables CSS).

const h2 = (h) => {
  h = h.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const r2h = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

export const mix = (a, b, t) => {
  const A = h2(a), B = h2(b)
  return r2h(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
}
export const lt = (c, t) => mix(c, '#ffffff', t)
export const dk = (c, t) => mix(c, '#000000', t)

function toHsl(hex) {
  let [r, g, b] = h2(hex).map((v) => v / 255)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (mx + mn) / 2
  if (mx !== mn) {
    const d = mx - mn
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s, l]
}
function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return r2h((r + m) * 255, (g + m) * 255, (b + m) * 255)
}
export const rot = (c, deg) => {
  const [h, s, l] = toHsl(c)
  return fromHsl(h + deg, s, l)
}
export const rgba = (c, a) => {
  const [r, g, b] = h2(c)
  return `rgba(${r},${g},${b},${a})`
}
// Luminancia relativa (WCAG) para decidir texto claro/oscuro sobre un color.
export const luma = (c) => {
  const v = h2(c).map((x) => {
    x /= 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
}

// def = { id, name, c: [d1,d2,d3,d4] }  (d1 principal · d2 oscuro · d3 luz · d4 acento)
export function makePalette(def, hue = 0) {
  const c = def.c.map((x) => (hue ? rot(x, hue) : x))
  return { id: def.id, name: def.name, d1: c[0], d2: c[1], d3: c[2], d4: c[3], mix, lt, dk, rgba, rot }
}
// Chip de 2 colores para el selector de paletas.
export const swatch = (def) => `linear-gradient(135deg,${def.c[0]} 50%,${def.c[3]} 50%)`
