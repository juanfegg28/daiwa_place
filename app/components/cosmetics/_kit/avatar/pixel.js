// @ts-nocheck
// Colección PIXEL QUEST — RPG 8-bit. Todo dibujado con rectángulos de píxel (originales).
import { CX, CY, f, pol, rng } from '../core/util.js'
import { ctr, sparkle, glow, mirror, sprite, pxRing, pxDiag } from '../core/svg.js'
import { pal, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('cartucho', 'Cartucho rojo', '#E8404F', '#3A0D18', '#FFD5D9', '#FFD23F'),
  pal('hierba', 'Hierba', '#4CC85A', '#0F3318', '#D6FFD9', '#FFD23F'),
  pal('mana', 'Maná', '#4C8DFF', '#0E1E4F', '#D6E6FF', '#FF5FB0'),
  pal('tesoro', 'Tesoro', '#FFB21F', '#4A2A05', '#FFF0C2', '#8B5CF6'),
]
const HEART = ['..oo.oo..', '.ohhoffo.', 'ohhfffffo', 'offfffffo', 'offfffffo', '.offfffo.', '..offfo..', '...ofo...', '....o....']
const SLIME = ['....oooooo....', '..ooffffffoo..', '.offhhffffffo.', '.ofhhfffffffo.', 'offffeffeffffo', 'offffeffeffffo', 'offffffffffffo', 'offffffffffffo', '.offffffffffo.', '..oooooooooo..']
const CHEST_C = ['..oooooooooo..', '.obbbbbbbbbbo.', 'obbhbbbbbbbbbo', 'obbbbbbbbbbbbo', 'oggggggggggggo', 'ogggggkkgggggo', 'obbbbbkkbbbbbo', 'obbbbbbbbbbbbo', 'obbbbbbbbbbbbo', 'oooooooooooooo']
const CHEST_O = ['..oooooooooo..', '.obbbbbbbbbbo.', '.obhbbbbbbbbo.', 'oooooooooooooo', 'oyyyyyyyyyyyyo', 'oyycyyyyycyyyo', 'oggggggggggggo', 'ogggggkkgggggo', 'obbbbbkkbbbbbo', 'obbbbbbbbbbbbo', 'obbbbbbbbbbbbo', 'oooooooooooooo']

