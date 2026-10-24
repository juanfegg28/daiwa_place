// @ts-nocheck
// Tarjetas: MÁGICA · CYBER · PIXEL · SAMURÁI
import { f, pol, rng } from '../core/util.js'
import { pal, KF } from '../core/kit.js'
import { sparkle, petalD, starD } from '../core/svg.js'
import { CW, CH, rect, full, vgrad, vig, bloom, stars, frame, cornerOrn } from './lib.js'

// ═════════════════════════════ MÁGICA
const MP = [
  pal('lunar', 'Lunar', '#9D8CFF', '#0A0A24', '#E2DCFF', '#FFD98A'),
  pal('aurora', 'Aurora', '#4FE0CC', '#041A22', '#C8FFF4', '#FF9ADC'),
  pal('rosa', 'Rosa astral', '#FF8AD0', '#1A0720', '#FFD6F0', '#8CD8FF'),
  pal('ambar', 'Ámbar', '#FFB84D', '#1C0E06', '#FFE6B8', '#B49CFF'),
]
const cielo = {
  slug: 'cielo-estelar', name: 'Cielo estelar', rarity: 'raro', price: 1500, coll: 'magica', tone: 'dark', palettes: MP,
  css: `.ke-s{animation:ke-s 6s ease-in infinite}${KF('ke-s', '0%{transform:translate(0,0);opacity:0}6%{opacity:1}22%{transform:translate(-190px,120px);opacity:0}100%{transform:translate(-190px,120px);opacity:0}')}.ke-d{stroke-dasharray:6 5;animation:ke-d 3s linear infinite}${KF('ke-d', 'to{stroke-dashoffset:-22}')}`,
  art: (S, P) => {
    let o = vgrad(S, [[0, P.dk(P.d2, 0.3)], [0.5, P.d2], [1, P.mix(P.d2, P.d1, 0.25)]])
    // vía láctea
    o += `<g transform="rotate(-28 170 150)"><ellipse cx="170" cy="150" rx="260" ry="44" fill="${S.radB([[0, P.d1, 0.45], [0.6, P.d1, 0.14], [1, P.d1, 0]])}"/><ellipse cx="170" cy="150" rx="180" ry="18" fill="${S.radB([[0, P.d3, 0.35], [1, P.d3, 0]])}"/></g>`
    o += stars(S, P, { n: 90, seed: 5, y1: 340, big: 0.18 })
    // luna creciente
    const mk = S.mask(`<rect x="-100" y="-100" width="500" height="500" fill="#fff"/><circle cx="68" cy="48" r="30" fill="#000"/>`)
    o += bloom(S, 56, 56, 60, P.d4, 0.35) + `<circle cx="56" cy="58" r="30" fill="${P.d4}" mask="${mk}"/>`
    // constelación
    const C = [[210, 40], [250, 66], [280, 52], [268, 104], [232, 120], [210, 40]]
    o += `<path d="M${C.map((p) => p.join(' ')).join('L')}" fill="none" stroke="${P.d3}" stroke-opacity=".5" stroke-width="1" class="ke-d"/>` + C.slice(0, 5).map(([x, y]) => sparkle(x, y, 5, P.d3, 'k-tw')).join('')
    // estrellas fugaces
    for (const [x, y, d] of [[320, 20, 0], [300, 160, 3]]) o += `<g transform="translate(${x} ${y})"><g class="ke-s" style="animation-delay:${-d}s"><path d="M0 0L46 -29" stroke="${S.lin([[0, '#fff', 0], [1, '#fff', 1]], 0, 0, 1, 0)}" stroke-width="2" stroke-linecap="round"/><circle r="2.4" fill="#fff"/></g></g>`
    return o + vig(S, '#000', 0.4)
  },
  frame: (S, P) => frame(6, P.d3, 1, 20, 0.6) + cornerOrn(P.d4, 14, 18, 1.4) + [[24, 24], [316, 24], [24, 396], [316, 396]].map(([x, y]) => sparkle(x, y, 5, P.d4, 'k-tw')).join(''),
}

