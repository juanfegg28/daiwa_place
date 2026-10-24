// @ts-nocheck
// Tarjetas: ACADEMIA · COSMOS · BOSQUE · ORO · LOFI + kits nuevos SANGRE NOIR y EMO ABISMO
import { f, pol, rng } from '../core/util.js'
import { pal, KF } from '../core/kit.js'
import { sparkle, petalD, leafD, starD, heartD } from '../core/svg.js'
import { CW, CH, rect, full, vgrad, vig, bloom, stars, frame, cornerOrn } from './lib.js'

const CAN = (n) => `.${n}`
// ═════════════════════════════ ACADEMIA
const AP = [
  pal('caoba', 'Caoba', '#C9803A', '#1E1008', '#FFD9A0', '#7AA06A'),
  pal('esmeralda', 'Lámpara verde', '#3FAF7A', '#07150F', '#BFF0D6', '#E8C26A'),
  pal('burdeos', 'Burdeos', '#A8344A', '#1A070C', '#F0B4C0', '#D9B25A'),
  pal('zafiro', 'Zafiro', '#4A78D8', '#080D1C', '#BCD0FF', '#E8C26A'),
]
const biblioteca = {
  slug: 'biblioteca', name: 'Biblioteca', rarity: 'raro', price: 1500, coll: 'academia', tone: 'dark', palettes: AP,
  css: `.bi-f{animation:bi-f 4s ease-in-out infinite alternate}${KF('bi-f', 'from{opacity:.75}to{opacity:1}')}.bi-d{animation:bi-d 12s linear infinite}${KF('bi-d', '0%{transform:translate(0,0);opacity:0}15%{opacity:.8}100%{transform:translate(18px,-90px);opacity:0}')}`,
  art: (S, P) => {
    const R = rng(41)
    let o = vgrad(S, [[0, P.mix(P.d2, P.d1, 0.1)], [1, P.dk(P.d2, 0.3)]])
    const wood = S.lin([[0, P.mix('#4a2d17', P.d1, 0.2)], [1, '#1c0f07']], 0, 0, 0, 1)
    const colors = [P.d1, P.d4, P.mix(P.d1, P.d2, 0.45), P.dk(P.d1, 0.4), P.mix(P.d4, P.d2, 0.5), P.mix(P.d3, P.d2, 0.6), P.rot(P.d1, 30), P.rot(P.d4, -25)]
    for (const [y, seed] of [[56, 1], [118, 2], [182, 3], [246, 4]]) {
      const Rr = rng(seed + 50)
      let x = 4
      while (x < CW - 4) {
        const w = 8 + Rr() * 10, h = 34 + Rr() * 22, c = colors[Math.floor(Rr() * colors.length)]
        const lean = Rr() < 0.06
        o += `<g transform="translate(${f(x)} ${y}) ${lean ? `rotate(${f(8 + Rr() * 6)} ${f(w)} 0)` : ''}"><rect x="0" y="${-h}" width="${f(w)}" height="${f(h)}" rx="1.4" fill="${c}"/><rect x="0" y="${-h}" width="${f(w * 0.28)}" height="${f(h)}" fill="#fff" opacity=".12"/><rect x="0" y="${-h}" width="${f(w)}" height="3" fill="#000" opacity=".25"/><rect x="${f(w * 0.12)}" y="${f(-h * 0.7)}" width="${f(w * 0.76)}" height="3" fill="${P.d3}" opacity=".7"/><rect x="${f(w * 0.12)}" y="${f(-h * 0.35)}" width="${f(w * 0.76)}" height="2" fill="${P.d3}" opacity=".55"/></g>`
        x += w + (lean ? 12 : 0.6)
      }
      o += `<rect x="0" y="${y}" width="${CW}" height="9" fill="${wood}"/><rect x="0" y="${y}" width="${CW}" height="2" fill="#fff" opacity=".1"/><rect x="0" y="${y + 9}" width="${CW}" height="6" fill="#000" opacity=".4"/>`
    }
    // lámpara de pie derecha con cono de luz
    o += `<polygon points="256,30 318,30 340,270 220,270" fill="${S.lin([[0, P.d3, 0.35], [1, P.d3, 0]], 0, 0, 0, 1)}" class="bi-f"/>` + bloom(S, 288, 28, 60, P.d3, 0.55)
    o += `<path d="M268 22H308L318 40H258Z" fill="${S.lin([[0, P.d1], [1, P.dk(P.d1, 0.5)]], 0, 0, 0, 1)}" stroke="${P.d4}" stroke-width="1.4"/><path d="M288 0V22" stroke="${P.d4}" stroke-width="2"/>`
    for (let i = 0; i < 14; i++) o += `<g transform="translate(${f(240 + R() * 90)} ${f(70 + R() * 150)})"><circle class="bi-d" style="animation-delay:${-(R() * 12).toFixed(1)}s;animation-duration:${(9 + R() * 6).toFixed(1)}s" r="${f(0.8 + R())}" fill="${P.d3}"/></g>`
    return o + vig(S, '#000', 0.5)
  },
  frame: (S, P) => frame(5, P.d4, 1.4, 20, 0.8) + cornerOrn(P.d4, 14, 18, 1.5),
}

