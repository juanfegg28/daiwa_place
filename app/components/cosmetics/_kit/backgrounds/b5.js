// @ts-nocheck
// FONDOS «Lestat de Lioncourt» (exclusivos de @renshsh): 6 fondos MÍTICOS animados, escenas de película.
// Eclipse del príncipe · Catedral de velas · Salón de la araña de cristal · Calle de Nueva Orleans, 1794 · Gran teatro de los vampiros · Luna de sangre
// Arte original hecho con código. Las clases ls-*/ls2-* vienen de LS_CSS/LS2_CSS; las lsb-* son propias.
import { KF } from '../core/kit.js'
import { BW, BHt, full, vg, bl, vig, stars, f, rng, pol } from './lib.js'
import { LS_PAL, LS_CSS, candelabra, taper, flame, goldG, fleur, goblet, rosePetal } from '../avatar/lsArt.js'
import { LS2_CSS, sunRays, bloom, bat } from '../avatar/lsArt2.js'

const CSS =
  `.lsb-g{transform-box:fill-box;transform-origin:50% 50%;animation:lsb-g 2.6s ease-in-out infinite alternate}${KF('lsb-g', 'from{opacity:.55;transform:scale(.92)}to{opacity:1;transform:scale(1.08)}')}` +
  `.lsb-t{animation:lsb-t 3.2s ease-in-out infinite}${KF('lsb-t', '0%,100%{opacity:.25}50%{opacity:1}')}` +
  `.lsb-p{animation:lsb-p 12s linear infinite}${KF('lsb-p', '0%{transform:translate(0,-20px) rotate(0);opacity:0}10%{opacity:.95}90%{opacity:.8}100%{transform:translate(30px,330px) rotate(300deg);opacity:0}')}` +
  `.lsb-d{animation:lsb-d 24s ease-in-out infinite alternate}${KF('lsb-d', 'from{transform:translateX(-26px)}to{transform:translateX(26px)}')}` +
  `.lsb-b{animation:lsb-b 20s linear infinite}${KF('lsb-b', '0%{transform:translate(-60px,30px)}50%{transform:translate(230px,-14px)}100%{transform:translate(560px,26px)}')}` +
  `.lsb-r{transform-box:fill-box;transform-origin:50% 50%;animation:lsb-r 140s linear infinite}${KF('lsb-r', 'to{transform:rotate(360deg)}')}` +
  `.lsb-rr{animation-direction:reverse;animation-duration:200s}` +
  `.lsb-sw{transform-box:view-box;transform-origin:var(--ox,240px) 0;animation:lsb-sw 9s ease-in-out infinite alternate}${KF('lsb-sw', 'from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}')}` +
  `.lsb-m{animation:lsb-m 6s ease-in-out infinite}${KF('lsb-m', '0%,100%{opacity:.7}50%{opacity:1}')}`

