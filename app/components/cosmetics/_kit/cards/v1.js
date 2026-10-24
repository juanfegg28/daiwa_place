// @ts-nocheck
// VELVET ROUGE — tarjetas: Terciopelo rouge · Encaje negro · Cortina de teatro
import { META } from './meta.js'
import { fl } from './kit.js'
import { rng } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'

const M = (slug, o) => ({ ...META[slug], ...o })
const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const goldGrad = (P) => `linear-gradient(135deg,${P.d4},${lt(P.d4, 0.55)} 22%,${dk(P.d4, 0.25)} 48%,${lt(P.d4, 0.45)} 74%,${P.d4})`

// valance (cenefa) con festones y borlas doradas
const valance = (P) => `<defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(P.d1, P.d3, 0.12)}"/><stop offset="1" stop-color="${dk(P.d1, 0.5)}"/></linearGradient><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${dk(P.d4, 0.2)}"/><stop offset=".5" stop-color="${lt(P.d4, 0.5)}"/><stop offset="1" stop-color="${dk(P.d4, 0.2)}"/></linearGradient></defs>
<path d="M0 0H90V16Q67 52 45 16Q23 52 0 16Z" fill="url(#v)"/><path d="M0 16Q23 52 45 16Q67 52 90 16" fill="none" stroke="url(#g)" stroke-width="2.6"/>
<path d="M12 8Q23 30 34 8M56 8Q67 30 78 8" fill="none" stroke="${rgba('#000', 0.25)}" stroke-width="1.5"/>
${[0, 45, 90].map((x) => `<path d="M${x} 16V30" stroke="url(#g)" stroke-width="1.6"/><circle cx="${x}" cy="33" r="3.4" fill="url(#g)"/><path d="M${x - 3} 36.5L${x - 4} 50M${x - 1} 37L${x - 1.4} 52M${x + 1} 37L${x + 1.4} 52M${x + 3} 36.5L${x + 4} 50" stroke="url(#g)" stroke-width="1.1" stroke-linecap="round"/>`).join('')}`

