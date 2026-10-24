// @ts-nocheck
// TARJETA DE PERFIL v2 — "superficie fluida".
// La tarjeta NO es un póster de tamaño fijo: es la superficie que ENVUELVE los bloques reales del perfil
// (avatar + nombre + bio + canción + identidad + chips + contadores), como pide la spec (§7.1).
// Se adapta a cualquier ancho (celular 360 → PC 935) y a cualquier alto. El banner del usuario queda ARRIBA, fuera de ella.
//
//   <div class="sk">                      ← la superficie (borde redondeado, sin overflow para que el avatar sobresalga al banner)
//     <div class="sk-bg">…</div>          ← arte de fondo (recortado a la forma)
//     <div class="sk-in">TU CONTENIDO</div>
//     <div class="sk-fg">…</div>          ← marco y remates por encima, sin capturar toques
//   </div>
//
// Tokens que la tarjeta pone en --sk-* para que los bloques de adentro (bio, identidad, chips) se vean integrados:
//   --sk-ink  texto · --sk-mute texto atenuado · --sk-panel fondo de cada bloque · --sk-line borde de bloque
//   --sk-chip fondo de chip · --sk-accent color principal · --sk-accent-2 acento · --sk-r radio
import { f, rng } from '../core/util.js'
import { makePalette, mix, lt, dk, rgba, rot, luma } from '../core/color.js'
import { Canvas } from '../core/svg.js'

let U = 0
export const nextSkinUid = () => 'sk' + (++U).toString(36)
const n2 = (n) => Math.round(n * 100) / 100

// Ancho FLUIDO de un ornamento: `w` px cuando la tarjeta mide 935 px o más, y se encoge hasta el `min` % en celular.
// (cqw = % del ancho de la tarjeta; el px anterior es el respaldo de navegadores sin container queries)
export const fl = (w, min = 0.55) => `width:${w}px;width:clamp(${Math.round(w * min)}px,${n2(w / 9.35)}cqw,${w}px)`

export const BASE_SKIN_CSS = `
.sk{position:relative;isolation:isolate;container-type:inline-size;border-radius:var(--sk-rt,0px) var(--sk-rt,0px) var(--sk-r,28px) var(--sk-r,28px);color:var(--sk-ink);background:var(--sk-base,#0b0b10)}
.sk[data-seam=float]{--sk-rt:var(--sk-r,28px)}
.sk-bg,.sk-fr,.sk-fg{position:absolute;inset:0;border-radius:inherit;pointer-events:none}
.sk-bg{overflow:hidden;z-index:0}
.sk-in{position:relative;z-index:3;padding:var(--sk-pt,0) var(--sk-pad,clamp(20px,3.4cqw,32px)) var(--sk-pb,clamp(22px,3.4cqw,30px)) var(--sk-padl,var(--sk-pad,clamp(20px,3.4cqw,32px)))}
.sk-fg{z-index:2}
.sk-l{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block}
.sk-b{position:absolute;display:block;pointer-events:none}
.sk-fr{padding:var(--fw,1.5px);background:var(--fg);overflow:hidden;
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
 mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.sk-fr>i{position:absolute;left:50%;top:50%;width:280%;aspect-ratio:1;translate:-50% -50%;animation:sk-spin var(--sp,14s) linear infinite}
@keyframes sk-spin{to{rotate:360deg}}
.sk-pa{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.sk-p{position:absolute;display:block;animation-duration:var(--d,9s);animation-delay:var(--dl,0s);animation-iteration-count:infinite;animation-timing-function:linear;will-change:transform,opacity}
.sk-fall .sk-p{top:-24px;animation-name:sk-fall}
.sk-rise .sk-p{bottom:-16px;animation-name:sk-rise}
.sk-float .sk-p{animation-name:sk-float;animation-timing-function:ease-in-out;animation-direction:alternate}
.sk-twinkle .sk-p{animation-name:sk-tw;animation-timing-function:ease-in-out}
@keyframes sk-fall{0%{transform:translate(0,0) rotate(0);opacity:0}8%{opacity:var(--o,.85)}92%{opacity:var(--o,.85)}100%{transform:translate(var(--dx,30px),1100px) rotate(var(--rot,300deg));opacity:0}}
@keyframes sk-rise{0%{transform:translate(0,0);opacity:0}10%{opacity:var(--o,.9)}90%{opacity:var(--o,.9)}100%{transform:translate(var(--dx,20px),-1100px);opacity:0}}
@keyframes sk-float{0%{transform:translate(0,0);opacity:.25}50%{opacity:var(--o,1)}100%{transform:translate(var(--dx,14px),var(--dy,-16px));opacity:.35}}
@keyframes sk-tw{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:var(--o,1);transform:scale(1)}}
@keyframes sk-sway{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}
@keyframes sk-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes sk-slide{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}
@keyframes sk-flick{0%,100%{opacity:1}22%{opacity:.82}41%{opacity:1}63%{opacity:.7}80%{opacity:.95}}
@keyframes sk-drip{0%{transform:scaleY(.82)}50%{transform:scaleY(1)}100%{transform:scaleY(.82)}}
@keyframes sk-scan{0%{transform:translateY(-30%)}100%{transform:translateY(130%)}}
@keyframes sk-rain{to{background-position:-60px 160px}}
@keyframes sk-shoot{0%,70%{transform:translate(-80px,-40px) rotate(24deg);opacity:0}72%{opacity:1}88%{transform:translate(560px,230px) rotate(24deg);opacity:0}100%{opacity:0}}
@keyframes sk-glass{0%,100%{background-position:120% 0}50%{background-position:-20% 0}}
@keyframes sk-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes sk-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(26px)}}
@keyframes sk-rot{to{transform:rotate(360deg)}}
@keyframes sk-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.sk *{animation:none!important}.sk-p{opacity:.6}}
.sk[data-anim=off] *{animation:none!important}
`

