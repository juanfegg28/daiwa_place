// @ts-nocheck
// Tarjeta de perfil 340×420.  CAPAS (de abajo a arriba):
//   1) art     → fondo del CUERPO (empieza justo debajo del banner; se dibuja con (0,0) = borde inferior del banner)
//   2) banner  → IMAGEN DEL USUARIO (zona reservada 0..BH). La tarjeta NUNCA dibuja encima de esta zona.
//   3) frame   → marco/ornamentos, recortado a y ≥ BH (no toca el banner)
//   4) UI      → avatar, nombre, bio… (avatar sí puede solaparse con el banner, como en Discord)
import { makePalette, rgba, mix } from '../core/color.js'
import { esc } from '../core/util.js'
import { avatarHTML, nextUid } from '../avatar/render.js'
import { CardCanvas, CW, CH, BH } from './lib.js'

export function renderCardLayers(card, { paletteId, hue = 0, uid } = {}) {
  const def = card.palettes.find((p) => p.id === paletteId) || card.palettes[0]
  const P = makePalette(def, hue)
  const id = uid || nextUid()
  const S1 = new CardCanvas(id + 'a')
  const art = S1.svg(`<g transform="translate(0 ${BH + (card.dy || 0)})">${card.art(S1, P)}</g>`)
  let frame = ''
  if (card.frame) {
    const S2 = new CardCanvas(id + 'g')
    const clip = S2.clip(`<rect x="0" y="${BH}" width="${CW}" height="${CH - BH}"/>`)
    frame = S2.svg(`<g clip-path="${clip}"><g transform="translate(0 ${BH - 132})">${card.frame(S2, P)}</g></g>`)
  }
  return { art, frame, P }
}

export const DEMO = {
  name: 'Luna Valdés', handle: '@lunavaldes', title: 'Alma nocturna',
  bio: 'Colecciono estrellas, playlists y atardeceres. Vengo a hacer amigos ☾',
  since: 'oct 2026', level: 12, moons: '1.240', friends: 86,
}
// banners de ejemplo (en la app son imágenes del usuario). Sirven para probar choques de color.
export const DEMO_BANNERS = [
  'linear-gradient(120deg,#2d6cdf,#8e44ec 55%,#f0509b)',
  'radial-gradient(circle at 30% 30%,#ffd166,#ef476f 60%,#5b2a86)',
  'linear-gradient(160deg,#0f2027,#2c5364 60%,#7dd3c0)',
  'repeating-linear-gradient(45deg,#e9e9ef 0 14px,#d6d6e0 14px 28px)',
]

