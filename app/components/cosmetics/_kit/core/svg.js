// @ts-nocheck
// Constructor de SVG: gradientes con id único por instancia (así dos avatares con paletas distintas
// en la misma pantalla nunca se pisan) + primitivas de dibujo reutilizables.
import { f, CX, CY, rng, pol, rad } from './util.js'

const stopsM = (st) =>
  st.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null && s[2] !== 1 ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')

export class Canvas {
  constructor(id, pad = 0) {
    this.id = id
    this.pad = pad
    this.defs = []
    this.k = 0
  }
  nid(t) {
    return `${this.id}${t}${this.k++}`
  }
  // lineal en unidades de la caja del elemento (0..1)
  lin(st, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
    const i = this.nid('l')
    this.defs.push(`<linearGradient id="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsM(st)}</linearGradient>`)
    return `url(#${i})`
  }
  // lineal en coordenadas del lienzo
  linU(st, x1, y1, x2, y2) {
    const i = this.nid('u')
    this.defs.push(`<linearGradient id="${i}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${stopsM(st)}</linearGradient>`)
    return `url(#${i})`
  }
  // radial en coordenadas del lienzo
  rad(st, cx = CX, cy = CY, r = 144, fx, fy) {
    const i = this.nid('r')
    this.defs.push(
      `<radialGradient id="${i}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${fx != null ? ` fx="${f(fx)}" fy="${f(fy)}"` : ''}>${stopsM(st)}</radialGradient>`
    )
    return `url(#${i})`
  }
  // radial en unidades de la caja del elemento
  radB(st, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) {
    const i = this.nid('b')
    this.defs.push(
      `<radialGradient id="${i}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stopsM(st)}</radialGradient>`
    )
    return `url(#${i})`
  }
  clip(inner) {
    const i = this.nid('c')
    this.defs.push(`<clipPath id="${i}">${inner}</clipPath>`)
    return `url(#${i})`
  }
  mask(inner) {
    const i = this.nid('m')
    this.defs.push(`<mask id="${i}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="500" height="500">${inner}</mask>`)
    return `url(#${i})`
  }
  blur(sd) {
    const i = this.nid('f')
    this.defs.push(`<filter id="${i}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`)
    return `url(#${i})`
  }
  sym(inner) {
    const i = this.nid('s')
    this.defs.push(`<g id="${i}">${inner}</g>`)
    return i
  }
  use(id, attrs = '') {
    return `<use href="#${id}" xlink:href="#${id}" ${attrs}/>`
  }
  svg(body) {
    return `<svg class="dps" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 288 288" width="100%" height="100%" aria-hidden="true" focusable="false" style="overflow:visible"><defs>${this.defs.join('')}</defs>${body}</svg>`
  }
}

// ---------- helpers de marcado ----------
export const at = (x, y, inner, cls = '', extra = '') =>
  `<g transform="translate(${f(x)} ${f(y)})${extra}">${cls ? `<g class="${cls}">${inner}</g>` : inner}</g>`
export const g = (inner, cls = '', attrs = '') => `<g${cls ? ` class="${cls}"` : ''}${attrs ? ' ' + attrs : ''}>${inner}</g>`
export const mirror = (inner, W = 288) => `<g transform="translate(${W} 0) scale(-1 1)">${inner}</g>`
// grupo centrado en el avatar: dentro se dibuja con (0,0) = centro del avatar (rotaciones perfectas)
export const ctr = (inner, cls = '') => at(CX, CY, inner, cls)

// ---------- formas ----------
export const sparkle = (x, y, r, fill, cls = '', op = 1, k = 0.2) =>
  `<path${cls ? ` class="${cls}"` : ''} d="M${f(x)} ${f(y - r)}Q${f(x + r * k)} ${f(y - r * k)} ${f(x + r)} ${f(y)}Q${f(x + r * k)} ${f(y + r * k)} ${f(x)} ${f(y + r)}Q${f(x - r * k)} ${f(y + r * k)} ${f(x - r)} ${f(y)}Q${f(x - r * k)} ${f(y - r * k)} ${f(x)} ${f(y - r)}Z" fill="${fill}"${op !== 1 ? ` opacity="${op}"` : ''}/>`
export const dot = (x, y, r, fill, cls = '', op = 1) =>
  `<circle${cls ? ` class="${cls}"` : ''} cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${op !== 1 ? ` opacity="${op}"` : ''}/>`