const R_ = (a) => a
// gradiente vertical simple
const lg = (S, a, b, y0 = 0, y1 = BHt) => S.linU([[0, a], [1, b]], 0, y0, 0, y1)
const dotf = (S, P, x, y, r, d = 0) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3.4)}" fill="${S.radB([[0, P.d3, 0.9], [0.4, P.d1, 0.35], [1, P.d1, 0]])}" class="lsb-g" style="animation-delay:${-d}s"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff6d8"/>`
const ray = (S, c, x1, y1, x2, y2, w1, w2, op = 0.2) => `<path d="M${f(x1 - w1)} ${f(y1)}L${f(x1 + w1)} ${f(y1)}L${f(x2 + w2)} ${f(y2)}L${f(x2 - w2)} ${f(y2)}Z" fill="${S.linU([[0, c, op], [1, c, 0]], 0, y1, 0, y2)}"/>`
const fly = (c, edge, s, y, d, dur) => `<g class="lsb-b" style="animation-delay:${-d}s;animation-duration:${dur}s"><g transform="translate(0 ${y})">${bat(c, s, d, edge)}</g></g>`

// ───────── 1 · Eclipse del príncipe: el eclipse dorado gigante sobre arcadas góticas
export const eclipseFondo = {
  slug: 'eclipse-del-principe-fondo', name: 'Eclipse del príncipe', rarity: 'mitico', price: 0, coll: 'lestat', custom: true, palettes: LS_PAL,
  css: LS_CSS + LS2_CSS + CSS,
  art: (S, P) => {
    const R = rng(5), cx = 240, cy = 120, k = 0.92
    let o = vg(S, [[0, '#020102'], [0.6, P.dk(P.d2, 0.1)], [1, P.mix(P.d2, P.d4, 0.35)]]) + stars(S, P, 44, 2, 190)
    o += bl(S, cx, cy, 250, P.d1, 0.34) + bl(S, cx, cy, 140, P.d3, 0.3)
    const ang = (cls, n, long, w, seed, off) => `<g class="lsb-r ${cls}" ><g>${sunRays(S, P, { n, r0: 104, long, short: long * 0.5, w, seed, off })}</g></g>`
    o += `<g transform="translate(${cx - 144 * k} ${cy - 144 * k}) scale(${k})">${ang('', 48, 150, 2.1, 7, 0)}${ang('lsb-rr', 30, 96, 3.2, 3, 6)}` +
      `<circle cx="144" cy="144" r="102" fill="#020102"/><circle cx="144" cy="144" r="102" fill="none" stroke="${S.lin([[0, P.lt(P.d3, 0.55)], [0.5, P.d1], [1, P.lt(P.d3, 0.3)]], 0, 0, 1, 1)}" stroke-width="3.4"/><circle cx="144" cy="144" r="95" fill="none" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".8" stroke-dasharray="1 4.4"/>` +
      `<path d="M62 92A100 100 0 0 1 188 46" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/><circle cx="196" cy="52" r="14" fill="${S.radB([[0, '#fff', 1], [0.3, P.d3, 0.7], [1, P.d1, 0]])}" class="lsb-g"/></g>`
    // destello en el borde
    o += `<path d="M${cx + 46} ${cy - 62}L${cx + 49} ${cy - 76}L${cx + 52} ${cy - 62}L${cx + 66} ${cy - 59}L${cx + 52} ${cy - 56}L${cx + 49} ${cy - 42}L${cx + 46} ${cy - 56}L${cx + 32} ${cy - 59}Z" fill="#fff" class="lsb-g"/>`
    // murciélagos cruzando el disco
    o += fly('#030203', P.d1, 1.4, 70, 0, 22) + fly('#030203', P.d1, 0.9, 140, 7, 28) + fly('#030203', P.d1, 1.1, 40, 13, 25)
    // arcadas góticas negras con filo de oro y velas
    const arch = (x, w, h, base = 300) => `<path d="M${x} ${base}V${base - h + w / 2}Q${x} ${base - h} ${x + w / 2} ${base - h - w * 0.55}Q${x + w} ${base - h} ${x + w} ${base - h + w / 2}V${base}Z" fill="#030203" stroke="${P.d1}" stroke-opacity=".55" stroke-width="1.4"/>`
    o += arch(-30, 110, 120) + arch(400, 110, 120) + arch(-6, 70, 70) + arch(416, 70, 70)
    o += `<rect x="-10" y="270" width="${BW + 20}" height="40" fill="#000"/><path d="M-10 270H${BW + 10}" stroke="${P.d1}" stroke-opacity=".6" stroke-width="1.6"/>`
    o += bl(S, cx, 276, 160, P.d1, 0.26)
    // charco de oro reflejado + velas pequeñas
    o += `<ellipse cx="${cx}" cy="284" rx="120" ry="7" fill="${S.radB([[0, P.d3, 0.7], [0.5, P.d1, 0.3], [1, P.d1, 0]])}"/>`
    for (let i = 0; i < 9; i++) { const x = 30 + i * 52 + R() * 12; o += `<rect x="${f(x - 2)}" y="${f(256 + R() * 8)}" width="4" height="${f(14 + R() * 10)}" fill="#efe2c4" opacity=".92"/>` + dotf(S, P, x, 253 + R() * 8, 1.2, R() * 3) }
    for (let i = 0; i < 12; i++) o += `<circle class="lsb-t" cx="${f(20 + R() * 440)}" cy="${f(20 + R() * 200)}" r="${f(0.7 + R() * 1.1)}" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    return o + vig(S, '#000', 0.55)
  },
}

