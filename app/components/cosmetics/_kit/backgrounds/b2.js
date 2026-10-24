// @ts-nocheck
// FONDOS (parte 2): Aurora · Bosque de luciérnagas · Ciudad lofi · Catedral · + kits nuevos
import { pal, KF } from '../core/kit.js'
import { leafD, petalD, starD } from '../core/svg.js'
import { BW, BHt, full, vg, bl, vig, stars, sparkle, f, rng, pol } from './lib.js'

export const aurora = {
  slug: 'aurora', name: 'Aurora', rarity: 'epico', price: 2000, palettes: [pal('boreal', 'Boreal', '#4FFFB0', '#040C1C', '#B8FFE6', '#B07CFF'), pal('rosa', 'Aurora rosa', '#FF7AD0', '#0C0620', '#FFC2EC', '#7AD8FF'), pal('azul', 'Hielo', '#5CC8FF', '#040A1C', '#C2ECFF', '#9AFFD0'), pal('dorada', 'Dorada', '#FFD25C', '#10080C', '#FFF0B8', '#FF7A9A')],
  css: `.au-a{animation:au-a 12s ease-in-out infinite alternate}${KF('au-a', 'from{transform:translateX(-24px) scaleY(.92)}to{transform:translateX(24px) scaleY(1.08)}')}.au-b{animation:au-a 17s ease-in-out infinite alternate-reverse}`,
  art: (S, P) => {
    let o = vg(S, [[0, P.dk(P.d2, 0.3)], [1, P.mix(P.d2, P.d1, 0.2)]]) + stars(S, P, 110, 9, 200)
    const rib = (y, amp, c, cls, op) => { let d = `M-40 ${y}`; for (let x = -40; x <= BW + 40; x += 20) d += `L${x} ${f(y + Math.sin(x * 0.02 + y) * amp)}`; const dd = d + `L${BW + 40} ${y + 130}L-40 ${y + 130}Z`; return `<g class="${cls}"><path d="${dd}" fill="${S.lin([[0, c, 0], [0.18, c, op], [1, c, 0]], 0, 0, 0, 1)}"/></g>` }
    o += rib(40, 26, P.d1, 'au-a', 0.7) + rib(76, 20, P.d4, 'au-b', 0.55) + rib(20, 16, P.d3, 'au-a', 0.4)
    o += `<path d="M-10 300V240L40 208L80 236L140 190L190 232L250 200L310 240L370 196L430 236L490 214V300Z" fill="#04070f"/><rect x="-10" y="262" width="${BW + 20}" height="50" fill="#02040a"/>`
    o += `<g opacity=".28" transform="translate(0 524) scale(1 -1)">${rib(40, 26, P.d1, 'au-a', 0.7)}</g>`.replace('translate(0 524)', 'translate(0 560)')
    return o + vig(S, '#000', 0.4)
  } }

