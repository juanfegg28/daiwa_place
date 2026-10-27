// @ts-nocheck
// HALLOWEEN I — Cripta de Hueso · Cruz de Plata · Noche de Calabazas · Cuervo de Hierro. Diseños originales (inspiración de moodboard, nada copiado).
import { CX, CY, f, pol, rng } from '../core/util.js'
import { ctr, glow } from '../core/svg.js'
import { pal, KF } from '../core/kit.js'

// ───────── utilidades compartidas con hw2.js
export const ringC = (r, w, c, op = 1, x = '') => `<circle cx="144" cy="144" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"${op !== 1 ? ` opacity="${op}"` : ''} ${x}/>`
export const SHARED_CSS = `.hw-flap{animation:hw-flap .7s ease-in-out infinite alternate;transform-box:view-box;transform-origin:0 0}${KF('hw-flap', 'from{transform:scaleY(1)}to{transform:scaleY(.42)}')}
.hw-sw{animation:hw-sw 5.5s ease-in-out infinite alternate;transform-box:view-box;transform-origin:0 0}${KF('hw-sw', 'from{transform:rotate(-3deg)}to{transform:rotate(3deg)}')}
.hw-fl{animation:hw-fl 6s ease-in-out infinite alternate}${KF('hw-fl', 'from{transform:translateY(-3px)}to{transform:translateY(3px)}')}
.hw-ey{animation:hw-ey 2.4s ease-in-out infinite}${KF('hw-ey', '0%,100%{opacity:.3}50%{opacity:1}')}
.hw-spin{animation:hw-spin 48s linear infinite;transform-box:view-box;transform-origin:0 0}${KF('hw-spin', 'to{transform:rotate(360deg)}')}.hw-spinr{animation-direction:reverse}.hw-spinf{animation-duration:22s}
.hw-gl{animation:hw-gl 5s ease-in-out infinite}${KF('hw-gl', '0%,60%,100%{opacity:0}75%{opacity:1}')}
.hw-tw{transform-box:fill-box;transform-origin:50% 50%;animation:hw-tw 3s ease-in-out infinite}${KF('hw-tw', '0%,100%{transform:scale(.4);opacity:.4}50%{transform:scale(1.1);opacity:1}')}
.hw-dr{animation:hw-dr 3.6s ease-in infinite}${KF('hw-dr', '0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(2px) scale(1)}100%{transform:translateY(40px);opacity:0}')}`