// ═════════════════════════════ COSMOS
const CoP = [
  pal('nebulosa', 'Nebulosa', '#8F6BFF', '#070718', '#D9CCFF', '#FF8AD0'),
  pal('cobre', 'Cobre', '#FF9A4D', '#120804', '#FFE0BF', '#6BC8FF'),
  pal('hielo', 'Hielo', '#63D4FF', '#041018', '#D2F4FF', '#B99BFF'),
  pal('magenta', 'Magenta', '#FF5DB8', '#14061A', '#FFC8EA', '#6BE8FF'),
]
const observatorio = {
  slug: 'observatorio', name: 'Observatorio', rarity: 'epico', price: 3000, coll: 'cosmos', tone: 'dark', palettes: CoP,
  css: `.ob-r{transform-box:view-box;transform-origin:262px 84px;animation:ob-r 16s linear infinite}${KF('ob-r', 'to{transform:rotate(360deg)}')}.ob-r2{animation-duration:26s;animation-direction:reverse}.ob-t{transform-box:fill-box;transform-origin:20% 90%;animation:ob-t 9s ease-in-out infinite alternate}${KF('ob-t', 'from{transform:rotate(-4deg)}to{transform:rotate(5deg)}')}`,
  art: (S, P) => {
    let o = vgrad(S, [[0, P.dk(P.d2, 0.2)], [1, P.mix(P.d2, P.d1, 0.3)]])
    o += `<g transform="rotate(24 170 110)"><ellipse cx="170" cy="110" rx="250" ry="34" fill="${S.radB([[0, P.d1, 0.4], [0.6, P.d4, 0.14], [1, P.d1, 0]])}"/></g>`
    o += stars(S, P, { n: 80, seed: 9, y1: 280 })
    // planeta con anillo
    o += bloom(S, 262, 84, 70, P.d1, 0.35)
    o += `<g transform="translate(262 84)"><ellipse rx="52" ry="12" fill="none" stroke="${P.d3}" stroke-opacity=".5" stroke-width="5" transform="rotate(-18)"/><circle r="24" fill="${S.radB([[0, P.lt(P.d1, 0.35)], [0.6, P.d1], [1, P.dk(P.d1, 0.7)]], 0.35, 0.3, 0.8)}"/><path d="M-22 -4Q0 6 22 -8M-23 6Q0 16 22 2" stroke="${P.dk(P.d1, 0.4)}" stroke-opacity=".5" stroke-width="2.2" fill="none"/><path d="M-52 -2a52 12 0 0 0 104 0" fill="none" stroke="${P.d3}" stroke-width="5" stroke-opacity=".85" transform="rotate(-18) translate(0 0)"/></g>`
    o += `<g class="ob-r"><circle cx="262" cy="84" r="46" fill="none" stroke="${P.d3}" stroke-opacity=".25" stroke-dasharray="2 4"/><circle cx="308" cy="84" r="3.4" fill="${P.d4}"/></g><g class="ob-r ob-r2"><circle cx="262" cy="84" r="64" fill="none" stroke="${P.d3}" stroke-opacity=".18" stroke-dasharray="2 5"/><circle cx="262" cy="20" r="2.6" fill="${P.d3}"/></g>`
    // cúpula + telescopio
    o += `<path d="M-10 150Q40 60 120 100Q150 112 160 150Z" fill="${P.dk(P.d2, 0.35)}" stroke="${P.d3}" stroke-opacity=".4"/><path d="M52 106Q92 82 120 100L128 112Q90 98 62 124Z" fill="${S.lin([[0, P.d1, 0.85], [1, P.d2, 0.9]], 0, 0, 1, 1)}"/>`
    o += `<g class="ob-t"><g transform="translate(70 120) rotate(-38)"><rect x="0" y="-8" width="62" height="16" rx="3" fill="${S.lin([[0, P.d3], [1, P.dk(P.d3, 0.5)]], 0, 0, 0, 1)}" stroke="${P.d4}" stroke-width="1.2"/><rect x="58" y="-10" width="8" height="20" rx="2" fill="${P.d4}"/><rect x="8" y="-11" width="10" height="3" fill="${P.d4}"/></g></g><path d="M52 132L40 170M52 132L70 170M52 132V176" stroke="${P.d3}" stroke-opacity=".6" stroke-width="2.4"/>`
    return o + vig(S, '#000', 0.4)
  },
  frame: (S, P) => frame(6, P.d3, 1, 20, 0.55) + cornerOrn(P.d4, 14, 18, 1.4),
}

const eclipse = {
  slug: 'eclipse', name: 'Eclipse', rarity: 'legendario', price: 7000, coll: 'cosmos', tone: 'dark', dy: -6, palettes: [
    pal('dorada', 'Corona dorada', '#FFC94A', '#05030A', '#FFF0C0', '#FF7A3D'),
    pal('azul', 'Corona azul', '#6BB8FF', '#03060F', '#DDF0FF', '#B48CFF'),
    pal('carmesi', 'Corona carmesí', '#FF4A5E', '#0A0206', '#FFC8D0', '#FFB04A'),
    pal('violeta', 'Corona violeta', '#B07CFF', '#07030F', '#EAD8FF', '#FF7AD0'),
  ],
  css: `.ec-r{transform-box:view-box;transform-origin:170px 88px;animation:ec-r 60s linear infinite}${KF('ec-r', 'to{transform:rotate(360deg)}')}.ec-r2{animation-duration:90s;animation-direction:reverse}.ec-d{transform-box:fill-box;transform-origin:50% 50%;animation:ec-d 3.4s ease-in-out infinite}${KF('ec-d', '0%,100%{transform:scale(.7) rotate(0);opacity:.7}50%{transform:scale(1.15) rotate(45deg);opacity:1}')}.ec-p{animation:ec-p 5s ease-in-out infinite alternate}${KF('ec-p', 'from{opacity:.6}to{opacity:1}')}`,
  art: (S, P) => {
    let o = full('#030207') + stars(S, P, { n: 70, seed: 2, y1: 300, big: 0.15 })
    o += bloom(S, 170, 88, 150, P.d1, 0.35)
    // rayos giratorios
    let rays = '', rays2 = ''
    for (let i = 0; i < 36; i++) { const a = i * 10, L = 52 + ((i * 37) % 28); const [x1, y1] = pol(170, 88, 34, a - 2.4), [x2, y2] = pol(170, 88, 34 + L, a), [x3, y3] = pol(170, 88, 34, a + 2.4); rays += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}Z" fill="${S.lin([[0, P.d1, 0.8], [1, P.d1, 0]], 0, 0, 1, 1)}"/>` }
    for (let i = 0; i < 18; i++) { const a = i * 20 + 5, L = 96; const [x1, y1] = pol(170, 88, 34, a - 1.4), [x2, y2] = pol(170, 88, 34 + L, a), [x3, y3] = pol(170, 88, 34, a + 1.4); rays2 += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}Z" fill="${P.d3}" opacity=".22"/>` }
    o += `<g class="ec-r">${rays}</g><g class="ec-r ec-r2">${rays2}</g>`
    o += `<circle cx="170" cy="88" r="46" fill="${S.rad([[0.6, P.d3, 0.9], [0.78, P.d1, 0.65], [1, P.d1, 0]], 170, 88, 50)}" class="ec-p"/>`
    o += `<circle cx="170" cy="88" r="34.5" fill="#000"/><circle cx="170" cy="88" r="34.5" fill="none" stroke="${P.d3}" stroke-width="2"/><circle cx="170" cy="88" r="34.5" fill="none" stroke="#fff" stroke-width=".8" opacity=".8"/>`
    // protuberancias
    o += [30, 118, 205, 290].map((a) => { const [x, y] = pol(170, 88, 34, a); return `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})" d="M-8 0C-8 -16 8 -16 8 0C4 -8 -4 -8 -8 0Z" fill="${P.d4}" opacity=".9"/>` }).join('')
    // anillo de diamante
    const [dx, dy] = pol(170, 88, 35, -48)
    o += `<g transform="translate(${f(dx)} ${f(dy)})"><g class="ec-d">${sparkle(0, 0, 22, '#fff', '', 1, 0.08)}</g></g>` + bloom(S, dx, dy, 24, '#fff', 0.7)
    return o + vig(S, '#000', 0.4)
  },
  frame: (S, P) => `<rect x="4" y="4" width="332" height="412" rx="20" fill="none" stroke="${P.d1}" stroke-width="1.6" opacity=".9"/><rect x="9" y="9" width="322" height="402" rx="16" fill="none" stroke="${P.d3}" stroke-width=".8" opacity=".6"/>` + cornerOrn(P.d1, 16, 22, 1.8),
}