export const bosqueLuciernagas = {
  slug: 'bosque-de-luciernagas', name: 'Bosque de luciérnagas', rarity: 'epico', price: 2000, palettes: [pal('esmeralda', 'Esmeralda', '#C8FF5C', '#041410', '#F0FFC2', '#3ED68A'), pal('ambar', 'Ámbar', '#FFC85C', '#140C04', '#FFF0C2', '#7ADC8A'), pal('lila', 'Bosque lila', '#C8A8FF', '#0C0818', '#EEE4FF', '#7AF0D0'), pal('azul', 'Azul hada', '#7AD8FF', '#04101C', '#DDF4FF', '#B48CFF')],
  css: `.bl-f{animation:bl-f 8s ease-in-out infinite}${KF('bl-f', '0%{transform:translate(0,0);opacity:0}20%{opacity:1}50%{transform:translate(var(--dx),-30px);opacity:.4}80%{opacity:1}100%{transform:translate(0,-8px);opacity:0}')}.bl-m{animation:bl-m 22s ease-in-out infinite alternate}${KF('bl-m', 'from{transform:translateX(-26px)}to{transform:translateX(26px)}')}`,
  art: (S, P) => {
    const R = rng(19); let o = vg(S, [[0, P.dk(P.d2, 0.2)], [1, P.mix(P.d2, P.d4, 0.25)]]) + bl(S, 330, 60, 120, P.d3, 0.3) + `<circle cx="330" cy="60" r="20" fill="${P.d3}" opacity=".85"/>`
    const layer = (n, hmin, hmax, col, base, wmin, wmax) => { let s = ''; for (let i = 0; i < n; i++) { const x = (i + R() * 0.6) * (BW / n), w = wmin + R() * (wmax - wmin), h = hmin + R() * (hmax - hmin); s += `<path d="M${f(x)} 320L${f(x + 2)} ${f(base - h)}L${f(x + w)} ${f(base - h)}L${f(x + w + 2)} 320Z" fill="${col}"/><ellipse cx="${f(x + w / 2)}" cy="${f(base - h)}" rx="${f(w * 3.4)}" ry="${f(h * 0.3)}" fill="${col}"/>` } return s }
    o += layer(9, 170, 230, P.mix(P.d2, P.d4, 0.18), 300, 6, 12) + `<g class="bl-m"><ellipse cx="240" cy="210" rx="300" ry="22" fill="#fff" opacity=".07"/></g>` + layer(7, 190, 260, P.dk(P.d2, 0.1), 310, 10, 18) + `<g class="bl-m" style="animation-direction:alternate-reverse"><ellipse cx="200" cy="250" rx="320" ry="20" fill="#fff" opacity=".07"/></g>` + layer(5, 220, 280, P.dk(P.d2, 0.45), 320, 16, 26)
    for (let i = 0; i < 28; i++) { const x = R() * BW, y = 60 + R() * 220; o += `<g transform="translate(${f(x)} ${f(y)})"><g class="bl-f" style="--dx:${f((R() - 0.5) * 60)}px;animation-delay:${-(R() * 8).toFixed(1)}s;animation-duration:${(6 + R() * 6).toFixed(1)}s">${bl(S, 0, 0, 10, P.d1, 0.7)}<circle r="1.6" fill="#fff"/></g></g>` }
    return o + vig(S, '#000', 0.5)
  } }

