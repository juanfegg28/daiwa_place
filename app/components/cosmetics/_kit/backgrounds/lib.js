// @ts-nocheck
import { Canvas, sparkle } from '../core/svg.js'
import { f, rng, pol } from '../core/util.js'
export const BW = 480, BHt = 300
export class BgCanvas extends Canvas {
  svg(body) { return `<svg class="dps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BW} ${BHt}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false" style="display:block"><defs>${this.defs.join('')}</defs>${body}</svg>` }
}
export const full = (fill) => `<rect x="-40" y="-40" width="${BW + 80}" height="${BHt + 80}" fill="${fill}"/>`
export const vg = (S, st) => full(S.linU(st, 0, 0, 0, BHt))
export const bl = (S, x, y, r, c, op = 0.6) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${S.radB([[0, c, op], [1, c, 0]])}"/>`
export const vig = (S, c = '#000', op = 0.55) => full(S.rad([[0.5, c, 0], [1, c, op]], 240, 150, 300))
export const stars = (S, P, n, seed, y1 = BHt, col) => { const R = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = R() * BW, y = R() * y1, r = 0.5 + R() * (R() < 0.15 ? 2 : 0.9); o += R() < 0.22 ? sparkle(x, y, r * 2.6, col || P.d3, 'k-tw').replace('<path', `<path style="animation-delay:${-(R() * 3).toFixed(1)}s"`) : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col || P.d3}" opacity="${f(0.4 + R() * 0.6)}"/>` } return o }
export { sparkle, f, rng, pol }
