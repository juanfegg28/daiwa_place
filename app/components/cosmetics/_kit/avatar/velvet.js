// @ts-nocheck
// Colección VELVET ROUGE — terciopelo, seda, perlas y oro. Originales hechos con código.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, mirror, sparkle, dot, rose, leafD, bow, featherD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('rouge', 'Rouge', '#B3122F', '#3B0612', '#FF8FA3', '#F2C766'),
  pal('medianoche', 'Medianoche', '#3A3F9E', '#0E1030', '#A9B4FF', '#E8C97A'),
  pal('esmeralda', 'Esmeralda', '#0E7A5A', '#04281D', '#7FE8C2', '#E8C97A'),
  pal('ciruela', 'Ciruela', '#7E2A8C', '#2A0A33', '#E3A6F0', '#F2C766'),
]
const goldG = (S, P) => S.linU([[0, P.lt(P.d4, 0.7)], [0.35, P.d4], [0.7, P.dk(P.d4, 0.35)], [1, P.lt(P.d4, 0.4)]], 20, 20, 270, 270)

export const VELVET = [
  // ───────────────────────── Lazo de seda
  {
    slug: 'lazo-de-seda', name: 'Lazo de seda', rarity: 'comun', price: 450, coll: 'velvet', min: 40, palettes: PAL,
    css: `.vl-b{transform-box:fill-box;transform-origin:50% 40%;animation:vl-sw 5s ease-in-out infinite alternate}${KF('vl-sw', 'from{transform:rotate(-2deg)}to{transform:rotate(2.5deg)}')}`,
    back: (S, P) => {
      const gl = S.rad([[0.78, P.d1, 0], [0.86, P.d1, 0.22], [1, P.d1, 0]], 144, 144, 144)
      return `<circle cx="144" cy="144" r="144" fill="${gl}"/>`
    },
    front: (S, P) => {
      const rib = S.linU([[0, P.d3], [0.5, P.d1], [1, P.d2]], 20, 30, 120, 150)
      const sheen = `<path d="${arc(118, 196, 290)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round" transform="translate(0 -1.4)"/>`
      const ribbon = `<path d="${arc(118, 192, 292)}" fill="none" stroke="${P.d2}" stroke-width="8.2" stroke-linecap="round" opacity=".55"/><path d="${arc(118, 192, 292)}" fill="none" stroke="${rib}" stroke-width="6.4" stroke-linecap="round"/>` + sheen
      const pearl = `<circle cx="0" cy="0" r="4.4" fill="${S.radB([[0, '#fff'], [1, P.d3]], 0.35, 0.3, 0.8)}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".6"/>`
      return ribbon + `<g transform="translate(56 66) rotate(-30)"><g class="vl-b">${bow(S, P.d1, P.d2, P.d3, { s: 1.12 })}${pearl}</g></g>` + sparkle(36, 40, 5, P.d3, 'k-tw') + sparkle(110, 20, 3.4, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1.2s"')
    },
  },
  // ───────────────────────── Marco terciopelo
  {
    slug: 'marco-terciopelo', name: 'Marco terciopelo', rarity: 'raro', price: 1000, coll: 'velvet', min: 40, palettes: PAL,
    css: `${spin('vm-a', 'vm-sh', 7)}`,
    back: (S, P) => `<circle cx="144" cy="144" r="132" fill="${S.rad([[0.84, P.d1, 0], [0.9, P.d1, 0.35], [1, P.d1, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const vel = S.rad([[0.82, P.d2], [0.9, P.d1], [1, P.dk(P.d1, 0.45)]], 144, 144, 125)
      const gold = goldG(S, P)
      const shim = S.lin([[0, '#fff', 0], [0.5, '#fff', 0.38], [1, '#fff', 0]], 0, 0, 1, 0)
      const stitch = `<circle cx="144" cy="144" r="118" fill="none" stroke="${P.d3}" stroke-opacity=".5" stroke-width=".9" stroke-dasharray="3.4 3.2"/>`
      const btn = (a) => {
        const [x, y] = pol(0, 0, 118, a)
        return `<circle cx="${f(x)}" cy="${f(y)}" r="6.6" fill="${S.radB([[0, P.lt(P.d4, 0.8)], [0.55, P.d4], [1, P.dk(P.d4, 0.5)]], 0.38, 0.32, 0.8)}" stroke="${P.dk(P.d4, 0.6)}" stroke-width=".8"/><circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="none" stroke="${P.dk(P.d4, 0.45)}" stroke-width=".9"/>`
      }
      let dimples = ''
      for (let a = 22.5; a < 360; a += 45) { const [x, y] = pol(0, 0, 118, a); dimples += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="#000" opacity=".4"/>` }
      const sweep = `<path d="${band(118, -10, 38, (t) => 7 * Math.sin(Math.PI * t), 18, 0, 0)}" fill="${shim}" class="vm-sw" transform="rotate(0)"/>`
      return `<circle cx="144" cy="144" r="118" fill="none" stroke="${vel}" stroke-width="15"/><circle cx="144" cy="144" r="110.4" fill="none" stroke="${gold}" stroke-width="2.6"/><circle cx="144" cy="144" r="125.8" fill="none" stroke="${gold}" stroke-width="2.2"/>${stitch}` + ctr(`<g class="vm-a">${sweep}</g>${dimples}${[45, 135, 225, 315].map(btn).join('')}`)
    },
  },
  // ───────────────────────── Perlas y encaje
  {
    slug: 'perlas-y-encaje', name: 'Perlas y encaje', rarity: 'raro', price: 1200, coll: 'velvet', min: 52, palettes: PAL,
    css: `.vp-p{animation:vp-sh 5s ease-in-out infinite}${KF('vp-sh', '0%,70%,100%{opacity:.9}35%{opacity:1;filter:brightness(1.3)}')}${selfc('vp-t')}.vp-t{animation:k-tw 4s ease-in-out infinite}`,
    back: (S, P) => {
      const lace = (rr, n, size, op) => {
        let d = ''
        for (let i = 0; i < n; i++) {
          const a0 = (360 / n) * i, a1 = a0 + 360 / n
          const [x0, y0] = pol(0, 0, rr, a0), [x1, y1] = pol(0, 0, rr, a1)
          d += `M${f(x0)} ${f(y0)}A${size} ${size} 0 0 1 ${f(x1)} ${f(y1)}`
        }
        return `<path d="${d}" fill="none" stroke="${P.d3}" stroke-width="1.5" stroke-linecap="round" opacity="${op}"/>`
      }
      let eyelets = ''
      for (let i = 0; i < 36; i++) { const [x, y] = pol(0, 0, 127.5, i * 10 + 5); eyelets += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="none" stroke="${P.d3}" stroke-width=".8" opacity=".85"/>` }
      let loops = ''
      for (let i = 0; i < 36; i++) {
        const [x, y] = pol(0, 0, 133, i * 10 + 5)
        loops += `<path transform="translate(${f(x)} ${f(y)}) rotate(${i * 10 + 95})" d="M0 0C-5 -3 -5 -9 0 -8C5 -9 5 -3 0 0Z" fill="${P.d3}" fill-opacity=".18" stroke="${P.d3}" stroke-width=".7" opacity=".85"/>`
      }
      const bg = `<circle cx="144" cy="144" r="130" fill="none" stroke="${P.d1}" stroke-opacity=".25" stroke-width="22"/>`
      return bg + ctr(lace(121, 36, 5, 0.9) + lace(123, 36, 5.2, 0.45) + eyelets + loops)
    },
    front: (S, P) => {
      let pearls = ''
      const N = 30
      for (let i = 0; i < N; i++) {
        const [x, y] = pol(0, 0, 116, (360 / N) * i + 3)
        const gr = S.radB([[0, '#fff'], [0.55, P.lt(P.d3, 0.55)], [1, P.mix(P.d3, P.d1, 0.45)]], 0.35, 0.3, 0.8)
        pearls += `<g class="vp-p" style="animation-delay:${-(i * 0.17).toFixed(2)}s"><circle cx="${f(x)}" cy="${f(y)}" r="5.6" fill="${gr}" stroke="${P.d2}" stroke-opacity=".35" stroke-width=".6"/><circle cx="${f(x - 1.6)}" cy="${f(y - 1.8)}" r="1.3" fill="#fff" opacity=".9"/></g>`
      }
      const thread = `<circle cx="144" cy="144" r="116" fill="none" stroke="${P.d2}" stroke-opacity=".5" stroke-width="1" transform="translate(0 0)"/>`
      const bowEl = `<g transform="translate(144 262)">${bow(S, P.d1, P.d2, P.d3, { s: 0.55, tails: true })}</g>`
      const sp = [[-60, 128, 4], [-18, 134, 3], [200, 132, 3.4], [250, 130, 2.6]].map(([a, r, s], i) => { const [x, y] = pol(CX, CY, r, a); return sparkle(x, y, s, '#fff', 'vp-t').replace('<path', `<path style="animation-delay:${-i * 0.9}s"`) }).join('')
      return thread + ctr(pearls) + bowEl + sp
    },
  },
  // ───────────────────────── Rosas marchitas
  {
    slug: 'rosas-marchitas', name: 'Rosas marchitas', rarity: 'epico', price: 2600, coll: 'velvet', min: 56, palettes: PAL,
    css: `.vr-p{animation:vr-f 8s ease-in infinite}${KF('vr-f', '0%{transform:translate(0,0) rotate(0);opacity:0}12%{opacity:.95}100%{transform:translate(-16px,62px) rotate(200deg);opacity:0}')}.vr-s{transform-box:fill-box;transform-origin:50% 100%;animation:vr-sw 6s ease-in-out infinite alternate}${KF('vr-sw', 'from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}')}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.76, P.d2, 0], [0.86, P.d2, 0.5], [1, P.d2, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const green = P.mix(P.d2, '#1d3a22', 0.7)
      const stem = (a0, a1, rr) => {
        const pts = []
        for (let i = 0; i <= 14; i++) pts.push(pol(144, 144, rr + Math.sin(i * 0.9) * 3, a0 + ((a1 - a0) * i) / 14))
        return `<path d="${smooth(pts)}" fill="none" stroke="${P.dk(green, 0.3)}" stroke-width="4.4" stroke-linecap="round"/><path d="${smooth(pts)}" fill="none" stroke="${green}" stroke-width="2.6" stroke-linecap="round"/>`
      }
      const thorns = (a0, a1, rr) => {
        let o = ''
        for (let i = 1; i < 8; i++) { const a = a0 + ((a1 - a0) * i) / 8; const [x, y] = pol(144, 144, rr + 2, a); o += `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90 + (i % 2 ? 170 : 10)})" d="M-1.5 0L0 -5L1.5 0Z" fill="${P.d3}" opacity=".7"/>` }
        return o
      }
      const lf = (a, rr, side, sz = 1) => { const [x, y] = pol(144, 144, rr, a); return `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90 + side * 58}) scale(${sz})" d="${leafD(17, 5.4)}" fill="${S.lin([[0, P.dk(green, 0.2)], [1, P.mix(green, P.d3, 0.25)]], 0, 1, 0, 0)}" stroke="${P.d3}" stroke-opacity=".3" stroke-width=".5"/>` }
      let o = stem(-100, 30, 119) + thorns(-100, 30, 119) + stem(100, 240, 120) + thorns(100, 240, 120) + stem(240, 262, 119)
      for (const a of [-80, -62, -44, -26, -8, 12, 110, 128, 146, 164, 182, 200, 220]) o += lf(a, 120, a % 2 ? 1 : -1, 1.5)
      const roses = [[-40, 124, 31, 0.2], [-72, 117, 21, 0.4], [-8, 118, 18, 0.45], [152, 124, 28, 0.28], [196, 119, 19, 0.5], [118, 118, 15, 0.42], [236, 118, 14, 0.5]]
      for (const [a, rr, s, w] of roses) { const [x, y] = pol(144, 144, rr, a); o += rose(S, x, y, s, P.d1, P.d2, P.d3, { wither: w, rot: a }) }
      let pet = ''
      for (let i = 0; i < 4; i++) { const [x, y] = pol(144, 144, 128, -46 + i * 14); pet += `<g transform="translate(${f(x)} ${f(y)})"><path class="vr-p" style="animation-delay:${-i * 2}s" d="M0 0C-4 -4 -7 2 -1 7C4 4 5 -2 0 0Z" fill="${P.d1}"/></g>` }
      return o + pet
    },
  },
  // ───────────────────────── Antifaz dorado
  {
    slug: 'antifaz-dorado', name: 'Antifaz dorado', rarity: 'epico', price: 2800, coll: 'velvet', min: 56, pad: 14, palettes: PAL,
    css: `.va-p{transform-box:fill-box;transform-origin:50% 100%;animation:va-pl 5s ease-in-out infinite alternate}${KF('va-pl', 'from{transform:rotate(-4deg)}to{transform:rotate(5deg)}')}${spin('va-a', 'va-sp', 90)}`,
    back: (S, P) => `<circle cx="144" cy="144" r="144" fill="${S.rad([[0.78, P.d4, 0], [0.88, P.d4, 0.2], [1, P.d4, 0]], 144, 144, 144)}"/>`,
    front: (S, P) => {
      const gold = S.lin([[0, P.lt(P.d4, 0.75)], [0.4, P.d4], [1, P.dk(P.d4, 0.45)]], 0, 0, 1, 1)
      const goldD = S.lin([[0, P.d4], [1, P.dk(P.d4, 0.6)]], 0, 0, 0, 1)
      const maskD = 'M-40 2C-41 -14 -26 -24 -12 -15C-7 -12 7 -12 12 -15C26 -24 41 -14 40 2C39 16 24 22 11 13C6 9 -6 9 -11 13C-24 22 -39 16 -40 2Z'
      const eyes = 'M-31 1C-31 -6 -22 -9 -15 -4C-9 0 -11 7 -18 8C-26 9 -31 6 -31 1ZM31 1C31 -6 22 -9 15 -4C9 0 11 7 18 8C26 9 31 6 31 1Z'
      const swirl = `<path d="M-37 -2C-36 -10 -29 -14 -22 -12M37 -2C36 -10 29 -14 22 -12M-6 -12Q0 -17 6 -12M-36 8C-30 13 -22 13 -17 10M36 8C30 13 22 13 17 10" stroke="${P.dk(P.d4, 0.55)}" stroke-width="1" fill="none" stroke-linecap="round"/>`
      const gem = (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${S.radB([[0, P.d3], [0.6, P.d1], [1, P.d2]], 0.35, 0.3, 0.8)}" stroke="${P.dk(P.d4, 0.5)}" stroke-width=".8"/><circle cx="${-r * 0.3}" cy="${-r * 0.35}" r="${r * 0.28}" fill="#fff" opacity=".8"/></g>`
      const feather = (rot, len, col) => `<g transform="rotate(${rot})"><path class="va-p" d="${featherD(len, 8, 'round', 0.3)}" fill="${S.lin([[0, col], [1, P.mix(col, P.d3, 0.55)]], 0, 1, 0, 0)}" stroke="${P.d3}" stroke-opacity=".5" stroke-width=".6"/><path d="M0 0Q2 ${-len * 0.5} 2.6 ${-len * 0.9}" stroke="${P.d3}" stroke-opacity=".5" fill="none" stroke-width=".7"/></g>`
      const mk = `<g transform="translate(226 62) rotate(24) scale(0.95)">` +
        `<g transform="translate(-30 -14)">${feather(-30, 56, P.d1)}${feather(-4, 62, P.d2)}${feather(22, 50, P.d1)}</g>` +
        `<path d="M-40 4L-62 28L-46 22L-52 40L-36 20Z" fill="${P.d1}" opacity=".9" transform="translate(6 6)"/>` +
        `<path d="${maskD}" fill="#000" opacity=".35" transform="translate(1.5 3)"/>` +
        `<path d="${maskD}${eyes}" fill-rule="evenodd" fill="${gold}" stroke="${P.dk(P.d4, 0.5)}" stroke-width="1"/>` +
        `<path d="${eyes}" fill="none" stroke="${goldD}" stroke-width="1.4"/>${swirl}` +
        gem(0, -10, 4.4) + gem(-23, -12, 2.8) + gem(23, -12, 2.8) + gem(-37, 3, 2) + gem(37, 3, 2) +
        `<path d="M-40 2Q-52 -2 -58 6M40 2Q52 -2 58 6" stroke="${P.d1}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`
      const filig = `<path d="${arc(119, 200, 300)}" fill="none" stroke="${gold}" stroke-width="3.2" stroke-linecap="round"/>` + `<g>${[212, 236, 262, 288].map((a) => { const [x, y] = pol(144, 144, 119, a); return `<circle cx="${f(x)}" cy="${f(y)}" r="2.5" fill="${P.d4}" stroke="${P.dk(P.d4, 0.5)}" stroke-width=".6"/>` }).join('')}</g>`
      return filig + mk + sparkle(34, 224, 5, P.d4, 'k-tw') + sparkle(16, 120, 3, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1s"')
    },
  },
]
