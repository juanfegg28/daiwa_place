// @ts-nocheck
// MIEMBROS · EFECTOS DE NOMBRE (solo CSS). 3 densidades: full · lite (sin animación) · plain (color sólido, lo pone el motor).
import { rgba } from '../core/color.js'
import { esc } from '../core/util.js'
import { SP_PAL } from '../avatar/sp1.js'

const BASE = { rarity: 'mitico', price: 0, coll: 'supporters', custom: true, palettes: SP_PAL }
const GR = `background-clip:text;-webkit-background-clip:text;color:transparent;-webkit-text-fill-color:transparent`

// 1 · LUZ DE LUNA (Creciente): plata líquida con un destello que recorre y halo suave
const luz = {
  ...BASE, slug: 'luz-de-luna', name: 'Luz de luna',
  css: (c, P) => `.${c}{background-image:linear-gradient(105deg,transparent 0 40%,rgba(255,255,255,.95) 50%,transparent 60% 100%),linear-gradient(180deg,${P.d3} 0%,${P.d1} 55%,${P.dk(P.d1, 0.4)} 100%);background-size:260% 100%,100% 100%;background-position:160% 0,0 0;${GR};filter:drop-shadow(0 0 6px ${rgba(P.d1, 0.55)}) drop-shadow(0 0 16px ${rgba(P.d4, 0.35)});animation:${c}-a 4.6s ease-in-out infinite}@keyframes ${c}-a{0%{background-position:160% 0,0 0}60%,100%{background-position:-60% 0,0 0}}`,
  lite: (c, P) => `.${c}{background-image:linear-gradient(180deg,${P.d3},${P.d1} 60%,${P.dk(P.d1, 0.4)});${GR};filter:drop-shadow(0 0 5px ${rgba(P.d1, 0.5)})}`,
}

// 2 · SEDA Y PERLAS (Llena): satén con brillo diagonal, borde de perla y perlitas que parpadean
const seda = {
  ...BASE, slug: 'seda-y-perlas', name: 'Seda y perlas',
  html: (t, c) => `<span class="${c}" aria-label="${esc(t)}"><span aria-hidden="true">${esc(t)}</span><i class="${c}-p" style="left:8%;top:-.14em"></i><i class="${c}-p" style="left:46%;top:-.2em;animation-delay:-1.1s"></i><i class="${c}-p" style="left:86%;top:-.1em;animation-delay:-2.2s"></i></span>`,
  css: (c, P) => `.${c}{position:relative;display:inline-block}.${c}>span{background-image:linear-gradient(115deg,${P.dk(P.d1, 0.35)} 0%,${P.lt(P.d1, 0.55)} 18%,${P.d1} 34%,${P.d3} 50%,${P.d1} 66%,${P.dk(P.d4, 0.2)} 100%);background-size:240% 100%;${GR};-webkit-text-stroke:.45px ${rgba(P.d3, 0.8)};filter:drop-shadow(0 1px 0 ${P.dk(P.d1, 0.6)}) drop-shadow(0 0 8px ${rgba(P.d4, 0.5)});animation:${c}-s 6s ease-in-out infinite alternate}.${c}-p{position:absolute;width:.2em;height:.2em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 25%,${P.d3} 60%,${P.d4});box-shadow:0 0 6px ${rgba(P.d3, 0.9)};animation:${c}-t 2.6s ease-in-out infinite}@keyframes ${c}-s{from{background-position:0% 0}to{background-position:100% 0}}@keyframes ${c}-t{0%,100%{transform:scale(.55);opacity:.55}50%{transform:scale(1.15);opacity:1}}`,
  lite: (c, P) => `.${c}{background-image:linear-gradient(115deg,${P.lt(P.d1, 0.5)},${P.d1} 50%,${P.dk(P.d4, 0.2)});${GR};-webkit-text-stroke:.4px ${rgba(P.d3, 0.7)}}.${c}-p{display:none}`,
}

// 3 · AURA DE ECLIPSE (Eclipse): letra oscura con corona solar alrededor (contorno + resplandor latiendo) y chispas
const aura = {
  ...BASE, slug: 'aura-de-eclipse', name: 'Aura de eclipse',
  html: (t, c) => `<span class="${c}" aria-label="${esc(t)}"><span aria-hidden="true">${esc(t)}</span><i class="${c}-k" style="left:4%;top:.05em"></i><i class="${c}-k" style="left:30%;top:-.3em;animation-delay:-.9s"></i><i class="${c}-k" style="left:58%;top:.95em;animation-delay:-1.7s"></i><i class="${c}-k" style="left:92%;top:.1em;animation-delay:-2.4s"></i></span>`,
  css: (c, P) => `.${c}{position:relative;display:inline-block}.${c}>span{color:${P.dk(P.d2, 0.1)};-webkit-text-stroke:.9px ${P.d3};text-shadow:0 0 2px ${P.d1},0 0 9px ${rgba(P.d1, 0.95)},0 0 20px ${rgba(P.d1, 0.6)},0 0 38px ${rgba(P.d4, 0.45)};animation:${c}-a 3.8s ease-in-out infinite alternate}.${c}-k{position:absolute;width:.16em;height:.16em;background:${P.d3};clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);filter:drop-shadow(0 0 4px ${P.d1});animation:${c}-t 2.4s ease-in-out infinite}@keyframes ${c}-a{from{text-shadow:0 0 2px ${P.d1},0 0 6px ${rgba(P.d1, 0.7)},0 0 14px ${rgba(P.d1, 0.35)},0 0 26px ${rgba(P.d4, 0.2)}}to{text-shadow:0 0 2px ${P.d3},0 0 12px ${rgba(P.d1, 1)},0 0 28px ${rgba(P.d1, 0.75)},0 0 52px ${rgba(P.d4, 0.55)}}}@keyframes ${c}-t{0%,100%{transform:scale(.3) rotate(0);opacity:0}50%{transform:scale(1.1) rotate(45deg);opacity:1}}`,
  lite: (c, P) => `.${c}{color:${P.dk(P.d2, 0.1)};-webkit-text-stroke:.8px ${P.d3};text-shadow:0 0 8px ${rgba(P.d1, 0.9)},0 0 20px ${rgba(P.d1, 0.5)}}.${c}-k{display:none}`,
}

export const SP_NAMES = [luz, seda, aura]