const grimorio = {
  dy: -22, slug: 'grimorio', name: 'Grimorio', rarity: 'epico', price: 3000, coll: 'magica', tone: 'dark', palettes: MP,
  css: `.gr-o{transform-box:view-box;transform-origin:170px 104px;animation:gr-o 40s linear infinite}${KF('gr-o', 'to{transform:rotate(360deg)}')}.gr-i{transform-box:view-box;transform-origin:170px 104px;animation:gr-o 24s linear infinite reverse}.gr-p{animation:gr-p 3.6s ease-in-out infinite alternate}${KF('gr-p', 'from{opacity:.45}to{opacity:1}')}`,
  art: (S, P) => {
    const leather = P.mix(P.d2, P.d1, 0.22)
    let o = vgrad(S, [[0, P.lt(leather, 0.06)], [1, P.dk(leather, 0.45)]])
    const R = rng(7)
    for (let i = 0; i < 160; i++) o += `<circle cx="${f(R() * CW)}" cy="${f(R() * CH)}" r="${f(0.5 + R() * 1.1)}" fill="#000" opacity="${f(0.1 + R() * 0.2)}"/>`
    o += frame(16, P.d4, 2.4, 10, 0.95) + frame(23, P.d4, 1, 6, 0.6)
    // esquinas de latón
    const br = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M0 0H40V8H8V40H0Z" fill="${P.d4}"/><path d="M12 12H34Q20 14 12 34Z" fill="${P.lt(P.d4, 0.25)}"/><circle cx="12" cy="12" r="3.4" fill="${P.dk(P.d4, 0.4)}"/></g>`
    o += br(10, 10, 1, 1) + br(330, 10, -1, 1) + br(10, 410, 1, -1) + br(330, 410, -1, -1)
    // sello mágico
    o += bloom(S, 170, 104, 120, P.d1, 0.55)
    let ring = ''
    for (let i = 0; i < 36; i++) { const [a, b] = [pol(170, 104, 66, i * 10), pol(170, 104, i % 3 ? 61 : 56, i * 10)]; ring += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${P.d3}" stroke-width="1.2"/>` }
    let runes = ''
    for (let i = 0; i < 12; i++) { const [x, y] = pol(170, 104, 50, i * 30); runes += `<g transform="translate(${f(x)} ${f(y)}) rotate(${i * 30 + 90})" stroke="${P.d4}" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="${['M0 -5V5M-3 -2L3 2', 'M-3 -5L3 0L-3 5', 'M-3 -5H3L-3 5H3', 'M0 -5V5M-3 0H3', 'M-3 5L0 -5L3 5M-2 1H2', 'M-3 -4L3 4M3 -4L-3 4'][i % 6]}"/></g>` }
    o += `<g class="gr-o"><circle cx="170" cy="104" r="66" fill="none" stroke="${P.d3}" stroke-width="1.6"/>${ring}</g><g class="gr-i"><circle cx="170" cy="104" r="42" fill="none" stroke="${P.d4}" stroke-width="1.2"/>${runes}</g>`
    o += `<path d="${starD(6, 36, 18, -90).replace(/M([\d.-]+) ([\d.-]+)/, (m, x, y) => `M${f(+x + 170)} ${f(+y + 104)}`)}" fill="none" stroke="${P.d3}" stroke-width="1.4" opacity="0"/>`
    // gema central
    o += `<g transform="translate(170 104)"><path d="${starD(6, 30, 15, -90)}" fill="${S.radB([[0, P.d3, 0.8], [1, P.d1, 0.3]])}" stroke="${P.d3}" stroke-width="1.6" class="gr-p"/><circle r="11" fill="${S.radB([[0, '#fff'], [0.4, P.d3], [1, P.d1]], 0.4, 0.35, 0.8)}" stroke="${P.d4}" stroke-width="2.4"/></g>`
    // marcapáginas
    o += `<path d="M280 0V96L292 82L304 96V0Z" fill="${P.d1}" stroke="${P.dk(P.d1, 0.4)}" stroke-width="1.4"/>`
    return o + vig(S, '#000', 0.4)
  },
  frame: (S, P) => '',
}

// ═════════════════════════════ CYBER
const CP = [
  pal('verde', 'Terminal verde', '#27F27A', '#020B07', '#B8FFD6', '#FFD84A'),
  pal('ambar', 'Ámbar CRT', '#FFB000', '#0C0700', '#FFE3A0', '#FF5A36'),
  pal('cian', 'Cian hielo', '#2EE6FF', '#02090F', '#C2F7FF', '#FF4DD8'),
  pal('magenta', 'Magenta', '#FF3DBA', '#0C0210', '#FFC2EC', '#2EE6FF'),
]
const hud = {
  dy: -16, slug: 'terminal-hud', name: 'Terminal HUD', rarity: 'epico', price: 2800, coll: 'neon', tone: 'dark', palettes: CP,
  css: `.hd-sw{transform-box:view-box;transform-origin:170px 104px;animation:hd-sw 4s linear infinite}${KF('hd-sw', 'to{transform:rotate(360deg)}')}.hd-bl{animation:hd-bl 1.1s steps(2) infinite}${KF('hd-bl', '0%{opacity:1}50%{opacity:.15}')}.hd-g{animation:hd-g 6s steps(1) infinite}${KF('hd-g', '0%,92%{transform:translateX(0)}93%{transform:translateX(8px)}95%{transform:translateX(-6px)}97%{transform:translateX(0)}')}.hd-sc{animation:hd-sc 6s linear infinite}${KF('hd-sc', '0%{transform:translateY(-30px)}100%{transform:translateY(460px)}')}`,
  art: (S, P) => {
    const grid = S.nid('p'), sl = S.nid('p')
    S.defs.push(`<pattern id="${grid}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${P.d1}" stroke-opacity=".12"/></pattern><pattern id="${sl}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".35"/></pattern>`)
    let o = vgrad(S, [[0, P.mix(P.d2, P.d1, 0.08)], [1, P.d2]]) + rect(0, 0, CW, CH, `url(#${grid})`)
    o += bloom(S, 170, 104, 150, P.d1, 0.22)
    // radar
    o += `<circle cx="170" cy="104" r="64" fill="none" stroke="${P.d1}" stroke-width="1.4"/><circle cx="170" cy="104" r="44" fill="none" stroke="${P.d1}" stroke-opacity=".6"/><circle cx="170" cy="104" r="22" fill="none" stroke="${P.d1}" stroke-opacity=".5"/><path d="M170 36V172M102 104H238" stroke="${P.d1}" stroke-opacity=".45"/>`
    for (let i = 0; i < 48; i++) { const [a, b] = [pol(170, 104, 64, i * 7.5), pol(170, 104, i % 4 ? 60 : 55, i * 7.5)]; o += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${P.d1}" stroke-opacity=".8"/>` }
    o += `<g class="hd-sw"><path d="M170 104L170 40A64 64 0 0 1 ${f(pol(170, 104, 64, -90 + 50)[0])} ${f(pol(170, 104, 64, -90 + 50)[1])}Z" fill="${S.lin([[0, P.d1, 0.0], [1, P.d1, 0.55]], 0, 0, 1, 0)}"/><path d="M170 104V40" stroke="${P.d3}" stroke-width="1.6"/></g>`
    for (const [x, y] of [[196, 74], [146, 128], [208, 124], [140, 80]]) o += `<circle cx="${x}" cy="${y}" r="3" fill="${P.d4}" class="hd-bl" style="animation-delay:${-(x % 7) / 6}s"/>`
    // barra superior y datos
    const T = (x, y, t, s = 9, c = P.d1, a = 'start') => `<text x="${x}" y="${y}" fill="${c}" font-family="'Share Tech Mono','Courier New',monospace" font-size="${s}" text-anchor="${a}" letter-spacing="1">${t}</text>`
    o += `<g class="hd-g">${T(24, 30, 'SYS://DAIWA.NET', 9)}${T(316, 30, '▮▮▮▮▯ 87%', 9, P.d1, 'end')}</g>`
    const hx = (n) => Array.from({ length: n }, (_, i) => ((i * 2654435 + 977) % 0xffff).toString(16).toUpperCase().padStart(4, '0'))
    hx(8).forEach((h, i) => (o += T(22, 70 + i * 13, '0x' + h, 8, P.d1)))
    hx(8).forEach((h, i) => (o += T(318, 70 + i * 13, h + '▪', 8, P.d1, 'end')))
    o += T(170, 188, 'USER.SCAN ▸ OK', 8.5, P.d4, 'middle')
    o += rect(0, 0, CW, CH, `url(#${sl})`) + `<g class="hd-sc"><rect y="0" width="${CW}" height="22" fill="${P.d1}" opacity=".07"/></g>`
    return o + vig(S, '#000', 0.5)
  },
  frame: (S, P) => {
    const b = (x, y, sx, sy) => `<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M0 34V8L8 0H34" fill="none" stroke="${P.d1}" stroke-width="2.4"/><path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M6 40V12M12 6H40" stroke="${P.d1}" stroke-width="1" opacity=".6"/>`
    return b(8, 8, 1, 1) + b(332, 8, -1, 1) + b(8, 412, 1, -1) + b(332, 412, -1, -1) + `<rect x="3" y="3" width="334" height="414" rx="20" fill="none" stroke="${P.d1}" stroke-opacity=".3"/>`
  },
}

const NNP = [
  pal('rosacian', 'Rosa y cian', '#FF3FA8', '#0A0620', '#9FF3FF', '#27E0FF'),
  pal('violeta', 'Violeta y ámbar', '#9B5CFF', '#080520', '#FFD59A', '#FFA63A'),
  pal('toxico', 'Tóxico', '#7CFF4A', '#04100A', '#E2FFC8', '#FF3D6A'),
  pal('azul', 'Azul eléctrico', '#3D7BFF', '#050A22', '#B8D2FF', '#FF4DA0'),
]
const neon = {
  slug: 'neon-lluvioso', name: 'Neón lluvioso', rarity: 'legendario', price: 6000, coll: 'neon', tone: 'dark', palettes: NNP,
  css: `.nn-r{animation:nn-r .9s linear infinite}${KF('nn-r', '0%{transform:translate(0,-40px)}100%{transform:translate(-14px,440px)}')}.nn-f{animation:nn-f 5s steps(1) infinite}${KF('nn-f', '0%,100%{opacity:1}8%{opacity:.35}10%{opacity:1}52%{opacity:.5}54%{opacity:1}56%{opacity:.4}58%{opacity:1}')}.nn-w{animation:nn-w 3s steps(1) infinite}${KF('nn-w', '0%,100%{opacity:1}50%{opacity:.4}')}`,
  art: (S, P) => {
    let o = vgrad(S, [[0, P.dk(P.d2, 0.2)], [0.55, P.mix(P.d2, P.d1, 0.25)], [1, P.mix(P.d2, P.d4, 0.18)]])
    o += bloom(S, 170, 200, 200, P.d1, 0.3)
    const R = rng(12)
    const layer = (n, hMin, hMax, col, op, yb, win) => {
      let s = '', x = -10
      while (x < CW + 10) {
        const w = 26 + R() * 34, h = hMin + R() * (hMax - hMin)
        s += `<rect x="${f(x)}" y="${f(yb - h)}" width="${f(w)}" height="${f(h)}" fill="${col}" opacity="${op}"/>`
        if (win) for (let wy = yb - h + 8; wy < yb - 6; wy += 11) for (let wx = x + 5; wx < x + w - 5; wx += 9) if (R() < 0.32) s += `<rect x="${f(wx)}" y="${f(wy)}" width="4" height="6" fill="${[P.d1, P.d4, P.d3, '#ffe9a8'][Math.floor(R() * 4)]}" opacity="${f(0.55 + R() * 0.45)}"${R() < 0.1 ? ' class="nn-w"' : ''}/>`
        x += w + 2 + R() * 4
      }
      return s
    }
    o += layer(0, 90, 190, P.mix(P.d2, P.d1, 0.3), 0.55, 300, false) + layer(0, 70, 150, P.dk(P.d2, 0.1), 1, 330, true)
    // cartel neón
    o += `<g class="nn-f"><rect x="198" y="82" width="104" height="34" rx="6" fill="none" stroke="${P.d4}" stroke-width="3"/><text x="250" y="106" text-anchor="middle" font-family="'Monoton','Arial Black',sans-serif" font-size="19" fill="none" stroke="${P.d4}" stroke-width="1.8">DAIWA</text></g>` + bloom(S, 250, 99, 70, P.d4, 0.45)
    o += `<g class="nn-f" style="animation-delay:-2s"><path d="M34 70H96M34 82H80" stroke="${P.d1}" stroke-width="4" stroke-linecap="round"/></g>` + bloom(S, 66, 76, 50, P.d1, 0.4)
    // lluvia
    for (let i = 0; i < 40; i++) o += `<g transform="translate(${f(R() * (CW + 40))} 0)"><path class="nn-r" style="animation-delay:${-(R() * 0.9).toFixed(2)}s;animation-duration:${(0.7 + R() * 0.5).toFixed(2)}s" d="M0 0L-3 16" stroke="${P.d3}" stroke-opacity="${f(0.25 + R() * 0.4)}" stroke-width="1.1"/></g>`
    // reflejo suelo
    o += rect(0, 340, CW, 80, S.lin([[0, P.d1, 0], [1, P.d1, 0.35]], 0, 0, 0, 1))
    return o + vig(S, '#000', 0.45)
  },
  frame: (S, P) => `<rect x="5" y="5" width="330" height="410" rx="19" fill="none" stroke="${P.d4}" stroke-width="2" class="nl-f"/><rect x="5" y="5" width="330" height="410" rx="19" fill="none" stroke="${P.d4}" stroke-width="7" opacity=".18"/><rect x="11" y="11" width="318" height="398" rx="15" fill="none" stroke="${P.d1}" stroke-width="1.4" opacity=".85"/>`,
}

// ═════════════════════════════ PIXEL
const px = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" shape-rendering="crispEdges"/>`
const PP = [
  pal('arcade', 'Arcade', '#4C7DFF', '#0B1030', '#BBD0FF', '#FFD23F'),
  pal('gameboy', 'Game Boy', '#8BAC0F', '#0F380F', '#CADC9F', '#9BBC0F'),
  pal('sunset', 'Atardecer 8-bit', '#FF5E7E', '#2A0A3A', '#FFC4D0', '#FFB347'),
  pal('rojo', 'Rojo cartucho', '#E8342C', '#1C0808', '#FFC2BC', '#F6D74A'),
]
const inicio = {
  slug: 'pantalla-de-inicio', name: 'Pantalla de inicio', rarity: 'comun', price: 800, coll: 'pixel', tone: 'dark', palettes: PP,
  css: `.pi-b{animation:pi-b 1s steps(1) infinite}${KF('pi-b', '0%,49%{opacity:1}50%,100%{opacity:0}')}.pi-t{animation:pi-t 2.4s steps(1) infinite}${KF('pi-t', '0%,60%{opacity:1}61%,80%{opacity:.2}81%,100%{opacity:1}')}.pi-c{animation:pi-c 40s linear infinite}${KF('pi-c', '0%{transform:translateX(-80px)}100%{transform:translateX(420px)}')}`,
  art: (S, P) => {
    // cielo en bandas escalonadas
    let o = ''
    for (let i = 0; i < 14; i++) o += px(0, i * 16, CW, 16, P.mix(P.d2, P.mix(P.d1, P.d4, 0.4), (i / 14) ** 1.6 * 0.75))
    const R = rng(33)
    for (let i = 0; i < 30; i++) o += `<g class="${i % 3 ? 'pi-t' : 'pi-b'}" style="animation-delay:${-(R() * 2.4).toFixed(1)}s">${px(Math.floor(R() * 42) * 8, Math.floor(R() * 18) * 8, i % 5 ? 4 : 8, i % 5 ? 4 : 8, P.d3)}</g>`
    // luna pixel
    const moon = [[2, 0, 4], [1, 1, 6], [0, 2, 8], [0, 3, 8], [0, 4, 8], [0, 5, 8], [1, 6, 6], [2, 7, 4]]
    o += `<g transform="translate(250 40)">${moon.map(([x, y, w]) => px(x * 6, y * 6, w * 6, 6, P.d3)).join('')}${px(18, 12, 6, 6, P.mix(P.d3, P.d1, 0.4))}${px(30, 24, 12, 6, P.mix(P.d3, P.d1, 0.4))}</g>`
    // nubes
    o += `<g class="pi-c" transform="translate(0 0)"><g transform="translate(0 70)">${px(8, 8, 40, 8, '#fff')}${px(0, 16, 64, 8, '#fff')}${px(16, 0, 24, 8, '#fff')}</g></g>`
    // montañas escalonadas
    const mt = (x0, base, hgt, col) => { let s = ''; for (let i = 0; i < hgt; i++) s += px(x0 + i * 8, base - (hgt - i) * 8 + 8 * 0, 8 * (2 * (hgt - i) - 1 > 0 ? 1 : 1), 0, col); return s }
    const mount = (cx, base, rows, col) => { let s = ''; for (let r = 0; r < rows; r++) s += px(cx - r * 8, base - (rows - r) * 8, (r * 2 + 1) * 8, 8, col); return s }
    o += mount(80, 336, 12, P.mix(P.d2, P.d1, 0.35)) + mount(250, 336, 14, P.mix(P.d2, P.d1, 0.5)) + mount(176, 336, 8, P.mix(P.d2, P.d1, 0.25))
    o += px(0, 328, CW, 100, P.dk(P.d2, 0.3)) + px(0, 320, CW, 8, P.d1)
    for (let x = 0; x < CW; x += 16) o += px(x, 336, 8, 8, P.dk(P.d1, 0.55))
    // título parpadeante
    o += `<text x="170" y="196" text-anchor="middle" font-family="'Press Start 2P','Courier New',monospace" font-size="12" fill="${P.d4}" class="pi-b" stroke="#000" stroke-width=".4">PRESS START</text>`
    return o
  },
  frame: (S, P) => {
    let o = ''
    for (let x = 0; x < CW; x += 16) o += px(x, 0, 8, 8, P.d3) + px(x + 8, 0, 8, 8, P.dk(P.d1, 0.2)) + px(x, CH - 8, 8, 8, P.d3) + px(x + 8, CH - 8, 8, 8, P.dk(P.d1, 0.2))
    for (let y = 8; y < CH - 8; y += 16) o += px(0, y, 8, 8, P.dk(P.d1, 0.2)) + px(0, y + 8, 8, 8, P.d3) + px(CW - 8, y, 8, 8, P.dk(P.d1, 0.2)) + px(CW - 8, y + 8, 8, 8, P.d3)
    return o
  },
}

const menu = {
  slug: 'menu-rpg', name: 'Menú RPG', rarity: 'raro', price: 1200, coll: 'pixel', tone: 'dark', palettes: [
    pal('clasico', 'Azul clásico', '#2D4CC8', '#0A1040', '#9EB4FF', '#FFE066'),
    pal('sangre', 'Rojo RPG', '#C8302D', '#2A0808', '#FFB4AE', '#FFE066'),
    pal('verde', 'Verde bosque', '#2D9C4C', '#082A12', '#A8F0B8', '#FFE066'),
    pal('violeta', 'Violeta mago', '#8A4CE0', '#1A0A40', '#D4B8FF', '#FFE066'),
  ],
  css: `.mn-c{animation:mn-c .6s steps(1) infinite alternate}${KF('mn-c', 'from{transform:translateX(0)}to{transform:translateX(5px)}')}.mn-b{animation:mn-b 3s steps(12) infinite alternate}${KF('mn-b', 'from{width:112px}to{width:70px}')}`,
  art: (S, P) => {
    let o = vgrad(S, [[0, P.dk(P.d2, 0.2)], [1, P.d2]])
    const R = rng(3)
    for (let i = 0; i < 26; i++) o += px(Math.floor(R() * 42) * 8, Math.floor(R() * 52) * 8, 4, 4, P.d3 + '55')
    const win = (x, y, w, h) => `${px(x + 4, y, w - 8, h, '#fff')}${px(x, y + 4, w, h - 8, '#fff')}${px(x + 8, y + 4, w - 16, h - 8, P.dk(P.d1, 0.1))}${px(x + 4, y + 8, w - 8, h - 16, P.dk(P.d1, 0.1))}`
    const body = (x, y, w, h) => px(x + 8, y + 8, w - 16, h - 16, S.lin([[0, P.d1], [1, P.dk(P.d1, 0.55)]], 0, 0, 0, 1))
    const T = (x, y, t, c = '#fff', s = 10) => `<text x="${x}" y="${y}" fill="${c}" font-family="'Press Start 2P','Courier New',monospace" font-size="${s}">${t}</text>`
    o += win(14, 52, 312, 70) + body(14, 52, 312, 70)
    o += T(52, 80, 'ATACAR') + T(52, 106, 'MAGIA') + T(176, 80, 'OBJETO') + T(176, 106, 'HUIR')
    o += `<g class="mn-c"><path d="M30 70h6v6h6v6h-6v6h-6z" fill="${P.d4}" shape-rendering="crispEdges"/></g>`
    o += `<g transform="translate(284 60) scale(.8)">${[[0, 6], [1, 5], [2, 4], [3, 3], [4, 2], [5, 1], [6, 0]].map(([x, y]) => px(x * 6, y * 6, 6, 6, '#fff')).join('')}${px(0, 36, 18, 6, P.d4)}${px(6, 30, 6, 12, '#8a5a2b')}</g>`
    return o
  },
  frame: (S, P) => '',
}

// ═════════════════════════════ SAMURÁI
const SP = [
  pal('tradicional', 'Tradicional', '#D8362A', '#F1E7CE', '#FFFFFF', '#1B1B22'),
  pal('indigo', 'Índigo', '#2C4A9A', '#EDE8DA', '#FFFFFF', '#14182A'),
  pal('matcha', 'Matcha', '#5E8C3A', '#EEEBD6', '#FFFFFF', '#1A2418'),
  pal('ceniza', 'Ceniza', '#6B6B78', '#ECE9E4', '#FFFFFF', '#141418'),
]
const pergamino = {
  slug: 'pergamino-y-tinta', name: 'Pergamino y tinta', rarity: 'raro', price: 1600, coll: 'samurai', tone: 'light', palettes: SP,
  css: `.pg-s{animation:pg-s 8s ease-in-out infinite alternate}${KF('pg-s', 'from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}')}`,
  art: (S, P) => {
    const R = rng(17)
    let o = vgrad(S, [[0, P.lt(P.d2, 0.15)], [1, P.dk(P.d2, 0.06)]])
    for (let i = 0; i < 90; i++) o += `<path d="M${f(R() * CW)} ${f(R() * CH)}l${f((R() - 0.5) * 26)} ${f((R() - 0.5) * 8)}" stroke="${P.dk(P.d2, 0.3)}" stroke-opacity="${f(0.06 + R() * 0.1)}" stroke-width=".8"/>`
    // montañas de tinta
    const ink = P.d4
    o += `<path d="M0 160Q50 90 100 130T190 100T270 120T340 90V190H0Z" fill="${S.lin([[0, ink, 0.14], [1, ink, 0]], 0, 0, 0, 1)}"/><path d="M0 170Q60 120 120 150T230 130T340 150V200H0Z" fill="${S.lin([[0, ink, 0.28], [1, ink, 0]], 0, 0, 0, 1)}"/><path d="M0 190Q70 150 130 176T250 160T340 176V220H0Z" fill="${S.lin([[0, ink, 0.5], [1, ink, 0]], 0, 0, 0, 1)}"/>`
    // enso
    o += `<circle cx="228" cy="104" r="34" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round" stroke-dasharray="190 30" transform="rotate(-70 228 104)" opacity=".92"/><circle cx="228" cy="104" r="34" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="160 60" transform="rotate(-70 228 104)" opacity=".5"/>`
    // bambú
    const bam = (x, h, w) => { let s = `<path d="M${x} ${h}V0" stroke="${P.mix(ink, P.d1, 0.1)}" stroke-width="${w}" opacity=".85"/>`; for (let y = h - 18; y > 0; y -= 34) s += `<path d="M${x - w} ${y}H${x + w}" stroke="${ink}" stroke-width="2"/><path d="M${x} ${y}q${w * 5} -4 ${w * 8} ${-10}q${-w * 4} 8 ${-w * 8} 10z" fill="${P.mix(ink, P.d1, 0.1)}" opacity=".8"/>`; return s }
    o += `<g class="pg-s" style="transform-origin:30px 130px">${bam(318, 130, 3.4)}${bam(300, 100, 2.6)}</g>`
    // columnas de texto
    for (let c = 0; c < 2; c++) for (let i = 0; i < 5; i++) o += `<path d="M${150 + c * 14} ${44 + i * 14}v${6 + (i * 5 % 7)}" stroke="${ink}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`
    // sello hanko
    o += `<g transform="translate(292 54) rotate(-6) scale(.8)"><rect width="34" height="34" rx="3" fill="${P.d1}"/><path d="M8 8H26M8 17H26M8 26H26M17 8V26" stroke="${P.d2}" stroke-width="3.2" stroke-linecap="round" opacity=".9"/></g>`
    return o
  },
  frame: (S, P) => `<rect x="7" y="7" width="326" height="406" rx="16" fill="none" stroke="${P.d4}" stroke-width="2.6" opacity=".8"/><rect x="13" y="13" width="314" height="394" rx="12" fill="none" stroke="${P.d1}" stroke-width="1" opacity=".8"/>`,
}

const torii = {
  dy: -84, slug: 'torii-al-amanecer', name: 'Torii al amanecer', rarity: 'epico', price: 3200, coll: 'samurai', tone: 'dark', palettes: [
    pal('amanecer', 'Amanecer', '#FF7A3D', '#2A1450', '#FFE3B0', '#E83A2A'),
    pal('sakura', 'Sakura', '#FF8FB8', '#1E1245', '#FFE4EE', '#D8243A'),
    pal('dorado', 'Dorado', '#FFC94A', '#10143A', '#FFF1C0', '#C8281E'),
    pal('niebla', 'Niebla', '#9EB4E8', '#101830', '#E6EEFF', '#C03030'),
  ],
  css: `.tr-f{animation:tr-f 10s linear infinite}${KF('tr-f', '0%{transform:translate(0,-20px) rotate(0);opacity:0}10%{opacity:1}100%{transform:translate(var(--dx),440px) rotate(500deg);opacity:.9}')}.tr-m{animation:tr-m 14s ease-in-out infinite alternate}${KF('tr-m', 'from{transform:translateX(-24px)}to{transform:translateX(24px)}')}.tr-s{animation:k-pu 6s ease-in-out infinite}`,
  art: (S, P) => {
    let o = vgrad(S, [[0, P.d2], [0.4, P.mix(P.d2, P.d1, 0.55)], [0.62, P.d1], [0.8, P.d4]])
    o += bloom(S, 170, 168, 190, P.d3, 0.7) + `<circle cx="170" cy="168" r="50" fill="${S.radB([[0, '#fff'], [0.6, P.d3], [1, P.d1]], 0.5, 0.5, 0.6)}" class="tr-s"/>`
    const mt = (d, col, op) => `<path d="${d}" fill="${col}" opacity="${op}"/>`
    o += mt('M0 220Q40 150 90 190T170 170T250 190T340 150V300H0Z', P.mix(P.d2, P.d1, 0.35), 0.85)
    o += `<g class="tr-m"><ellipse cx="90" cy="224" rx="150" ry="14" fill="#fff" opacity=".18"/><ellipse cx="270" cy="206" rx="130" ry="12" fill="#fff" opacity=".14"/></g>`
    o += mt('M0 250Q70 200 140 236T260 224T340 238V320H0Z', P.dk(P.d2, 0.1), 0.95)
    // torii
    const tc = P.mix('#e8362a', P.d4, 0.6), td = P.dk(tc, 0.45)
    o += `<g><rect x="110" y="152" width="14" height="150" fill="${tc}"/><rect x="216" y="152" width="14" height="150" fill="${tc}"/><rect x="110" y="152" width="5" height="150" fill="#fff" opacity=".16"/><rect x="216" y="152" width="5" height="150" fill="#fff" opacity=".16"/><path d="M84 148Q170 164 256 148L266 136Q170 154 74 136Z" fill="${td}"/><path d="M92 146Q170 160 248 146L252 140Q170 154 88 140Z" fill="${tc}"/><rect x="104" y="176" width="132" height="10" fill="${tc}"/><rect x="164" y="160" width="12" height="18" fill="${td}"/><rect x="104" y="296" width="26" height="8" fill="#1a1010"/><rect x="210" y="296" width="26" height="8" fill="#1a1010"/></g>`
    o += mt('M0 300Q80 270 170 292T340 280V420H0Z', '#0b0614', 1)
    const R = rng(8)
    for (let i = 0; i < 10; i++) o += `<g transform="translate(${f(R() * CW)} 0)"><g class="tr-f" style="--dx:${f((R() - 0.3) * 90)}px;animation-delay:${-(R() * 10).toFixed(1)}s;animation-duration:${(8 + R() * 5).toFixed(1)}s"><path d="${petalD(8, 4.4)}" fill="${P.d3}"/></g></g>`
    return o + vig(S, '#000', 0.4)
  },
  frame: (S, P) => frame(7, P.d3, 1.2, 18, 0.5),
}

export const C2 = [cielo, grimorio, hud, neon, inicio, menu, pergamino, torii]
