// @ts-nocheck
// SANGRE NOIR (crimson) · EMO ABISMO (emo) — versión 1.5.0
import { META } from './meta.js'
import { fl } from './kit.js'
import { rng } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'

const M = (slug, o) => ({ ...META[slug], ...o })
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const dot = (c, g = 8) => `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${c};box-shadow:0 0 ${g}px ${c}"></b>`
const bat = (c, w = 40) => `<svg viewBox="0 0 60 30" width="${w}" height="${w / 2}" aria-hidden="true"><path d="M30 8C27 3 24 3 22 7C16 1 7 1 0 7C6 9 8 12 7 16C11 12 15 13 17 17C19 14 22 14 24 18C26 14 28 12 30 18C32 12 34 14 36 18C38 14 41 14 43 17C45 13 49 12 53 16C52 12 54 9 60 7C53 1 44 1 38 7C36 3 33 3 30 8Z" fill="${c}"/></svg>`
const batHang = (c) => `<g fill="${c}"><path d="M20 16C14 12 8 14 4 22C10 20 14 22 15 28C17 24 20 24 20 24C20 24 23 24 25 28C26 22 30 20 36 22C32 14 26 12 20 16Z" transform="translate(2 0)"/><ellipse cx="22" cy="12" rx="5" ry="6" fill="${c}"/><path d="M18 8L16 2L21 6ZM26 8L28 2L23 6Z"/></g>`
const heart = (c, w = 'currentColor') => `<path d="M30 54C8 38 2 24 8 14C14 5 26 8 30 18C34 8 46 5 52 14C58 24 52 38 30 54Z" fill="${c}"/>`

