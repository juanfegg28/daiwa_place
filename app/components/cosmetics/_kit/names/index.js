// @ts-nocheck
// EFECTOS DE NOMBRE — solo CSS (sin JS salvo dividir letras). 3 densidades:
//   full  = efecto completo · lite = sin animación ni elementos extra · plain = color sólido (accesible / ahorro)
// Contraste: el efecto nunca cambia el tamaño ni la fuente; el texto real siempre está en el DOM (lectores de pantalla).
import { makePalette, rgba } from '../core/color.js'
import { esc } from '../core/util.js'

const P4 = (rows) => rows.map(([id, name, d1, d2, d3, d4]) => ({ id, name, c: [d1, d2, d3, d4] }))
export const NAME_EFFECTS = []
// css(cls, P) -> string ; html(text, cls, P) -> string opcional (por defecto <span class>text</span>)
const def = (o) => NAME_EFFECTS.push(o)
const letters = (t, cls, fn) => `<span class="${cls}" aria-label="${esc(t)}">${[...t].map((ch, i) => `<span aria-hidden="true" style="${fn(i)}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</span>`
const GR = (P, a = 0) => `background-clip:text;-webkit-background-clip:text;color:transparent;-webkit-text-fill-color:transparent`

def({ slug: 'resplandor', name: 'Resplandor', rarity: 'comun', price: 500,
  palettes: P4([['luna', 'Luna', '#FFFFFF', '#0B1020', '#C8D8FF', '#8CA8FF'], ['rosa', 'Rosa', '#FFE0F0', '#200A18', '#FF8AC8', '#FF5CA8'], ['dorado', 'Dorado', '#FFF4D0', '#1C1204', '#FFD25C', '#FFB020'], ['menta', 'Menta', '#E0FFF4', '#041A14', '#5CFFC0', '#20E0A0']]),
  css: (c, P) => `.${c}{color:${P.d1};text-shadow:0 0 6px ${P.d3},0 0 14px ${P.d4},0 0 28px ${P.d4};animation:${c}-a 3.2s ease-in-out infinite alternate}@keyframes ${c}-a{from{text-shadow:0 0 4px ${P.d3},0 0 10px ${P.d4},0 0 18px ${P.d4}}to{text-shadow:0 0 8px ${P.d3},0 0 20px ${P.d4},0 0 38px ${P.d4}}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:0 0 8px ${P.d4}}` })

def({ slug: 'pixel', name: 'Pixel', rarity: 'raro', price: 1000,
  palettes: P4([['arcade', 'Arcade', '#FFE066', '#10122B', '#FF5C8A', '#3D7BFF'], ['verde', 'Game Boy', '#CADC9F', '#0F380F', '#8BAC0F', '#306230'], ['fuego', 'Fuego 8-bit', '#FFD27A', '#2A0A02', '#FF7A2A', '#C8301E'], ['hielo', 'Hielo', '#E8FBFF', '#08203A', '#7AD8FF', '#3D7BFF']]),
  css: (c, P) => `.${c}{color:${P.d1};text-shadow:1px 0 ${P.d1},0 1px ${P.d1},2px 2px 0 ${P.d3},3px 3px 0 ${P.d3},4px 4px 0 ${P.d4},5px 5px 0 ${P.d4};image-rendering:pixelated;animation:${c}-a 1s steps(2) infinite}@keyframes ${c}-a{50%{text-shadow:1px 0 ${P.d1},0 1px ${P.d1},2px 2px 0 ${P.d3},3px 3px 0 ${P.d3},4px 4px 0 ${P.d4},6px 6px 0 ${P.d4}}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:2px 2px 0 ${P.d3},4px 4px 0 ${P.d4}}` })

def({ slug: 'neon', name: 'Neón', rarity: 'raro', price: 1000,
  palettes: P4([['rosa', 'Rosa neón', '#FFE6F4', '#12041C', '#FF2DAA', '#FF7AD0'], ['cian', 'Cian', '#E6FCFF', '#03121C', '#10D8FF', '#7AF0FF'], ['verde', 'Verde ácido', '#F0FFE6', '#061404', '#5CFF2D', '#B8FF7A'], ['ambar', 'Ámbar', '#FFF6E0', '#1C1004', '#FF9A10', '#FFC85C']]),
  css: (c, P) => `.${c}{color:${P.d1};text-shadow:0 0 2px #fff,0 0 6px ${P.d3},0 0 14px ${P.d3},0 0 28px ${P.d3},0 0 46px ${P.d4};animation:${c}-a 5s steps(1) infinite}@keyframes ${c}-a{0%,18%,22%,62%,64%,100%{opacity:1}20%{opacity:.55}63%{opacity:.4}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:0 0 6px ${P.d3},0 0 16px ${P.d3}}` })