export const heartD = (s) =>
  `M0 ${f(0.92 * s)}C${f(-1.15 * s)} ${f(0.1 * s)} ${f(-1.0 * s)} ${f(-0.95 * s)} ${f(-0.46 * s)} ${f(-0.95 * s)}C${f(-0.2 * s)} ${f(-0.95 * s)} 0 ${f(-0.72 * s)} 0 ${f(-0.46 * s)}C0 ${f(-0.72 * s)} ${f(0.2 * s)} ${f(-0.95 * s)} ${f(0.46 * s)} ${f(-0.95 * s)}C${f(1.0 * s)} ${f(-0.95 * s)} ${f(1.15 * s)} ${f(0.1 * s)} 0 ${f(0.92 * s)}Z`
export const leafD = (len, w) =>
  `M0 0C${f(w)} ${f(-len * 0.25)} ${f(w)} ${f(-len * 0.75)} 0 ${f(-len)}C${f(-w)} ${f(-len * 0.75)} ${f(-w)} ${f(-len * 0.25)} 0 0Z`
export const petalD = (len, w) =>
  `M0 0C${f(-w * 0.95)} ${f(-len * 0.2)} ${f(-w)} ${f(-len * 0.78)} ${f(-w * 0.28)} ${f(-len)}L0 ${f(-len * 0.88)}L${f(w * 0.28)} ${f(-len)}C${f(w)} ${f(-len * 0.78)} ${f(w * 0.95)} ${f(-len * 0.2)} 0 0Z`
// pluma apuntando hacia -y (arriba) desde el origen
export function featherD(len, w, style = 'pointed', bend = 0.12) {
  const b = w * bend * 6
  if (style === 'round')
    return `M0 0C${f(w)} ${f(-len * 0.18)} ${f(w * 1.15 + b)} ${f(-len * 0.8)} ${f(b)} ${f(-len)}C${f(-w * 1.15 + b)} ${f(-len * 0.8)} ${f(-w)} ${f(-len * 0.18)} 0 0Z`
  if (style === 'shard')
    return `M0 0L${f(w)} ${f(-len * 0.3)}L${f(w * 0.35 + b)} ${f(-len)}L${f(-w * 0.7)} ${f(-len * 0.5)}Z`
  if (style === 'flame')
    return `M0 0C${f(w)} ${f(-len * 0.22)} ${f(w * 0.2)} ${f(-len * 0.5)} ${f(w * 0.85 + b)} ${f(-len * 0.78)}C${f(w * 0.3 + b)} ${f(-len * 0.74)} ${f(w * 0.25 + b)} ${f(-len * 0.92)} ${f(b)} ${f(-len)}C${f(-w * 0.55)} ${f(-len * 0.7)} ${f(-w * 1.1)} ${f(-len * 0.38)} 0 0Z`
  return `M0 0C${f(w * 0.95)} ${f(-len * 0.2)} ${f(w * 1.0 + b)} ${f(-len * 0.62)} ${f(w * 0.12 + b)} ${f(-len)}C${f(-w * 0.6 + b)} ${f(-len * 0.64)} ${f(-w * 0.85)} ${f(-len * 0.24)} 0 0Z`
}

