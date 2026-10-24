// @ts-nocheck
// Ensambla una decoración sobre un avatar: [capa back] -> [foto] -> [capa front].
// Contrato geométrico: lienzo 288, avatar = círculo de 222 (r=111) centrado. Con `pad` el lienzo crece
// hacia afuera (alas grandes) sin mover el avatar.
import { Canvas } from '../core/svg.js'
import { makePalette } from '../core/color.js'
import { esc } from '../core/util.js'

let _uid = 0
export const nextUid = () => 'dp' + (++_uid).toString(36)

export function renderLayers(deco, { paletteId, hue = 0, uid } = {}) {
  const def = deco.palettes.find((p) => p.id === paletteId) || deco.palettes[0]
  const P = makePalette(def, hue)
  const id = uid || nextUid()
  const pad = deco.pad || 0
  const out = { back: '', front: '', pad, P }
  if (deco.back) {
    const S = new Canvas(id + 'b', pad)
    out.back = S.svg(deco.back(S, P))
  }
  if (deco.front) {
    const S = new Canvas(id + 'f', pad)
    out.front = S.svg(deco.front(S, P))
  }
  return out
}

// Foto por defecto (silueta) — se reemplaza por la foto real o la subida en la galería.
export const DEFAULT_PHOTO =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="dpbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b4a57"/><stop offset="1" stop-color="#2d1f2b"/></linearGradient></defs><rect width="100" height="100" fill="url(#dpbg)"/><circle cx="50" cy="38" r="15" fill="#d9c3b8"/><path d="M18 100C18 70 32 60 50 60S82 70 82 100Z" fill="#d9c3b8"/></svg>`

// HTML del avatar con decoración (size = diámetro del avatar en px)
export function avatarHTML({ deco, paletteId, hue = 0, size = 128, photo = null, mode = 'full', uid, extra = '' }) {
  const L = deco ? renderLayers(deco, { paletteId, hue, uid }) : { back: '', front: '', pad: 0 }
  const W = (288 / 222) * size
  const off = -(33 / 222) * size
  const box = `position:absolute;left:${off.toFixed(2)}px;top:${off.toFixed(2)}px;width:${W.toFixed(2)}px;height:${W.toFixed(2)}px;pointer-events:none`
  const ph = photo
    ? `<img src="${esc(photo)}" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block"/>`
    : DEFAULT_PHOTO
  return `<div class="dpw" data-mode="${mode}" style="position:relative;width:${size}px;height:${size}px;flex:none${extra}">${
    L.back ? `<div class="dpl dpl-back" style="${box}">${L.back}</div>` : ''
  }<div class="dpph" style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:50%;overflow:hidden;background:#2d1f2b">${ph}</div>${
    L.front ? `<div class="dpl dpl-front" style="${box}">${L.front}</div>` : ''
  }</div>`
}