def({ slug: 'degradado', name: 'Degradado', rarity: 'raro', price: 900,
  palettes: P4([['atardecer', 'Atardecer', '#FF7A5C', '#1A0A20', '#FFC85C', '#B05CFF'], ['oceano', 'Océano', '#2DD4FF', '#04122A', '#5CFFC8', '#7A5CFF'], ['sakura', 'Sakura', '#FF8AC0', '#200A1C', '#FFD0E4', '#B08CFF'], ['bosque', 'Bosque', '#5CFF8A', '#04140C', '#E8FF7A', '#2DC8A0']]),
  css: (c, P) => `.${c}{background-image:linear-gradient(90deg,${P.d1},${P.d3},${P.d4},${P.d1});background-size:260% 100%;${GR(P)};animation:${c}-a 6s linear infinite}@keyframes ${c}-a{to{background-position:260% 0}}`,
  lite: (c, P) => `.${c}{background-image:linear-gradient(90deg,${P.d1},${P.d3},${P.d4});${GR(P)}}` })

def({ slug: 'destello', name: 'Destello', rarity: 'raro', price: 1100,
  palettes: P4([['plata', 'Plata', '#C8D0E8', '#0C1020', '#FFFFFF', '#8C9CD0'], ['oro', 'Oro', '#E8B84A', '#1A1204', '#FFFFFF', '#B8862A'], ['rosa', 'Rosa', '#FF9AC8', '#200A18', '#FFFFFF', '#C85C98'], ['cian', 'Cian', '#5CD8FF', '#04141C', '#FFFFFF', '#2A98C8']]),
  css: (c, P) => `.${c}{background-image:linear-gradient(110deg,${P.d1} 0 42%,${P.d3} 50%,${P.d1} 58% 100%);background-size:250% 100%;background-position:150% 0;${GR(P)};animation:${c}-a 3.4s ease-in-out infinite}@keyframes ${c}-a{0%{background-position:150% 0}60%,100%{background-position:-50% 0}}`,
  lite: (c, P) => `.${c}{color:${P.d1}}` })

def({ slug: 'maquina-de-escribir', name: 'Máquina de escribir', rarity: 'raro', price: 1100,
  palettes: P4([['tinta', 'Tinta', '#F2EDE0', '#14110C', '#E8D8A8', '#C8A050'], ['verde', 'Terminal', '#7AFFA8', '#04120A', '#C8FFE0', '#27F27A'], ['ambar', 'Ámbar', '#FFC85C', '#140C02', '#FFE6B0', '#FF9A10'], ['cian', 'Cian', '#7AE8FF', '#04121C', '#C8F6FF', '#10C8FF']]),
  html: (t, c) => `<span class="${c}" aria-label="${esc(t)}"><span aria-hidden="true" class="${c}-t" style="--n:${[...t].length}">${esc(t)}</span></span>`,
  css: (c, P) => `.${c}{display:inline-block;color:${P.d1}}.${c}-t{display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:bottom;border-right:.12em solid ${P.d4};width:calc(var(--n)*1ch);max-width:100%;animation:${c}-w 4.5s steps(var(--n)) infinite,${c}-b .7s step-end infinite}@keyframes ${c}-w{0%{width:0}55%,90%{width:calc(var(--n)*1ch)}100%{width:0}}@keyframes ${c}-b{50%{border-color:transparent}}`,
  lite: (c, P) => `.${c}{color:${P.d1}}.${c}-t{border-right:.1em solid ${P.d4}}` })

def({ slug: 'ola', name: 'Ola', rarity: 'raro', price: 1200,
  palettes: P4([['mar', 'Mar', '#7AD8FF', '#04122A', '#B8F0FF', '#2D9CFF'], ['coral', 'Coral', '#FF8A7A', '#200A08', '#FFC8BC', '#FF5C5C'], ['lila', 'Lila', '#C8A8FF', '#14082A', '#EFE4FF', '#8C5CFF'], ['lima', 'Lima', '#C8FF7A', '#0C1404', '#F0FFC8', '#7AE02D']]),
  html: (t, c) => letters(t, c, (i) => `animation-delay:${(-i * 0.12).toFixed(2)}s`),
  css: (c, P) => `.${c}{display:inline-block;color:${P.d1}}.${c}>span{display:inline-block;animation:${c}-w 1.8s ease-in-out infinite;text-shadow:0 2px 0 ${P.d4}}@keyframes ${c}-w{0%,100%{transform:translateY(0);color:${P.d1}}50%{transform:translateY(-.28em);color:${P.d3}}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:0 2px 0 ${P.d4}}.${c}>span{animation:none!important}` })