// ───────── 2 · Catedral de velas: vitral gótico y cientos de velas en gradas
export const catedralFondo = {
  slug: 'catedral-de-velas-fondo', name: 'Catedral de velas', rarity: 'mitico', price: 0, coll: 'lestat', custom: true, palettes: LS_PAL,
  css: LS_CSS + CSS,
  art: (S, P) => {
    const R = rng(9), cx = 240
    let o = vg(S, [[0, '#050204'], [0.5, P.dk(P.d2, 0.2)], [1, P.mix(P.d2, P.d4, 0.4)]])
    // vitral: arco ojival con paños de colores y plomos de oro
    const arch = `M${cx - 62} 190V86Q${cx - 62} 40 ${cx} -4Q${cx + 62} 40 ${cx + 62} 86V190Z`
    const cl = S.clip(`<path d="${arch}"/>`)
    o += bl(S, cx, 100, 200, P.d1, 0.3)
    o += `<g clip-path="${cl}"><rect x="${cx - 70}" y="-10" width="140" height="210" fill="${S.radB([[0, P.d3], [0.5, P.mix(P.d1, P.d4, 0.4)], [1, P.dk(P.d4, 0.55)]], 0.5, 0.4, 0.7)}"/>`
    const cols = [P.d4, P.d1, P.mix(P.d4, P.d1, 0.5), P.lt(P.d3, 0.2), P.dk(P.d4, 0.3)]
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) o += `<rect x="${cx - 62 + c * 25 + 1}" y="${-4 + r * 28 + 1}" width="23" height="26" fill="${cols[(r * 3 + c * 2) % 5]}" opacity="${(0.55 + ((r + c) % 3) * 0.14).toFixed(2)}"/>`
    o += `</g><path d="${arch}" fill="none" stroke="${goldG(S, P)}" stroke-width="4"/><path d="M${cx} -4V190M${cx - 31} 30V190M${cx + 31} 30V190" stroke="#000" stroke-width="2.4" opacity=".75"/><circle cx="${cx}" cy="62" r="20" fill="none" stroke="#000" stroke-width="2.4" opacity=".8"/>`
    // haces de luz que bajan del vitral
    o += ray(S, P.d3, cx - 30, 120, cx - 120, 300, 8, 36, 0.3) + ray(S, P.d3, cx + 30, 120, cx + 120, 300, 8, 36, 0.28) + ray(S, P.d3, cx, 120, cx, 300, 10, 40, 0.22)
    // pilares laterales
    for (const sg of [-1, 1]) { const x = sg < 0 ? -10 : BW - 40; o += `<rect x="${x}" y="-10" width="50" height="320" fill="${S.lin([[0, '#000'], [0.5, P.dk(P.d2, 0.3)], [1, '#000']], 0, 0, 1, 0)}"/><path d="M${sg < 0 ? 40 : BW - 40} -10V310" stroke="${P.d1}" stroke-opacity=".5" stroke-width="1.4"/>` }
    // gradas de velas en perspectiva
    for (let r = 0; r < 7; r++) {
      const y = 188 + r * 17, sc = 0.55 + r * 0.16, n = 9 + r * 3, w = BW + 20
      o += `<rect x="-10" y="${y}" width="${w}" height="${f(14 * sc + 4)}" fill="${lg(S, P.dk(P.d2, 0.1), '#000', y, y + 24)}"/><path d="M-10 ${y}H${BW + 10}" stroke="${P.d1}" stroke-opacity="${(0.25 + r * 0.06).toFixed(2)}" stroke-width="${f(0.8 + r * 0.2)}"/>`
      for (let i = 0; i < n; i++) {
        const x = 12 + (i + (r % 2) * 0.5) * (BW - 24) / n + R() * 4, h = (7 + R() * 7) * sc, tw = 2.4 * sc
        o += `<rect x="${f(x - tw / 2)}" y="${f(y - h)}" width="${f(tw)}" height="${f(h)}" fill="#f2e6c8"/>` + dotf(S, P, x, y - h - 1.6 * sc, 1.1 * sc + 0.2, R() * 3)
      }
    }
    o += `<rect x="-10" y="298" width="${BW + 20}" height="4" fill="#000"/>`
    for (let i = 0; i < 10; i++) o += `<circle class="lsb-t" cx="${f(60 + R() * 360)}" cy="${f(20 + R() * 180)}" r="1.2" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    for (let i = 0; i < 6; i++) o += `<g class="lsb-p" style="animation-delay:${-R() * 12}s"><g transform="translate(${f(120 + R() * 240)} 0)">${rosePetal(P.d4, 0.8)}</g></g>`
    return o + vig(S, '#000', 0.6)
  },
}

// ───────── 3 · Salón de la araña de cristal: lámpara de velas, suelo de ajedrez en perspectiva, cortinas
function chandelier(S, P, x, y, s = 1) {
  const G = goldG(S, P)
  let o = `<path d="M0 -60V-8" stroke="${G}" stroke-width="2.6"/><circle cy="-8" r="5" fill="${G}"/>`
  const tiers = [[0, 62, 15], [34, 38, 10], [62, 20, 6]]
  tiers.forEach(([dy, rx, ry], ti) => {
    o += `<ellipse cx="0" cy="${dy}" rx="${rx}" ry="${ry}" fill="none" stroke="${G}" stroke-width="3.4"/>`
    const n = 6 + (2 - ti) * 0
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4, px = Math.cos(a) * rx, py = dy + Math.sin(a) * ry
      o += `<path d="M${f(px)} ${f(py)}V${f(py - 9)}" stroke="#f2e6c8" stroke-width="3" stroke-linecap="round"/>` + dotf(S, P, px, py - 12, 1.3, i * 0.7 + ti)
      o += `<path d="M${f(px)} ${f(py + 2)}V${f(py + 10 + ((i * 7) % 5))}" stroke="#d8ecff" stroke-width="1.2" opacity=".85"/><path d="M${f(px - 2.2)} ${f(py + 12 + ((i * 7) % 5))}L${f(px)} ${f(py + 9 + ((i * 7) % 5))}L${f(px + 2.2)} ${f(py + 12 + ((i * 7) % 5))}L${f(px)} ${f(py + 17 + ((i * 7) % 5))}Z" fill="#e6f2ff" opacity=".9"/>`
    }
  })
  o += `<path d="M0 66V90" stroke="${G}" stroke-width="2"/><path d="M-4 90L0 82L4 90L0 104Z" fill="#e6f2ff"/>`
  return `<g transform="translate(${x} ${y}) scale(${s})">${o}</g>`
}
export const salonFondo = {
  slug: 'salon-de-terciopelo-fondo', name: 'Salón de la araña de cristal', rarity: 'mitico', price: 0, coll: 'lestat', custom: true, palettes: LS_PAL,
  css: LS_CSS + CSS,
  art: (S, P) => {
    const R = rng(31), vx = 240, hy = 188
    let o = vg(S, [[0, P.dk(P.d2, 0.05)], [0.6, P.mix(P.d2, P.d4, 0.3)], [1, P.dk(P.d2, 0.2)]])
    // paneles de pared con molduras doradas
    for (let i = 0; i < 6; i++) { const x = 70 + i * 66; o += `<rect x="${x}" y="40" width="48" height="${hy - 52}" rx="3" fill="${P.d4}" opacity=".13" stroke="${P.d1}" stroke-opacity=".4" stroke-width="1.2"/><rect x="${x + 5}" y="46" width="38" height="${hy - 64}" rx="2" fill="none" stroke="${P.d1}" stroke-opacity=".25"/>` }
    o += `<rect x="-10" y="${hy - 6}" width="${BW + 20}" height="6" fill="${goldG(S, P)}" opacity=".9"/>`
    o += bl(S, vx, 80, 230, P.d1, 0.4) + bl(S, vx, 60, 120, P.d3, 0.22)
    // suelo de ajedrez con reflejo
    o += `<rect x="-10" y="${hy}" width="${BW + 20}" height="${BHt - hy + 10}" fill="#000"/>`
    const rowY = (j) => hy + 112 * Math.pow(j / 6, 1.6)
    for (let j = 0; j < 6; j++) for (let i = -8; i < 8; i++) {
      const y0 = rowY(j), y1 = rowY(j + 1), t0 = (y0 - hy) / 112 + 0.02, t1 = (y1 - hy) / 112 + 0.02, x0 = (xb) => vx + xb * t0, x1 = (xb) => vx + xb * t1
      const xa = i * 90, xb2 = (i + 1) * 90
      o += `<path d="M${f(x0(xa))} ${f(y0)}L${f(x0(xb2))} ${f(y0)}L${f(x1(xb2))} ${f(y1)}L${f(x1(xa))} ${f(y1)}Z" fill="${(i + j) % 2 ? P.dk(P.d4, 0.5) : '#0a0508'}"/>`
    }
    o += `<rect x="-10" y="${hy}" width="${BW + 20}" height="${BHt - hy + 10}" fill="${S.linU([[0, P.d3, 0.0], [0.4, P.d1, 0.14], [1, '#000', 0.55]], 0, hy, 0, BHt)}"/>`
    o += `<ellipse cx="${vx}" cy="${hy + 34}" rx="90" ry="22" fill="${S.radB([[0, P.d3, 0.55], [0.5, P.d1, 0.2], [1, P.d1, 0]])}"/>`
    // araña
    o += `<g class="lsb-sw" style="--ox:240px">${chandelier(S, P, vx, 70, 1.25)}</g>`
    // cortinas (laterales, recogidas)
    for (const sg of [-1, 1]) {
      const gx = sg < 0 ? 0 : BW, d = `M${gx} -6H${gx - sg * 90}Q${gx - sg * 84} 80 ${gx - sg * 54} 150Q${gx - sg * 44} 190 ${gx - sg * 66} 232Q${gx - sg * 84} 270 ${gx - sg * 96} 310H${gx}Z`
      const cl = S.clip(`<path d="${d}"/>`), gr = S.lin([[0, P.dk(P.d4, 0.7)], [0.3, P.d4], [0.5, P.lt(P.d4, 0.28)], [0.75, P.d4], [1, P.dk(P.d4, 0.75)]], 0, 0, 1, 0)
      o += `<g clip-path="${cl}">`
      for (let i = 0; i < 6; i++) o += `<rect x="${f(sg < 0 ? i * 17 : BW - (i + 1) * 17)}" y="-6" width="17.5" height="320" fill="${gr}"/>`
      o += `<rect x="-10" y="-6" width="${BW + 20}" height="320" fill="${S.linU([[0, '#000', 0.55], [0.3, '#000', 0], [0.7, '#000', 0.1], [1, '#000', 0.65]], 0, 0, 0, 300)}"/></g>`
      o += `<path d="M${gx - sg * 90} -6Q${gx - sg * 84} 80 ${gx - sg * 54} 150Q${gx - sg * 44} 190 ${gx - sg * 66} 232Q${gx - sg * 84} 270 ${gx - sg * 96} 310" fill="none" stroke="${goldG(S, P)}" stroke-width="2.6"/>`
      o += `<path d="M${gx - sg * 40} 150Q${gx - sg * 54} 158 ${gx - sg * 62} 150" fill="none" stroke="${goldG(S, P)}" stroke-width="4" stroke-linecap="round"/><g transform="translate(${gx - sg * 54} 156)"><ellipse rx="4" ry="5" fill="${goldG(S, P)}"/><path d="M-3 4L-4 22M0 5V25M3 4L4 22" stroke="${P.d1}" stroke-width="1.6"/></g>`
    }
    o += `<rect x="-10" y="-6" width="${BW + 20}" height="22" fill="${lg(S, P.lt(P.d4, 0.1), P.dk(P.d4, 0.7), -6, 16)}"/><rect x="-10" y="-6" width="${BW + 20}" height="4" fill="${goldG(S, P)}"/>`
    o += candelabra(S, P, { x: 178, y: 262, s: 1.1, d: 0 }) + candelabra(S, P, { x: 302, y: 262, s: 1.1, d: 2 })
    for (let i = 0; i < 12; i++) o += `<circle class="lsb-t" cx="${f(60 + R() * 360)}" cy="${f(40 + R() * 200)}" r="${f(0.8 + R() * 1.3)}" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    for (let i = 0; i < 6; i++) o += `<g class="lsb-p" style="animation-delay:${-R() * 12}s"><g transform="translate(${f(60 + R() * 360)} 0)">${rosePetal(P.d4, 0.85)}</g></g>`
    return o + vig(S, '#000', 0.6)
  },
}

