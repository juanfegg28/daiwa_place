// @ts-nocheck
// SAKURA DREAMS — tarjetas: Cuaderno kawaii · Cielo de algodón · Jardín sakura
import { META } from './meta.js'
import { fl } from './kit.js'
import { rng } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'

const M = (slug, o) => ({ ...META[slug], ...o })
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const sparkle4 = (c) => `<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0-9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" fill="${c}"/></svg>`
const tape = (c1, c2, w, rot, pos, extra = '') => `<div class="sk-b" style="${pos};width:${w};height:26px;transform:rotate(${rot}deg);background:repeating-linear-gradient(45deg,${c1} 0 9px,${c2} 9px 18px);opacity:.82;box-shadow:0 2px 4px rgba(0,0,0,.12);clip-path:polygon(0 0,100% 0,98% 25%,100% 50%,98% 75%,100% 100%,0 100%,2% 75%,0 50%,2% 25%);${extra}"></div>`

export const S1 = [
  M('cuaderno-kawaii', {
    css: '@container (max-width:560px){.sk-cuaderno-kawaii .hide-sm{display:none}}',
    build: (K, P) => {
      const padl = 'clamp(44px,6.4cqw,64px)'
      let bg = K.fill(`background:${P.d2}`)
      bg += K.fill(`background:repeating-linear-gradient(180deg,transparent 0 31px,${rgba(P.d4, 0.4)} 31px 32px);background-position:0 20px`)
      bg += K.fill(`background:linear-gradient(90deg,transparent calc(${padl} - 16px),${rgba(P.d1, 0.55)} calc(${padl} - 16px) calc(${padl} - 14px),transparent calc(${padl} - 14px))`)
      bg += K.fill(`background:radial-gradient(ellipse 60% 40% at 100% 0,${rgba(P.d1, 0.14)},transparent 70%),radial-gradient(ellipse 50% 40% at 0 100%,${rgba(P.d4, 0.16)},transparent 70%)`)
      // espiral del cuaderno
      const ring = `<circle cx="22" cy="17" r="5.6" fill="${rgba(P.d1, 0.22)}" stroke="rgba(0,0,0,.1)"/><path d="M2 21Q13 2 27 13" fill="none" stroke="#9aa2b8" stroke-width="3.4" stroke-linecap="round"/><path d="M3 19Q13 4 26 12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>`
      bg += K.tile(ring, 30, 34, { x: false, y: true, t: '10px', b: '10px', l: '-10px', w: '30px' })
      bg += tape(rgba(P.d1, 0.85), rgba('#fff', 0.8), 'clamp(80px,14cqw,140px)', 5, 'top:-6px;right:7%')
      bg += tape(rgba(P.d4, 0.85), rgba('#fff', 0.8), 'clamp(60px,10cqw,104px)', -8, 'bottom:16px;left:12%')
      // pegatinas
      const stk = (inner) => `<g stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke" filter="drop-shadow(0 2px 2px rgba(0,0,0,.18))">${inner}</g>`
      const sticker = stk(`<path d="M30 6L36 21L52 22L40 33L44 49L30 40L16 49L20 33L8 22L24 21Z" fill="#FFD64A" stroke="#fff"/>`) +
        stk(`<path d="M86 58C70 46 64 34 72 26C79 20 86 24 86 29C86 24 94 20 100 26C108 34 102 46 86 58Z" fill="${P.d1}" stroke="#fff"/>`) +
        stk(`<path d="M128 40Q124 28 136 28Q140 18 152 24Q164 20 166 32Q176 34 170 44Q168 52 156 50H138Q126 52 128 40Z" fill="${P.d4}" stroke="#fff"/>`) +
        stk(`<path d="M190 30L196 10L206 22L222 22L228 10L232 30Q238 50 214 56Q190 52 190 30Z" fill="#fff" stroke="#fff"/>`) +
        `<circle cx="203" cy="38" r="2" fill="#3a2a3a"/><circle cx="222" cy="38" r="2" fill="#3a2a3a"/><path d="M209 44Q212 47 215 44" fill="none" stroke="#3a2a3a" stroke-width="1.4" stroke-linecap="round"/><circle cx="198" cy="44" r="3.4" fill="${P.d1}" opacity=".45"/><circle cx="227" cy="44" r="3.4" fill="${P.d1}" opacity=".45"/>`
      bg += K.box('0 0 250 70', sticker, { w: fl(250, 0.6), b: '14px', r: '14px', cls: 'hide-sm', style: 'animation:sk-bob 4.5s ease-in-out infinite' })
      bg += K.parts(8, { kind: 'twinkle', seed: 9, html: (i) => sparkle4([P.d1, P.d4, '#FFD64A'][i % 3]), size: [10, 18], dur: [3, 6], y0: 6, y1: 96 })
      return { bg, padl, fg: `<div class="sk-b" style="inset:8px;border-radius:calc(var(--sk-r,28px) - 8px);border:1.6px dashed ${rgba(P.d1, 0.6)}"></div>`, radius: '22px' }
    },
  }),

  M('cielo-de-algodon', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${P.d2} 0,${mix(P.d2, P.d4, 0.35)} 52%,${mix(P.d1, P.d4, 0.45)} 100%)`)
      bg += K.glow('84%', '90px', 330, P.d4, 0.85) + K.glow('84%', '90px', 120, '#fff', 0.9)
      // arcoíris suave
      const arcs = ['#FF8FA0', '#FFC27A', '#FFE58A', '#A8E6B0', '#8CCBFF', '#C3A8FF'].map((c, i) => `<circle cx="150" cy="150" r="${140 - i * 9}" fill="none" stroke="${c}" stroke-width="8" opacity=".5"/>`).join('')
      bg += K.box('0 0 150 150', arcs, { w: fl(300), t: '-12px', l: '-120px', style: 'overflow:hidden', rot: 0 }).replace('overflow="visible"', '')
      const cloud = (x, y, s, o) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity="${o}"><circle cx="0" cy="0" r="30"/><circle cx="34" cy="-12" r="38"/><circle cx="74" cy="-2" r="32"/><circle cx="104" cy="8" r="24"/><rect x="-30" y="0" width="160" height="34" rx="17"/></g>`
      bg += K.box('0 0 300 120', cloud(40, 60, 1, 0.95) + cloud(150, 80, 0.7, 0.85), { w: fl(320), t: '60px', r: '-40px', style: 'animation:sk-drift 16s ease-in-out infinite' })
      const R = rng(4)
      const bank = (o, dy, col) => { let s = ''; for (let i = -1; i < 16; i++) s += `<circle cx="${i * 72 + R() * 20}" cy="${150 + dy + R() * 26}" r="${40 + R() * 34}" fill="${col}" opacity="${o}"/>`; return s + `<rect x="-20" y="${170 + dy}" width="1100" height="120" fill="${col}" opacity="${o}"/>` }
      bg += K.svg('0 0 1000 220', bank(0.55, -18, mix('#fff', P.d1, 0.25)) + `<g style="animation:sk-drift 18s ease-in-out infinite">${bank(0.8, 0, '#fff')}</g>`, { pos: 'xMidYMax slice', style: 'inset:auto;left:0;right:0;bottom:0;height:clamp(110px,21cqw,200px);width:100%' })
      bg += K.parts(9, { kind: 'twinkle', seed: 2, html: (i) => sparkle4(['#fff', P.d4, P.d1][i % 3]), size: [10, 20], dur: [3, 6], y0: 4, y1: 92 })
      return { bg, fg: K.frame({ w: 2, grad: `linear-gradient(160deg,#fff,${rgba('#fff', 0.3)} 40%,${rgba(P.d1, 0.7)})`, glow: rgba('#fff', 0.5) }), vars: { '--sk-panel': 'rgba(255,255,255,.58)', '--sk-chip': 'rgba(255,255,255,.7)' } }
    },
  }),

  M('jardin-sakura', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, '#1a2a66', 0.35)} 0,${P.d2} 48%,${dk(P.d2, 0.35)} 100%)`)
      bg += K.fill(`background:radial-gradient(ellipse 85% 40% at 50% 112%,${rgba(P.d1, 0.28)},transparent 70%)`)
      bg += K.stars(36, { seed: 3, color: P.d3, tw: 6 })
      // luna
      bg += K.glow('80%', '120px', 360, P.d3, 0.4) + `<div class="sk-b" style="left:80%;top:120px;width:clamp(56px,9cqw,84px);aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle at 36% 34%,#fff,${P.d3} 60%,${mix(P.d3, P.d1, 0.4)});box-shadow:0 0 40px ${rgba(P.d3, 0.8)}"></div>`
      // rama de cerezo
      const bl = K.S.radB([[0, lt(P.d1, 0.6)], [0.55, P.d1], [1, dk(P.d1, 0.25)]], 0.5, 0.5, 0.6)
      const blossom = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${[0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a})" d="M0 0C-7 -4 -9 -13 0 -16C9 -13 7 -4 0 0Z" fill="${bl}" stroke="${rgba(dk(P.d1, 0.4), 0.5)}" stroke-width=".4"/>`).join('')}<circle r="2.2" fill="${P.d4}"/><path d="M0 0L-3 -6M0 0L3 -6M0 0L0 -7" stroke="${P.d4}" stroke-width=".7"/></g>`
      const wood = dk(mix(P.d2, P.d1, 0.25), 0.1)
      const R = rng(12)
      let br = `<g fill="none" stroke="${wood}" stroke-linecap="round"><path d="M380 -6C320 30 270 54 214 100C160 146 110 160 30 230" stroke-width="15"/><path d="M300 36C282 20 262 18 240 24" stroke-width="7"/><path d="M214 100C196 84 170 84 150 92" stroke-width="6"/><path d="M150 140C140 120 120 112 98 116" stroke-width="5"/><path d="M262 56C262 36 270 22 284 10" stroke-width="5"/></g>`
      const spots = [[330, 18], [296, 38], [262, 58], [236, 22], [214, 100], [186, 84], [150, 92], [120, 148], [98, 116], [70, 190], [284, 10], [248, 76], [172, 124], [330, 52]]
      for (const [x, y] of spots) br += blossom(x + (R() - 0.5) * 8, y + (R() - 0.5) * 8, 0.8 + R() * 0.55, R() * 72)
      bg += K.box('0 0 380 250', br, { w: fl(470), t: '-6px', r: '-14px', style: 'filter:drop-shadow(0 4px 10px rgba(0,0,0,.4))' })
      bg += K.box('0 0 380 250', br, { w: fl(200), b: '-74px', l: '-56px', flipX: true, flipY: true, style: 'opacity:.5' })
      bg += K.parts(11, { kind: 'fall', seed: 5, rot: 420, dx: [-60, 60], dur: [11, 19], size: [9, 15], o: 0.9, html: `<svg viewBox="-8 -8 16 16" width="100%" height="100%"><path d="M0 7C-6 4-7-4 0-7C7-4 6 4 0 7Z" fill="${P.d1}" opacity=".9"/></svg>` })
      bg += K.fill(`background:linear-gradient(0deg,${rgba(P.d1, 0.14)},transparent 80px)`)
      bg += K.grain(0.06)
      return { bg, fg: K.frame({ w: 1.6, grad: `linear-gradient(160deg,${rgba(P.d1, 0.85)},${rgba(P.d1, 0.15)} 45%,${rgba(P.d4, 0.55)})`, glow: rgba(P.d1, 0.25) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.2), 0.76) } }
    },
  }),
]