def({ slug: 'hielo', name: 'Hielo', rarity: 'raro', price: 1300,
  palettes: P4([['glaciar', 'Glaciar', '#DDF6FF', '#08203A', '#7AD8FF', '#2D9CFF'], ['escarcha', 'Escarcha', '#F0F8FF', '#10182A', '#B8D0FF', '#8CA8FF'], ['aurora', 'Aurora', '#DDFFF4', '#04201C', '#7AFFD8', '#2DC8B0'], ['rosado', 'Hielo rosa', '#FFE6F4', '#241020', '#FFB8E0', '#FF7AC0']]),
  css: (c, P) => `.${c}{background-image:linear-gradient(180deg,#fff 0%,${P.d1} 35%,${P.d3} 100%);${GR(P)};filter:drop-shadow(0 0 3px ${P.d4}) drop-shadow(0 1px 0 ${P.d4});animation:${c}-a 4s ease-in-out infinite alternate}@keyframes ${c}-a{from{filter:drop-shadow(0 0 2px ${P.d4}) drop-shadow(0 1px 0 ${P.d4})}to{filter:drop-shadow(0 0 7px ${P.d3}) drop-shadow(0 1px 0 ${P.d4})}}`,
  lite: (c, P) => `.${c}{background-image:linear-gradient(180deg,#fff,${P.d3});${GR(P)};filter:drop-shadow(0 0 3px ${P.d4})}` })

def({ slug: 'chispas', name: 'Chispas', rarity: 'raro', price: 1400,
  palettes: P4([['dorado', 'Dorado', '#FFE9A8', '#1C1204', '#FFD25C', '#FFFFFF'], ['rosa', 'Rosa', '#FFD0E8', '#200A18', '#FF8AC8', '#FFFFFF'], ['azul', 'Azul', '#D0E8FF', '#06122A', '#5CB8FF', '#FFFFFF'], ['verde', 'Verde', '#D0FFE4', '#04160C', '#5CFFA0', '#FFFFFF']]),
  html: (t, c) => `<span class="${c}" aria-label="${esc(t)}"><span aria-hidden="true">${esc(t)}</span>${[[-6, -8], [34, -10], [70, -6], [100, -9], [16, 12], [60, 14], [88, 11]].map(([x, y], i) => `<i class="${c}-s" style="left:${x}%;top:${50 + y * 2.4}%;animation-delay:${(-i * 0.43).toFixed(2)}s"></i>`).join('')}</span>`,
  css: (c, P) => `.${c}{position:relative;display:inline-block;color:${P.d1};text-shadow:0 0 8px ${P.d3}}.${c}-s{position:absolute;width:.34em;height:.34em;margin:-.17em;background:${P.d4};clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);filter:drop-shadow(0 0 3px ${P.d3});animation:${c}-t 2.4s ease-in-out infinite;opacity:0}@keyframes ${c}-t{0%,100%{transform:scale(0) rotate(0);opacity:0}45%{transform:scale(1) rotate(60deg);opacity:1}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:0 0 8px ${P.d3}}.${c}-s{display:none}` })

