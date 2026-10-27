// @ts-nocheck
// HALLOWEEN II — Barroco Monocromo · Creepypastas (ambiente original) · Vampiro Azul
import { CX, CY, f, pol, rng, smooth } from '../core/util.js'
import { ctr, glow, rose, starD } from '../core/svg.js'
import { pal, KF } from '../core/kit.js'
import { ringC, SHARED_CSS, chainQ, bat, diamond4 } from './hw1.js'

const X_CSS = `.hx-fog{animation:hx-fog 14s ease-in-out infinite alternate}${KF('hx-fog', 'from{transform:translateX(-14px)}to{transform:translateX(14px)}')}
.hx-fk{animation:hx-fk .9s steps(1) infinite}${KF('hx-fk', '0%{opacity:.9}20%{opacity:.2}35%{opacity:.8}60%{opacity:0}75%{opacity:.7}100%{opacity:.9}')}
.hx-st{animation:hx-st .5s steps(6) infinite}${KF('hx-st', 'to{stroke-dashoffset:-37}')}
.hx-gl{animation:hx-gl 3.4s steps(1) infinite}${KF('hx-gl', '0%,100%{transform:translate(0,0)}8%{transform:translate(5px,-1px)}10%{transform:translate(-4px,2px)}12%,60%{transform:translate(0,0)}62%{transform:translate(-6px,0)}64%{transform:translate(0,0)}')}
.hx-sl{animation:hx-sl 2.6s steps(1) infinite}${KF('hx-sl', '0%,100%{transform:translateX(0)}12%{transform:translateX(var(--d))}16%{transform:translateX(0)}55%{transform:translateX(calc(var(--d) * -.7))}58%{transform:translateX(0)}')}
.hx-ash{animation:hx-ash 7s linear infinite}${KF('hx-ash', '0%{transform:translateY(-8px);opacity:0}15%{opacity:.9}100%{transform:translateY(60px) translateX(10px);opacity:0}')}
.hx-boil1{animation:hx-b1 .5s steps(1) infinite}.hx-boil2{animation:hx-b2 .5s steps(1) infinite}${KF('hx-b1', '0%{opacity:1}50%{opacity:0}')}${KF('hx-b2', '0%{opacity:0}50%{opacity:1}')}
.hx-kn{animation:hx-kn 5s ease-in-out infinite}${KF('hx-kn', '0%,100%{transform:translate(0,0)}50%{transform:translate(-2px,2px)}')}
.hx-sw{animation:hx-sw 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}${KF('hx-sw', '0%,100%{transform:scale(1)}50%{transform:scale(1.06)}')}
.hx-gld{animation:hx-gld 4.4s ease-in-out infinite}${KF('hx-gld', '0%{transform:translate(-30px,30px);opacity:0}30%{opacity:1}60%,100%{transform:translate(34px,-34px);opacity:0}')}`