// ═════════════════════════════ BOSQUE
const BoP = [
  pal('esmeralda', 'Esmeralda', '#3ED68A', '#041410', '#C8FFE4', '#F4E27A'),
  pal('crepusculo', 'Crepúsculo', '#9AD86A', '#10140A', '#E4FFC0', '#FF9A6A'),
  pal('lila', 'Bosque lila', '#B08CFF', '#0C0818', '#E6DAFF', '#7AF0D0'),
  pal('ambar', 'Ámbar', '#F2B84A', '#140E04', '#FFE6B0', '#7ADC8A'),
]
const claro = {
  slug: 'claro-del-bosque', name: 'Claro del bosque', rarity: 'epico', price: 2800, coll: 'bosque', tone: 'dark', palettes: BoP,
  css: `.cb-r{animation:cb-r 8s ease-in-out infinite alternate}${KF('cb-r', 'from{opacity:.35}to{opacity:.8}')}.cb-ff{animation:cb-ff 7s ease-in-out infinite}${KF('cb-ff', '0%{transform:translate(0,0);opacity:0}20%{opacity:1}50%{transform:translate(var(--dx),-26px);opacity:.4}80%{opacity:1}100%{transform:translate(0,-6px);opacity:0}')}.cb-m{animation:cb-m 20s ease-in-out infinite alternate}${KF('cb-m', 'from{transform:translateX(-22px)}to{transform:translateX(22px)}')}`,
  art: (S, P) => {
    const R = rng(13)
    let o = vgrad(S, [[0, P.dk(P.d2, 0.3)], [0.5, P.mix(P.d2, P.d1, 0.2)], [1, P.d2]])
    o += bloom(S, 170, 20, 190, P.d3, 0.35)
    for (const [x, w, op] of [[96, 36, 0.22], [172, 26, 0.18], [230, 40, 0.2]]) o += `<polygon points="${x},0 ${x + w},0 ${x + w + 64},288 ${x - 30},288" fill="${S.lin([[0, P.d3, op * 2], [1, P.d3, 0]], 0, 0, 0, 1)}" class="cb-r" style="animation-delay:${-(x % 5)}s"/>`
    // troncos
    const trunk = (x, w, d) => `<path d="M${x} 288C${x + 2} 200 ${x - 3} 120 ${x + 1} -20H${x + w}C${x + w - 3} 120 ${x + w + 4} 200 ${x + w} 288Z" fill="${d}"/><path d="M${x + w * 0.25} 288C${x + w * 0.3} 160 ${x + w * 0.2} 60 ${x + w * 0.3} -20" stroke="#000" stroke-opacity=".3" stroke-width="2" fill="none"/>`
    const tk = S.lin([[0, P.dk(P.d2, 0.1)], [1, P.dk(P.d2, 0.6)]], 0, 0, 1, 0)
    o += trunk(-6, 52, tk) + trunk(40, 22, P.dk(P.d2, 0.45)) + trunk(280, 62, tk) + trunk(256, 20, P.dk(P.d2, 0.45))
    // hojas colgantes
    for (let i = 0; i < 22; i++) { const x = R() < 0.5 ? R() * 80 : 260 + R() * 80; o += `<path transform="translate(${f(x)} ${f(R() * 60)}) rotate(${f(150 + R() * 60)})" d="${leafD(16 + R() * 14, 6)}" fill="${[P.dk(P.d1, 0.5), P.dk(P.d1, 0.3), P.d1][i % 3]}" opacity="${f(0.6 + R() * 0.4)}"/>` }
    // hongos luminosos
    const mush = (x, y, s) => bloom(S, x, y - 6 * s, 24 * s, P.d4, 0.5) + `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2.4" y="-8" width="4.8" height="9" rx="2" fill="${P.d3}"/><path d="M-11 -8Q0 -22 11 -8Z" fill="${P.d4}"/><circle cx="-4" cy="-12" r="1.6" fill="#fff" opacity=".8"/><circle cx="3" cy="-14" r="1.2" fill="#fff" opacity=".8"/></g>`
    o += mush(60, 120, 1.2) + mush(78, 124, 0.8) + mush(286, 116, 1.3)
    o += `<g class="cb-m"><ellipse cx="170" cy="120" rx="190" ry="14" fill="#fff" opacity=".1"/></g>`
    for (let i = 0; i < 16; i++) { const x = 40 + R() * 260, y = 50 + R() * 200; o += bloom(S, x, y, 8, P.d4, 0.6).replace('<circle', `<circle class="cb-ff" style="--dx:${f((R() - 0.5) * 50)}px;animation-delay:${-(R() * 7).toFixed(1)}s;animation-duration:${(5 + R() * 5).toFixed(1)}s"`) + `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="#fff"/>` }
    return o + vig(S, '#000', 0.5)
  },
  frame: (S, P) => frame(6, P.d1, 1.2, 20, 0.6) + cornerOrn(P.d4, 14, 18, 1.4),
}

