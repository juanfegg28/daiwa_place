// @ts-nocheck
// FONDOS Halloween (1.5.0): 10 fondos animados, 1 por kit de la tanda
import { pal, KF } from '../core/kit.js'
import { starD } from '../core/svg.js'
import { BW, BHt, full, vg, bl, vig, stars, sparkle, f, rng, pol } from './lib.js'

const bat = (x, y, s, c, cls = '', d = 0) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><g class="${cls}" style="animation-delay:${-d}s"><path d="M0 -3C-2 -7 -4 -7 -5 -3C-10 -8 -17 -8 -22 -3C-17 -2 -16 1 -17 4C-13 1 -10 2 -8 5C-6 3 -4 3 -3 6C-2 3 -1 1 0 5C1 1 2 3 3 6C4 3 6 3 8 5C10 2 13 1 17 4C16 1 17 -2 22 -3C17 -8 10 -8 5 -3C4 -7 2 -7 0 -3Z" fill="${c}"/></g></g>`
const moon = (S, P, x, y, r, c = P.d3) => bl(S, x, y, r * 3.4, c, 0.3) + `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.2}" r="${r * 0.22}" fill="#000" opacity=".1"/><circle cx="${x + r * 0.35}" cy="${y + r * 0.3}" r="${r * 0.15}" fill="#000" opacity=".1"/>`
const fogBand = (y, op, cls, c = '#fff', rx = 320, ry = 20) => `<g class="${cls}"><ellipse cx="240" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${op}"/></g>`
const flap = (p) => `.${p}-f{transform-box:fill-box;transform-origin:50% 60%;animation:${p}-f .5s ease-in-out infinite alternate}${KF(p + '-f', 'from{transform:scaleY(1)}to{transform:scaleY(.55)}')}`
const fly = (p) => `.${p}-y{animation:${p}-y 18s linear infinite}${KF(p + '-y', '0%{transform:translate(-40px,0)}50%{transform:translate(260px,-26px)}100%{transform:translate(560px,6px)}')}`
const drift = (p, a = 30, t = 20) => `.${p}-d{animation:${p}-d ${t}s ease-in-out infinite alternate}${KF(p + '-d', `from{transform:translateX(-${a}px)}to{transform:translateX(${a}px)}`)}`
const twk = (p) => `.${p}-t{animation:${p}-t 3s ease-in-out infinite}${KF(p + '-t', '0%,100%{opacity:.35}50%{opacity:1}')}`

export const pasilloCripta = {
  slug: 'pasillo-de-la-cripta', name: 'Pasillo de la cripta', rarity: 'epico', price: 2200, coll: 'cripta',
  palettes: [pal('hueso', 'Hueso y sangre', '#C9CDD8', '#0C0709', '#F4EFE6', '#C0142E'), pal('violeta', 'Violeta', '#B8A4F0', '#0A0714', '#F1ECFF', '#8A4CFF'), pal('azul', 'Azul frío', '#9CC4F0', '#050A14', '#EAF4FF', '#2E7BFF'), pal('ambar', 'Ámbar', '#E0C27A', '#0E0A04', '#FFF4D6', '#FF7A1F')],
  css: flap('pc') + fly('pc') + drift('pc', 26, 18) + `.pc-fl{animation:pc-fl 2.4s ease-in-out infinite alternate}${KF('pc-fl', 'from{opacity:.55;transform:scale(.9)}to{opacity:1;transform:scale(1.08)}')}`,
  art: (S, P) => {
    let o = vg(S, [[0, P.dk(P.d2, 0.4)], [1, P.mix(P.d2, P.d4, 0.12)]])
    // arcos góticos en perspectiva
    for (let i = 0; i < 5; i++) { const k = 1 - i * 0.17, w = 150 * k, h = 200 * k, cx = 240, y0 = 290 - i * 14; o += `<path d="M${cx - w} ${y0}V${y0 - h * 0.55}Q${cx - w} ${y0 - h * 0.95} ${cx} ${y0 - h}Q${cx + w} ${y0 - h * 0.95} ${cx + w} ${y0 - h * 0.55}V${y0}" fill="none" stroke="${P.mix(P.d1, P.d2, 0.35 + i * 0.12)}" stroke-width="${f(5 * k)}"/>` }
    o += `<path d="M-10 300L150 262H330L490 300Z" fill="${P.dk(P.d2, 0.45)}"/>` + `<path d="M240 262V300M190 262L130 300M290 262L350 300" stroke="${P.d1}" stroke-opacity=".16"/>`
    o += `<path d="M-10 0V300H60V0Z M420 0V300H490V0Z" fill="${P.dk(P.d2, 0.35)}" opacity=".9"/>`
    // antorchas
    for (const x of [78, 402]) o += `<rect x="${x - 3}" y="132" width="6" height="22" fill="#1a1215"/><g class="pc-fl" style="transform-origin:${x}px 130px">${bl(S, x, 124, 34, P.d4, 0.7)}<path d="M${x} 108C${x + 7} 118 ${x + 6} 128 ${x} 132C${x - 6} 128 ${x - 7} 118 ${x} 108Z" fill="${P.d3}"/></g>`
    o += `<path d="M232 270V300" stroke="${P.d1}" opacity=".0"/>` + fogBand(270, 0.12, 'pc-d') + fogBand(292, 0.16, 'pc-d', '#fff', 360, 18)
    for (let i = 0; i < 4; i++) o += `<g class="pc-y" style="animation-delay:${-i * 4.5}s;animation-duration:${14 + i * 2}s">${bat(0, 70 + i * 28, 0.9 - i * 0.1, '#050304', 'pc-f')}</g>`
    return o + vig(S, '#000', 0.6)
  } }