// ───────── 4 · Calle de Nueva Orleans, 1794: perspectiva con balcones de hierro, faroles de gas, luna y niebla
export const calleFondo = {
  slug: 'nueva-orleans-1794-fondo', name: 'Calle de Nueva Orleans, 1794', rarity: 'mitico', price: 0, coll: 'lestat', custom: true, palettes: LS_PAL,
  css: LS_CSS + CSS,
  art: (S, P) => {
    const R = rng(17), vx = 240, vy = 150
    let o = vg(S, [[0, '#08050f'], [0.55, P.mix(P.d2, '#2a1040', 0.5)], [1, P.mix(P.d4, P.d1, 0.35)]]) + stars(S, P, 50, 6, 100)
    o += bl(S, vx, 70, 150, P.d3, 0.4)
    o += `<circle cx="${vx}" cy="66" r="30" fill="${S.rad([[0, P.lt(P.d3, 0.7)], [0.7, P.d3], [1, P.dk(P.d3, 0.2)]], vx - 8, 58, 40)}"/><circle cx="${vx - 9}" cy="62" r="5" fill="#000" opacity=".07"/><circle cx="${vx + 8}" cy="74" r="4" fill="#000" opacity=".08"/>`
    o += fly('#05030a', P.d1, 1.1, 38, 0, 21) + fly('#05030a', P.d1, 0.8, 94, 9, 26)
    // calle (suelo) con adoquines mojados
    o += `<path d="M${vx - 10} ${vy}L${vx + 10} ${vy}L${BW + 60} 310H-60Z" fill="${S.linU([[0, P.mix(P.d4, '#120a1c', 0.82)], [1, '#050206']], 0, vy, 0, 300)}"/>`
    for (let j = 1; j < 8; j++) { const y = vy + 150 * Math.pow(j / 8, 1.8), t = (y - vy) / 150; o += `<path d="M${f(vx - 300 * t)} ${f(y)}H${f(vx + 300 * t)}" stroke="${P.d1}" stroke-opacity="${(0.05 + j * 0.02).toFixed(2)}" stroke-width="${f(0.5 + j * 0.3)}"/>` }
    // fachadas en perspectiva (izquierda y derecha)
    const sc = (d) => 1 / (1 + d * 0.62)
    for (const sg of [-1, 1]) {
      for (let d = 4; d >= 0; d--) {
        const s0 = sc(d), s1 = sc(d + 1), xn = vx + sg * 270 * s0, xf = vx + sg * 270 * s1, tn = vy - 190 * s0, tf = vy - 190 * s1, bn = vy + 70 * s0, bf = vy + 70 * s1
        const tone = d % 2 ? '#0c0810' : '#100a14'
        o += `<path d="M${f(xn)} ${f(tn)}L${f(xf)} ${f(tf)}L${f(xf)} ${f(bf)}L${f(xn)} ${f(bn)}Z" fill="${tone}" stroke="${P.d1}" stroke-opacity=".18" stroke-width="1"/>`
        // ventanas altas con luz
        for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
          const u0 = 0.2 + c * 0.42, u1 = u0 + 0.22, X = (u) => xn + (xf - xn) * u, T = (u) => tn + (tf - tn) * u, B = (u) => bn + (bf - bn) * u
          const y0 = (u, v) => T(u) + (B(u) - T(u)) * v, vr = 0.12 + r * 0.46, vr2 = vr + 0.28, on = R() < 0.55
          o += `<path d="M${f(X(u0))} ${f(y0(u0, vr))}L${f(X(u1))} ${f(y0(u1, vr))}L${f(X(u1))} ${f(y0(u1, vr2))}L${f(X(u0))} ${f(y0(u0, vr2))}Z" fill="${on ? P.d3 : '#07040a'}" opacity="${on ? 0.78 : 1}" ${on ? `class="lsb-m" style="animation-delay:${-R() * 5}s"` : ''}/>`
        }
        // balcón de hierro forjado (cinta + barandal)
        const ub0 = 0.04, ub1 = 0.96, X = (u) => xn + (xf - xn) * u, Y = (u) => tn + (tf - tn) * u + ((bn - tn) + (bf - bn + tn - tf) * u) * 0.5
        const yb = (u) => (tn + (tf - tn) * u) + ((bn + (bf - bn) * u) - (tn + (tf - tn) * u)) * 0.5
        o += `<path d="M${f(X(ub0))} ${f(yb(ub0))}L${f(X(ub1))} ${f(yb(ub1))}" stroke="#000" stroke-width="${f(3.4 * s0)}"/><path d="M${f(X(ub0))} ${f(yb(ub0) + 6 * s0)}L${f(X(ub1))} ${f(yb(ub1) + 6 * s0)}" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".8"/>`
        for (let u = 0.05; u < 0.96; u += 0.06) o += `<path d="M${f(X(u))} ${f(yb(u))}V${f(yb(u) + 13 * (s0 + s1) / 2)}" stroke="#000" stroke-width="${f(1.4 * s0)}"/>`
      }
    }
    // faroles de gas y reflejos
    for (const [sg, d] of [[-1, 0.06], [1, 0.06], [-1, 0.55], [1, 0.55], [-1, 1.2], [1, 1.2]]) {
      const s = sc(d), x = vx + sg * 250 * s, yb = vy + 76 * s, h = 120 * s
      o += `<path d="M${f(x)} ${f(yb)}V${f(yb - h)}" stroke="#000" stroke-width="${f(3.4 * s)}"/><path d="M${f(x - 6 * s)} ${f(yb - h)}L${f(x - 4 * s)} ${f(yb - h - 18 * s)}H${f(x + 4 * s)}L${f(x + 6 * s)} ${f(yb - h)}Z" fill="${P.d3}" stroke="#000" stroke-width="${f(1.6 * s)}"/>`
      o += `<circle cx="${f(x)}" cy="${f(yb - h - 9 * s)}" r="${f(46 * s)}" fill="${S.radB([[0, P.d3, 0.8], [0.35, P.d1, 0.3], [1, P.d1, 0]])}" class="lsb-g" style="animation-delay:${-d * 5}s"/>`
      o += `<ellipse cx="${f(x * 0.92 + vx * 0.08)}" cy="${f(yb + 40 * s)}" rx="${f(10 * s)}" ry="${f(46 * s)}" fill="${S.radB([[0, P.d3, 0.35], [1, P.d1, 0]])}"/>`
    }
    o += `<g class="lsb-d"><ellipse cx="150" cy="238" rx="230" ry="24" fill="rgba(255,255,255,.08)"/><ellipse cx="350" cy="262" rx="200" ry="20" fill="rgba(255,255,255,.07)"/></g>`
    for (let i = 0; i < 9; i++) o += `<circle class="lsb-t" cx="${f(60 + R() * 360)}" cy="${f(100 + R() * 160)}" r="${f(0.8 + R())}" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    return o + vig(S, '#000', 0.55)
  },
}

// ───────── 5 · Gran teatro de los vampiros: la sala vista desde el escenario, palcos dorados y focos
export const teatroFondo = {
  slug: 'gran-teatro-de-los-vampiros', name: 'Gran teatro de los vampiros', rarity: 'mitico', price: 0, coll: 'lestat', custom: true, palettes: LS_PAL,
  css: LS_CSS + CSS,
  art: (S, P) => {
    const R = rng(23), cx = 240
    let o = vg(S, [[0, P.dk(P.d2, 0.3)], [0.5, P.mix(P.d2, P.d4, 0.3)], [1, P.dk(P.d2, 0.1)]])
    o += bl(S, cx, 90, 240, P.d1, 0.3)
    // focos
    o += ray(S, P.d3, 60, -6, 230, 290, 6, 46, 0.34) + ray(S, P.d3, 420, -6, 250, 290, 6, 46, 0.3) + ray(S, P.d1, 240, -6, 240, 280, 4, 30, 0.2)
    // tres balcones curvos: cada uno con filo de oro, palcos y lamparitas
    const tiers = [{ y: 100, sag: 26, h: 20 }, { y: 150, sag: 20, h: 24 }, { y: 206, sag: 14, h: 30 }]
    tiers.forEach((t, ti) => {
      const Y = (x) => t.y - t.sag * (1 - Math.pow((x - cx) / 270, 2))
      const pts = []; for (let x = -20; x <= BW + 20; x += 10) pts.push([x, Y(x)])
      const top = pts.map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join(''), bot = pts.slice().reverse().map((p) => 'L' + f(p[0]) + ' ' + f(p[1] + t.h)).join('')
      o += `<path d="${top}${bot}Z" fill="${lg(S, P.d4, P.dk(P.d4, 0.7), t.y - 30, t.y + t.h)}"/><path d="${top}" fill="none" stroke="${goldG(S, P)}" stroke-width="3.4"/>`
      o += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1] + t.h)).join('')}" fill="none" stroke="${P.d1}" stroke-opacity=".7" stroke-width="1.6"/>`
      // oquedad de los palcos con dorados
      const nb = 6 + ti * 2
      for (let i = 0; i < nb; i++) {
        const x = 12 + (i + 0.5) * (BW - 24) / nb, y = Y(x)
        o += `<path d="M${f(x - 14)} ${f(y - 8)}Q${f(x)} ${f(y - 34 - ti * 4)} ${f(x + 14)} ${f(y - 8)}V${f(y)}H${f(x - 14)}Z" fill="#05020a" opacity=".85" stroke="${P.d1}" stroke-opacity=".5" stroke-width="1"/>` + dotf(S, P, x, y - 12, 1, R() * 3)
        o += `<path d="M${f(x - 6)} ${f(y + 4)}h12v${f(t.h - 10)}h-12Z" fill="${P.d1}" opacity=".5"/>`
        o += `<circle cx="${f(x)}" cy="${f(y + t.h / 2 - 1)}" r="3" fill="${goldG(S, P)}"/>`
      }
    })
    // araña
    o += `<g class="lsb-sw" style="--ox:240px">${chandelier(S, P, cx, 4, 0.9)}</g>`
    // proscenio (pabellón superior) y telón
    for (const sg of [-1, 1]) {
      const gx = sg < 0 ? 0 : BW, d = `M${gx} -6H${gx - sg * 62}Q${gx - sg * 54} 100 ${gx - sg * 34} 190Q${gx - sg * 30} 240 ${gx - sg * 40} 310H${gx}Z`
      const cl = S.clip(`<path d="${d}"/>`), gr = S.lin([[0, P.dk(P.d4, 0.7)], [0.3, P.d4], [0.5, P.lt(P.d4, 0.3)], [0.75, P.d4], [1, P.dk(P.d4, 0.75)]], 0, 0, 1, 0)
      o += `<g clip-path="${cl}">` + Array.from({ length: 5 }, (_, i) => `<rect x="${f(sg < 0 ? i * 15 : BW - (i + 1) * 15)}" y="-6" width="15.5" height="320" fill="${gr}"/>`).join('') + `<rect x="-10" y="-6" width="${BW + 20}" height="320" fill="${S.linU([[0, '#000', 0.5], [0.3, '#000', 0], [1, '#000', 0.7]], 0, 0, 0, 300)}"/></g><path d="M${gx - sg * 62} -6Q${gx - sg * 54} 100 ${gx - sg * 34} 190Q${gx - sg * 30} 240 ${gx - sg * 40} 310" fill="none" stroke="${goldG(S, P)}" stroke-width="2.4"/>`
    }
    o += `<rect x="-10" y="-6" width="${BW + 20}" height="14" fill="${goldG(S, P)}"/>`
    for (let i = 0; i < 13; i++) o += `<path d="M${f(i * 38 - 6)} 8Q${f(i * 38 + 13)} ${i % 2 ? 24 : 30} ${f(i * 38 + 32)} 8Z" fill="${i % 2 ? P.d4 : P.dk(P.d4, 0.3)}" stroke="${P.d1}" stroke-width="1.4"/>`
    // borde del escenario con candilejas
    o += `<rect x="-10" y="280" width="${BW + 20}" height="30" fill="#000"/><path d="M-10 280H${BW + 10}" stroke="${goldG(S, P)}" stroke-width="2.4"/>`
    for (let i = 0; i < 16; i++) o += dotf(S, P, 14 + i * 30.5, 288, 1.7, (i % 5) * 0.5)
    o += bl(S, cx, 292, 200, P.d1, 0.3)
    for (let i = 0; i < 14; i++) o += `<circle class="lsb-t" cx="${f(40 + R() * 400)}" cy="${f(30 + R() * 230)}" r="${f(0.7 + R())}" fill="${P.d3}" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>`
    return o + vig(S, '#000', 0.55)
  },
}