// Rosa con pétalos en espiral (dibujada, no un emoji). Centrada en (cx,cy).
export function rose(S, cx, cy, r, c1, c2, c3, { wither = 0, rot = 0 } = {}) {
  const base = S.radB([[0, c2], [1, c2, 0.9]])
  const out = S.radB([[0, c1], [0.7, c1], [1, c2]], 0.5, 0.35, 0.75)
  const mid = S.radB([[0, c3], [0.6, c1], [1, c2]], 0.5, 0.3, 0.8)
  const inn = S.radB([[0, c3], [1, c1]], 0.5, 0.3, 0.8)
  const cup = (rr) => `M0 0C${f(-rr * 0.95)} ${f(-rr * 0.18)} ${f(-rr * 0.9)} ${f(-rr * 1.05)} 0 ${f(-rr * 0.98)}C${f(rr * 0.9)} ${f(-rr * 1.05)} ${f(rr * 0.95)} ${f(-rr * 0.18)} 0 0Z`
  let s = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})">`
  s += `<circle r="${f(r * 0.98)}" fill="${base}"/>`
  for (let i = 0; i < 5; i++) s += `<path transform="rotate(${i * 72}) translate(0 ${f(-r * 0.1)})" d="${cup(r * 0.95)}" fill="${out}" stroke="${c2}" stroke-opacity=".55" stroke-width="${f(r * 0.04)}"/>`
  for (let i = 0; i < 5; i++) s += `<path transform="rotate(${36 + i * 72}) translate(0 ${f(-r * 0.05)})" d="${cup(r * 0.7)}" fill="${mid}" stroke="${c2}" stroke-opacity=".5" stroke-width="${f(r * 0.04)}"/>`
  for (let i = 0; i < 4; i++) s += `<path transform="rotate(${i * 90 + 10})" d="${cup(r * 0.46)}" fill="${inn}" stroke="${c2}" stroke-opacity=".5" stroke-width="${f(r * 0.035)}"/>`
  // espiral central
  let sp = 'M0 0'
  for (let a = 0; a <= 560; a += 24) {
    const rr = (a / 560) * r * 0.2 + r * 0.02
    const [x, y] = pol(0, 0, rr, a)
    sp += `L${f(x)} ${f(y)}`
  }
  s += `<path d="${sp}" fill="none" stroke="${c2}" stroke-width="${f(r * 0.06)}" stroke-linecap="round" opacity=".9"/>`
  if (wither) s += `<circle r="${f(r)}" fill="#1a1216" opacity="${wither}"/>`
  s += `<ellipse cx="${f(-r * 0.25)}" cy="${f(-r * 0.4)}" rx="${f(r * 0.3)}" ry="${f(r * 0.12)}" fill="#fff" opacity=".16" transform="rotate(-25)"/>`
  return s + '</g>'
}

// Cadena: eslabones elípticos alternados siguiendo una lista de puntos (con tangente).
export function chain(S, points, c1, c2, c3, size = 1) {
  let s = ''
  const face = S.lin([[0, c3], [0.5, c1], [1, c2]], 0, 0, 1, 1)
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2
    if (i % 2 === 0)
      s += `<g transform="translate(${f(mx)} ${f(my)}) rotate(${f(ang)})"><ellipse rx="${f(7.4 * size)}" ry="${f(4.4 * size)}" fill="none" stroke="${face}" stroke-width="${f(2.4 * size)}"/><ellipse rx="${f(7.4 * size)}" ry="${f(4.4 * size)}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="${f(0.7 * size)}" transform="translate(0 ${f(-0.9 * size)})"/></g>`
    else
      s += `<g transform="translate(${f(mx)} ${f(my)}) rotate(${f(ang)})"><ellipse rx="${f(6.6 * size)}" ry="${f(1.9 * size)}" fill="${face}" stroke="${c2}" stroke-width="${f(0.6 * size)}"/></g>`
  }
  return s
}

// Puntos repartidos sobre un arco (para cadenas, hileras de perlas, etc.)
export function arcPoints(r, a0, a1, n, cx = CX, cy = CY) {
  const out = []
  for (let i = 0; i < n; i++) out.push(pol(cx, cy, r, a0 + ((a1 - a0) * i) / (n - 1)))
  return out
}

// ---------- alas ----------
// Ala IZQUIERDA en coordenadas del lienzo (el derecho se obtiene con mirror()).
// Las plumas nacen a lo largo de un "brazo" (Bézier cuadrática) y cuelgan en abanico.
// Estilos de pluma: pointed | round | shard | flame.
export function wingLeft(S, o) {
  const {
    arm = [[88, 150], [30, 122], [10, 50]],
    rows,
    style = 'pointed',
    cols, // [base, medio, punta, brillo]
    shaft = true,
    edge = true,
  } = o
  const bez = (t) => {
    const [p0, p1, p2] = arm
    return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]]
  }
  let s = ''
  rows.forEach((row) => {
    const [t0, t1] = row.span || [0, 1]
    const grad = S.lin(row.stops || [[0, cols[row.fill ?? 0]], [0.6, cols[row.mid ?? 1]], [1, cols[row.tip ?? 2]]], 0, 1, 0, 0)
    const st = row.style || style
    for (let k = 0; k < row.n; k++) {
      const u = row.n === 1 ? 0 : k / (row.n - 1)
      const [rx, ry] = bez(t0 + (t1 - t0) * u)
      const ang = row.a[0] + (row.a[1] - row.a[0]) * u
      const len = row.len[0] + (row.len[1] - row.len[0]) * Math.pow(u, row.pow ?? 1)
      const w = row.w * (row.wk ? row.wk[0] + (row.wk[1] - row.wk[0]) * u : 1)
      const d = featherD(len, w, st, row.bend ?? 0.1)
      s += `<g transform="translate(${f(rx)} ${f(ry)}) rotate(${f(ang + 90)})"><path d="${d}" fill="${grad}" stroke="${cols[3]}" stroke-opacity="${row.edgeOp ?? 0.3}" stroke-width="0.9"/>${shaft ? `<path d="M0 0Q${f(w * 0.1)} ${f(-len * 0.5)} ${f(w * 0.14)} ${f(-len * 0.92)}" stroke="${cols[3]}" stroke-opacity=".24" stroke-width=".8" fill="none"/>` : ''}</g>`
    }
  })
  if (edge) {
    const [p0, p1, p2] = arm
    s += `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])}" fill="none" stroke="${cols[3]}" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>`
  }
  return s
}