export const cementerioPlata = {
  slug: 'cementerio-de-plata', name: 'Cementerio de plata', rarity: 'raro', price: 1400, coll: 'cruces',
  palettes: [pal('plata', 'Plata', '#D4D8E4', '#070708', '#FFFFFF', '#7A86A8'), pal('sangre', 'Plata y sangre', '#CFCFD8', '#0A0507', '#FFFFFF', '#C41E3A'), pal('oro', 'Oro viejo', '#E8CC8A', '#0A0804', '#FFF2CC', '#8A5A10'), pal('violeta', 'Violeta', '#C4B0F0', '#07050F', '#FFFFFF', '#6A3CD0')],
  css: drift('cp', 28, 22) + twk('cp'),
  art: (S, P) => {
    const R = rng(8); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.1)], [0.7, P.d2], [1, P.dk(P.d2, 0.4)]]) + stars(S, P, 50, 3, 150, '#fff') + moon(S, P, 360, 70, 30, P.d1)
    const cross = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><rect x="-2.4" y="-30" width="4.8" height="48"/><rect x="-12" y="-19" width="24" height="4.8"/><path d="M-2.4 -30L0 -36L2.4 -30Z"/></g>`
    // colinas y cruces
    o += `<path d="M-10 230Q90 190 200 224T380 210T490 226V300H-10Z" fill="${P.mix(P.d2, P.d1, 0.12)}"/>`
    for (let i = 0; i < 9; i++) o += cross(20 + i * 54 + R() * 20, 226 + R() * 6, 0.6 + R() * 0.3, P.mix(P.d2, P.d1, 0.28))
    o += fogBand(236, 0.16, 'cp-d') + `<path d="M-10 262Q120 236 250 258T490 252V300H-10Z" fill="${P.dk(P.d2, 0.35)}"/>`
    // cruz grande en primer plano
    o += cross(110, 262, 2.6, '#050506') + `<g transform="translate(110 262) scale(2.6)" fill="none" stroke="${P.d1}" stroke-opacity=".7" stroke-width=".5"><rect x="-2.4" y="-30" width="4.8" height="48"/><rect x="-12" y="-19" width="24" height="4.8"/></g>`
    o += cross(400, 272, 2, '#050506')
    o += fogBand(285, 0.2, 'cp-d', '#fff', 380, 16)
    for (let i = 0; i < 10; i++) o += `<circle class="cp-t" cx="${f(R() * BW)}" cy="${f(200 + R() * 80)}" r="1.4" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    return o + vig(S, '#000', 0.55)
  } }

