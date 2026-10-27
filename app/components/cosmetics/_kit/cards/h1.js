// @ts-nocheck
// HALLOWEEN — 10 tarjetas fluidas (Cripta · Cruz de plata · Calabazas · Cuervo · Barroco · Creepypastas ×4 · Vampiro azul)
import { fl } from './kit.js'
import { rng, pol, f } from '../core/util.js'
import { rgba, mix, lt, dk } from '../core/color.js'
import { pal } from '../core/kit.js'
import { chainQ } from '../avatar/hw1.js'

const fade = (a = '#000 0,#000 30%,transparent 85%', dir = '180deg') => `-webkit-mask-image:linear-gradient(${dir},${a});mask-image:linear-gradient(${dir},${a})`
const dotp = (c, g = 8) => `<b style="display:block;width:100%;height:100%;border-radius:50%;background:${c};box-shadow:0 0 ${g}px ${c}"></b>`
const spark = (c) => `<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0-9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" fill="${c}"/></svg>`
const batS = (c, w = 40) => `<svg viewBox="0 0 60 30" width="${w}" height="${w / 2}" aria-hidden="true"><path d="M30 8C27 3 24 3 22 7C16 1 7 1 0 7C6 9 8 12 7 16C11 12 15 13 17 17C19 14 22 14 24 18C26 14 28 12 30 18C32 12 34 14 36 18C38 14 41 14 43 17C45 13 49 12 53 16C52 12 54 9 60 7C53 1 44 1 38 7C36 3 33 3 30 8Z" fill="${c}"/></svg>`
const HIDE = (slug) => `@container (max-width:560px){.sk-${slug} .hide-sm{display:none}}`
const four = (c, w = 2, size = 'clamp(30px,5.4cqw,50px)') => ['top:7px;left:7px', 'top:7px;right:7px;transform:scaleX(-1)', 'bottom:7px;left:7px;transform:scaleY(-1)', 'bottom:7px;right:7px;transform:scale(-1,-1)'].map((p) => `<svg class="sk-b" viewBox="0 0 64 64" style="width:${size};height:${size};${p}" aria-hidden="true"><g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"><path d="M3 58V16Q3 3 16 3H58"/><path d="M11 36V22Q11 11 22 11H36" opacity=".6"/><circle cx="3" cy="3" r="3.4" fill="${c}" stroke="none"/></g></svg>`).join('')
const crossP = (c, w = 1) => `<path d="M0 -34Q5 -28 4 -21V-9H18Q27 -9 31 0Q27 9 18 9H4V30Q5 38 0 46Q-5 38 -4 30V9H-18Q-27 9 -31 0Q-27 -9 -18 -9H-4V-21Q-5 -28 0 -34Z" fill="${c}" stroke="#000" stroke-width="${w}" stroke-linejoin="round"/>`
const wrap = (o) => o

const CR = [pal('hueso', 'Hueso y sangre', '#C9CDD8', '#0C0709', '#F4EFE6', '#C0142E'), pal('violeta', 'Violeta', '#B8A4F0', '#0A0714', '#F1ECFF', '#8A4CFF'), pal('azul', 'Azul frío', '#9CC4F0', '#050A14', '#EAF4FF', '#2E7BFF'), pal('ambar', 'Ámbar', '#E0C27A', '#0E0A04', '#FFF4D6', '#FF7A1F')]
const CZ = [pal('plata', 'Plata', '#D4D8E4', '#070708', '#FFFFFF', '#7A86A8'), pal('sangre', 'Plata y sangre', '#CFCFD8', '#0A0507', '#FFFFFF', '#C41E3A'), pal('oro', 'Oro viejo', '#E8CC8A', '#0A0804', '#FFF2CC', '#8A5A10'), pal('violeta', 'Violeta', '#C4B0F0', '#07050F', '#FFFFFF', '#6A3CD0')]
const CB = [pal('naranja', 'Naranja', '#FF8A1F', '#140D08', '#FFC46B', '#8B8B84'), pal('violeta', 'Violeta bruja', '#A855F7', '#0E0816', '#E0C4FF', '#7CFF4D'), pal('toxico', 'Tóxico', '#7CFF4D', '#08120A', '#D8FFC4', '#FF8A1F'), pal('sangre', 'Sangre', '#E03030', '#140808', '#FFB0A8', '#D8D0C0')]
const CV = [pal('plata', 'Plata y noche', '#D5DAE5', '#07080C', '#FFFFFF', '#7C8499'), pal('sangre', 'Plata y rubí', '#D8D2D8', '#0A0508', '#FFFFFF', '#C41E3A'), pal('violeta', 'Amatista', '#C8B4F8', '#08060F', '#FFFFFF', '#7A4CE0'), pal('oro', 'Oro negro', '#E6C888', '#0A0804', '#FFF2CC', '#8A5A10')]
const BA = [pal('grafito', 'Grafito', '#BFC3CC', '#0C0C0F', '#FFFFFF', '#6C707A'), pal('sepia', 'Sepia', '#D6BE98', '#0D0A06', '#FFF4DC', '#7A5A34'), pal('rosa', 'Rosa ceniza', '#E3B8C4', '#0C0709', '#FFEAF0', '#8A5A68'), pal('acero', 'Azul acero', '#A8C4DE', '#06090D', '#EAF4FF', '#4A6A8A')]
const CPA = [pal('niebla', 'Niebla', '#B9C4C0', '#070A09', '#E8F0EC', '#8A9A94'), pal('sangre', 'Niebla roja', '#D0A8A8', '#0B0606', '#FFE8E4', '#B01818'), pal('verde', 'Enfermizo', '#A8D080', '#070B05', '#EEFFD8', '#5E8A2E'), pal('azul', 'Frío', '#9CB8D8', '#05080D', '#E6F0FF', '#4A6A96')]
const CPB = [pal('tinta', 'Tinta y sangre', '#F2F2F2', '#060606', '#FFFFFF', '#B3141E'), pal('blanco', 'Blanco y negro', '#F2F2F2', '#060606', '#FFFFFF', '#9A9AA2'), pal('azul', 'Tinta azul', '#E4ECF8', '#05070B', '#FFFFFF', '#2E5CC0'), pal('verde', 'Tinta tóxica', '#E8F4E0', '#050805', '#FFFFFF', '#3E9A28')]
const CPC = [pal('rojo', 'Duotono rojo', '#B8433B', '#090404', '#F4D6D0', '#FFFFFF'), pal('cian', 'Señal cian', '#2EC4D6', '#030A0B', '#CFF8FF', '#FFFFFF'), pal('crt', 'Fósforo', '#3DFF7A', '#030B05', '#C8FFD8', '#FFFFFF'), pal('violeta', 'Ultravioleta', '#A66CFF', '#08050F', '#E6D4FF', '#FFFFFF')]
const CPD = [pal('ceniza', 'Ceniza', '#F2F2F2', '#060606', '#FFFFFF', '#8A8A92'), pal('rosa', 'Ceniza rosa', '#F5D0DE', '#09050A', '#FFF0F6', '#C04070'), pal('sangre', 'Ceniza roja', '#F0D0D0', '#0B0505', '#FFF0F0', '#B01818'), pal('azul', 'Ceniza azul', '#D4E4F8', '#05070B', '#F0F8FF', '#4A74C0')]
const VP = [pal('bruma', 'Bruma azul', '#7FD6E6', '#06151C', '#CFF3F8', '#3F7FA6'), pal('noche', 'Noche azul', '#6FA0FF', '#060A1E', '#D4E2FF', '#9A7CFF'), pal('hielo', 'Hielo', '#B8E8F0', '#06141A', '#F0FCFF', '#4A9AB8'), pal('menta', 'Menta', '#6FE0C0', '#04140F', '#D0FFF0', '#2A8A78')]
const C = (slug, name, rarity, price, coll, palettes, build, css = '') => ({ slug, name, rarity, price, coll, tone: 'dark', palettes, css, build })

