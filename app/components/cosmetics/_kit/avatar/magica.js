// @ts-nocheck
// Colección MAGIA ESTELAR — género "chica mágica": varitas, lunas, círculos mágicos. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, at, g, mirror, sparkle, dot, crescentD, starD, wingLeft, featherD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('lunar', 'Lunar', '#B9A4FF', '#4A2E9E', '#F1EAFF', '#FFD36B'),
  pal('rosa', 'Rosa estelar', '#FF9AD0', '#A8286E', '#FFE6F4', '#8EE7FF'),
  pal('zafiro', 'Zafiro', '#6FB4FF', '#1F3F96', '#E2F0FF', '#FFE08A'),
  pal('aurora', 'Aurora', '#7BF0C8', '#1E7A8A', '#E4FFF6', '#FF9ADB'),
]

export const MAGICA = [
  // ───────────────────────── Varita de luz
  {
    slug: 'varita-de-luz', name: 'Varita de luz', rarity: 'raro', price: 1000, coll: 'magica', min: 52, palettes: PAL,
    css: `${selfc('mv-s')}.mv-s{animation:mv-p 2.6s ease-in-out infinite}${KF('mv-p', '0%,100%{transform:scale(.9) rotate(0)}50%{transform:scale(1.12) rotate(12deg)}')}${selfc('mv-h')}.mv-h{animation:mv-h 2.6s ease-in-out infinite}${KF('mv-h', '0%,100%{opacity:.5;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}')}.mv-w{transform-box:fill-box;transform-origin:50% 100%;animation:mv-wv 4.4s ease-in-out infinite alternate}${KF('mv-wv', 'from{transform:rotate(-3deg)}to{transform:rotate(4deg)}')}${spin('mv-o', 'mv-or', 30)}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.78, P.d1, 0], [0.88, P.d1, 0.2], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const shaft = S.lin([[0, P.d3], [0.5, P.d1], [1, P.d2]], 0, 0, 1, 0)
      const gold = S.lin([[0, '#fff3c4'], [0.5, P.d4], [1, '#a47a14']], 0, 0, 1, 1)
      const starG = S.radB([[0, '#fff'], [0.5, P.d4], [1, P.d1]], 0.4, 0.35, 0.8)
      const wand = `<g transform="translate(254 270) rotate(24)"><g class="mv-w">` +
        `<rect x="-3.4" y="-78" width="6.8" height="78" rx="3.4" fill="${shaft}" stroke="${P.d2}" stroke-width=".8"/>` +
        `<rect x="-4.6" y="-26" width="9.2" height="5" rx="2" fill="${gold}"/><rect x="-4.6" y="-52" width="9.2" height="4" rx="2" fill="${gold}"/>` +
        `<ellipse cx="0" cy="2" rx="5.6" ry="4" fill="${gold}" stroke="#7a560a" stroke-width=".7"/>` +
        `<path d="M-1 -74Q-10 -60 -2 -50Q8 -40 0 -28" stroke="${P.d3}" stroke-width="2" fill="none" opacity=".8"/>` +
        `<g transform="translate(0 -90)"><circle r="22" fill="${S.radB([[0, P.d4, 0.7], [1, P.d4, 0]])}" class="mv-h"/>` +
        `<path d="M-6 3C-22 -3 -30 -14 -26 -22C-18 -22 -10 -14 -6 -6Z" fill="${S.lin([[0, '#fff'], [1, P.d3]], 1, 0, 0, 0)}" stroke="${P.d1}" stroke-width=".8"/><path d="M6 3C22 -3 30 -14 26 -22C18 -22 10 -14 6 -6Z" fill="${S.lin([[0, '#fff'], [1, P.d3]], 0, 0, 1, 0)}" stroke="${P.d1}" stroke-width=".8"/>` +
        `<g class="mv-s"><path d="${starD(5, 13, 6.2)}" fill="${starG}" stroke="#a47a14" stroke-width=".9" stroke-linejoin="round"/></g></g>` +
        `</g></g>`
      let spiral = ''
      for (let i = 0; i < 7; i++) { const t = i / 6; const x = 254 + Math.sin(i * 1.4) * 6 - t * 20, y = 268 - t * 64; spiral += sparkle(x, y, 2 + (1 - t) * 1.8, i % 2 ? P.d3 : P.d4, 'k-tw').replace('<path', `<path style="animation-delay:${-i * 0.3}s"`) }
      let ring = ''
      const R = rng(8)
      for (let i = 0; i < 7; i++) { const [x, y] = pol(0, 0, 124 + R() * 12, i * 51 + 10); ring += sparkle(x, y, 2 + R() * 2, i % 2 ? P.d3 : P.d4, 'k-tw').replace('<path', `<path style="animation-delay:${-R() * 3}s"`) }
      return wand + spiral + ctr(`<g class="mv-o">${ring}</g>`)
    },
  },
  // ───────────────────────── Tiara lunar
  {
    slug: 'tiara-lunar', name: 'Tiara lunar', rarity: 'epico', price: 2200, coll: 'magica', min: 56, palettes: PAL,
    css: `${selfc('mt-g')}.mt-g{animation:mt-g 3.4s ease-in-out infinite}${KF('mt-g', '0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}')}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.78, P.d1, 0], [0.88, P.d1, 0.22], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const silver = S.linU([[0, '#fff'], [0.4, P.d3], [0.75, P.d1], [1, P.d2]], 60, 10, 230, 70)
      const goldG = S.lin([[0, '#fff3c4'], [0.5, P.d4], [1, '#a47a14']], 0, 0, 1, 1)
      const bandA = `<path d="${arc(121, 212, 328)}" fill="none" stroke="${P.d2}" stroke-width="8" stroke-linecap="round" opacity=".5"/><path d="${arc(121, 212, 328)}" fill="none" stroke="${silver}" stroke-width="5.6" stroke-linecap="round"/>`
      const beads = [226, 244, 262, 282, 300, 318].map((a, i) => { const [x, y] = pol(144, 144, 121, a); return `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 2 ? 2.3 : 3.2}" fill="${S.radB([[0, '#fff'], [1, P.d3]], 0.35, 0.3, 0.8)}" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".5"/>` }).join('')
      const moon = `<g transform="translate(144 22)"><circle r="26" fill="${S.radB([[0, P.d4, 0.55], [1, P.d4, 0]])}" class="mt-g"/><path d="${crescentD(19, 15, 8)}" fill="${silver}" stroke="${P.d2}" stroke-width=".9" transform="rotate(-10)"/><path d="${starD(5, 6.4, 2.8)}" fill="${goldG}" stroke="#7a560a" stroke-width=".6" transform="translate(5.6 0)"/></g>`
      const small = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${crescentD(8.6, 6.8, 3.6)}" fill="${silver}" stroke="${P.d2}" stroke-width=".7"/></g>`
      const drop = (a, L) => { const [x, y] = pol(144, 144, 121, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a - 90})"><path d="M0 2L0 ${L}" stroke="${P.d3}" stroke-width="1"/><path d="M0 ${L}C-4 ${L + 3} -3.6 ${L + 8} 0 ${L + 10}C3.6 ${L + 8} 4 ${L + 3} 0 ${L}Z" fill="${S.radB([[0, '#fff'], [0.6, P.d1], [1, P.d2]], 0.35, 0.3, 0.8)}" stroke="${P.d2}" stroke-width=".5"/></g>` }
      return bandA + beads + small(88, 34, -38) + small(200, 34, 38) + moon + drop(236, 6) + drop(252, 4) + drop(306, 4) + drop(322, 6) + sparkle(60, 56, 4, P.d4, 'k-tw') + sparkle(228, 56, 4, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1.2s"') + sparkle(110, 10, 2.8, '#fff', 'k-tw').replace('<path', '<path style="animation-delay:-2s"')
    },
  },
  // ───────────────────────── Círculo mágico girando
  {
    slug: 'circulo-magico', name: 'Círculo mágico girando', rarity: 'epico', price: 2500, coll: 'magica', min: 52, palettes: PAL,
    css: `${spin('mc-a', 'mc-o', 60)}${spin('mc-b', 'mc-o', 44, true)}${spin('mc-c', 'mc-o', 90)}${selfc('mc-g')}.mc-g{animation:k-pu 3s ease-in-out infinite}`,
    back: (S, P) => {
      const R = rng(3)
      const glow = S.rad([[0.74, P.d1, 0], [0.84, P.d1, 0.35], [1, P.d1, 0]], 144, 144, 144)
      const star = (r, n, k, rot, w, op) => { let d = ''; for (let i = 0; i < n; i++) { const [x, y] = pol(0, 0, r, rot + (360 / n) * ((i * k) % n)); d += (i ? 'L' : 'M') + f(x) + ' ' + f(y) } return `<path d="${d}Z" fill="none" stroke="${P.d3}" stroke-width="${w}" stroke-linejoin="round" opacity="${op}"/>` }
      const rune = (a, r) => { const [x, y] = pol(0, 0, r, a); const k = Math.floor(R() * 5); const shapes = [`M-3 -4L0 4L3 -4M-2 0h4`, `M0 -5V5M-3 -2L3 2`, `M-3 4L0 -4L3 4M-2 1h4`, `M-3 -3H3M0 -3V4M-3 4H3`, `M-3 -4L3 4M3 -4L-3 4M0 -4V4`]; return `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})" d="${shapes[k]}" stroke="${P.d3}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` }
      let runes = ''
      for (let i = 0; i < 24; i++) runes += rune(i * 15 + 4, 131)
      const tri = (rot) => star(137, 3, 1, rot, 1.5, 0.85)
      return `<circle cx="144" cy="144" r="144" fill="${glow}"/>` + ctr(`<g class="mc-a"><circle r="138" fill="none" stroke="${P.d1}" stroke-width="1.6"/><circle r="124" fill="none" stroke="${P.d1}" stroke-width="1.6"/>${runes}${[0, 30, 60, 90].map((a) => `<path d="M0 0" />`).join('')}</g><g class="mc-b">${star(139, 6, 2, -90, 1.8, 1)}${tri(-90)}${tri(90)}</g><g class="mc-c">${star(139, 8, 3, -90, 1, 0.6)}</g>`)
    },
    front: (S, P) => {
      let gems = ''
      for (let i = 0; i < 6; i++) { const [x, y] = pol(CX, CY, 139, -90 + i * 60); gems += `<g transform="translate(${f(x)} ${f(y)}) rotate(${-90 + i * 60 + 90})"><path d="M0 -5L3.6 0L0 5L-3.6 0Z" fill="${P.d4}" stroke="#fff" stroke-width=".6"/></g>` }
      return `<circle cx="144" cy="144" r="113" fill="none" stroke="${P.d3}" stroke-width="1.3" opacity=".75"/><circle cx="144" cy="144" r="117" fill="none" stroke="${P.d1}" stroke-width="2.6" stroke-dasharray="1.5 6" stroke-linecap="round" opacity=".9"/>` + gems + sparkle(144, 4, 4, '#fff', 'mc-g')
    },
  },
  // ───────────────────────── Alas de estrellas
  {
    slug: 'alas-de-estrellas', name: 'Alas de estrellas', rarity: 'legendario', price: 5800, coll: 'magica', min: 80, pad: 76, custom: true, palettes: PAL,
    css: `.mw-f{transform-box:view-box;transform-origin:0 0;animation:mw-fl 4.8s ease-in-out infinite alternate}${KF('mw-fl', 'from{transform:rotate(3.5deg)}to{transform:rotate(-4deg)}')}`,
    back: (S, P) => {
      const cols = [P.d2, P.mix(P.d1, P.d2, 0.35), P.mix(P.d3, P.d4, 0.35), '#ffffff']
      const rows = [
        { n: 9, a: [128, 200], len: [64, 114], w: 15, stops: [[0, P.d2], [0.55, P.d1], [1, P.d3]], style: 'shard', edgeOp: 0.5, span: [0.02, 1] },
        { n: 9, a: [138, 204], len: [48, 90], w: 14, stops: [[0, P.d1], [0.6, P.d3], [1, '#fff']], style: 'shard', edgeOp: 0.6, span: [0.05, 0.98] },
        { n: 7, a: [148, 206], len: [24, 44], w: 12, stops: [[0, P.d3], [1, P.d4]], style: 'round', edgeOp: 0.6, span: [0.08, 0.95] },
      ]
      const wl = wingLeft(S, { arm: [[92, 148], [34, 118], [14, 46]], rows, cols, shaft: false })
      const wing = () => `<g transform="translate(92 148)"><g class="mw-f"><g transform="translate(-92 -148)">${wl}</g></g></g>`
      const R = rng(12)
      let st = ''
      for (let i = 0; i < 14; i++) st += sparkle(-40 + R() * 90, 10 + R() * 170, 2.2 + R() * 3.4, i % 3 ? '#fff' : P.d4, 'k-tw').replace('<path', `<path style="animation-delay:${-R() * 3}s"`)
      const glow = S.rad([[0, P.d1, 0.3], [1, P.d1, 0]], 30, 90, 110)
      return `<circle cx="30" cy="90" r="110" fill="${glow}"/><circle cx="258" cy="90" r="110" fill="${S.rad([[0, P.d1, 0.3], [1, P.d1, 0]], 258, 90, 110)}"/>` + wing() + mirror(wing()) + st + mirror(st)
    },
    front: () => '',
  },
]
