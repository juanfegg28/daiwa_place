// @ts-nocheck
// MÁGICA · NEÓN · PIXEL — Cielo estelar · Grimorio · Terminal HUD · Neón lluvioso · Pantalla de inicio · Menú RPG
import { META } from './meta.js'
import { fl } from './kit.js'
import { rng } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'

const M = (slug, o) => ({ ...META[slug], ...o })
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const spark = (c) => `<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0-9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" fill="${c}"/></svg>`
const dot = (c, g = 8) => `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${c};box-shadow:0 0 ${g}px ${c}"></b>`

// pieza de esquina (se reutiliza girada en las 4 esquinas)
const corner = (c, w = 2) => `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"><path d="M3 60V14Q3 3 14 3H60"/><path d="M11 40V20Q11 11 20 11H40" opacity=".6"/><circle cx="3" cy="3" r="3.4" fill="${c}" stroke="none"/><path d="M16 16Q28 16 28 28" opacity=".5"/></g>`
const four = (K, c, w, size = 'clamp(34px,6cqw,56px)') => ['top:6px;left:6px', 'top:6px;right:6px;transform:scaleX(-1)', 'bottom:6px;left:6px;transform:scaleY(-1)', 'bottom:6px;right:6px;transform:scale(-1,-1)'].map((p) => `<svg class="sk-b" viewBox="0 0 64 64" style="width:${size};height:${size};${p}" aria-hidden="true">${corner(c, w)}</svg>`).join('')