export const campoCalabazas = {
  slug: 'campo-de-calabazas', name: 'Campo de calabazas', rarity: 'comun', price: 700, coll: 'calabaza',
  palettes: [pal('naranja', 'Naranja', '#FF8A1F', '#140D08', '#FFC46B', '#8B8B84'), pal('violeta', 'Violeta bruja', '#A855F7', '#0E0816', '#E0C4FF', '#7CFF4D'), pal('toxico', 'Tóxico', '#7CFF4D', '#08120A', '#D8FFC4', '#FF8A1F'), pal('sangre', 'Sangre', '#E03030', '#140808', '#FFB0A8', '#D8D0C0')],
  css: flap('cpk') + fly('cpk') + `.cpk-g{animation:cpk-g 3s ease-in-out infinite alternate}${KF('cpk-g', 'from{opacity:.6}to{opacity:1}')}` + drift('cpk', 24, 20),
  art: (S, P) => {
    const R = rng(12); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.1)], [0.6, P.mix(P.d2, P.d1, 0.28)], [1, P.d2]]) + moon(S, P, 90, 64, 34, P.d3) + stars(S, P, 30, 5, 110, P.d3)
    o += `<path d="M-10 190Q100 150 230 186T490 170V300H-10Z" fill="${P.dk(P.d2, 0.2)}"/>`
    // árbol retorcido
    o += `<path d="M420 230C418 200 424 170 410 140C420 148 430 130 440 110M416 170C400 160 392 150 380 148M424 160C440 156 452 146 462 150" fill="none" stroke="#050304" stroke-width="7" stroke-linecap="round"/>`
    const pk = (x, y, r, lit) => `<g transform="translate(${f(x)} ${f(y)})">${lit ? bl(S, 0, 0, r * 2.2, P.d1, 0.45) : ''}<ellipse rx="${r}" ry="${f(r * 0.84)}" fill="${lit ? P.d1 : P.dk(P.d1, 0.55)}"/><path d="M${-r * 0.4} ${-r * 0.8}Q${-r * 0.8} 0 ${-r * 0.4} ${r * 0.8}M${r * 0.4} ${-r * 0.8}Q${r * 0.8} 0 ${r * 0.4} ${r * 0.8}" stroke="#000" stroke-opacity=".3" fill="none"/><path d="M0 ${-r * 0.84}q0 ${-r * 0.3} ${r * 0.3} ${-r * 0.36}" stroke="#2c5a1c" stroke-width="${f(r * 0.2)}" fill="none" stroke-linecap="round"/>${lit ? `<g class="cpk-g"><path d="M${-r * 0.5} ${-r * 0.1}L${-r * 0.2} ${-r * 0.4}L${-r * 0.08} ${-r * 0.06}ZM${r * 0.5} ${-r * 0.1}L${r * 0.2} ${-r * 0.4}L${r * 0.08} ${-r * 0.06}ZM${-r * 0.5} ${r * 0.22}L${-r * 0.2} ${r * 0.36}L0 ${r * 0.28}L${r * 0.2} ${r * 0.36}L${r * 0.5} ${r * 0.22}L${r * 0.3} ${r * 0.56}L0 ${r * 0.46}L${-r * 0.3} ${r * 0.56}Z" fill="${P.d3}"/></g>` : ''}</g>`
    for (let i = 0; i < 12; i++) o += pk(10 + i * 42 + R() * 20, 214 + R() * 30, 9 + R() * 8, false)
    o += fogBand(250, 0.12, 'cpk-d')
    o += pk(120, 262, 30, true) + pk(250, 274, 40, true) + pk(380, 262, 24, true) + pk(40, 280, 22, false)
    for (let i = 0; i < 3; i++) o += `<g class="cpk-y" style="animation-delay:${-i * 6}s">${bat(0, 40 + i * 30, 0.8, '#050304', 'cpk-f', i)}</g>`
    return o + vig(S, '#000', 0.5)
  } }

export const cuervosEnLaReja = {
  slug: 'cuervos-en-la-reja', name: 'Cuervos en la reja', rarity: 'epico', price: 2200, coll: 'cuervo',
  palettes: [pal('plata', 'Plata y noche', '#D5DAE5', '#07080C', '#FFFFFF', '#7C8499'), pal('sangre', 'Plata y rubí', '#D8D2D8', '#0A0508', '#FFFFFF', '#C41E3A'), pal('violeta', 'Amatista', '#C8B4F8', '#08060F', '#FFFFFF', '#7A4CE0'), pal('oro', 'Oro negro', '#E6C888', '#0A0804', '#FFF2CC', '#8A5A10')],
  css: flap('cv') + fly('cv') + `.cv-b{transform-box:fill-box;transform-origin:50% 100%;animation:cv-b 5s ease-in-out infinite}${KF('cv-b', '0%,80%,100%{transform:rotate(0)}86%{transform:rotate(-8deg)}92%{transform:rotate(5deg)}')}` + twk('cv'),
  art: (S, P) => {
    const R = rng(31); let o = vg(S, [[0, P.mix(P.d2, P.d4, 0.2)], [0.7, P.d2], [1, P.dk(P.d2, 0.3)]]) + stars(S, P, 40, 4, 140, '#fff') + moon(S, P, 330, 80, 36, P.d3)
    // nubes cruzando la luna
    o += `<g class="cv-t" style="animation:none">${fogBand(78, 0.28, '', P.d2, 140, 10)}${fogBand(96, 0.2, '', P.d2, 180, 8)}</g>`
    // bandada
    for (let i = 0; i < 6; i++) o += `<g class="cv-y" style="animation-delay:${-i * 3}s;animation-duration:${16 + i}s">${bat(0, 40 + i * 14, 0.7 + (i % 3) * 0.1, '#030305', 'cv-f', i)}</g>`
    // reja
    let g = `<rect x="-10" y="230" width="500" height="6" fill="#050507"/><rect x="-10" y="274" width="500" height="6" fill="#050507"/>`
    for (let x = 8; x < 490; x += 36) g += `<path d="M${x - 3.4} 300V176L${x} 160L${x + 3.4} 176V300Z" fill="#050507" stroke="${P.d1}" stroke-opacity=".35" stroke-width=".8"/>` + (((x - 8) / 36) % 2 ? `<circle cx="${x}" cy="206" r="7" fill="none" stroke="#050507" stroke-width="3"/>` : '')
    o += g
    // cuervos posados
    const rv = (x, y, s) => `<g class="cv-b" transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0C-12 -9 -2 -12 6 -9C10 -13 15 -12 18 -8L24 -5L18 -4C17 4 12 8 4 9L5 15H0L-1 9C-9 8 -14 5 -14 0Z" fill="#030305" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".6"/><circle cx="14" cy="-8" r="1" fill="${P.d4}"/></g>`
    o += rv(60, 162, 1.3) + rv(172, 164, 1) + rv(352, 162, 1.5)
    o += fogBand(292, 0.22, 'cv-t', '#fff', 380, 16)
    return o + vig(S, '#000', 0.55)
  } }