export function chainQ(P, [x0, y0], [cx, cy], [x1, y1], n = 14, sc = 1) {
  let o = ''
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t
    const x = a * x0 + b * cx + c * x1, y = a * y0 + b * cy + c * y1
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy)
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI
    const g = i % 2
      ? `<rect x="-3.2" y="-1.2" width="6.4" height="2.4" rx="1.2" fill="${P.d1}" stroke="#000" stroke-opacity=".5" stroke-width=".6"/>`
      : `<rect x="-4" y="-2.5" width="8" height="5" rx="2.5" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="3"/><rect x="-4" y="-2.5" width="8" height="5" rx="2.5" fill="none" stroke="${P.d1}" stroke-width="1.6"/><path d="M-2.4 -1.6H1" stroke="#fff" stroke-opacity=".7" stroke-width=".7" stroke-linecap="round"/>`
    o += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(${sc})">${g}</g>`
  }
  return o
}
const wing = (P, m, fill) => `<g transform="scale(${m} 1)"><path d="M3 -2C12 -16 32 -22 52 -14C48 -9 47 -3 49 4C43 -1 38 1 35 8C30 1 24 1 20 8C16 3 10 3 3 7Z" fill="${fill}" stroke="${P.d1}" stroke-width="1" stroke-linejoin="round"/><path d="M3 -2C20 -4 36 -2 49 4M3 -1L35 8M3 0L20 8" stroke="${P.d1}" stroke-opacity=".35" fill="none" stroke-width=".8"/></g>`
export const bat = (P, s = 1, fill = '#0a070d') => `<g transform="scale(${s})"><g class="hw-flap">${wing(P, 1, fill)}${wing(P, -1, fill)}</g><ellipse cx="0" cy="3" rx="4.6" ry="8" fill="${fill}" stroke="${P.d1}" stroke-width=".9"/><circle cx="0" cy="-6" r="4.3" fill="${fill}" stroke="${P.d1}" stroke-width=".9"/><path d="M-3.4 -8L-4.6 -14.4L-.8 -9.6ZM3.4 -8L4.6 -14.4L.8 -9.6Z" fill="${fill}" stroke="${P.d1}" stroke-width=".8" stroke-linejoin="round"/><circle cx="-1.7" cy="-6" r="1" fill="${P.d4}"/><circle cx="1.7" cy="-6" r="1" fill="${P.d4}"/></g>`
export function skull(S, P, s = 1) {
  const bone = S.lin([[0, '#fff'], [0.5, P.d3], [1, P.dk(P.d3, 0.35)]], 0.2, 0, 0.8, 1)
  return `<g transform="scale(${s})"><path d="M0 -24C16 -24 25 -13 25 -1C25 8 21 13 18 17V25C18 28 16 29 14 29H-14C-16 29 -18 28 -18 25V17C-21 13 -25 8 -25 -1C-25 -13 -16 -24 0 -24Z" fill="${bone}" stroke="#08060a" stroke-width="2.4" stroke-linejoin="round"/><path d="M-14 -16C-8 -21 -2 -22 4 -22" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-16 -4C-16 -11 -10 -14 -6 -11C-3 -9 -3 -1 -7 3C-11 6 -16 4 -16 -4ZM16 -4C16 -11 10 -14 6 -11C3 -9 3 -1 7 3C11 6 16 4 16 -4Z" fill="#0a0709"/><ellipse class="hw-ey" cx="-9" cy="-4" rx="2.8" ry="3.4" fill="${P.d4}"/><ellipse class="hw-ey" cx="9" cy="-4" rx="2.8" ry="3.4" fill="${P.d4}" style="animation-delay:-.3s"/><path d="M0 4L-3.4 11H3.4Z" fill="#0a0709"/><path d="M-12 20V27M-6 19V28M0 19V28M6 19V28M12 20V27" stroke="#0a0709" stroke-width="1.8" stroke-linecap="round"/><path d="M-13 19.5H13" stroke="#0a0709" stroke-width="1.4"/></g>`
}
export const diamond4 = (x, y, r, fill, stroke = '#fff', cls = '') => `<path${cls ? ` class="${cls}"` : ''} transform="translate(${f(x)} ${f(y)})" d="M0 ${-r}Q${r * 0.14} ${-r * 0.14} ${r} 0Q${r * 0.14} ${r * 0.14} 0 ${r}Q${-r * 0.14} ${r * 0.14} ${-r} 0Q${-r * 0.14} ${-r * 0.14} 0 ${-r}Z" fill="${fill}" stroke="${stroke}" stroke-width="${f(r * 0.24)}" stroke-linejoin="round"/>`
export const crossD = 'M0 -34Q5 -28 4 -21V-9H18Q27 -9 31 0Q27 9 18 9H4V30Q5 38 0 46Q-5 38 -4 30V9H-18Q-27 9 -31 0Q-27 -9 -18 -9H-4V-21Q-5 -28 0 -34Z'
export const crossG = (S, P, s = 1, extra = '') => {
  const m = S.lin([[0, '#fff'], [0.35, P.d1], [0.7, P.dk(P.d1, 0.45)], [1, P.d1]], 0, 0, 1, 1)
  return `<g transform="scale(${s})"${extra}><path d="${crossD}" fill="${m}" stroke="#050507" stroke-width="2.6" stroke-linejoin="round"/><path d="M0 -26V38M-22 0H22" stroke="#050507" stroke-opacity=".55" stroke-width="2.6"/><path d="M0 -26V38M-22 0H22" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/><circle cx="0" cy="0" r="3.4" fill="${P.d4}" stroke="#050507" stroke-width="1"/></g>`
}

