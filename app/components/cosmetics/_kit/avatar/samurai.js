// @ts-nocheck
// Colección SAMURÁI SOMBRA — estética ukiyo-e / Japón feudal. Originales (sin personajes ni obras ajenas).
import { CX, CY, f, pol, rng, arc, band, smooth, rad } from '../core/util.js'
import { ctr, sparkle, glow, mirror, petalD, leafD, starD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('indigo', 'Índigo y rojo', '#3A59B0', '#0C1433', '#B9C8F0', '#E04A4A'),
  pal('carbon', 'Carbón y oro', '#52525F', '#0E0E12', '#D6D6E0', '#E5B64A'),
  pal('jade', 'Jade', '#2E9C86', '#06251F', '#BDEFE3', '#E8D27A'),
  pal('ciruela', 'Ciruela', '#7A3C9E', '#220A33', '#E3C6F5', '#F0A04B'),
]
const annulus = (r1, r0) => `<path clip-rule="evenodd" d="M${-r1} 0a${r1} ${r1} 0 1 0 ${2 * r1} 0a${r1} ${r1} 0 1 0 ${-2 * r1} 0M${-r0} 0a${r0} ${r0} 0 1 0 ${2 * r0} 0a${r0} ${r0} 0 1 0 ${-2 * r0} 0Z"/>`