// stone brick tile
const brickT = (P, a = 0.2) => { const st = rgba(P.d1, a), b = (x, y, w) => `<rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="15.8" rx="1.6" fill="${rgba(P.d1, 0.04)}" stroke="${st}"/>`; return b(0, 0, 36) + b(36, 0, 36) + b(-18, 17, 36) + b(18, 17, 36) + b(54, 17, 36) }

export const H1 = [
  // ─────────── CRIPTA DE HUESO
  C('cripta-de-hueso', 'Cripta de hueso', 'epico', 2800, 'cripta', CR, (K, P) => {
    const a = (g, r, cx = 0, cy = 0) => pol(cx, cy, r, g)
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d4, 0.14)} 0,${P.d2} 45%,${dk(P.d2, 0.3)})`)
    bg += K.pattern(72, 34, brickT(P, 0.22), { style: fade('#000 0,#000 40%,rgba(0,0,0,.35) 100%') })
    bg += K.fill(`background:radial-gradient(ellipse 60% 42% at 14% 0,${rgba(P.d4, 0.3)},transparent 70%),radial-gradient(ellipse 50% 40% at 100% 100%,${rgba(P.d4, 0.2)},transparent 70%)`)
    // guirnaldas de cadenas colgando de arriba
    const sw = (x0, x1, dip, d) => `<g class="hw-fl" style="animation:sk-bob ${5 + d}s ease-in-out ${-d}s infinite">${chainQ(P, [x0, 6], [(x0 + x1) / 2, dip], [x1, 6], 22, 1)}</g>`
    bg += K.box('0 0 600 120', sw(-10, 260, 130, 0) + sw(240, 610, 118, 1.5), { w: 'width:100%', t: '0', l: '0', style: 'height:auto;aspect-ratio:600/120;opacity:.95;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6))' })
    // murciélagos
    bg += K.parts(5, { kind: 'float', seed: 9, x0: 20, x1: 95, y0: 6, y1: 40, html: (i) => batS(dk(P.d1, 0.55), 26 + (i % 3) * 8), size: [30, 44], dur: [6, 10], dx: [-50, 50], o: 0.9 })
    // calavera esquina inferior derecha
    const sk = `<defs><linearGradient id="sg" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${P.d3}"/><stop offset="1" stop-color="${dk(P.d3, 0.35)}"/></linearGradient></defs><path d="M0 -24C16 -24 25 -13 25 -1C25 8 21 13 18 17V25C18 28 16 29 14 29H-14C-16 29 -18 28 -18 25V17C-21 13 -25 8 -25 -1C-25 -13 -16 -24 0 -24Z" fill="url(#sg)" stroke="#08060a" stroke-width="2.4"/><path d="M-16 -4C-16 -11 -10 -14 -6 -11C-3 -9 -3 -1 -7 3C-11 6 -16 4 -16 -4ZM16 -4C16 -11 10 -14 6 -11C3 -9 3 -1 7 3C11 6 16 4 16 -4Z" fill="#0a0709"/><ellipse cx="-9" cy="-4" rx="2.8" ry="3.4" fill="${P.d4}" style="animation:sk-pulse 2.6s infinite"/><ellipse cx="9" cy="-4" rx="2.8" ry="3.4" fill="${P.d4}" style="animation:sk-pulse 2.6s -.4s infinite"/><path d="M0 4L-3.4 11H3.4Z" fill="#0a0709"/><path d="M-12 20V27M-6 19V28M0 19V28M6 19V28M12 20V27" stroke="#0a0709" stroke-width="1.8" stroke-linecap="round"/>`
    bg += K.box('-30 -30 60 60', sk, { w: fl(130, 0.5), b: '-8px', r: '4%', cls: 'hide-sm', style: `transform:rotate(-10deg);filter:drop-shadow(0 0 14px ${rgba(P.d4, 0.5)})` })
    bg += K.parts(8, { kind: 'twinkle', seed: 3, html: (i) => spark(i % 2 ? '#fff' : P.d4), size: [8, 15], dur: [3, 6], y0: 8, y1: 96 })
    bg += K.fill('background:linear-gradient(180deg,rgba(0,0,0,.5),transparent 70px)') + K.grain(0.08)
    return { bg, fg: K.frame({ w: 2.2, grad: `linear-gradient(160deg,${rgba(P.d1, 0.9)},${rgba(P.d1, 0.2)} 40%,${rgba(P.d4, 0.5)})`, glow: rgba(P.d4, 0.3) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.4), 0.8), '--sk-line': rgba(P.d1, 0.4) } }
  }, HIDE('cripta-de-hueso')),

  // ─────────── ALTAR DE PLATA (cruces)
  C('altar-de-plata', 'Altar de plata', 'raro', 1500, 'cruces', CZ, (K, P) => {
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.06)},${P.d2} 55%,#000)`)
    bg += K.pattern(56, 70, `<g transform="translate(28 35) scale(.34)">${crossP(rgba(P.d1, 0.12), 2)}</g>`, { style: fade('#000 0,#000 30%,rgba(0,0,0,.3) 100%') })
    bg += K.fill(`background:radial-gradient(ellipse 60% 40% at 0 40%,${rgba(P.d3, 0.16)},transparent 70%),radial-gradient(ellipse 40% 30% at 100% 90%,rgba(255,255,255,.07),transparent 70%)`)
    // cruz gótica grande a la izquierda, invertida abajo a la derecha
    const mm = K.S.lin([[0, '#fff'], [0.35, P.d1], [0.7, dk(P.d1, 0.5)], [1, P.d1]], 0, 0, 1, 1)
    const big = `<g>${crossP(mm, 2.4)}<path d="M0 -26V38M-22 0H22" stroke="#000" stroke-opacity=".5" stroke-width="2.4"/><circle r="3.4" fill="${P.d4}" stroke="#000"/></g>`
    bg += K.box('-40 -42 80 92', big, { w: fl(200, 0.5), t: '34%', r: '5%', cls: 'hide-sm', style: `opacity:.3;filter:drop-shadow(0 0 14px ${rgba(P.d3, 0.5)});animation:sk-bob 7s ease-in-out infinite` })
    bg += K.box('-40 -42 80 92', big, { w: fl(86, 0.5), b: '14px', r: '3%', cls: 'hide-sm', rot: 180, style: `opacity:.9;filter:drop-shadow(10px 8px 10px rgba(0,0,0,.7))` })
    bg += K.fill(`background:radial-gradient(ellipse 80% 14% at 50% 100%,${rgba(P.d3, 0.18)},transparent 70%);animation:sk-pulse 6s ease-in-out infinite`)
    bg += K.parts(7, { kind: 'rise', seed: 4, html: dotp(rgba(P.d3, 0.7), 5), size: [2, 4], dur: [12, 22], dx: [-16, 16], o: 0.6 })
    bg += K.grain(0.1)
    return { bg, radius: '20px', fg: `<div class="sk-b" style="inset:0;border-radius:inherit;box-shadow:inset 0 0 0 7px #000,inset 0 0 0 9px ${P.d3},inset 0 0 0 12px #000,inset 0 0 22px rgba(255,255,255,.08)"></div>`, vars: { '--sk-panel': rgba('#000', 0.74), '--sk-line': rgba(P.d1, 0.35) }, pad: 'clamp(26px,4.4cqw,42px)' }
  }, HIDE('altar-de-plata')),

  // ─────────── NOCHE DE CALABAZAS
  C('noche-de-calabazas', 'Noche de calabazas', 'raro', 1700, 'calabaza', CB, (K, P) => {
    const leaf = `<g fill="${P.d1}"><path d="M20 4C28 8 34 18 28 28C25 22 22 20 18 20C14 20 11 22 8 28C2 18 8 8 16 4L18 12Z"/><path d="M20 36C14 42 8 52 14 60C17 54 20 52 24 52C28 52 31 54 34 60C40 50 34 42 26 38L24 46Z" opacity=".85"/><circle cx="20" cy="30" r="2.2"/><circle cx="20" cy="46" r="2.2"/></g>`
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.08)},${P.d2} 55%,${dk(P.d2, 0.3)})`)
    bg += K.pattern(40, 64, leaf.replace(/fill="[^"]+"/, `fill="${rgba(P.d1, 0.2)}"`), { style: fade('#000 0,#000 18%,rgba(0,0,0,.35) 100%') })
    bg += K.fill(`background:radial-gradient(ellipse 70% 50% at 50% 0,${rgba(P.d1, 0.2)},transparent 70%),radial-gradient(ellipse 80% 30% at 50% 100%,${rgba(P.d1, 0.22)},transparent 70%)`)
    // telaraña esquina superior derecha
    let web = '', O = [200, 0]
    for (let i = 0; i < 7; i++) { const [x, y] = pol(O[0], O[1], 190, 90 + i * 15); web += `<path d="M${O[0]} ${O[1]}L${f(x)} ${f(y)}" stroke="#fff" stroke-width="1" opacity=".75"/>` }
    for (let k = 1; k <= 7; k++) { let d = ''; for (let i = 0; i < 7; i++) { const [x, y] = pol(O[0], O[1], k * 26, 90 + i * 15); d += (i ? 'L' : 'M') + `${f(x)} ${f(y)}` } web += `<path d="${d}" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>` }
    bg += K.box('0 0 200 190', web, { w: fl(210, 0.55), t: '0', r: '0', style: 'opacity:.9' })
    bg += K.box('-8 -2 16 70', `<path d="M0 0V50" stroke="#fff" stroke-width="1" opacity=".8"/><g transform="translate(0 54)"><ellipse rx="5" ry="6" fill="#0a0809"/><circle cy="-6" r="3.4" fill="#0a0809"/><path d="M-4 -2L-12 -8M-4 1L-13 2M-4 4L-12 11M4 -2L12 -8M4 1L13 2M4 4L12 11" stroke="#0a0809" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="-1.4" cy="-6.4" r=".9" fill="${P.d4}"/><circle cx="1.4" cy="-6.4" r=".9" fill="${P.d4}"/></g>`, { w: 'width:clamp(18px,3cqw,28px)', t: '40px', r: '16%', style: 'transform-origin:50% 0;animation:sk-sway 4s ease-in-out infinite' })
    // verja inferior
    const pick = (x) => `<path d="M${x - 3.6} 60V16L${x} 4L${x + 3.6} 16V60Z" fill="#2a2420" stroke="#080605" stroke-width="1.2"/><path d="M${x - 1.2} 18V58" stroke="#8a7a68" stroke-opacity=".5"/>`
    bg += K.tile(`<rect y="22" width="20" height="5" fill="#2a2420" stroke="#080605"/><rect y="44" width="20" height="5" fill="#2a2420" stroke="#080605"/>${pick(10)}`, 20, 64, { x: true, b: '0', l: '0', r: '0', h: '64px', style: 'opacity:.95;filter:drop-shadow(0 -3px 8px rgba(0,0,0,.6))' })
    // calabazas brillando
    const pk = (r) => `<ellipse rx="${r}" ry="${r * 0.86}" fill="${P.d1}" stroke="#120c08" stroke-width="${f(r * 0.14)}"/><path d="M${-r * 0.5} ${-r * 0.8}Q${-r * 0.85} 0 ${-r * 0.5} ${r * 0.8}M${r * 0.5} ${-r * 0.8}Q${r * 0.85} 0 ${r * 0.5} ${r * 0.8}" stroke="#120c08" stroke-opacity=".4" fill="none"/><path d="M-1 ${-r * 0.86}Q0 ${-r * 1.25} ${r * 0.34} ${-r * 1.2}" stroke="#2c5a1c" stroke-width="${f(r * 0.24)}" fill="none" stroke-linecap="round"/><g style="animation:sk-pulse 2.8s ease-in-out infinite"><path d="M${-r * 0.5} ${-r * 0.1}L${-r * 0.2} ${-r * 0.4}L${-r * 0.08} ${-r * 0.06}ZM${r * 0.5} ${-r * 0.1}L${r * 0.2} ${-r * 0.4}L${r * 0.08} ${-r * 0.06}ZM${-r * 0.5} ${r * 0.22}L${-r * 0.2} ${r * 0.36}L0 ${r * 0.28}L${r * 0.2} ${r * 0.36}L${r * 0.5} ${r * 0.22}L${r * 0.3} ${r * 0.56}L0 ${r * 0.46}L${-r * 0.3} ${r * 0.56}Z" fill="${P.d3}"/></g>`
    bg += K.box('-40 -40 80 80', pk(22), { w: fl(70, 0.55), b: '34px', l: '2.5%', cls: 'hide-sm', style: `filter:drop-shadow(0 0 16px ${rgba(P.d1, 0.7)})` })
    bg += K.box('-40 -40 80 80', pk(22), { w: fl(46, 0.55), b: '34px', r: '3%', cls: 'hide-sm', style: `filter:drop-shadow(0 0 12px ${rgba(P.d1, 0.7)})` })
    bg += K.parts(8, { kind: 'float', seed: 7, html: dotp(P.d1, 8), size: [2, 4], dur: [6, 11], o: 0.8, y0: 10, y1: 80 })
    bg += K.grain(0.07)
    const band = `<div class="sk-b" style="inset:0;border-radius:inherit;box-shadow:inset 0 0 0 5px #120c08,inset 0 0 0 7px ${P.d1},inset 0 0 0 9px #120c08"></div>`
    return { bg, radius: '22px', pb: '78px', fg: band, vars: { '--sk-panel': rgba(dk(P.d2, 0.3), 0.82), '--sk-line': rgba(P.d1, 0.45), '--sk-pb': 'clamp(76px,9cqw,84px)' } }
  }, HIDE('noche-de-calabazas')),

  // ─────────── REJA DE HIERRO (cuervo)
  C('reja-de-hierro', 'Reja de hierro', 'epico', 3000, 'cuervo', CV, (K, P) => {
    const metal = K.S.lin([[0, '#fff'], [0.3, P.d1], [0.65, dk(P.d1, 0.55)], [1, P.d1]], 0, 0, 1, 1)
    const scr = `<g fill="none" stroke="${P.d1}" stroke-width="2.2" stroke-linecap="round"><path d="M0 14C8 14 14 6 10 0C7 -4 2 -2 3 2C4 5 7 4 8 2"/><path d="M40 14C32 14 26 6 30 0C33 -4 38 -2 37 2C36 5 33 4 32 2"/><path d="M0 14H40" stroke-width="2.6"/><path d="M20 14V4" /><path d="M20 4C16 -2 18 -8 20 -12C22 -8 24 -2 20 4Z" fill="${P.d1}" stroke="#050507" stroke-width=".8"/></g>`
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d4, 0.14)},${P.d2} 50%,${dk(P.d2, 0.3)})`)
    bg += K.fill(`background:radial-gradient(ellipse 50% 40% at 80% 0,${rgba(P.d3, 0.22)},transparent 70%),radial-gradient(ellipse 70% 20% at 50% 100%,${rgba(P.d4, 0.2)},transparent 70%)`)
    bg += K.tile(scr, 40, 28, { x: true, t: '4px', l: '0', r: '0', h: '28px', style: 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.7))' })
    bg += K.tile(scr, 40, 28, { x: true, b: '4px', l: '0', r: '0', h: '28px', style: 'transform:scaleY(-1);filter:drop-shadow(0 -2px 3px rgba(0,0,0,.7))' })
    const side = `<rect x="2" width="4" height="40" fill="${P.d1}" opacity=".75"/><path d="M4 4C14 4 14 14 6 14M4 24C14 24 14 34 6 34" fill="none" stroke="${P.d1}" stroke-width="1.6" opacity=".8"/>`
    bg += K.tile(side, 20, 40, { x: false, y: true, t: '30px', b: '30px', l: '2px', w: '20px' }) + K.tile(side, 20, 40, { x: false, y: true, t: '30px', b: '30px', r: '2px', w: '20px', style: 'transform:scaleX(-1)' })
    // cuervo posado arriba a la derecha
    const rv = `<path d="M-30 -2C-24 -14 -8 -20 8 -16C16 -22 24 -20 30 -14L38 -10L30 -8C28 2 20 10 6 12L8 24L2 24L0 14C-14 14 -26 8 -30 -2Z" fill="#07070a" stroke="${P.d1}" stroke-width="1.2" stroke-opacity=".8"/><circle cx="26" cy="-12" r="1.4" fill="${P.d4}"/><path d="M-30 -2L-52 4L-34 6Z" fill="#07070a"/><path d="M-6 24V30M4 24V30" stroke="${P.d1}" stroke-width="2"/>`
    bg += K.box('-56 -26 96 62', rv, { w: fl(96, 0.55), t: '-2px', l: '44%', cls: 'hide-sm', style: 'animation:sk-bob 6s ease-in-out infinite' })
    bg += K.parts(5, { kind: 'float', seed: 14, x0: 5, x1: 90, y0: 10, y1: 50, html: (i) => batS('#07070a', 28 + (i % 2) * 8).replace(/<path /, '<path stroke="' + P.d1 + '" stroke-width=".6" '), size: [28, 40], dur: [8, 13], dx: [-80, 80], o: 0.95 })
    bg += K.parts(7, { kind: 'twinkle', seed: 5, html: (i) => spark(i % 2 ? '#fff' : P.d4), size: [8, 14], dur: [3, 6], y0: 8, y1: 94 })
    bg += K.grain(0.08)
    return { bg, radius: '14px', pt: 0, fg: `<div class="sk-fr" style="--fw:3px;--fg:${metal};filter:drop-shadow(0 0 6px ${rgba(P.d4, 0.35)})"></div>` + four(P.d3, 1.6), vars: { '--sk-panel': rgba(dk(P.d2, 0.4), 0.8), '--sk-line': rgba(P.d1, 0.4), '--sk-pt': '30px', '--sk-pb': 'clamp(48px,6cqw,56px)' } }
  }, HIDE('reja-de-hierro')),

  // ─────────── SALÓN BARROCO
  C('salon-barroco', 'Salón barroco', 'epico', 2800, 'barroco', BA, (K, P) => {
    const metal = K.S.linU([[0, '#fff'], [0.3, P.d1], [0.6, dk(P.d1, 0.6)], [0.82, P.d1], [1, P.d3]], 0, 0, 400, 400)
    const acan = `<g><path d="M20 28C6 24 0 10 10 -2C14 5 17 10 20 14C23 10 26 5 30 -2C40 10 34 24 20 28Z" fill="${metal}" stroke="#08080a" stroke-width="1.2"/><path d="M20 24C12 20 9 12 13 5M20 24C28 20 31 12 27 5M20 24V15" fill="none" stroke="#08080a" stroke-opacity=".6"/><path d="M4 26C-6 24 -6 12 2 10" fill="none" stroke="${metal}" stroke-width="2.6" stroke-linecap="round"/><path d="M36 26C46 24 46 12 38 10" fill="none" stroke="${metal}" stroke-width="2.6" stroke-linecap="round"/></g>`
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.1)},${P.d2} 55%,${dk(P.d2, 0.3)})`)
    // damasco gris
    bg += K.pattern(60, 80, `<g fill="${rgba(P.d1, 0.1)}"><path d="M30 6C42 16 44 34 30 44C16 34 18 16 30 6Z"/><path d="M30 44C38 54 44 66 30 76C16 66 22 54 30 44Z" opacity=".7"/><circle cx="0" cy="40" r="6"/><circle cx="60" cy="40" r="6"/></g><path d="M30 12V40" stroke="${rgba(P.d1, 0.12)}"/>`, { style: fade('#000 0,#000 35%,rgba(0,0,0,.3) 100%') })
    bg += K.fill(`background:radial-gradient(ellipse 60% 40% at 50% 0,${rgba(P.d3, 0.2)},transparent 70%)`)
    bg += K.tile(acan, 40, 34, { x: true, t: '6px', l: '0', r: '0', h: '34px', style: 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))' }) + K.tile(acan, 40, 34, { x: true, b: '6px', l: '0', r: '0', h: '34px', style: 'transform:scaleY(-1);filter:drop-shadow(0 -2px 3px rgba(0,0,0,.6))' })
    // espadas cruzadas + rosas (esquina inferior derecha / izquierda)
    const sw = (rt) => `<g transform="rotate(${rt})"><path d="M-2.4 -4L0 -78L2.4 -4Z" fill="${P.d3}" stroke="#08080a"/><path d="M-12 -2Q0 -9 12 -2" fill="none" stroke="${P.d1}" stroke-width="2.4"/><rect x="-2" y="2" width="4" height="16" rx="2" fill="#08080a" stroke="${P.d1}"/><circle cy="21" r="3.6" fill="${P.d1}"/></g>`
    bg += K.box('-60 -90 120 130', sw(48) + sw(-42), { w: fl(140, 0.5), b: '30px', r: '2%', cls: 'hide-sm', style: 'opacity:.95;filter:drop-shadow(0 4px 8px rgba(0,0,0,.6))' })
    bg += K.box('-40 -40 80 80', rose2(K, P, 0, 0, 24) + rose2(K, P, 26, 18, 16) + rose2(K, P, -22, 20, 14), { w: fl(110, 0.5), b: '26px', r: '16%', cls: 'hide-sm', style: 'animation:sk-bob 6s ease-in-out infinite' })
    bg += K.parts(8, { kind: 'fall', seed: 11, rot: 400, dx: [-40, 40], dur: [12, 20], size: [8, 13], o: 0.8, html: `<svg viewBox="-8 -8 16 16" width="100%" height="100%"><path d="M0 7C-6 4-7-4 0-7C7-4 6 4 0 7Z" fill="${P.d3}"/></svg>` })
    bg += K.grain(0.1)
    return { bg, radius: '18px', fg: `<div class="sk-fr" style="--fw:2.6px;--fg:${metal}"></div>` + four(P.d3, 1.8), vars: { '--sk-panel': rgba(dk(P.d2, 0.35), 0.82), '--sk-line': rgba(P.d1, 0.4), '--sk-pt': '24px', '--sk-pb': 'clamp(60px,7cqw,68px)' } }
  }, HIDE('salon-barroco')),

  // ─────────── CREEPY 1: BOSQUE SIN ROSTRO
  C('bosque-sin-rostro', 'Bosque sin rostro', 'epico', 2900, 'creepy', CPA, (K, P) => {
    const R = rng(9)
    const forest = (c, n, hmin, hmax, wmin = 3) => { let o = ''; for (let i = 0; i < n; i++) { const x = (i / n) * 1000 + R() * 30, h = hmin + R() * (hmax - hmin), w = wmin + R() * 5; o += `<path d="M${f(x)} 400L${f(x + w * 0.2)} ${f(400 - h)}L${f(x + w)} 400Z" fill="${c}"/>`; if (R() < 0.5) o += `<path d="M${f(x + w * 0.3)} ${f(400 - h * 0.6)}L${f(x + w * 0.3 + 14 + R() * 18)} ${f(400 - h * 0.78)}" stroke="${c}" stroke-width="1.6"/>` } return o }
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.42)} 0,${mix(P.d2, P.d1, 0.2)} 45%,${P.d2})`)
    bg += K.glow('78%', '70px', 300, P.d3, 0.3)
    bg += K.svg('0 0 1000 400', forest(mix(P.d2, P.d1, 0.1), 40, 220, 360), { pos: 'xMidYMax slice', style: 'inset:auto;left:0;bottom:0;width:100%;height:100%;opacity:.9' })
    bg += K.fill(`background:radial-gradient(ellipse 80% 16% at 30% 70%,${rgba(P.d1, 0.18)},transparent 70%),radial-gradient(ellipse 70% 14% at 75% 86%,${rgba(P.d1, 0.16)},transparent 70%);animation:sk-drift 16s ease-in-out infinite`)
    bg += K.svg('0 0 1000 400', forest('#030504', 16, 260, 400, 7), { pos: 'xMidYMax slice', style: 'inset:auto;left:0;bottom:0;width:100%;height:100%;filter:blur(.6px)' })
    bg += K.fill(`background:radial-gradient(ellipse 90% 14% at 50% 96%,${rgba(P.d1, 0.28)},transparent 70%);animation:sk-drift 12s ease-in-out -4s infinite`)
    // estática parpadeante
    bg += K.grain(0.12, { blend: 'screen', freq: 1.4 }).replace('style="', 'style="animation:sk-blink 1.4s steps(1) infinite;')
    bg += K.fill(`background:repeating-linear-gradient(180deg,rgba(0,0,0,.2) 0 1px,transparent 1px 4px)`)
    bg += K.fill(`background:linear-gradient(180deg,transparent,${rgba(P.d3, 0.07)} 50%,transparent);height:60px;animation:sk-scan 7s linear infinite`)
    bg += K.vignette('#000', 0.7, 40)
    return { bg, radius: '8px', fg: `<div class="sk-b" style="inset:8px;border:1px dashed ${rgba(P.d1, 0.35)};border-radius:4px"></div>` + K.frame({ w: 1.4, grad: `linear-gradient(160deg,${rgba(P.d1, 0.6)},${rgba(P.d1, 0.1)} 50%,${rgba(P.d4, 0.5)})` }), vars: { '--sk-panel': rgba('#000', 0.74), '--sk-line': rgba(P.d1, 0.3) } }
  }),

  // ─────────── CREEPY 2: DUERME.
  C('duerme', 'Duerme.', 'epico', 2900, 'creepy', CPB, (K, P) => {
    const R = rng(21)
    let bg = K.fill(`background:radial-gradient(ellipse 60% 55% at 85% 0,${rgba(P.d4, 0.22)},transparent 70%),${P.d2}`)
    bg += K.grain(0.2, { blend: 'screen', freq: 0.9 })
    // arañazos blancos por toda la superficie, más fuertes en las esquinas
    let sc = ''
    for (let i = 0; i < 18; i++) { const x = R() * 1000, y = R() * 400, l = 20 + R() * 70, a = (-70 + R() * 20) * 0.0175; sc += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * -l)}" stroke="${P.d1}" stroke-opacity="${(0.1 + R() * 0.25).toFixed(2)}" stroke-width="${(0.8 + R() * 1.4).toFixed(1)}" stroke-linecap="round"/>` }
    bg += K.svg('0 0 1000 400', sc, { pos: 'xMidYMid slice' })
    // garras rojas
    bg += K.box('0 0 90 90', `<g stroke="${P.d4}" stroke-linecap="round" fill="none"><path d="M10 6L46 70" stroke-width="5"/><path d="M26 2L62 66" stroke-width="4"/><path d="M42 0L76 58" stroke-width="3"/></g>`, { w: fl(110, 0.55), b: '70px', r: '5%', cls: 'hide-sm', style: 'opacity:.85' })
    // luna creciente
    bg += K.box('-30 -30 60 60', `<path d="M0 -26A26 26 0 1 0 22 14A20 20 0 1 1 0 -26Z" fill="${P.d3}"/>`, { w: fl(70, 0.6), t: '70px', r: '16%', style: `filter:drop-shadow(0 0 16px ${rgba(P.d3, 0.6)})` })
    // foco colgante que se balancea
    bg += `<div class="sk-b" style="left:12%;top:0;width:2px;height:clamp(40px,7cqw,64px);background:${P.d1};transform-origin:50% 0;animation:sk-sway 4s ease-in-out infinite"><i style="position:absolute;left:50%;bottom:-8px;width:14px;height:14px;translate:-50% 0;border-radius:50%;background:#fff6d0;box-shadow:0 0 22px 8px rgba(255,240,180,.55);animation:sk-flick 3s infinite"></i></div>`
    // goteo de tinta desde arriba (negro) y gotas rojas
    let dr = `<rect width="260" height="8" fill="#000"/>`
    for (let i = 0; i < 7; i++) { const x = 12 + i * 36 + R() * 14, h = 18 + R() * 62, w = 3 + R() * 3; dr += `<path d="M${f(x - w)} 0V${f(h)}Q${f(x - w)} ${f(h + w * 1.5)} ${f(x)} ${f(h + w * 1.6)}Q${f(x + w)} ${f(h + w * 1.5)} ${f(x + w)} ${f(h)}V0Z" fill="#000"/>` }
    bg += K.tile(dr, 260, 100, { x: true, t: '0', l: '0', r: '0', h: '100px', style: `${fade('#000 0,#000 100%')}` })
    bg += K.parts(4, { kind: 'fall', seed: 8, dx: [-4, 4], dur: [5, 9], size: [5, 9], o: 0.9, html: `<svg viewBox="0 0 20 28" width="100%" height="100%"><path d="M10 1C10 1 2 12 2 18A8 8 0 0 0 18 18C18 12 10 1 10 1Z" fill="${P.d4}"/></svg>` })
    bg += K.vignette('#000', 0.6, 45)
    // borde de tinta ondulado
    return { bg, radius: '12px', fg: `<div class="sk-b" style="inset:0;border-radius:inherit;box-shadow:inset 0 0 0 5px #000,inset 0 0 0 7px ${P.d1},inset 0 0 0 11px #000"></div>`, vars: { '--sk-panel': rgba('#000', 0.8), '--sk-line': rgba(P.d1, 0.35) }, pad: 'clamp(26px,4.4cqw,42px)' }
  }, HIDE('duerme')),

  // ─────────── CREEPY 3: ARCHIVO CORRUPTO
  C('archivo-corrupto', 'Archivo corrupto', 'epico', 2800, 'creepy', CPC, (K, P) => {
    const R = rng(33)
    let bg = K.fill(`background:${P.d2}`)
    // macrobloques de color (duotono) – imagen "corrupta"
    let bl = ''
    for (let i = 0; i < 46; i++) { const w = 20 + R() * 120, h = 10 + R() * 60; bl += `<rect x="${f(R() * 1000)}" y="${f(R() * 400)}" width="${f(w)}" height="${f(h)}" fill="${R() < 0.6 ? P.d1 : P.d3}" opacity="${(0.04 + R() * 0.14).toFixed(2)}"/>` }
    bg += K.svg('0 0 1000 400', bl, { pos: 'xMidYMid slice' })
    // franjas desplazadas animadas
    for (let i = 0; i < 5; i++) bg += `<div class="sk-b" style="left:0;right:0;top:${10 + i * 19}%;height:${3 + (i % 3) * 3}%;background:${rgba(i % 2 ? P.d1 : P.d3, 0.18)};animation:sk-slide ${3 + i}s steps(1) ${-i}s infinite;mix-blend-mode:screen"></div>`
    bg += K.fill(`background:repeating-linear-gradient(180deg,rgba(0,0,0,.35) 0 1px,transparent 1px 3px)`)
    bg += K.grain(0.3, { blend: 'screen', freq: 1.2 }).replace('style="', 'style="animation:sk-blink 1.1s steps(1) infinite;')
    // ventana de visor de imágenes
    bg += `<div class="sk-b" style="left:0;right:0;top:0;height:30px;background:${rgba(P.d1, 0.22)};border-bottom:1px solid ${rgba(P.d1, 0.6)};display:flex;align-items:center;padding:0 14px 0 clamp(120px,22cqw,200px);font:600 11px/1 ui-monospace,monospace;color:${P.d3};letter-spacing:.06em;gap:10px"><span style="width:8px;height:8px;background:${P.d1}"></span><span style="width:8px;height:8px;background:${P.d3};opacity:.6"></span>archivo_13.jpg — dañado<span style="margin-left:auto;opacity:.7">✕</span></div>`
    bg += K.parts(8, { kind: 'twinkle', seed: 6, html: `<b style="display:block;width:100%;height:100%;background:${P.d1}"></b>`, size: [4, 12], dur: [1.2, 3], y0: 12, y1: 96 })
    bg += K.vignette('#000', 0.6, 50)
    return { bg, radius: '4px', pt: 0, fg: `<div class="sk-b" style="inset:0;border:2px solid ${P.d1};box-shadow:inset 0 0 0 1px ${rgba(P.d3, 0.4)};animation:sk-flick 4s infinite"></div>`, vars: { '--sk-panel': rgba('#000', 0.78), '--sk-line': rgba(P.d1, 0.55), '--sk-pt': '38px' } }
  }),

  // ─────────── CREEPY 4: MUÑECA DE CENIZA
  C('muneca-de-ceniza', 'Muñeca de ceniza', 'raro', 1500, 'creepy', CPD, (K, P) => {
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d4, 0.1)},${P.d2} 55%,#000)`)
    bg += K.fill(`background:radial-gradient(ellipse 50% 40% at 85% 12%,${rgba(P.d1, 0.14)},transparent 70%)`)
    // anillo punteado gigante girando (marca de agua)
    bg += K.box('-100 -100 200 200', `<g style="transform-origin:0 0;transform-box:view-box;animation:sk-rot 90s linear infinite"><circle r="92" fill="none" stroke="${P.d1}" stroke-width="7" stroke-dasharray="14 9.2"/></g><circle r="78" fill="none" stroke="${P.d4}" stroke-opacity=".6" stroke-width="1.4"/>`, { w: fl(300, 0.5), t: '-60px', r: '-70px', style: 'opacity:.4' })
    // encaje festoneado superior
    const lace = `<path d="M0 0H28V4A14 14 0 0 1 0 4Z" fill="${P.d2}" stroke="${P.d1}" stroke-opacity=".7"/><circle cx="14" cy="10" r="1.6" fill="${P.d1}" opacity=".8"/>`
    bg += K.tile(lace, 28, 22, { x: true, t: '0', l: '0', r: '0', h: '22px' })
    bg += K.tile(lace, 28, 22, { x: true, b: '0', l: '0', r: '0', h: '22px', style: 'transform:scaleY(-1)' })
    // lazo
    bg += K.box('-30 -20 60 50', `<path d="M0 0C-12 -12 -26 -6 -20 6C-14 14 -4 8 0 0C4 8 14 14 20 6C26 -6 12 -12 0 0Z" fill="#0a0a0c" stroke="${P.d1}" stroke-width="1.8"/><path d="M-3 4L-12 22L-6 20L-3 26M3 4L12 22L6 20L3 26" fill="#0a0a0c" stroke="${P.d1}" stroke-width="1.4"/><circle r="4" fill="${P.d4}" stroke="${P.d1}"/>`, { w: fl(70, 0.6), b: '34px', r: '5%', cls: 'hide-sm', style: 'transform:rotate(-14deg);animation:sk-bob 5s ease-in-out infinite' })
    bg += K.parts(14, { kind: 'fall', seed: 12, dx: [-10, 24], dur: [9, 16], size: [2, 5], o: 0.8, html: (i) => dotp(i % 3 ? P.d4 : P.d3, 2) })
    bg += K.grain(0.12) + K.vignette('#000', 0.6, 45)
    return { bg, radius: '12px', pt: 0, fg: `<div class="sk-b" style="inset:0;border-radius:inherit;border:3px dashed ${rgba(P.d1, 0.95)};outline:1px solid #000;outline-offset:-5px;opacity:.95"></div>`, vars: { '--sk-panel': rgba('#000', 0.8), '--sk-line': rgba(P.d1, 0.3), '--sk-pt': '28px', '--sk-pb': 'clamp(46px,6cqw,56px)' } }
  }, HIDE('muneca-de-ceniza')),

  // ─────────── VAMPIRO AZUL: fan club vampírico
  C('fan-club-vampirico', 'Fan club vampírico', 'legendario', 6200, 'vampiro', VP, (K, P) => {
    const R = rng(66)
    const trunks = (c, n, op) => { let o = ''; for (let i = 0; i < n; i++) { const x = R() * 1000, w = 10 + R() * 26; o += `<rect x="${f(x)}" y="0" width="${f(w)}" height="420" fill="${c}" opacity="${(op * (0.5 + R() * 0.5)).toFixed(2)}"/>` } return o }
    let bg = K.fill(`background:linear-gradient(180deg,${mix(P.d2, P.d1, 0.16)} 0,${P.d2} 60%,${dk(P.d2, 0.35)})`)
    bg += K.svg('0 0 1000 420', trunks(mix(P.d2, P.d1, 0.32), 22, 0.5), { pos: 'xMidYMid slice', style: 'filter:blur(5px)' })
    bg += K.svg('0 0 1000 420', trunks(dk(P.d2, 0.4), 12, 0.85), { pos: 'xMidYMid slice', style: 'filter:blur(2px);opacity:.8' })
    bg += K.fill(`background:radial-gradient(ellipse 70% 50% at 30% 20%,${rgba(P.d1, 0.34)},transparent 70%),radial-gradient(ellipse 60% 40% at 90% 80%,${rgba(P.d4, 0.28)},transparent 70%)`)
    bg += K.fill(`background:radial-gradient(ellipse 80% 16% at 30% 60%,${rgba(P.d3, 0.16)},transparent 70%),radial-gradient(ellipse 70% 14% at 80% 30%,${rgba(P.d3, 0.14)},transparent 70%);animation:sk-drift 18s ease-in-out infinite`)
    // órbitas elípticas finas girando (sobre todo el perfil)
    bg += K.box('-200 -120 400 240', `<g fill="none" stroke="${P.d3}" stroke-opacity=".6" stroke-width="1.2"><ellipse rx="190" ry="58" transform="rotate(-14)" style="transform-origin:0 0;transform-box:view-box;animation:sk-rot 90s linear infinite"/><ellipse rx="150" ry="40" transform="rotate(20)" style="transform-origin:0 0;transform-box:view-box;animation:sk-rot 70s linear infinite reverse"/></g>`, { w: fl(560, 0.6), t: '10%', l: '10%', style: 'opacity:.7' })
    // estrellas huecas con brillo
    const star = (R_) => `<path d="${[...Array(10)].map((_, i) => { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? R_ * 0.42 : R_; return (i ? 'L' : 'M') + f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr) }).join('')}Z" fill="none" stroke="${P.d3}" stroke-width="3.2" stroke-linejoin="round"/>`
    bg += K.box('-60 -60 120 120', star(54), { w: fl(150, 0.5), b: '30px', r: '2%', cls: 'hide-sm', style: `filter:drop-shadow(0 0 8px ${P.d1});animation:sk-rot 60s linear infinite;opacity:.85` })
    bg += K.box('-40 -40 80 80', star(34), { w: fl(90, 0.5), b: '130px', r: '14%', cls: 'hide-sm', style: `filter:drop-shadow(0 0 6px ${P.d1});animation:sk-rot 44s linear infinite reverse;opacity:.75` })
    bg += K.box('-40 -40 80 80', star(30), { w: fl(70, 0.5), t: '90px', r: '30%', cls: 'hide-sm', style: `filter:drop-shadow(0 0 6px ${P.d1});opacity:.6;animation:sk-rot 52s linear infinite` })
    // discos de vinilo girando
    const vinyl = `<circle r="44" fill="#08121a" stroke="${P.d3}" stroke-opacity=".6" stroke-width="1.4"/><circle r="36" fill="none" stroke="${P.d1}" stroke-opacity=".25"/><circle r="28" fill="none" stroke="${P.d1}" stroke-opacity=".25"/><circle r="15" fill="${P.d4}"/><circle r="3" fill="#000"/><path d="M-30 -14A34 34 0 0 1 -10 -32" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>`
    bg += K.box('-46 -46 92 92', `<g style="transform-origin:0 0;transform-box:view-box;animation:sk-rot 8s linear infinite">${vinyl}</g>`, { w: fl(64, 0.5), b: '24px', r: '26%', cls: 'hide-sm' })
    bg += K.parts(12, { kind: 'twinkle', seed: 4, html: dotp('#fff', 5), size: [2, 4], dur: [3, 7], y0: 4, y1: 96 })
    bg += K.grain(0.07) + K.vignette('#000', 0.45, 55)
    return { bg, radius: '10px', fg: K.frame({ w: 1.6, grad: `linear-gradient(160deg,${rgba(P.d1, 0.95)},${rgba(P.d1, 0.2)} 40%,${rgba(P.d4, 0.4)} 70%,${rgba(P.d1, 0.8)})`, spin: 16, beam: P.d3, glow: rgba(P.d1, 0.4) }), vars: { '--sk-panel': rgba(dk(P.d2, 0.05), 0.55), '--sk-panel-2': rgba(dk(P.d2, 0.05), 0.45), '--sk-line': rgba(P.d1, 0.5), '--sk-chip': rgba(P.d1, 0.14) } }
  }, HIDE('fan-club-vampirico')),
]
function rose2(K, P, x, y, r) { const o = K.S.radB([[0, '#fff'], [0.6, P.d1], [1, dk(P.d1, 0.6)]], 0.5, 0.35, 0.75); return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${o}" stroke="#08080a" stroke-width="1.2"/><path d="M0 ${-r * 0.1}C${r * 0.5} ${-r * 0.5} ${r * 0.6} ${r * 0.1} 0 ${r * 0.2}C${-r * 0.5} ${r * 0.1} ${-r * 0.4} ${-r * 0.5} ${r * 0.1} ${-r * 0.6}" fill="none" stroke="#08080a" stroke-opacity=".6"/><path d="M${-r * 0.7} ${-r * 0.1}C${-r * 0.6} ${-r * 0.8} ${r * 0.6} ${-r * 0.8} ${r * 0.7} ${-r * 0.1}M${-r * 0.55} ${r * 0.4}C${-r * 0.2} ${r * 0.9} ${r * 0.5} ${r * 0.7} ${r * 0.6} ${r * 0.3}" fill="none" stroke="#08080a" stroke-opacity=".55"/><circle r="${r * 0.3}" fill="none" stroke="#08080a" stroke-opacity=".5"/></g>` }