export const V1 = [
  M('terciopelo-rouge', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d1, P.d3, 0.06)} 0,${P.d1} 22%,${dk(P.d1, 0.55)} 100%)`)
      // pliegues de la tela: dos rejillas de anchos distintos para que no se note el patrón
      bg += K.fill(`background:repeating-linear-gradient(90deg,rgba(0,0,0,.36) 0 11px,rgba(0,0,0,0) 11px 25px,${rgba(P.d3, 0.10)} 25px 31px,rgba(0,0,0,.22) 31px 54px),repeating-linear-gradient(90deg,rgba(0,0,0,.2) 0 37px,${rgba(P.d3, 0.06)} 37px 50px,transparent 50px 87px)`)
      bg += K.fill(`background:radial-gradient(ellipse 65% 50% at 50% 0,${rgba(P.d3, 0.30)},transparent 72%),radial-gradient(ellipse 80% 40% at 50% 100%,rgba(0,0,0,.55),transparent 75%)`)
      bg += K.tile(valance(P), 90, 56, { x: true, t: '0', l: '0', r: '0', h: '56px', style: 'filter:drop-shadow(0 6px 8px rgba(0,0,0,.5))' })
      bg += K.parts(9, { kind: 'twinkle', seed: 6, html: `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${P.d4};box-shadow:0 0 8px ${P.d4}"></b>`, size: [2, 4], dur: [4, 8], y0: 12, y1: 95 })
      bg += K.grain(0.1)
      return {
        bg, pt: 0,
        fg: K.frame({ w: 2.6, grad: goldGrad(P), glow: rgba(P.d4, 0.35) }) + `<div class="sk-b" style="inset:9px;border-radius:calc(var(--sk-r,28px) - 7px);border:1px dashed ${rgba(P.d4, 0.45)}"></div>`,
        vars: { '--sk-panel': rgba(dk(P.d2, 0.1), 0.78), '--sk-line': rgba(P.d4, 0.4), '--sk-accent': P.d4 },
      }
    },
  }),

  M('encaje-negro', {
    css: '',
    build: (K, P) => {
      const st = rgba(P.d1, 0.5), st2 = rgba(P.d1, 0.28)
      const petal = [0, 60, 120, 180, 240, 300].map((a) => `<path transform="rotate(${a} 42 42)" d="M42 42C33 33 34 20 42 14C50 20 51 33 42 42Z" fill="none" stroke="${st}" stroke-width="1.1"/><path transform="rotate(${a + 30} 42 42)" d="M42 30V12" stroke="${st2}" stroke-width=".8"/>`).join('')
      const lace = `${petal}<circle cx="42" cy="42" r="4" fill="none" stroke="${st}"/><circle cx="42" cy="42" r="1.4" fill="${st}"/>${[[0, 0], [84, 0], [0, 84], [84, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="${st}"/><circle cx="${x}" cy="${y}" r="1" fill="${st}"/>`).join('')}<path d="M0 0L84 84M84 0L0 84" stroke="${rgba(P.d1, 0.09)}"/><path d="M0 42Q21 30 42 42T84 42" fill="none" stroke="${st2}"/>`
      let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.1)} 0,${P.d2} 40%,${dk(P.d2, 0.2)} 100%)`)
      bg += K.pattern(84, 84, lace, { style: '-webkit-mask-image:radial-gradient(ellipse 62% 55% at 50% 55%,rgba(0,0,0,.18) 0,#000 100%);mask-image:radial-gradient(ellipse 62% 55% at 50% 55%,rgba(0,0,0,.18) 0,#000 100%)' })
      bg += K.fill(`background:radial-gradient(ellipse 70% 40% at 20% 0,${rgba(P.d3, 0.16)},transparent 70%)`)
      // festón de encaje con perlas (arriba y abajo)
      const scal = (flip) => `<defs><radialGradient id="p" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${P.d1}"/></radialGradient></defs><g${flip ? ' transform="translate(0 26) scale(1 -1)"' : ''}><path d="M0 0H28V7A14 14 0 0 1 0 7Z" fill="${rgba(P.d2, 0.92)}" stroke="${st}"/><path d="M5 7A9 9 0 0 0 23 7" fill="none" stroke="${st2}"/><circle cx="14" cy="9" r="1.8" fill="none" stroke="${st}"/><circle cx="14" cy="22.2" r="3.4" fill="url(#p)" stroke="${rgba(P.d1, 0.5)}" stroke-width=".4"/></g>`
      bg += K.tile(scal(false), 28, 26, { x: true, t: '0', l: '0', r: '0', h: '26px' }) + K.tile(scal(true), 28, 26, { x: true, b: '0', l: '0', r: '0', h: '26px' })
      const flower = `<g fill="none" stroke="${st}" stroke-width="1.2">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path transform="rotate(${a} 100 100)" d="M100 100C84 82 86 56 100 40C114 56 116 82 100 100Z"/><path transform="rotate(${a + 22} 100 100)" d="M100 78V50" stroke-width=".8"/>`).join('')}<circle cx="100" cy="100" r="10"/><circle cx="100" cy="100" r="3" fill="${st}"/><circle cx="100" cy="100" r="64" stroke-dasharray="2 6" stroke-width="1.6"/></g>`
      bg += K.box('0 0 200 200', flower, { w: fl(210), b: '-52px', r: '-52px', style: 'opacity:.9' }) + K.box('0 0 200 200', flower, { w: fl(150), t: '70px', r: '-46px', style: 'opacity:.55', rot: 20 })
      bg += K.fill(`background:linear-gradient(115deg,transparent 40%,${rgba(P.d3, 0.07)} 50%,transparent 60%);background-size:250% 100%;animation:sk-glass 11s ease-in-out infinite`)
      bg += K.grain(0.06)
      return { bg, fg: K.frame({ w: 1.4, grad: `linear-gradient(160deg,${rgba(P.d1, 0.8)},${rgba(P.d1, 0.2)} 50%,${rgba(P.d4, 0.6)})` }), vars: { '--sk-panel': rgba(dk(P.d2, 0.2), 0.8) } }
    },
  }),

  M('cortina-de-teatro', {
    css: '',
    build: (K, P) => {
      let bg = K.fill(`background:linear-gradient(180deg,${dk(P.d2, 0.25)} 0,${P.d2} 55%,${dk(P.d2, 0.5)} 100%)`)
      // foco del escenario
      bg += K.fill(`background:conic-gradient(from 168deg at 50% -4%,transparent 0 0deg,${rgba('#FFF2D2', 0.17)} 0 24deg,transparent 24deg);${fade('#000 0,#000 30%,transparent 90%')}`)
      bg += K.fill(`background:radial-gradient(ellipse 36% 55% at 50% 0,${rgba('#FFF2D2', 0.2)},transparent 75%)`)
      // cortinas a los lados, recogidas con un cordón dorado
      const curtain = (flip) => {
        const id = K.nid('f')
        const inner = `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="45" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="${dk(P.d1, 0.55)}"/><stop offset=".35" stop-color="${mix(P.d1, P.d3, 0.1)}"/><stop offset=".6" stop-color="${P.d1}"/><stop offset="1" stop-color="${dk(P.d1, 0.6)}"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs>
