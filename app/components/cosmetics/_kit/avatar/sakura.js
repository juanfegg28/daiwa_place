// @ts-nocheck
// Colección SAKURA DREAMS — kawaii, pastel, ternura. Originales hechos con código.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, at, g, mirror, sparkle, dot, bow, petalD, heartD, orbit, starD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('sakura', 'Sakura', '#FF8FB8', '#B5426E', '#FFE3EE', '#FFD36B'),
  pal('cielo', 'Cielo', '#7FC8FF', '#2D6BB5', '#E4F4FF', '#FFC8E6'),
  pal('lavanda', 'Lavanda', '#B79BFF', '#5B3FB0', '#F0E8FF', '#FFB3E0'),
  pal('menta', 'Menta', '#6FE0B8', '#1F8A66', '#E1FFF3', '#FFE08A'),
]

export const SAKURA = [
  // ───────────────────────── Listón rosa
  {
    slug: 'liston-rosa', name: 'Listón rosa', rarity: 'comun', price: 350, coll: 'sakura', min: 40, palettes: PAL,
    css: `.sl-b{transform-box:fill-box;transform-origin:50% 30%;animation:sl-sw 4.6s ease-in-out infinite alternate}${KF('sl-sw', 'from{transform:rotate(-3deg)}to{transform:rotate(3deg)}')}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.78, P.d1, 0], [0.86, P.d1, 0.28], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const rib = S.linU([[0, P.d3], [0.5, P.d1], [1, P.d2]], 30, 30, 260, 260)
      let dots = ''
      for (let i = 0; i < 28; i++) { const [x, y] = pol(0, 0, 117, i * (360 / 28)); dots += `<circle cx="${f(x)}" cy="${f(y)}" r="1.4" fill="#fff" opacity=".85"/>` }
      const band_ = `<circle cx="144" cy="144" r="117" fill="none" stroke="${P.d2}" stroke-opacity=".35" stroke-width="12.6"/><circle cx="144" cy="144" r="117" fill="none" stroke="${rib}" stroke-width="10.6"/><circle cx="144" cy="144" r="113" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".9"/><circle cx="144" cy="144" r="121" fill="none" stroke="${P.d2}" stroke-opacity=".3" stroke-width=".8" stroke-dasharray="2.5 2.5"/>`
      const [bx, by] = pol(144, 144, 118, 38)
      const curl = (sgn) => `<path d="M0 6C${sgn * 8} 22 ${sgn * 2} 36 ${sgn * 14} 46C${sgn * 24} 54 ${sgn * 30} 44 ${sgn * 22} 38" fill="none" stroke="${rib}" stroke-width="6" stroke-linecap="round"/>`
      return band_ + ctr(dots) + `<g transform="translate(${f(bx)} ${f(by)}) rotate(-8)"><g class="sl-b">${bow(S, P.d1, P.d2, P.d3, { s: 0.9, tails: false })}${curl(-1)}${curl(1).replace('stroke-width="6"', 'stroke-width="5.4"')}</g></g>` + sparkle(250, 190, 4, P.d4, 'k-tw') + sparkle(40, 236, 3.2, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1.4s"')
    },
  },
  // ───────────────────────── Pétalos
  {
    slug: 'petalos', name: 'Pétalos', rarity: 'comun', price: 400, coll: 'sakura', min: 52, palettes: PAL,
    css: `${spin('sp-a', 'sp-o', 46)}${spin('sp-b', 'sp-o', 66, true)}${spin('sp-c', 'sp-o', 84)}${selfc('sp-s')}.sp-s{animation:sp-sp 6s ease-in-out infinite alternate}${KF('sp-sp', 'from{transform:rotate(-30deg)}to{transform:rotate(30deg)}')}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.78, P.d1, 0], [0.88, P.d1, 0.2], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const pg = S.lin([[0, P.d3], [0.6, P.d1], [1, P.d2]], 0, 1, 0, 0)
      const petal = (s) => `<g transform="scale(${s})"><path d="${petalD(26, 13)}" fill="${pg}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".8" transform="translate(0 13)"/><path d="M0 13C-1 3 -1 -2 0 -10" stroke="${P.d2}" stroke-opacity=".35" stroke-width=".8" fill="none"/></g>`
      const ring = (r, n, s, off, cls) => {
        let o = ''
        for (let i = 0; i < n; i++) { const a = off + (360 / n) * i; const [x, y] = pol(0, 0, r, a); o += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a * 1.7 + 30 * (i % 2))})"><g class="sp-s" style="animation-delay:${-i * 0.8}s">${petal(s * (0.85 + (i % 3) * 0.15))}</g></g>` }
        return `<g class="${cls}">${o}</g>`
      }
      let rest = ''
      const R = rng(4)
      for (let i = 0; i < 5; i++) { const a = 100 + i * 16 + R() * 8; const [x, y] = pol(0, 0, 112, a); rest += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a + R() * 60)})">${petal(0.8)}</g>` }
      const sp = [[-50, 140, 4], [30, 138, 3], [210, 142, 3.6]].map(([a, r, s], i) => { const [x, y] = pol(0, 0, r, a); return sparkle(x, y, s, P.d4, 'k-tw').replace('<path', `<path style="animation-delay:${-i * 1.1}s"`) }).join('')
      return ctr(ring(121, 7, 1, 0, 'sp-a') + ring(134, 6, 0.8, 22, 'sp-b') + ring(128, 5, 0.62, 45, 'sp-c') + rest + sp)
    },
  },
  // ───────────────────────── Nubes de algodón
  {
    slug: 'nubes-de-algodon', name: 'Nubes de algodón', rarity: 'comun', price: 450, coll: 'sakura', min: 52, palettes: PAL,
    css: `.sn-a{animation:sn-d 7s ease-in-out infinite alternate}${KF('sn-d', 'from{transform:translateX(-4px)}to{transform:translateX(4px)}')}.sn-b{animation:sn-d 9s ease-in-out infinite alternate-reverse}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.76, P.d4, 0], [0.86, P.d3, 0.35], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const cloud = (cx, cy, s, grad) => {
        const C = [[-30, 6, 16], [-14, -6, 20], [8, -10, 22], [28, -1, 17], [40, 8, 13], [0, 8, 20], [-40, 12, 11]]
        const body = C.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')
        const hi = C.slice(0, 5).map(([x, y, r]) => `<circle cx="${x - 3}" cy="${y - 4}" r="${r * 0.62}"/>`).join('')
        return `<g transform="translate(${cx} ${cy}) scale(${s})"><g fill="${P.d1}" opacity=".35" transform="translate(0 4)">${body}</g><g fill="${grad}">${body}</g><g fill="#fff" opacity=".7">${hi}</g></g>`
      }
      const grad = S.lin([[0, '#fff'], [0.7, P.d3], [1, P.mix(P.d3, P.d1, 0.5)]], 0, 0, 0, 1)
      const heart = (x, y, s, c) => `<path transform="translate(${x} ${y})" d="${heartD(s)}" fill="${c}" class="k-fl"/>`
      return `<g class="sn-a">${cloud(144, 262, 1.5, grad)}</g><g class="sn-b">${cloud(262, 66, 0.72, grad)}${cloud(30, 70, 0.55, grad)}</g>` + sparkle(80, 22, 4.4, P.d4, 'k-tw') + sparkle(226, 30, 3.6, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-.8s"') + heart(38, 176, 4.6, P.d1) + heart(252, 170, 3.8, P.d4) + sparkle(20, 128, 3, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-2s"')
    },
  },
  // ───────────────────────── Orejitas de gato
  {
    slug: 'orejitas-de-gato', name: 'Orejitas de gato', rarity: 'raro', price: 900, coll: 'sakura', min: 40, palettes: PAL,
    css: `.so-r{transform-box:fill-box;transform-origin:50% 100%;animation:so-tw 5s ease-in-out infinite}${KF('so-tw', '0%,88%,100%{transform:rotate(0)}91%{transform:rotate(8deg)}94%{transform:rotate(-3deg)}97%{transform:rotate(6deg)}')}.so-l{transform-box:fill-box;transform-origin:50% 100%;animation:so-tw 7s ease-in-out infinite 1.2s}.so-bell{transform-box:fill-box;transform-origin:50% 0;animation:ol-sw 3s ease-in-out infinite alternate}${KF('ol-sw', 'from{transform:rotate(-8deg)}to{transform:rotate(8deg)}')}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.78, P.d1, 0], [0.88, P.d1, 0.18], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const fur = S.lin([[0, P.mix(P.d2, '#000', 0.25)], [1, P.d2]], 0, 1, 0, 0)
      const inner = S.lin([[0, P.d1], [1, P.d3]], 0, 1, 0, 0)
      const ear = (cls) => `<g class="${cls}"><path d="M-27 6C-31 -14 -22 -38 -7 -56C8 -44 24 -24 28 6Z" fill="${fur}" stroke="${P.d2}" stroke-width="1.2" stroke-linejoin="round"/><path d="M-17 2C-20 -12 -13 -29 -6 -41C6 -31 15 -17 17 2Z" fill="${inner}"/><path d="M-11 0C-12 -9 -9 -17 -5 -25M-3 0C-3 -10 -2 -19 -1 -28M5 0C6 -8 7 -15 5 -22" stroke="#fff" stroke-opacity=".45" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M-26 4C-29 -12 -21 -34 -8 -52" stroke="${P.d3}" stroke-opacity=".5" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`
      const earL = `<g transform="translate(80 66) rotate(-22) scale(1.3)">${ear('so-l')}</g>`
      const earR = `<g transform="translate(208 66) rotate(22) scale(-1.3 1.3)">${ear('so-r')}</g>`
      const collar = `<path d="${arc(116, 62, 118)}" fill="none" stroke="${P.d2}" stroke-width="7" stroke-linecap="round" opacity=".5"/><path d="${arc(116, 62, 118)}" fill="none" stroke="${S.linU([[0, P.d3], [1, P.d1]], 80, 230, 210, 260)}" stroke-width="5.2" stroke-linecap="round"/>`
      const [bx, by] = pol(144, 144, 116, 90)
      const bell = `<g transform="translate(${f(bx)} ${f(by + 4)})"><g class="so-bell"><circle cy="7" r="7.2" fill="${S.radB([[0, '#fff3c4'], [0.6, '#f4c542'], [1, '#a47a14']], 0.35, 0.3, 0.8)}" stroke="#8a620c" stroke-width=".8"/><path d="M-5 8h10" stroke="#8a620c" stroke-width=".9"/><circle cy="10.2" r="1.3" fill="#6b4a08"/><path d="M-5 3Q0 0.5 5 3" stroke="#fff" stroke-opacity=".7" fill="none" stroke-width="1"/></g></g>`
      const mini = `<g transform="translate(${f(pol(144, 144, 116, 64)[0])} ${f(pol(144, 144, 116, 64)[1])}) rotate(-20)">${bow(S, P.d1, P.d2, P.d3, { s: 0.32, tails: false })}</g>`
      return earL + earR + collar + bell + sparkle(144, 20, 4.4, P.d3, 'k-tw') + sparkle(44, 120, 3, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1.3s"') + sparkle(246, 128, 3.4, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-2.2s"')
    },
  },
  // ───────────────────────── Corazones en órbita
  (() => {
    const heart = (P, c, s, hi) => `<path d="${heartD(s)}" fill="${c}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".8"/><ellipse cx="${-s * 0.4}" cy="${-s * 0.5}" rx="${s * 0.22}" ry="${s * 0.13}" fill="#fff" opacity=".75" transform="rotate(-30 ${-s * 0.4} ${-s * 0.5})"/>`
    const build = (S, P) => {
      const items = [
        { th: 10, T: 12, art: heart(P, P.d1, 17) },
        { th: 55, T: 12, art: heart(P, P.d3, 10) },
        { th: 100, T: 12, art: heart(P, P.d4, 12) },
        { th: 145, T: 12, art: heart(P, P.mix(P.d1, P.d3, 0.4), 15) },
        { th: 190, T: 12, art: heart(P, P.d1, 11) },
        { th: 235, T: 12, art: heart(P, P.d3, 16) },
        { th: 280, T: 12, art: heart(P, P.d4, 10) },
        { th: 325, T: 12, art: heart(P, P.d1, 13) },
      ]
      return orbit(S, { rx: 140, ry: 48, tilt: -18, items })
    }
    return {
      slug: 'corazones-en-orbita', name: 'Corazones en órbita', rarity: 'raro', price: 1100, coll: 'sakura', min: 52, palettes: PAL,
      css: '',
      back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.78, P.d1, 0], [0.88, P.d1, 0.16], [1, P.d1, 0]], 144, 144, 144)}"/>` + build(S, P).back,
      front: (S, P) => build(S, P).front + sparkle(40, 48, 4, P.d3, 'k-tw') + sparkle(248, 232, 4.4, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1.5s"') + sparkle(254, 60, 3, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-.7s"'),
    }
  })(),
  // ───────────────────────── Estrellitas fugaces
  {
    slug: 'estrellitas-fugaces', name: 'Estrellitas fugaces', rarity: 'epico', price: 1900, coll: 'sakura', min: 52, palettes: PAL,
    css: `${spin('sf-a', 'sf-o', 6.5)}${spin('sf-b', 'sf-o', 9, true)}${spin('sf-c', 'sf-o', 12)}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.76, P.d2, 0], [0.88, P.d1, 0.2], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const comet = (r, a, len, col, w) => {
        let tr = ''
        const K = 9
        for (let i = 0; i < K; i++) {
          const a0 = a - len + (len * i) / K, a1 = a - len + (len * (i + 1)) / K
          tr += `<path d="${band(r, a0, a1 + 0.5, (t) => (w * (i + t)) / K + 0.2, 6, 0, 0)}" fill="${col}" opacity="${(0.08 + (0.9 * (i + 1)) / K).toFixed(2)}"/>`
        }
        const [x, y] = pol(0, 0, r, a)
        return tr + sparkle(x, y, w * 2.4, '#fff', '', 1, 0.16) + `<circle cx="${f(x)}" cy="${f(y)}" r="${w * 0.9}" fill="${col}"/>`
      }
      let st = ''
      const R = rng(21)
      for (let i = 0; i < 8; i++) { const [x, y] = pol(CX, CY, 126 + R() * 14, R() * 360); st += sparkle(x, y, 2 + R() * 2.4, i % 2 ? P.d3 : P.d4, 'k-tw').replace('<path', `<path style="animation-delay:${-R() * 3}s"`) }
      return `<g>${st}</g>` + ctr(`<g class="sf-a">${comet(126, 0, 70, P.d3, 3.2)}</g><g class="sf-b">${comet(134, 140, 60, P.d4, 2.6)}</g><g class="sf-c">${comet(120, 250, 80, P.d1, 3.6)}</g>`)
    },
  },
]