// ═════════════ CRIPTA DE HUESO
const CR = [
  pal('hueso', 'Hueso y sangre', '#C9CDD8', '#08060B', '#F4EFE6', '#C0142E'),
  pal('violeta', 'Violeta', '#B8A4F0', '#0A0714', '#F1ECFF', '#8A4CFF'),
  pal('azul', 'Azul frío', '#9CC4F0', '#050A14', '#EAF4FF', '#2E7BFF'),
  pal('ambar', 'Ámbar', '#E0C27A', '#0E0A04', '#FFF4D6', '#FF7A1F'),
]
const swag = (P, d) => {
  const a = (g, r) => pol(144, 144, r, g)
  return `<g class="hw-fl" style="animation-delay:${-d}s">${chainQ(P, a(-157, 112), a(-124, 52), a(-92, 112), 15)}${chainQ(P, a(-88, 112), a(-56, 56), a(-22, 112), 15)}</g>`
}
const CRIPTA = [
  {
    slug: 'murcielago-y-cadenas', name: 'Murciélago y cadenas', rarity: 'raro', price: 1500, coll: 'cripta', min: 52, pad: 16, palettes: CR,
    css: SHARED_CSS,
    back: (S, P) => glow(S, P.d4, 0.2),
    front: (S, P) => ringC(113.6, 1.6, '#000', 0.6) + ringC(112, 2.2, P.d1) + ringC(109.6, 1.2, P.d4, 0.85) + swag(P, 0) +
      `<g transform="translate(58 42) rotate(-16)"><g class="hw-fl">${bat(P, 1.05)}</g></g>` + diamond4(46, 224, 9, '#0a0709', '#fff', 'hw-tw') + diamond4(68, 246, 12.5, P.d4, '#fff', 'hw-tw" style="animation-delay:-1.3s') + diamond4(238, 60, 5, P.d3, '#0a0709', 'hw-tw" style="animation-delay:-.7s'),
  },
  {
    slug: 'calavera-guardiana', name: 'Calavera guardiana', rarity: 'epico', price: 2800, coll: 'cripta', min: 56, pad: 24, palettes: CR,
    back: (S, P) => glow(S, P.d4, 0.32) + `<circle cx="144" cy="144" r="128" fill="${S.rad([[0.84, P.d4, 0], [0.92, P.d4, 0.22], [1, P.d4, 0]], 144, 144, 128)}" class="hw-ey"/>`,
    front: (S, P) => ringC(113.6, 1.6, '#000', 0.6) + ringC(112, 3, P.d1) + ringC(108.6, 1, P.d3, 0.7) + swag(P, 1.5) +
      ctr(`<g class="hw-spin"><g transform="translate(0 -128) rotate(0)"><g transform="rotate(90)">${bat(P, 0.8)}</g></g></g>`) +
      `<g transform="translate(58 44) rotate(-14)"><g class="hw-fl" style="animation-delay:-2s">${bat(P, 1.15)}</g></g>` +
      `<g transform="translate(212 216) rotate(10)"><g class="hw-fl" style="animation-delay:-1s">${skull(S, P, 1.4)}</g></g>` +
      `<path d="M198 252Q204 262 206 276" stroke="${P.d4}" stroke-width="2.4" fill="none" stroke-linecap="round" class="hw-dr"/>` +
      diamond4(40, 220, 10, '#0a0709', '#fff', 'hw-tw') + diamond4(64, 246, 14, P.d4, '#fff', 'hw-tw" style="animation-delay:-1.2s') + diamond4(240, 66, 6, P.d3, '#0a0709', 'hw-tw" style="animation-delay:-.6s'),
    css: '',
  },
]