// ---------- lazo (centrado en el nudo) ----------
export function bow(S, c1, c2, c3, { s = 1, tails = true } = {}) {
  const fill = S.lin([[0, c3], [0.45, c1], [1, c2]], 0, 0, 1, 1)
  const fillR = S.lin([[0, c3], [0.45, c1], [1, c2]], 1, 0, 0, 1)
  const kn = S.lin([[0, c3], [1, c1]], 0, 0, 1, 1)
  const L = 'M0 0C-8 -17 -30 -30 -43 -17C-54 -5 -41 13 -23 11C-12 10 -4 5 0 0Z'
  const Rr = 'M0 0C8 -17 30 -30 43 -17C54 -5 41 13 23 11C12 10 4 5 0 0Z'
  let o = `<g transform="scale(${s})">`
  if (tails)
    o += `<path d="M-3 5C-9 19 -17 31 -31 50L-22 51L-15 60L-8 46C-5 32 -2 18 0 6Z" fill="${fill}" stroke="${c2}" stroke-opacity=".5" stroke-width=".7"/><path d="M3 5C10 17 20 28 32 44L24 46L19 55L10 42C5 30 2 17 0 6Z" fill="${fillR}" stroke="${c2}" stroke-opacity=".5" stroke-width=".7"/>`
  o += `<path d="${L}" fill="${fill}" stroke="${c2}" stroke-opacity=".55" stroke-width=".8"/><path d="${Rr}" fill="${fillR}" stroke="${c2}" stroke-opacity=".55" stroke-width=".8"/>`
  o += `<path d="M-6 -1C-16 -12 -30 -15 -40 -10M-6 3C-18 6 -30 7 -38 2" stroke="${c2}" stroke-opacity=".38" stroke-width=".8" fill="none"/><path d="M6 -1C16 -12 30 -15 40 -10M6 3C18 6 30 7 38 2" stroke="${c2}" stroke-opacity=".38" stroke-width=".8" fill="none"/>`
  o += `<path d="M-14 -9C-22 -14 -32 -16 -37 -12M14 -9C22 -14 32 -16 37 -12" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
  o += `<rect x="-6.5" y="-7" width="13" height="14" rx="5" fill="${kn}" stroke="${c2}" stroke-opacity=".6" stroke-width=".8"/><path d="M-3 -4Q0 -6 3 -4" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
  return o + '</g>'
}

// Creciente (luna): R radio grande, r radio del recorte, d distancia entre centros. Centro en (0,0).
export function crescentD(R, r, d) {
  const x = (R * R - r * r + d * d) / (2 * d)
  const y = Math.sqrt(Math.max(0, R * R - x * x))
  return `M${f(x)} ${f(-y)}A${f(R)} ${f(R)} 0 1 0 ${f(x)} ${f(y)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(-y)}Z`
}

// Estrella de n puntas
export function starD(n, R, r, rot = -90) {
  let d = ''
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * 180) / n
    const rr = i % 2 ? r : R
    const x = rr * Math.cos((a * Math.PI) / 180), y = rr * Math.sin((a * Math.PI) / 180)
    d += (i ? 'L' : 'M') + f(x) + ' ' + f(y)
  }
  return d + 'Z'
}