export const salonDeEspejos = {
  slug: 'salon-de-espejos', name: 'Salón de espejos', rarity: 'epico', price: 2200, coll: 'barroco',
  palettes: [pal('grafito', 'Grafito', '#BFC3CC', '#0C0C0F', '#FFFFFF', '#6C707A'), pal('sepia', 'Sepia', '#D6BE98', '#0D0A06', '#FFF4DC', '#7A5A34'), pal('rosa', 'Rosa ceniza', '#E3B8C4', '#0C0709', '#FFEAF0', '#8A5A68'), pal('acero', 'Azul acero', '#A8C4DE', '#06090D', '#EAF4FF', '#4A6A8A')],
  css: `.se-s{animation:se-s 5s ease-in-out infinite alternate}${KF('se-s', 'from{transform:rotate(-2deg)}to{transform:rotate(2deg)}')}.se-fl{animation:se-fl 2.2s ease-in-out infinite alternate}${KF('se-fl', 'from{opacity:.6}to{opacity:1}')}` + drift('se', 18, 16),
  art: (S, P) => {
    const R = rng(5); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.1)], [1, P.dk(P.d2, 0.3)]])
    // damasco
    for (let x = 0; x < BW + 40; x += 48) for (let y = 0; y < BHt + 60; y += 64) o += `<g transform="translate(${x} ${y})" fill="${P.d1}" opacity=".07"><path d="M24 4C34 12 36 28 24 36C12 28 14 12 24 4Z"/><path d="M24 36C30 44 34 52 24 60C14 52 18 44 24 36Z"/></g>`
    // espejo con marco ovalado
    o += bl(S, 240, 150, 170, P.d3, 0.18)
    o += `<ellipse cx="240" cy="154" rx="112" ry="132" fill="${S.lin([[0, P.mix(P.d2, P.d1, 0.2)], [0.5, P.dk(P.d2, 0.3)], [1, P.mix(P.d2, P.d1, 0.15)]], 0, 0, 1, 1)}" stroke="${P.d1}" stroke-width="9"/><ellipse cx="240" cy="154" rx="122" ry="142" fill="none" stroke="${P.d3}" stroke-opacity=".5" stroke-width="2"/>`
    o += `<path d="M180 60L300 250" stroke="#fff" stroke-opacity=".08" stroke-width="22"/><path d="M215 56L318 232" stroke="#fff" stroke-opacity=".05" stroke-width="10"/>`
    // volutas del marco
    for (const s of [-1, 1]) o += `<g transform="translate(240 154) scale(${s} 1)" fill="none" stroke="${P.d1}" stroke-width="3.4" stroke-linecap="round"><path d="M112 -30C140 -40 146 -70 126 -80C112 -86 104 -72 116 -66"/><path d="M110 40C140 48 150 80 128 92C112 98 104 84 116 78"/></g>`
    o += `<g transform="translate(240 20)"><path d="M0 0C-16 -4 -22 -18 -10 -22C-4 -14 0 -10 0 -6C0 -10 4 -14 10 -22C22 -18 16 -4 0 0Z" fill="${P.d1}"/></g>`
    // candelabros
    for (const x of [48, 432]) { o += `<path d="M${x} 280V200M${x - 18} 214Q${x - 18} 232 ${x} 232Q${x + 18} 232 ${x + 18} 214" fill="none" stroke="${P.d1}" stroke-width="3"/><rect x="${x - 18 - 2}" y="196" width="4" height="18" fill="${P.d3}"/><rect x="${x + 16}" y="196" width="4" height="18" fill="${P.d3}"/><rect x="${x - 2}" y="188" width="4" height="26" fill="${P.d3}"/>`; for (const dx of [-18, 0, 18]) o += `<g class="se-fl">${bl(S, x + dx, 186 + (dx ? 8 : 0), 22, '#ffd89a', 0.6)}<ellipse cx="${x + dx}" cy="${186 + (dx ? 8 : 0)}" rx="2.6" ry="4.4" fill="#fff4cc"/></g>` }
    // lámpara colgante
    o += `<g class="se-s" style="transform-origin:240px 0px"><path d="M240 0V22" stroke="${P.d1}" stroke-width="1.6"/><path d="M200 44Q240 32 280 44L270 58H210Z" fill="${P.d1}"/>${[-30, -10, 10, 30].map((dx) => `<circle cx="${240 + dx}" cy="66" r="3" fill="#ffd89a"/>`).join('')}</g>`
    // pétalos
    for (let i = 0; i < 10; i++) o += `<path d="M0 6C-5 3-6-3 0-6C6-3 5 3 0 6Z" fill="${P.d3}" opacity=".6" transform="translate(${f(R() * BW)} ${f(R() * BHt)}) rotate(${f(R() * 360)})"/>`
    return o + vig(S, '#000', 0.6)
  } }

