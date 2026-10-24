// @ts-nocheck
// FONDOS PREDISEÑADOS (parte 1) — escenas 480×300 con animación CSS ligera.
import { pal, KF } from '../core/kit.js'
import { petalD, leafD, rose, starD } from '../core/svg.js'
import { BW, BHt, full, vg, bl, vig, stars, sparkle, f, rng, pol } from './lib.js'

const px = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" shape-rendering="crispEdges"/>`

export const pixelNoche = {
  slug: 'pixel-noche', name: 'Pixel noche', rarity: 'comun', price: 600, palettes: [pal('azul', 'Azul 8-bit', '#4C7DFF', '#0B1030', '#BBD0FF', '#FFD23F'), pal('morado', 'Morado', '#A66CFF', '#14082A', '#E0D0FF', '#FF7AB8'), pal('verde', 'Game Boy', '#8BAC0F', '#0F380F', '#CADC9F', '#9BBC0F'), pal('rojo', 'Rojo', '#FF5E5E', '#220808', '#FFC0C0', '#FFD23F')],
  css: `.pn-b{animation:pn-b 1.6s steps(1) infinite}${KF('pn-b', '0%,50%{opacity:1}51%,100%{opacity:.15}')}.pn-c{animation:pn-c 50s linear infinite}${KF('pn-c', '0%{transform:translateX(-120px)}100%{transform:translateX(620px)}')}`,
  art: (S, P) => {
    let o = ''; for (let i = 0; i < 19; i++) o += px(-20, i * 16, BW + 40, 16, P.mix(P.d2, P.mix(P.d1, P.d4, 0.45), (i / 19) ** 1.7 * 0.8))
    const R = rng(5); for (let i = 0; i < 40; i++) o += `<g class="${i % 3 ? '' : 'pn-b'}" style="animation-delay:${-(R() * 1.6).toFixed(1)}s">${px(Math.floor(R() * 60) * 8, Math.floor(R() * 20) * 8, i % 6 ? 4 : 8, i % 6 ? 4 : 8, P.d3)}</g>`
    o += `<g transform="translate(380 30)">${[[2, 0, 4], [1, 1, 6], [0, 2, 8], [0, 3, 8], [0, 4, 8], [0, 5, 8], [1, 6, 6], [2, 7, 4]].map(([x, y, w]) => px(x * 7, y * 7, w * 7, 7, P.d3)).join('')}</g>`
    o += `<g class="pn-c"><g transform="translate(0 70)">${px(8, 8, 48, 8, '#fff')}${px(0, 16, 72, 8, '#fff')}${px(16, 0, 28, 8, '#fff')}</g></g>`
    for (const [c, k, op] of [[P.mix(P.d2, P.d1, 0.28), 0, 1], [P.mix(P.d2, P.d1, 0.14), 1, 1]]) { const Rb = rng(10 + k); let x = -8; while (x < BW) { const w = 24 + Math.floor(Rb() * 4) * 8, h = 64 + Math.floor(Rb() * 10) * 8 - k * 24; o += px(x, 300 - h, w, h, c); for (let yy = 300 - h + 8; yy < 292; yy += 16) for (let xx = x + 6; xx < x + w - 8; xx += 12) if (Rb() < 0.4) o += px(xx, yy, 6, 8, [P.d4, P.d3, '#fff'][Math.floor(Rb() * 3)]); x += w + 0 } }
    return o
  } }