// ---------- órbitas con profundidad ----------
// items: [{ th: grados iniciales, T: segundos, art: string (dibujo centrado en 0,0), k: escala de profundidad }]
// Devuelve { back, front }: cada elemento existe en las dos capas y solo es visible cuando le toca
// (delante del avatar o detrás), para que pase "por detrás" de la foto de verdad.
export function orbit(S, { rx = 132, ry = 38, tilt = -16, items }) {
  const mk = (layer) => {
    let o = ''
    for (const it of items) {
      const th = it.th, T = it.T, k = it.k ?? 0.22
      const x0 = rx * Math.cos((th * Math.PI) / 180)
      const y0 = ry * Math.sin((th * Math.PI) / 180)
      const s0 = 1 + k * Math.sin((th * Math.PI) / 180)
      const ph = (th / 360) * T
      const vis = layer === 'f' ? (Math.sin((th * Math.PI) / 180) > 0 ? 1 : 0) : Math.sin((th * Math.PI) / 180) > 0 ? 0 : 1
      o += `<g class="ob-v${layer}" style="animation-duration:${T}s;animation-delay:${f(-ph)}s" opacity="${vis}"><g class="ob-x" transform="translate(${f(x0)} 0)" style="--rx:${rx}px;animation-duration:${f(T / 2)}s;animation-delay:${f(-ph)}s"><g class="ob-y" transform="translate(0 ${f(y0)})" style="--ry:${ry}px;animation-duration:${f(T / 2)}s;animation-delay:${f(-ph - T / 4)}s"><g class="ob-s" transform="scale(${f(s0)})" style="--k0:${f(1 - k)};--k1:${f(1 + k)};animation-duration:${f(T / 2)}s;animation-delay:${f(-ph - T / 4)}s">${it.art}</g></g></g></g>`
    }
    return `<g transform="translate(144 144) rotate(${tilt})">${o}</g>`
  }
  return { back: mk('b'), front: mk('f') }
}

// ---------- extras compartidos ----------
// Resplandor suave detrás de la foto (capa back) — firma visual de todas las colecciones.
export const glow = (S, c, op = 0.22, r0 = 0.78, r1 = 0.88) =>
  `<circle cx="144" cy="144" r="144" fill="${S.rad([[r0, c, 0], [r1, c, op], [1, c, 0]], 144, 144, 144)}"/>`

// ---------- pixel-art ----------
// sprite: array de strings; map: { char: color }. (x,y) = esquina sup. izq.; cell = tamaño de píxel.
export function sprite(rows, map, x, y, cell = 4, extra = '') {
  let o = ''
  rows.forEach((row, j) => {
    let i = 0
    while (i < row.length) {
      const ch = row[i]
      if (ch === '.' || !map[ch]) { i++; continue }
      let k = i
      while (k + 1 < row.length && row[k + 1] === ch) k++
      o += `<rect x="${f(x + i * cell)}" y="${f(y + j * cell)}" width="${(k - i + 1) * cell}" height="${cell}" fill="${map[ch]}"/>`
      i = k + 1
    }
  })
  return `<g shape-rendering="crispEdges"${extra ? ' ' + extra : ''}>${o}</g>`
}
// línea diagonal 45° hecha de píxeles (grosor w celdas)
export function pxDiag(x0, y0, n, dir, w, cell, color) {
  let o = ''
  for (let i = 0; i < n; i++) for (let k = 0; k < w; k++) o += `<rect x="${f(x0 + i * cell * dir + (k > 0 ? 0 : 0))}" y="${f(y0 + i * cell + k * cell)}" width="${cell}" height="${cell}" fill="${color}"/>`
  return o
}
// aro de píxeles con sombreado desde arriba-izquierda
export function pxRing(cx, cy, r0, r1, cell, tones, outline) {
  const [L, M, D] = tones
  const inRing = (gx, gy) => { const d = Math.hypot(gx * cell, gy * cell); return d >= r0 && d <= r1 }
  const n = Math.ceil(r1 / cell) + 1
  let o = ''
  for (let gy = -n; gy <= n; gy++)
    for (let gx = -n; gx <= n; gx++) {
      if (!inRing(gx, gy)) continue
      const edge = !inRing(gx + 1, gy) || !inRing(gx - 1, gy) || !inRing(gx, gy + 1) || !inRing(gx, gy - 1)
      const t = (-(gx + gy) * cell) / (r1 * 1.3)
      const col = edge ? outline : t > 0.35 ? L : t < -0.35 ? D : M
      o += `<rect x="${f(cx + gx * cell - cell / 2)}" y="${f(cy + gy * cell - cell / 2)}" width="${cell}" height="${cell}" fill="${col}"/>`
    }
  return `<g shape-rendering="crispEdges">${o}</g>`
}
