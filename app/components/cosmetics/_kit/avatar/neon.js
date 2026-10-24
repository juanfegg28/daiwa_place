// @ts-nocheck
// Colección NEO NEÓN — cyberpunk / gamer: retículas, circuitos, HUD, hologramas, código. Originales.
import { CX, CY, f, pol, rng, arc, band, sector } from '../core/util.js'
import { ctr, sparkle, glow, mirror } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('cian', 'Cian eléctrico', '#19E6FF', '#06182B', '#E6FDFF', '#FF2BD6'),
  pal('lima', 'Lima ácido', '#B8FF2E', '#10200A', '#F3FFD0', '#00D9FF'),
  pal('laser', 'Rojo láser', '#FF3355', '#2B0610', '#FFD6DD', '#FFB02E'),
  pal('uv', 'Violeta UV', '#9B5CFF', '#150A2E', '#EBDDFF', '#19E6FF'),
]
const neon = (S, P, w = 1.4) => S.nid('n') // placeholder para futuros filtros

export const NEON = [
  // ───────────────────────── Retícula
  {
    slug: 'reticula', name: 'Retícula', rarity: 'comun', price: 500, coll: 'neon', min: 40, palettes: PAL,
    css: `${spin('nr-a', 'nr-o', 38)}${spin('nr-b', 'nr-o', 26, true)}${selfc('nr-p')}.nr-p{animation:nr-p 2.4s ease-in-out infinite}${KF('nr-p', '0%,100%{transform:scale(1);opacity:.75}50%{transform:scale(1.35);opacity:1}')}.nr-k{animation:nr-k 3.6s steps(1) infinite}${KF('nr-k', '0%,70%{opacity:1}75%{opacity:.25}80%{opacity:1}')}`,
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      let ticks = ''
      for (let a = 0; a < 360; a += 5) {
        const major = a % 90 === 0, mid = a % 15 === 0
        const L = major ? 15 : mid ? 7 : 3.4
        const [x0, y0] = pol(0, 0, 113, a), [x1, y1] = pol(0, 0, 113 + L, a)
        ticks += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${major ? P.d4 : P.d1}" stroke-width="${major ? 2.4 : mid ? 1.3 : 0.8}" opacity="${major ? 1 : mid ? 0.9 : 0.55}"/>`
      }
      const tri = (a) => { const [x, y] = pol(0, 0, 138, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a - 90})"><g class="nr-p"><path d="M0 -6L7 5L0 2L-7 5Z" fill="${P.d4}" stroke="${P.d3}" stroke-width=".8" stroke-linejoin="round"/></g></g>` }
      const brk = (a) => `<path d="${arc(131, a - 14, a + 14, 0, 0)}" fill="none" stroke="${P.d1}" stroke-width="3.2" stroke-linecap="square"/>`
      return `<circle cx="144" cy="144" r="112" fill="none" stroke="${P.d1}" stroke-width="1.6" opacity=".9"/>` + ctr(
        `<g class="nr-k">${ticks}</g><g class="nr-a"><circle r="124" fill="none" stroke="${P.d3}" stroke-width="1" stroke-dasharray="2 7" opacity=".85"/>${[45, 135, 225, 315].map(brk).join('')}</g><g class="nr-b"><circle r="132" fill="none" stroke="${P.d1}" stroke-width="1.2" stroke-dasharray="20 9 3 9" opacity=".7"/></g>${[0, 90, 180, 270].map(tri).join('')}`
      ) + sparkle(144, 2, 3.6, '#fff', 'k-tw')
    },
  },
  // ───────────────────────── Circuito pulsante
  {
    slug: 'circuito-pulsante', name: 'Circuito pulsante', rarity: 'raro', price: 1000, coll: 'neon', min: 52, palettes: PAL,
    css: `.nc-p{stroke-dasharray:7 93;animation:nc-r 2.8s linear infinite}${KF('nc-r', 'from{stroke-dashoffset:100}to{stroke-dashoffset:0}')}${selfc('nc-n')}.nc-n{animation:k-pu 2.4s ease-in-out infinite}`,
    back: (S, P) => glow(S, P.d1, 0.18),
    front: (S, P) => {
      const R = rng(31)
      let base = '', pulses = '', nodes = ''
      const N = 30
      for (let i = 0; i < N; i++) {
        const a = (360 / N) * i + 2
        const sgn = i % 2 ? 1 : -1
        const L1 = 6 + Math.floor(R() * 3) * 3
        const kink = 4 + R() * 3
        const L2 = 4 + R() * 9
        const pts = [pol(0, 0, 114, a), pol(0, 0, 114 + L1, a), pol(0, 0, 114 + L1 + kink, a + sgn * (kink / 1.25)), pol(0, 0, 114 + L1 + kink + L2, a + sgn * (kink / 1.25))]
        const d = 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L')
        base += `<path d="${d}" fill="none" stroke="${P.d1}" stroke-width="1.5" stroke-linejoin="round" opacity=".62"/>`
        if (i % 3 === 0) pulses += `<path class="nc-p" pathLength="100" style="animation-delay:${-(R() * 2.8).toFixed(2)}s;animation-duration:${(2 + R() * 1.6).toFixed(2)}s" d="${d}" fill="none" stroke="${i % 2 ? P.d4 : P.d3}" stroke-width="2.2" stroke-linecap="round"/>`
        const e = pts[3]
        nodes += i % 2 ? `<circle cx="${f(e[0])}" cy="${f(e[1])}" r="2.4" fill="${P.d2}" stroke="${P.d1}" stroke-width="1.3"/>` : `<rect x="${f(e[0] - 2.2)}" y="${f(e[1] - 2.2)}" width="4.4" height="4.4" fill="${P.d1}" transform="rotate(${f(a)} ${f(e[0])} ${f(e[1])})"/>`
      }
      const chips = [30, 150, 270].map((a) => { const [x, y] = pol(0, 0, 124, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><rect x="-9" y="-4.5" width="18" height="9" rx="1.6" fill="${P.d2}" stroke="${P.d1}" stroke-width="1.2"/><path d="M-5 -1.5h10M-5 1.6h6" stroke="${P.d4}" stroke-width="1" class="nc-n"/></g>` }).join('')
      return `<circle cx="144" cy="144" r="113" fill="none" stroke="${P.d1}" stroke-width="2.4"/><circle cx="144" cy="144" r="116.8" fill="none" stroke="${P.d1}" stroke-width=".6" opacity=".6"/>` + ctr(base + pulses + nodes + chips)
    },
  },
  // ───────────────────────── HUD glitch
  {
    slug: 'hud-glitch', name: 'HUD glitch', rarity: 'raro', price: 1200, coll: 'neon', min: 52, palettes: PAL,
    css: `${spin('nu-a', 'nu-o', 70)}${spin('nu-b', 'nu-o', 52, true)}.nu-g1{animation:nu-g1 4.2s steps(1) infinite}${KF('nu-g1', '0%,91%,100%{transform:translate(0,0)}92%{transform:translate(4px,-1px)}94%{transform:translate(-3px,1px)}96%{transform:translate(2px,0)}')}.nu-g2{animation:nu-g2 4.2s steps(1) infinite}${KF('nu-g2', '0%,91%,100%{transform:translate(0,0)}92%{transform:translate(-4px,1px)}94%{transform:translate(3px,-1px)}96%{transform:translate(-2px,0)}')}.nu-bar{transform-box:fill-box;transform-origin:0 50%;animation:nu-bar 4s ease-in-out infinite alternate}${KF('nu-bar', 'from{transform:scaleX(.35)}to{transform:scaleX(1)}')}`,
    back: (S, P) => glow(S, P.d1, 0.16),
    front: (S, P) => {
      const segs = [[-62, 38], [58, 120], [138, 178], [200, 282]]
      const mk = (col, w, rr = 118) => segs.map(([a, b]) => `<path d="${arc(rr, a, b, 0, 0)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="butt"/>`).join('')
      let blocks = ''
      for (const [a, n] of [[-70, 4], [128, 3], [286, 5]]) for (let i = 0; i < n; i++) { const [x, y] = pol(0, 0, 130, a + i * 4.4); blocks += `<rect transform="translate(${f(x)} ${f(y)}) rotate(${a + i * 4.4 + 90})" x="-1.6" y="-4.5" width="3.2" height="${i % 2 ? 6 : 9}" fill="${i % 3 ? P.d1 : P.d4}" opacity="${0.5 + (i % 3) * 0.2}"/>` }
      const hex = (a) => { const [x, y] = pol(0, 0, 140, a); let d = ''; for (let k = 0; k < 6; k++) { const [px, py] = pol(0, 0, 6, 60 * k); d += (k ? 'L' : 'M') + f(px) + ' ' + f(py) } return `<path transform="translate(${f(x)} ${f(y)})" d="${d}Z" fill="${P.d2}" stroke="${P.d4}" stroke-width="1.2"/>` }
      const bar = `<g transform="translate(${-20} 134)"><rect width="42" height="5" fill="${P.d2}" stroke="${P.d1}" stroke-width=".8"/><rect class="nu-bar" x="1" y="1" width="40" height="3" fill="${P.d3}"/></g>`
      return ctr(
        `<g class="nu-g2" style="mix-blend-mode:screen">${mk(P.d4, 2.2, 117)}</g><g class="nu-g1">${mk(P.d1, 4.4)}</g>` +
        `<g class="nu-a"><circle r="125.5" fill="none" stroke="${P.d3}" stroke-width=".9" stroke-dasharray="1 5" opacity=".85"/></g><g class="nu-b">${blocks}</g>` + hex(-24) + hex(204) + bar +
        `<path d="${arc(108, 210, 330, 0, 0)}" fill="none" stroke="${P.d1}" stroke-width="1" opacity=".7"/>`
      )
    },
  },
  // ───────────────────────── Escáner holográfico
  {
    slug: 'escaner-holografico', name: 'Escáner holográfico', rarity: 'epico', price: 2200, coll: 'neon', min: 56, palettes: PAL,
    css: `${spin('ne-a', 'ne-o', 3.8)}${spin('ne-b', 'ne-o', 60, true)}${selfc('ne-h')}.ne-h{animation:ne-h 3.4s ease-in-out infinite}${KF('ne-h', '0%,100%{opacity:.35}50%{opacity:.95}')}`,
    back: (S, P) => glow(S, P.d1, 0.24, 0.74, 0.84),
    front: (S, P) => {
      const hexD = (r) => { let d = ''; for (let k = 0; k < 6; k++) { const [px, py] = pol(0, 0, r, 60 * k + 30); d += (k ? 'L' : 'M') + f(px) + ' ' + f(py) } return d + 'Z' }
      let hexes = ''
      const N = 26
      for (let i = 0; i < N; i++) { const [x, y] = pol(0, 0, 122, (360 / N) * i); hexes += `<path class="ne-h" style="animation-delay:${-(i * 0.21).toFixed(2)}s" transform="translate(${f(x)} ${f(y)}) rotate(${(360 / N) * i})" d="${hexD(7.6)}" fill="${P.d1}" fill-opacity=".14" stroke="${P.d1}" stroke-width="1.1"/>` }
      let beam = ''
      const K = 14
      for (let i = 0; i < K; i++) beam += `<path d="${sector(112, 140, -i * 2.6, -(i + 1) * 2.6 - 0.2, 0, 0)}" fill="${P.d3}" opacity="${(0.85 * Math.pow(1 - i / K, 1.6)).toFixed(3)}"/>`
      const lead = `<path d="M${f(pol(0, 0, 112, 0)[0])} 0L${f(pol(0, 0, 142, 0)[0])} 0" stroke="#fff" stroke-width="2"/>`
      return `<circle cx="144" cy="144" r="112" fill="none" stroke="${P.d3}" stroke-width="1.4" opacity=".9"/>` + ctr(`<g class="ne-b">${hexes}</g><circle r="143.5" fill="none" stroke="${P.d4}" stroke-width="1" stroke-dasharray="14 5" opacity=".8"/><g class="ne-a">${beam}${lead}</g>`) + sparkle(30, 70, 3, P.d3, 'k-tw') + sparkle(258, 220, 3.4, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1.2s"')
    },
  },
  // ───────────────────────── Lluvia de código
  {
    slug: 'lluvia-de-codigo', name: 'Lluvia de código', rarity: 'epico', price: 2300, coll: 'neon', min: 56, palettes: PAL,
    css: `.lq-c{animation:lq-f 3.6s linear infinite}${KF('lq-f', 'from{transform:translateY(-90px)}to{transform:translateY(0)}')}.lq-t{font:800 13px ui-monospace,Menlo,Consolas,monospace}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const R = rng(77)
      const GL = ['0', '1', '{', '}', '/', '<', '>', '=', '+', ';', '#', '*', 'x', '$']
      const mask = S.mask(`<circle cx="144" cy="144" r="160" fill="${S.rad([[0.765, '#fff', 0], [0.8, '#fff', 1], [0.93, '#fff', 0.9], [1, '#fff', 0]], 144, 144, 160)}"/>`)
      let cols = ''
      const XS = []
      for (let x = -12; x <= 300; x += 15) XS.push(x)
      XS.forEach((x, i) => {
        const dur = 2.6 + R() * 3
        let t = ''
        for (let k = 0; k < 26; k++) {
          const ch = GL[Math.floor(R() * GL.length)]
          const head = k % 6 === 5
          t += `<text class="lq-t" x="${x}" y="${k * 15 - 20}" fill="${head ? '#ffffff' : k % 6 > 2 ? P.d3 : P.d1}" opacity="${head ? 1 : 0.5 + (k % 6) * 0.1}" text-anchor="middle">${ch}</text>`
        }
        cols += `<g class="lq-c" style="animation-duration:${dur.toFixed(2)}s;animation-delay:${-(R() * dur).toFixed(2)}s">${t}</g>`
      })
      return `<g mask="${mask}">${cols}</g><circle cx="144" cy="144" r="112.5" fill="none" stroke="${P.d1}" stroke-width="1.6" opacity=".9"/>`
    },
  },
]