export const bosqueSinRostroFondo = {
  slug: 'bosque-sin-rostro', name: 'Bosque sin rostro', rarity: 'epico', price: 2200, coll: 'creepy',
  palettes: [pal('niebla', 'Niebla', '#B9C4C0', '#070A09', '#E8F0EC', '#8A9A94'), pal('sangre', 'Niebla roja', '#D0A8A8', '#0B0606', '#FFE8E4', '#B01818'), pal('verde', 'Enfermizo', '#A8D080', '#070B05', '#EEFFD8', '#5E8A2E'), pal('azul', 'Frío', '#9CB8D8', '#05080D', '#E6F0FF', '#4A6A96')],
  css: drift('bf', 40, 26) + `.bf-n{animation:bf-n .9s steps(1) infinite}${KF('bf-n', '0%{opacity:.1}25%{opacity:.18}50%{opacity:.08}75%{opacity:.2}100%{opacity:.1}')}`,
  art: (S, P) => {
    const R = rng(77); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.45)], [0.6, P.mix(P.d2, P.d1, 0.18)], [1, P.d2]]) + bl(S, 360, 70, 120, P.d3, 0.35)
    const trees = (n, c, hmin, hmax, wmin, wmax, base) => { let s = ''; for (let i = 0; i < n; i++) { const x = (i + R() * 0.7) * (BW / n), w = wmin + R() * (wmax - wmin), h = hmin + R() * (hmax - hmin); s += `<path d="M${f(x)} ${base}L${f(x + w * 0.3)} ${f(base - h)}L${f(x + w)} ${base}Z" fill="${c}"/>`; if (R() < 0.7) s += `<path d="M${f(x + w * 0.4)} ${f(base - h * 0.55)}l${f(10 + R() * 18)} ${f(-14 - R() * 12)}M${f(x + w * 0.5)} ${f(base - h * 0.35)}l${f(-(10 + R() * 18))} ${f(-12)}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>` } return s }
    o += trees(18, P.mix(P.d2, P.d1, 0.3), 160, 240, 4, 8, 300) + fogBand(190, 0.2, 'bf-d') + trees(12, P.mix(P.d2, P.d1, 0.1), 200, 280, 6, 12, 310) + fogBand(240, 0.2, 'bf-d', '#fff', 360, 18) + trees(7, '#030504', 230, 300, 10, 20, 320)
    o += fogBand(285, 0.26, 'bf-d', '#fff', 400, 14)
    o += `<g class="bf-n">${full('#fff')}</g>` + `<path d="${Array.from({ length: 30 }, (_, i) => `M0 ${i * 10 + 3}H${BW}`).join('')}" stroke="#000" stroke-opacity=".1"/>`
    return o + vig(S, '#000', 0.65)
  } }