export const C1 = [
  M('altar-carmesi', {
    css: '@container (max-width:560px){.sk-altar-carmesi .cn{opacity:.3}}',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.1)} 0,${P.d2} 40%,${dk(P.d2, 0.3)})`)
      // nicho gótico con luz roja
      bg += K.fill(`background:radial-gradient(ellipse 46% 60% at 50% 0,${rgba(P.d1, 0.26)},transparent 70%)`)
      const arch = `<path d="M0 240V90Q0 18 70 0Q140 18 140 90V240Z" fill="none" stroke="${rgba(P.d3, 0.18)}" stroke-width="1.6"/><path d="M14 240V92Q14 34 70 16Q126 34 126 92V240" fill="none" stroke="${rgba(P.d1, 0.4)}" stroke-width="1"/>`
      bg += K.pattern(160, 240, `<g transform="translate(10 0)">${arch}</g>`, { style: fade('#000 0,#000 40%,transparent 100%') })
      bg += K.fill(`background:linear-gradient(0deg,${rgba(P.d1, 0.18)},transparent 120px)`)
      // gotas de sangre/cera desde el borde superior
      const R = rng(44); let dr = ''
      for (let i = 0; i < 5; i++) { const x = 8 + i * 22 + R() * 6, h = 14 + R() * 34; dr += `<path d="M${x - 3} 0V${h - 4}Q${x - 3} ${h} ${x} ${h + 3}Q${x + 3} ${h} ${x + 3} ${h - 4}V0Z" fill="${P.d1}"/><circle cx="${x}" cy="${h}" r="3.4" fill="${P.d1}"/><rect x="${x - 3}" y="0" width="1.4" height="${h - 2}" fill="${rgba('#fff', 0.25)}"/>` }
      bg += K.tile(`<rect width="120" height="6" fill="${P.d1}"/>` + dr, 120, 56, { x: true, t: '0', l: '0', r: '0', h: '56px', style: `transform-origin:50% 0;animation:sk-drip 6s ease-in-out infinite;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6))` })
      // fila de velas
      const R2 = rng(7)
      const candle = (x, h, w) => `<rect x="${x}" y="${70 - h}" width="${w}" height="${h}" rx="2" fill="${lt(P.d3, 0.7)}"/><rect x="${x}" y="${70 - h}" width="${w * 0.35}" height="${h}" fill="rgba(0,0,0,.15)"/><path d="M${x + 1} ${70 - h}Q${x + w * 0.4} ${70 - h + 14} ${x + w * 0.35} ${70 - h + 4}Z" fill="${P.d1}"/><rect x="${x + w / 2 - 0.5}" y="${70 - h - 5}" width="1" height="5" fill="#222"/>`
      const flame = (cx, cy, d) => `<g style="transform-origin:${cx}px ${cy}px;animation:sk-flick ${1.6 + d}s ease-in-out ${-d}s infinite"><ellipse cx="${cx}" cy="${cy - 7}" rx="9" ry="12" fill="${rgba(P.d4, 0.25)}"/><path d="M${cx} ${cy - 15}C${cx + 6} ${cy - 7} ${cx + 4} ${cy - 1} ${cx} ${cy}C${cx - 4} ${cy - 1} ${cx - 6} ${cy - 7} ${cx} ${cy - 15}Z" fill="${P.d4}" style="filter:drop-shadow(0 0 5px ${P.d4})"/><path d="M${cx} ${cy - 9}C${cx + 2} ${cy - 5} ${cx + 1.5} ${cy - 2} ${cx} ${cy - 1}C${cx - 1.5} ${cy - 2} ${cx - 2} ${cy - 5} ${cx} ${cy - 9}Z" fill="#fff6d8"/></g>`
      let cs = '', fs = ''
      ;[[10, 28, 9, 0], [26, 40, 10, 0.5], [44, 22, 8, 1.1], [58, 34, 10, 0.3], [76, 26, 9, 0.9], [92, 42, 10, 0.2]].forEach(([x, h, w, d]) => { cs += candle(x, h, w); fs += flame(x + w / 2, 70 - h - 5, d) })
      bg += K.box('0 0 110 80', cs + fs, { w: fl(260, 0.45), b: '-6px', r: '3%', cls: 'cn', style: 'overflow:visible' })
      bg += K.fill(`background:radial-gradient(ellipse 30% 14% at 85% 100%,${rgba(P.d4, 0.4)},transparent 70%);animation:sk-flick 3s infinite`)
      bg += K.parts(9, { kind: 'rise', seed: 8, html: dot(P.d4, 8), size: [2, 4], dur: [9, 16], dx: [-14, 14], o: 0.8 })
      bg += K.grain(0.08)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(180deg,${rgba(P.d1, 0.85)},${rgba(P.d1, 0.2)} 45%,${rgba(P.d1, 0.1)} 70%,${rgba(P.d4, 0.45)})`, glow: rgba(P.d1, 0.35) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.4), 0.8), '--sk-line': rgba(P.d1, 0.45) } }
    },
  }),

  M('nido-de-murcielagos', {
    css: '',
    build: (K, P) => {
      const R = rng(18)
      let bg = K.fill(`background:linear-gradient(180deg,${dk(P.d2, 0.1)} 0,${P.d2} 60%,${dk(P.d2, 0.35)})`)
      // luna sangrienta entre las rocas
      bg += K.glow('80%', '150px', 320, P.d1, 0.3)
      bg += `<div class="sk-b" style="left:80%;top:150px;width:clamp(48px,8cqw,78px);aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle at 38% 34%,${lt(P.d1, 0.45)},${P.d1} 60%,${dk(P.d1, 0.4)});box-shadow:0 0 50px ${rgba(P.d1, 0.7)}"></div>`
      // murciélagos volando frente a la luna
      bg += K.parts(6, { kind: 'float', seed: 22, x0: 30, x1: 95, y0: 12, y1: 55, html: (i, r, sz) => bat(dk(P.d1, 0.55), 22 + (i % 3) * 8), size: [24, 40], dur: [6, 11], dx: [-60, 60], o: 0.95 })
      // estalactitas del techo (dos capas)
      const stal = (c, n, hmin, hmax) => { let d = 'M0 0'; let x = 0; const W = 200; while (x < W) { const w = 14 + R() * 20, h = hmin + R() * (hmax - hmin); d += `L${x} 0L${x + w * 0.5} ${h}L${x + w} 0`; x += w } return `<path d="${d}V0H0Z" fill="${c}"/>` }
      bg += K.tile(stal(mix(P.d2, P.d1, 0.3), 0, 24, 60), 200, 64, { x: true, t: '0', l: '0', r: '0', h: '64px', style: 'opacity:.95' })
      bg += K.tile(stal(mix(P.d2, P.d1, 0.16), 0, 14, 38), 200, 40, { x: true, t: '0', l: '0', r: '0', h: '40px', size: '170px 40px' })
      // murciélagos colgados de las estalactitas
      const hang = (x, s, sw) => K.box('0 0 40 40', batHang(dk(P.d1, 0.6)), { w: `width:${s}px`, t: '14px', l: x, style: `transform-origin:50% 0;animation:sk-sway ${sw}s ease-in-out infinite` })
      bg += hang('9%', 30, 5) + hang('26%', 24, 6.5) + hang('55%', 28, 5.8) + hang('71%', 22, 7)
      // paredes de roca a los lados
      bg += K.svg('0 0 80 600', `<path d="M0 0H44Q22 60 50 110Q18 170 46 230Q10 300 40 360Q8 440 34 520Q16 560 28 600H0Z" fill="${mix(P.d2, P.d1, 0.2)}"/>`, { pos: 'none', style: 'inset:0 auto 0 0;width:clamp(20px,4cqw,40px);height:100%' })
      bg += K.svg('0 0 80 600', `<path d="M0 0H44Q22 60 50 110Q18 170 46 230Q10 300 40 360Q8 440 34 520Q16 560 28 600H0Z" fill="${dk(P.d2, 0.6)}" transform="translate(80 0) scale(-1 1)"/>`, { pos: 'none', style: 'inset:0 0 0 auto;width:clamp(20px,4cqw,40px);height:100%' })
      bg += K.fill(`background:radial-gradient(ellipse 70% 12% at 40% 96%,${rgba(P.d3, 0.1)},transparent 70%);animation:sk-drift 12s ease-in-out infinite`)
      bg += K.fill(`background:linear-gradient(0deg,${rgba(P.d1, 0.2)},transparent 80px)`)
      bg += K.grain(0.1)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(180deg,${rgba(P.d1, 0.8)},${rgba(P.d1, 0.15)} 45%,${rgba(P.d1, 0.1)} 75%,${rgba(P.d4, 0.5)})`, glow: rgba(P.d1, 0.3) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.45), 0.82), '--sk-line': rgba(P.d1, 0.4) } }
    },
  }),

  M('habitacion-emo', {
    css: '@container (max-width:560px){.sk-habitacion-emo .hide-sm{display:none}}',
    build: (K, P) => {
      let bg = K.fill(`background:${P.d2}`)
      // pared con rayas finas y manchas
      bg += K.fill(`background:repeating-linear-gradient(90deg,transparent 0 22px,${rgba(P.d1, 0.07)} 22px 24px),radial-gradient(ellipse 50% 40% at 90% 0,${rgba(P.d1, 0.18)},transparent 70%),radial-gradient(ellipse 50% 40% at 0 90%,${rgba(P.d4, 0.1)},transparent 70%)`)
      // pósters (arte propio, abstracto) pegados con cinta
      const tape = (x, y, r) => `<rect x="${x}" y="${y}" width="26" height="9" fill="${rgba('#fff', 0.35)}" transform="rotate(${r} ${x + 13} ${y + 4})"/>`
      const p1 = `<g transform="rotate(-5 40 50)"><rect width="80" height="100" fill="#111" stroke="${rgba(P.d4, 0.5)}"/>${heart(P.d1).replace('<path', '<path transform="translate(14 12) scale(.9)"')}<path d="M10 78H70M10 86H50" stroke="${P.d4}" stroke-width="3"/><path d="M52 14L40 36H50L42 56L62 30H51Z" fill="#fff"/>${tape(27, -4, -4)}</g>`
      const p2 = `<g transform="rotate(4 40 50)"><rect width="80" height="100" fill="${P.d1}"/><circle cx="40" cy="40" r="22" fill="#0a070c"/><path d="M28 36L38 46M38 36L28 46M44 36L54 46M54 36L44 46" stroke="${P.d1}" stroke-width="3" stroke-linecap="round"/><path d="M26 56Q40 70 54 56" stroke="${P.d1}" stroke-width="3" fill="none"/><rect y="78" width="80" height="22" fill="#0a070c"/><path d="M8 90H72" stroke="#fff" stroke-width="3" stroke-dasharray="6 4"/>${tape(27, -4, 5)}</g>`
      const p3 = `<g transform="rotate(-3 40 50)"><rect width="80" height="100" fill="#f3f3f6"/><path d="M0 0L80 100M80 0L0 100" stroke="#111" stroke-width="2" opacity=".15"/><path d="M40 16L46 34H64L50 45L55 62L40 51L25 62L30 45L16 34H34Z" fill="#111"/><path d="M12 82H68M12 90H48" stroke="${P.d1}" stroke-width="3"/>${tape(27, -4, -2)}</g>`
      bg += K.box('0 0 80 100', p1, { w: fl(78, 0.6), t: '76px', r: '4%', cls: 'hide-sm', style: 'filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))' })
      bg += K.box('0 0 80 100', p2, { w: fl(66, 0.6), t: '106px', r: '16%', cls: 'hide-sm', style: 'filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))' })
      // cadena de luces y estrellitas dibujadas
      bg += K.parts(9, { kind: 'twinkle', seed: 6, html: `<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0-9L2.6-2.8L9-2.6L4 1.6L5.6 8L0 4.4L-5.6 8L-4 1.6L-9-2.6L-2.6-2.8Z" fill="none" stroke="${P.d1}" stroke-width="1.4" stroke-linejoin="round"/></svg>`, size: [10, 18], dur: [3, 6], y0: 8, y1: 90 })
      // franja de tablero ajedrezado abajo + puntadas
      const chk = `<rect width="24" height="24" fill="${P.d4}" opacity=".9"/><rect width="12" height="12" fill="#0a070c"/><rect x="12" y="12" width="12" height="12" fill="#0a070c"/>`
      bg += K.tile(chk, 24, 24, { x: true, b: '0', l: '0', r: '0', h: '24px', style: 'opacity:.85' })
      bg += K.fill(`background:linear-gradient(0deg,${rgba('#000', 0.55)},transparent 60px)`)
      bg += K.grain(0.08)
      return { bg, radius: '16px', pb: '46px', fg: K.frame({ w: 2, grad: `repeating-linear-gradient(90deg,${P.d1} 0 10px,transparent 10px 16px)`, style: 'opacity:.9' }), vars: { '--sk-panel': rgba('#07050a', 0.82), '--sk-line': rgba(P.d1, 0.45), '--sk-pb': 'clamp(40px,6cqw,52px)' } }
    },
  }),

  M('tinta-y-lagrimas', {
    css: '',
    build: (K, P) => {
      const R = rng(23)
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.08)},${P.d2} 50%,${dk(P.d2, 0.3)})`)
      bg += K.fill(`background:radial-gradient(ellipse 50% 40% at 92% 6%,${rgba(P.d1, 0.2)},transparent 70%)`)
      // corazón roto cosido (marca de agua)
      const hr = `<path d="M60 108C16 76 4 48 16 28C28 10 52 16 60 36C68 16 92 10 104 28C116 48 104 76 60 108Z" fill="none" stroke="${P.d1}" stroke-width="3" stroke-linejoin="round"/><path d="M62 30L54 52L68 62L56 84L64 100" fill="none" stroke="${P.d2}" stroke-width="7" stroke-linejoin="round"/><path d="M62 30L54 52L68 62L56 84L64 100" fill="none" stroke="${P.d1}" stroke-width="2" stroke-linejoin="round" stroke-dasharray="5 4"/><path d="M40 40l10 10M50 40l-10 10M78 70l10 10M88 70l-10 10" stroke="${P.d4}" stroke-width="2.4" stroke-linecap="round"/>`
      bg += K.box('0 0 120 120', hr, { w: fl(240, 0.5), t: '-24px', r: '-18px', style: `opacity:.55;filter:drop-shadow(0 0 8px ${rgba(P.d1, 0.5)})`, rot: 10 })
      // goteo de tinta desde arriba (alto, irregular)
      let dr = `<rect width="260" height="8" fill="${dk(P.d2, 0.5)}"/>`
      for (let i = 0; i < 7; i++) { const x = 10 + i * 36 + R() * 14, h = 20 + R() * 70, w = 3 + R() * 3; dr += `<path d="M${x - w} 0V${h}Q${x - w} ${h + w * 1.5} ${x} ${h + w * 1.6}Q${x + w} ${h + w * 1.5} ${x + w} ${h}V0Z" fill="${dk(P.d2, 0.55)}"/><circle cx="${x}" cy="${h + w * 1.6}" r="${w * 0.9}" fill="${dk(P.d2, 0.55)}"/>` }
      bg += K.tile(dr + '', 260, 110, { x: true, t: '0', l: '0', r: '0', h: '110px', style: 'opacity:.95' })
      // lágrimas rosa/rojas cayendo
      bg += K.parts(9, { kind: 'fall', seed: 12, rot: 0, dx: [-8, 8], dur: [8, 15], size: [8, 14], o: 0.85, html: `<svg viewBox="0 0 20 28" width="100%" height="100%"><path d="M10 1C10 1 2 12 2 18A8 8 0 0 0 18 18C18 12 10 1 10 1Z" fill="${P.d1}"/><path d="M6 17A4 4 0 0 0 9 22" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>` })
      // garabatos: rayas y tachaduras en la esquina inferior
      bg += K.box('0 0 160 60', `<path d="M4 50L40 8M16 54L52 12M28 56L64 14M40 56L76 16" stroke="${rgba(P.d4, 0.45)}" stroke-width="2.2" stroke-linecap="round"/><path d="M96 36Q112 10 128 36T160 30" fill="none" stroke="${P.d1}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/><path d="M104 46L124 56M124 46L104 56" stroke="${P.d1}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`, { w: fl(180, 0.5), b: '4px', r: '4%', style: 'opacity:.8' })
      // salpicaduras de tinta
      let spl = ''; for (let i = 0; i < 16; i++) spl += `<circle cx="${(R() * 160) | 0}" cy="${(R() * 50) | 0}" r="${(0.8 + R() * 3).toFixed(1)}" fill="${rgba(P.d1, 0.45 + R() * 0.4)}"/>`
      bg += K.box('0 0 160 50', spl, { w: fl(170, 0.5), t: '120px', l: '-30px', style: 'opacity:.6' })
      bg += K.grain(0.12)
      return { bg, radius: '14px', fg: K.frame({ w: 1.6, grad: `linear-gradient(160deg,${rgba(P.d1, 0.9)},${rgba(P.d4, 0.2)} 40%,${rgba(P.d4, 0.1)} 70%,${rgba(P.d1, 0.7)})`, glow: rgba(P.d1, 0.25) }), vars: { '--sk-panel': rgba('#050407', 0.82), '--sk-line': rgba(P.d1, 0.4) } }
    },
  }),
]