// ═════════════════════════════ ORO
const OP = [
  pal('clasico', 'Oro clásico', '#E8B84A', '#1A1206', '#FFF0B8', '#F6E2A0'),
  pal('rosa', 'Oro rosa', '#E8A08A', '#1C0F0C', '#FFE2D6', '#F6D2C0'),
  pal('platino', 'Platino', '#C8D0E0', '#0E1016', '#FFFFFF', '#E6ECF8'),
  pal('esmeralda', 'Oro y esmeralda', '#E8B84A', '#06180F', '#FFF0B8', '#3ED68A'),
]
const palacio = {
  slug: 'palacio-dorado', name: 'Palacio dorado', rarity: 'legendario', price: 7500, coll: 'oro', tone: 'dark', palettes: OP,
  css: `.pd-s{animation:pd-s 5s ease-in-out infinite}${KF('pd-s', '0%{transform:translateX(-200px)}60%,100%{transform:translateX(420px)}')}.pd-c{animation:pd-c 1.8s ease-in-out infinite alternate}${KF('pd-c', 'from{opacity:.7}to{opacity:1}')}.pd-w{transform-box:view-box;transform-origin:170px 0;animation:pd-w 6s ease-in-out infinite alternate}${KF('pd-w', 'from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}')}`,
  art: (S, P) => {
    const gold = S.lin([[0, P.lt(P.d1, 0.5)], [0.4, P.d1], [1, P.dk(P.d1, 0.45)]], 0, 0, 1, 1)
    let o = vgrad(S, [[0, P.mix(P.d2, P.d1, 0.16)], [1, P.d2]])
    o += bloom(S, 170, 70, 180, P.d1, 0.3)
    // arco central y columnas
    o += `<path d="M64 288V110C64 40 276 40 276 110V288" fill="${P.dk(P.d2, 0.35)}" stroke="${gold}" stroke-width="5"/><path d="M76 288V112C76 56 264 56 264 112V288" fill="none" stroke="${P.d1}" stroke-opacity=".5" stroke-width="1.4"/>`
    // abanico art déco
    for (let i = 0; i < 9; i++) { const a = -160 + i * 18; const [x, y] = pol(170, 112, 52, a); o += `<path d="M170 112L${f(x)} ${f(y)}" stroke="${P.d1}" stroke-opacity=".55" stroke-width="1.4"/>` }
    o += `<path d="M118 112A52 52 0 0 1 222 112" fill="none" stroke="${gold}" stroke-width="2"/><path d="M134 112A36 36 0 0 1 206 112" fill="none" stroke="${P.d1}" stroke-opacity=".6"/>`
    // columnas
    const col = (x) => `<rect x="${x}" y="40" width="34" height="260" fill="${S.lin([[0, P.dk(P.d3, 0.5)], [0.4, P.lt(P.d3, 0.1)], [1, P.dk(P.d3, 0.6)]], 0, 0, 1, 0)}" opacity=".85"/>` + [0, 1, 2, 3].map((i) => `<path d="M${x + 8 + i * 6} 56V288" stroke="#000" stroke-opacity=".18"/>`).join('') + `<rect x="${x - 6}" y="34" width="46" height="14" rx="2" fill="${gold}"/><rect x="${x - 6}" y="140" width="46" height="8" fill="${gold}"/><path d="M${x - 6} 34Q${x + 17} 24 ${x + 40} 34" fill="${gold}"/>`
    o += col(8) + col(298)
    // lámpara de araña
    let ch = `<g class="pd-w"><path d="M170 -10V28" stroke="${gold}" stroke-width="2"/><path d="M130 58Q170 74 210 58" fill="none" stroke="${gold}" stroke-width="3"/><path d="M142 44Q170 62 198 44" fill="none" stroke="${gold}" stroke-width="2.4"/><path d="M170 28L170 70" stroke="${gold}" stroke-width="3"/>`
    for (let i = -3; i <= 3; i++) { const x = 170 + i * 14, y = 52 + (3 - Math.abs(i)) * 4 + Math.abs(i) * 4 - 14 + 14; ch += `<path d="M${x} ${y + 6}l-3 -6h6z" fill="#fff"/>` }
    for (let i = -4; i <= 4; i++) { const x = 170 + i * 11, y = 64 + (4 - Math.abs(i)) * 2; ch += `<path d="M${x} ${y}l-3 9l3 6l3 -6z" fill="${S.lin([[0, '#fff'], [1, P.d3]], 0, 0, 0, 1)}" opacity=".95" stroke="${P.d1}" stroke-width=".5"/>` }
    for (let i = -3; i <= 3; i++) { const x = 170 + i * 15; ch += `<ellipse class="pd-c" style="animation-delay:${-i * 0.3}s" cx="${x}" cy="${46 + Math.abs(i) * 2}" rx="2.4" ry="4" fill="#ffe9a8"/>` + bloom(S, x, 46 + Math.abs(i) * 2, 12, '#ffe9a8', 0.5) }
    o += ch + '</g>'
    // suelo ajedrezado
    for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) o += `<rect x="${i * 30 - 10}" y="${240 + j * 14}" width="30" height="14" fill="${(i + j) % 2 ? P.d1 : P.dk(P.d2, 0.2)}" opacity=".35"/>`
    // destello que barre
    o += `<g clip-path="${S.clip(rect(0, -200, CW, 900, '#000'))}"><polygon class="pd-s" points="-30,-200 10,-200 70,520 30,520" fill="#fff" opacity=".12"/></g>`
    return o + vig(S, '#000', 0.4)
  },
  frame: (S, P) => {
    const gold = S.lin([[0, P.lt(P.d1, 0.55)], [0.5, P.d1], [1, P.dk(P.d1, 0.45)]], 0, 0, 1, 1)
    return `<rect x="4" y="4" width="332" height="412" rx="20" fill="none" stroke="${gold}" stroke-width="4"/><rect x="11" y="11" width="318" height="398" rx="14" fill="none" stroke="${gold}" stroke-width="1.4"/>` + cornerOrn(P.lt(P.d1, 0.3), 14, 28, 2.4) + `<path d="M130 412h80" stroke="${gold}" stroke-width="3"/><path d="M150 408q20 -10 40 0" fill="none" stroke="${gold}" stroke-width="2"/>`
  },
}