export const habitacionOscura = {
  slug: 'habitacion-a-oscuras', name: 'Habitación a oscuras', rarity: 'epico', price: 2200, coll: 'creepy',
  palettes: [pal('tinta', 'Tinta y sangre', '#F2F2F2', '#060606', '#FFFFFF', '#B3141E'), pal('blanco', 'Blanco y negro', '#F2F2F2', '#060606', '#FFFFFF', '#9A9AA2'), pal('azul', 'Tinta azul', '#E4ECF8', '#05070B', '#FFFFFF', '#2E5CC0'), pal('verde', 'Tinta tóxica', '#E8F4E0', '#050805', '#FFFFFF', '#3E9A28')],
  css: `.ho-s{animation:ho-s 4s ease-in-out infinite alternate}${KF('ho-s', 'from{transform:rotate(-5deg)}to{transform:rotate(5deg)}')}.ho-k{animation:ho-k 3.4s steps(1) infinite}${KF('ho-k', '0%,100%{opacity:1}8%{opacity:.4}10%{opacity:1}56%{opacity:.7}58%{opacity:1}')}.ho-dr{animation:ho-dr 6s ease-in infinite}${KF('ho-dr', '0%{transform:translateY(-10px);opacity:0}15%{opacity:1}100%{transform:translateY(260px);opacity:1}')}`,
  art: (S, P) => {
    const R = rng(44); let o = full(P.d2) + `<path d="M-10 262H490V300H-10Z" fill="#000"/>`
    // ventana con luna y barrotes
    o += `<rect x="300" y="40" width="130" height="170" fill="${S.lin([[0, P.mix(P.d2, P.d4, 0.2)], [1, '#000']], 0, 0, 0, 1)}" stroke="${P.d1}" stroke-width="5"/>` + moon(S, P, 372, 92, 22, P.d3).replace('r="22"', 'r="22"') + `<path d="M365 40V210M300 125H430" stroke="${P.d1}" stroke-width="4"/>`
    o += `<path d="M300 210L240 300H430Z" fill="${P.d3}" opacity=".07"/>`
    // foco colgante
    o += `<g class="ho-s" style="transform-origin:120px 0px"><path d="M120 0V110" stroke="${P.d1}" stroke-width="1.6"/><g class="ho-k">${bl(S, 120, 120, 100, '#fff2c0', 0.5)}<circle cx="120" cy="118" r="9" fill="#fff6d0"/></g></g>`
    // cama / silueta de mueble
    o += `<path d="M20 262V220H140V262Z M20 220V196H36V220" fill="#000" stroke="${P.d1}" stroke-opacity=".4"/>`
    // goteo de tinta del techo
    let d = `<rect x="-10" y="-4" width="500" height="10" fill="#000"/>`
    for (let i = 0; i < 14; i++) { const x = 12 + i * 34 + R() * 12, h = 14 + R() * 50, w = 2.4 + R() * 2.4; d += `<path d="M${f(x - w)} 0V${f(h)}Q${f(x - w)} ${f(h + w * 1.6)} ${f(x)} ${f(h + w * 1.7)}Q${f(x + w)} ${f(h + w * 1.6)} ${f(x + w)} ${f(h)}V0Z" fill="#000"/>` }
    o += d
    for (let i = 0; i < 5; i++) o += `<g class="ho-dr" style="animation-delay:${-i * 1.3}s;animation-duration:${5 + i}s"><path d="M${f(40 + i * 90 + R() * 30)} 0C${f(40 + i * 90 + R() * 30)} 0 0 0 0 0" opacity="0"/><path transform="translate(${f(50 + i * 88 + R() * 20)} 60)" d="M0 -5C0 -5 -4 2 -4 5A4 4 0 0 0 4 5C4 2 0 -5 0 -5Z" fill="${P.d4}"/></g>`
    // arañazos en la pared
    for (let i = 0; i < 6; i++) o += `<path d="M${f(180 + R() * 100)} ${f(120 + R() * 90)}l${f(20 + R() * 40)} ${f(-20 - R() * 30)}" stroke="${P.d1}" stroke-opacity="${f(0.1 + R() * 0.2)}" stroke-width="1.2"/>`
    return o + vig(S, '#000', 0.7)
  } }