export const cieloEstrellado = {
  slug: 'cielo-estrellado', name: 'Cielo estrellado', rarity: 'raro', price: 900, palettes: [pal('noche', 'Noche profunda', '#6C8CFF', '#050818', '#E0E8FF', '#FFE08A'), pal('violeta', 'Violeta', '#A06CFF', '#0A0418', '#E8D8FF', '#FF9AD8'), pal('verde', 'Verde ártico', '#4FE0B0', '#031412', '#C8FFE8', '#B8FF8A'), pal('rosa', 'Rosa cósmico', '#FF7AC0', '#14041A', '#FFD0EA', '#FFD08A')],
  css: `.ce-s{animation:ce-s 7s ease-in infinite}${KF('ce-s', '0%{transform:translate(0,0);opacity:0}5%{opacity:1}20%{transform:translate(-240px,150px);opacity:0}100%{transform:translate(-240px,150px);opacity:0}')}`,
  art: (S, P) => {
    let o = vg(S, [[0, P.dk(P.d2, 0.2)], [0.7, P.mix(P.d2, P.d1, 0.28)], [1, P.mix(P.d2, P.d1, 0.5)]])
    o += `<g transform="rotate(-24 240 150)"><ellipse cx="240" cy="150" rx="340" ry="48" fill="${S.radB([[0, P.d1, 0.4], [0.6, P.d4, 0.12], [1, P.d1, 0]])}"/><ellipse cx="240" cy="150" rx="240" ry="16" fill="${S.radB([[0, P.d3, 0.35], [1, P.d3, 0]])}"/></g>`
    o += stars(S, P, 130, 3, 240)
    const mk = S.mask(`<rect x="-100" y="-100" width="700" height="500" fill="#fff"/><circle cx="415" cy="52" r="28" fill="#000"/>`)
    o += bl(S, 408, 62, 70, P.d4, 0.35) + `<circle cx="402" cy="62" r="28" fill="${P.d4}" mask="${mk}"/>`
    for (const [x, y, d] of [[470, 20, 0], [400, 110, 3.4]]) o += `<g transform="translate(${x} ${y})"><g class="ce-s" style="animation-delay:${-d}s"><path d="M0 0L60 -38" stroke="${S.lin([[0, '#fff', 0], [1, '#fff', 1]], 0, 0, 1, 0)}" stroke-width="2" stroke-linecap="round"/></g></g>`
    o += `<path d="M-10 300V262Q60 236 130 258T260 252T400 262T500 246V300Z" fill="#05060f"/><path d="M-10 300V280Q80 266 170 282T330 276T500 284V300Z" fill="#02030a"/>`
    return o + vig(S)
  } }

export const lluviaVentana = {
  slug: 'lluvia-en-la-ventana', name: 'Lluvia en la ventana', rarity: 'raro', price: 1000, palettes: [pal('azul', 'Azul noche', '#6FB4FF', '#08111E', '#D2E8FF', '#FFD27A'), pal('lila', 'Lila', '#B79AFF', '#120A24', '#EBDDFF', '#FF9AC8'), pal('calida', 'Cálida', '#FFB86A', '#1A0E08', '#FFE6C0', '#FF8AA0'), pal('verde', 'Verde', '#6FFFC0', '#04140E', '#D0FFEA', '#FFE27A')],
  css: `.lv-r{animation:lv-r 6s linear infinite}${KF('lv-r', '0%{transform:translateY(-10px);opacity:0}10%{opacity:.8}100%{transform:translateY(120px);opacity:0}')}.lv-b{animation:lv-b 6s ease-in-out infinite alternate}${KF('lv-b', 'from{opacity:.5}to{opacity:1}')}`,
  art: (S, P) => {
    const R = rng(8); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.2)], [1, P.dk(P.d2, 0.2)]])
    const cols = [P.d1, P.d4, P.d3, P.rot(P.d1, 40)]
    for (let i = 0; i < 40; i++) o += `<circle class="lv-b" style="animation-delay:${-(R() * 6).toFixed(1)}s" cx="${f(R() * BW)}" cy="${f(100 + R() * 200)}" r="${f(6 + R() * 22)}" fill="${S.radB([[0, cols[i % 4], 0.65], [0.7, cols[i % 4], 0.25], [1, cols[i % 4], 0]])}"/>`
    o += `<rect x="-20" y="-20" width="${BW + 40}" height="${BHt + 40}" fill="${P.d2}" opacity=".35"/>`
    for (let i = 0; i < 70; i++) { const x = R() * BW, y = R() * BHt, r = 1.4 + R() * 5; o += `<g><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${P.d3}" fill-opacity=".14" stroke="#fff" stroke-opacity=".35" stroke-width=".6"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.28)}" fill="#fff" opacity=".8"/></g>` }
    for (let i = 0; i < 14; i++) o += `<g transform="translate(${f(R() * BW)} ${f(R() * 140)})"><g class="lv-r" style="animation-delay:${-(R() * 6).toFixed(1)}s;animation-duration:${(4 + R() * 4).toFixed(1)}s"><path d="M0 0Q2 20 0 46" stroke="${P.d3}" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cy="46" r="3" fill="${P.d3}" fill-opacity=".4" stroke="#fff" stroke-opacity=".4" stroke-width=".6"/></g></g>`
    return o + vig(S, '#000', 0.5)
  } }