// ═════════════════════════════ LOFI
const LP = [
  pal('noche', 'Noche lila', '#B79AFF', '#150F28', '#EBDDFF', '#FFB86A'),
  pal('calido', 'Cálido', '#FFB86A', '#1E1008', '#FFE6C0', '#FF8AA0'),
  pal('lluvia', 'Lluvia azul', '#6FB4FF', '#08111E', '#D2E8FF', '#FFD27A'),
  pal('rosa', 'Rosa neón', '#FF8AC0', '#1A0A18', '#FFD6EA', '#7AE0FF'),
]
const cuarto = {
  slug: 'cuarto-de-noche', name: 'Cuarto de noche', rarity: 'raro', price: 1400, coll: 'lofi', tone: 'dark', palettes: LP,
  css: `.lc-r{animation:lc-r .8s linear infinite}${KF('lc-r', '0%{transform:translateY(-14px)}100%{transform:translateY(110px)}')}.lc-t{animation:lc-t 3s ease-in-out infinite alternate}${KF('lc-t', 'from{opacity:.4}to{opacity:1}')}.lc-z{animation:lc-z 4s ease-in-out infinite}${KF('lc-z', '0%{transform:translate(0,0);opacity:0}30%{opacity:1}100%{transform:translate(12px,-26px);opacity:0}')}`,
  art: (S, P) => {
    const R = rng(25)
    let o = vgrad(S, [[0, P.mix(P.d2, P.d1, 0.16)], [1, P.dk(P.d2, 0.25)]])
    // ventana con ciudad y lluvia
    const wx = 196, wy = 28, ww = 118, wh = 112
    const cl = S.clip(rect(wx, wy, ww, wh, '#000'))
    o += `<rect x="${wx - 6}" y="${wy - 6}" width="${ww + 12}" height="${wh + 12}" rx="6" fill="${P.dk(P.d2, 0.5)}"/><g clip-path="${cl}"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${S.lin([[0, P.dk(P.d1, 0.7)], [1, P.mix(P.d2, P.d1, 0.4)]], 0, 0, 0, 1)}"/><circle cx="${wx + 86}" cy="${wy + 26}" r="12" fill="${P.d3}" opacity=".9"/>`
    let x = wx
    while (x < wx + ww) { const w = 12 + R() * 16, h = 26 + R() * 48; o += `<rect x="${f(x)}" y="${f(wy + wh - h)}" width="${f(w)}" height="${f(h)}" fill="${P.dk(P.d2, 0.35)}"/>`; for (let yy = wy + wh - h + 5; yy < wy + wh - 4; yy += 8) if (R() < 0.45) o += `<rect x="${f(x + 3 + R() * (w - 8))}" y="${f(yy)}" width="3" height="4" fill="${P.d4}" opacity=".9"/>`; x += w + 1 }
    for (let i = 0; i < 18; i++) o += `<g transform="translate(${f(wx + R() * ww)} ${wy})"><path class="lc-r" style="animation-delay:${-(R() * 0.8).toFixed(2)}s" d="M0 0L-2 9" stroke="${P.d3}" stroke-opacity=".6" stroke-width="1"/></g>`
    o += `</g><path d="M${wx + ww / 2} ${wy}V${wy + wh}M${wx} ${wy + wh / 2}H${wx + ww}" stroke="${P.dk(P.d2, 0.5)}" stroke-width="4"/><rect x="${wx - 10}" y="${wy + wh + 2}" width="${ww + 20}" height="8" rx="2" fill="${P.dk(P.d2, 0.4)}"/>`
    // gato dormido en el alféizar
    o += `<g transform="translate(${wx + 40} ${wy + wh + 2})"><path d="M-22 0C-22 -14 -4 -20 10 -14C24 -16 28 -2 24 0Z" fill="#0a0710"/><path d="M-14 -14L-12 -22L-6 -16M6 -15L10 -22L13 -14" fill="#0a0710"/><path d="M24 -2Q34 -6 32 4" stroke="#0a0710" stroke-width="4" fill="none" stroke-linecap="round"/></g>`
    o += `<g transform="translate(${wx + 14} ${wy + wh - 4})" fill="${P.d4}" font-family="sans-serif" font-size="9" font-weight="700"><text class="lc-z" style="animation-delay:0s">z</text><text class="lc-z" style="animation-delay:-1.4s" x="6" y="-8">z</text></g>`
    // luces colgantes
    o += `<path d="M-6 20Q60 70 120 24T190 60" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.4"/>`
    for (let i = 0; i < 8; i++) { const t = i / 7, x2 = -6 + t * 196, y2 = 20 + Math.sin(t * Math.PI * 1.4) * 24 + t * 20; o += bloom(S, x2, y2 + 6, 14, [P.d4, P.d1, P.d3][i % 3], 0.6) + `<circle class="lc-t" style="animation-delay:${-(i * 0.5)}s" cx="${f(x2)}" cy="${f(y2 + 6)}" r="3" fill="${[P.d4, P.d1, P.d3][i % 3]}"/>` }
    // planta y lámpara
    o += `<g transform="translate(30 150)">${[-50, -30, -10, 10, 30, 50].map((a, i) => `<path transform="rotate(${a} 0 0)" d="${leafD(34 + (i % 2) * 8, 8)}" fill="${P.mix('#1d3a2a', P.d1, 0.2)}" stroke="#0a0710" stroke-opacity=".4"/>`).join('')}<path d="M-14 0H14L10 20H-10Z" fill="${P.d4}" opacity=".85"/></g>`
    o += bloom(S, 120, 130, 70, P.d4, 0.35)
    return o + vig(S, '#000', 0.5)
  },
  frame: (S, P) => frame(6, P.d1, 1.2, 20, 0.55),
}