// ───────── Kit de construcción (cada tarjeta recibe uno) ─────────
export class Kit {
  constructor(uid, P) {
    this.id = uid; this.P = P; this.S = new Canvas(uid); this.k = 0
    this.rand = rng(11)
  }
  nid(t = 'x') { return `${this.id}${t}${this.k++}` }
  // capa de fondo hecha solo con CSS (degradados, patrones): la herramienta principal
  fill(style, cls = '') { return `<div class="sk-l ${cls}" style="${style}"></div>` }
  // capa SVG a todo el tamaño; viewBox fijo anclado arriba (`pos`) o abajo. Arte vectorial que se recorta sin deformarse.
  svg(vb, inner, { pos = 'xMidYMin slice', style = '', cls = '' } = {}) {
    return `<svg class="sk-l ${cls}" viewBox="${vb}" preserveAspectRatio="${pos}" style="${style}" aria-hidden="true" focusable="false">${inner}</svg>`
  }
  // elemento SVG de tamaño propio, en una esquina/borde. at = { t,r,b,l (px o %), w (css), flipX, flipY, rot, style }
  box(vb, inner, at = {}) {
    const { w = 'width:120px', t, r, b, l, flipX, flipY, rot: rt, style = '', cls = '', origin } = at
    const pos = [t != null && `top:${t}`, r != null && `right:${r}`, b != null && `bottom:${b}`, l != null && `left:${l}`].filter(Boolean).join(';')
    const tf = [flipX && 'scaleX(-1)', flipY && 'scaleY(-1)', rt && `rotate(${rt}deg)`].filter(Boolean).join(' ')
    return `<svg class="sk-b ${cls}" viewBox="${vb}" style="${w};height:auto;${pos}${tf ? `;transform:${tf}` : ''}${origin ? `;transform-origin:${origin}` : ''};${style}" aria-hidden="true" focusable="false" overflow="visible">${inner}</svg>`
  }
  // patrón que rellena TODA la superficie (la baldosa mide tw×th px reales, no se estira)
  pattern(tw, th, inner, { rotate = 0, style = '', cls = '' } = {}) {
    const id = this.nid('p')
    return `<svg class="sk-l ${cls}" style="${style}" aria-hidden="true" focusable="false"><defs><pattern id="${id}" width="${tw}" height="${th}" patternUnits="userSpaceOnUse"${rotate ? ` patternTransform="rotate(${rotate})"` : ''}>${inner}</pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>`
  }
  // baldosa en tira: se repite en X (borde superior/inferior) o en Y (lateral). Entra como imagen de fondo.
  tile(inner, tw, th, { x = true, y = false, t, b, l, r, h, w, style = '', cls = '', size } = {}) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${th}" viewBox="0 0 ${tw} ${th}">${inner}</svg>`
    const url = `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`
    const rep = x && y ? 'repeat' : x ? 'repeat-x' : 'repeat-y'
    const pos = [t != null && `top:${t}`, b != null && `bottom:${b}`, l != null && `left:${l}`, r != null && `right:${r}`, h != null && `height:${h}`, w != null && `width:${w}`].filter(Boolean).join(';')
    return `<div class="sk-b ${cls}" style="${pos};background:${url} ${rep};background-size:${size || `${tw}px ${th}px`};${style}"></div>`
  }
  // marco con borde en degradado. spin = giro continuo de un haz de luz alrededor del borde.
  frame({ w = 1.5, grad, spin = 0, beam, glow, style = '' } = {}) {
    const g = grad || `linear-gradient(160deg,${rgba(this.P.d1, 0.7)},${rgba(this.P.d1, 0.1)} 40%,${rgba(this.P.d3, 0.35)})`
    const inner = spin ? `<i style="background:conic-gradient(from 0deg,transparent 0 62%,${beam || this.P.d3} 80%,transparent 92%);--sp:${spin}s"></i>` : ''
    return `<div class="sk-fr" style="--fw:${w}px;--fg:${g};${glow ? `filter:drop-shadow(0 0 6px ${glow});` : ''}${style}">${inner}</div>`
  }
  // resplandor (mancha de luz) — barata y muy efectiva
  glow(x, y, size, color, op = 0.5, { anim = '', style = '' } = {}) {
    return `<div class="sk-b" style="left:${x};top:${y};width:${size}px;height:${size}px;translate:-50% -50%;border-radius:50%;background:radial-gradient(closest-side,${rgba(color, op)},${rgba(color, 0)});${anim ? `animation:${anim};` : ''}${style}"></div>`
  }
  // campo de estrellas con UNA sola capa (box-shadow). Posiciones en px sobre un área de 1100×1500 que se recorta.
  stars(n, { seed = 5, color, big = '#fff', area = [1100, 1000], tw = 5, size = 1.4, square = false } = {}) {
    const R = rng(seed), c = color || this.P.d3
    let sh = '', sh2 = ''
    for (let i = 0; i < n; i++) {
      const x = Math.round(R() * area[0]), y = Math.round(R() * area[1]), r = R() < 0.18 ? 1 : 0, col = R() < 0.2 ? big : c
      const s = `${x}px ${y}px 0 ${r}px ${rgba(col, 0.55 + R() * 0.45)}`
      if (i % 2) sh += (sh ? ',' : '') + s; else sh2 += (sh2 ? ',' : '') + s
    }
    const one = (s, dl) => `<i class="sk-b" style="left:0;top:0;width:${size}px;height:${size}px;${square ? '' : 'border-radius:50%;'}box-shadow:${s};animation:sk-pulse ${tw}s ease-in-out ${dl}s infinite"></i>`
    return `<div class="sk-l">${one(sh, 0)}${one(sh2, -tw / 2)}</div>`
  }
  // partículas suaves (máx. 14 por tarjeta). kind: fall | rise | float | twinkle
  parts(n, { kind = 'float', html, seed = 3, x0 = 0, x1 = 100, y0 = 0, y1 = 100, dur = [8, 14], size = [6, 12], dx = [-30, 30], o = 0.85, rot: rt = 0 } = {}) {
    const R = rng(seed); n = Math.min(n, 14)
    let o_ = ''
    for (let i = 0; i < n; i++) {
      const sz = size[0] + R() * (size[1] - size[0]), d = dur[0] + R() * (dur[1] - dur[0])
      const st = `left:${n2(x0 + R() * (x1 - x0))}%;${kind === 'fall' ? '' : kind === 'rise' ? '' : `top:${n2(y0 + R() * (y1 - y0))}%;`}width:${n2(sz)}px;height:${n2(sz)}px;--d:${n2(d)}s;--dl:${n2(-R() * d)}s;--dx:${n2(dx[0] + R() * (dx[1] - dx[0]))}px;--dy:${n2(-8 - R() * 20)}px;--o:${n2(o * (0.6 + R() * 0.4))};--rot:${n2(rt * (R() < 0.5 ? -1 : 1) * (0.5 + R()))}deg`
      o_ += `<i class="sk-p" style="${st}">${typeof html === 'function' ? html(i, R, sz) : html}</i>`
    }
    return `<div class="sk-pa sk-${kind}">${o_}</div>`
  }
  // grano de película (textura): muy sutil, da "materia" a los degradados
  grain(op = 0.07, { blend = 'overlay', freq = 0.85 } = {}) {
    const id = this.nid('n')
    return `<svg class="sk-l" style="mix-blend-mode:${blend};opacity:${op}" aria-hidden="true" focusable="false"><filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.6 -.3"/></filter><rect width="100%" height="100%" filter="url(#${id})"/></svg>`
  }
  // viñeta: oscurece bordes para que el centro (donde va el texto) quede tranquilo
  vignette(color = '#000', op = 0.55, inner = 45) {
    return this.fill(`background:radial-gradient(ellipse 80% 70% at 50% 45%,transparent ${inner}%,${rgba(color, op)} 100%)`)
  }
  // defs de gradientes SVG creados con this.S (se declaran una vez al inicio de la capa de fondo)
  defs() { return this.S.defs.length ? `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${this.S.defs.join('')}</defs></svg>` : '' }
}