// ═════════════ BARROCO MONOCROMO
const BA = [
  pal('grafito', 'Grafito', '#BFC3CC', '#08080A', '#FFFFFF', '#6C707A'),
  pal('sepia', 'Sepia', '#D6BE98', '#0B0805', '#FFF4DC', '#7A5A34'),
  pal('rosa', 'Rosa ceniza', '#E3B8C4', '#0A0608', '#FFEAF0', '#8A5A68'),
  pal('acero', 'Azul acero', '#A8C4DE', '#05080C', '#EAF4FF', '#4A6A8A'),
]
const metalU = (S, P) => S.linU([[0, '#fff'], [0.28, P.d1], [0.6, P.dk(P.d1, 0.6)], [0.82, P.d1], [1, P.d3]], 20, 20, 270, 270)
const acanto = (S, P, a, r, s = 1) => { const [x, y] = pol(144, 144, r, a); const m = metalU(S, P); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90}) scale(${s})"><path d="M0 10C-14 6 -20 -8 -10 -20C-6 -13 -3 -8 0 -4C3 -8 6 -13 10 -20C20 -8 14 6 0 10Z" fill="${m}" stroke="#08080a" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 6C-8 2 -11 -6 -7 -13M0 6C8 2 11 -6 7 -13M0 6V-3" fill="none" stroke="#08080a" stroke-opacity=".6" stroke-width="1.1"/><path d="M-16 8C-26 6 -26 -6 -18 -8C-14 -9 -12 -5 -15 -3" fill="none" stroke="${m}" stroke-width="2.6" stroke-linecap="round"/><path d="M16 8C26 6 26 -6 18 -8C14 -9 12 -5 15 -3" fill="none" stroke="${m}" stroke-width="2.6" stroke-linecap="round"/></g>` }
const baroqueRing = (S, P) => { const m = metalU(S, P); return ringC(113.4, 2, '#000', 0.6) + `<circle cx="144" cy="144" r="119" fill="none" stroke="#08080a" stroke-width="14"/><circle cx="144" cy="144" r="119" fill="none" stroke="${m}" stroke-width="9"/><circle cx="144" cy="144" r="119" fill="none" stroke="#08080a" stroke-opacity=".55" stroke-width="1.4"/><circle cx="144" cy="144" r="114.8" fill="none" stroke="${P.d3}" stroke-opacity=".8" stroke-width="1"/>` + Array.from({ length: 12 }, (_, i) => acanto(S, P, i * 30 + 15, 128, 0.95)).join('') + [0, 90, 180, 270].map((a) => acanto(S, P, a, 130, 1.25)).join('') + `<circle cx="144" cy="144" r="119" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="30 800" opacity=".0"/>` + ctr(`<g class="hw-spin" style="animation-duration:9s"><circle r="119" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="26 722" stroke-linecap="round" opacity=".75"/></g>`) }
const sword = (S, P, rot, x, y) => { const bl = S.lin([[0, '#fff'], [0.5, P.d1], [1, P.dk(P.d1, 0.5)]], 0, 0, 1, 0); return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-2.4 -4L0 -78L2.4 -4Z" fill="${bl}" stroke="#08080a" stroke-width="1"/><path d="M-12 -2Q0 -9 12 -2M-10 0Q0 6 10 0" fill="none" stroke="${P.d3}" stroke-width="2.2" stroke-linecap="round"/><path d="M-12 -2Q-14 8 -6 12M12 -2Q14 8 6 12" fill="none" stroke="${P.d1}" stroke-width="1.6" stroke-linecap="round"/><rect x="-2" y="2" width="4" height="16" rx="2" fill="#08080a" stroke="${P.d1}" stroke-width=".8"/><circle cy="21" r="3.6" fill="${P.d1}" stroke="#08080a" stroke-width="1"/><g class="hx-gld"><path d="M0 -30L1.8 -26L6 -24.4L1.8 -22.8L0 -18.8L-1.8 -22.8L-6 -24.4L-1.8 -26Z" fill="#fff"/></g></g>` }
const BARROCO = [
  {
    slug: 'marco-barroco-gris', name: 'Marco barroco gris', rarity: 'raro', price: 1800, coll: 'barroco', min: 56, pad: 22, palettes: BA,
    css: SHARED_CSS + X_CSS,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => baroqueRing(S, P) + diamond4(52, 62, 8, '#fff', '#08080a', 'hw-tw') + diamond4(236, 230, 5, P.d3, '#08080a', 'hw-tw" style="animation-delay:-1.2s'),
  },
  {
    slug: 'rosas-y-espadas', name: 'Rosas y espadas', rarity: 'epico', price: 3200, coll: 'barroco', min: 60, pad: 26, palettes: BA,
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      const pearls = (() => { let o = ''; for (let i = 0; i <= 10; i++) { const t = i / 10, x = (1 - t) * (1 - t) * 196 + 2 * (1 - t) * t * 214 + t * t * 246, y = (1 - t) * (1 - t) * 62 + 2 * (1 - t) * t * 120 + t * t * 112; o += `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 3 ? 2.6 : 3.6}" fill="${P.d3}" stroke="#08080a" stroke-width=".8"/>` } return o })()
      return baroqueRing(S, P) +
        `<g class="hw-fl">${rose(S, 62, 236, 22, P.d3, P.dk(P.d1, 0.35), '#fff', { rot: -10 })}${rose(S, 94, 252, 16, P.d3, P.dk(P.d1, 0.35), '#fff', { rot: 20 })}${rose(S, 38, 210, 15, P.d3, P.dk(P.d1, 0.35), '#fff', { rot: -30 })}</g>` +
        sword(S, P, 48, 232, 250) + sword(S, P, -42, 252, 238).replace('hx-gld"', 'hx-gld" style="animation-delay:-2s"') +
        `<g class="hw-fl" style="animation-delay:-2s">${pearls}<g transform="translate(196 62)"><path d="M0 0C-8 -8 -16 -2 -10 6C-5 10 -1 4 0 0C1 4 5 10 10 6C16 -2 8 -8 0 0Z" fill="${P.d1}" stroke="#08080a" stroke-width="1.2"/><circle r="2.6" fill="${P.d3}"/></g></g>` +
        `<g transform="translate(238 118)"><g class="hw-fl" style="animation-delay:-1s">${rose(S, 0, 0, 20, '#fff', P.d1, '#fff')}</g></g>` +
        `<g class="hx-sw"><path d="M64 60L68 71L80 75L68 79L64 90L60 79L48 75L60 71Z" fill="${P.d1}" stroke="#08080a" stroke-width="1.6" stroke-linejoin="round"/></g>` + diamond4(44, 108, 4, '#fff', '#08080a', 'hw-tw')
    },
  },
]