// o: { bannerless (true = zona reservada vacía: el adaptador pone el banner real del usuario), card, paletteId, hue, deco, decoPaletteId, nameHTML, fontFamily, data, photo, banner, bannerIdx, uid }
export function cardHTML(o) {
  const { card } = o
  const uid = o.uid || nextUid()
  const { art, frame, P } = renderCardLayers(card, { paletteId: o.paletteId, hue: o.hue, uid })
  const d = { ...DEMO, ...(o.data || {}) }
  const light = card.tone === 'light'
  const ink = light ? mix('#1b1420', P.d1, 0.18) : '#ffffff'
  const mut = light ? rgba(ink, 0.68) : 'rgba(255,255,255,.72)'
  const panel = light ? 'rgba(255,255,255,.55)' : rgba(P.d2, 0.3)
  const line = light ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.14)'
  const av = avatarHTML({ deco: o.deco, paletteId: o.decoPaletteId, hue: o.decoHue || 0, size: 80, photo: o.photo, uid: uid + 'av' })
  const nameHTML = o.nameHTML || `<span style="font-family:${o.fontFamily || 'Georgia,serif'}">${esc(d.name)}</span>`
  const banner = o.banner || DEMO_BANNERS[(o.bannerIdx || 0) % DEMO_BANNERS.length]
  const stat = (v, l) => `<div style="flex:1;text-align:center;padding:6px 0;border-radius:10px;background:${rgba(P.d1, 0.14)};border:1px solid ${rgba(P.d1, 0.32)}"><div style="font-weight:700;font-size:14px">${v}</div><div style="font-size:9.5px;color:${mut};letter-spacing:.6px">${l}</div></div>`
  const badge = (c, i) => `<span style="width:26px;height:26px;border-radius:8px;display:inline-grid;place-items:center;background:${rgba(c, 0.22)};border:1px solid ${rgba(c, 0.55)};font-size:13px;color:${light ? mix(c, '#000', 0.35) : c}">${['★', '♥', '☾', '✦'][i % 4]}</span>`
  return `<div class="pcw" data-card="${card.slug}" style="position:relative;width:${CW}px;height:${CH}px;border-radius:22px;overflow:hidden;flex:none;--ink:${ink};--mut:${mut};--ac:${P.d1};color:${ink};font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:${P.d2}">
<div class="dpl pcl" style="position:absolute;inset:0">${art}</div>
${o.bannerless ? `<div class="pcb" style="position:absolute;left:0;top:0;width:${CW}px;height:${BH}px"></div>` : `<div class="pcb" style="position:absolute;left:0;top:0;width:${CW}px;height:${BH}px;background:${banner};background-size:cover;background-position:center"><span style="position:absolute;right:8px;top:6px;font-size:9px;letter-spacing:.8px;color:rgba(255,255,255,.7);background:rgba(0,0,0,.28);padding:2px 6px;border-radius:99px">BANNER DEL USUARIO</span></div>`}
${frame ? `<div class="dpl pcl" style="position:absolute;inset:0;pointer-events:none">${frame}</div>` : ''}
<div class="pcp" style="position:absolute;left:12px;right:12px;top:${BH + 128}px;bottom:12px;border-radius:16px;background:${panel};backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:1px solid ${line};padding:10px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:6px;overflow:hidden;text-shadow:${light ? 'none' : '0 1px 4px rgba(0,0,0,.6)'}">
  <div style="font-size:9.5px;letter-spacing:1.2px;font-weight:700;color:${mut}">SOBRE MÍ</div>
  <div style="font-size:12px;line-height:1.35;color:${ink}">${esc(d.bio)}</div>
  <div style="display:flex;gap:8px">${stat('Nv ' + d.level, 'NIVEL')}${stat('☾ ' + d.moons, 'LUNAS')}${stat(d.friends, 'AMIGOS')}</div>
  <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;gap:6px">${[P.d1, P.d4, P.d3, P.d1].map(badge).join('')}</div><div style="font-size:10.5px;color:${mut};text-align:right;line-height:1.2">Miembro desde <b style="color:${ink}">${esc(d.since)}</b></div></div>
</div>
<div style="position:absolute;left:18px;top:${BH - 40}px;border-radius:50%;box-shadow:0 0 0 5px ${light ? 'rgba(255,255,255,.75)' : rgba(P.d2, 0.9)}">${av}</div>
<div style="position:absolute;left:112px;right:16px;top:${BH + 8}px;text-shadow:${light ? '0 1px 0 rgba(255,255,255,.5)' : '0 1px 6px rgba(0,0,0,.8)'}"><div style="font-size:23px;line-height:1.1;font-weight:700">${nameHTML}</div>
  <div style="display:flex;gap:8px;align-items:center;font-size:12px;color:${mut};margin-top:5px"><span style="padding:1px 7px;border-radius:99px;background:${light ? 'rgba(255,255,255,.55)' : 'rgba(8,4,14,.42)'}">${esc(d.handle)}</span>${o.titleHTML || `<span style="padding:2px 8px;border-radius:99px;background:${rgba(P.d1, 0.25)};border:1px solid ${rgba(P.d1, 0.6)};color:${ink};font-size:11px;font-weight:600">${esc(d.title)}</span>`}</div></div>
</div>`
}
