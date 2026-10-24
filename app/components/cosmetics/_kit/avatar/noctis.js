// @ts-nocheck
// Colección NOCTIS GÓTICO — estética dark/vampírica. Diseños originales hechos con código.
import { CX, CY, f, pol, rng, arc, band, smooth, T } from '../core/util.js'
import { at, ctr, g, mirror, sparkle, dot, chain, arcPoints, rose, leafD, wingLeft, featherD } from '../core/svg.js'
import { pal, spin, selfc, KF } from '../core/kit.js'

const PAL = [
  pal('carmesi', 'Carmesí', '#E6435F', '#4A0A1C', '#FFB8C6', '#F5C16B'),
  pal('plata', 'Plata', '#C9D4EA', '#2E3857', '#FFFFFF', '#8FA3D1'),
  pal('violeta', 'Violeta', '#A073FF', '#2B1262', '#E6D8FF', '#FF7AD9'),
  pal('oro', 'Oro', '#F2C14E', '#4F2E06', '#FFF1B8', '#E8605C'),
]

export const NOCTIS = [
  // ───────────────────────── Halo roto
  {
    slug: 'halo-roto', name: 'Halo roto', rarity: 'raro', price: 1100, coll: 'noctis', min: 40, palettes: PAL,
    css: `${spin('nh-a', 'nh-spin', 80)}${spin('nh-b', 'nh-spin', 110, true)}${selfc('nh-f')}.nh-f{animation:nh-fl 5s ease-in-out infinite alternate}${KF('nh-fl', 'from{transform:translateY(-2px) rotate(-6deg)}to{transform:translateY(3px) rotate(8deg)}')}${selfc('nh-s')}.nh-s{animation:nh-tw 3.2s ease-in-out infinite}${KF('nh-tw', '0%,100%{transform:scale(.35);opacity:.35}50%{transform:scale(1);opacity:1}')}`,
    back: (S, P) => {
      const gl = S.rad([[0.72, P.d1, 0], [0.8, P.d1, 0.4], [0.9, P.d1, 0.12], [1, P.d1, 0]], 144, 144, 144)
      return `<circle cx="144" cy="144" r="144" fill="${gl}"/>`
    },
    front: (S, P) => {
      const gr = S.linU([[0, P.d3], [0.5, P.d1], [1, P.d2]], -130, -130, 130, 130)
      const segs = [[-72, -14], [4, 52], [70, 120], [138, 160], [176, 238], [252, 284]]
      let ring = ''
      for (const [a0, a1] of segs) ring += `<path d="${band(128, a0, a1, (t) => 0.5 + 5.6 * Math.pow(Math.sin(Math.PI * t), 0.7), 26, 0, 0)}" fill="${gr}" stroke="${P.d3}" stroke-opacity=".5" stroke-width=".7"/>`
      let thin = ''
      for (const [a0, a1] of [[-60, -30], [20, 100], [150, 170], [190, 250], [262, 300]]) thin += `<path d="${arc(117, a0, a1, 0, 0)}" fill="none" stroke="${P.d4}" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`
      let tick = ''
      for (let a = 0; a < 360; a += 10) {
        const [x, y] = pol(0, 0, 137, a)
        tick += `<circle cx="${f(x)}" cy="${f(y)}" r="${a % 30 ? 0.7 : 1.3}" fill="${P.d3}" opacity="${a % 30 ? 0.35 : 0.7}"/>`
      }
      let shards = ''
      const sh = [[-6, 133, 0.9], [162, 132, 0.8], [238, 134, 1], [296, 131, 0.7], [-96, 134, 0.8]]
      sh.forEach(([a, r, s], i) => {
        const [x, y] = pol(0, 0, r, a)
        shards += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><g class="nh-f" style="animation-delay:${-i * 0.9}s"><path d="M0 ${-10 * s}L${4.2 * s} 0L0 ${10 * s}L${-4.2 * s} 0Z" fill="${P.d3}" stroke="${P.d1}" stroke-width=".8"/><path d="M0 ${-10 * s}L0 ${10 * s}" stroke="${P.d1}" stroke-opacity=".45" stroke-width=".6"/></g></g>`
      })
      let cracks = ''
      for (const a of [-14, 52, 120, 160, 238, 284]) {
        const [x0, y0] = pol(0, 0, 121, a), [x1, y1] = pol(0, 0, 138, a + (a % 2 ? 3 : -3))
        cracks += `<path d="M${f(x0)} ${f(y0)}L${f((x0 + x1) / 2 + 2)} ${f((y0 + y1) / 2)}L${f(x1)} ${f(y1)}" stroke="${P.d3}" stroke-opacity=".6" stroke-width=".8" fill="none"/>`
      }
      const sp = [[-40, 140, 5], [100, 139, 4], [212, 141, 4.5]].map(([a, r, s], i) => { const [x, y] = pol(0, 0, r, a); return sparkle(x, y, s, P.d3, 'nh-s').replace('<path', `<path style="animation-delay:${-i * 1.1}s"`) }).join('')
      return ctr(`<g class="nh-a">${ring}${tick}</g><g class="nh-b">${thin}${cracks}${shards}</g>${sp}`)
    },
  },
  // ───────────────────────── Cadenas flotantes
  {
    slug: 'cadenas-flotantes', name: 'Cadenas flotantes', rarity: 'raro', price: 900, coll: 'noctis', min: 52, palettes: PAL,
    css: `${spin('nc-a', 'nc-sw', 9, false, 'ease-in-out')}${KF('nc-sw', '0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.2deg)}')}${spin('nc-b', 'nc-sw2', 11, false, 'ease-in-out')}${KF('nc-sw2', '0%,100%{transform:rotate(2deg)}50%{transform:rotate(-2deg)}')}${selfc('nc-g')}.nc-g{animation:nc-gl 3.6s ease-in-out infinite}${KF('nc-gl', '0%,100%{opacity:.55}50%{opacity:1}')}`,
    back: (S, P) => {
      const m = S.rad([[0.7, P.d2, 0], [0.82, P.d2, 0.55], [1, P.d2, 0]], 144, 144, 144)
      return `<circle cx="144" cy="144" r="144" fill="${m}"/>`
    },
    front: (S, P) => {
      const metal = [P.d3, P.d1, P.d2]
      const top = arcPoints(124, 203, 337, 20, 0, 0)
      const bot = arcPoints(119, 18, 162, 24, 0, 0)
      const gem = (a, r, s) => {
        const [x, y] = pol(0, 0, r, a)
        return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})"><path d="M0 ${-6 * s}L${5 * s} 0L0 ${7 * s}L${-5 * s} 0Z" fill="${P.d4}" stroke="${P.d3}" stroke-width=".9"/><path d="M0 ${-6 * s}L${2 * s} 0L0 ${7 * s}Z" fill="#fff" opacity=".35"/></g>`
      }
      const cross = `<g transform="translate(0 ${f(119 + 20)})"><path d="M-1.6 -17h3.2v7h7v3.2h-7v17h-3.2v-17h-7v-3.2h7z" fill="${S.lin([[0, P.d3], [1, P.d1]], 0, 0, 1, 1)}" stroke="${P.d2}" stroke-width=".8"/><circle cy="-5" r="2.6" fill="${P.d4}" stroke="${P.d3}" stroke-width=".7"/></g><path d="M0 ${119 + 3}v${8}" stroke="${P.d1}" stroke-width="2"/>`
      const studs = [[-8], [188], [172], [8]].map(([a]) => { const [x, y] = pol(0, 0, 122, a); return `<circle cx="${f(x)}" cy="${f(y)}" r="5.4" fill="${S.rad([[0, P.d3], [1, P.d2]], x - 1.5, y - 1.5, 6)}" stroke="${P.d1}" stroke-width="1"/>` }).join('')
      return ctr(`<g class="nc-a">${chain(S, top, ...metal, 0.86)}${gem(240, 124, 1)}${gem(270, 124, 1.2)}${gem(300, 124, 1)}</g><g class="nc-b">${chain(S, bot, ...metal, 1)}${cross}</g>${studs}`)
    },
  },
  // ───────────────────────── Ojos en la sombra
  {
    slug: 'ojos-en-la-sombra', name: 'Ojos en la sombra', rarity: 'epico', price: 2000, coll: 'noctis', min: 56, palettes: PAL,
    css: `${spin('no-a', 'no-dr', 40)}${spin('no-b', 'no-dr', 55, true)}.no-e{transform-box:fill-box;transform-origin:50% 50%;animation:no-bl 6s infinite}${KF('no-bl', '0%,44%,50%,100%{transform:scaleY(1)}47%{transform:scaleY(.08)}')}${selfc('no-p')}.no-p{animation:no-pu 3s ease-in-out infinite}${KF('no-pu', '0%,100%{opacity:.35}50%{opacity:.8}')}`,
    back: (S, P) => {
      const r = rng(7)
      let w = ''
      for (let i = 0; i < 9; i++) {
        const a = (360 / 9) * i + r() * 20
        const [x, y] = pol(0, 0, 118 + r() * 8, a)
        const gr = S.radB([[0, P.d2, 0.85], [0.6, P.d2, 0.35], [1, P.d2, 0]])
        w += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(30 + r() * 14)}" ry="${f(16 + r() * 8)}" transform="rotate(${f(a + 90 + r() * 50 - 25)} ${f(x)} ${f(y)})" fill="${gr}"/>`
      }
      let w2 = ''
      for (let i = 0; i < 7; i++) {
        const a = (360 / 7) * i + 20
        const [x, y] = pol(0, 0, 112 + r() * 14, a)
        const gr = S.radB([[0, '#000', 0.7], [1, '#000', 0]])
        w2 += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(26 + r() * 12)}" ry="${f(14 + r() * 6)}" transform="rotate(${f(a + 90)} ${f(x)} ${f(y)})" fill="${gr}"/>`
      }
      const gl = S.rad([[0.74, P.d1, 0], [0.84, P.d1, 0.22], [1, P.d1, 0]], 144, 144, 144)
      return `<circle cx="144" cy="144" r="144" fill="${gl}"/>` + ctr(`<g class="no-a">${w}</g><g class="no-b">${w2}</g>`)
    },
    front: (S, P) => {
      const eye = (x, y, s, rotD, d) => {
        const halo = S.radB([[0, P.d1, 0.55], [1, P.d1, 0]])
        const iris = S.radB([[0, P.d3], [0.45, P.d1], [1, P.d2]], 0.5, 0.5, 0.5)
        const lid = S.lin([[0, '#2a2030'], [1, '#07040a']], 0, 0, 0, 1)
        return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rotD)}) scale(${s})"><circle r="19" fill="${halo}" class="no-p" style="animation-delay:${-d}s"/><g class="no-e" style="animation-delay:${-d * 1.7}s"><path d="M-12 0Q0 -10.5 12 0Q0 10.5 -12 0Z" fill="${lid}" stroke="${P.d1}" stroke-opacity=".55" stroke-width=".8"/><circle r="5.4" fill="${iris}"/><ellipse rx="1.25" ry="4.6" fill="#050207"/><circle cx="-1.8" cy="-2" r="1.2" fill="#fff" opacity=".85"/></g></g>`
      }
      const spots = [[200, 124, 1.15], [233, 128, 0.8], [262, 122, 1.05], [-30, 127, 0.75], [4, 123, 1.1], [60, 126, 0.9], [102, 122, 0.78], [150, 127, 1], [170, 135, 0.6], [-62, 134, 0.6]]
      let eyes = ''
      spots.forEach(([a, r, s], i) => { const [x, y] = pol(0, 0, r + 4, a); eyes += eye(x, y, s * 1.55, a + 90, i * 0.9) })
      const rim = `<circle cx="144" cy="144" r="112" fill="none" stroke="${S.linU([[0, P.d1], [0.5, '#000'], [1, P.d1]], 30, 30, 260, 260)}" stroke-width="2.4" opacity=".7"/>`
      return rim + ctr(eyes)
    },
  },
  // ───────────────────────── Corona de espinas
  {
    slug: 'corona-de-espinas', name: 'Corona de espinas', rarity: 'epico', price: 2200, coll: 'noctis', min: 56, palettes: PAL,
    css: `${spin('nt-a', 'nt-gl', 9)}${KF('nt-gl', 'to{transform:rotate(360deg)}')}${selfc('nt-p')}.nt-p{animation:nt-fall 7s ease-in infinite}${KF('nt-fall', '0%{transform:translateY(-6px) rotate(0);opacity:0}15%{opacity:.95}100%{transform:translateY(46px) rotate(120deg);opacity:0}')}${selfc('nt-s')}.nt-s{animation:nt-tw 4s ease-in-out infinite}${KF('nt-tw', '0%,100%{transform:scale(.3);opacity:.3}50%{transform:scale(1);opacity:1}')}`,
    back: (S, P) => {
      const gl = S.rad([[0.74, P.d1, 0], [0.82, P.d1, 0.25], [1, P.d1, 0]], 144, 144, 144)
      return `<circle cx="144" cy="144" r="144" fill="${gl}"/>`
    },
    front: (S, P) => {
      const N = 150
      const v1 = [], v2 = []
      for (let i = 0; i < N; i++) {
        const a = (360 * i) / N
        v1.push(pol(0, 0, 117 + 4.6 * Math.sin((a * 9 * Math.PI) / 180), a))
        v2.push(pol(0, 0, 117 - 4.6 * Math.sin((a * 9 * Math.PI) / 180), a))
      }
      const vg = S.linU([[0, P.d2], [0.5, P.d1], [1, P.d2]], -120, -120, 120, 120)
      const vines = `<path d="${smooth(v1, true)}" fill="none" stroke="${P.d2}" stroke-width="5.6" opacity=".85"/><path d="${smooth(v1, true)}" fill="none" stroke="${vg}" stroke-width="3.8"/><path d="${smooth(v2, true)}" fill="none" stroke="${vg}" stroke-width="3.6"/><path d="${smooth(v1, true)}" fill="none" stroke="${P.d3}" stroke-width=".9" stroke-opacity=".45" transform="translate(0 -1)"/>`
      const tg = S.lin([[0, P.d2], [1, P.d3]], 0, 1, 0, 0)
      const r = rng(11)
      let th = ''
      for (let i = 0; i < 44; i++) {
        const a = (360 * i) / 44 + r() * 4
        const out = i % 3 !== 2
        const [x, y] = pol(0, 0, 117 + (out ? 3 : -3), a)
        const L = 6 + r() * 6
        th += `<path transform="translate(${f(x)} ${f(y)}) rotate(${f(a + 90 + (out ? 180 : 0) + (r() * 40 - 20))})" d="M-2.3 0L0 ${f(-L)}L2.3 0Z" fill="${tg}" stroke="${P.d2}" stroke-width=".5"/>`
      }
      const leaf = (a, rr, side) => { const [x, y] = pol(0, 0, rr, a); return `<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90 + side * 62})" d="${leafD(15, 5)}" fill="${P.mix(P.d2, '#10281a', 0.65)}" stroke="${P.d1}" stroke-opacity=".5" stroke-width=".6"/>` }
      let roses = ''
      const RS = [[-128, 17], [-52, 13], [88, 15], [168, 9]]
      for (const [a, s] of RS) {
        const [x, y] = pol(0, 0, 119, a)
        roses += leaf(a - 14, 120, -1) + leaf(a + 14, 120, 1) + rose(S, x, y, s, P.d1, P.d2, P.d3, { rot: a })
      }
      const gl = `<g class="nt-a">${[0].map(() => sparkle(117, 0, 7, P.d3, 'nt-s')).join('')}</g>`
      let pet = ''
      for (let i = 0; i < 3; i++) {
        const [x, y] = pol(0, 0, 124, 88 + (i - 1) * 24)
        pet += `<g transform="translate(${f(x)} ${f(y)})"><path class="nt-p" style="animation-delay:${-i * 2.4}s" d="M0 0C-3 -3 -5 2 -1 5C3 3 4 -2 0 0Z" fill="${P.d1}"/></g>`
      }
      return ctr(vines + th + roses + gl + pet)
    },
  },
  // ───────────────────────── Aura carmesí
  {
    slug: 'aura-carmesi', name: 'Aura carmesí', rarity: 'epico', price: 2400, coll: 'noctis', min: 52, palettes: PAL,
    css: `.na-t{transform-box:fill-box;transform-origin:50% 100%;animation:na-fl 2.4s ease-in-out infinite alternate}${KF('na-fl', 'from{transform:scaleY(.82) scaleX(1.06) skewX(-4deg)}to{transform:scaleY(1.12) scaleX(.94) skewX(5deg)}')}${spin('na-a', 'na-sp', 50)}${spin('na-b', 'na-sp', 70, true)}.na-br{transform-box:fill-box;transform-origin:50% 50%;animation:na-br 4s ease-in-out infinite}${KF('na-br', '0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}')}.na-e{animation:na-up 3.4s ease-out infinite}${KF('na-up', '0%{transform:translateY(8px);opacity:0}20%{opacity:1}100%{transform:translateY(-34px);opacity:0}')}`,
    back: (S, P) => {
      const big = S.rad([[0.66, P.d1, 0], [0.76, P.d1, 0.65], [0.86, P.d1, 0.28], [1, P.d1, 0]], 144, 144, 144)
      const r = rng(5)
      let tongues = ''
      const N = 22
      for (let i = 0; i < N; i++) {
        const a = (360 / N) * i + r() * 6
        const L = 22 + r() * 16
        const gr = S.lin([[0, P.d1, 0.95], [0.5, P.d4, 0.5], [1, P.d3, 0]], 0, 1, 0, 0)
        tongues += `<g transform="translate(${f(pol(0, 0, 106, a)[0])} ${f(pol(0, 0, 106, a)[1])}) rotate(${f(a + 90)})"><path class="na-t" style="animation-delay:${-r() * 2.4}s" d="M-7 0C-6 ${-L * 0.4} -2 ${-L * 0.7} 0 ${-L}C3 ${-L * 0.65} 7 ${-L * 0.35} 7 0Z" fill="${gr}"/></g>`
      }
      const sw = (rr, a0, a1) => `<path d="${arc(rr, a0, a1, 0, 0)}" fill="none" stroke="${P.d3}" stroke-opacity=".35" stroke-width="2.6" stroke-linecap="round"/>`
      return `<circle cx="144" cy="144" r="144" fill="${big}"/>` + ctr(`<g class="na-a">${tongues}${sw(124, 10, 70)}${sw(122, 150, 210)}${sw(125, 260, 310)}</g><g class="na-b">${sw(130, 80, 130)}${sw(129, 220, 250)}${sw(131, 320, 350)}</g>`)
    },
    front: (S, P) => {
      const rim = S.linU([[0, P.d3], [0.5, P.d1], [1, P.d4]], 30, 30, 260, 260)
      const r = rng(9)
      let em = ''
      for (let i = 0; i < 14; i++) {
        const a = r() * 360
        const [x, y] = pol(0, 0, 112 + r() * 20, a)
        em += `<circle class="na-e" style="animation-delay:${-r() * 3.4}s" cx="${f(x)}" cy="${f(y)}" r="${f(0.9 + r() * 1.8)}" fill="${r() > 0.5 ? P.d3 : P.d4}"/>`
      }
      return `<circle class="na-br" cx="144" cy="144" r="113.5" fill="none" stroke="${rim}" stroke-width="3.4"/><circle cx="144" cy="144" r="110" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/>` + ctr(em)
    },
  },
  // ───────────────────────── Alas de cuervo
  {
    slug: 'alas-de-cuervo', name: 'Alas de cuervo', rarity: 'legendario', price: 5200, coll: 'noctis', min: 80, pad: 76, custom: true, palettes: PAL,
    css: `.nw-f{transform-box:view-box;transform-origin:0 0;animation:nw-fl 5.5s ease-in-out infinite alternate}${KF('nw-fl', 'from{transform:rotate(3.5deg)}to{transform:rotate(-4deg)}')}.nw-d{transform-box:fill-box;transform-origin:center;animation:nw-dr 9s ease-in infinite}${KF('nw-dr', '0%{transform:translate(0,-6px) rotate(0);opacity:0}12%{opacity:.9}100%{transform:translate(-18px,70px) rotate(160deg);opacity:0}')}`,
    back: (S, P) => {
      const cols = [P.dk(P.d2, 0.6), P.d2, P.mix(P.d1, P.d2, 0.4), P.d3]
      const rows = [
        { n: 11, a: [128, 196], len: [64, 118], w: 17, fill: 0, mid: 0, tip: 1, span: [0.02, 1], pow: 1.1, edgeOp: 0.12 },
        { n: 11, a: [136, 200], len: [50, 98], w: 17, fill: 0, mid: 1, tip: 2, span: [0.04, 0.98], edgeOp: 0.22 },
        { n: 9, a: [146, 204], len: [28, 54], w: 14, fill: 1, mid: 2, tip: 2, span: [0.06, 0.96], style: 'round', edgeOp: 0.35 },
      ]
      const wl = wingLeft(S, { arm: [[92, 148], [34, 118], [14, 46]], rows, style: 'pointed', cols })
      const wing = () => `<g transform="translate(92 148)"><g class="nw-f"><g transform="translate(-92 -148)">${wl}</g></g></g>`
      let feathers = ''
      for (let i = 0; i < 3; i++) {
        feathers += `<g transform="translate(${6 + i * 20} ${190 + i * 14}) rotate(${-40 + i * 25})"><path class="nw-d" style="animation-delay:${-i * 2.8}s" d="${featherD(20, 5, 'pointed')}" fill="${P.d2}" stroke="${P.d3}" stroke-opacity=".5" stroke-width=".6"/></g>`
      }
      return wing() + mirror(wing()) + feathers + mirror(feathers)
    },
    front: () => '',
  },
]