export const M1 = [
  M('cielo-estelar', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.22)} 0,${P.d2} 55%,${dk(P.d2, 0.3)} 100%)`)
      bg += K.fill(`background:radial-gradient(ellipse 55% 45% at 85% 12%,${rgba(P.d1, 0.34)},transparent 70%),radial-gradient(ellipse 50% 40% at 8% 70%,${rgba(P.d4, 0.2)},transparent 70%),radial-gradient(ellipse 60% 30% at 55% 100%,${rgba(P.d1, 0.22)},transparent 70%)`)
      bg += K.stars(60, { seed: 8, color: P.d3, tw: 5 })
      // luna creciente con halo
      bg += K.glow('90%', '84px', 170, P.d4, 0.35)
      bg += K.box('0 0 60 60', `<defs><mask id="mn"><rect width="60" height="60" fill="#fff"/><circle cx="40" cy="24" r="22" fill="#000"/></mask></defs><circle cx="28" cy="30" r="24" fill="${P.d4}" mask="url(#mn)" style="filter:drop-shadow(0 0 8px ${P.d4})"/>`, { w: fl(78, 0.7), t: '48px', r: '4.5%' })
      // constelación
      const pts = [[10, 80], [46, 52], [88, 66], [128, 30], [160, 54], [190, 18]]
      const con = `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join('')}" fill="none" stroke="${rgba(P.d3, 0.45)}" stroke-width="1" stroke-dasharray="3 4"/>` + pts.map(([x, y], i) => `<g transform="translate(${x} ${y})"><circle r="${i % 2 ? 2.6 : 3.4}" fill="${P.d3}"/><circle r="8" fill="${rgba(P.d3, 0.2)}"/></g>`).join('')
      bg += K.box('0 0 200 100', con, { w: fl(230, 0.55), t: '6px', l: '34%', style: 'opacity:.85' })
      bg += `<div class="sk-b" style="left:0;top:90px;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px ${P.d3},-26px -12px 14px ${rgba(P.d3, 0.35)};animation:sk-shoot 9s linear 2s infinite"></div>`
      bg += K.parts(7, { kind: 'twinkle', seed: 3, html: (i) => spark([P.d3, P.d4, '#fff'][i % 3]), size: [10, 18], dur: [3, 6], y0: 4, y1: 96 })
      // dunas de nebulosa abajo
      bg += K.svg('0 0 1000 200', `<path d="M0 120C140 80 260 150 420 110C580 70 720 130 1000 90V200H0Z" fill="${rgba(P.d1, 0.2)}"/><path d="M0 150C200 120 340 170 520 140C700 110 840 160 1000 130V200H0Z" fill="${rgba(P.d4, 0.14)}"/>`, { pos: 'xMidYMax slice', style: 'inset:auto;bottom:0;left:0;width:100%;height:clamp(90px,16cqw,160px)' })
      bg += K.grain(0.05)
      return { bg, fg: K.frame({ w: 1.5, grad: `linear-gradient(160deg,${rgba(P.d3, 0.7)},${rgba(P.d1, 0.2)} 45%,${rgba(P.d4, 0.5)})`, glow: rgba(P.d1, 0.3) }) }
    },
  }),

  M('grimorio', {
    css: '',
    build: (K, P) => {
      const gold = P.d4
      const gg = `linear-gradient(135deg,${dk(gold, 0.15)},${lt(gold, 0.5)} 30%,${dk(gold, 0.3)} 55%,${lt(gold, 0.35)} 80%,${gold})`
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.1)},${P.d2} 60%,${dk(P.d2, 0.35)})`)
      // piel curtida (grano grueso + manchas)
      bg += K.fill(`background:radial-gradient(circle at 12% 22%,rgba(0,0,0,.28) 0 6%,transparent 26%),radial-gradient(circle at 80% 70%,rgba(0,0,0,.25) 0 5%,transparent 24%),radial-gradient(circle at 60% 12%,${rgba(P.d3, 0.07)},transparent 30%)`)
      bg += K.grain(0.2, { blend: 'soft-light', freq: 0.6 })
      // cuerdas del lomo (izquierda) con costuras
      bg += K.fill(`background:linear-gradient(90deg,rgba(0,0,0,.5) 0,transparent 5%),repeating-linear-gradient(180deg,transparent 0 22px,${rgba(gold, 0.55)} 22px 24px,transparent 24px 40px);width:10px;right:auto;-webkit-mask-image:none;`)
      // círculo rúnico (marca de agua)
      const runes = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * 6.2832, r = 82; const x = 100 + Math.cos(a) * r, y = 100 + Math.sin(a) * r; return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 57.3 + 90).toFixed(0)})" d="M0 -5V5M-3 -2L0 -5L3 -2M-3 3L3 1" stroke="${gold}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` }).join('')
      const circle = `<g style="transform-origin:100px 100px;animation:sk-rot 90s linear infinite"><circle cx="100" cy="100" r="96" fill="none" stroke="${gold}" stroke-width="1.6"/><circle cx="100" cy="100" r="68" fill="none" stroke="${gold}" stroke-width="1"/>${runes}</g><path d="M100 36L156 134H44Z M100 164L44 66H156Z" fill="none" stroke="${gold}" stroke-width="1.4" stroke-linejoin="round" opacity=".8"/><circle cx="100" cy="100" r="9" fill="none" stroke="${gold}" stroke-width="1.6"/><circle cx="100" cy="100" r="3" fill="${gold}"/>`
      bg += K.box('0 0 200 200', circle, { w: fl(330, 0.6), t: '-70px', r: '-60px', style: `opacity:.42;filter:drop-shadow(0 0 6px ${rgba(P.d1, 0.6)})` })
      // cinta marcapáginas
      bg += K.box('0 0 24 120', `<path d="M0 0H24V120L12 104L0 120Z" fill="${P.d1}"/><path d="M0 0H8V114L0 120Z" fill="${rgba('#000', 0.25)}"/>`, { w: 'width:clamp(10px,1.6cqw,15px)', t: '-2px', r: 'clamp(6px,1cqw,12px)', style: 'filter:drop-shadow(0 4px 4px rgba(0,0,0,.5))' })
      bg += K.parts(9, { kind: 'rise', seed: 5, html: (i) => spark(i % 2 ? P.d1 : P.d4), size: [8, 14], dur: [10, 18], dx: [-20, 20], o: 0.8 })
      return {
        bg, padl: 'clamp(26px,4.2cqw,40px)',
        fg: `<div class="sk-fr" style="--fw:3px;--fg:${gg};filter:drop-shadow(0 0 6px ${rgba(gold, 0.3)})"></div><div class="sk-b" style="inset:10px;border:1px solid ${rgba(gold, 0.55)};border-radius:calc(var(--sk-r,28px) - 8px)"></div>` + four(K, gold, 2.2),
        vars: { '--sk-panel': rgba(dk(P.d2, 0.3), 0.78), '--sk-line': rgba(gold, 0.4) }, radius: '20px',
      }
    },
  }),

  M('terminal-hud', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.07)},${P.d2})`)
      bg += K.pattern(28, 28, `<path d="M28 0H0V28" fill="none" stroke="${rgba(P.d1, 0.13)}"/><circle cx="0" cy="0" r="1.3" fill="${rgba(P.d1, 0.4)}"/>`, { style: fade('#000 0,#000 40%,rgba(0,0,0,.35) 100%') })
      bg += K.fill(`background:repeating-linear-gradient(180deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px)`)
      bg += K.fill(`background:radial-gradient(ellipse 60% 45% at 88% 0,${rgba(P.d1, 0.22)},transparent 70%)`)
      // barra de escaneo
      bg += `<div class="sk-b" style="left:0;right:0;top:0;height:46px;background:linear-gradient(180deg,transparent,${rgba(P.d1, 0.13)} 70%,${rgba(P.d1, 0.34)} 96%,transparent);animation:sk-scan 7s linear infinite"></div>`
      // lecturas HUD arriba a la derecha
      const bars = Array.from({ length: 16 }, (_, i) => `<rect x="${i * 9}" y="${34 - (8 + ((i * 37) % 24))}" width="5" height="${8 + ((i * 37) % 24)}" fill="${i % 5 === 0 ? P.d4 : P.d1}" opacity=".85"/>`).join('')
      const hud = `${bars}<path d="M0 40H144" stroke="${rgba(P.d1, 0.6)}"/><path d="M0 48H60M70 48H100M110 48H144" stroke="${rgba(P.d1, 0.4)}" stroke-dasharray="4 3"/><circle cx="176" cy="20" r="15" fill="none" stroke="${rgba(P.d1, 0.7)}" stroke-width="1.4"/><circle cx="176" cy="20" r="9" fill="none" stroke="${P.d4}" stroke-dasharray="14 6" style="transform-origin:176px 20px;animation:sk-rot 8s linear infinite"/><path d="M176 5V35M161 20H191" stroke="${rgba(P.d1, 0.4)}"/>`
      bg += K.box('0 0 200 56', hud, { w: fl(190, 0.6), t: '14px', r: '5%', style: 'opacity:.9' })
      // esquinas HUD (rectas)
      const br = (c) => `<path d="M2 26V2H26" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M8 36V8H36" fill="none" stroke="${rgba(c, 0.4)}" stroke-width="1"/>`
      const corners = ['top:8px;left:8px', 'top:8px;right:8px;transform:scaleX(-1)', 'bottom:8px;left:8px;transform:scaleY(-1)', 'bottom:8px;right:8px;transform:scale(-1,-1)'].map((p) => `<svg class="sk-b" viewBox="0 0 40 40" style="width:clamp(22px,4cqw,38px);height:auto;${p};filter:drop-shadow(0 0 4px ${P.d1})" aria-hidden="true">${br(P.d1)}</svg>`).join('')
      bg += K.parts(4, { kind: 'twinkle', seed: 2, html: dot(P.d4, 6), size: [3, 5], dur: [2, 4], y0: 8, y1: 94 })
      return {
        bg, radius: '10px',
        fg: K.frame({ w: 1.2, grad: `linear-gradient(135deg,${rgba(P.d1, 0.9)},${rgba(P.d1, 0.2)} 40%,${rgba(P.d1, 0.2)} 60%,${rgba(P.d4, 0.7)})`, spin: 9, beam: P.d3, glow: rgba(P.d1, 0.4) }) + corners,
        vars: { '--sk-panel': rgba(P.d2, 0.82), '--sk-line': rgba(P.d1, 0.5), '--sk-chip': rgba(P.d1, 0.12) },
      }
    },
  }),

  M('neon-lluvioso', {
    css: '',
    build: (K, P) => {
      const R = rng(21)
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.25)} 0,${P.d2} 45%,${dk(P.d2, 0.4)} 100%)`)
      bg += K.fill(`background:radial-gradient(ellipse 60% 40% at 15% 6%,${rgba(P.d1, 0.35)},transparent 70%),radial-gradient(ellipse 60% 40% at 90% 30%,${rgba(P.d4, 0.3)},transparent 70%)`)
      // skyline con ventanas encendidas
      let sky = '', x = 0
      while (x < 1000) { const w = 40 + R() * 60, h = 50 + R() * 120; sky += `<rect x="${x.toFixed(0)}" y="${(220 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${dk(P.d2, 0.45)}"/>`; for (let wy = 220 - h + 10; wy < 214; wy += 14) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (R() < 0.3) sky += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="7" fill="${R() < 0.5 ? P.d4 : P.d3}" opacity="${(0.25 + R() * 0.4).toFixed(2)}"/>`; x += w + 4 }
      bg += K.svg('0 0 1000 220', sky, { pos: 'xMidYMax slice', style: 'inset:auto;left:0;bottom:0;width:100%;height:clamp(64px,10cqw,100px);opacity:.8' })
      // letrero de neón
      bg += K.box('0 0 150 60', `<g fill="none" stroke-linecap="round" stroke-width="4"><path d="M8 50V12L40 50V12" stroke="${P.d1}" style="filter:drop-shadow(0 0 6px ${P.d1}) drop-shadow(0 0 14px ${P.d1})"/><circle cx="76" cy="32" r="18" stroke="${P.d4}" style="filter:drop-shadow(0 0 6px ${P.d4}) drop-shadow(0 0 14px ${P.d4});animation:sk-flick 3.6s infinite"/><path d="M110 12V50M110 12H140M110 31H134" stroke="${P.d1}" style="filter:drop-shadow(0 0 6px ${P.d1}) drop-shadow(0 0 14px ${P.d1});animation:sk-flick 5s 1s infinite"/></g>`, { w: fl(170, 0.5), t: '66px', r: '5%', style: 'opacity:.95' })
      // lluvia
      bg += K.fill(`background:repeating-linear-gradient(104deg,transparent 0 17px,${rgba(P.d3, 0.28)} 17px 18px,transparent 18px 40px);background-size:60px 160px;animation:sk-rain .7s linear infinite;${fade('#000 0,#000 60%,transparent 100%')}`)
      bg += K.fill(`background:repeating-linear-gradient(104deg,transparent 0 9px,${rgba(P.d3, 0.16)} 9px 10px,transparent 10px 27px);background-size:44px 110px;animation:sk-rain 1.1s linear infinite`)
      // charco reflejo
      bg += K.fill(`background:linear-gradient(0deg,${rgba(P.d1, 0.28)},transparent 80px)`)
      bg += K.grain(0.06)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(120deg,${P.d1},${rgba(P.d1, 0.1)} 35%,${rgba(P.d4, 0.1)} 65%,${P.d4})`, glow: rgba(P.d1, 0.45) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.35), 0.78), '--sk-line': rgba(P.d1, 0.45) } }
    },
  }),

  M('pantalla-de-inicio', {
    css: '',
    build: (K, P) => {
      const px = (c, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
      let bg = K.fill(`background:linear-gradient(180deg,${P.d2} 0,${mix(P.d2, P.d1, 0.35)} 100%);image-rendering:pixelated`)
      bg += K.pattern(8, 8, '', {})
      // estrellas cuadradas parpadeando
      bg += K.stars(46, { seed: 9, color: P.d3, tw: 3, size: 3, square: true, area: [1100, 700] })
      // nubes de pixeles
      const cl = (c) => px(c, 8, 8, 40, 8) + px(c, 0, 16, 64, 8) + px(c, 16, 0, 16, 8) + px(c, 8, 24, 48, 8)
      bg += K.box('0 0 64 32', cl(rgba('#fff', 0.85)), { w: fl(112, 0.5), t: '90px', r: '5%', style: 'shape-rendering:crispEdges;animation:sk-drift 14s steps(14) infinite' })
      bg += K.box('0 0 64 32', cl(rgba(P.d3, 0.6)), { w: fl(80, 0.6), t: '230px', r: '30%', style: 'shape-rendering:crispEdges;animation:sk-drift 20s steps(20) infinite' })
      // colinas + suelo de ladrillo
      bg += K.svg('0 0 400 60', px(dk(P.d1, 0.3), 0, 28, 400, 32) + [[0, 20, 96], [112, 12, 120], [256, 22, 100], [340, 14, 60]].map(([x, y, w]) => px(dk(P.d1, 0.3), x, y, w, 8) + px(dk(P.d1, 0.3), x + 8, y - 8, w - 16, 8)).join(''), { pos: 'xMidYMax slice', style: 'shape-rendering:crispEdges;inset:auto;left:0;bottom:30px;width:100%;height:clamp(40px,8cqw,80px);opacity:.3' })
      const grass = px(P.d4, 0, 0, 16, 4) + px(dk(P.d4, 0.3), 0, 4, 16, 4) + px('#6b3f1e', 0, 8, 16, 8) + px('#4a2a12', 4, 10, 4, 2) + px('#4a2a12', 12, 13, 3, 2)
      bg += K.tile(grass, 16, 16, { x: true, b: '0', l: '0', r: '0', h: '16px', size: '24px 24px', style: 'height:24px;image-rendering:pixelated' })
      bg += `<div class="sk-b" style="left:calc(var(--sk-pad,24px) + 2px);top:10px;width:10px;height:10px;background:${P.d4};animation:sk-blink 1s steps(1) infinite"></div>`
      const bd = (c, c2) => `<div class="sk-b" style="inset:0;box-shadow:inset 0 0 0 4px ${c},inset 0 0 0 8px ${c2},inset 0 0 0 10px ${rgba('#000', 0.55)}"></div>`
      return { bg, radius: '6px', pad: 'clamp(26px,4.4cqw,40px)', fg: bd(P.d4, P.d1) + ['top:0;left:0', 'top:0;right:0', 'bottom:0;left:0', 'bottom:0;right:0'].map((p) => `<i class="sk-b" style="${p};width:10px;height:10px;background:${P.d2}"></i>`).join(''), vars: { '--sk-panel': rgba('#000', 0.55), '--sk-line': rgba(P.d4, 0.7), '--sk-chip': rgba('#000', 0.45) } }
    },
  }),

  M('menu-rpg', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d1, P.d3, 0.2)} 0,${P.d1} 30%,${P.d2} 100%)`)
      bg += K.fill(`background:repeating-linear-gradient(180deg,rgba(255,255,255,.04) 0 2px,rgba(0,0,0,.08) 2px 4px)`)
      bg += K.fill(`background:radial-gradient(ellipse 70% 50% at 50% 0,${rgba(P.d3, 0.3)},transparent 72%)`)
      // diamantes de relleno
      bg += K.pattern(48, 48, `<path d="M24 14L34 24L24 34L14 24Z" fill="none" stroke="${rgba(P.d3, 0.14)}" stroke-width="1.5"/><rect x="22" y="22" width="4" height="4" fill="${rgba(P.d3, 0.2)}"/>`, { style: fade('#000 0,#000 35%,transparent 90%') })
      // cursor-mano animado + gemas
      const gem = (c) => `<path d="M12 0L24 10L12 26L0 10Z" fill="${c}" stroke="#fff" stroke-width="1.5"/><path d="M0 10H24M12 0L7 10L12 26L17 10Z" fill="none" stroke="#fff" stroke-opacity=".6"/>`
      bg += K.box('0 0 24 26', gem(P.d4), { w: 'width:clamp(14px,2.4cqw,22px)', t: '18px', r: '5%', style: 'filter:drop-shadow(0 0 6px ' + P.d4 + ');animation:sk-bob 2.4s ease-in-out infinite' })
      bg += K.box('0 0 24 26', gem(P.d3), { w: 'width:clamp(10px,1.6cqw,15px)', t: '36px', r: '9%', style: 'animation:sk-bob 3s ease-in-out .5s infinite' })
      bg += K.parts(6, { kind: 'twinkle', seed: 7, html: (i) => spark(i % 2 ? '#fff' : P.d4), size: [9, 15], dur: [2.4, 4.4], y0: 5, y1: 95 })
      const win = `<div class="sk-b" style="inset:0;border-radius:inherit;box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 6px ${P.d2},inset 0 0 0 8px ${rgba('#fff', 0.55)},inset 0 0 40px ${rgba('#000', 0.35)}"></div>`
      return { bg, radius: '14px', pad: 'clamp(24px,4cqw,38px)', fg: win, vars: { '--sk-panel': rgba(dk(P.d2, 0.35), 0.78), '--sk-line': rgba('#fff', 0.55), '--sk-chip': rgba('#000', 0.35), '--sk-ink': '#fff' } }
    },
  }),
]