export const senalPerdida = {
  slug: 'senal-perdida', name: 'Señal perdida', rarity: 'epico', price: 2200, coll: 'creepy',
  palettes: [pal('rojo', 'Duotono rojo', '#B8433B', '#090404', '#F4D6D0', '#FFFFFF'), pal('cian', 'Señal cian', '#2EC4D6', '#030A0B', '#CFF8FF', '#FFFFFF'), pal('crt', 'Fósforo', '#3DFF7A', '#030B05', '#C8FFD8', '#FFFFFF'), pal('violeta', 'Ultravioleta', '#A66CFF', '#08050F', '#E6D4FF', '#FFFFFF')],
  css: `.sgn-b{animation:sgn-b 3.2s steps(1) infinite}${KF('sgn-b', '0%{transform:translateX(0)}20%{transform:translateX(30px)}40%{transform:translateX(-18px)}60%{transform:translateX(44px)}80%{transform:translateX(-26px)}100%{transform:translateX(0)}')}.sgn-n{animation:sgn-n .7s steps(1) infinite}${KF('sgn-n', '0%{opacity:.16}33%{opacity:.3}66%{opacity:.1}100%{opacity:.22}')}.sgn-t{animation:sgn-t 5s linear infinite}${KF('sgn-t', 'from{transform:translateY(-60px)}to{transform:translateY(340px)}')}`,
  art: (S, P) => {
    const R = rng(91); let o = full(P.d2)
    for (let i = 0; i < 70; i++) { const w = 20 + R() * 140, h = 6 + R() * 40; o += `<rect x="${f(R() * BW)}" y="${f(R() * BHt)}" width="${f(w)}" height="${f(h)}" fill="${R() < 0.6 ? P.d1 : P.d3}" opacity="${f(0.04 + R() * 0.16)}"/>` }
    for (let i = 0; i < 6; i++) o += `<g class="sgn-b" style="animation-delay:${-i * 0.5}s;animation-duration:${2.4 + i * 0.5}s"><rect x="-40" y="${20 + i * 46}" width="560" height="${5 + (i % 3) * 5}" fill="${i % 2 ? P.d1 : P.d3}" opacity=".22"/></g>`
    // rostro-fantasma: óvalo sin facciones, apenas insinuado
    o += `<ellipse cx="240" cy="150" rx="52" ry="68" fill="${P.d4}" opacity=".05"/>`
    o += `<g class="sgn-t"><rect x="-10" y="0" width="500" height="40" fill="${S.lin([[0, P.d3, 0], [0.5, P.d3, 0.14], [1, P.d3, 0]], 0, 0, 0, 1)}"/></g>`
    o += `<g class="sgn-n">${full(`url(#${S.id}n)`)}</g>`.replace(`url(#${S.id}n)`, '#fff').replace('fill="#fff"', 'fill="#fff" opacity=".0"')
    o += `<path d="${Array.from({ length: 100 }, (_, i) => `M0 ${i * 3}H${BW}`).join('')}" stroke="#000" stroke-opacity=".35"/>`
    o += `<text x="14" y="26" font-family="monospace" font-size="12" fill="${P.d3}" opacity=".8">REC ● 00:13:13</text><text x="466" y="286" text-anchor="end" font-family="monospace" font-size="11" fill="${P.d1}" opacity=".7">SIN SEÑAL</text>`
    return o + vig(S, '#000', 0.6)
  } }

export const cenizaEnElAire = {
  slug: 'ceniza-en-el-aire', name: 'Ceniza en el aire', rarity: 'raro', price: 1300, coll: 'creepy',
  palettes: [pal('ceniza', 'Ceniza', '#F2F2F2', '#060606', '#FFFFFF', '#8A8A92'), pal('rosa', 'Ceniza rosa', '#F5D0DE', '#09050A', '#FFF0F6', '#C04070'), pal('sangre', 'Ceniza roja', '#F0D0D0', '#0B0505', '#FFF0F0', '#B01818'), pal('azul', 'Ceniza azul', '#D4E4F8', '#05070B', '#F0F8FF', '#4A74C0')],
  css: `.ce-r{transform-box:fill-box;transform-origin:50% 50%;animation:ce-r 80s linear infinite}${KF('ce-r', 'to{transform:rotate(360deg)}')}.ce-f{animation:ce-f linear infinite}${KF('ce-f', '0%{transform:translate(0,-20px);opacity:0}10%{opacity:1}100%{transform:translate(var(--dx),330px);opacity:.1}')}`,
  art: (S, P) => {
    const R = rng(52); let o = vg(S, [[0, P.mix(P.d2, P.d4, 0.12)], [1, P.dk(P.d2, 0.2)]]) + bl(S, 360, 60, 150, P.d1, 0.12)
    o += `<g class="ce-r"><circle cx="350" cy="120" r="150" fill="none" stroke="${P.d1}" stroke-width="9" stroke-dasharray="18 12" opacity=".35"/><circle cx="350" cy="120" r="126" fill="none" stroke="${P.d4}" stroke-width="1.4" opacity=".6"/></g>`
    // casa de muñecas / silueta de caja de música
    o += `<rect x="40" y="190" width="120" height="80" fill="#050505" stroke="${P.d1}" stroke-opacity=".5"/><path d="M34 190L100 150L166 190Z" fill="#050505" stroke="${P.d1}" stroke-opacity=".5"/><rect x="58" y="208" width="22" height="26" fill="${P.d3}" opacity=".12"/><rect x="118" y="208" width="22" height="26" fill="${P.d3}" opacity=".12"/>`
    o += `<rect x="-10" y="266" width="500" height="40" fill="#030303"/>`
    for (let i = 0; i < 46; i++) { const s = 1 + R() * 2.4; o += `<g class="ce-f" style="--dx:${f((R() - 0.4) * 80)}px;animation-duration:${f(8 + R() * 10)}s;animation-delay:${-f(R() * 12)}s"><circle cx="${f(R() * BW)}" cy="0" r="${f(s)}" fill="${R() < 0.2 ? P.d4 : P.d3}" opacity="${f(0.5 + R() * 0.5)}"/></g>` }
    o += fogBand(272, 0.16, '', '#fff', 380, 14)
    return o + vig(S, '#000', 0.6)
  } }

export const nocheBrumaAzul = {
  slug: 'noche-de-bruma-azul', name: 'Noche de bruma azul', rarity: 'legendario', price: 5200, coll: 'vampiro',
  palettes: [pal('bruma', 'Bruma azul', '#7FD6E6', '#06151C', '#CFF3F8', '#3F7FA6'), pal('noche', 'Noche azul', '#6FA0FF', '#060A1E', '#D4E2FF', '#9A7CFF'), pal('hielo', 'Hielo', '#B8E8F0', '#06141A', '#F0FCFF', '#4A9AB8'), pal('menta', 'Menta', '#6FE0C0', '#04140F', '#D0FFF0', '#2A8A78')],
  css: drift('nbz', 34, 24) + `.nbz-o{transform-box:fill-box;transform-origin:50% 50%;animation:nbz-o 70s linear infinite}${KF('nbz-o', 'to{transform:rotate(360deg)}')}` + twk('nbz') + `.nbz-s{transform-box:fill-box;transform-origin:50% 50%;animation:nbz-s 40s linear infinite reverse}${KF('nbz-s', 'to{transform:rotate(360deg)}')}.nbz-v{transform-box:fill-box;transform-origin:50% 50%;animation:nbz-o 9s linear infinite}`,
  art: (S, P) => {
    const R = rng(66); let o = vg(S, [[0, P.mix(P.d2, P.d1, 0.2)], [0.6, P.d2], [1, P.dk(P.d2, 0.35)]]) + bl(S, 120, 60, 200, P.d1, 0.32) + bl(S, 440, 240, 160, P.d4, 0.3)
    for (let i = 0; i < 18; i++) { const x = R() * BW, w = 8 + R() * 22; o += `<rect x="${f(x)}" y="-10" width="${f(w)}" height="320" fill="${i % 3 ? P.mix(P.d2, P.d1, 0.3) : P.dk(P.d2, 0.4)}" opacity="${f(0.25 + R() * 0.4)}"/>` }
    o += fogBand(170, 0.14, 'nbz-d', P.d3, 360, 18) + fogBand(250, 0.18, 'nbz-d', P.d3, 400, 16)
    // órbitas
    o += `<g class="nbz-o"><ellipse cx="240" cy="130" rx="220" ry="66" transform="rotate(-14 240 130)" fill="none" stroke="${P.d3}" stroke-opacity=".5" stroke-width="1.2"/></g><g class="nbz-o" style="animation-direction:reverse"><ellipse cx="240" cy="140" rx="170" ry="46" transform="rotate(20 240 140)" fill="none" stroke="${P.d3}" stroke-opacity=".4" stroke-width="1.2"/></g>`
    // estrellas huecas
    const st = (x, y, r, w) => `<g class="nbz-s"><path transform="translate(${x} ${y})" d="${starD(5, r, r * 0.42)}" fill="none" stroke="${P.d3}" stroke-width="${w}" stroke-linejoin="round"/></g>`
    o += st(380, 220, 34, 3) + st(300, 100, 18, 2.4) + st(90, 210, 22, 2.6)
    // vinilo
    o += `<g class="nbz-v"><g transform="translate(130 150)"><circle r="30" fill="#08121a" stroke="${P.d3}" stroke-opacity=".6"/><circle r="22" fill="none" stroke="${P.d1}" stroke-opacity=".25"/><circle r="10" fill="${P.d4}"/><circle r="2" fill="#000"/></g></g>`
    o += stars(S, P, 40, 2, 300, '#fff') + moon(S, P, 400, 60, 22, P.d3)
    return o + vig(S, '#000', 0.5)
  } }

export const B3 = [pasilloCripta, cementerioPlata, campoCalabazas, cuervosEnLaReja, salonDeEspejos, bosqueSinRostroFondo, habitacionOscura, senalPerdida, cenizaEnElAire, nocheBrumaAzul]