def({ slug: 'glitch', name: 'Glitch', rarity: 'epico', price: 1800,
  palettes: P4([['rgb', 'RGB', '#FFFFFF', '#0A0A14', '#FF2D6A', '#2DE8FF'], ['verde', 'Matriz', '#D8FFE8', '#020B07', '#27F27A', '#FF2DD0'], ['rojo', 'Alerta', '#FFE6E6', '#14040A', '#FF2D3B', '#2DA8FF'], ['violeta', 'Ultravioleta', '#F0E6FF', '#0A041C', '#A66CFF', '#FFD02D']]),
  html: (t, c) => `<span class="${c}" data-t="${esc(t)}">${esc(t)}</span>`,
  css: (c, P) => `.${c}{position:relative;display:inline-block;color:${P.d1}}.${c}::before,.${c}::after{content:attr(data-t);position:absolute;left:0;top:0;width:100%;overflow:hidden}.${c}::before{color:${P.d3};transform:translateX(-2px);clip-path:inset(0 0 55% 0);animation:${c}-a 2.6s steps(1) infinite}.${c}::after{color:${P.d4};transform:translateX(2px);clip-path:inset(55% 0 0 0);animation:${c}-b 2.1s steps(1) infinite}@keyframes ${c}-a{0%,86%{transform:translateX(-2px);clip-path:inset(0 0 55% 0)}88%{transform:translateX(-6px);clip-path:inset(20% 0 40% 0)}92%{transform:translateX(4px);clip-path:inset(60% 0 10% 0)}96%,100%{transform:translateX(-2px);clip-path:inset(0 0 55% 0)}}@keyframes ${c}-b{0%,78%{transform:translateX(2px);clip-path:inset(55% 0 0 0)}80%{transform:translateX(6px);clip-path:inset(10% 0 60% 0)}85%{transform:translateX(-4px);clip-path:inset(40% 0 30% 0)}90%,100%{transform:translateX(2px);clip-path:inset(55% 0 0 0)}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:-1px 0 ${P.d3},1px 0 ${P.d4}}.${c}::before,.${c}::after{display:none}` })

def({ slug: 'reflector', name: 'Reflector', rarity: 'epico', price: 2000,
  palettes: P4([['blanco', 'Blanco', '#FFFFFF', '#0A0A12', '#5A5A70', '#FFF6C8'], ['dorado', 'Dorado', '#FFE9A8', '#140E02', '#6A5A30', '#FFD25C'], ['rosa', 'Rosa', '#FFD0E8', '#18060F', '#6A3A58', '#FF8AC8'], ['cian', 'Cian', '#C8F6FF', '#04101A', '#3A5A6A', '#5CE8FF']]),
  css: (c, P) => `.${c}{background-image:radial-gradient(circle at var(--x,0%) 50%,${P.d1} 0,${P.d4} 12%,${P.d3} 34%);${GR(P)};animation:${c}-a 4.2s ease-in-out infinite alternate;filter:drop-shadow(0 0 6px ${P.d4}66)}@property --x{syntax:'<percentage>';inherits:false;initial-value:0%}@keyframes ${c}-a{from{--x:0%}to{--x:100%}}`,
  lite: (c, P) => `.${c}{color:${P.d1}}` })

def({ slug: 'sangre', name: 'Sangre', rarity: 'epico', price: 2000,
  palettes: P4([['carmesi', 'Carmesí', '#E0183A', '#10030A', '#FF8AA0', '#7A0A20'], ['vino', 'Vino', '#A01040', '#0E0208', '#E8A0B8', '#5A0820'], ['oscura', 'Sangre oscura', '#8A0E1E', '#080204', '#D06070', '#40040C'], ['neon', 'Sangre neón', '#FF2D55', '#12030A', '#FFB0C0', '#B01030']]),
  html: (t, c) => `<span class="${c}" aria-label="${esc(t)}"><span aria-hidden="true">${esc(t)}</span>${[[8, 0.5], [30, 0.9], [52, 0.65], [74, 1], [92, 0.55]].map(([x, s], i) => `<i class="${c}-d" style="left:${x}%;--s:${s};animation-delay:${(-i * 0.9).toFixed(1)}s"></i>`).join('')}</span>`,
  css: (c, P) => `.${c}{position:relative;display:inline-block;color:${P.d1};text-shadow:0 1px 0 ${P.d4},0 2px 6px ${P.d4}}.${c}-d{position:absolute;top:88%;width:.2em;height:.7em;margin-left:-.1em;background:linear-gradient(${P.d1},${P.d4});border-radius:0 0 .2em .2em;transform-origin:50% 0;animation:${c}-g 3.6s ease-in infinite}.${c}-d::after{content:'';position:absolute;bottom:-.1em;left:0;width:100%;height:.22em;border-radius:50%;background:${P.d1}}@keyframes ${c}-g{0%{transform:scaleY(.1)}55%{transform:scaleY(var(--s))}85%{transform:scaleY(var(--s)) translateY(.4em);opacity:1}100%{transform:scaleY(var(--s)) translateY(.9em);opacity:0}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:0 1px 0 ${P.d4},0 2px 6px ${P.d4}}.${c}-d{display:none}` })