// ═════════════ CRUZ DE PLATA
const CZ = [
  pal('plata', 'Plata', '#D4D8E4', '#050507', '#FFFFFF', '#7A86A8'),
  pal('sangre', 'Plata y sangre', '#CFCFD8', '#08040A', '#FFFFFF', '#C41E3A'),
  pal('oro', 'Oro viejo', '#E8CC8A', '#0A0804', '#FFF2CC', '#8A5A10'),
  pal('violeta', 'Violeta', '#C4B0F0', '#07050F', '#FFFFFF', '#6A3CD0'),
]
const CRUCES = [
  {
    slug: 'doble-anillo', name: 'Doble anillo', rarity: 'raro', price: 1400, coll: 'cruces', min: 52, pad: 20, palettes: CZ,
    css: `.cz-p{animation:cz-p 4.5s ease-in-out infinite}${KF('cz-p', '0%,100%{opacity:.55}50%{opacity:1}')}.cz-sm{animation:cz-sm 7s ease-in-out infinite alternate}${KF('cz-sm', 'from{transform:translate(0,0) scale(1);opacity:.5}to{transform:translate(14px,-6px) scale(1.4);opacity:.15}')}`,
    back: (S, P) => `<ellipse class="cz-sm" cx="236" cy="196" rx="30" ry="46" fill="${S.radB([[0, '#000', 0.7], [1, '#000', 0]])}"/>` + glow(S, P.d1, 0.14),
    front: (S, P) => ringC(118, 12, '#050507') + ringC(126.5, 4, P.d3, 1, 'class="cz-p"') + ringC(132, 3, '#050507') + ringC(111.4, 1.2, P.d1, 0.8) +
      `<g transform="translate(40 108) rotate(-4)">${crossG(S, P, 1.18)}</g><g transform="translate(40 108)"><path d="M0 -8L2 -2L8 0L2 2L0 8L-2 2L-8 0L-2 -2Z" fill="#fff" class="hw-tw" opacity=".9" transform="translate(-18 -20) scale(1.4)"/></g>` +
      `<g transform="translate(232 196) rotate(180)">${crossG(S, P, 0.82)}</g>` + diamond4(222, 62, 4.6, P.d3, '#050507', 'hw-tw'),
  },
  {
    slug: 'cruces-de-plata', name: 'Cruces de plata', rarity: 'epico', price: 3000, coll: 'cruces', min: 56, pad: 26, palettes: CZ,
    back: (S, P) => glow(S, P.d1, 0.28) + ctr(`<g class="hw-spin hw-spinr" style="animation-duration:90s">${Array.from({ length: 36 }, (_, i) => { const [a, b] = [pol(0, 0, 134, i * 10), pol(0, 0, i % 3 ? 139 : 146, i * 10)]; return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${P.d1}" stroke-width="${i % 3 ? 1 : 1.8}" opacity=".75"/>` }).join('')}</g>`),
    front: (S, P) => ringC(118, 12, '#050507') + ringC(126.5, 4, P.d3, 0.95, 'class="hw-ey"') + ringC(132, 3, '#050507') + ringC(111.4, 1.2, P.d1, 0.8) +
      `<g transform="translate(34 106)"><g class="hw-fl">${crossG(S, P, 1.5)}</g></g><g transform="translate(236 198) rotate(180)"><g class="hw-fl" style="animation-delay:-3s">${crossG(S, P, 0.95)}</g></g><g transform="translate(228 54) rotate(14)"><g class="hw-fl" style="animation-delay:-1.5s">${crossG(S, P, 0.5)}</g></g>` +
      [[34, 78, 7], [58, 150, 5], [250, 180, 6], [214, 236, 4.5]].map(([x, y, r], i) => diamond4(x, y, r, '#fff', '#050507', 'hw-tw" style="animation-delay:' + -i * 0.8 + 's')).join(''),
  },
]

// ═════════════ NOCHE DE CALABAZAS
const CB = [
  pal('naranja', 'Naranja', '#FF8A1F', '#120C08', '#FFC46B', '#8B8B84'),
  pal('violeta', 'Violeta bruja', '#A855F7', '#0E0816', '#E0C4FF', '#7CFF4D'),
  pal('toxico', 'Tóxico', '#7CFF4D', '#08120A', '#D8FFC4', '#FF8A1F'),
  pal('sangre', 'Sangre', '#E03030', '#120808', '#FFB0A8', '#D8D0C0'),
]
const pumpkin = (P, r, glowOn = true) => `<ellipse cx="0" cy="0" rx="${r}" ry="${r * 0.86}" fill="${P.d1}" stroke="#120c08" stroke-width="${f(r * 0.14)}"/><path d="M${-r * 0.5} ${-r * 0.8}Q${-r * 0.85} 0 ${-r * 0.5} ${r * 0.8}M${r * 0.5} ${-r * 0.8}Q${r * 0.85} 0 ${r * 0.5} ${r * 0.8}M0 ${-r * 0.86}V${r * 0.86}" stroke="#120c08" stroke-opacity=".45" fill="none" stroke-width="${f(r * 0.1)}"/><path d="M-1 ${-r * 0.86}Q0 ${-r * 1.25} ${r * 0.34} ${-r * 1.2}" stroke="#2c5a1c" stroke-width="${f(r * 0.24)}" fill="none" stroke-linecap="round"/><g class="${glowOn ? 'hw-ey' : ''}"><path d="M${-r * 0.5} ${-r * 0.1}L${-r * 0.2} ${-r * 0.4}L${-r * 0.08} ${-r * 0.06}ZM${r * 0.5} ${-r * 0.1}L${r * 0.2} ${-r * 0.4}L${r * 0.08} ${-r * 0.06}ZM${-r * 0.5} ${r * 0.22}L${-r * 0.2} ${r * 0.36}L0 ${r * 0.28}L${r * 0.2} ${r * 0.36}L${r * 0.5} ${r * 0.22}L${r * 0.3} ${r * 0.56}L0 ${r * 0.46}L${-r * 0.3} ${r * 0.56}Z" fill="${P.d3}"/></g>`
const leafOrn = (P, a, r) => { const [x, y] = pol(144, 144, r, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M0 -9C7 -7 9 0 4 5C2 1 -1 -1 -3 -2C-1 -4 0 -6 0 -9ZM0 -9C-7 -7 -9 0 -4 5C-2 1 1 -1 3 -2C1 -4 0 -6 0 -9Z" fill="${P.d1}"/><path d="M0 -3V9" stroke="${P.d1}" stroke-width="1.8"/><circle cy="9" r="1.6" fill="${P.d1}"/></g>` }
const CALABAZA = [
  {
    slug: 'marco-de-calabazas', name: 'Marco de calabazas', rarity: 'comun', price: 800, coll: 'calabaza', min: 52, palettes: CB,
    css: '',
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => ringC(124, 28, '#120c08') + ringC(110.4, 1.6, P.d1) + ringC(137.6, 1.6, P.d1, 0.8) + ringC(124, 19, P.d1, 0.08) +
      Array.from({ length: 16 }, (_, i) => (i % 2 ? leafOrn(P, i * 22.5, 124) : '')).join('') +
      Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(144, 144, 124, i * 45 + 22.5); return `<g transform="translate(${f(x)} ${f(y)})">${pumpkin(P, 12.5)}</g>` }).join(''),
  },
  {
    slug: 'verja-y-telarana', name: 'Verja y telaraña', rarity: 'raro', price: 1600, coll: 'calabaza', min: 56, pad: 12, palettes: CB,
    css: `.cb-sp{animation:cb-sp 3.8s ease-in-out infinite alternate;transform-origin:0 0;transform-box:view-box}${KF('cb-sp', 'from{transform:rotate(-7deg)}to{transform:rotate(7deg)}')}`,
    back: (S, P) => glow(S, P.d1, 0.25),
    front: (S, P) => {
      const web = (() => { let o = ''; const O = [236, 56]; for (let i = 0; i < 6; i++) { const a = 90 + i * 18; const [x, y] = pol(O[0], O[1], 92, a); o += `<path d="M${O[0]} ${O[1]}L${f(x)} ${f(y)}" stroke="#fff" stroke-width="1" opacity=".85"/>` } for (let k = 1; k <= 6; k++) { let d = ''; for (let i = 0; i < 6; i++) { const [x, y] = pol(O[0], O[1], k * 15, 90 + i * 18); d += (i ? `Q${f((x + pol(O[0], O[1], k * 15 + 3, 90 + i * 18 - 9)[0]) / 2)} ${f((y + pol(O[0], O[1], k * 15 - 3, 90 + i * 18 - 9)[1]) / 2)} ` : 'M') + `${f(x)} ${f(y)} ` } o += `<path d="${d}" fill="none" stroke="#fff" stroke-width=".9" opacity=".8"/>` } return o })()
      const pick = (x) => `<path d="M${x - 3.6} 292V228L${x} 216L${x + 3.6} 228V292Z" fill="#2a2420" stroke="#080605" stroke-width="1.4"/><path d="M${x - 1.2} 230V288" stroke="#8a7a68" stroke-opacity=".55" stroke-width="1"/>`
      let fence = `<rect x="14" y="244" width="260" height="6" rx="2" fill="#2a2420" stroke="#080605" stroke-width="1.2"/><rect x="14" y="266" width="260" height="6" rx="2" fill="#2a2420" stroke="#080605" stroke-width="1.2"/>`
      for (let i = 0; i < 13; i++) fence += pick(24 + i * 20)
      return ringC(124, 17, '#120c08') + ringC(111.6, 1.6, P.d1) + ringC(132.4, 1.4, P.d1, 0.8) +
        Array.from({ length: 12 }, (_, i) => leafOrn(P, i * 30 + 15, 123)).join('') + web +
        `<g transform="translate(206 64)"><g class="cb-sp"><path d="M0 0V40" stroke="#fff" stroke-width="1" opacity=".8"/><g transform="translate(0 44)"><ellipse rx="5" ry="6" fill="#0a0809"/><circle cy="-6" r="3.4" fill="#0a0809"/><path d="M-4 -2L-12 -8M-4 1L-13 2M-4 4L-12 11M4 -2L12 -8M4 1L13 2M4 4L12 11" stroke="#0a0809" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="-1.4" cy="-6.4" r=".9" fill="${P.d4}"/><circle cx="1.4" cy="-6.4" r=".9" fill="${P.d4}"/></g></g></g>` +
        fence + `<g transform="translate(58 254)">${pumpkin(P, 13)}</g><g transform="translate(236 262)">${pumpkin(P, 9)}</g>`
    },
  },
]