<path d="M0 0H180Q166 250 122 440Q104 500 78 540Q44 640 70 900H0Z" fill="url(#${id})"/><path d="M0 0H180Q166 250 122 440Q104 500 78 540Q44 640 70 900H0Z" fill="url(#${id}s)"/>
<path d="M60 520Q96 506 130 520" fill="none" stroke="${P.d4}" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="522" r="7" fill="${P.d4}"/><path d="M120 529V570" stroke="${P.d4}" stroke-width="3"/>${[-6, -2, 2, 6].map((d) => `<path d="M${120 + d * 0.5} 566L${120 + d * 1.6} 604" stroke="${P.d4}" stroke-width="1.4" stroke-linecap="round"/>`).join('')}`
        return K.svg('0 0 180 900', inner, { pos: 'none', style: `inset:auto;top:0;bottom:0;${flip ? 'right' : 'left'}:0;width:clamp(44px,10cqw,100px);height:100%;${flip ? 'transform:scaleX(-1);' : ''}filter:drop-shadow(${flip ? '-' : ''}6px 0 10px rgba(0,0,0,.45))` })
      }
      bg += curtain(false) + curtain(true)
      bg += K.tile(valance(P), 90, 56, { x: true, t: '0', l: '0', r: '0', h: '56px', style: 'filter:drop-shadow(0 6px 8px rgba(0,0,0,.5))' })
      // candilejas
      const bulb = `<defs><radialGradient id="b"><stop offset="0" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><circle cx="20" cy="20" r="19" fill="url(#b)"/><circle cx="20" cy="22" r="4.5" fill="#fff4d0"/>`
      bg += K.tile(bulb, 40, 40, { x: true, b: '-8px', l: '0', r: '0', h: '40px', style: 'animation:sk-flick 3.4s ease-in-out infinite;opacity:.9' })
      bg += K.fill('background:linear-gradient(0deg,rgba(255,190,90,.14),transparent 90px)')
      bg += K.grain(0.08)
      return { bg, fg: K.frame({ w: 2.4, grad: goldGrad(P), glow: rgba(P.d4, 0.3) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.2), 0.8), '--sk-line': rgba(P.d4, 0.35) }, padl: 'clamp(40px,9cqw,92px)', pad: 'clamp(40px,9cqw,92px)' }
    },
  }),
]