// ═════════════════════════════ NUEVOS KITS
const CrP = [
  pal('sangre', 'Sangre', '#D6102F', '#0C0306', '#FF9AAA', '#FFB07A'),
  pal('vino', 'Vino tinto', '#8C1034', '#0A0208', '#E8A0B4', '#D9B25A'),
  pal('rubi', 'Rubí', '#F0204A', '#08040A', '#FFC2CC', '#9A9AA8'),
  pal('oxido', 'Óxido', '#E0481C', '#0E0503', '#FFD2A8', '#FFD25A'),
]
// gotas desde el borde inferior del banner
const drips = (S, P, col, seed, n = 16, hi = 70, cls = 'cn-d') => {
  const R = rng(seed)
  let o = ''
  for (let i = 0; i < n; i++) {
    const x = 8 + (i * (CW - 16)) / (n - 1) + (R() - 0.5) * 10, L = 10 + R() * hi, w = 2.6 + R() * 3
    o += `<g transform="translate(${f(x)} 0)"><g class="${cls}" style="animation-delay:${-(R() * 5).toFixed(1)}s;animation-duration:${(4 + R() * 3).toFixed(1)}s"><path d="M${f(-w)} 0V${f(L)}C${f(-w)} ${f(L + w * 1.6)} ${f(w)} ${f(L + w * 1.6)} ${f(w)} ${f(L)}V0Z" fill="${col}"/><circle cx="${f(-w * 0.35)}" cy="${f(L - 1)}" r="${f(w * 0.28)}" fill="#fff" opacity=".35"/></g></g>`
  }
  return o + `<rect x="0" y="-2" width="${CW}" height="8" fill="${col}"/>`
}
const altar = {
  slug: 'altar-carmesi', name: 'Altar carmesí', rarity: 'raro', price: 1700, coll: 'crimson', tone: 'dark', palettes: CrP,
  css: `.cn-d{transform-box:fill-box;transform-origin:50% 0;animation:cn-d 4.6s ease-in-out infinite}${KF('cn-d', '0%,100%{transform:scaleY(.82)}50%{transform:scaleY(1.12)}')}.al-f{transform-box:fill-box;transform-origin:50% 100%;animation:al-f .4s ease-in-out infinite alternate}${KF('al-f', 'from{transform:scale(1,.88) skewX(-4deg)}to{transform:scale(.92,1.1) skewX(4deg)}')}.al-c{animation:al-c 6s linear infinite}${KF('al-c', 'to{transform:rotate(360deg)}')}.al-g{animation:k-pu 4s ease-in-out infinite}`,
  art: (S, P) => {
    let o = vgrad(S, [[0, P.mix(P.d2, P.d1, 0.18)], [1, P.d2]])
    // luna de sangre
    o += bloom(S, 170, 96, 130, P.d1, 0.4) + `<circle cx="170" cy="96" r="42" fill="${S.radB([[0, P.lt(P.d1, 0.2)], [0.65, P.d1], [1, P.dk(P.d1, 0.55)]], 0.38, 0.34, 0.8)}"/><circle cx="154" cy="84" r="8" fill="${P.dk(P.d1, 0.5)}" opacity=".45"/><circle cx="182" cy="108" r="11" fill="${P.dk(P.d1, 0.5)}" opacity=".4"/>`
    // círculo ritual (elipse en el suelo)
    o += `<g transform="translate(170 214) scale(1 .26)"><g class="al-c" style="transform-box:view-box;transform-origin:0 0"><circle r="130" fill="none" stroke="${P.d1}" stroke-width="3" opacity=".8"/><circle r="112" fill="none" stroke="${P.d1}" stroke-width="1.6" stroke-dasharray="3 6" opacity=".8"/><path d="${starD(5, 112, 44, -90)}" fill="none" stroke="${P.d1}" stroke-width="2.4" opacity=".9"/></g></g>`
    // velas
    const candle = (x, y, h, d) => `<rect x="${x - 5}" y="${y - h}" width="10" height="${h}" rx="1.6" fill="${S.lin([[0, '#f4ebd8'], [1, '#bfae90']], 0, 0, 1, 0)}"/><path d="M${x - 5} ${y - h}Q${x - 6} ${y - h + 8} ${x - 3} ${y - h + 10}" stroke="${P.d1}" stroke-width="2.4" fill="none"/>` + bloom(S, x, y - h - 8, 26, P.d4, 0.55) + `<g class="al-f" style="animation-delay:${-d}s"><path d="M${x} ${y - h - 18}C${x + 6} ${y - h - 8} ${x + 4} ${y - h - 1} ${x} ${y - h - 1}C${x - 4} ${y - h - 1} ${x - 6} ${y - h - 8} ${x} ${y - h - 18}Z" fill="${P.d4}"/><path d="M${x} ${y - h - 12}C${x + 2} ${y - h - 7} ${x + 1.6} ${y - h - 3} ${x} ${y - h - 3}C${x - 1.6} ${y - h - 3} ${x - 2} ${y - h - 7} ${x} ${y - h - 12}Z" fill="#fff" opacity=".85"/></g>`
    o += candle(70, 188, 34, 0) + candle(92, 196, 22, 0.2) + candle(112, 190, 40, 0.3) + candle(228, 190, 40, 0.1) + candle(248, 196, 24, 0.25) + candle(272, 186, 32, 0.15)
    // enredadera de espinas en los lados
    const vine = (x, d) => `<path d="M${x} 0C${x + 8 * d} 60 ${x - 8 * d} 120 ${x + 6 * d} 190C${x} 240 ${x + 4 * d} 270 ${x} 300" fill="none" stroke="#080306" stroke-width="5"/>` + [30, 70, 110, 150, 200, 240].map((y, i) => `<path transform="translate(${x + (i % 2 ? 5 : -5) * d} ${y}) rotate(${i % 2 ? 40 : -40})" d="M-2 0L0 -9L2 0Z" fill="${P.d1}"/>`).join('')
    o += vine(8, 1) + vine(332, -1)
    o += drips(S, P, P.d1, 5, 17, 62)
    return o + vig(S, '#000', 0.5)
  },
  frame: (S, P) => frame(5, P.d1, 1.4, 20, 0.7) + cornerOrn(P.d3, 14, 20, 1.6),
}