def({ slug: 'holografico', name: 'Holográfico', rarity: 'epico', price: 2200,
  palettes: P4([['perla', 'Perla', '#FFFFFF', '#0E0A18', '#FFD0F0', '#C8E8FF'], ['arcoiris', 'Arcoíris', '#FF5CA8', '#0A0A18', '#5CE8FF', '#C8FF5C'], ['unicornio', 'Unicornio', '#C8A8FF', '#14081C', '#FFB0E8', '#A8F0FF'], ['cromo', 'Cromo', '#E0E0F0', '#08080C', '#8CA8D0', '#F0D0FF']]),
  css: (c, P) => `.${c}{background-image:linear-gradient(115deg,${P.d1},${P.d3},${P.d4},#fff,${P.d1},${P.d3},${P.d4});background-size:300% 100%;${GR(P)};animation:${c}-a 5s linear infinite;filter:drop-shadow(0 0 4px ${P.d3}88)}@keyframes ${c}-a{to{background-position:300% 0}}`,
  lite: (c, P) => `.${c}{background-image:linear-gradient(115deg,${P.d1},${P.d3},${P.d4});${GR(P)}}` })

def({ slug: 'fuego', name: 'Fuego', rarity: 'epico', price: 2200,
  palettes: P4([['llama', 'Llama', '#FFF0B0', '#1A0802', '#FF9A1E', '#E02A10'], ['azul', 'Llama azul', '#E8F6FF', '#020A1C', '#4FA8FF', '#2A4AE0'], ['verde', 'Fuego fatuo', '#EFFFE0', '#021408', '#5CFF6A', '#10A040'], ['violeta', 'Violeta', '#F6E8FF', '#0C041C', '#B05CFF', '#6A1AE0']]),
  css: (c, P) => `.${c}{color:${P.d1};text-shadow:0 0 3px ${P.d1},0 -2px 6px ${P.d3},0 -6px 10px ${P.d3},0 -10px 16px ${P.d4},0 -16px 24px ${P.d4}88;animation:${c}-a .5s ease-in-out infinite alternate}@keyframes ${c}-a{from{text-shadow:0 0 3px ${P.d1},0 -2px 6px ${P.d3},0 -5px 10px ${P.d3},0 -9px 14px ${P.d4},0 -14px 22px ${P.d4}88}to{text-shadow:0 0 3px ${P.d1},0 -3px 7px ${P.d3},0 -8px 12px ${P.d3},0 -13px 18px ${P.d4},0 -19px 28px ${P.d4}88}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:0 -3px 8px ${P.d3},0 -8px 14px ${P.d4}}` })

def({ slug: 'aurora', name: 'Aurora', rarity: 'epico', price: 2400,
  palettes: P4([['boreal', 'Boreal', '#5CFFC0', '#041420', '#7A8CFF', '#FF7AE0'], ['rosa', 'Rosa-lila', '#FF8AD0', '#14061C', '#9A8CFF', '#5CE8FF'], ['hielo', 'Hielo', '#7AE8FF', '#04101C', '#8CFFD8', '#B08CFF'], ['dorada', 'Dorada', '#FFD25C', '#140C04', '#FF8AA0', '#C88CFF']]),
  css: (c, P) => `.${c}{background-image:linear-gradient(100deg,${P.d1},${P.d3},${P.d4},${P.d1});background-size:300% 100%;${GR(P)};animation:${c}-a 7s ease-in-out infinite alternate;filter:drop-shadow(0 0 5px ${P.d1}99)}@keyframes ${c}-a{from{background-position:0 0}to{background-position:100% 0}}`,
  lite: (c, P) => `.${c}{background-image:linear-gradient(100deg,${P.d1},${P.d3},${P.d4});${GR(P)}}` })

def({ slug: 'oro-foil', name: 'Oro foil', rarity: 'legendario', price: 4500, custom: true,
  palettes: P4([['oro', 'Oro', '#E8B84A', '#1A1204', '#FFF1B8', '#8A5A10'], ['rosa', 'Oro rosa', '#E8A08A', '#1C0F0C', '#FFE2D6', '#8A4A3A'], ['platino', 'Platino', '#C8D0E0', '#0E1016', '#FFFFFF', '#6A748A'], ['fundador', 'Fundador', '#F0C860', '#1A1008', '#FFF6D0', '#7A4A10']]),
  css: (c, P) => `.${c}{background-image:linear-gradient(105deg,${P.d4} 0%,${P.d1} 18%,${P.d3} 30%,${P.d1} 44%,${P.d4} 60%,${P.d1} 78%,${P.d3} 90%,${P.d4} 100%);background-size:220% 100%;${GR(P)};filter:drop-shadow(0 1px 0 ${P.d4}) drop-shadow(0 0 6px ${P.d1}88);animation:${c}-a 4s ease-in-out infinite}@keyframes ${c}-a{0%,100%{background-position:0 0}50%{background-position:100% 0}}`,
  lite: (c, P) => `.${c}{background-image:linear-gradient(105deg,${P.d4},${P.d1},${P.d3},${P.d1},${P.d4});${GR(P)};filter:drop-shadow(0 1px 0 ${P.d4})}` })