// ═════════════ CREEPYPASTAS — sets de ambiente (originales; sin personajes)
const CPA = [
  pal('niebla', 'Niebla', '#B9C4C0', '#050807', '#E8F0EC', '#8A9A94'),
  pal('sangre', 'Niebla roja', '#D0A8A8', '#0A0505', '#FFE8E4', '#B01818'),
  pal('verde', 'Enfermizo', '#A8D080', '#060A04', '#EEFFD8', '#5E8A2E'),
  pal('azul', 'Frío', '#9CB8D8', '#04070C', '#E6F0FF', '#4A6A96'),
]
const trees = (P, n, seed, lenMin, lenMax) => { const R = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const a = i * (360 / n) + R() * 6; if (a > 258 && a < 282 && false) continue; const L = lenMin + R() * (lenMax - lenMin), [x0, y0] = pol(144, 144, 108, a), [x1, y1] = pol(144, 144, 108 + L, a), w = 1.6 + R() * 2.2; o += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="#000" stroke-width="${f(w + 1.8)}" stroke-linecap="round"/><path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${P.d1}" stroke-opacity=".5" stroke-width="${f(w)}" stroke-linecap="round"/>`; for (let b = 0; b < 3; b++) { const t = 0.35 + b * 0.22, bx = x0 + (x1 - x0) * t, by = y0 + (y1 - y0) * t, ba = a + (R() < 0.5 ? -1 : 1) * (28 + R() * 20), [bx2, by2] = pol(bx, by, 6 + R() * 12, ba); o += `<path d="M${f(bx)} ${f(by)}L${f(bx2)} ${f(by2)}" stroke="${P.d1}" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>` } } return o }
const fogB = (S, P, n, seed, op) => { const R = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const [x, y] = pol(144, 144, 112 + R() * 14, R() * 360); o += `<ellipse class="hx-fog" style="animation-delay:${-(R() * 14).toFixed(1)}s;animation-duration:${(9 + R() * 8).toFixed(1)}s" cx="${f(x)}" cy="${f(y)}" rx="${f(34 + R() * 26)}" ry="${f(9 + R() * 8)}" fill="${S.radB([[0, P.d1, op], [1, P.d1, 0]])}"/>` } return o }
const flicks = (P, seed) => { const R = rng(seed); let o = ''; for (let i = 0; i < 7; i++) { const [x, y] = pol(144, 144, 112 + R() * 18, R() * 360); o += `<rect class="hx-fk" style="animation-delay:${-(R() * 0.9).toFixed(2)}s" x="${f(x - 7)}" y="${f(y)}" width="${f(8 + R() * 14)}" height="1.4" fill="${P.d3}"/>` } return o }
const BOSQUE = [
  {
    slug: 'bosque-en-la-niebla', name: 'Bosque en la niebla', rarity: 'raro', price: 1500, coll: 'creepy', min: 56, pad: 40, palettes: CPA,
    css: SHARED_CSS + X_CSS,
    back: (S, P) => glow(S, P.d1, 0.14) + fogB(S, P, 8, 4, 0.36),
    front: (S, P) => ringC(113.2, 2.4, '#000', 0.7) + ringC(111.6, 1, P.d1, 0.7) + trees(P, 30, 12, 14, 40) + fogB(S, P, 6, 9, 0.3) + flicks(P, 3),
  },
  {
    slug: 'estatica-y-arboles', name: 'Estática y árboles', rarity: 'epico', price: 3000, coll: 'creepy', min: 60, pad: 44, palettes: CPA,
    back: (S, P) => glow(S, P.d4, 0.2) + fogB(S, P, 10, 6, 0.4),
    front: (S, P) => {
      const gl = (c, dx) => `<g class="hx-gl" style="animation-delay:${dx}s"><circle cx="144" cy="144" r="121" fill="none" stroke="${c}" stroke-width="2.4" opacity=".7"/></g>`
      return ringC(113.2, 2.4, '#000', 0.7) + ringC(111.6, 1, P.d1, 0.7) + `<circle cx="144" cy="144" r="120" fill="none" stroke="#000" stroke-width="12" opacity=".8"/><circle class="hx-st" cx="144" cy="144" r="120" fill="none" stroke="${P.d3}" stroke-width="8" stroke-dasharray="2 1 4 2 1 5 3 1 2 3" opacity=".82"/><circle class="hx-st" cx="144" cy="144" r="120" fill="none" stroke="${P.d4}" stroke-width="3" stroke-dasharray="5 3 1 6 2 2" style="animation-duration:.7s" opacity=".6"/>` +
        gl('#ff2a3a', 0) + gl('#2affff', -1.7) + trees(P, 38, 22, 20, 52) + fogB(S, P, 8, 11, 0.38) + flicks(P, 5)
    },
  },
]