export const PIXEL = [
  // ───────────────────────── Marco 8-bit
  {
    slug: 'marco-8bit', name: 'Marco 8-bit', rarity: 'comun', price: 400, coll: 'pixel', min: 28, palettes: PAL,
    css: `.px-b{animation:px-b 1.6s steps(1) infinite}${KF('px-b', '0%{opacity:1}50%{opacity:.15}')}.px-b2{animation:px-b 1.6s steps(1) infinite .8s}`,
    back: () => '',
    front: (S, P) => {
      const tones = [P.lt(P.d1, 0.5), P.d1, P.dk(P.d1, 0.3)]
      const sq = (a, d) => { const [x, y] = pol(CX, CY, 124, a); return `<rect class="${d}" x="${f(Math.round(x / 6) * 6 - 3)}" y="${f(Math.round(y / 6) * 6 - 3)}" width="6" height="6" fill="#fff"/>` }
      return pxRing(144, 144, 109, 133, 6, tones, P.d2) + `<g shape-rendering="crispEdges">${sq(-135, 'px-b')}${sq(48, 'px-b2')}</g>`
    },
  },
  // ───────────────────────── Corazones de vida
  {
    slug: 'corazones-de-vida', name: 'Corazones de vida', rarity: 'comun', price: 450, coll: 'pixel', min: 44, palettes: PAL,
    css: `.ph-b{transform-box:fill-box;transform-origin:50% 50%;animation:ph-b 1.4s steps(2) infinite}${KF('ph-b', '0%{transform:scale(1)}50%{transform:scale(1.2)}')}`,
    back: () => '',
    front: (S, P) => {
      const full = { o: P.d2, f: P.d1, h: P.d3 }
      const empty = { o: P.d2, f: P.mix(P.d2, '#8a8a99', 0.4), h: P.mix(P.d2, '#b0b0c0', 0.4) }
      const ring = pxRing(144, 144, 111, 123, 4, [P.lt(P.d1, 0.4), P.d1, P.dk(P.d1, 0.3)], P.d2)
      // v1.5.10 · los corazones van DENTRO del círculo, en un arco abajo de la foto (antes el panel colgaba bajo el avatar y tapaba el nombre en el perfil)
      const C = 2.7, W = 9 * C, R = 94
      const arc = (a0, a1, r) => { const [x0, y0] = pol(CX, CY, r, a0); const [x1, y1] = pol(CX, CY, r, a1); return `M${f(x0)} ${f(y0)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}` }
      const band = `<path d="${arc(38, 142, R)}" fill="none" stroke="${P.d1}" stroke-width="31" stroke-linecap="butt" opacity=".95"/><path d="${arc(38, 142, R)}" fill="none" stroke="${P.d2}" stroke-width="25" stroke-linecap="butt"/>`
      const row = [0, 1, 2, 3, 4].map((i) => {
        const [x, y] = pol(CX, CY, R, 90 - (i - 2) * 21)
        return `<g class="${i === 2 ? 'ph-b' : ''}">${sprite(HEART, i < 3 ? full : empty, x - W / 2, y - W / 2, C)}</g>`
      }).join('')
      return ring + band + row
    },
  },
  // ───────────────────────── Barra de XP
  {
    slug: 'barra-de-xp', name: 'Barra de XP', rarity: 'raro', price: 800, coll: 'pixel', min: 56, palettes: PAL,
    css: `.pb-f{transform-box:fill-box;transform-origin:0 50%;animation:pb-f 5s steps(14) infinite}${KF('pb-f', '0%{transform:scaleX(.08)}85%,100%{transform:scaleX(1)}')}.pb-s{animation:pb-s 1s steps(1) infinite}${KF('pb-s', '0%{opacity:1}50%{opacity:0}')}`,
    back: () => '',
    front: (S, P) => {
      const ring = pxRing(144, 144, 111, 123, 4, [P.lt(P.d1, 0.4), P.d1, P.dk(P.d1, 0.3)], P.d2)
      const X0 = 78, Y0 = 250, Wd = 170
      let seg = ''
      for (let i = 1; i < 14; i++) seg += `M${X0 + 4 + (162 / 14) * i} ${Y0 + 4}v20`
      const bar = `<g shape-rendering="crispEdges"><rect x="${X0}" y="${Y0}" width="${Wd}" height="28" fill="${P.d2}"/><rect x="${X0 + 4}" y="${Y0 + 4}" width="162" height="20" fill="${P.dk(P.d2, 0.45)}"/><g class="pb-f"><rect x="${X0 + 4}" y="${Y0 + 4}" width="162" height="20" fill="${P.d1}"/><rect x="${X0 + 4}" y="${Y0 + 4}" width="162" height="6" fill="${P.lt(P.d1, 0.5)}"/><rect x="${X0 + 4}" y="${Y0 + 18}" width="162" height="6" fill="${P.dk(P.d1, 0.3)}"/></g><path d="${seg}" stroke="${P.d2}" stroke-width="2" opacity=".55"/></g>`
      const lv = `<g shape-rendering="crispEdges"><rect x="36" y="242" width="52" height="44" fill="${P.d2}"/><rect x="41" y="247" width="42" height="34" fill="${P.d4}"/><rect x="41" y="247" width="42" height="6" fill="${P.lt(P.d4, 0.55)}"/><rect x="41" y="275" width="42" height="6" fill="${P.dk(P.d4, 0.25)}"/></g><text x="62" y="271" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-weight="900" font-size="17" fill="${P.d2}">LV7</text>`
      const star = `<g class="pb-s">${sprite(['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'], { y: P.d4 }, 254, 244, 6)}</g>`
      // v1.5.10 · la barra y el nivel van DENTRO del círculo (antes colgaban abajo y tapaban el nombre)
      return ring + `<g transform="translate(144 214) scale(.66) translate(-144 -264)">${bar}${lv}${star}</g>`
    },
  },
  // ───────────────────────── Cofre pixel
  {
    slug: 'cofre-pixel', name: 'Cofre pixel', rarity: 'raro', price: 900, coll: 'pixel', min: 52, palettes: PAL,
    css: `.pc-o{animation:pc-o 3.6s steps(1) infinite}${KF('pc-o', '0%,55%{opacity:0}56%,100%{opacity:1}')}.pc-c{animation:pc-c 3.6s steps(1) infinite}${KF('pc-c', '0%,55%{opacity:1}56%,100%{opacity:0}')}.pc-s{animation:pc-s 3.6s steps(6) infinite}${KF('pc-s', '0%,55%{transform:translateY(10px);opacity:0}56%{opacity:1}100%{transform:translateY(-34px);opacity:0}')}`,
    back: () => '',
    front: (S, P) => {
      const map = { o: '#1b1020', b: P.mix('#8a5a2b', P.d1, 0.2), h: P.lt('#8a5a2b', 0.45), g: '#f7c948', k: '#3a2a14', y: P.d4, c: '#fff3b0' }
      const ring = pxRing(144, 144, 111, 123, 4, [P.lt(P.d1, 0.4), P.d1, P.dk(P.d1, 0.3)], P.d2)
      const px = (x, y, c, z = 6) => `<rect x="${x}" y="${y}" width="${z}" height="${z}" fill="${c}"/>`
      return ring + `<ellipse cx="236" cy="262" rx="40" ry="7" fill="#000" opacity=".35"/><g transform="translate(194 196)"><g class="pc-c">${sprite(CHEST_C, map, 0, 12, 6)}</g><g class="pc-o">${sprite(CHEST_O, map, 0, 0, 6)}<g shape-rendering="crispEdges" class="pc-s">${px(18, -6, '#fff3b0')}${px(42, -22, P.d4)}${px(58, -4, '#fff')}${px(30, -34, P.d3, 4)}</g></g></g>` + sparkle(46, 70, 3.4, P.d4, 'k-tw')
    },
  },
  // ───────────────────────── Slime saltarín
  {
    slug: 'slime-saltarin', name: 'Slime saltarín', rarity: 'raro', price: 1000, coll: 'pixel', min: 40, palettes: PAL,
    css: `.ps-j{transform-box:fill-box;transform-origin:50% 100%;animation:ps-j 1.6s steps(8) infinite}${KF('ps-j', '0%{transform:translateY(0) scale(1.12,.86)}12%{transform:translateY(-4px) scale(.94,1.08)}40%{transform:translateY(-30px) scale(.94,1.08)}60%{transform:translateY(-30px) scale(1,1)}86%{transform:translateY(0) scale(1.1,.88)}100%{transform:translateY(0) scale(1.12,.86)}')}.ps-sh{transform-box:fill-box;transform-origin:50% 50%;animation:ps-sh 1.6s steps(8) infinite}${KF('ps-sh', '0%,86%,100%{transform:scale(1);opacity:.5}40%,60%{transform:scale(.6);opacity:.25}')}`,
    back: () => '',
    front: (S, P) => {
      const sl = { o: P.d2, f: P.d1, h: P.d3, e: '#10131f' }
      const ring = pxRing(144, 144, 111, 123, 4, [P.lt(P.d1, 0.4), P.d1, P.dk(P.d1, 0.3)], P.d2)
      return ring + `<ellipse class="ps-sh" cx="144" cy="34" rx="30" ry="5" fill="#000" opacity=".5"/><g transform="translate(100 -26)"><g class="ps-j">${sprite(SLIME, sl, 0, 0, 6)}</g></g>` + sparkle(250, 60, 3.4, P.d4, 'k-tw') + sparkle(40, 220, 3, P.d3, 'k-tw').replace('<path', '<path style="animation-delay:-1s"')
    },
  },
  // ───────────────────────── Espadas cruzadas
  {
    slug: 'espadas-cruzadas', name: 'Espadas cruzadas', rarity: 'epico', price: 1800, coll: 'pixel', min: 52, pad: 24, palettes: PAL,
    css: `.pw-g{animation:pw-g 3.4s steps(1) infinite}${KF('pw-g', '0%,70%{opacity:0}72%,76%{opacity:1}78%,100%{opacity:0}')}`,
    back: (S, P) => {
      const C = 6
      const steel = '#c9d3e3', steelD = '#8793ad'
      // espada con la punta arriba-izquierda; guardia en (232,226)
      const sword = () => {
        let o = ''
        const x0 = 40, y0 = 34
        for (let i = 0; i < 31; i++) {
          const x = x0 + i * C, y = y0 + i * C
          o += `<rect x="${x - C}" y="${y}" width="${C}" height="${C}" fill="${P.d2}"/><rect x="${x}" y="${y}" width="${C}" height="${C}" fill="#fff"/><rect x="${x + C}" y="${y}" width="${C}" height="${C}" fill="${steel}"/><rect x="${x + 2 * C}" y="${y}" width="${C}" height="${C}" fill="${steelD}"/><rect x="${x + 3 * C}" y="${y}" width="${C}" height="${C}" fill="${P.d2}"/>`
        }
        o += `<rect x="${x0}" y="${y0 - C}" width="${C}" height="${C}" fill="${P.d2}"/><rect x="${x0 + C}" y="${y0 - C}" width="${C}" height="${C}" fill="${P.d2}"/>`
        const gx = x0 + 31 * C + C, gy = y0 + 31 * C
        // guardia: línea perpendicular (anti-diagonal), 9 celdas
        for (let k = -5; k <= 5; k++) {
          const edge = Math.abs(k) === 5
          o += `<rect x="${gx + k * C}" y="${gy - k * C}" width="${C}" height="${C}" fill="${edge ? P.d2 : P.d4}"/>`
          if (!edge) o += `<rect x="${gx + k * C}" y="${gy - k * C + C}" width="${C}" height="${C}" fill="${P.dk(P.d4, 0.45)}"/>`
        }
        for (let i = 1; i <= 3; i++) o += `<rect x="${gx + i * C}" y="${gy + i * C}" width="${C}" height="${C}" fill="${P.d1}"/><rect x="${gx + i * C + C}" y="${gy + i * C}" width="${C}" height="${C}" fill="${P.d2}"/><rect x="${gx + i * C - C}" y="${gy + i * C}" width="${C}" height="${C}" fill="${P.d2}"/>`
        o += `<rect x="${gx + 4 * C}" y="${gy + 4 * C}" width="${2 * C}" height="${2 * C}" fill="${P.d4}"/><rect x="${gx + 6 * C}" y="${gy + 4 * C}" width="${C}" height="${2 * C}" fill="${P.d2}"/><rect x="${gx + 4 * C}" y="${gy + 6 * C}" width="${3 * C}" height="${C}" fill="${P.d2}"/>`
        return `<g shape-rendering="crispEdges">${o}</g>`
      }
      const sw = sword()
      const glint = `<g class="pw-g" shape-rendering="crispEdges"><rect x="40" y="14" width="6" height="26" fill="#fff"/><rect x="27" y="27" width="32" height="6" fill="#fff"/></g>`
      return glow(S, P.d1, 0.14) + sw + mirror(sw) + glint
    },
    front: () => '',
  },
]