// ───────── Tokens por defecto según tono y paleta ─────────
export function baseVars(card, P) {
  const dark = card.tone !== 'light'
  if (dark) {
    const ink = lt(P.d3, 0.78)
    return {
      '--sk-base': P.d2, '--sk-ink': ink, '--sk-mute': rgba(ink, 0.66),
      '--sk-panel': rgba(dk(P.d2, 0.25), 0.72), '--sk-panel-2': rgba(P.d2, 0.55), '--sk-line': rgba(P.d1, 0.32), '--sk-chip': rgba(lt(P.d2, 0.12), 0.6),
      '--sk-accent': P.d1, '--sk-accent-2': P.d4, '--sk-glow': rgba(P.d1, 0.5),
    }
  }
  const ink = mix('#1b1420', P.d1, 0.18)
  return {
    '--sk-base': P.d2, '--sk-ink': ink, '--sk-mute': rgba(ink, 0.66),
    '--sk-panel': 'rgba(255,255,255,.62)', '--sk-panel-2': 'rgba(255,255,255,.5)', '--sk-line': rgba(dk(P.d1, 0.2), 0.22), '--sk-chip': 'rgba(255,255,255,.65)',
    '--sk-accent': dk(P.d1, 0.1), '--sk-accent-2': dk(P.d4, 0.15), '--sk-glow': rgba(P.d1, 0.4),
  }
}

