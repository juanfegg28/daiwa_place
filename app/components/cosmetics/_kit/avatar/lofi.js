// @ts-nocheck
// Colección LOFI NIGHT — noche tranquila: taza, lluvia, ventana y gato dormido. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth } from '../core/util.js'
import { ctr, sparkle, glow, mirror, crescentD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('noche', 'Noche cálida', '#F2A65A', '#1B1530', '#FFE2B8', '#8F7BFF'),
  pal('lila', 'Lila lofi', '#B79CFF', '#241446', '#EBE2FF', '#FFB3D6'),
  pal('te', 'Té verde', '#8FD3A0', '#0F2A1C', '#E4FFEA', '#F6D58E'),
  pal('atardecer', 'Atardecer', '#FF8E7A', '#3A1420', '#FFE1D6', '#FFC76B'),
]

export const LOFI = [
  // ───────────────────────── Taza humeante
  {
    slug: 'taza-humeante', name: 'Taza humeante', rarity: 'comun', price: 400, coll: 'lofi', min: 40, palettes: PAL,
    css: `.lt-s{animation:lt-s 3.8s ease-in-out infinite}${KF('lt-s', '0%{transform:translateY(8px) scaleX(.9);opacity:0}25%{opacity:.85}100%{transform:translateY(-30px) scaleX(1.25);opacity:0}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const cup = S.lin([[0, P.lt(P.d1, 0.35)], [0.5, P.d1], [1, P.dk(P.d1, 0.35)]], 0, 0, 1, 0)
      const steam = (x, d, h) => `<g transform="translate(${x} 0)"><path class="lt-s" style="animation-delay:${-d}s" d="M0 0C-6 -6 6 -12 0 -18C-6 -24 6 -30 0 -36" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".7"/></g>`
      const mug = `<g transform="translate(222 228)"><ellipse cy="40" rx="42" ry="9" fill="${S.lin([[0, P.d3], [1, P.mix(P.d3, P.d2, 0.45)]], 0, 0, 0, 1)}" stroke="${P.d2}" stroke-opacity=".4" stroke-width=".8"/>` +
        `<path d="M24 6H38C48 6 48 26 36 26H25" fill="none" stroke="${cup}" stroke-width="6.4" stroke-linecap="round"/><path d="M-30 -6H30L26 32C25 38 22 40 16 40H-16C-22 40 -25 38 -26 32Z" fill="#000" opacity=".28" transform="translate(2 3)"/><path d="M-30 -6H30L26 32C25 38 22 40 16 40H-16C-22 40 -25 38 -26 32Z" fill="${cup}" stroke="${P.d2}" stroke-opacity=".6" stroke-width="1"/><ellipse cy="-6" rx="30" ry="7.4" fill="${P.d2}" stroke="${P.d2}" stroke-opacity=".6" stroke-width="1"/><ellipse cy="-5" rx="25.6" ry="5.4" fill="${S.lin([[0, '#c58a52'], [1, '#6f4524']], 0, 0, 0, 1)}"/><path d="M-6 -5C-6 -8 -1 -8 0 -5C1 -8 6 -8 6 -5C6 -2 0 1 0 1C0 1 -6 -2 -6 -5Z" fill="#f6e3c8" opacity=".85"/><path d="M-22 4C-22 14 -20 24 -18 32" stroke="#fff" stroke-opacity=".28" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
        `<g transform="translate(0 -14)">${steam(-10, 0)}${steam(2, 1.3)}${steam(14, 2.5)}</g></g>`
      return mug + sparkle(40, 60, 3.4, P.d3, 'k-tw') + sparkle(248, 82, 2.6, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1.3s"')
    },
  },
  // ───────────────────────── Lluvia suave
  {
    slug: 'lluvia-suave', name: 'Lluvia suave', rarity: 'comun', price: 400, coll: 'lofi', min: 40, palettes: PAL,
    css: `.lr-d{animation:lr-d 1.5s linear infinite}${KF('lr-d', '0%{transform:translate(0,-26px);opacity:0}15%{opacity:.9}100%{transform:translate(-9px,22px);opacity:0}')}.lr-p{transform-box:fill-box;transform-origin:50% 50%;animation:lr-p 2.4s ease-out infinite}${KF('lr-p', '0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.6);opacity:0}')}`,
    back: (S, P) => glow(S, P.d4, 0.14),
    front: (S, P) => {
      const R = rng(52)
      const mask = S.mask(`<circle cx="144" cy="144" r="160" fill="${S.rad([[0.7, '#fff', 0], [0.76, '#fff', 1], [0.92, '#fff', 0.85], [1, '#fff', 0]], 144, 144, 160)}"/>`)
      let drops = ''
      for (let i = 0; i < 34; i++) {
        const x = -10 + R() * 308, y = -10 + R() * 308
        const len = 9 + R() * 8
        drops += `<g transform="translate(${f(x)} ${f(y)})"><g class="lr-d" style="animation-delay:${-(R() * 1.5).toFixed(2)}s;animation-duration:${(1.1 + R() * 0.9).toFixed(2)}s"><path d="M0 0L-2.4 ${f(len)}" stroke="${i % 3 ? P.d3 : P.d4}" stroke-width="2.2" stroke-linecap="round" opacity=".95"/></g></g>`
      }
      let rip = ''
      for (let i = 0; i < 6; i++) { const a = 20 + i * 28 + R() * 10; const [x, y] = pol(144, 144, 120, a); rip += `<ellipse class="lr-p" style="animation-delay:${-(R() * 2.4).toFixed(2)}s" cx="${f(x)}" cy="${f(y)}" rx="12" ry="4" fill="none" stroke="${P.d3}" stroke-width="1.2"/>` }
      const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${P.mix(P.d2, P.d3, 0.28)}" opacity=".85"><circle cx="-18" cy="6" r="12"/><circle cx="-2" cy="-4" r="16"/><circle cx="18" cy="2" r="13"/><rect x="-30" y="6" width="60" height="12" rx="6"/></g>`
      return `<g mask="${mask}">${drops}</g>` + rip + cloud(62, 30, 1) + cloud(232, 22, 0.8) + `<circle cx="144" cy="144" r="112.4" fill="none" stroke="${P.d3}" stroke-width="1.4" opacity=".6"/>`
    },
  },
  // ───────────────────────── Luz de ventana
  {
    slug: 'luz-de-ventana', name: 'Luz de ventana', rarity: 'comun', price: 450, coll: 'lofi', min: 40, palettes: PAL,
    css: `.lv-m{animation:lv-m 8s ease-in-out infinite}${KF('lv-m', '0%{transform:translate(0,0);opacity:0}15%{opacity:.9}100%{transform:translate(12px,-34px);opacity:0}')}.lv-g{animation:lv-g 6s ease-in-out infinite alternate}${KF('lv-g', 'from{opacity:.55}to{opacity:.95}')}`,
    back: (S, P) => {
      const sky = S.lin([[0, P.mix(P.d2, P.d4, 0.4)], [1, P.d2]], 0, 0, 0, 1)
      const frameC = P.mix(P.d2, P.d3, 0.22)
      const pane = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${sky}"/>${extra}`
      const R = rng(12)
      let stars = ''
      for (let i = 0; i < 16; i++) stars += sparkle(8 + R() * 272, 8 + R() * 272, 1.4 + R() * 1.8, '#fff', 'k-tw', 1, 0.14).replace('<path', `<path style="animation-delay:${-(R() * 3).toFixed(1)}s"`)
      const moon = `<g transform="translate(222 52)"><circle r="22" fill="${S.radB([[0, P.d3, 0.55], [1, P.d3, 0]])}"/><path d="${crescentD(13, 10.4, 5.4)}" fill="${P.d3}" transform="rotate(-24)"/></g>`
      const win = `<g><rect x="-2" y="-2" width="292" height="292" rx="14" fill="${frameC}"/>${pane(6, 6, 134, 134)}${pane(148, 6, 134, 134)}${pane(6, 148, 134, 134)}${pane(148, 148, 134, 134)}<g clip-path="${S.clip('<rect x="6" y="6" width="276" height="276" rx="5"/>')}">${stars}${moon}</g><path d="M144 0V288M0 144H288" stroke="${frameC}" stroke-width="8"/><rect x="-8" y="274" width="304" height="16" rx="6" fill="${P.mix(frameC, '#000', 0.2)}"/></g>`
      const beam = `<path d="M-6 6L140 -8L156 300L-6 282Z" fill="${S.lin([[0, P.d1, 0.5], [1, P.d1, 0]], 0, 0, 1, 1)}" class="lv-g"/>`
      return `<g opacity=".92">${win}</g>`
    },
    front: (S, P) => {
      const R = rng(24)
      let motes = ''
      for (let i = 0; i < 12; i++) { const [x, y] = pol(144, 144, 118 + R() * 24, R() * 360); motes += `<g transform="translate(${f(x)} ${f(y)})"><circle class="lv-m" style="animation-delay:${-(R() * 8).toFixed(1)}s;animation-duration:${(6 + R() * 4).toFixed(1)}s" r="${f(0.8 + R() * 1.4)}" fill="${P.d3}"/></g>` }
      return `<circle cx="144" cy="144" r="113" fill="none" stroke="${P.d1}" stroke-width="2.2" opacity=".85"/><circle cx="144" cy="144" r="116.4" fill="none" stroke="${P.d2}" stroke-width="1" opacity=".5"/>` + motes
    },
  },
  // ───────────────────────── Gato dormido
  {
    slug: 'gato-dormido', name: 'Gato dormido', rarity: 'raro', price: 1000, coll: 'lofi', min: 52, palettes: PAL,
    css: `.lg-b{transform-box:fill-box;transform-origin:50% 100%;animation:lg-b 4.4s ease-in-out infinite}${KF('lg-b', '0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.06)}')}.lg-z{animation:lg-z 4.4s ease-out infinite}${KF('lg-z', '0%{transform:translate(0,0) scale(.6);opacity:0}25%{opacity:1}100%{transform:translate(14px,-34px) scale(1.2);opacity:0}')}.lg-t{transform-box:fill-box;transform-origin:0 50%;animation:lg-t 5s ease-in-out infinite alternate}${KF('lg-t', 'from{transform:rotate(-3deg)}to{transform:rotate(4deg)}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const fur = S.lin([[0, P.mix('#3b3340', P.d1, 0.22)], [1, P.mix('#1c1722', P.d1, 0.12)]], 0, 0, 0, 1)
      const furL = P.mix('#5a4f5e', P.d1, 0.3)
      const cat = `<g transform="translate(150 252)"><ellipse cx="2" cy="26" rx="70" ry="9" fill="#000" opacity=".28"/><g class="lg-b"><path d="M-62 22C-70 4 -50 -16 -14 -20C18 -23 52 -14 60 6C66 20 54 28 38 28H-44C-54 28 -60 26 -62 22Z" fill="${fur}" stroke="${P.d2}" stroke-width="1.2"/><path d="M-40 -6C-18 -16 14 -16 40 -4" stroke="${furL}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/><path d="M-26 -2C-8 -8 12 -8 28 0" stroke="${furL}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/></g>` +
        `<g class="lg-b" style="animation-delay:-.3s"><path d="M34 -4C32 -22 46 -34 62 -32C76 -30 84 -20 82 -6C80 6 70 12 56 12C44 12 36 6 34 -4Z" fill="${fur}" stroke="${P.d2}" stroke-width="1.2"/><path d="M40 -26L38 -42L52 -32Z M76 -28L80 -42L66 -32Z" fill="${fur}" stroke="${P.d2}" stroke-width="1.2" stroke-linejoin="round"/><path d="M42 -30L42 -38L49 -33Z M74 -30L77 -38L69 -33Z" fill="${P.d1}" opacity=".85"/><path d="M46 -8Q52 -4 58 -8M62 -8Q68 -4 74 -8" stroke="#0c0a10" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M60 -2L58 1L62 1Z" fill="${P.d1}"/><path d="M50 4Q60 9 70 4" stroke="#0c0a10" stroke-opacity=".5" stroke-width="1" fill="none"/><path d="M40 -2L28 -4M40 1L28 3M80 -2L92 -4M80 1L92 3" stroke="${P.d3}" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round"/></g>` +
        `<g class="lg-t"><path d="M-60 20C-80 24 -92 12 -88 0C-86 -8 -78 -10 -74 -4" fill="none" stroke="${fur}" stroke-width="12" stroke-linecap="round"/><path d="M-60 20C-80 24 -92 12 -88 0" fill="none" stroke="${furL}" stroke-width="2" stroke-linecap="round" opacity=".6"/></g></g>`
      const zz = `<g transform="translate(236 214)">${[0, 1, 2].map((i) => `<g transform="translate(${i * 12} ${-i * 14}) scale(${0.8 + i * 0.3})"><path class="lg-z" style="animation-delay:${-i * 1.4}s" d="M-4 -5H4L-4 5H4" fill="none" stroke="${P.d3}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')}</g>`
      return cat + zz + sparkle(36, 56, 3.4, P.d3, 'k-tw') + sparkle(250, 70, 3, P.d4, 'k-tw').replace('<path', '<path style="animation-delay:-1s"')
    },
  },
]