// ═════════════ CUERVO DE HIERRO
const CV = [
  pal('plata', 'Plata y noche', '#D5DAE5', '#050507', '#FFFFFF', '#7C8499'),
  pal('sangre', 'Plata y rubí', '#D8D2D8', '#08040A', '#FFFFFF', '#C41E3A'),
  pal('violeta', 'Amatista', '#C8B4F8', '#07050F', '#FFFFFF', '#7A4CE0'),
  pal('oro', 'Oro negro', '#E6C888', '#0A0804', '#FFF2CC', '#8A5A10'),
]
const scroll = (S, P, a) => { const [x, y] = pol(144, 144, 126, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M0 -10C8 -14 16 -8 12 0C9 5 3 3 4 -1C5 -4 8 -3 8 -1" fill="none" stroke="${P.d1}" stroke-width="2" stroke-linecap="round"/><path d="M0 -10C-8 -14 -16 -8 -12 0C-9 5 -3 3 -4 -1C-5 -4 -8 -3 -8 -1" fill="none" stroke="${P.d1}" stroke-width="2" stroke-linecap="round"/><path d="M0 -10V8" stroke="${P.d1}" stroke-width="2"/></g>` }
const lis = (S, P, a, r, s = 1) => { const [x, y] = pol(144, 144, r, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90}) scale(${s})"><path d="M0 -18C6 -10 4 -2 0 2C-4 -2 -6 -10 0 -18Z" fill="${P.d1}" stroke="#050507" stroke-width="1.2"/><path d="M-3 4C-12 -2 -16 -10 -10 -14C-7 -10 -7 -4 -2 0ZM3 4C12 -2 16 -10 10 -14C7 -10 7 -4 2 0Z" fill="${P.d1}" stroke="#050507" stroke-width="1.1"/><path d="M-6 6H6" stroke="${P.d1}" stroke-width="2.6" stroke-linecap="round"/><path d="M0 6V12" stroke="${P.d1}" stroke-width="2.4"/></g>` }
const raven = (P, s = 1, wings = true) => `<g transform="scale(${s})"><g class="hw-flap" style="animation-duration:1.6s">${[1, -1].map((m) => `<g transform="scale(${m} 1)"><path d="M4 -4C20 -22 46 -18 66 -4C58 -6 52 -4 48 0C50 4 44 4 40 8C40 12 34 10 30 14C28 16 20 10 14 12C12 8 8 6 4 6Z" fill="#07070a" stroke="${P.d1}" stroke-width="1" stroke-opacity=".8"/><path d="M12 0C26 -8 40 -8 54 -2M12 4C26 -2 38 0 48 4" stroke="${P.d1}" stroke-opacity=".35" fill="none" stroke-width=".8"/></g>`).join('')}</g><path d="M0 -10C6 -10 8 -4 7 4L4 22C2 27 -2 27 -4 22L-7 4C-8 -4 -6 -10 0 -10Z" fill="#07070a" stroke="${P.d1}" stroke-width=".9" stroke-opacity=".8"/><path d="M0 24L-5 36L0 32L5 36Z" fill="#07070a"/><circle cx="0" cy="-12" r="5.4" fill="#07070a" stroke="${P.d1}" stroke-width=".8" stroke-opacity=".8"/><path d="M-1.4 -14L0 -22L1.4 -14Z" fill="#17171d" stroke="${P.d1}" stroke-width=".6"/><circle cx="-1.8" cy="-12.6" r=".9" fill="${P.d4}"/><circle cx="1.8" cy="-12.6" r=".9" fill="${P.d4}"/></g>`
const CUERVO = [
  {
    slug: 'cuervo-y-hierro-forjado', name: 'Cuervo y hierro forjado', rarity: 'epico', price: 3000, coll: 'cuervo', min: 56, pad: 24, palettes: CV,
    css: '',
    back: (S, P) => glow(S, P.d4, 0.2) + ringC(130, 1.4, P.d1, 0.6),
    front: (S, P) => {
      const metal = S.linU([[0, '#fff'], [0.3, P.d1], [0.65, P.dk(P.d1, 0.55)], [1, P.d1]], 30, 30, 260, 260)
      return ringC(113.4, 2, '#000', 0.6) + `<circle cx="144" cy="144" r="117" fill="none" stroke="${metal}" stroke-width="5"/><circle cx="144" cy="144" r="125" fill="none" stroke="${metal}" stroke-width="2.4"/>` +
        Array.from({ length: 16 }, (_, i) => scroll(S, P, i * 22.5 + 11.25)).join('') + [0, 90, 180, 270].map((a) => lis(S, P, a, 134, 1.18)).join('') + [45, 135, 225, 315].map((a) => lis(S, P, a, 130, 0.72)).join('') +
        `<g transform="translate(144 258)"><g class="hw-fl">${raven(P, 0.82)}</g></g>` + diamond4(46, 60, 5, P.d3, '#050507', 'hw-tw') + diamond4(246, 232, 4, P.d3, '#050507', 'hw-tw" style="animation-delay:-1.4s')
    },
  },
  {
    slug: 'corona-de-hierro', name: 'Corona de hierro', rarity: 'legendario', price: 6500, coll: 'cuervo', min: 60, pad: 30, custom: true, palettes: CV,
    back: (S, P) => glow(S, P.d4, 0.34) + ctr(`<g class="hw-spin" style="animation-duration:70s">${Array.from({ length: 24 }, (_, i) => `<path d="M0 -150L${i % 2 ? 4 : 7} -134L0 -126L${i % 2 ? -4 : -7} -134Z" transform="rotate(${i * 15})" fill="${P.d4}" opacity="${i % 2 ? 0.4 : 0.8}"/>`).join('')}</g>`),
    front: (S, P) => {
      const metal = S.linU([[0, '#fff'], [0.3, P.d1], [0.65, P.dk(P.d1, 0.55)], [1, P.d1]], 30, 30, 260, 260)
      return ringC(113.4, 2, '#000', 0.6) + `<circle cx="144" cy="144" r="117" fill="none" stroke="${metal}" stroke-width="6"/><circle cx="144" cy="144" r="126" fill="none" stroke="${metal}" stroke-width="2.4"/><circle cx="144" cy="144" r="121.5" fill="none" stroke="${P.d4}" stroke-width="1" stroke-dasharray="3 5" class="hw-ey"/>` +
        ctr(`<g class="hw-spin hw-spinr" style="animation-duration:120s">${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5 + 11.25 - 90; return scroll(S, P, a).replace(/translate\(([\d.-]+) ([\d.-]+)\)/, (m, x, y) => `translate(${f(x - 144)} ${f(y - 144)})`) }).join('')}</g>`) +
        [0, 90, 180, 270].map((a) => lis(S, P, a, 136, 1.4)).join('') + [45, 135, 225, 315].map((a) => lis(S, P, a, 132, 0.8)).join('') +
        ctr(`<g class="hw-spin" style="animation-duration:26s"><g transform="translate(0 -150) rotate(90)">${raven(P, 0.5)}</g></g><g class="hw-spin" style="animation-duration:26s;animation-delay:-8.6s"><g transform="translate(0 -150) rotate(90)">${raven(P, 0.5)}</g></g><g class="hw-spin" style="animation-duration:26s;animation-delay:-17.3s"><g transform="translate(0 -150) rotate(90)">${raven(P, 0.5)}</g></g>`) +
        `<g transform="translate(144 262)"><g class="hw-fl">${raven(P, 0.95)}</g></g>` + [[40, 66, 6], [250, 70, 5], [34, 214, 5], [254, 214, 6]].map(([x, y, r], i) => diamond4(x, y, r, P.d3, '#050507', 'hw-tw" style="animation-delay:' + -i * 0.7 + 's')).join('')
    },
  },
]
export const HW1 = [...CRIPTA, ...CRUCES, ...CALABAZA, ...CUERVO]