// Duerme.  (ambiente: tinta, arañazos y goteo)
const CPB = [
  pal('tinta', 'Tinta y sangre', '#F2F2F2', '#050505', '#FFFFFF', '#B3141E'),
  pal('blanco', 'Blanco y negro', '#F2F2F2', '#050505', '#FFFFFF', '#9A9AA2'),
  pal('azul', 'Tinta azul', '#E4ECF8', '#04060A', '#FFFFFF', '#2E5CC0'),
  pal('verde', 'Tinta tóxica', '#E8F4E0', '#040704', '#FFFFFF', '#3E9A28'),
]
const inkRing = (seed, r, amp) => { const R = rng(seed); const pts = Array.from({ length: 56 }, (_, i) => pol(144, 144, r + (R() - 0.5) * amp + (i % 2 ? 2.2 : -2.2), (i * 360) / 56)); return smooth(pts, true) }
const inkFrame = (P) => `<g class="hx-boil1"><path d="${inkRing(3, 121, 5)}" fill="none" stroke="#000" stroke-width="13"/><path d="${inkRing(5, 114.5, 4)}" fill="none" stroke="${P.d1}" stroke-width="2.2" stroke-linejoin="round" stroke-dasharray="26 3 9 4 40 2"/></g><g class="hx-boil2"><path d="${inkRing(8, 121, 5)}" fill="none" stroke="#000" stroke-width="13"/><path d="${inkRing(9, 114.5, 4)}" fill="none" stroke="${P.d1}" stroke-width="2.2" stroke-linejoin="round" stroke-dasharray="14 4 30 3 12 2"/></g>`
const scratches = (P) => `<g stroke="${P.d4}" stroke-linecap="round" fill="none"><path d="M30 40L66 96" stroke-width="3.4"/><path d="M42 32L80 90" stroke-width="2.6"/><path d="M54 26L92 82" stroke-width="2"/><path d="M30 40L66 96" stroke="#000" stroke-width=".8" opacity=".5"/></g>`
const drips = (P) => [[84, 40, 22, 0], [112, 30, 34, 1.4], [196, 36, 18, 2.2], [226, 62, 26, .8]].map(([x, y, h, d]) => `<path d="M${x} ${y}V${y + h}" stroke="${P.d4}" stroke-width="3.2" stroke-linecap="round"/><circle class="hw-dr" style="animation-delay:${-d}s" cx="${x}" cy="${y + h + 3}" r="3" fill="${P.d4}"/>`).join('')
const DUERME = [
  {
    slug: 'borde-de-tinta', name: 'Borde de tinta', rarity: 'raro', price: 1600, coll: 'creepy', min: 56, pad: 14, palettes: CPB,
    back: (S, P) => glow(S, P.d4, 0.18),
    front: (S, P) => inkFrame(P) + scratches(P) + drips(P),
    css: '',
  },
  {
    slug: 'cuchillo-y-luna', name: 'Cuchillo y luna', rarity: 'epico', price: 3000, coll: 'creepy', min: 60, pad: 30, palettes: CPB,
    back: (S, P) => glow(S, P.d4, 0.3) + `<g transform="translate(236 56)"><path d="M0 -26A26 26 0 1 0 22 14A20 20 0 1 1 0 -26Z" fill="${P.d3}" opacity=".9"/></g>`,
    front: (S, P) => {
      const bl = S.lin([[0, '#fff'], [0.55, '#cfd2da'], [1, '#7b7f8c']], 0, 0, 1, 0)
      return inkFrame(P) + scratches(P) +
        `<g transform="translate(232 224) rotate(42)"><g class="hx-kn"><path d="M-9 -58C-9 -64 4 -64 9 -48V16H-9Z" fill="${bl}" stroke="#050505" stroke-width="2"/><path d="M-7 -50V12" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/><rect x="-10" y="16" width="20" height="5" fill="#9a9aa2" stroke="#050505" stroke-width="1.4"/><rect x="-8" y="21" width="16" height="38" rx="4" fill="#15151a" stroke="#fff" stroke-width="1.6"/><circle cy="30" r="2" fill="#fff"/><circle cy="44" r="2" fill="#fff"/><g class="hx-gld"><path d="M0 -20L2 -15L7 -13L2 -11L0 -6L-2 -11L-7 -13L-2 -15Z" fill="#fff"/></g><path d="M-6 -50Q-8 -30 -5 -12" stroke="${P.d4}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/><circle class="hw-dr" cx="-5" cy="-8" r="2.6" fill="${P.d4}"/></g></g>` + drips(P)
    },
    css: '',
  },
]

