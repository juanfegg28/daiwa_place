// @ts-nocheck
// Base para TARJETAS DE PERFIL: lienzo 340×420 (se escala con CSS). Capas: art (fondo) → UI (texto) → frame (marco encima).
import { f, rng, pol } from '../core/util.js'
import { Canvas, sparkle } from '../core/svg.js'

export const CW = 340
export const CH = 420
export const BH = 132 // alto reservado al BANNER del usuario (la tarjeta no dibuja ahí)
export class CardCanvas extends Canvas {
  svg(body) {
    return `<svg class="dps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}" aria-hidden="true" focusable="false" style="display:block"><defs>${this.defs.join('')}</defs>${body}</svg>`
  }
}
export const rect = (x, y, w, h, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${extra}/>`
export const full = (fill) => rect(0, -200, CW, CH + 500, fill)
// fondo en degradado vertical
export const vgrad = (S, stops) => full(S.linU(stops, 0, 0, 0, CH))
// viñeta oscura en bordes
export const vig = (S, col = '#000', op = 0.6) => full(S.rad([[0.45, col, 0], [1, col, op]], 170, 190, 330))
// resplandor radial en (x,y)
export const bloom = (S, x, y, r, col, op = 0.6) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${S.radB([[0, col, op], [1, col, 0]])}"/>`
// campo de estrellas (parpadeantes)
export const stars = (S, P, { n = 40, seed = 3, y0 = 0, y1 = CH, col, big = 0.2 } = {}) => {
  const R = rng(seed)
  let o = ''
  for (let i = 0; i < n; i++) {
    const x = R() * CW, y = y0 + R() * (y1 - y0), r = 0.6 + R() * (R() < big ? 2.2 : 0.9)
    o += R() < 0.3 ? sparkle(x, y, r * 2.2, col || P.d3, 'k-tw').replace('<path', `<path style="animation-delay:${-(R() * 3).toFixed(1)}s"`) : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col || P.d3}" opacity="${f(0.4 + R() * 0.6)}"/>`
  }
  return o
}
// marco simple con esquinas
export const frame = (inset, col, w = 1.6, r = 18, op = 1) => `<rect x="${inset}" y="${inset}" width="${CW - inset * 2}" height="${CH - inset * 2}" rx="${r}" fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`
export const cornerOrn = (col, inset = 10, len = 26, w = 2) => {
  const c = (x, y, sx, sy) => `<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M0 ${len}V8Q0 0 8 0H${len}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><circle transform="translate(${x} ${y}) scale(${sx} ${sy})" cx="3.6" cy="3.6" r="1.8" fill="${col}"/>`
  return c(inset, inset, 1, 1) + c(CW - inset, inset, -1, 1) + c(inset, CH - inset, 1, -1) + c(CW - inset, CH - inset, -1, -1)
}
export const R = rng
export { f, pol, sparkle }