const nido = {
  slug: 'nido-de-murcielagos', name: 'Nido de murciélagos', rarity: 'epico', price: 2900, coll: 'crimson', tone: 'dark', palettes: CrP,
  css: `.nm-b{transform-box:fill-box;transform-origin:50% 0;animation:nm-b 4s ease-in-out infinite alternate}${KF('nm-b', 'from{transform:rotate(-5deg)}to{transform:rotate(5deg)}')}.nm-f{animation:nm-f 9s linear infinite}${KF('nm-f', '0%{transform:translate(-60px,20px)}100%{transform:translate(420px,-30px)}')}.nm-w{transform-box:fill-box;transform-origin:50% 50%;animation:nm-w .35s ease-in-out infinite alternate}${KF('nm-w', 'from{transform:scaleY(1)}to{transform:scaleY(.45)}')}`,
  art: (S, P) => {
    const R = rng(33)
    let o = vgrad(S, [[0, P.dk(P.d2, 0.2)], [1, P.mix(P.d2, P.d1, 0.14)]])
    o += bloom(S, 240, 90, 120, P.d1, 0.35) + `<circle cx="240" cy="90" r="30" fill="${S.radB([[0, P.lt(P.d1, 0.25)], [0.7, P.d1], [1, P.dk(P.d1, 0.5)]], 0.4, 0.35, 0.8)}"/>`
    // techo de cueva con estalactitas
    let rock = `M0 0H${CW}V20`
    const pts = []
    for (let x = CW; x >= 0; x -= 20) { const h = 20 + R() * 50 * (R() < 0.4 ? 1.6 : 0.8); pts.push([x, h]) }
    pts.forEach(([x, h], i) => { rock += `L${x - 10} ${f(h + 22)}L${x - 20} 20` })
    rock += 'Z'
    o += `<path d="${rock}" fill="${S.lin([[0, '#0a0508'], [1, P.mix('#1a0a10', P.d1, 0.2)]], 0, 0, 0, 1)}" stroke="${P.d1}" stroke-opacity=".3"/>`
    // murciélagos colgando
    const bat = (x, y, s, d) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="nm-b" style="animation-delay:${-d}s"><path d="M0 0V8" stroke="#0b0407" stroke-width="2"/><ellipse cy="16" rx="6" ry="9" fill="#0b0407"/><path d="M-6 12Q-18 14 -16 30Q-10 24 -6 28Q-5 20 -3 24ZM6 12Q18 14 16 30Q10 24 6 28Q5 20 3 24Z" fill="#0b0407"/><circle cx="-2.2" cy="9" r="1" fill="${P.d1}"/><circle cx="2.2" cy="9" r="1" fill="${P.d1}"/><path d="M-4 3L-3 7L-1 4M4 3L3 7L1 4" fill="#0b0407"/></g></g>`
    for (const [x, y, s, d] of [[40, 68, 1.2, 0], [92, 62, 0.9, 1.4], [150, 80, 1.3, 2.2], [210, 70, 1, 0.8], [290, 56, 1.1, 3]]) o += bat(x, y, s, d)
    // murciélagos en vuelo
    const fly = (y, s, d) => `<g transform="translate(0 ${y})"><g class="nm-f" style="animation-delay:${-d}s;animation-duration:${10 + d}s"><g transform="scale(${s})"><g class="nm-w"><path d="M0 0C-4 -6 -14 -9 -24 -4C-16 -4 -12 0 -10 5C-5 2 -2 2 0 3C2 2 5 2 10 5C12 0 16 -4 24 -4C14 -9 4 -6 0 0Z" fill="#0b0407"/></g></g></g></g>`
    o += fly(130, 1, 0) + fly(180, 0.7, 4) + fly(100, 0.8, 7)
    // niebla baja
    o += `<ellipse cx="170" cy="260" rx="220" ry="26" fill="${S.radB([[0, P.d1, 0.35], [1, P.d1, 0]])}"/>`
    return o + vig(S, '#000', 0.5)
  },
  frame: (S, P) => frame(5, P.d1, 1.4, 20, 0.7) + cornerOrn(P.d3, 14, 20, 1.6),
}

const EP = [
  pal('negro-rosa', 'Negro y rosa', '#FF3D9A', '#0A070C', '#FFC4E3', '#B8B8C6'),
  pal('negro-violeta', 'Negro y violeta', '#9B5CFF', '#0B0712', '#E0D0FF', '#C0C0CE'),
  pal('negro-rojo', 'Negro y rojo', '#E5233A', '#0C0506', '#FFC4CB', '#BCBCC8'),
  pal('monocromo', 'Monocromo', '#E8E8EE', '#07070A', '#FFFFFF', '#8A8A99'),
]
const habitacion = {
  slug: 'habitacion-emo', name: 'Habitación emo', rarity: 'raro', price: 1500, coll: 'emo', tone: 'dark', palettes: EP,
  css: `.eb-t{animation:eb-t 3s ease-in-out infinite alternate}${KF('eb-t', 'from{opacity:.35}to{opacity:1}')}.eb-s{transform-box:fill-box;transform-origin:50% 0;animation:eb-s 5s ease-in-out infinite alternate}${KF('eb-s', 'from{transform:rotate(-2deg)}to{transform:rotate(2deg)}')}`,
  art: (S, P) => {
    const R = rng(52)
    const ink = '#0a070c'
    let o = vgrad(S, [[0, P.mix(P.d2, P.d1, 0.12)], [1, P.d2]])
    for (let i = 0; i < 14; i++) o += `<path d="M${f(R() * CW)} ${f(R() * 288)}l${f((R() - 0.5) * 40)} ${f((R() - 0.5) * 10)}" stroke="${P.d4}" stroke-opacity=".08" stroke-width="1"/>`
    // luces de hada colgantes
    o += `<path d="M-6 18Q85 74 170 30T346 22" fill="none" stroke="#000" stroke-width="1.4"/>`
    for (let i = 0; i < 9; i++) { const t = i / 8, x = -6 + t * 352, y = 18 + Math.sin(t * Math.PI * 2) * 6 + (1 - Math.abs(t - 0.5) * 2) * 28; o += bloom(S, x, y + 5, 12, [P.d1, P.d3][i % 2], 0.5) + `<circle class="eb-t" style="animation-delay:${-i * 0.4}s" cx="${f(x)}" cy="${f(y + 5)}" r="2.8" fill="${[P.d1, P.d3][i % 2]}"/>` }
    // pósters rasgados
    const poster = (x, y, w, h, r, c) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect width="${w}" height="${h}" fill="${c}"/><path d="M0 ${h}L${w * 0.2} ${h - 5}L${w * 0.4} ${h}L${w * 0.6} ${h - 6}L${w * 0.8} ${h}L${w} ${h - 4}V${h + 6}H0Z" fill="${P.d2}"/><circle cx="${w / 2}" cy="${h * 0.38}" r="${w * 0.22}" fill="${ink}"/><path d="M${w * 0.12} ${h * 0.72}H${w * 0.88}M${w * 0.2} ${h * 0.82}H${w * 0.8}" stroke="${ink}" stroke-width="3"/><rect x="-6" y="-5" width="${w * 0.42}" height="9" fill="${P.d3}" opacity=".6" transform="rotate(-8)"/><rect x="${w - 22}" y="${h - 8}" width="${w * 0.42}" height="9" fill="${P.d3}" opacity=".6" transform="rotate(10)"/></g>`
    o += poster(122, 44, 62, 76, -4, P.mix(P.d4, P.d2, 0.35)) + poster(222, 52, 56, 70, 5, P.mix(P.d1, P.d2, 0.4))
    // polaroids con cinta
    const pol_ = (x, y, r, c) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-17" y="-4" width="34" height="42" fill="#efe9e4"/><rect x="-14" y="-1" width="28" height="28" fill="${c}"/><path d="M-14 27L-4 14L4 22L10 16L14 24V27Z" fill="${ink}" opacity=".7"/><rect x="-10" y="-9" width="20" height="8" fill="${P.d3}" opacity=".75" transform="rotate(-6)"/></g>`
    o += pol_(26, 62, -8, P.d1) + pol_(300, 46, 7, P.d3 === '#FFFFFF' ? '#999' : P.d3)
    // cadena y corazón cosido colgando
    o += `<g transform="translate(96 0)"><g class="eb-s">${Array.from({ length: 7 }, (_, i) => `<ellipse cy="${i * 8 + 5}" rx="${i % 2 ? 1.8 : 3.4}" ry="4.4" fill="none" stroke="${P.d4}" stroke-width="2"/>`).join('')}<g transform="translate(0 70)"><path d="${heartD(11)}" fill="${ink}" stroke="${P.d1}" stroke-width="1.8"/><path d="M-1 -8L2 -2L-2 3L1 9" stroke="${P.d1}" stroke-width="1" fill="none"/></g></g></g>`
    // borde de papel rasgado en el límite del banner
    let torn = `M0 0`
    for (let x = 0; x <= CW; x += 10) torn += `L${x} ${f(4 + R() * 10)}`
    torn += `L${CW} 0Z`
    o += `<path d="${torn}" fill="${P.d3}" opacity=".9"/><path d="${torn}" fill="${ink}" opacity=".35" transform="translate(0 3)"/>`
    return o + vig(S, '#000', 0.45)
  },
  frame: (S, P) => frame(5, P.d4, 1.2, 20, 0.6) + `<rect x="5" y="5" width="330" height="410" rx="19" fill="none" stroke="${P.d1}" stroke-width="1.4" stroke-dasharray="6 4" opacity=".8" transform="translate(0 0)"/>`,
}