// ───────── Render ─────────
// opts: { paletteId, hue, uid, content (HTML de adentro), seam: 'attached'|'float', anim: true|false }
export function skinParts(card, { paletteId, hue = 0, uid } = {}) {
  const def = card.palettes.find((p) => p.id === paletteId) || card.palettes[0]
  const P = makePalette(def, hue)
  const K = new Kit(uid || nextSkinUid(), P)
  const out = card.build(K, P) || {}
  const vars = { ...baseVars(card, P), ...(out.vars || {}) }
  if (out.radius) vars['--sk-r'] = out.radius
  if (out.pad) vars['--sk-pad'] = out.pad
  if (out.padl) vars['--sk-padl'] = out.padl
  return { slug: card.slug, tone: card.tone, vars, bg: K.defs() + (out.bg || ''), fg: out.fg || '' }
}

export function skinHTML(card, { paletteId, hue = 0, uid, content = '', seam = 'attached', anim = true } = {}) {
  const p = skinParts(card, { paletteId, hue, uid })
  const vs = Object.entries(p.vars).map(([k, v]) => `${k}:${v}`).join(';')
  return `<div class="sk sk-${p.slug}" data-skin="${p.slug}" data-tone="${p.tone}" data-seam="${seam}"${anim ? '' : ' data-anim="off"'} style="${vs}"><div class="sk-bg">${p.bg}</div><div class="sk-in">${content}</div><div class="sk-fg">${p.fg}</div></div>`
}

export { f, rng, mix, lt, dk, rgba, rot, luma, makePalette }
export const loadMeta = (meta, slug) => ({ ...meta[slug] })