export const rejillaNeon = {
  slug: 'rejilla-neon', name: 'Rejilla neón', rarity: 'raro', price: 1000, palettes: [pal('synth', 'Synthwave', '#FF3FA8', '#10062A', '#27E0FF', '#FFD23F'), pal('azul', 'Azul eléctrico', '#3D7BFF', '#050A22', '#7AFFF0', '#FF4DA0'), pal('verde', 'Matriz', '#27F27A', '#02100A', '#B8FFD6', '#FFD84A'), pal('naranja', 'Atardecer', '#FF7A2D', '#1A0608', '#FFD27A', '#FF3D7A')],
  css: `.rn-g{animation:rn-g 1.6s linear infinite}${KF('rn-g', 'from{transform:translateY(0)}to{transform:translateY(16px)}')}`,
  art: (S, P) => {
    let o = vg(S, [[0, P.d2], [0.55, P.mix(P.d2, P.d1, 0.35)], [0.56, P.dk(P.d2, 0.3)], [1, P.d2]])
    o += `<circle cx="240" cy="120" r="64" fill="${S.lin([[0, P.d4], [1, P.d1]], 0, 0, 0, 1)}"/>`
    for (let i = 0; i < 7; i++) o += `<rect x="170" y="${100 + i * 12}" width="140" height="${2 + i * 0.9}" fill="${P.mix(P.d2, P.d1, 0.35)}"/>`
    o += bl(S, 240, 120, 150, P.d1, 0.35)
    o += `<path d="M0 168L50 140L90 160L140 128L190 168H0Z M290 168L340 130L390 160L430 138L480 168H290Z" fill="#05030f" stroke="${P.d3}" stroke-width="1.2"/>`
    o += `<rect x="-20" y="168" width="${BW + 40}" height="150" fill="#06030f"/>`
    let g = ''
    for (let i = -14; i <= 14; i++) g += `<path d="M${240 + i * 12} 168L${240 + i * 66} 330" stroke="${P.d3}" stroke-width="1" opacity=".75"/>`
    o += g + `<g class="rn-g">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M0 ${168 + i * i * 2.2 + i * 4}H${BW}" stroke="${P.d1}" stroke-width="1.3" opacity=".85"/>`).join('')}</g>`
    return o + `<rect x="-20" y="166" width="${BW + 40}" height="3" fill="${P.d3}"/>` + vig(S, '#000', 0.45)
  } }

export const brasas = {
  slug: 'brasas', name: 'Brasas', rarity: 'raro', price: 1000, palettes: [pal('fuego', 'Fuego', '#FF7A2A', '#0E0402', '#FFD27A', '#FF3B1E'), pal('azul', 'Llama azul', '#4FA8FF', '#02060E', '#C2E4FF', '#7A5CFF'), pal('verde', 'Fuego fatuo', '#5CFF9A', '#020E06', '#D0FFE2', '#2ABF70'), pal('carmesi', 'Carmesí', '#FF2A4E', '#0E0206', '#FFB0BC', '#FF7A3B')],
  css: `.br-e{animation:br-e 6s linear infinite}${KF('br-e', '0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(var(--dx),-340px);opacity:0}')}.br-p{animation:br-p 3s ease-in-out infinite alternate}${KF('br-p', 'from{opacity:.65}to{opacity:1}')}`,
  art: (S, P) => {
    const R = rng(14); let o = vg(S, [[0, P.d2], [0.6, P.mix(P.d2, P.d1, 0.14)], [1, P.mix(P.d2, P.d1, 0.55)]])
    o += `<ellipse cx="240" cy="310" rx="320" ry="110" fill="${S.radB([[0, P.d3, 0.7], [0.4, P.d1, 0.5], [1, P.d1, 0]])}" class="br-p"/>`
    o += `<path d="M-10 300V268L40 262L70 274L120 258L170 276L230 262L290 278L350 260L410 274L470 264V300Z" fill="#050202"/>`
    for (const [x1, y1, x2, y2] of [[60, 290, 110, 272], [190, 292, 250, 270], [330, 290, 380, 276], [250, 270, 270, 292]]) o += `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${P.d1}" stroke-width="2" opacity=".9"/>`
    for (let i = 0; i < 46; i++) o += `<g transform="translate(${f(R() * BW)} ${f(250 + R() * 60)})"><g class="br-e" style="--dx:${f((R() - 0.4) * 140)}px;animation-delay:${-(R() * 6).toFixed(1)}s;animation-duration:${(4 + R() * 5).toFixed(1)}s"><circle r="${f(2.2 + R() * 4)}" fill="${S.radB([[0, '#fff', 0.9], [0.35, [P.d3, P.d1, P.d4][i % 3], 0.8], [1, P.d1, 0]])}"/></g></g>`
    return o + vig(S, '#000', 0.5)
  } }

