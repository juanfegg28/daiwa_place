// @ts-nocheck
// SAMURÁI · ACADEMIA · COSMOS · BOSQUE · ORO · LOFI
import { META } from './meta.js'
import { fl } from './kit.js'
import { rng } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'

const M = (slug, o) => ({ ...META[slug], ...o })
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const spark = (c) => `<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0-9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" fill="${c}"/></svg>`
const dot = (c, g = 8) => `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${c};box-shadow:0 0 ${g}px ${c}"></b>`

export const J1 = [
  // ───────── SAMURÁI ─────────
  M('pergamino-y-tinta', {
    css: '',
    build: (K, P) => {
      const ink = P.d4
      let bg = K.fill(`background:linear-gradient(180deg,${lt(P.d2, 0.35)},${P.d2} 70%,${dk(P.d2, 0.06)})`)
      bg += K.fill(`background:radial-gradient(ellipse 70% 50% at 20% 10%,rgba(255,255,255,.5),transparent 70%),radial-gradient(circle at 90% 90%,${rgba('#8a6a3a', 0.2)},transparent 40%),radial-gradient(circle at 5% 70%,${rgba('#8a6a3a', 0.12)},transparent 30%)`)
      bg += K.grain(0.35, { blend: 'multiply', freq: 0.55 })
      // montañas de tinta lavada
      bg += K.svg('0 0 1000 260', `<defs><filter id="${K.nid('b')}b"><feGaussianBlur stdDeviation="3"/></filter></defs><path d="M0 200C120 120 190 170 300 110C400 60 470 160 560 130C680 90 760 170 860 120C920 90 960 130 1000 120V260H0Z" fill="${rgba(ink, 0.2)}"/><path d="M0 230C140 170 260 220 380 180C520 130 640 220 780 180C880 150 950 190 1000 180V260H0Z" fill="${rgba(ink, 0.32)}"/><path d="M0 250C200 220 360 250 560 232C760 214 880 248 1000 236V260H0Z" fill="${rgba(ink, 0.45)}"/>`, { pos: 'xMidYMax slice', style: 'inset:auto;left:0;bottom:0;width:100%;height:clamp(90px,17cqw,170px);filter:blur(.6px)' })
      // pinceladas: ensō + salpicaduras
      bg += K.box('0 0 200 200', `<path d="M100 22C150 18 184 56 180 104C176 152 138 182 94 178C50 174 20 138 24 96C27 66 44 44 70 32" fill="none" stroke="${rgba(ink, 0.55)}" stroke-width="9" stroke-linecap="round" style="filter:blur(.3px)"/><path d="M100 22C150 18 184 56 180 104" fill="none" stroke="${rgba(ink, 0.35)}" stroke-width="3" stroke-linecap="round" transform="translate(2 3)"/>`, { w: fl(230, 0.5), t: '-46px', r: '-34px', style: 'opacity:.5' })
      const R = rng(30); let spl = ''
      for (let i = 0; i < 14; i++) spl += `<circle cx="${(R() * 200).toFixed(0)}" cy="${(R() * 60).toFixed(0)}" r="${(0.8 + R() * 3.4).toFixed(1)}" fill="${rgba(ink, 0.4 + R() * 0.3)}"/>`
      bg += K.box('0 0 200 60', spl, { w: fl(190, 0.6), b: '70px', r: '4%', style: 'opacity:.65' })
      // sello hanko
      bg += K.box('0 0 44 44', `<rect x="2" y="2" width="40" height="40" rx="4" fill="${P.d1}" transform="rotate(-4 22 22)"/><g stroke="${P.d2}" stroke-width="3.2" stroke-linecap="round" fill="none" transform="rotate(-4 22 22)"><path d="M12 12H32M22 12V32M12 24H20M26 22L33 32M11 33H33"/></g>`, { w: 'width:clamp(30px,4.6cqw,44px)', b: '14px', r: '5%', style: 'opacity:.92;filter:drop-shadow(0 1px 0 rgba(0,0,0,.2))' })
      // borde de rollo
      const roll = (top) => `<div class="sk-b" style="${top ? 'top' : 'bottom'}:0;left:0;right:0;height:12px;background:linear-gradient(${top ? '180deg' : '0deg'},${rgba(dk(P.d2, 0.35), 0.8)},${rgba(dk(P.d2, 0.1), 0.2)} 60%,transparent)"></div>`
      return { bg: bg + roll(true) + roll(false), radius: '10px', fg: `<div class="sk-b" style="inset:9px;border:1.5px solid ${rgba(ink, 0.55)};border-radius:6px"></div><div class="sk-b" style="inset:13px;border:.8px solid ${rgba(P.d1, 0.7)};border-radius:3px"></div>`, vars: { '--sk-ink': ink, '--sk-mute': rgba(ink, 0.66), '--sk-panel': 'rgba(255,252,242,.66)', '--sk-line': rgba(ink, 0.3), '--sk-chip': 'rgba(255,252,242,.75)', '--sk-accent': P.d1 } }
    },
  }),

  M('torii-al-amanecer', {
    css: '@container (max-width:560px){.sk-torii-al-amanecer .tori{opacity:.4}}',
    build: (K, P) => {
      const R = rng(14)
      let bg = K.fill(`background:linear-gradient(180deg,${P.d2} 0,${mix(P.d2, P.d1, 0.4)} 62%,${mix(P.d1, P.d3, 0.35)} 100%)`)
      bg += K.stars(30, { seed: 6, color: P.d3, tw: 6 }).replace('class="sk-l"', `class="sk-l" style="${fade('#000 0,#000 30%,transparent 55%').replace(/;/g, ';')}"`)
      // sol grande
      bg += K.glow('72%', '78%', 480, P.d3, 0.5)
      bg += `<div class="sk-b" style="left:72%;top:78%;width:clamp(120px,24cqw,230px);aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,${lt(P.d3, 0.5)},${P.d3} 60%,${P.d1});box-shadow:0 0 60px ${rgba(P.d3, 0.7)}"></div>`
      const mtn = (c, y, a) => { let d = `M0 ${y}`; for (let x = 0; x <= 1000; x += 60) d += `L${x} ${(y - a * (0.3 + R() * 0.7)).toFixed(0)}`; return `<path d="${d}L1000 300V300H0Z" fill="${c}"/>` }
      bg += K.svg('0 0 1000 300', mtn(rgba(mix(P.d2, P.d1, 0.45), 0.9), 190, 70) + mtn(rgba(mix(P.d2, P.d1, 0.25), 0.95), 230, 60) + mtn(dk(P.d2, 0.2), 270, 40), { pos: 'xMidYMax slice', style: 'inset:auto;left:0;bottom:0;width:100%;height:clamp(140px,26cqw,250px)' })
      // torii
      const t = P.d4
      bg += K.box('0 0 140 130', `<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(t, 0.15)}"/><stop offset="1" stop-color="${dk(t, 0.3)}"/></linearGradient></defs><path d="M2 24Q70 38 138 24L132 12Q70 24 8 12Z" fill="${dk(t, 0.35)}"/><path d="M0 12Q70 26 140 12L136 4Q70 16 4 4Z" fill="url(#t)"/><rect x="14" y="30" width="112" height="9" fill="url(#t)"/><rect x="26" y="26" width="12" height="104" fill="url(#t)"/><rect x="102" y="26" width="12" height="104" fill="url(#t)"/><rect x="62" y="22" width="16" height="16" fill="${dk(t, 0.2)}"/>`, { w: fl(230, 0.4), b: '-4px', r: '6%', cls: 'tori', style: `filter:drop-shadow(0 0 14px ${rgba(P.d1, 0.5)})` })
      bg += K.fill(`background:radial-gradient(ellipse 70% 20% at 50% 100%,${rgba(P.d3, 0.3)},transparent 70%)`)
      bg += K.parts(8, { kind: 'fall', seed: 9, rot: 360, dx: [-50, 40], dur: [12, 20], size: [8, 13], o: 0.85, html: `<svg viewBox="-8 -8 16 16" width="100%" height="100%"><path d="M0 7C-6 4-7-4 0-7C7-4 6 4 0 7Z" fill="${lt(P.d1, 0.45)}"/></svg>` })
      bg += K.grain(0.06)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(160deg,${rgba(P.d3, 0.8)},${rgba(P.d1, 0.2)} 50%,${rgba(P.d4, 0.7)})`, glow: rgba(P.d3, 0.25) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.3), 0.74), '--sk-line': rgba(P.d3, 0.35) } }
    },
  }),

  // ───────── ACADEMIA ─────────
  M('biblioteca', {
    css: '',
    build: (K, P) => {
      const R = rng(40), cols = [P.d1, P.d4, dk(P.d1, 0.35), mix(P.d1, P.d4, 0.5), '#6b2b2b', '#2e4a5a', '#5a4a2a', '#3a2f4a', '#7a5a2a']
      let shelf = '', x = 2
      while (x < 236) { const w = 8 + R() * 12, h = 40 + R() * 24, c = cols[(R() * cols.length) | 0], lean = R() < 0.07; shelf += `<g transform="${lean ? `rotate(${(R() * 10 + 6).toFixed(0)} ${x + w} 76)` : ''}"><rect x="${x.toFixed(1)}" y="${(76 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.2" fill="${c}"/><rect x="${x.toFixed(1)}" y="${(76 - h).toFixed(1)}" width="2" height="${h.toFixed(1)}" fill="rgba(255,255,255,.18)"/><rect x="${(x + 1).toFixed(1)}" y="${(76 - h + 8).toFixed(1)}" width="${(w - 2).toFixed(1)}" height="2.4" fill="${P.d3}" opacity=".7"/><rect x="${(x + 1).toFixed(1)}" y="${(76 - 12).toFixed(1)}" width="${(w - 2).toFixed(1)}" height="1.4" fill="${P.d3}" opacity=".5"/></g>`; x += w + 0.8 }
      shelf += `<rect y="76" width="240" height="10" fill="${dk(P.d1, 0.55)}"/><rect y="76" width="240" height="2" fill="${rgba('#fff', 0.2)}"/>`
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.1)},${P.d2} 55%,${dk(P.d2, 0.3)})`)
      // boiserie de madera: paneles verticales
      bg += K.fill(`background:repeating-linear-gradient(90deg,transparent 0 118px,rgba(0,0,0,.28) 118px 120px,${rgba(P.d3, 0.06)} 120px 122px,transparent 122px 240px);${fade('#000 0,#000 60%,rgba(0,0,0,.5) 100%')}`)
      bg += K.fill(`background:repeating-linear-gradient(180deg,${rgba(P.d1, 0.06)} 0 3px,transparent 3px 9px)`)
      bg += K.fill(`background:radial-gradient(ellipse 50% 40% at 12% 0,${rgba(P.d3, 0.34)},transparent 70%),radial-gradient(ellipse 60% 25% at 50% 100%,rgba(0,0,0,.4),transparent 70%)`)
      bg += K.tile(shelf, 240, 86, { x: true, b: '0', l: '0', r: '0', h: '86px', style: 'filter:brightness(.82)' })
      // lámpara de banquero + cono de luz
      bg += K.fill(`background:conic-gradient(from 160deg at 12% -4%,transparent 0 0deg,${rgba(P.d3, 0.16)} 0 30deg,transparent 30deg);${fade('#000 0,#000 35%,transparent 80%')}`)
      bg += K.box('0 0 60 40', `<path d="M4 34Q4 6 30 4Q56 6 56 34Z" fill="${P.d4}"/><path d="M4 34Q30 28 56 34V38H4Z" fill="${dk(P.d4, 0.35)}"/><path d="M10 14Q30 6 50 14" fill="none" stroke="${rgba('#fff', 0.35)}" stroke-width="2"/>`, { w: 'width:clamp(34px,5cqw,52px)', t: '-4px', l: '9%', style: `filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))` })
      bg += K.parts(10, { kind: 'float', seed: 3, x0: 2, x1: 40, y0: 4, y1: 50, html: dot(rgba(P.d3, 0.8), 4), size: [2, 4], dur: [8, 14] })
      bg += K.grain(0.1)
      return { bg, radius: '14px', pb: '96px', fg: `<div class="sk-fr" style="--fw:3px;--fg:linear-gradient(135deg,${lt(P.d1, 0.2)},${dk(P.d1, 0.4)} 40%,${P.d1} 60%,${dk(P.d1, 0.5)})"></div><div class="sk-b" style="inset:9px;border:1px solid ${rgba(P.d4, 0.5)};border-radius:8px"></div>`, vars: { '--sk-panel': rgba(dk(P.d2, 0.25), 0.82), '--sk-line': rgba(P.d4, 0.35), '--sk-pb': 'clamp(96px,12cqw,100px)' } }
    },
  }),

  // ───────── COSMOS ─────────
  M('observatorio', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.12)},${P.d2})`)
      bg += K.fill(`background:radial-gradient(ellipse 50% 45% at 88% 10%,${rgba(P.d1, 0.3)},transparent 70%),radial-gradient(ellipse 55% 40% at 5% 80%,${rgba(P.d4, 0.2)},transparent 70%),radial-gradient(ellipse 40% 30% at 50% 100%,${rgba(P.d1, 0.2)},transparent 70%)`)
      bg += K.stars(70, { seed: 17, color: P.d3, tw: 5 })
      // astrolabio: anillos con marcas, girando lento
      const ticks = (r, n, len, a) => Array.from({ length: n }, (_, i) => { const t = (i / n) * 6.2832; return `M${(100 + Math.cos(t) * r).toFixed(1)} ${(100 + Math.sin(t) * r).toFixed(1)}L${(100 + Math.cos(t) * (r - len)).toFixed(1)} ${(100 + Math.sin(t) * (r - len)).toFixed(1)}` }).join('')
      const astro = `<g fill="none" stroke="${P.d3}" stroke-linecap="round"><circle cx="100" cy="100" r="96" stroke-width="1.6" opacity=".8"/><g style="transform-origin:100px 100px;animation:sk-rot 120s linear infinite"><path d="${ticks(92, 72, 6)}" stroke-width="1" opacity=".7"/><path d="${ticks(92, 12, 12)}" stroke-width="1.6"/></g><circle cx="100" cy="100" r="74" stroke-width="1" stroke-dasharray="2 5" opacity=".7"/><g style="transform-origin:100px 100px;animation:sk-rot 60s linear infinite reverse"><ellipse cx="100" cy="100" rx="74" ry="26" stroke="${P.d4}" stroke-width="1.4" transform="rotate(-24 100 100)"/><circle cx="168" cy="78" r="5" fill="${P.d4}" stroke="none"/></g><circle cx="100" cy="100" r="46" stroke-width="1" opacity=".6"/><path d="M100 4V196M4 100H196" stroke-width=".6" opacity=".4"/><circle cx="100" cy="100" r="16" fill="${rgba(P.d1, 0.55)}" stroke="${P.d3}" stroke-width="1.2"/></g>`
      bg += K.box('0 0 200 200', astro, { w: fl(340, 0.55), t: '-78px', r: '-62px', style: `opacity:.72;filter:drop-shadow(0 0 8px ${rgba(P.d1, 0.5)})` })
      bg += K.box('0 0 200 200', astro, { w: fl(190, 0.5), b: '-84px', l: '-62px', style: 'opacity:.3', rot: 30 })
      bg += `<div class="sk-b" style="left:0;top:120px;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px ${P.d3},-30px -14px 14px ${rgba(P.d3, 0.35)};animation:sk-shoot 11s linear 3s infinite"></div>`
      bg += K.parts(6, { kind: 'twinkle', seed: 5, html: (i) => spark([P.d3, P.d4, '#fff'][i % 3]), size: [10, 17], dur: [3, 6], y0: 4, y1: 96 })
      bg += K.grain(0.05)
      return { bg, fg: K.frame({ w: 1.4, grad: `linear-gradient(160deg,${rgba(P.d3, 0.7)},${rgba(P.d1, 0.15)} 45%,${rgba(P.d4, 0.55)})`, glow: rgba(P.d1, 0.3) }) }
    },
  }),

  M('eclipse', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${P.d2},${mix(P.d2, P.d1, 0.06)})`)
      bg += K.stars(46, { seed: 31, color: P.d3, tw: 6 })
      // corona del eclipse
      const cx = '88%', cy = '38px', D = 'clamp(110px,22cqw,240px)'
      bg += `<div class="sk-b" style="left:${cx};top:${cy};width:calc(${D}*3.2);aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,${rgba(P.d1, 0.85)} 0,${rgba(P.d1, 0.38)} 17%,${rgba(P.d4, 0.14)} 34%,transparent 62%);animation:sk-pulse 6s ease-in-out infinite"></div>`
      bg += `<div class="sk-b" style="left:${cx};top:${cy};width:calc(${D}*2.9);aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:repeating-conic-gradient(from 0deg,${rgba(P.d3, 0.5)} 0 1.2deg,transparent 1.2deg 7deg,${rgba(P.d3, 0.25)} 7deg 8deg,transparent 8deg 15deg);-webkit-mask-image:radial-gradient(circle,transparent 18%,#000 24%,transparent 62%);mask-image:radial-gradient(circle,transparent 18%,#000 24%,transparent 62%);animation:sk-rot 140s linear infinite"></div>`
      bg += `<div class="sk-b" style="left:${cx};top:${cy};width:${D};aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:#000;box-shadow:0 0 0 2px ${rgba(P.d3, 0.9)},0 0 24px 6px ${rgba(P.d1, 0.9)},0 0 80px 18px ${rgba(P.d1, 0.45)}"></div>`
      // anillo de diamante
      bg += `<div class="sk-b" style="left:calc(${cx} - ${D}*.5);top:calc(${cy} - ${D}*.08);width:10px;height:10px;translate:-50% -50%;border-radius:50%;background:#fff;box-shadow:0 0 14px 6px #fff,0 0 36px 12px ${P.d1};animation:sk-pulse 3s ease-in-out infinite"></div>`
      bg += K.fill(`background:radial-gradient(ellipse 90% 30% at 50% 100%,${rgba(P.d1, 0.22)},transparent 70%)`)
      bg += K.fill(`background:linear-gradient(0deg,${rgba(P.d4, 0.12)},transparent 60px)`)
      bg += K.parts(6, { kind: 'twinkle', seed: 2, html: (i) => spark([P.d3, P.d1, '#fff'][i % 3]), size: [9, 15], dur: [3, 6], y0: 20, y1: 96 })
      bg += K.grain(0.05)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(160deg,${rgba(P.d3, 0.85)},${rgba(P.d1, 0.2)} 40%,${rgba(P.d1, 0.1)} 70%,${rgba(P.d4, 0.6)})`, spin: 20, beam: P.d3, glow: rgba(P.d1, 0.3) }) }
    },
  }),

  // ───────── BOSQUE ─────────
  M('claro-del-bosque', {
    css: '',
    build: (K, P) => {
      const R = rng(55)
      const trees = (c, n, hmin, hmax, W) => { let s = '', x = -10; while (x < W) { const w = 36 + R() * 40, h = hmin + R() * (hmax - hmin); s += `<path d="M${x} 300L${x + w / 2} ${300 - h}L${x + w} 300Z" fill="${c}"/><path d="M${x + w * 0.1} ${300 - h * 0.45}L${x + w / 2} ${300 - h * 0.9}L${x + w * 0.9} ${300 - h * 0.45}Z" fill="${c}"/>`; x += w * (0.55 + R() * 0.3) } return s }
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.14)},${P.d2} 50%,${dk(P.d2, 0.3)})`)
      bg += K.fill(`background:radial-gradient(ellipse 40% 55% at 50% 0,${rgba(P.d3, 0.22)},transparent 72%)`)
      bg += `<div class="sk-b" style="left:50%;top:44px;width:clamp(36px,6cqw,58px);aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle at 38% 36%,#fff,${P.d3} 65%);box-shadow:0 0 40px 8px ${rgba(P.d3, 0.45)}"></div>`
      // rayos de luna entre las copas
      bg += K.fill(`background:conic-gradient(from 170deg at 55% -8%,transparent 0 0deg,${rgba(P.d3, 0.13)} 4deg,transparent 10deg 16deg,${rgba(P.d3, 0.1)} 20deg,transparent 28deg);${fade('#000 0,#000 30%,transparent 80%')}`)
      bg += K.svg('0 0 1000 300', trees(rgba(mix(P.d2, P.d1, 0.26), 0.9), 18, 120, 210, 1100), { pos: 'xMidYMax slice', style: 'inset:auto;left:0;bottom:0;width:100%;height:clamp(110px,20cqw,200px);opacity:.9' })
      bg += K.svg('0 0 1000 300', trees(dk(P.d2, 0.45), 14, 150, 260, 1100), { pos: 'xMidYMax slice', style: 'inset:auto;left:0;bottom:-12px;width:100%;height:clamp(110px,20cqw,200px)' })
      // árboles laterales (copas oscuras al borde)
      bg += K.svg('0 0 120 600', `<path d="M0 0H70Q40 40 76 80Q34 120 70 160Q30 210 62 250Q22 300 54 340Q16 400 44 450Q10 520 40 600H0Z" fill="${dk(P.d2, 0.5)}"/>`, { pos: 'none', style: 'inset:0 auto 0 0;width:clamp(26px,5cqw,52px);height:100%;opacity:.9' })
      bg += K.svg('0 0 120 600', `<path d="M0 0H70Q40 40 76 80Q34 120 70 160Q30 210 62 250Q22 300 54 340Q16 400 44 450Q10 520 40 600H0Z" fill="${dk(P.d2, 0.5)}" transform="scale(-1 1) translate(-120 0)"/>`, { pos: 'none', style: 'inset:0 0 0 auto;width:clamp(26px,5cqw,52px);height:100%;opacity:.9' })
      // niebla
      bg += K.fill(`background:radial-gradient(ellipse 70% 14% at 30% 88%,${rgba(P.d3, 0.14)},transparent 70%),radial-gradient(ellipse 60% 12% at 78% 94%,${rgba(P.d3, 0.12)},transparent 70%);animation:sk-drift 14s ease-in-out infinite`)
      // luciérnagas
      bg += K.parts(12, { kind: 'float', seed: 13, y0: 12, y1: 92, html: dot(P.d4, 10), size: [3, 6], dur: [5, 10], dx: [-30, 30], o: 1 })
      bg += K.grain(0.07)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(160deg,${rgba(P.d3, 0.6)},${rgba(P.d1, 0.2)} 50%,${rgba(P.d4, 0.45)})`, glow: rgba(P.d1, 0.25) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.25), 0.78) } }
    },
  }),

  // ───────── ORO ─────────
  M('palacio-dorado', {
    css: '',
    build: (K, P) => {
      const gold = P.d1, gg = `linear-gradient(135deg,${dk(gold, 0.25)},${lt(gold, 0.55)} 24%,${dk(gold, 0.2)} 50%,${lt(gold, 0.45)} 76%,${dk(gold, 0.2)})`
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, gold, 0.08)},${P.d2} 55%,${dk(P.d2, 0.3)})`)
      // abanico art déco
      const fan = `<g fill="none" stroke="${rgba(gold, 0.3)}" stroke-width="1"><path d="M0 40A40 40 0 0 1 80 40"/><path d="M10 40A30 30 0 0 1 70 40"/><path d="M20 40A20 20 0 0 1 60 40"/><path d="M30 40A10 10 0 0 1 50 40"/><path d="M40 40V0M40 40L12 12M40 40L68 12" opacity=".6"/><path d="M-40 40A40 40 0 0 1 0 0M80 0A40 40 0 0 1 120 40" opacity=".7"/></g>`
      bg += K.pattern(80, 40, fan, { style: fade('#000 0,#000 40%,rgba(0,0,0,.22) 100%') })
      bg += K.fill(`background:radial-gradient(ellipse 60% 45% at 50% 0,${rgba(P.d3, 0.3)},transparent 70%),radial-gradient(ellipse 80% 25% at 50% 100%,${rgba(gold, 0.16)},transparent 70%)`)
      // rayos de sol deco (centro superior)
      bg += K.fill(`background:repeating-conic-gradient(from -50deg at 50% 0,${rgba(gold, 0.22)} 0 2deg,transparent 2deg 10deg);-webkit-mask-image:radial-gradient(ellipse 70% 52% at 50% 0,#000,transparent 85%);mask-image:radial-gradient(ellipse 70% 52% at 50% 0,#000,transparent 85%)`)
      // destello recorriendo el marco
      bg += K.fill(`background:linear-gradient(115deg,transparent 42%,${rgba(P.d3, 0.18)} 50%,transparent 58%);background-size:260% 100%;animation:sk-glass 9s ease-in-out infinite`)
      // esquinas escalonadas
      const step = `<g fill="none" stroke="url(#gx)" stroke-width="2.4"><path d="M3 60V22H12V12H22V3H60"/><path d="M12 34V30H20V20H30V12H34" opacity=".8"/></g><defs><linearGradient id="gx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lt(gold, 0.55)}"/><stop offset="1" stop-color="${dk(gold, 0.2)}"/></linearGradient></defs><rect x="0" y="0" width="7" height="7" fill="${lt(gold, 0.45)}"/>`
      const corners = ['top:5px;left:5px', 'top:5px;right:5px;transform:scaleX(-1)', 'bottom:5px;left:5px;transform:scaleY(-1)', 'bottom:5px;right:5px;transform:scale(-1,-1)'].map((p) => `<svg class="sk-b" viewBox="0 0 64 64" style="width:clamp(34px,6cqw,56px);height:auto;${p}">${step}</svg>`).join('')
      bg += K.parts(8, { kind: 'twinkle', seed: 5, html: (i) => spark(i % 2 ? lt(gold, 0.5) : '#fff'), size: [9, 15], dur: [3, 6], y0: 4, y1: 96 })
      bg += K.grain(0.08)
      return { bg, radius: '16px', fg: `<div class="sk-fr" style="--fw:3.4px;--fg:${gg};filter:drop-shadow(0 0 8px ${rgba(gold, 0.35)})"></div><div class="sk-b" style="inset:10px;border:1px solid ${rgba(gold, 0.6)};border-radius:8px"></div>` + corners, vars: { '--sk-panel': rgba(dk(P.d2, 0.3), 0.8), '--sk-line': rgba(gold, 0.45) }, pad: 'clamp(26px,4.2cqw,40px)' }
    },
  }),

  // ───────── LOFI ─────────
  M('cuarto-de-noche', {
    css: '',
    build: (K, P) => {
      const R = rng(61)
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.1)},${P.d2} 60%,${dk(P.d2, 0.25)})`)
      bg += K.fill(`background:radial-gradient(ellipse 45% 35% at 8% 96%,${rgba(P.d4, 0.3)},transparent 70%),radial-gradient(ellipse 35% 30% at 92% 40%,${rgba(P.d1, 0.2)},transparent 70%)`)
      // ventana con ciudad nocturna y lluvia
      let city = '', x = 0
      while (x < 100) { const w = 8 + R() * 12, h = 16 + R() * 34; city += `<rect x="${x.toFixed(0)}" y="${(86 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${dk(P.d2, 0.4)}"/>`; for (let i = 0; i < 5; i++) if (R() < 0.5) city += `<rect x="${(x + 2 + R() * (w - 5)).toFixed(0)}" y="${(86 - h + 3 + R() * (h - 8)).toFixed(0)}" width="2" height="2.4" fill="${P.d4}" opacity=".85"/>`; x += w + 1 }
      const win = `<defs><linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(P.d2, P.d1, 0.45)}"/><stop offset="1" stop-color="${mix(P.d2, P.d4, 0.3)}"/></linearGradient><clipPath id="wc"><rect x="6" y="6" width="88" height="80" rx="2"/></clipPath></defs><rect x="0" y="0" width="100" height="92" rx="4" fill="${dk(P.d2, 0.5)}"/><g clip-path="url(#wc)"><rect x="6" y="6" width="88" height="80" fill="url(#n)"/><circle cx="72" cy="24" r="7" fill="${P.d3}" opacity=".9"/>${city}<path d="M14 0L8 20M32 0L26 24M52 0L46 18M70 0L64 22M88 0L82 20" stroke="${rgba('#fff', 0.5)}" stroke-width=".8" style="animation:sk-pulse 1.4s linear infinite"/></g><path d="M50 6V86M6 46H94" stroke="${dk(P.d2, 0.5)}" stroke-width="3"/><rect x="0" y="0" width="100" height="92" rx="4" fill="none" stroke="${rgba(P.d3, 0.35)}" stroke-width="2"/><rect x="-4" y="88" width="108" height="6" rx="2" fill="${dk(P.d2, 0.6)}"/>`
      bg += K.box('0 0 100 96', win, { w: fl(112, 0.58), t: '76px', r: '5%', style: 'opacity:.95' })
      // luces de hadas colgando arriba
      const bulbs = Array.from({ length: 10 }, (_, i) => { const t = (i + 0.5) / 10, x = t * 400, y = 6 + Math.sin(t * 3.1416) * 22 - (i % 2 ? 0 : 3); return `<circle cx="${x.toFixed(0)}" cy="${(y + 5).toFixed(0)}" r="3.6" fill="${[P.d4, P.d1, P.d3][i % 3]}" style="filter:drop-shadow(0 0 5px ${[P.d4, P.d1, P.d3][i % 3]});animation:sk-flick ${3 + (i % 4)}s ${-i * 0.7}s infinite"/>` }).join('')
      bg += K.svg('0 0 400 44', `<path d="M-4 4Q100 36 200 28T404 4" fill="none" stroke="${rgba(P.d3, 0.5)}" stroke-width="1.2"/>` + bulbs.replace(/cy="(\d+)"/g, (m, y) => `cy="${Math.round(y * 0.8 + 4)}"`), { pos: 'xMidYMin slice', style: 'inset:0 0 auto 0;width:100%;height:clamp(30px,6cqw,56px)' })
      // planta + taza humeante abajo izquierda
      bg += K.box('0 0 60 70', `<path d="M30 70C22 58 6 54 2 34C14 36 24 44 30 56C30 38 28 22 36 6C46 22 40 46 34 62C44 52 54 48 58 36C58 54 46 64 30 70Z" fill="${dk(P.d4, 0.5)}" opacity=".7"/><path d="M14 70H46L42 56H18Z" fill="${dk(P.d1, 0.4)}"/>`, { w: 'width:clamp(40px,7cqw,66px)', b: '0', r: '3%' })
      bg += K.parts(5, { kind: 'rise', seed: 4, x0: 88, x1: 94, html: dot(rgba(P.d3, 0.5), 6), size: [4, 7], dur: [6, 10], dx: [-6, 10], o: 0.4 })
      bg += K.grain(0.1)
      return { bg, fg: K.frame({ w: 1.4, grad: `linear-gradient(160deg,${rgba(P.d4, 0.6)},${rgba(P.d1, 0.15)} 50%,${rgba(P.d3, 0.4)})`, glow: rgba(P.d4, 0.2) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.3), 0.78) } }
    },
  }),
]