export const ciudadLofi = {
  slug: 'ciudad-lofi', name: 'Ciudad lofi', rarity: 'epico', price: 2200, palettes: [pal('atardecer', 'Atardecer', '#FF8AA8', '#1C1038', '#FFD0B0', '#FFC86A'), pal('noche', 'Noche lila', '#B79AFF', '#0C0820', '#EBDDFF', '#FFB86A'), pal('lluvia', 'Lluvia azul', '#6FB4FF', '#06101E', '#D2E8FF', '#FFD27A'), pal('rosa', 'Rosa neón', '#FF7AC0', '#14061A', '#FFD0EA', '#7AE0FF')],
  css: `.lf-c{animation:lf-c 60s linear infinite}${KF('lf-c', '0%{transform:translateX(-120px)}100%{transform:translateX(620px)}')}.lf-w{animation:lf-w 4s steps(1) infinite}${KF('lf-w', '0%,100%{opacity:1}50%{opacity:.45}')}.lf-b{animation:lf-b 14s linear infinite}${KF('lf-b', '0%{transform:translate(-30px,0)}100%{transform:translate(520px,-40px)}')}`,
  art: (S, P) => {
    const R = rng(25); let o = vg(S, [[0, P.d2], [0.5, P.mix(P.d2, P.d1, 0.5)], [0.85, P.mix(P.d1, P.d3, 0.5)], [1, P.d3]])
    o += bl(S, 340, 150, 150, P.d4, 0.5) + `<circle cx="340" cy="150" r="46" fill="${S.lin([[0, P.d4], [1, P.mix(P.d4, P.d1, 0.5)]], 0, 0, 0, 1)}"/>`
    o += stars(S, P, 28, 6, 100)
    o += `<g class="lf-c"><g transform="translate(0 56)" fill="#fff" opacity=".2"><ellipse cx="0" cy="0" rx="50" ry="10"/><ellipse cx="-20" cy="-8" rx="26" ry="9"/></g></g>`
    const layer = (col, base, hmin, hmax, win) => { let x = -10; while (x < BW + 10) { const w = 22 + R() * 34, h = hmin + R() * (hmax - hmin); o += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" fill="${col}"/>`; if (R() < 0.3) o += `<rect x="${f(x + w / 2 - 1)}" y="${f(base - h - 14)}" width="2" height="14" fill="${col}"/>`; if (win) for (let yy = base - h + 6; yy < base - 4; yy += 9) for (let xx = x + 4; xx < x + w - 6; xx += 8) if (R() < 0.4) o += `<rect class="${R() < 0.08 ? 'lf-w' : ''}" x="${f(xx)}" y="${f(yy)}" width="3.4" height="4.6" fill="${[P.d4, P.d3, '#fff'][Math.floor(R() * 3)]}" opacity="${f(0.6 + R() * 0.4)}"/>`; x += w + 1 + R() * 3 } }
    layer(P.mix(P.d2, P.d1, 0.35), 270, 50, 120, false); layer(P.dk(P.d2, 0.15), 300, 50, 150, true)
    o += `<path d="M-10 200Q120 230 240 204T490 214" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.2"/>` + Array.from({ length: 5 }, (_, i) => `<g class="lf-b" style="animation-delay:${-i * 3}s"><path d="M0 0l5 -3l5 3l-5 -1z" fill="#000" opacity=".7"/></g>`).join('')
    return o + vig(S, '#000', 0.35)
  } }

export const catedralFondo = {
  slug: 'catedral', name: 'Catedral', rarity: 'epico', price: 2200, palettes: [pal('medianoche', 'Medianoche', '#8B6CFF', '#080612', '#D9CCFF', '#C9A24A'), pal('carmesi', 'Carmesí', '#D6203F', '#0C0508', '#FFB3C0', '#C9A24A'), pal('plata', 'Plata lunar', '#C8CCE0', '#08090E', '#FFFFFF', '#7A86C8'), pal('esmeralda', 'Esmeralda', '#2FD59A', '#040E0C', '#B8FFE6', '#C9A24A')],
  css: `.ca-r{animation:ca-r 8s ease-in-out infinite alternate}${KF('ca-r', 'from{opacity:.3}to{opacity:.8}')}.ca-c{animation:ca-c .5s ease-in-out infinite alternate}${KF('ca-c', 'from{opacity:.7}to{opacity:1}')}`,
  art: (S, P) => {
    let o = full(P.dk(P.d2, 0.3))
    // vitral al fondo
    const arch = 'M180 250V110C180 60 215 36 240 20C265 36 300 60 300 110V250Z'
    o += bl(S, 240, 120, 200, P.d1, 0.4) + `<path d="${arch}" fill="${S.lin([[0, P.d3, 0.95], [0.5, P.d1, 0.95], [1, P.dk(P.d1, 0.5)]], 0, 0, 0, 1)}" stroke="${P.d4}" stroke-width="3"/>`
    o += `<g clip-path="${S.clip(`<path d="${arch}"/>`)}">${[0, 1, 2].map((i) => [0, 1, 2, 3, 4].map((j) => `<rect x="${180 + i * 40}" y="${50 + j * 40}" width="40" height="40" fill="${[P.d1, P.d3, P.d4][(i + j) % 3]}" opacity=".35"/>`).join('')).join('')}<circle cx="240" cy="92" r="18" fill="none" stroke="${P.dk(P.d2, 0.6)}" stroke-width="3"/><path d="M220 250V90M260 250V90M180 150H300" stroke="${P.dk(P.d2, 0.7)}" stroke-width="3"/></g>`
    // arcos en perspectiva
    for (let i = 0; i < 5; i++) { const k = 1 - i * 0.17, cx = 240, w = 260 * k, top = 250 - 220 * k, bot = 250 + 70 * k; const x0 = cx - w, x1 = cx + w; o += `<path d="M${f(x0)} ${f(bot + 60)}V${f(top + 90 * k)}C${f(x0)} ${f(top - 30)} ${f(cx - 20)} ${f(top - 54 * k)} ${f(cx)} ${f(top - 76 * k)}C${f(cx + 20)} ${f(top - 54 * k)} ${f(x1)} ${f(top - 30)} ${f(x1)} ${f(top + 90 * k)}V${f(bot + 60)}" fill="none" stroke="${P.dk(P.d2, 0.7 - i * 0.08)}" stroke-width="${f(26 * k)}"/><path d="M${f(x0 + 12 * k)} ${f(bot + 60)}V${f(top + 90 * k)}" stroke="${P.d4}" stroke-opacity="${f(0.35 * k)}" stroke-width="1.4"/>` }
    // haces de luz
    o += `<polygon points="190,130 290,130 420,320 60,320" fill="${S.lin([[0, P.d3, 0.35], [1, P.d3, 0]], 0, 0, 0, 1)}" class="ca-r"/>`
    // suelo
    o += `<path d="M-10 300V262L240 236L490 262V300Z" fill="${S.lin([[0, P.dk(P.d2, 0.1)], [1, '#000']], 0, 0, 0, 1)}"/>` + [-6, -3, -1, 0, 1, 3, 6].map((i) => `<path d="M${240 + i * 6} 236L${240 + i * 80} 300" stroke="${P.d4}" stroke-opacity=".3"/>`).join('')
    for (const x of [30, 450]) o += `<rect x="${x - 4}" y="238" width="8" height="26" fill="#efe6d4"/><g class="ca-c" style="transform-box:fill-box;transform-origin:50% 100%"><path d="M${x} 220C${x + 6} 228 ${x + 4} 236 ${x} 236C${x - 4} 236 ${x - 6} 228 ${x} 220Z" fill="${P.d4}"/></g>` + bl(S, x, 228, 40, P.d4, 0.45)
    return o + vig(S, '#000', 0.55)
  } }

// ── Kits nuevos
export const cieloSangre = {
  slug: 'cielo-de-sangre', name: 'Cielo de sangre', rarity: 'raro', price: 1300, coll: 'crimson', palettes: [pal('sangre', 'Sangre', '#D6102F', '#0C0306', '#FF9AAA', '#FFB07A'), pal('vino', 'Vino tinto', '#8C1034', '#0A0208', '#E8A0B4', '#D9B25A'), pal('rubi', 'Rubí', '#F0204A', '#08040A', '#FFC2CC', '#9A9AA8'), pal('oxido', 'Óxido', '#E0481C', '#0E0503', '#FFD2A8', '#FFD25A')],
  css: `.cs-c{animation:cs-c 40s linear infinite}${KF('cs-c', '0%{transform:translateX(-160px)}100%{transform:translateX(640px)}')}.cs-f{animation:cs-f 14s linear infinite}${KF('cs-f', '0%{transform:translate(-40px,0)}100%{transform:translate(540px,-50px)}')}.cs-w{transform-box:fill-box;transform-origin:50% 50%;animation:cs-w .4s ease-in-out infinite alternate}${KF('cs-w', 'from{transform:scaleY(1)}to{transform:scaleY(.5)}')}`,
  art: (S, P) => {
    let o = vg(S, [[0, P.dk(P.d2, 0.1)], [0.6, P.mix(P.d2, P.d1, 0.55)], [1, P.d1]])
    o += bl(S, 340, 110, 200, P.d3, 0.35) + `<circle cx="340" cy="110" r="64" fill="${S.radB([[0, P.lt(P.d1, 0.25)], [0.65, P.d1], [1, P.dk(P.d1, 0.55)]], 0.38, 0.34, 0.8)}"/><circle cx="318" cy="90" r="11" fill="${P.dk(P.d1, 0.5)}" opacity=".45"/><circle cx="360" cy="126" r="15" fill="${P.dk(P.d1, 0.5)}" opacity=".4"/>`
    o += `<g class="cs-c"><ellipse cx="0" cy="60" rx="120" ry="12" fill="${P.dk(P.d2, 0.3)}" opacity=".5"/><ellipse cx="40" cy="48" rx="60" ry="9" fill="${P.dk(P.d2, 0.3)}" opacity=".5"/></g>`
    o += `<path d="M-10 300V262Q80 244 170 262T330 256T490 262V300Z" fill="#050103"/>`
    // árbol muerto
    o += `<g fill="none" stroke="#050103" stroke-linecap="round"><path d="M110 270C108 220 114 190 108 150" stroke-width="14"/><path d="M108 170C84 150 66 150 50 132M108 190C130 170 150 168 170 150M108 150C100 124 104 100 96 84M82 156C70 140 70 120 58 110M140 172C150 150 164 146 168 128M96 84C84 76 78 62 68 60M96 84C104 72 112 70 116 56" stroke-width="5"/></g>`
    for (const [x, y, s, d] of [[84, 124, 1.1, 0], [150, 134, 0.9, 1]]) o += `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0C-5 -8 -10 -8 -14 -4C-10 -3 -8 0 -6 5C-2 2 2 2 6 5C8 0 10 -3 14 -4C10 -8 5 -8 0 0Z" fill="#050103"/></g>`
    for (let i = 0; i < 5; i++) o += `<g transform="translate(0 ${60 + i * 28})"><g class="cs-f" style="animation-delay:${-i * 3}s;animation-duration:${12 + i * 2}s"><g class="cs-w" style="animation-delay:${-i * 0.1}s"><path d="M0 0C-4 -6 -14 -9 -24 -4C-16 -4 -12 0 -10 5C-5 2 -2 2 0 3C2 2 5 2 10 5C12 0 16 -4 24 -4C14 -9 4 -6 0 0Z" fill="#050103" transform="scale(${0.6 + (i % 3) * 0.25})"/></g></g></g>`
    return o + `<ellipse cx="240" cy="296" rx="320" ry="26" fill="${S.radB([[0, P.d1, 0.45], [1, P.d1, 0]])}"/>` + vig(S, '#000', 0.5)
  } }

export const nocheSinLuna = {
  slug: 'noche-sin-luna', name: 'Noche sin luna', rarity: 'raro', price: 1200, coll: 'emo', palettes: [pal('negro-rosa', 'Negro y rosa', '#FF3D9A', '#0A070C', '#FFC4E3', '#B8B8C6'), pal('negro-violeta', 'Negro y violeta', '#9B5CFF', '#0B0712', '#E0D0FF', '#C0C0CE'), pal('negro-rojo', 'Negro y rojo', '#E5233A', '#0C0506', '#FFC4CB', '#BCBCC8'), pal('monocromo', 'Monocromo', '#E8E8EE', '#07070A', '#FFFFFF', '#8A8A99')],
  css: `.nl-r{animation:nl-r 1.8s linear infinite}${KF('nl-r', '0%{transform:translate(0,-30px)}100%{transform:translate(-30px,340px)}')}.nl-p{animation:nl-p 5s ease-in-out infinite alternate}${KF('nl-p', 'from{opacity:.5}to{opacity:1}')}`,
  art: (S, P) => {
    const R = rng(66); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.1)], [1, P.dk(P.d2, 0.2)]])
    o += bl(S, 240, 110, 160, P.d1, 0.2)
    // luna "cosida": solo contorno punteado + cruces
    o += `<g class="nl-p"><circle cx="240" cy="104" r="58" fill="${P.dk(P.d2, 0.3)}" stroke="${P.d1}" stroke-width="2.4"/><circle cx="240" cy="104" r="50" fill="none" stroke="${P.d4}" stroke-width="1.4" stroke-dasharray="6 5"/>${Array.from({ length: 12 }, (_, i) => { const [x, y] = pol(240, 104, 58, i * 30); return `<path d="M${f(x - 3)} ${f(y - 3)}L${f(x + 3)} ${f(y + 3)}M${f(x + 3)} ${f(y - 3)}L${f(x - 3)} ${f(y + 3)}" stroke="${P.d3}" stroke-width="1.6" stroke-linecap="round"/>` }).join('')}<path d="M226 90L254 118M254 90L226 118" stroke="${P.d1}" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>`
    for (let i = 0; i < 70; i++) { const x = R() * (BW + 60) - 20; o += `<g transform="translate(${f(x)} ${f(R() * 20)})"><path class="nl-r" style="animation-delay:${-(R() * 1.8).toFixed(2)}s;animation-duration:${(1.2 + R() * 1.2).toFixed(2)}s" d="M0 0L-3 14" stroke="${P.d4}" stroke-opacity="${f(0.2 + R() * 0.5)}" stroke-width="1.2"/></g>` }
    let grass = `M-10 300V270`; for (let x = -10; x <= BW + 10; x += 8) grass += `L${x + 2} ${f(250 + R() * 30)}L${x + 6} ${f(268 + R() * 10)}`; grass += `L${BW + 10} 300Z`
    o += `<path d="${grass}" fill="#030204"/>` + `<g stroke="${P.d1}" stroke-width="1" opacity=".35" fill="none"><path d="M-10 276H490" stroke-dasharray="5 5"/></g>`
    return o + vig(S, '#000', 0.55)
  } }
export const B2 = [aurora, bosqueLuciernagas, ciudadLofi, catedralFondo, cieloSangre, nocheSinLuna]