export const SAMURAI = [
  // ───────────────────────── Olas seigaiha
  {
    slug: 'olas-seigaiha', name: 'Olas seigaiha', rarity: 'raro', price: 1100, coll: 'samurai', min: 52, palettes: PAL,
    css: `${spin('ss-a', 'ss-o', 120)}.ss-sh{transform-box:view-box;animation:ss-sh 6s ease-in-out infinite}${KF('ss-sh', '0%,100%{opacity:.35}50%{opacity:.9}')}.ss-r1{animation:ss-w 5s ease-in-out infinite alternate}.ss-r2{animation:ss-w 5s ease-in-out infinite alternate-reverse}${KF('ss-w', 'from{transform:translateY(-1.2px)}to{transform:translateY(1.2px)}')}`,
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      const clip = S.clip(annulus(142, 111.5))
      const scale = (s, k) => {
        const cols = [P.mix(P.d1, '#000', 0.3), P.mix(P.d1, P.d3, 0.7), P.d1, P.mix(P.d1, P.d3, 0.7)]
        const st = P.dk(P.d1, 0.5)
        return [s, s * 0.74, s * 0.5, s * 0.26].map((r, i) => `<circle r="${f(r)}" fill="${cols[i]}" stroke="${st}" stroke-opacity=".9" stroke-width="1"/>`).join('')
      }
      const row = (rr, n, off, sz, cls) => {
        let o = ''
        for (let i = 0; i < n; i++) { const a = off + (360 / n) * i; const [x, y] = pol(0, 0, rr, a); o += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a + 90)})">${scale(sz)}</g>` }
        return `<g class="${cls}">${o}</g>`
      }
      const rings = row(133, 28, 0, 12.4, 'ss-r2') + row(124, 28, 6.43, 12.4, 'ss-r1') + row(115.5, 28, 0, 12.4, 'ss-r2')
      const edge = `<circle cx="144" cy="144" r="111.8" fill="none" stroke="${P.d3}" stroke-width="1.4" opacity=".9"/><circle cx="144" cy="144" r="141" fill="none" stroke="${P.d2}" stroke-width="1" opacity=".5"/>`
      const shim = ''
      return ctr(`<g clip-path="${clip}">${rings}${shim}</g>`) + edge + sparkle(40, 40, 3.6, P.d4, 'k-tw')
    },
  },
  // ───────────────────────── Destello de katana
  {
    slug: 'destello-de-katana', name: 'Destello de katana', rarity: 'raro', price: 1200, coll: 'samurai', min: 52, palettes: PAL,
    css: `.sk-g{transform-box:view-box;transform-origin:0 0;animation:sk-s 4s ease-in-out infinite}${KF('sk-s', '0%{transform:rotate(0);opacity:0}8%{opacity:1}62%{transform:rotate(215deg);opacity:1}72%,100%{transform:rotate(215deg);opacity:0}')}`,
    back: (S, P) => glow(S, P.d3, 0.12),
    front: (S, P) => {
      const steel = S.linU([[0, '#ffffff'], [0.45, P.d3], [1, P.mix(P.d3, P.d1, 0.55)]], -120, -120, 120, 120)
      const a0 = 94, a1 = 312
      // hoja: ancho decrece hacia la punta; el filo (lado exterior) más fino
      const blade = `<path d="${band(120, a0, a1, (t) => (t > 0.94 ? 4.6 * (1 - (t - 0.94) / 0.06) : 4.6 - 1.8 * t), 60, 0, 0)}" fill="${steel}" stroke="${P.d2}" stroke-width=".9" stroke-linejoin="round"/>`
      // hamon (línea de temple ondulada)
      const ham = []
      for (let i = 0; i <= 90; i++) { const t = i / 90; ham.push(pol(0, 0, 118.4 + Math.sin(t * 60) * 0.7, a0 + (a1 - a0) * (0.03 + 0.9 * t))) }
      const hamP = `<path d="${smooth(ham)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".9"/>`
      const spine = `<path d="${arc(123.6, a0, a1 - 6, 0, 0)}" fill="none" stroke="${P.d2}" stroke-opacity=".5" stroke-width=".8"/>`
      // empuñadura (tsuka) con envoltura en rombos
      const hA = 60, hB = 90
      let wrap = ''
      for (let i = 0; i < 7; i++) { const a = hA + 1 + i * 4.2; const [x, y] = pol(0, 0, 120, a); wrap += `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})" d="M0 -5L4.4 0L0 5L-4.4 0Z" fill="none" stroke="${P.d4}" stroke-width="1.3"/>` }
      const tsuka = `<path d="${band(120, hA, hB - 2, () => 5, 20, 0, 0)}" fill="${P.d2}" stroke="${P.d4}" stroke-width=".8"/>${wrap}`
      const [tx, ty] = pol(0, 0, 120, 92)
      const tsuba = `<g transform="translate(${f(tx)} ${f(ty)}) rotate(92)"><ellipse rx="3.2" ry="10.4" fill="${S.lin([[0, P.lt(P.d4, 0.5)], [1, P.dk(P.d4, 0.4)]], 0, 0, 1, 1)}" stroke="${P.d2}" stroke-width=".9"/><ellipse rx="1.2" ry="4.6" fill="${P.d2}"/></g>`
      const [kx, ky] = pol(0, 0, 120, 58)
      const kashira = `<circle cx="${f(kx)}" cy="${f(ky)}" r="5.6" fill="${P.d4}" stroke="${P.d2}" stroke-width=".9"/>`
      const gl = `<g class="sk-g"><g transform="translate(0 120)"><path d="M0 -16L2 -2L16 0L2 2L0 16L-2 2L-16 0L-2 -2Z" fill="#fff"/><circle r="9" fill="#fff" opacity=".35"/></g></g>`
      const bits = [[-70, 140, 3], [20, 136, 2.6], [200, 140, 2.2]].map(([a, r, s], i) => { const [x, y] = pol(0, 0, r, a); return sparkle(x, y, s, P.d3, 'k-tw').replace('<path', `<path style="animation-delay:${-i * 1.1}s"`) }).join('')
      return ctr(spine + blade + hamP + tsuka + tsuba + kashira + gl + bits)
    },
  },
  // ───────────────────────── Sol naciente
  {
    slug: 'sol-naciente', name: 'Sol naciente', rarity: 'epico', price: 2000, coll: 'samurai', min: 52, palettes: PAL,
    css: `${spin('sx-a', 'sx-o', 160)}.sx-c1{animation:sx-d 14s ease-in-out infinite alternate}.sx-c2{animation:sx-d 18s ease-in-out infinite alternate-reverse}${KF('sx-d', 'from{transform:translateX(-7px)}to{transform:translateX(7px)}')}${selfc('sx-p')}.sx-p{animation:sx-p 5s ease-in-out infinite}${KF('sx-p', '0%,100%{transform:scale(1)}50%{transform:scale(1.05)}')}`,
    back: (S, P) => {
      const N = 24
      const mask = S.mask(`<circle cx="144" cy="144" r="150" fill="${S.rad([[0.7, '#fff', 0], [0.78, '#fff', 1], [0.95, '#fff', 0.55], [1, '#fff', 0]], 144, 144, 150)}"/>`)
      let rays = ''
      for (let i = 0; i < N; i++) { const a = (360 / N) * i; rays += `<path d="M0 0L${f(pol(0, 0, 200, a - 3.4)[0])} ${f(pol(0, 0, 200, a - 3.4)[1])}L${f(pol(0, 0, 200, a + 3.4)[0])} ${f(pol(0, 0, 200, a + 3.4)[1])}Z" fill="${i % 2 ? P.d1 : P.d4}" opacity="${i % 2 ? 0.55 : 0.85}"/>` }
      return `<g mask="${mask}">` + ctr(`<g class="sx-a">${rays}</g>`) + `</g>` + glow(S, P.d4, 0.2, 0.8, 0.9)
    },
    front: (S, P) => {
      const sun = S.radB([[0, P.lt(P.d4, 0.55)], [0.6, P.d4], [1, P.dk(P.d4, 0.2)]], 0.4, 0.35, 0.75)
      const cloud = (x, y, s, cls, col) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}"><path d="M-40 6C-40 -2 -32 -4 -27 -1C-24 -9 -12 -11 -7 -4C-2 -12 12 -10 14 -1C22 -5 32 -1 31 6C38 6 44 10 40 14L-38 14C-46 12 -46 8 -40 6Z" fill="${col}" stroke="${P.d2}" stroke-opacity=".45" stroke-width="1"/><path d="M-34 8C-20 5 -6 8 8 6M-10 2C-3 0 6 2 12 0" stroke="${P.d2}" stroke-opacity=".35" stroke-width=".9" fill="none" stroke-linecap="round"/></g></g>`
      return `<g class="sx-p"><circle cx="144" cy="22" r="26" fill="${sun}" stroke="${P.d2}" stroke-width="1.4"/></g>` + cloud(204, 50, 1, 'sx-c1', P.d3) + cloud(70, 244, 0.86, 'sx-c2', P.d3) + cloud(236, 232, 0.6, 'sx-c1', P.mix(P.d3, P.d1, 0.25)) + `<circle cx="144" cy="144" r="112.5" fill="none" stroke="${P.d4}" stroke-width="2.4"/><circle cx="144" cy="144" r="115.4" fill="none" stroke="${P.d2}" stroke-width=".8" opacity=".6"/>`
    },
  },
  // ───────────────────────── Sakura negra
  {
    slug: 'sakura-negra', name: 'Sakura negra', rarity: 'epico', price: 2400, coll: 'samurai', min: 52, palettes: PAL,
    css: `.sb-p{animation:sb-f 8s ease-in infinite}${KF('sb-f', '0%{transform:translate(0,0) rotate(0);opacity:0}12%{opacity:1}100%{transform:translate(-26px,80px) rotate(260deg);opacity:0}')}.sb-s{transform-box:fill-box;transform-origin:20% 100%;animation:sb-s 7s ease-in-out infinite alternate}${KF('sb-s', 'from{transform:rotate(-1.2deg)}to{transform:rotate(1.4deg)}')}`,
    back: (S, P) => glow(S, P.d1, 0.16),
    front: (S, P) => {
      const dark = P.mix(P.d2, P.d1, 0.28)
      const bl = (x, y, s, rot, open = 1) => {
        const gr = S.radB([[0, P.mix(P.d2, P.d1, 0.5)], [0.7, dark], [1, P.dk(P.d2, 0.1)]], 0.5, 0.4, 0.8)
        let pet = ''
        for (let i = 0; i < 5; i++) pet += `<path transform="rotate(${i * 72})" d="M0 0C-6 -3 -8 -10 -4.4 -14L0 -11.6L4.4 -14C8 -10 6 -3 0 0Z" fill="${gr}" stroke="${P.d3}" stroke-opacity=".6" stroke-width=".7"/>`
        let st = ''
        for (let i = 0; i < 6; i++) { const a = i * 60 + 12; const [px, py] = pol(0, 0, 6.2, a); st += `<path d="M0 0L${f(px)} ${f(py)}" stroke="${P.d4}" stroke-width=".8"/><circle cx="${f(px)}" cy="${f(py)}" r="1" fill="${P.d4}"/>` }
        return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">${pet}<circle r="2.4" fill="${P.d4}"/>${st}</g>`
      }
      // rama
      const br = []
      for (let i = 0; i <= 22; i++) { const a = 168 + (i / 22) * 160; br.push(pol(144, 144, 121 + Math.sin(i * 0.7) * 3, a)) }
      const branch = `<path d="${smooth(br)}" fill="none" stroke="${P.d2}" stroke-width="8" stroke-linecap="round"/><path d="${smooth(br)}" fill="none" stroke="${P.mix(P.d2, P.d3, 0.35)}" stroke-width="3.4" stroke-linecap="round"/><path d="${smooth(br)}" fill="none" stroke="${P.d3}" stroke-opacity=".4" stroke-width=".8" transform="translate(-1 -1)"/>`
      const twig = (a, L, side) => { const [x, y] = pol(144, 144, 122, a); const [x2, y2] = pol(144, 144, 122 + side * L, a + side * 8); return `<path d="M${f(x)} ${f(y)}Q${f((x + x2) / 2 + 4)} ${f((y + y2) / 2 - 4)} ${f(x2)} ${f(y2)}" fill="none" stroke="${P.d2}" stroke-width="2.6" stroke-linecap="round"/>` }
      const blos = [[190, 1.15, 0], [214, 1.0, 14], [238, 1.3, -10], [262, 1.1, 30], [288, 1.25, 8], [312, 0.9, -20]]
      let bo = ''
      for (const [a, s, r] of blos) { const [x, y] = pol(144, 144, 121, a); bo += bl(x, y, s * 1.75, r + a) }
      const buds = [[176, 134], [250, 134], [300, 135]].map(([a, r]) => { const [x, y] = pol(144, 144, r, a); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3" ry="4.4" fill="${dark}" stroke="${P.d3}" stroke-opacity=".5" stroke-width=".6" transform="rotate(${a} ${f(x)} ${f(y)})"/>` }).join('')
      let fall = ''
      for (let i = 0; i < 5; i++) { const [x, y] = pol(144, 144, 126, 200 + i * 24); fall += `<g transform="translate(${f(x)} ${f(y)})"><path class="sb-p" style="animation-delay:${-i * 1.6}s" d="${petalD(11, 5.2)}" fill="${i % 2 ? P.d3 : P.d4}"/></g>` }
      return `<g class="sb-s">${branch}${twig(205, 12, 1)}${twig(250, 14, 1)}${twig(300, 12, 1)}${buds}${bo}</g>` + fall
    },
  },
  // ───────────────────────── Máscara de zorro
  {
    slug: 'mascara-de-zorro', name: 'Máscara de zorro', rarity: 'legendario', price: 5000, coll: 'samurai', min: 64, pad: 30, custom: true, palettes: PAL,
    css: `.sz-f{transform-box:fill-box;transform-origin:50% 100%;animation:sz-f 1.8s ease-in-out infinite alternate}${KF('sz-f', 'from{transform:scale(.88,1.08) skewX(-6deg)}to{transform:scale(1.08,.9) skewX(6deg)}')}${spin('sz-o', 'sz-r', 34)}.sz-t{transform-box:fill-box;transform-origin:50% 0;animation:sz-t 5s ease-in-out infinite alternate}${KF('sz-t', 'from{transform:rotate(-4deg)}to{transform:rotate(5deg)}')}`,
    back: (S, P) => glow(S, P.d4, 0.2),
    front: (S, P) => {
      const face = S.lin([[0, '#ffffff'], [0.6, P.mix('#f6efe6', P.d3, 0.18)], [1, P.mix('#e3d7c8', P.d1, 0.3)]], 0, 0, 1, 1)
      const red = P.d4
      const flame = (x, y, s, d) => {
        const gr = S.lin([[0, P.lt(P.d4, 0.7), 0.95], [0.5, P.d4, 0.9], [1, P.d1, 0.1]], 0, 0, 0, 1)
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><g class="sz-f" style="animation-delay:${-d}s"><path d="M0 -17C6 -8 9 -3 8 4C7 10 3 13 0 13C-4 13 -8 10 -8 4C-8 -2 -3 -7 0 -17Z" fill="${S.lin([[0, P.lt(P.d3, 0.3)], [0.55, P.lt(P.d4, 0.2)], [1, P.d1]], 0, 0, 0, 1)}" opacity=".95"/><path d="M0 -6C3 -2 4.4 1 4 5C3.6 8 1.6 9.6 0 9.6C-2 9.6 -4 8 -4 5C-4 2 -1.6 -1 0 -6Z" fill="#fff" opacity=".85"/></g></g>`
      }
      const mask = `<g transform="translate(218 62) rotate(20) scale(1.6)">` +
        `<g class="sz-t"><path d="M-6 26C-10 32 -14 36 -17 42M4 28C6 34 9 38 13 43" stroke="${P.d1}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="-17" cy="44" r="3" fill="${P.d4}"/><circle cx="13" cy="45" r="3" fill="${P.d4}"/></g>` +
        `<path d="M0 34C-12 34 -26 22 -31 6C-35 -6 -32 -22 -26 -38L-12 -22C-6 -25 6 -25 12 -22L26 -38C32 -22 35 -6 31 6C26 22 12 34 0 34Z" fill="#000" opacity=".3" transform="translate(2 3)"/>` +
        `<path d="M0 34C-12 34 -26 22 -31 6C-35 -6 -32 -22 -26 -38L-12 -22C-6 -25 6 -25 12 -22L26 -38C32 -22 35 -6 31 6C26 22 12 34 0 34Z" fill="${face}" stroke="${P.d2}" stroke-width="1.5" stroke-linejoin="round"/>` +
        `<path d="M-25 -30L-14 -20L-23 -12Z M25 -30L14 -20L23 -12Z" fill="${red}"/>` +
        `<path d="M-30 4C-24 14 -17 13 -12 9C-17 19 -22 22 -27 21M30 4C24 14 17 13 12 9C17 19 22 22 27 21" fill="${red}" stroke="${P.d2}" stroke-width=".6"/>` +
        `<path d="M0 -20C4 -14 4 -8 0 -4C-4 -8 -4 -14 0 -20Z" fill="${red}"/>` +
        `<path d="M-22 -3Q-14 -11 -4 -1Q-12 -3 -22 -3ZM22 -3Q14 -11 4 -1Q12 -3 22 -3Z" fill="${P.d2}"/>` +
        `<path d="M-6 14C-3 20 3 20 6 14L0 25Z" fill="${P.d2}"/><circle cy="14" r="2.2" fill="${P.d2}"/>` +
        `<path d="M-14 6L-23 4M-14 10L-24 12M14 6L23 4M14 10L24 12" stroke="${red}" stroke-width="1.2" stroke-linecap="round"/>` +
        `<path d="M-24 -26L-20 -20" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/></g>`
      const orbit = `<g class="sz-o">${[0, 120, 240].map((a, i) => { const [x, y] = pol(0, 0, 130, a + 30); return flame(x, y, 1.0 - i * 0.06, i * 0.5) }).join('')}</g>`
      return ctr(orbit) + mask + sparkle(34, 230, 4, P.d4, 'k-tw') + sparkle(250, 232, 3, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1.5s"')
    },
  },
]