// ───────── 6 · Luna de sangre: luna carmesí, catedral negra, murciélagos y rosas con espinas
export const lunaFondo = {
  slug: 'luna-de-sangre', name: 'Luna de sangre', rarity: 'mitico', price: 0, coll: 'lestat', custom: true, palettes: LS_PAL,
  css: LS_CSS + LS2_CSS + CSS,
  art: (S, P) => {
    const R = rng(41), mx = 300, my = 112
    let o = vg(S, [[0, '#050206'], [0.6, P.mix(P.d2, P.d4, 0.3)], [1, P.mix(P.d2, P.d4, 0.55)]]) + stars(S, P, 40, 4, 130)
    o += bl(S, mx, my, 280, P.d4, 0.42) + bl(S, mx, my, 150, P.d4, 0.4)
    o += `<circle cx="${mx}" cy="${my}" r="${74}" fill="${S.rad([[0, P.lt(P.d4, 0.5)], [0.55, P.d4], [1, P.dk(P.d4, 0.7)]], mx - 16, my - 18, 96)}"/>`
    for (const [x, y, r] of [[-22, -20, 12], [22, -28, 8], [14, 18, 14], [-30, 26, 9], [34, 8, 6], [-4, -44, 6], [-8, 40, 7]]) o += `<circle cx="${mx + x}" cy="${my + y}" r="${r}" fill="#000" opacity=".16"/><circle cx="${mx + x - 1}" cy="${my + y - 1}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width=".8"/>`
    o += `<circle cx="${mx}" cy="${my}" r="74" fill="none" stroke="${P.lt(P.d1, 0.3)}" stroke-opacity=".6" stroke-width="1.4"/>`
    o += `<circle cx="${mx}" cy="${my}" r="112" fill="none" stroke="${P.d4}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="1 5" class="lsb-r"/>`
    // murciélagos
    o += fly('#030103', P.d4, 1.6, 52, 0, 20) + fly('#030103', P.d4, 1.1, 108, 6, 25) + fly('#030103', P.d4, 0.8, 170, 12, 29) + fly('#030103', P.d4, 1.3, 20, 16, 23)
    // catedral negra (silueta) con rosetón encendido
    o += `<g><path d="M-10 300V210L30 200V150L38 100L46 150V196L84 208V300Z M100 300V196Q100 168 120 152Q140 168 140 196V300Z M150 300V218H196V248H214V300Z" fill="#040104" stroke="${P.d4}" stroke-opacity=".4" stroke-width="1"/><circle cx="120" cy="196" r="15" fill="${P.d4}" opacity=".85" class="lsb-m"/><path d="M120 181V211M105 196H135M110 186L130 206M130 186L110 206" stroke="#000" stroke-width="1.4"/><path d="M38 100V84M34 90H42" stroke="#040104" stroke-width="2"/></g>`
    o += `<path d="M-10 300V260Q100 246 200 262T420 258T${BW + 10} 266V310H-10Z" fill="#020102"/>`
    // niebla roja
    o += `<g class="lsb-d"><ellipse cx="200" cy="262" rx="260" ry="26" fill="${S.radB([[0, P.d4, 0.4], [1, P.d4, 0]])}"/><ellipse cx="380" cy="274" rx="220" ry="20" fill="${S.radB([[0, P.d4, 0.3], [1, P.d4, 0]])}"/></g>`
    // rama con espinas y rosas (primer plano, a la derecha)
    const stem = `M${BW + 20} 190C440 200 410 236 372 252C340 266 320 262 300 276`
    o += `<path d="${stem}" fill="none" stroke="#050205" stroke-width="7" stroke-linecap="round"/><path d="${stem}" fill="none" stroke="${P.dk(P.d4, 0.6)}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`
    for (let i = 0; i < 9; i++) { const t = i / 9, x = BW + 20 - t * 190, y = 190 + t * 84; o += `<path d="M${f(x)} ${f(y)}l${f(-4 + R() * 3)} ${f(-9 - R() * 4)}l${f(4)} ${f(2)}Z" fill="#050205" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".5"/>` }
    for (const [x, y, s, c] of [[432, 208, 1.5, P.d4], [382, 246, 1.1, P.dk(P.d4, 0.4)], [330, 266, 1.3, P.d4]]) {
      o += `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map((a, i) => `<path transform="rotate(${a})" d="M0 -3C-9 -4 -11 -15 -2 -18C6 -17 10 -8 5 -2Z" fill="${i % 2 ? c : P.lt(c, 0.15)}" stroke="#000" stroke-width=".8" stroke-opacity=".6"/>`).join('')}<circle r="5" fill="${P.dk(c, 0.5)}" stroke="#000" stroke-width=".7"/><path d="M-3 -2Q0 -5 3 -2Q0 1 -3 -2Z" fill="${P.lt(c, 0.3)}"/></g>`
    }
    for (let i = 0; i < 6; i++) o += `<g class="lsb-p" style="animation-delay:${-R() * 12}s"><g transform="translate(${f(200 + R() * 260)} 0)">${rosePetal(P.d4, 0.85)}</g></g>`
    return o + vig(S, '#000', 0.6)
  },
}

export const B5 = [eclipseFondo, catedralFondo, salonFondo, calleFondo, teatroFondo, lunaFondo]