// Archivo corrupto (ambiente: glitch, duotono rojo)
const CPC = [
  pal('rojo', 'Duotono rojo', '#B8433B', '#080303', '#F4D6D0', '#FFFFFF'),
  pal('cian', 'Señal cian', '#2EC4D6', '#020809', '#CFF8FF', '#FFFFFF'),
  pal('crt', 'Fósforo', '#3DFF7A', '#020A04', '#C8FFD8', '#FFFFFF'),
  pal('violeta', 'Ultravioleta', '#A66CFF', '#07040E', '#E6D4FF', '#FFFFFF'),
]
const slices = (S, P, n, seed) => { const R = rng(seed); let o = '', y = 12; for (let i = 0; i < n; i++) { const h = 14 + R() * 30, id = S.clip(`<rect x="-20" y="${f(y)}" width="330" height="${f(h)}"/>`), d = f((R() < 0.5 ? -1 : 1) * (4 + R() * 10)); o += `<g clip-path="${id}"><g class="hx-sl" style="--d:${d}px;animation-delay:${-(R() * 2.6).toFixed(2)}s;animation-duration:${(2 + R() * 2).toFixed(1)}s"><circle cx="144" cy="144" r="120" fill="none" stroke="#000" stroke-width="11"/><circle cx="144" cy="144" r="120" fill="none" stroke="${i % 3 ? P.d1 : P.d3}" stroke-width="${i % 3 ? 8 : 4}"/><circle cx="144" cy="144" r="113.4" fill="none" stroke="${P.d4}" stroke-width="1.2" opacity=".7"/></g></g>`; y += h } return o }
const pixBlocks = (P, seed, n) => { const R = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const [x, y] = pol(144, 144, 116 + R() * 20, R() * 360), s = 4 + R() * 9 | 0; o += `<rect class="hx-fk" style="animation-delay:${-(R() * 0.9).toFixed(2)}s;animation-duration:${(0.5 + R()).toFixed(2)}s" x="${f(x)}" y="${f(y)}" width="${s}" height="${s}" fill="${R() < 0.5 ? P.d1 : P.d3}"/>` } return o }
const ARCHIVO = [
  {
    slug: 'foto-corrupta', name: 'Foto corrupta', rarity: 'raro', price: 1500, coll: 'creepy', min: 56, pad: 22, palettes: CPC,
    css: '',
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => slices(S, P, 9, 5) + pixBlocks(P, 3, 10) + `<rect x="0" y="0" width="288" height="288" fill="none"/>` + `<g opacity=".18">${Array.from({ length: 36 }, (_, i) => `<rect x="20" y="${i * 8}" width="248" height="1.4" fill="${P.d3}"/>`).join('')}</g>`,
  },
  {
    slug: 'sonrisa-sin-cara', name: 'Sonrisa sin cara', rarity: 'epico', price: 3000, coll: 'creepy', min: 60, pad: 26, palettes: CPC,
    css: '',
    back: (S, P) => glow(S, P.d1, 0.3),
    front: (S, P) => {
      let teeth = '', gum = ''
      const a0 = 14, a1 = 166, n = 15
      for (let i = 0; i < n; i++) { const a = a0 + (i + 0.5) * ((a1 - a0) / n), [x, y] = pol(144, 144, 111, a), h = (i % 2 ? 11 : 16) + (i % 3) * 2; teeth += `<path transform="translate(${f(x)} ${f(y)}) rotate(${a - 90})" d="M-5.6 0L0 ${h}L5.6 0Z" fill="#f4f0ea" stroke="#080303" stroke-width="1.2" stroke-linejoin="round"/><path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})" d="M-5.6 0L0 ${h * 0.9}L5.6 0Z" fill="#f4f0ea" stroke="#080303" stroke-width="1.2" stroke-linejoin="round"/>` }
      gum = `<path d="M${pol(144, 144, 111, a0).map(f).join(' ')}A111 111 0 0 1 ${pol(144, 144, 111, a1).map(f).join(' ')}" fill="none" stroke="#7a0c14" stroke-width="5"/>`
      return slices(S, P, 5, 9) + gum + `<g class="hx-gl">${teeth}</g>` + pixBlocks(P, 8, 8) + `<path d="M${pol(144, 144, 118, 10).map(f).join(' ')}Q${pol(144, 144, 128, 0).map(f).join(' ')} ${pol(144, 144, 124, -8).map(f).join(' ')}M${pol(144, 144, 118, 170).map(f).join(' ')}Q${pol(144, 144, 128, 180).map(f).join(' ')} ${pol(144, 144, 124, 188).map(f).join(' ')}" stroke="${P.d1}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    },
  },
]

// Anillo de ceniza (ambiente: anillo punteado, ceniza cayendo)
const CPD = [
  pal('ceniza', 'Ceniza', '#F2F2F2', '#050505', '#FFFFFF', '#8A8A92'),
  pal('rosa', 'Ceniza rosa', '#F5D0DE', '#08040A', '#FFF0F6', '#C04070'),
  pal('sangre', 'Ceniza roja', '#F0D0D0', '#0A0404', '#FFF0F0', '#B01818'),
  pal('azul', 'Ceniza azul', '#D4E4F8', '#04060A', '#F0F8FF', '#4A74C0'),
]
const ash = (P, n, seed, x0 = 20, x1 = 268) => { const R = rng(seed); let o = ''; for (let i = 0; i < n; i++) o += `<circle class="hx-ash" style="animation-delay:${-(R() * 7).toFixed(1)}s;animation-duration:${(5 + R() * 4).toFixed(1)}s" cx="${f(x0 + R() * (x1 - x0))}" cy="${f(10 + R() * 60)}" r="${f(0.8 + R() * 1.8)}" fill="${R() < 0.4 ? P.d3 : P.d4}"/>`; return o }
const dashRing = (P) => `<circle cx="144" cy="144" r="122" fill="none" stroke="#000" stroke-width="12"/>` + ctr(`<g class="hw-spin" style="animation-duration:90s"><circle r="122" fill="none" stroke="${P.d1}" stroke-width="5.4" stroke-dasharray="11 7.6" stroke-linecap="butt"/></g>`) + ringC(111.8, 1.4, P.d4, 0.6)
const CENIZA = [
  {
    slug: 'anillo-de-ceniza', name: 'Anillo de ceniza', rarity: 'raro', price: 1400, coll: 'creepy', min: 52, pad: 10, palettes: CPD,
    css: '',
    back: (S, P) => glow(S, P.d1, 0.1),
    front: (S, P) => dashRing(P) + ash(P, 12, 4) + `<g fill="${P.d4}" opacity=".5"><circle cx="70" cy="248" r="3"/><circle cx="82" cy="256" r="1.8"/><circle cx="208" cy="250" r="2.4"/></g>`,
  },
  {
    slug: 'lazo-y-ceniza', name: 'Lazo y ceniza', rarity: 'epico', price: 2800, coll: 'creepy', min: 56, pad: 22, palettes: CPD,
    css: '',
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      let lace = ''
      for (let i = 0; i < 12; i++) { const a = 24 + i * 11.6, [x, y] = pol(144, 144, 126, a); lace += `<path transform="translate(${f(x)} ${f(y)}) rotate(${a - 90})" d="M-7 0Q0 13 7 0" fill="${P.d2}" stroke="${P.d1}" stroke-width="1.4"/><circle transform="translate(${f(x)} ${f(y)}) rotate(${a - 90})" cy="9" r="1.4" fill="${P.d1}"/>` }
      const cracks = `<g stroke="${P.d1}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"><path d="M${pol(144, 144, 121, -50).map(f).join(' ')}l-5 10l6 8l-4 9"/><path d="M${pol(144, 144, 121, 30).map(f).join(' ')}l6 7l-5 7"/><path d="M${pol(144, 144, 121, 200).map(f).join(' ')}l-7 5l4 8"/></g>`
      return dashRing(P) + lace + cracks + `<g transform="translate(52 52) rotate(-24)"><g class="hw-fl"><path d="M0 0C-12 -12 -26 -6 -20 6C-14 14 -4 8 0 0C4 8 14 14 20 6C26 -6 12 -12 0 0Z" fill="#0a0a0c" stroke="${P.d1}" stroke-width="1.8" stroke-linejoin="round"/><path d="M-3 4L-12 22L-6 20L-3 26M3 4L12 22L6 20L3 26" fill="#0a0a0c" stroke="${P.d1}" stroke-width="1.4" stroke-linejoin="round"/><circle r="4" fill="${P.d4}" stroke="${P.d1}" stroke-width="1.2"/></g></g>` + ash(P, 14, 6)
    },
  },
]

// ═════════════ VAMPIRO AZUL
const VP = [
  pal('bruma', 'Bruma azul', '#7FD6E6', '#06151C', '#CFF3F8', '#3F7FA6'),
  pal('noche', 'Noche azul', '#6FA0FF', '#060A1E', '#D4E2FF', '#9A7CFF'),
  pal('hielo', 'Hielo', '#B8E8F0', '#06141A', '#F0FCFF', '#4A9AB8'),
  pal('menta', 'Menta', '#6FE0C0', '#04140F', '#D0FFF0', '#2A8A78'),
]
const orbit = (P, rx, ry, tilt, dur, dir = 1, w = 1.2) => `<g transform="rotate(${tilt})"><ellipse rx="${rx}" ry="${ry}" fill="none" stroke="${P.d3}" stroke-opacity=".75" stroke-width="${w}"/></g>`
const hollowStar = (P, x, y, R, rot, dur, cls = '') => `<g transform="translate(${x} ${y})"><g class="hw-spin ${cls}" style="animation-duration:${dur}s;transform-origin:0 0"><path d="${starD(5, R, R * 0.42, rot)}" fill="none" stroke="${P.d3}" stroke-width="${f(Math.max(1.6, R * 0.1))}" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px ${P.d1})"/><path d="${starD(5, R, R * 0.42, rot)}" fill="none" stroke="${P.d1}" stroke-width="${f(Math.max(0.8, R * 0.04))}" stroke-linejoin="round" opacity=".9"/></g></g>`
const fangs = (P, y) => `<g transform="translate(0 ${y})">${[-1, 1].map((m) => `<path transform="translate(${144 + m * 22} 0)" d="M-6 0C-5 8 -2 16 0 24C2 16 5 8 6 0Z" fill="#f4faff" stroke="${P.d2}" stroke-width="1.4"/>`).join('')}</g>`
const locket = (S, P) => `<g class="hw-fl" style="animation-duration:5s">${chainQ(P, [64, 214], [144, 300], [224, 214], 18, 0.9)}<g transform="translate(144 266)"><path d="M0 -14C6 -22 18 -16 14 -4C11 4 4 10 0 16C-4 10 -11 4 -14 -4C-18 -16 -6 -22 0 -14Z" fill="${S.lin([[0, '#fff'], [1, P.d1]], 0, 0, 1, 1)}" stroke="${P.d2}" stroke-width="1.6"/><path d="M0 -6L-3 0L2 3L-2 9" stroke="${P.d2}" stroke-width="1.4" fill="none"/></g></g>`
const VAMPIRO = [
  {
    slug: 'orbitas-y-estrellas', name: 'Órbitas y estrellas', rarity: 'raro', price: 1700, coll: 'vampiro', min: 56, pad: 28, palettes: VP,
    css: SHARED_CSS + X_CSS,
    back: (S, P) => glow(S, P.d1, 0.24) + ctr(`<g class="hw-spin" style="animation-duration:60s">${orbit(P, 132, 40, -20, 0)}${orbit(P, 128, 34, 30, 0, 1, 1)}</g>`),
    front: (S, P) => ringC(113, 2, '#000', 0.5) + ringC(111.6, 1.6, P.d1) + hollowStar(P, 238, 226, 26, -90, 40) + hollowStar(P, 214, 258, 15, -70, 28) + hollowStar(P, 258, 190, 11, -90, 20) + hollowStar(P, 42, 52, 12, -90, 30) + [[30, 120, 2], [250, 120, 2.6], [70, 262, 2], [262, 252, 1.8]].map(([x, y, r], i) => `<circle class="hw-tw" style="animation-delay:${-i * 0.8}s" cx="${x}" cy="${y}" r="${r}" fill="${P.d3}"/>`).join(''),
  },
  {
    slug: 'relicario-y-bruma', name: 'Relicario y bruma', rarity: 'epico', price: 3000, coll: 'vampiro', min: 60, pad: 30, palettes: VP,
    back: (S, P) => glow(S, P.d1, 0.34) + Array.from({ length: 7 }, (_, i) => { const R = rng(i + 3), [x, y] = pol(144, 144, 118, i * 51 + 10); return `<ellipse class="hx-fog" style="animation-delay:${-i * 1.7}s" cx="${f(x)}" cy="${f(y)}" rx="46" ry="14" fill="${S.radB([[0, P.d1, 0.34], [1, P.d1, 0]])}"/>` }).join('') + ctr(`<g class="hw-spin hw-spinr" style="animation-duration:50s">${orbit(P, 134, 38, 24, 0)}</g>`),
    front: (S, P) => ringC(113, 2, '#000', 0.5) + ringC(111.6, 2, P.d1) + ringC(108.6, 1, P.d3, 0.5) + locket(S, P) + hollowStar(P, 244, 60, 20, -90, 36) + hollowStar(P, 40, 70, 12, -90, 26) + `<g class="hw-fl">${fangs(P, 232)}</g>`.replace('translate(0 232)', 'translate(0 232)') + diamond4(250, 120, 5, P.d3, P.d2, 'hw-tw'),
  },
  {
    slug: 'condesa-de-la-bruma', name: 'Condesa de la bruma', rarity: 'legendario', price: 6500, coll: 'vampiro', min: 64, pad: 34, custom: true, palettes: VP,
    back: (S, P) => glow(S, P.d1, 0.4) + `<g transform="translate(232 54)"><circle r="52" fill="${S.radB([[0, P.d1, 0.5], [1, P.d1, 0]])}" class="hw-ey"/><circle r="26" fill="${S.radB([[0, '#fff'], [0.6, P.d3], [1, P.d1]], 0.38, 0.34, 0.78)}"/></g>` + Array.from({ length: 9 }, (_, i) => { const [x, y] = pol(144, 144, 118, i * 40 + 8); return `<ellipse class="hx-fog" style="animation-delay:${-i * 1.3}s" cx="${f(x)}" cy="${f(y)}" rx="48" ry="15" fill="${S.radB([[0, P.d1, 0.4], [1, P.d1, 0]])}"/>` }).join('') + ctr(`<g class="hw-spin" style="animation-duration:46s">${orbit(P, 138, 42, -24, 0)}${orbit(P, 130, 34, 36, 0)}</g><g class="hw-spin hw-spinr" style="animation-duration:70s">${orbit(P, 142, 30, 80, 0, 1, 0.8)}</g>`),
    front: (S, P) => ringC(113, 2, '#000', 0.5) + ringC(111.6, 2.4, P.d1) + ringC(108.4, 1, P.d3, 0.6) + `<g class="hw-spin" style="animation-duration:14s"><g transform="translate(144 144)"><circle r="111.6" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="40 660" stroke-linecap="round" opacity=".85"/></g></g>`.replace('<g class="hw-spin"', '<g class="hw-spin" transform="translate(0 0)"') + locket(S, P) + `<g class="hw-fl">${fangs(P, 234)}</g>` +
      ctr(`<g class="hw-spin" style="animation-duration:30s"><g transform="translate(0 -142) rotate(90)">${bat(P, 0.7, P.d2)}</g></g><g class="hw-spin" style="animation-duration:30s;animation-delay:-15s"><g transform="translate(0 -142) rotate(90)">${bat(P, 0.62, P.d2)}</g></g>`) +
      hollowStar(P, 46, 66, 22, -90, 34) + hollowStar(P, 30, 112, 10, -90, 24) + hollowStar(P, 252, 180, 14, -90, 28) + diamond4(236, 244, 6, P.d3, P.d2, 'hw-tw'),
  },
]
export const HW2 = [...BARROCO, ...BOSQUE, ...DUERME, ...ARCHIVO, ...CENIZA, ...VAMPIRO]
