// @ts-nocheck
// Colección EMO ABISMO — súper emo / dark: corazones cosidos, tinta negra, tachuelas, telarañas, garabatos. Originales.
import { CX, CY, f, pol, rng, arc, band, smooth, sector } from '../core/util.js'
import { ctr, sparkle, glow, mirror, heartD, orbit, starD, featherD, wingLeft, leafD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('negro-rosa', 'Negro y rosa', '#FF3D9A', '#0A070C', '#FFC4E3', '#B8B8C6'),
  pal('negro-violeta', 'Negro y violeta', '#9B5CFF', '#0B0712', '#E0D0FF', '#C0C0CE'),
  pal('negro-rojo', 'Negro y rojo', '#E5233A', '#0C0506', '#FFC4CB', '#BCBCC8'),
  pal('monocromo', 'Monocromo', '#E8E8EE', '#07070A', '#FFFFFF', '#8A8A99'),
]
const ink = '#0a070c'

export const EMO = [
  // ───────────────────────── Corazón roto cosido
  {
    slug: 'corazon-roto-cosido', name: 'Corazón roto cosido', rarity: 'comun', price: 450, coll: 'emo', min: 40, palettes: PAL,
    css: `.eh-b{transform-box:fill-box;transform-origin:50% 50%;animation:eh-b 3s ease-in-out infinite}${KF('eh-b', '0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1.07) rotate(2deg)}')}.eh-t{transform-box:fill-box;transform-origin:50% 0;animation:eh-t 3.6s ease-in-out infinite alternate}${KF('eh-t', 'from{transform:rotate(-5deg)}to{transform:rotate(6deg)}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const stitch = `<circle cx="144" cy="144" r="116" fill="none" stroke="${ink}" stroke-width="9"/><circle cx="144" cy="144" r="116" fill="none" stroke="${P.d4}" stroke-width="1.4" stroke-dasharray="5 4" opacity=".85"/><circle cx="144" cy="144" r="111.8" fill="none" stroke="${P.d1}" stroke-width="1.4"/>`
      const hd = heartD(24)
      const half = (side) => `<clipPath id="x"/>`
      const L = S.clip(`<path d="M-40 -40H2L-3 -14L4 -2L-2 10L3 22L-1 40H-40Z"/>`)
      const Rr = S.clip(`<path d="M40 -40H2L-3 -14L4 -2L-2 10L3 22L-1 40H40Z"/>`)
      const stitches = [-12, 0, 12].map((y) => `<path d="M-6 ${y - 3}L6 ${y + 3}M6 ${y - 3}L-6 ${y + 3}" stroke="${P.d3}" stroke-width="1.7" stroke-linecap="round"/>`).join('')
      const heart = `<g transform="translate(214 216) scale(1.55)"><g class="eh-b"><g transform="translate(-2 0)" clip-path="${L}"><path d="${hd}" fill="${ink}" stroke="${P.d1}" stroke-width="2"/><path d="${hd}" fill="none" stroke="${P.d3}" stroke-opacity=".35" stroke-width=".8" transform="translate(-1.2 -1.2)"/></g><g transform="translate(2 0)" clip-path="${Rr}"><path d="${hd}" fill="${ink}" stroke="${P.d1}" stroke-width="2"/></g>${stitches}<path d="M-3 -14L4 -2L-2 10L3 22" stroke="${P.d1}" stroke-width="1.2" fill="none"/><g transform="translate(-14 -22) rotate(-30)"><path d="M0 0v18" stroke="${P.d4}" stroke-width="1.8" stroke-linecap="round"/><circle r="3" fill="none" stroke="${P.d4}" stroke-width="1.8"/><path d="M0 18C-4 18 -4 12 0 12" stroke="${P.d4}" stroke-width="1.6" fill="none"/></g><g class="eh-t"><path d="M6 8C14 22 8 34 12 46" stroke="${P.d3}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M-4 14C-10 26 -6 36 -12 46" stroke="${P.d3}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g></g></g>`
      return stitch + heart + sparkle(40, 56, 3, P.d3, 'k-tw') + sparkle(250, 70, 2.4, P.d1, 'k-tw').replace('<path', '<path style="animation-delay:-1.2s"')
    },
  },
  // ───────────────────────── Lágrimas negras
  {
    slug: 'lagrimas-negras', name: 'Lágrimas negras', rarity: 'raro', price: 900, coll: 'emo', min: 52, pad: 16, palettes: PAL,
    css: `.el-g{transform-box:fill-box;transform-origin:50% 0;animation:el-g 4.4s ease-in-out infinite}${KF('el-g', '0%,100%{transform:scaleY(.7)}50%{transform:scaleY(1.2)}')}.el-d{animation:el-d 4.4s ease-in infinite}${KF('el-d', '0%{transform:translateY(0);opacity:0}30%{opacity:1}100%{transform:translateY(34px);opacity:0}')}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const gloss = S.linU([[0, '#3a3340'], [0.5, ink], [1, '#000']], 30, 30, 260, 260)
      const ring = `<circle cx="144" cy="144" r="117" fill="none" stroke="${gloss}" stroke-width="12"/><circle cx="144" cy="144" r="117" fill="none" stroke="${P.d1}" stroke-opacity=".55" stroke-width="1.2" transform="translate(-1 -1)" stroke-dasharray="120 700" stroke-dashoffset="-380"/><circle cx="144" cy="144" r="111.6" fill="none" stroke="${P.d1}" stroke-width="1.4" opacity=".9"/>`
      const R = rng(30)
      let drips = ''
      const A = [38, 52, 66, 80, 94, 108, 122, 136, 150]
      A.forEach((a, i) => {
        const [x, y] = pol(0, 0, 118, a)
        const L = 14 + R() * 26
        drips += `<g transform="translate(${f(x)} ${f(y)})"><g class="el-g" style="animation-delay:${-(R() * 4).toFixed(1)}s"><path d="M-3.4 0V${f(L)}C-3.4 ${f(L + 5)} 3.4 ${f(L + 5)} 3.4 ${f(L)}V0Z" fill="${ink}"/><circle cy="${f(L + 2)}" r="4.2" fill="${ink}"/><circle cx="-1.2" cy="${f(L)}" r="1.1" fill="#fff" opacity=".5"/></g><circle class="el-d" style="animation-delay:${-(R() * 4).toFixed(1)}s" cy="${f(L + 8)}" r="2.2" fill="${ink}"/></g>`
      })
      return ring + ctr(drips) + sparkle(36, 56, 3, P.d3, 'k-tw') + sparkle(252, 62, 2.4, P.d1, 'k-tw').replace('<path', '<path style="animation-delay:-1s"')
    },
  },
  // ───────────────────────── Tachuelas y cadena
  {
    slug: 'tachuelas-y-cadena', name: 'Tachuelas y cadena', rarity: 'raro', price: 1100, coll: 'emo', min: 52, palettes: PAL,
    css: `.et-c{transform-box:fill-box;transform-origin:50% 0;animation:et-c 4.6s ease-in-out infinite alternate}${KF('et-c', 'from{transform:rotate(-4deg)}to{transform:rotate(5deg)}')}.et-s{animation:k-pu 3.4s ease-in-out infinite}`,
    back: (S, P) => glow(S, P.d1, 0.14),
    front: (S, P) => {
      const leather = S.linU([[0, '#2b2430'], [0.5, '#141018'], [1, '#07050a']], 30, 30, 260, 260)
      const metal = S.lin([[0, '#ffffff'], [0.4, P.d4], [1, '#55556a']], 0, 0, 1, 1)
      const strap = `<circle cx="144" cy="144" r="118" fill="none" stroke="#000" stroke-width="15"/><circle cx="144" cy="144" r="118" fill="none" stroke="${leather}" stroke-width="13"/><circle cx="144" cy="144" r="112.4" fill="none" stroke="${P.d1}" stroke-width="1.2" stroke-dasharray="4 3" opacity=".9"/><circle cx="144" cy="144" r="123.6" fill="none" stroke="${P.d1}" stroke-width="1.2" stroke-dasharray="4 3" opacity=".9"/>`
      let studs = ''
      for (let i = 0; i < 20; i++) { const a = i * 18 + 9; if (a > 105 && a < 160) continue; const [x, y] = pol(0, 0, 118, a); studs += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><circle r="5.2" fill="${metal}" stroke="#222" stroke-width=".8"/><path d="M0 -4L3.4 2.6L-3.4 2.6Z" fill="#fff" opacity=".45"/></g>` }
      const grom = (a) => { const [x, y] = pol(0, 0, 118, a); return `<g transform="translate(${f(x)} ${f(y)})"><circle r="5.6" fill="${metal}" stroke="#111" stroke-width=".9"/><circle r="2.4" fill="#000"/></g>` }
      const [bx, by] = pol(0, 0, 118, 60)
      const buckle = `<g transform="translate(${f(bx)} ${f(by)}) rotate(${60 + 90})"><rect x="-9" y="-12" width="18" height="24" rx="2.6" fill="none" stroke="${metal}" stroke-width="3.4"/><path d="M-9 0H9" stroke="${metal}" stroke-width="2.6"/><circle r="2" fill="${P.d1}"/></g>`
      const [cx0, cy0] = pol(0, 0, 118, 128)
      const links = (n) => { let o = ''; for (let i = 0; i < n; i++) o += i % 2 ? `<ellipse cy="${i * 7.2}" rx="1.8" ry="4.6" fill="none" stroke="${metal}" stroke-width="2"/>` : `<ellipse cy="${i * 7.2}" rx="3.6" ry="4.6" fill="none" stroke="${metal}" stroke-width="2.2"/>`; return o }
      const chain = `<g transform="translate(${f(cx0)} ${f(cy0)})"><g class="et-c">${grom(0).replace(/translate\([^)]*\)/, 'translate(0 0)')}<g transform="translate(0 6)">${links(6)}</g><g transform="translate(0 52) rotate(0)"><path d="${heartD(10)}" fill="${ink}" stroke="${P.d1}" stroke-width="1.6"/><path d="M-4 -3L0 1L4 -3" stroke="${P.d3}" stroke-width="1.2" fill="none"/></g></g></g>`
      return strap + ctr(studs + grom(-24) + grom(18) + grom(190) + grom(235) + buckle + chain) + sparkle(40, 58, 3, '#fff', 'k-tw')
    },
  },
  // ───────────────────────── Telaraña
  {
    slug: 'telarana', name: 'Telaraña', rarity: 'raro', price: 1000, coll: 'emo', min: 52, pad: 10, palettes: PAL,
    css: `.ew-s{transform-box:fill-box;transform-origin:50% 0;animation:ew-s 4s ease-in-out infinite alternate}${KF('ew-s', 'from{transform:rotate(-8deg)}to{transform:rotate(8deg)}')}.ew-l{animation:ew-l 4s ease-in-out infinite alternate}${KF('ew-l', 'from{transform:scaleY(.82)}to{transform:scaleY(1.1)}')}`,
    back: (S, P) => glow(S, P.d3, 0.1),
    front: (S, P) => {
      // red de araña en la esquina superior izquierda y arcos que abrazan el aro
      const O = [8, 8]
      const web = (cx, cy, R, rays, rings, a0, a1) => {
        let o = ''
        const pts = []
        for (let k = 0; k <= rays; k++) { const a = a0 + ((a1 - a0) * k) / rays; pts.push(a) }
        pts.forEach((a) => { const [x, y] = pol(cx, cy, R, a); o += `<path d="M${cx} ${cy}L${f(x)} ${f(y)}" stroke="${P.d4}" stroke-width=".9" opacity=".85"/>` })
        for (let r = 1; r <= rings; r++) {
          const rr = (R * r) / rings
          let d = ''
          pts.forEach((a, k) => { const [x, y] = pol(cx, cy, rr * (0.96 + (k % 2) * 0.02), a); d += (k ? `Q${f(pol(cx, cy, rr * 0.86, (pts[k - 1] + a) / 2)[0])} ${f(pol(cx, cy, rr * 0.86, (pts[k - 1] + a) / 2)[1])} ` : 'M') + f(x) + ' ' + f(y) + ' ' })
          o += `<path d="${d}" fill="none" stroke="${P.d4}" stroke-width="${r === rings ? 1.2 : 0.9}" opacity="${r === rings ? 0.95 : 0.7}"/>`
        }
        return o
      }
      const w1 = web(O[0], O[1], 150, 7, 7, 4, 86)
      const R = rng(9)
      let dew = ''
      for (let i = 0; i < 9; i++) { const a = 8 + R() * 74, r = 40 + R() * 100; const [x, y] = pol(O[0], O[1], r, a); dew += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.1 + R() * 1.3)}" fill="#fff" opacity=".85" class="k-tw" style="animation-delay:${-(R() * 3).toFixed(1)}s"/>` }
      const [sx, sy] = [98, 44]
      const spider = `<g transform="translate(${sx} ${sy})"><path d="M0 -${sy}V0" stroke="${P.d4}" stroke-width="1" opacity=".9"/><g class="ew-s"><g class="ew-l"><ellipse cy="6" rx="5.6" ry="7" fill="${ink}" stroke="${P.d1}" stroke-width="1"/><circle cy="-2" r="3.6" fill="${ink}" stroke="${P.d1}" stroke-width="1"/><path d="M-1.6 -3.4v2M1.6 -3.4v2" stroke="${P.d1}" stroke-width="1.2"/><path d="M-5 2L-12 -2L-15 4M-5 5L-13 6L-14 12M-5 8L-11 13L-9 18M5 2L12 -2L15 4M5 5L13 6L14 12M5 8L11 13L9 18" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 6v6" stroke="${P.d1}" stroke-width="1.6" stroke-linecap="round"/></g></g></g>`
      const hug = `<path d="${arc(116, 170, 292, 0, 0).replace(/^M/, 'M').replace(/(\d+\.?\d*) (\d+\.?\d*)/, '$1 $2')}" fill="none" stroke="none"/><circle cx="144" cy="144" r="113" fill="none" stroke="${P.d4}" stroke-width="1.2" opacity=".85"/><circle cx="144" cy="144" r="117.6" fill="none" stroke="${P.d4}" stroke-width=".8" opacity=".6" stroke-dasharray="2 3"/>`
      return hug + w1 + dew + spider + sparkle(252, 236, 3, P.d3, 'k-tw')
    },
  },
  // ───────────────────────── Garabatos de cuaderno
  (() => {
    const wob = (pts) => smooth(pts)
    const chalk = (P, d, fill = 'none', sw = 2) => `<path d="${d}" fill="${fill}" stroke="${P.d4}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`
    const doodles = (P) => [
      `<g>${chalk(P, 'M0 -13L4 -4L13 -4L6 2L9 12L0 6L-9 12L-6 2L-13 -4L-4 -4Z', P.mix('#0a070c', P.d1, 0.35))}${chalk(P, 'M-2 -7L2 -7', 'none', 1.2)}</g>`,
      `<g>${chalk(P, 'M0 10C-16 -2 -10 -14 -2 -10C0 -8 0 -6 0 -5C0 -8 2 -10 5 -10C13 -12 15 0 0 10Z', P.mix('#0a070c', P.d1, 0.55))}${chalk(P, 'M-9 -2C-6 -8 -2 -9 0 -6', 'none', 1.2)}</g>`,
      `<g>${chalk(P, 'M-10 -10L10 10M10 -10L-10 10', 'none', 3)}</g>`,
      `<g>${chalk(P, 'M4 -14L-6 2L1 2L-4 14L8 -3L1 -3Z', P.d1, 1.6)}</g>`,
      `<g>${chalk(P, 'M-9 12V-4C-9 -12 9 -12 9 -4V12Z', 'none', 2)}${chalk(P, 'M-4 -1V6M4 -1V6M-4 3H4', 'none', 1.6)}<text x="0" y="-12" text-anchor="middle" font-size="6" font-family="Georgia,serif" fill="${P.d4}">RIP</text></g>`,
      `<g>${chalk(P, 'M3 -13C-8 -13 -14 -3 -10 6C-6 14 6 15 12 9C4 10 -2 4 -1 -3C0 -8 3 -11 3 -13Z', P.mix('#0a070c', P.d4, 0.3))}${chalk(P, 'M9 -4L9 0M7 -2L11 -2', 'none', 1.4)}</g>`,
      `<g>${chalk(P, 'M-11 -2C-11 -14 11 -14 11 -2C11 4 6 6 6 11H-6C-6 6 -11 4 -11 -2Z', 'none', 2)}<circle cx="-4.6" cy="-2" r="2.6" fill="${P.d4}"/><circle cx="4.6" cy="-2" r="2.6" fill="${P.d4}"/>${chalk(P, 'M-3 11V7M0 11V7M3 11V7', 'none', 1.4)}</g>`,
    ]
    const build = (S, P) => {
      const D = doodles(P)
      const items = D.map((art, i) => ({ th: i * (360 / D.length), T: 16, art: `<g transform="scale(${1.5 + (i % 3) * 0.2})">${art}</g>` }))
      return orbit(S, { rx: 140, ry: 44, tilt: -12, items })
    }
    return {
      slug: 'garabatos-de-cuaderno', name: 'Garabatos de cuaderno', rarity: 'epico', price: 2000, coll: 'emo', min: 52, palettes: PAL, css: '',
      back: (S, P) => glow(S, P.d1, 0.16) + build(S, P).back,
      front: (S, P) => build(S, P).front + `<circle cx="144" cy="144" r="112.4" fill="none" stroke="${P.d4}" stroke-width="1.6" stroke-dasharray="7 3 1.5 3" opacity=".9"/>` + sparkle(36, 50, 3.4, P.d1, 'k-tw'),
    }
  })(),
  // ───────────────────────── Alas remendadas
  {
    slug: 'alas-remendadas', name: 'Alas remendadas', rarity: 'legendario', price: 5400, coll: 'emo', min: 80, pad: 80, custom: true, palettes: PAL,
    css: `.ea-f{transform-box:view-box;transform-origin:0 0;animation:ea-f 5.6s ease-in-out infinite alternate}${KF('ea-f', 'from{transform:rotate(3deg)}to{transform:rotate(-4.5deg)}')}.ea-t{transform-box:fill-box;transform-origin:50% 0;animation:eh-t 3.6s ease-in-out infinite alternate}${KF('eh-t', 'from{transform:rotate(-5deg)}to{transform:rotate(6deg)}')}`,
    back: (S, P) => {
      const cols = ['#000', '#15101b', '#2a2133', P.d4]
      const rows = [
        { n: 10, a: [126, 198], len: [66, 130], w: 16, stops: [[0, '#030204'], [0.6, '#17111f'], [1, '#2c2236']], style: 'shard', edgeOp: 0.35, span: [0, 1] },
        { n: 10, a: [136, 204], len: [52, 104], w: 16, stops: [[0, '#07050a'], [0.5, '#1c1525'], [1, '#322840']], style: 'shard', edgeOp: 0.45, span: [0.03, 0.98] },
        { n: 8, a: [146, 208], len: [30, 60], w: 14, stops: [[0, '#0c0911'], [1, '#241c2e']], style: 'round', edgeOp: 0.55, span: [0.06, 0.95] },
      ]
      const wl = wingLeft(S, { arm: [[92, 148], [26, 132], [4, 60]], rows, cols, shaft: true })
      // parches cosidos con puntadas
      const patch = (x, y, w, h, rot, col) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2" fill="${col}" stroke="#000" stroke-width="1"/><rect x="${-w / 2 + 2.2}" y="${-h / 2 + 2.2}" width="${w - 4.4}" height="${h - 4.4}" fill="none" stroke="${P.d4}" stroke-width="1" stroke-dasharray="3 2.4"/></g>`
      const pin = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-9 0H7" stroke="${P.d4}" stroke-width="2" stroke-linecap="round"/><path d="M7 0C12 0 12 6 7 6H-7" stroke="${P.d4}" stroke-width="1.6" fill="none"/><circle cx="-9" cy="0" r="2.2" fill="none" stroke="${P.d4}" stroke-width="1.4"/></g>`
      const tape = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})" opacity=".92"><rect x="-13" y="-4" width="26" height="8" fill="${P.d1}" opacity=".82"/><path d="M-13 -4V4M13 -4V4" stroke="#000" stroke-opacity=".4"/></g>`
      const thr = (x, y, d) => `<g transform="translate(${x} ${y})"><g class="ea-t" style="animation-delay:${-d}s"><path d="M0 0C4 8 -2 14 2 24C4 30 0 34 2 40" stroke="${P.d4}" stroke-width="1.2" fill="none" stroke-linecap="round"/></g></g>`
      const deco = patch(28, 96, 24, 16, -24, P.mix('#15101b', P.d1, 0.4)) + patch(8, 130, 18, 14, 14, P.d1) + tape(40, 56, -38) + tape(14, 80, 20) + pin(48, 120, -20) + pin(20, 64, 40) + thr(18, 140, 0) + thr(42, 150, 1.3)
      const wing = () => `<g transform="translate(92 148)"><g class="ea-f"><g transform="translate(-92 -148)">${wl}${deco}</g></g></g>`
      return glow(S, P.d1, 0.2, 0.7, 0.84) + wing() + mirror(wing())
    },
    front: (S, P) => `<circle cx="144" cy="144" r="112.4" fill="none" stroke="${P.d1}" stroke-width="2" opacity=".85"/><circle cx="144" cy="144" r="116" fill="none" stroke="#000" stroke-width="4" opacity=".7"/>`,
  },
]
