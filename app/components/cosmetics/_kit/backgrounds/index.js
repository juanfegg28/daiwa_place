// @ts-nocheck
import { makePalette } from '../core/color.js'
import { BgCanvas } from './lib.js'
import { nextUid } from '../avatar/render.js'
import { B1 } from './b1.js'
import { B2 } from './b2.js'
export const BACKGROUNDS = [...B1, ...B2].map((b) => ({ ...b, coll: b.coll || 'base' }))
// HTML del fondo (se pinta con object-fit: cover): <div class="dpl" style="position:absolute;inset:0">svg</div>
export function backgroundHTML(bg, { paletteId, hue = 0, uid } = {}) {
  const def = bg.palettes.find((p) => p.id === paletteId) || bg.palettes[0]
  const P = makePalette(def, hue)
  const S = new BgCanvas((uid || nextUid()) + 'bg')
  return `<div class="dpl bgl" style="position:absolute;inset:0;overflow:hidden">${S.svg(bg.art(S, P))}</div>`
}