export const sakuraDeriva = {
  slug: 'sakura-a-la-deriva', name: 'Sakura a la deriva', rarity: 'raro', price: 1100, palettes: [pal('rosa', 'Rosa', '#FF8AB8', '#2A1030', '#FFE3EE', '#FFB070'), pal('lila', 'Glicina', '#B08CFF', '#160C30', '#EFE4FF', '#FF9AD8'), pal('luna', 'Luna azul', '#9EC8FF', '#0B1230', '#EEF3FF', '#FFB8E0'), pal('durazno', 'Durazno', '#FFB48A', '#2A1020', '#FFE8D6', '#FF8AA8')],
  css: `.sd-f{animation:sd-f 12s linear infinite}${KF('sd-f', '0%{transform:translate(0,-30px) rotate(0);opacity:0}8%{opacity:1}100%{transform:translate(-140px,340px) rotate(620deg);opacity:.9}')}`,
  art: (S, P) => {
    const R = rng(21); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.28)], [1, P.mix(P.d2, P.d4, 0.35)]])
    o += bl(S, 380, 60, 140, P.d3, 0.45)
    for (let i = 0; i < 16; i++) o += `<circle cx="${f(R() * BW)}" cy="${f(R() * BHt)}" r="${f(10 + R() * 30)}" fill="${S.radB([[0, P.d1, 0.35], [1, P.d1, 0]])}"/>`
    const branch = (d, w) => `<path d="${d}" fill="none" stroke="#2a1822" stroke-width="${w}" stroke-linecap="round"/>`
    const bloom = (x, y, r, c) => { let s = `<g transform="translate(${x} ${y}) rotate(${f(R() * 72)})">`; for (let i = 0; i < 5; i++) s += `<path transform="rotate(${i * 72})" d="${petalD(r, r * 0.55)}" fill="${c}" stroke="${P.dk(P.d1, 0.2)}" stroke-width=".6"/>`; return s + `<circle r="${f(r * 0.2)}" fill="${P.dk(P.d1, 0.25)}"/></g>` }
    o += branch('M-10 20C60 30 110 60 170 50C210 44 250 70 300 60', 9) + branch('M80 36C86 70 70 96 78 120', 4) + branch('M170 50C176 80 200 98 196 124', 3.4) + branch('M490 240C420 230 380 250 330 244', 8) + branch('M400 236C404 210 396 196 404 176', 3.6)
    for (const [x, y, r] of [[30, 26, 16], [76, 38, 14], [120, 52, 17], [170, 50, 15], [210, 58, 14], [260, 66, 16], [80, 120, 14], [196, 122, 13], [450, 240, 16], [404, 176, 14], [360, 246, 15], [330, 244, 13]]) o += bloom(x, y, r, [P.d3, P.d1][Math.floor(R() * 2)])
    for (let i = 0; i < 22; i++) o += `<g transform="translate(${f(180 + R() * 400)} 0)"><g class="sd-f" style="animation-delay:${-(R() * 12).toFixed(1)}s;animation-duration:${(9 + R() * 6).toFixed(1)}s"><path transform="scale(${f(0.7 + R() * 0.9)})" d="${petalD(10, 5.4)}" fill="${[P.d3, P.d1][i % 2]}"/></g></g>`
    return o + vig(S, '#000', 0.25)
  } }