// Kits nuevos
def({ slug: 'colmillos', name: 'Colmillos', rarity: 'epico', price: 2100, coll: 'crimson',
  palettes: P4([['sangre', 'Sangre', '#F2E8E4', '#0C0306', '#D6102F', '#FF9AAA'], ['vino', 'Vino', '#F0E0E6', '#0A0208', '#8C1034', '#E8A0B4'], ['rubi', 'Rubí', '#FFF0F2', '#08040A', '#F0204A', '#FFC2CC'], ['oxido', 'Óxido', '#FFEEE0', '#0E0503', '#E0481C', '#FFD2A8']]),
  html: (t, c) => `<span class="${c}" aria-label="${esc(t)}"><span aria-hidden="true">${esc(t)}</span><i class="${c}-f" style="left:16%"></i><i class="${c}-f" style="left:62%;animation-delay:-1.4s"></i></span>`,
  css: (c, P) => `.${c}{position:relative;display:inline-block;color:${P.d1};text-shadow:0 0 1px ${P.d3},0 2px 8px ${P.d3}99}.${c}-f{position:absolute;top:86%;width:.2em;height:.46em;margin-left:-.1em;background:linear-gradient(#fff,#e8dccc);clip-path:polygon(0 0,100% 0,50% 100%);filter:drop-shadow(0 1px 0 ${P.d3});animation:${c}-s 3.4s ease-in-out infinite}.${c}-f::after{content:'';position:absolute;left:50%;top:100%;width:.1em;height:.18em;margin-left:-.05em;background:${P.d3};border-radius:0 0 .1em .1em}@keyframes ${c}-s{0%,100%{transform:translateY(-.1em)}50%{transform:translateY(.05em)}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:0 2px 8px ${P.d3}99}.${c}-f{display:none}` })

def({ slug: 'tinta-rota', name: 'Tinta rota', rarity: 'epico', price: 2000, coll: 'emo',
  palettes: P4([['negro-rosa', 'Negro y rosa', '#F4F0F6', '#0A070C', '#FF3D9A', '#B8B8C6'], ['negro-violeta', 'Negro y violeta', '#F2EEF8', '#0B0712', '#9B5CFF', '#C0C0CE'], ['negro-rojo', 'Negro y rojo', '#F6F0F0', '#0C0506', '#E5233A', '#BCBCC8'], ['monocromo', 'Monocromo', '#FFFFFF', '#07070A', '#8A8A99', '#D0D0DC']]),
  css: (c, P) => `.${c}{color:${P.d1};-webkit-text-stroke:.5px ${P.d3};text-shadow:2px 2px 0 ${P.d2},-1px -1px 0 ${P.d3}88;animation:${c}-a 4s steps(1) infinite}.${c}::after{content:'';display:block;height:2px;margin-top:-.12em;background:repeating-linear-gradient(90deg,${P.d3} 0 5px,transparent 5px 9px);opacity:.9}@keyframes ${c}-a{0%,90%,100%{transform:none}92%{transform:translate(1px,-1px) skewX(-3deg)}94%{transform:translate(-1px,1px)}96%{transform:none}}`,
  lite: (c, P) => `.${c}{color:${P.d1};text-shadow:2px 2px 0 ${P.d3}}.${c}::after{display:none}` })

// ───────── Render: mode = 'full' | 'lite' | 'plain'
let N = 0
export function nameEffectHTML(effect, text, { paletteId, hue = 0, mode = 'full', uid } = {}) {
  const pd = effect.palettes.find((p) => p.id === paletteId) || effect.palettes[0]
  const P = makePalette(pd, hue)
  const cls = 'ne' + (uid || (++N).toString(36))
  if (mode === 'plain') return { css: `.${cls}{color:${P.d1}}`, html: `<span class="${cls}">${esc(text)}</span>` }
  const css = mode === 'lite' ? effect.lite(cls, P) : effect.css(cls, P)
  const html = effect.html && mode === 'full' ? effect.html(text, cls, P) : `<span class="${cls}">${esc(text)}</span>`
  return { css, html }
}
