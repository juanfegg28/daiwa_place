// @ts-nocheck
// Colección SANGRE NOIR — dark rojizo: luna de sangre, niebla carmesí, colmillos, rosas negras, murciélagos. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth, sector } from '../core/util.js'
import { ctr, sparkle, glow, mirror, rose, leafD, heartD, featherD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('sangre', 'Sangre', '#D6102F', '#2B0008', '#FF9AAA', '#FFB07A'),
  pal('vino', 'Vino tinto', '#8C1034', '#1F0410', '#E8A0B4', '#D9B25A'),
  pal('rubi', 'Rubí', '#F0204A', '#0A0508', '#FFC2CC', '#9A9AA8'),
  pal('oxido', 'Óxido', '#E0481C', '#2A0803', '#FFD2A8', '#FFD25A'),
]

export const CRIMSON = [
  // ───────────────────────── Niebla carmesí
  {
    slug: 'niebla-carmesi', name: 'Niebla carmesí', rarity: 'comun', price: 500, coll: 'crimson', min: 40, palettes: PAL,
    css: `.cr-a{animation:cr-a 9s ease-in-out infinite alternate}${KF('cr-a', 'from{transform:translateX(-12px)}to{transform:translateX(12px)}')}.cr-b{animation:cr-a 12s ease-in-out infinite alternate-reverse}.cr-p{animation:cr-p 5s ease-in-out infinite}${KF('cr-p', '0%,100%{opacity:.55}50%{opacity:1}')}.cr-m{animation:cr-m 7s ease-out infinite}${KF('cr-m', '0%{transform:translateY(6px);opacity:0}20%{opacity:.8}100%{transform:translateY(-40px);opacity:0}')}`,
    back: (S, P) => {
      const R = rng(4)
      let fog = ''
      for (let i = 0; i < 9; i++) { const a = (360 / 9) * i + R() * 20; const [x, y] = pol(144, 144, 118 + R() * 10, a); fog += `<ellipse class="${i % 2 ? 'cr-a' : 'cr-b'}" cx="${f(x)}" cy="${f(y)}" rx="${f(40 + R() * 22)}" ry="${f(15 + R() * 10)}" fill="${S.radB([[0, P.d1, 0.7], [0.6, P.d1, 0.3], [1, P.d1, 0]])}"/>` }
      return glow(S, P.d1, 0.3, 0.72, 0.84) + fog
    },
    front: (S, P) => {
      const R = rng(22)
      let wisp = ''
      for (let i = 0; i < 5; i++) { const x = 40 + R() * 208; wisp += `<ellipse class="${i % 2 ? 'cr-a' : 'cr-b'}" cx="${f(x)}" cy="${f(250 + R() * 24)}" rx="${f(44 + R() * 22)}" ry="${f(10 + R() * 6)}" fill="${S.radB([[0, P.d1, 0.55], [1, P.d1, 0]])}"/>` }
      let em = ''
      for (let i = 0; i < 10; i++) { const [x, y] = pol(144, 144, 118 + R() * 22, R() * 360); em += `<g transform="translate(${f(x)} ${f(y)})"><circle class="cr-m" style="animation-delay:${-(R() * 7).toFixed(1)}s" r="${f(0.9 + R() * 1.3)}" fill="${P.d3}"/></g>` }
      return wisp + `<circle class="cr-p" cx="144" cy="144" r="112.6" fill="none" stroke="${P.d1}" stroke-width="2.4"/><circle cx="144" cy="144" r="110" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="2.4"/>` + em
    },
  },
  // ───────────────────────── Colmillos
  {
    slug: 'colmillos', name: 'Colmillos', rarity: 'raro', price: 900, coll: 'crimson', min: 52, palettes: PAL,
    css: `.cc-d{animation:cc-d 3.4s ease-in infinite}${KF('cc-d', '0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(2px) scale(1)}100%{transform:translateY(46px) scale(1);opacity:0}')}.cc-g{transform-box:fill-box;transform-origin:50% 0;animation:cc-g 3.4s ease-in infinite}${KF('cc-g', '0%{transform:scaleY(.7)}60%{transform:scaleY(1.15)}100%{transform:scaleY(.7)}')}`,
    back: (S, P) => glow(S, P.d1, 0.22),
    front: (S, P) => {
      const lip = S.lin([[0, P.lt(P.d1, 0.1)], [1, P.dk(P.d1, 0.45)]], 0, 0, 0, 1)
      const tooth = S.lin([[0, '#fffaf0'], [1, '#e6d9c6']], 0, 0, 0, 1)
      const a0 = 222, a1 = 318
      let teeth = ''
      for (let i = 0; i < 15; i++) { const a = a0 + 4 + (i * (a1 - a0 - 8)) / 14; if (Math.abs(a - 252) < 3 || Math.abs(a - 288) < 3) continue; const [x, y] = pol(0, 0, 113, a); teeth += `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})" d="M-3.4 0L0 6.4L3.4 0Z" fill="${tooth}" stroke="${P.d2}" stroke-opacity=".6" stroke-width=".6"/>` }
      const fang = (a) => { const [x, y] = pol(0, 0, 113, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M-6.4 -1C-6 8 -3 16 0 24C3 16 6 8 6.4 -1Z" fill="${tooth}" stroke="${P.d2}" stroke-opacity=".7" stroke-width=".9"/><path d="M-3.4 2C-3 8 -1.6 13 0 18" stroke="#fff" stroke-opacity=".8" stroke-width="1.2" fill="none" stroke-linecap="round"/><g class="cc-g"><path d="M0 22C-1.8 26 -1.6 29 0 31C1.6 29 1.8 26 0 22Z" fill="${P.d1}"/></g></g>` }
      const drop = (a, d) => { const [x, y] = pol(0, 0, 113, a); return `<g transform="translate(${f(x)} ${f(y + 30)})"><path class="cc-d" style="animation-delay:${-d}s" d="M0 -4C3.2 0 3.4 3.4 0 4.8C-3.4 3.4 -3.2 0 0 -4Z" fill="${P.d1}"/></g>` }
      const bite = `<path d="${band(116, a0, a1, (t) => 5.4 + 1.6 * Math.sin(t * 24), 60, 0, 0)}" fill="${lip}" stroke="${P.d2}" stroke-width="1"/><path d="${arc(114.4, a0 + 2, a1 - 2, 0, 0)}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.2"/>`
      return `<circle cx="144" cy="144" r="112" fill="none" stroke="${P.d1}" stroke-width="1.6" opacity=".7"/>` + ctr(bite + teeth + fang(252) + fang(288) + drop(252, 0) + drop(288, 1.7)) + sparkle(36, 230, 3, P.d3, 'k-tw') + sparkle(254, 232, 2.6, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1s"')
    },
  },
  // ───────────────────────── Luna de sangre
  {
    slug: 'luna-de-sangre', name: 'Luna de sangre', rarity: 'raro', price: 1200, coll: 'crimson', min: 52, pad: 20, palettes: PAL,
    css: `.lm-w{animation:lm-w 12s linear infinite}${KF('lm-w', '0%{transform:translateX(-90px) translateY(10px)}100%{transform:translateX(120px) translateY(-8px)}')}.lm-f{transform-box:fill-box;transform-origin:50% 50%;animation:lm-f .5s ease-in-out infinite alternate}${KF('lm-f', 'from{transform:scaleY(1)}to{transform:scaleY(.55)}')}.lm-g{animation:lm-p 5s ease-in-out infinite}${KF('lm-p', '0%,100%{opacity:.7}50%{opacity:1}')}`,
    back: (S, P) => {
      const moon = S.radB([[0, P.lt(P.d1, 0.2)], [0.6, P.d1], [1, P.dk(P.d1, 0.55)]], 0.38, 0.34, 0.78)
      return glow(S, P.d1, 0.2) + `<g transform="translate(208 62) scale(1.45)"><circle r="56" fill="${S.radB([[0, P.d1, 0.55], [1, P.d1, 0]])}" class="lm-g"/><circle r="31" fill="${moon}"/><circle cx="-9" cy="-8" r="7" fill="${P.dk(P.d1, 0.5)}" opacity=".5"/><circle cx="10" cy="6" r="9" fill="${P.dk(P.d1, 0.5)}" opacity=".4"/><circle cx="-4" cy="14" r="4.4" fill="${P.dk(P.d1, 0.5)}" opacity=".45"/><circle cx="13" cy="-14" r="3.4" fill="${P.dk(P.d1, 0.5)}" opacity=".4"/><path d="M-26 -12C-12 -20 6 -22 22 -14" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none" stroke-linecap="round"/></g>`
    },
    front: (S, P) => {
      const crow = (x, y, s, d) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><g class="lm-w" style="animation-delay:${-d}s;animation-duration:${12 + d}s"><g class="lm-f" style="animation-delay:${-d * 0.2}s"><path d="M0 0C-4 -6 -12 -9 -20 -6C-14 -5 -10 -2 -8 3C-4 0 -2 0 0 1C2 0 4 0 8 3C10 -2 14 -5 20 -6C12 -9 4 -6 0 0Z" fill="#0b0407"/><circle cx="0" cy="1" r="2.4" fill="#0b0407"/><path d="M0 0L5 1.6L0 2.4Z" fill="#0b0407"/></g></g></g>`
      const mist = `<ellipse cx="150" cy="268" rx="120" ry="14" fill="${S.radB([[0, P.d1, 0.4], [1, P.d1, 0]])}"/>`
      return `<circle cx="144" cy="144" r="112.5" fill="none" stroke="${P.d1}" stroke-width="2.4"/><circle cx="144" cy="144" r="110" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="2.2"/>` + crow(110, 40, 1.2, 0) + crow(150, 24, 0.9, 4) + crow(60, 58, 0.8, 8) + mist + sparkle(40, 110, 2.6, P.d3, 'k-tw')
    },
  },
  // ───────────────────────── Corazón de espinas
  {
    slug: 'corazon-de-espinas', name: 'Corazón de espinas', rarity: 'raro', price: 1100, coll: 'crimson', min: 52, palettes: PAL,
    css: `.ep-h{transform-box:fill-box;transform-origin:50% 55%;animation:ep-h 1.6s ease-in-out infinite}${KF('ep-h', '0%,40%,100%{transform:scale(1)}12%{transform:scale(1.14)}24%{transform:scale(1.03)}32%{transform:scale(1.1)}')}.ep-d{animation:ep-d 4s ease-in infinite}${KF('ep-d', '0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(24px);opacity:0}')}`,
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      const vine = []
      for (let i = 0; i <= 30; i++) vine.push(pol(0, 0, 116 + Math.sin(i * 1.1) * 2.4, 20 + (i / 30) * 140))
      const stem = `<path d="${smooth(vine)}" fill="none" stroke="#14060a" stroke-width="5.4" stroke-linecap="round"/><path d="${smooth(vine)}" fill="none" stroke="${P.mix('#2a0d14', P.d1, 0.25)}" stroke-width="2.6" stroke-linecap="round"/>`
      let th = ''
      for (let i = 1; i < 14; i++) { const a = 20 + (i / 14) * 140; const [x, y] = pol(0, 0, 118, a); th += `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90 + (i % 2 ? 180 : 0) + 12})" d="M-2 0L0 -7L2 0Z" fill="${P.d1}"/>` }
      const heart = S.radB([[0, P.lt(P.d1, 0.35)], [0.55, P.d1], [1, P.dk(P.d1, 0.55)]], 0.38, 0.3, 0.85)
      const H = `<g transform="translate(144 258) scale(1.5)"><g class="ep-h"><path d="${heartD(23)}" fill="#000" opacity=".35" transform="translate(1.5 3)"/><path d="${heartD(23)}" fill="${heart}" stroke="${P.d2}" stroke-width="1.4"/><ellipse cx="-10" cy="-12" rx="6" ry="3.2" fill="#fff" opacity=".6" transform="rotate(-30 -10 -12)"/><path d="M-26 -2C-14 -10 -4 4 8 -4C16 -9 24 -2 28 4" stroke="#14060a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-22 12C-10 6 0 16 12 10" stroke="#14060a" stroke-width="2.2" fill="none" stroke-linecap="round"/>${[[-18, -5], [-6, -2], [6, -3], [20, 0], [-14, 11], [2, 12]].map(([x, y]) => `<path d="M${x - 2} ${y}L${x} ${y - 6}L${x + 2} ${y}Z" fill="${P.d3}" transform="rotate(${x * 2} ${x} ${y})"/>`).join('')}</g><path class="ep-d" d="M2 20C4 24 4 27 2 29C0 27 0 24 2 20Z" fill="${P.d1}"/></g>`
      return ctr(stem + th) + H + sparkle(40, 60, 3.2, P.d3, 'k-tw') + sparkle(252, 70, 2.6, P.d1, 'k-tw').replace('<path', '<path style="animation-delay:-1s"') + `<circle cx="144" cy="144" r="112" fill="none" stroke="${P.d1}" stroke-width="1.4" opacity=".7"/>`
    },
  },
  // ───────────────────────── Rosas de sangre
  {
    slug: 'rosas-de-sangre', name: 'Rosas de sangre', rarity: 'epico', price: 2300, coll: 'crimson', min: 56, palettes: PAL,
    css: `.cb-d{animation:cb-d 5s ease-in infinite}${KF('cb-d', '0%{transform:translateY(0) scaleY(.5);opacity:0}15%{opacity:1;transform:translateY(2px) scaleY(1)}100%{transform:translateY(34px);opacity:0}')}.cb-s{transform-box:view-box;transform-origin:0 0;animation:cb-s 7s ease-in-out infinite alternate}${KF('cb-s', 'from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}')}`,
    back: (S, P) => glow(S, P.d1, 0.2),
    front: (S, P) => {
      const stem = (a0, a1, rr) => { const pts = []; for (let i = 0; i <= 18; i++) pts.push(pol(0, 0, rr + Math.sin(i * 0.9) * 3, a0 + ((a1 - a0) * i) / 18)); return `<path d="${smooth(pts)}" fill="none" stroke="#0b0306" stroke-width="5" stroke-linecap="round"/><path d="${smooth(pts)}" fill="none" stroke="${P.mix('#1d0910', P.d1, 0.22)}" stroke-width="2.4" stroke-linecap="round"/>` }
      const th = (a0, a1, rr) => { let o = ''; for (let i = 1; i < 11; i++) { const a = a0 + ((a1 - a0) * i) / 11; const [x, y] = pol(0, 0, rr, a); o += `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90 + (i % 2 ? 180 : 0) + 14})" d="M-2.2 0L0 -8L2.2 0Z" fill="${P.d1}" stroke="#0b0306" stroke-width=".5"/>` } return o }
      const lf = (a, rr, side) => { const [x, y] = pol(0, 0, rr, a); return `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90 + side * 56})" d="${leafD(20, 6.4)}" fill="${S.lin([[0, '#14060a'], [1, P.mix('#2a0d14', P.d1, 0.35)]], 0, 1, 0, 0)}" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".6"/>` }
      let leaves = ''
      for (const a of [160, 178, 196, 214, 232, 250, 268, 286, 304, 322]) leaves += lf(a, 119, a % 2 ? 1 : -1)
      const R = [[-148, 123, 30], [-110, 119, 22], [-76, 122, 26], [-34, 119, 18], [160, 122, 16]]
      let roses = ''
      for (const [a, r, s] of R) { const [x, y] = pol(0, 0, r, a); roses += rose(S, CX + x, CY + y, s, '#240a12', '#000000', P.d1, { rot: a }).replace('<g transform="translate', '<g transform="translate') }
      let drops = ''
      for (const [a, r, d] of [[-148, 128, 0], [-76, 128, 1.9], [-110, 124, 3.4]]) { const [x, y] = pol(0, 0, r, a); drops += `<g transform="translate(${f(x)} ${f(y + 8)})"><path class="cb-d" style="animation-delay:${-d}s" d="M0 -5C4 0 4 4 0 6C-4 4 -4 0 0 -5Z" fill="${P.d1}"/></g>` }
      return ctr(`<g class="cb-s">${stem(130, 340, 119)}${th(130, 340, 120)}${leaves}</g>`) + roses.replace(/translate\(([\d.]+) ([\d.]+)\)/g, (m, x, y) => `translate(${x} ${y})`) + `<g transform="translate(144 144)">${drops}</g>`
    },
  },
  // ───────────────────────── Alas de murciélago
  {
    slug: 'alas-de-murcielago', name: 'Alas de murciélago', rarity: 'legendario', price: 5600, coll: 'crimson', min: 80, pad: 80, custom: true, palettes: PAL,
    css: `.zw-f{transform-box:view-box;transform-origin:0 0;animation:cbw-f 3.6s ease-in-out infinite alternate}${KF('cbw-f', 'from{transform:rotate(5deg)}to{transform:rotate(-7deg)}')}.zw-g{animation:cr-p2 4s ease-in-out infinite}${KF('cr-p2', '0%,100%{opacity:.6}50%{opacity:1}')}`,
    back: (S, P) => {
      const W = [30, 74]                      // muñeca
      const T = [[-48, 22], [-62, 74], [-48, 124], [-4, 160], [58, 176]] // puntas de los dedos (la última baja hasta el cuerpo)
      const S0 = [100, 150]                    // hombro
      const sc = (a, b, k) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; return `Q${f(mx + (W[0] - mx) * k)} ${f(my + (W[1] - my) * k)} ${f(b[0])} ${f(b[1])}` }
      const memb = `M${S0[0]} ${S0[1]}Q60 100 ${W[0]} ${W[1]}L${T[0][0]} ${T[0][1]}${sc(T[0], T[1], 0.34)}${sc(T[1], T[2], 0.34)}${sc(T[2], T[3], 0.34)}${sc(T[3], T[4], 0.3)}Q84 184 ${S0[0]} 178Z`
      const grad = S.linU([[0, P.d1, 0.92], [0.55, P.mix(P.d1, P.d2, 0.55), 0.94], [1, P.d2, 0.96]], 100, 100, -60, 100)
      const bone = P.mix('#1a0a10', P.d1, 0.35)
      const fingers = T.map(([x, y]) => `<path d="M${W[0]} ${W[1]}L${x} ${y}" stroke="#0b0306" stroke-width="4.4" stroke-linecap="round"/><path d="M${W[0]} ${W[1]}L${x} ${y}" stroke="${bone}" stroke-width="2.4" stroke-linecap="round"/><path d="M${W[0]} ${W[1]}L${x} ${y}" stroke="${P.d3}" stroke-opacity=".35" stroke-width=".7" stroke-linecap="round" transform="translate(-.8 -.8)"/>`).join('')
      const arm = `<path d="M${S0[0]} ${S0[1]}Q60 100 ${W[0]} ${W[1]}" fill="none" stroke="#0b0306" stroke-width="6.6" stroke-linecap="round"/><path d="M${S0[0]} ${S0[1]}Q60 100 ${W[0]} ${W[1]}" fill="none" stroke="${bone}" stroke-width="3.8" stroke-linecap="round"/>`
      const claw = `<path d="M${W[0] + 2} ${W[1] - 2}C${W[0] + 4} ${W[1] - 14} ${W[0] + 10} ${W[1] - 18} ${W[0] + 18} ${W[1] - 18}C${W[0] + 12} ${W[1] - 14} ${W[0] + 10} ${W[1] - 8} ${W[0] + 8} ${W[1]}Z" fill="${P.d3}" stroke="#0b0306" stroke-width="1"/>`
      const veins = [0.45, 0.72].map((k) => T.map(([x, y]) => `<path d="M${f(W[0] + (x - W[0]) * k)} ${f(W[1] + (y - W[1]) * k)}Q${f(W[0] + (x - W[0]) * k + 6)} ${f(W[1] + (y - W[1]) * k + 10)} ${f(W[0] + (x - W[0]) * k + 12)} ${f(W[1] + (y - W[1]) * k + 26)}" stroke="${P.d3}" stroke-opacity=".18" stroke-width=".8" fill="none"/>`).join('')).join('')
      const wing = () => `<g transform="translate(100 150)"><g class="zw-f"><g transform="translate(-100 -150)"><path d="${memb}" fill="${grad}" stroke="#0b0306" stroke-width="2" stroke-linejoin="round"/><path d="${memb}" fill="none" stroke="${P.d1}" stroke-opacity=".55" stroke-width="1" transform="translate(0 -.8)"/>${veins}${fingers}${arm}${claw}</g></g></g>`
      return glow(S, P.d1, 0.3, 0.68, 0.84) + wing() + mirror(wing())
    },
    front: (S, P) => `<circle cx="144" cy="144" r="112.4" fill="none" stroke="${P.d1}" stroke-width="2.2" opacity=".9"/>` + sparkle(30, 40, 3.4, P.d3, 'k-tw') + sparkle(258, 40, 3.4, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1.2s"'),
  },
]