export const jardinRosas = {
  slug: 'jardin-de-rosas', name: 'Jardín de rosas', rarity: 'raro', price: 1100, palettes: [pal('rojas', 'Rosas rojas', '#D6203F', '#04140C', '#FF9AAA', '#E8C26A'), pal('rosadas', 'Rosas rosadas', '#FF7AA8', '#06180F', '#FFD0E0', '#FFE08A'), pal('negras', 'Rosas negras', '#2A1A26', '#05100A', '#9A7A94', '#D6203F'), pal('blancas', 'Rosas blancas', '#F2EAE0', '#04120E', '#FFFFFF', '#F0C860')],
  css: `.jr-s{transform-box:fill-box;transform-origin:50% 100%;animation:jr-s 6s ease-in-out infinite alternate}${KF('jr-s', 'from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}')}`,
  art: (S, P) => {
    const R = rng(30); let o = vg(S, [[0, P.dk(P.d2, 0.2)], [1, P.mix(P.d2, P.d1, 0.2)]])
    o += bl(S, 240, 90, 200, P.d4, 0.18)
    const lf = (x, y, a, s) => `<path transform="translate(${x} ${y}) rotate(${a})" d="${leafD(22 * s, 8 * s)}" fill="${S.lin([[0, P.mix('#0f3a22', P.d1, 0.1)], [1, '#06180f']], 0, 1, 0, 0)}" stroke="#000" stroke-opacity=".3" stroke-width=".6"/>`
    for (let i = 0; i < 70; i++) o += lf(R() * BW, 40 + R() * 280, R() * 360, 0.8 + R() * 1.2)
    const cols = [P.d1, P.dk(P.d1, 0.35), P.lt(P.d1, 0.2)]
    for (let i = 0; i < 18; i++) { const x = 20 + R() * 440, y = 30 + R() * 250, s = 16 + R() * 22; o += `<g class="jr-s" style="animation-delay:${-(R() * 6).toFixed(1)}s">${rose(S, x, y, s, cols[i % 3], P.dk(P.d1, 0.6), P.d3, { rot: R() * 90 })}</g>` }
    o += stars(S, P, 14, 4, 300, P.d4)
    return o + vig(S, '#000', 0.5)
  } }

export const nebulosa = {
  slug: 'nebulosa', name: 'Nebulosa', rarity: 'raro', price: 1200, palettes: [pal('violeta', 'Violeta', '#8F6BFF', '#050514', '#D9CCFF', '#FF8AD0'), pal('cobre', 'Cobre', '#FF9A4D', '#0E0604', '#FFE0BF', '#6BC8FF'), pal('hielo', 'Hielo', '#63D4FF', '#030E16', '#D2F4FF', '#B99BFF'), pal('magenta', 'Magenta', '#FF5DB8', '#10041A', '#FFC8EA', '#6BE8FF')],
  css: `.nb-d{animation:nb-d 30s ease-in-out infinite alternate}${KF('nb-d', 'from{transform:translate(-14px,6px) scale(1)}to{transform:translate(14px,-8px) scale(1.06)}')}`,
  art: (S, P) => {
    const R = rng(7); let o = full(P.d2)
    const blob = (x, y, rx, ry, rot, c, op) => `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${S.radB([[0, c, op], [0.55, c, op * 0.4], [1, c, 0]])}"/></g>`
    o += `<g class="nb-d">${blob(150, 120, 230, 90, -25, P.d1, 0.7)}${blob(330, 170, 220, 80, 20, P.d4, 0.55)}${blob(240, 90, 160, 60, 5, P.d3, 0.3)}${blob(60, 240, 150, 70, 30, P.d4, 0.4)}${blob(420, 60, 140, 60, -30, P.d1, 0.5)}</g>`
    o += stars(S, P, 150, 11, 300)
    for (let i = 0; i < 40; i++) o += `<circle cx="${f(R() * BW)}" cy="${f(R() * BHt)}" r="${f(18 + R() * 40)}" fill="${S.radB([[0, '#fff', 0.05], [1, '#fff', 0]])}"/>`
    return o + vig(S, '#000', 0.4)
  } }