const tinta = {
  slug: 'tinta-y-lagrimas', name: 'Tinta y lágrimas', rarity: 'epico', price: 2600, coll: 'emo', tone: 'dark', palettes: EP,
  css: `.tl-d{transform-box:fill-box;transform-origin:50% 0;animation:tl-d 6s ease-in-out infinite}${KF('tl-d', '0%,100%{transform:scaleY(.8)}50%{transform:scaleY(1.15)}')}.tl-t{animation:tl-t 4s ease-in infinite}${KF('tl-t', '0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(120px);opacity:0}')}.tl-p{transform-box:fill-box;transform-origin:50% 50%;animation:tl-p 3.4s ease-in-out infinite}${KF('tl-p', '0%,100%{transform:scale(1)}50%{transform:scale(1.06)}')}`,
  art: (S, P) => {
    const R = rng(61)
    const ink = '#0a070c'
    let o = vgrad(S, [[0, P.mix(P.d2, P.d1, 0.1)], [1, P.d2]])
    o += bloom(S, 170, 100, 130, P.d1, 0.18)
    // corazón roto central grande
    o += `<g transform="translate(250 96) scale(1.5)"><g class="tl-p"><g><path d="${heartD(22)}" fill="${ink}" stroke="${P.d1}" stroke-width="2.4"/><path d="${heartD(22)}" fill="none" stroke="${P.d3}" stroke-opacity=".4" stroke-width="1" transform="translate(-1.6 -1.6)"/><path d="M0 -20L-6 -8L5 0L-5 10L2 20" stroke="${P.d1}" stroke-width="2.2" fill="none"/>${[-8, 4, 14].map((y) => `<path d="M-4 ${y - 2}L4 ${y + 2}M4 ${y - 2}L-4 ${y + 2}" stroke="${P.d3}" stroke-width="1.5" stroke-linecap="round" transform="translate(${y > 8 ? 4 : -1} 0)"/>`).join('')}</g></g></g>`
    // lágrimas de tinta cayendo
    for (let i = 0; i < 7; i++) o += `<g transform="translate(${f(120 + R() * 150)} ${f(40 + R() * 40)})"><path class="tl-t" style="animation-delay:${-(R() * 4).toFixed(1)}s;animation-duration:${(3.4 + R() * 2).toFixed(1)}s" d="M0 -6C4 0 4 5 0 7C-4 5 -4 0 0 -6Z" fill="${ink}" stroke="${P.d1}" stroke-width=".8"/></g>`
    // gran derrame de tinta desde el borde del banner
    const n = 13
    let spill = `M0 0H${CW}`
    let x = CW
    const L = []
    for (let i = 0; i < n; i++) { const w = CW / n; const len = 14 + R() * (i % 3 === 0 ? 100 : 54); L.push([x, len, w]); x -= w }
    L.forEach(([xx, len, w]) => { spill += `L${f(xx)} ${f(len - 6)}` })
    spill += 'L0 0Z'
    let drips2 = ''
    L.forEach(([xx, len, w], i) => { const cx = xx - w / 2, r = 3 + R() * 3; drips2 += `<g transform="translate(${f(cx)} 0)"><g class="tl-d" style="animation-delay:${-(R() * 6).toFixed(1)}s"><path d="M${f(-w * 0.45)} 0V${f(len)}C${f(-w * 0.45)} ${f(len + r * 2)} ${f(w * 0.45)} ${f(len + r * 2)} ${f(w * 0.45)} ${f(len)}V0Z" fill="${ink}"/><ellipse cx="${f(-w * 0.2)}" cy="${f(len - 2)}" rx="1.4" ry="${f(r * 0.8)}" fill="#fff" opacity=".22"/></g></g>` })
    o += drips2 + `<rect x="0" y="-2" width="${CW}" height="10" fill="${ink}"/>`
    // salpicaduras
    for (let i = 0; i < 18; i++) o += `<circle cx="${f(R() * CW)}" cy="${f(130 + R() * 150)}" r="${f(0.8 + R() * 2.6)}" fill="${ink}" opacity=".85"/>`
    return o + vig(S, '#000', 0.45)
  },
  frame: (S, P) => frame(5, P.d1, 1.4, 20, 0.7) + cornerOrn(P.d4, 14, 20, 1.6),
}

export const C3 = [biblioteca, observatorio, eclipse, claro, palacio, cuarto, altar, nido, habitacion, tinta]