export const cortinaTerciopelo = {
  slug: 'cortina-de-terciopelo', name: 'Cortina de terciopelo', rarity: 'epico', price: 1800, palettes: [pal('rouge', 'Rouge', '#B3122E', '#1C0309', '#FF9BAA', '#E2B85A'), pal('burdeos', 'Burdeos', '#7A1840', '#14040C', '#E8A3C0', '#D9B25A'), pal('esmeralda', 'Esmeralda', '#0F7A55', '#04140E', '#A8F0D2', '#E2B85A'), pal('zafiro', 'Zafiro', '#2447C8', '#060A1E', '#AFC2FF', '#E2C46E')],
  css: `.ct-w{animation:ct-w 8s ease-in-out infinite alternate;transform-box:view-box;transform-origin:240px 0}${KF('ct-w', 'from{transform:skewX(-.7deg)}to{transform:skewX(.7deg)}')}.ct-l{animation:ct-l 6s ease-in-out infinite alternate}${KF('ct-l', 'from{opacity:.6}to{opacity:1}')}`,
  art: (S, P) => {
    const R = rng(3); let o = full('#050205')
    o += `<polygon points="240,-10 130,300 350,300" fill="${S.lin([[0, P.d3, 0.5], [1, P.d3, 0]], 0, 0, 0, 1)}" class="ct-l"/>`
    o += `<rect x="-10" y="262" width="${BW + 20}" height="50" fill="${S.lin([[0, '#3a2412'], [1, '#100804']], 0, 0, 0, 1)}"/>`
    const fold = (x0, x1, flip) => { let s = ''; const n = 7, w = (x1 - x0) / n; for (let i = 0; i < n; i++) { const hi = 0.3 + R() * 0.35; s += `<rect x="${f(x0 + i * w)}" y="-10" width="${f(w + 1)}" height="320" fill="${S.lin([[0, P.dk(P.d1, 0.62)], [hi * 0.6, P.d1], [hi, P.lt(P.d1, 0.28)], [hi + 0.18, P.d1], [1, P.dk(P.d1, 0.7)]], 0, 0, 1, 0)}"/>` } return s }
    const side = (flip) => { const body = `M-10 -10H200C176 80 150 190 80 300H-10Z`, cl = S.clip(`<path d="${body}"/>`); return `<g transform="${flip ? `translate(${BW} 0) scale(-1 1)` : ''}"><g class="ct-w"><g clip-path="${cl}">${fold(-10, 210, flip)}<rect x="-10" y="-10" width="220" height="320" fill="${S.lin([[0, '#000', 0], [1, '#000', 0.45]], 0, 0, 1, 0)}"/></g><path d="M-10 190Q60 176 130 182" stroke="${P.d4}" stroke-width="6" fill="none"/><path d="M130 182L128 214" stroke="${P.d4}" stroke-width="3"/><circle cx="128" cy="218" r="7" fill="${P.d4}"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${118 + i * 2.6} 224v${22 + (i % 3) * 3}" stroke="${P.d4}" stroke-width="1.6"/>`).join('')}</g></g>` }
    o += side(false) + side(true)
    let val = `<rect x="-10" y="-10" width="${BW + 20}" height="40" fill="${S.lin([[0, P.lt(P.d1, 0.12)], [1, P.dk(P.d1, 0.5)]], 0, 0, 0, 1)}"/>`
    for (let i = 0; i < 8; i++) val += `<path d="M${i * 60} 30Q${i * 60 + 30} 74 ${i * 60 + 60} 30Z" fill="${S.lin([[0, P.d1], [1, P.dk(P.d1, 0.65)]], 0, 0, 0, 1)}" stroke="${P.d4}" stroke-width="1.6"/>`
    return o + val + `<rect x="-10" y="26" width="${BW + 20}" height="6" fill="${P.d4}"/>` + vig(S, '#000', 0.45)
  } }

export const bibliotecaNocturna = {
  slug: 'biblioteca-nocturna', name: 'Biblioteca nocturna', rarity: 'epico', price: 1800, palettes: [pal('caoba', 'Caoba', '#C9803A', '#1A0E06', '#FFD9A0', '#7AA0E8'), pal('esmeralda', 'Lámpara verde', '#3FAF7A', '#06130E', '#BFF0D6', '#E8C26A'), pal('burdeos', 'Burdeos', '#A8344A', '#16060A', '#F0B4C0', '#D9B25A'), pal('zafiro', 'Zafiro', '#4A78D8', '#070B1A', '#BCD0FF', '#E8C26A')],
  css: `.bn-f{animation:bn-f 3s ease-in-out infinite alternate}${KF('bn-f', 'from{opacity:.7}to{opacity:1}')}.bn-d{animation:bn-d 12s linear infinite}${KF('bn-d', '0%{transform:translate(0,0);opacity:0}15%{opacity:.8}100%{transform:translate(20px,-120px);opacity:0}')}`,
  art: (S, P) => {
    const R = rng(41); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.1)], [1, P.dk(P.d2, 0.3)]])
    const colors = [P.d1, P.d4, P.mix(P.d1, P.d2, 0.45), P.dk(P.d1, 0.4), P.mix(P.d4, P.d2, 0.5), P.mix(P.d3, P.d2, 0.6), P.rot(P.d1, 30)]
    const shelf = (x0, x1) => { for (const y of [70, 130, 190, 250]) { let x = x0; while (x < x1 - 8) { const w = 8 + R() * 10, h = 34 + R() * 20; o += `<g transform="translate(${f(x)} ${y})"><rect y="${-h}" width="${f(w)}" height="${f(h)}" rx="1.4" fill="${colors[Math.floor(R() * 7)]}"/><rect y="${-h}" width="${f(w * 0.28)}" height="${f(h)}" fill="#fff" opacity=".12"/><rect x="${f(w * 0.12)}" y="${f(-h * 0.7)}" width="${f(w * 0.76)}" height="3" fill="${P.d3}" opacity=".7"/></g>`; x += w + 0.6 } o += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="8" fill="#2a170a"/><rect x="${x0}" y="${y + 8}" width="${x1 - x0}" height="6" fill="#000" opacity=".4"/>` } }
    shelf(-4, 150); shelf(330, 484)
    // ventana arco central con luna
    o += `<path d="M170 300V120C170 50 310 50 310 120V300Z" fill="${S.lin([[0, P.dk(P.d1, 0.7)], [1, P.mix(P.d2, P.d1, 0.35)]], 0, 0, 0, 1)}" stroke="${P.d4}" stroke-width="3"/>` + stars(S, P, 18, 5, 200).replace(/cx="/g, 'cx="').split('').join('')
    o += `<g clip-path="${S.clip('<path d="M170 300V120C170 50 310 50 310 120V300Z"/>')}"><circle cx="262" cy="108" r="22" fill="${P.d3}"/>${bl(S, 262, 108, 60, P.d3, 0.4)}<path d="M170 300V200Q200 190 240 204T310 196V300Z" fill="#05070f" opacity=".8"/></g><path d="M240 60V300M170 150H310" stroke="${P.dk(P.d2, 0.4)}" stroke-width="4"/>`
    // lámpara de mesa y escritorio
    o += `<rect x="150" y="262" width="180" height="14" fill="#2a170a"/><rect x="150" y="276" width="180" height="30" fill="#140a05"/>` + bl(S, 380, 220, 90, P.d3, 0.35)
    o += `<g transform="translate(120 262)"><path d="M0 0V-34L20 -50" stroke="${P.d4}" stroke-width="3" fill="none"/><path d="M12 -58L36 -52L26 -40Z" fill="${P.d1}"/></g>` + bl(S, 150, 222, 60, P.d3, 0.5).replace('<circle', '<circle class="bn-f"')
    for (let i = 0; i < 18; i++) o += `<g transform="translate(${f(120 + R() * 240)} ${f(150 + R() * 140)})"><circle class="bn-d" style="animation-delay:${-(R() * 12).toFixed(1)}s" r="${f(0.8 + R() * 1.2)}" fill="${P.d3}"/></g>`
    return o + vig(S, '#000', 0.5)
  } }
export const B1 = [pixelNoche, cieloEstrellado, lluviaVentana, rejillaNeon, brasas, sakuraDeriva, jardinRosas, nebulosa, cortinaTerciopelo, bibliotecaNocturna]
