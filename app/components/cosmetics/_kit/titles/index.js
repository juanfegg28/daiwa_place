// @ts-nocheck
// TÍTULOS (17 de la spec + 4 de los kits nuevos + 15 exclusivos por completar colección),
// INSIGNIAS DE COLECCIÓN (16 + Fundador) y PACKS.
import { makePalette, rgba, mix } from '../core/color.js'
import { esc, f, pol } from '../core/util.js'
import { Canvas, starD, heartD } from '../core/svg.js'

const TP = (a, b, c, d) => [{ id: 'a', name: 'Principal', c: [a, '#0d0b14', c, d] }, { id: 'b', name: 'Rosa', c: ['#FF7AB8', '#16081a', '#FFD0E6', '#FFB070'] }, { id: 'c', name: 'Cian', c: ['#4FD8FF', '#04121c', '#C8F4FF', '#8C9CFF'] }, { id: 'd', name: 'Dorado', c: ['#F0C050', '#1a1204', '#FFF1B8', '#E08A30'] }]
const t = (name, rarity, price, glyph, coll, base) => ({ slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, rarity, price, glyph, coll: coll || 'base', palettes: TP(base[0], base[1], base[2], base[3]) })
export const TITLES = [
  t('Alma nocturna', 'comun', 200, '☾', null, ['#9D8CFF', 0, '#E2DCFF', '#C8C0FF']), t('Lector de sombras', 'comun', 200, '❦', null, ['#B8A0D8', 0, '#EEE4FF', '#9078C0']), t('Amante del lofi', 'comun', 200, '♪', null, ['#FFB86A', 0, '#FFE6C0', '#FF8AA0']),
  t('Coleccionista de estrellas', 'comun', 200, '✦', null, ['#FFD84A', 0, '#FFF4B8', '#FF9AD8']), t('Viajero del bosque', 'comun', 200, '❧', null, ['#5CD69A', 0, '#C8FFE4', '#F4E27A']),
  t('Reina de la noche', 'raro', 400, '♛', null, ['#B07CFF', 0, '#EADBFF', '#FFD0F0']), t('Rey sin corona', 'raro', 400, '♚', null, ['#C8A050', 0, '#FFF0C0', '#8C6A2A']), t('Guardián de secretos', 'raro', 400, '⚿', null, ['#7AA8FF', 0, '#D8E6FF', '#A0A0D8']),
  t('Bibliotecario nocturno', 'raro', 400, '❡', null, ['#C9803A', 0, '#FFD9A0', '#7AA06A']), t('Ángel de guarda', 'raro', 400, '✧', null, ['#9AD8FF', 0, '#F0FAFF', '#FFE08A']), t('Estrella fugaz', 'raro', 400, '★', null, ['#FFD25C', 0, '#FFF1B8', '#FF9A5C']), t('Voz del club', 'raro', 400, '♬', null, ['#FF5C9A', 0, '#FFC8DE', '#B07CFF']),
  t('Soberano del terciopelo', 'epico', 600, '♛', null, ['#B3122E', 0, '#FF9BAA', '#E2B85A']), t('Hechicera lunar', 'epico', 600, '☽', null, ['#8F7CFF', 0, '#DDD4FF', '#FFD98A']), t('Samurái sin amo', 'epico', 600, '⚔', null, ['#D8362A', 0, '#FFC8C0', '#F0E0B0']), t('Dueña de la luna', 'epico', 600, '☾', null, ['#C8D4FF', 0, '#FFFFFF', '#8C9CFF']), t('Cazador de eclipses', 'epico', 600, '◍', null, ['#FFC94A', 0, '#FFF0C0', '#FF7A3D']),
  // kits nuevos
  t('Hijo de la luna roja', 'raro', 400, '●', 'crimson', ['#D6102F', 0, '#FF9AAA', '#FFB07A']), t('Sed eterna', 'epico', 600, '♦', 'crimson', ['#E0184A', 0, '#FFC2CC', '#9A9AA8']),
  t('Corazón remendado', 'raro', 400, '♥', 'emo', ['#FF3D9A', 0, '#FFC4E3', '#B8B8C6']), t('Alma en tinta', 'epico', 600, '✕', 'emo', ['#9B5CFF', 0, '#E0D0FF', '#C0C0CE']),
  // Halloween (1.5.0)
  t('Guardián de la cripta', 'epico', 600, '☠', 'cripta', ['#C9CDD8', 0, '#F4EFE6', '#C0142E']), t('Portador de plata', 'raro', 400, '†', 'cruces', ['#D4D8E4', 0, '#FFFFFF', '#7A86A8']),
  t('Cazador de calabazas', 'raro', 400, '●', 'calabaza', ['#FF8A1F', 0, '#FFC46B', '#8B8B84']), t('Heraldo del cuervo', 'epico', 600, '❦', 'cuervo', ['#D5DAE5', 0, '#FFFFFF', '#7C8499']),
  t('Dama del salón gris', 'raro', 400, '❧', 'barroco', ['#BFC3CC', 0, '#FFFFFF', '#6C707A']), t('Duerme tranquilo', 'epico', 600, '✕', 'creepy', ['#F2F2F2', 0, '#FFFFFF', '#B3141E']),
  t('Archivo trece', 'raro', 400, '▣', 'creepy', ['#B8433B', 0, '#F4D6D0', '#FFFFFF']), t('Sonrisa en la niebla', 'epico', 600, '◡', 'creepy', ['#B9C4C0', 0, '#E8F0EC', '#B01818']),
  t('Niña de ceniza', 'raro', 400, '❀', 'creepy', ['#F2F2F2', 0, '#FFFFFF', '#8A8A92']), t('Noble de la bruma azul', 'epico', 800, '✦', 'vampiro', ['#7FD6E6', 0, '#CFF3F8', '#3F7FA6']),
]
// Títulos EXCLUSIVOS (se obtienen al completar una colección; no se compran)
export const COMPLETION_TITLES = { noctis: 'Heredero del cuervo', velvet: 'Dama de terciopelo', sakura: 'Guardiana del cerezo', magica: 'Archimago lunar', neon: 'Fantasma de la red', pixel: 'Jugador final', samurai: 'Ronin del alba', academia: 'Maestro de archivos', cosmos: 'Navegante de eclipses', bosque: 'Guardián del claro', cielo: 'Caído y redimido', oro: 'Su Dorada Majestad', lofi: 'Mente en calma', crimson: 'Sangre de medianoche', emo: 'Corazón de tinta' }

// Pastilla de título. Común = plana · Raro = borde degradado · Épico = borde animado con brillo.
export function titleHTML(title, { paletteId, hue = 0, uid = 't' } = {}) {
  const pd = title.palettes.find((p) => p.id === paletteId) || title.palettes[0]
  const P = makePalette(pd, hue)
  const g = `<span style="margin-right:5px;opacity:.95">${title.glyph}</span>`
  const base = 'display:inline-flex;align-items:center;padding:3px 11px;border-radius:99px;font:600 12px system-ui,sans-serif;letter-spacing:.2px;white-space:nowrap;'
  if (title.rarity === 'comun') return { css: '', html: `<span style="${base}background:${rgba(P.d1, 0.16)};border:1px solid ${rgba(P.d1, 0.5)};color:${P.d3}">${g}${esc(title.name)}</span>` }
  if (title.rarity === 'raro') return { css: '', html: `<span style="${base}position:relative;background:linear-gradient(${rgba('#0d0b14', 0.9)},${rgba('#0d0b14', 0.9)}) padding-box,linear-gradient(120deg,${P.d1},${P.d4}) border-box;border:1.4px solid transparent;color:${P.d3};box-shadow:0 0 10px ${rgba(P.d1, 0.28)}"><span style="color:${P.d1};margin-right:5px">${title.glyph}</span>${esc(title.name)}</span>` }
  const k = 'tt' + uid
  return { css: `.${k}{${base}position:relative;overflow:hidden;background:linear-gradient(#0d0b14,#0d0b14) padding-box,linear-gradient(110deg,${P.d1},${P.d4},${P.d3},${P.d1}) border-box;background-size:auto,300% 100%;border:1.6px solid transparent;color:${P.d3};box-shadow:0 0 14px ${rgba(P.d1, 0.4)};animation:${k}-b 4s linear infinite}.${k}::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:${k}-s 3.2s ease-in-out infinite}@keyframes ${k}-b{to{background-position:0 0,300% 0}}@keyframes ${k}-s{0%{left:-60%}55%,100%{left:130%}}`, html: `<span class="${k}"><span style="color:${P.d1};margin-right:5px">${title.glyph}</span>${esc(title.name)}</span>` }
}

// ───────── INSIGNIAS DE COLECCIÓN (emblemas 64×64)
const BP = {
  noctis: ['#8B6CFF', '#0B0814', '#D9CCFF', '#C9A24A'], velvet: ['#B3122E', '#1C0309', '#FF9BAA', '#E2B85A'], sakura: ['#FF7EB6', '#2A0F20', '#FFE3F0', '#FFD25C'], magica: ['#9D8CFF', '#0A0A24', '#E2DCFF', '#FFD98A'], neon: ['#2EE6FF', '#02090F', '#C2F7FF', '#FF4DD8'], pixel: ['#4C7DFF', '#0B1030', '#BBD0FF', '#FFD23F'],
  samurai: ['#D8362A', '#14090A', '#FFC8C0', '#F0E0B0'], academia: ['#C9803A', '#1E1008', '#FFD9A0', '#7AA06A'], cosmos: ['#8F6BFF', '#070718', '#D9CCFF', '#FF8AD0'], bosque: ['#3ED68A', '#041410', '#C8FFE4', '#F4E27A'], cielo: ['#9AD8FF', '#0A1424', '#F0FAFF', '#FFE08A'], oro: ['#E8B84A', '#1A1206', '#FFF0B8', '#8A5A10'], lofi: ['#B79AFF', '#150F28', '#EBDDFF', '#FFB86A'],
  cripta: ['#C9CDD8', '#0C0709', '#F4EFE6', '#C0142E'], cruces: ['#D4D8E4', '#070708', '#FFFFFF', '#7A86A8'], calabaza: ['#FF8A1F', '#140D08', '#FFC46B', '#8B8B84'], cuervo: ['#D5DAE5', '#07080C', '#FFFFFF', '#7C8499'], barroco: ['#BFC3CC', '#0C0C0F', '#FFFFFF', '#6C707A'], creepy: ['#F2F2F2', '#060606', '#FFFFFF', '#B3141E'], vampiro: ['#7FD6E6', '#06151C', '#CFF3F8', '#3F7FA6'],
  crimson: ['#D6102F', '#0C0306', '#FF9AAA', '#FFB07A'], emo: ['#FF3D9A', '#0A070C', '#FFC4E3', '#B8B8C6'], miticas: ['#FFC94A', '#05030A', '#FFF0C0', '#FF7A3D'], fundador: ['#F0C860', '#1A1008', '#FFF6D0', '#7A4A10'],
}
const SHAPES = { hex: 'M32 3L58 17V47L32 61L6 47V17Z', shield: 'M32 3L57 10V32C57 46 46 56 32 61C18 56 7 46 7 32V10Z', circle: 'M32 3A29 29 0 1 1 31.9 3Z', diamond: 'M32 2L61 32L32 62L3 32Z', round: 'M14 4H50Q60 4 60 14V50Q60 60 50 60H14Q4 60 4 50V14Q4 4 14 4Z', oct: 'M20 3H44L61 20V44L44 61H20L3 44V20Z' }
const BADGES = {
  noctis: ['shield', (P) => `<path d="M32 14A18 18 0 1 0 46 38A14 14 0 1 1 32 14Z" fill="${P.d3}"/><path d="M12 48L20 40M44 40L52 48" stroke="${P.d4}" stroke-width="2.6" stroke-linecap="round"/>`],
  velvet: ['round', (P) => `<path d="M32 30C22 18 10 22 12 32C14 42 26 38 32 30C38 38 50 42 52 32C54 22 42 18 32 30Z" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.4"/><circle cx="32" cy="30" r="4.4" fill="${P.d4}"/><path d="M28 34L22 50M36 34L42 50" stroke="${P.d4}" stroke-width="3" stroke-linecap="round"/>`],
  sakura: ['circle', (P) => `${[0, 72, 144, 216, 288].map((a) => `<path transform="translate(32 32) rotate(${a})" d="M0 0C-9 -4 -10 -16 -3 -21L0 -17L3 -21C10 -16 9 -4 0 0Z" fill="${P.d3}" stroke="${P.d4}" stroke-width=".8"/>`).join('')}<circle cx="32" cy="32" r="4" fill="${P.d4}"/>`],
  magica: ['hex', (P) => `<circle cx="32" cy="32" r="17" fill="none" stroke="${P.d3}" stroke-width="2"/><path d="${starD(5, 15, 6, -90).replace(/M([\d.-]+) ([\d.-]+)/, (m, x, y) => `M${f(+x + 32)} ${f(+y + 32)}`)}" fill="none"/><g transform="translate(32 32)"><path d="${starD(6, 15, 7.5, -90)}" fill="${P.d4}" opacity=".95"/></g>`],
  neon: ['hex', (P) => `<path d="M36 10L20 34H31L27 54L45 28H34Z" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.6" stroke-linejoin="round"/>`],
  pixel: ['round', (P) => { const c = [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [3, 5]]; return `<g transform="translate(14 17)">${c.map(([x, y]) => `<rect x="${x * 5}" y="${y * 5}" width="5" height="5" fill="${P.d4}" shape-rendering="crispEdges"/>`).join('')}</g>` }],
  samurai: ['circle', (P) => `<circle cx="32" cy="32" r="14" fill="${P.d1}"/><path d="M14 52L50 12" stroke="${P.d4}" stroke-width="3" stroke-linecap="round"/><path d="M12 50L18 56" stroke="${P.d3}" stroke-width="4" stroke-linecap="round"/>`],
  academia: ['shield', (P) => `<path d="M32 22C24 17 16 18 12 22V46C16 42 24 42 32 47C40 42 48 42 52 46V22C48 18 40 17 32 22Z" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.6"/><path d="M32 22V47" stroke="${P.d4}" stroke-width="1.6"/><path d="M17 28H27M17 33H27M37 28H47M37 33H47" stroke="${P.d4}" stroke-width="1.2" opacity=".7"/>`],
  cosmos: ['circle', (P) => `<circle cx="32" cy="32" r="12" fill="${P.d3}"/><ellipse cx="32" cy="32" rx="25" ry="7" transform="rotate(-20 32 32)" fill="none" stroke="${P.d4}" stroke-width="3"/><circle cx="12" cy="18" r="1.6" fill="${P.d3}"/><circle cx="50" cy="48" r="1.6" fill="${P.d3}"/>`],
  bosque: ['hex', (P) => `<path d="M32 12C46 18 50 34 32 52C14 34 18 18 32 12Z" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.6"/><path d="M32 18V52M32 28L40 24M32 36L24 32M32 42L40 38" stroke="${P.d4}" stroke-width="1.4" stroke-linecap="round"/>`],
  cielo: ['circle', (P) => `<ellipse cx="32" cy="18" rx="14" ry="4.5" fill="none" stroke="${P.d4}" stroke-width="3"/><path d="M32 26C22 24 14 28 10 36C18 36 22 38 24 44C26 40 28 38 32 40C36 38 38 40 40 44C42 38 46 36 54 36C50 28 42 24 32 26Z" fill="${P.d3}" stroke="${P.d1}" stroke-width="1.2"/>`],
  oro: ['oct', (P) => `<path d="M12 44L10 22L22 32L32 16L42 32L54 22L52 44Z" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.8" stroke-linejoin="round"/><rect x="12" y="44" width="40" height="6" rx="1.5" fill="${P.d1}"/><circle cx="32" cy="14" r="2.6" fill="${P.d1}"/>`],
  lofi: ['round', (P) => `<path d="M16 26H42V40C42 46 38 50 32 50H26C20 50 16 46 16 40Z" fill="${P.d3}"/><path d="M42 30H48C52 30 52 40 44 40" fill="none" stroke="${P.d3}" stroke-width="3"/><path d="M24 20Q28 14 24 8M32 20Q36 14 32 8" stroke="${P.d4}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`],
  crimson: ['diamond', (P) => `<path d="M32 12C42 24 46 32 32 50C18 32 22 24 32 12Z" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.4"/><path d="M26 46L24 58M38 46L40 58" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".92"/>`],
  emo: ['hex', (P) => `<g transform="translate(32 32)"><path d="${heartD(18)}" fill="#0a070c" stroke="${P.d1}" stroke-width="2.4"/><path d="M0 -15L-5 -5L4 2L-4 10L2 16" stroke="${P.d1}" stroke-width="2" fill="none"/><path d="M-8 -4l6 3M-8 4l6 3" stroke="${P.d3}" stroke-width="1.4" stroke-linecap="round"/></g>`],
  cripta: ['shield', (P) => `<path d="M32 14C42 14 48 22 48 31C48 37 45 40 43 43V49H21V43C19 40 16 37 16 31C16 22 22 14 32 14Z" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.4"/><ellipse cx="25" cy="31" rx="4.4" ry="5.4" fill="#0a0709"/><ellipse cx="39" cy="31" rx="4.4" ry="5.4" fill="#0a0709"/><path d="M32 36L29.6 42H34.4Z" fill="#0a0709"/><path d="M26 45V49M32 45V49M38 45V49" stroke="#0a0709" stroke-width="1.6"/>`],
  cruces: ['diamond', (P) => `<path d="M32 9V55M16 28H48" stroke="${P.d3}" stroke-width="7" stroke-linecap="round"/><path d="M32 9V55M16 28H48" stroke="${P.d4}" stroke-width="1.4" stroke-linecap="round"/><circle cx="32" cy="28" r="3.2" fill="${P.d4}"/>`],
  calabaza: ['circle', (P) => `<ellipse cx="32" cy="35" rx="19" ry="16" fill="${P.d1}" stroke="${P.d4}" stroke-width="1.4"/><path d="M26 20Q24 35 26 50M38 20Q40 35 38 50" stroke="#000" stroke-opacity=".35" fill="none"/><path d="M31 20Q31 13 37 12" stroke="#4CA03A" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M22 33L26 28L28 34ZM42 33L38 28L36 34ZM22 40L32 46L42 40L38 44L32 42L26 44Z" fill="${P.d3}"/>`],
  cuervo: ['round', (P) => `<path d="M12 34C16 24 28 20 38 24C42 20 48 20 52 24L58 28L50 30C48 40 40 46 30 46L32 54H27L25 46C18 44 13 40 12 34Z" fill="#07070a" stroke="${P.d1}" stroke-width="1.6"/><circle cx="47" cy="25" r="1.8" fill="${P.d4}"/>`],
  barroco: ['circle', (P) => `<ellipse cx="32" cy="32" rx="15" ry="19" fill="none" stroke="${P.d3}" stroke-width="3"/><path d="M10 26C6 34 10 42 16 42M54 26C58 34 54 42 48 42" stroke="${P.d4}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="32" cy="10" r="2.6" fill="${P.d3}"/>`],
  creepy: ['hex', (P) => `<ellipse cx="32" cy="32" rx="14" ry="19" fill="none" stroke="${P.d1}" stroke-width="2.4"/><path d="M22 24L28 28M42 24L36 28" stroke="${P.d1}" stroke-width="2.4" stroke-linecap="round"/><path d="M22 40Q32 50 42 40" fill="none" stroke="${P.d4}" stroke-width="2.6" stroke-linecap="round"/>`],
  vampiro: ['diamond', (P) => `<path d="${starD(5, 20, 8.4, -90).replace(/M([\d.-]+) ([\d.-]+)/, (m, x, y) => `M${f(+x + 32)} ${f(+y + 33)}`)}" fill="none" stroke="${P.d3}" stroke-width="3" stroke-linejoin="round"/><path d="M26 44L24 56M38 44L40 56" stroke="${P.d4}" stroke-width="3" stroke-linecap="round" opacity=".9"/>`],
  miticas: ['circle', (P) => `<circle cx="32" cy="32" r="13" fill="#000" stroke="${P.d3}" stroke-width="2"/>${Array.from({ length: 16 }, (_, i) => { const [a, b] = [pol(32, 32, 16, i * 22.5), pol(32, 32, 24, i * 22.5)]; return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${P.d1}" stroke-width="2.2" stroke-linecap="round"/>` }).join('')}`],
  fundador: ['shield', (P) => `<path d="M14 40C12 28 16 18 22 12M50 40C52 28 48 18 42 12" stroke="${P.d3}" stroke-width="3" fill="none" stroke-linecap="round"/><g transform="translate(32 30)"><path d="${starD(5, 12, 5, -90)}" fill="${P.d3}" stroke="${P.d4}" stroke-width="1.4"/></g><path d="M20 50H44" stroke="${P.d4}" stroke-width="3" stroke-linecap="round"/>`],
}
export const BADGE_IDS = Object.keys(BADGES)
let BU = 0
export function badgeSVG(coll, { size = 64, hue = 0 } = {}) {
  const [shape, sym] = BADGES[coll]
  const P = makePalette({ id: coll, name: coll, c: BP[coll] }, hue)
  const S = new Canvas('bd' + (++BU).toString(36))
  const face = S.lin([[0, P.mix(P.d1, P.d2, 0.35)], [1, P.dk(P.d2, 0.1)]], 0, 0, 1, 1)
  const rim = S.lin([[0, P.lt(P.d1, 0.5)], [0.5, P.d1], [1, P.dk(P.d1, 0.4)]], 0, 0, 1, 1)
  const d = SHAPES[shape]
  const inner = `<path d="${d}" fill="${face}" stroke="${rim}" stroke-width="3.2" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1" transform="translate(32 32) scale(.88) translate(-32 -32)"/>${sym(P)}<path d="M12 12Q30 4 52 14" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" stroke-linecap="round"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><defs>${S.defs.join('')}</defs>${inner}</svg>`
}

// ───────── PACKS (datos; el cálculo real lo hace la función SQL de la tienda)
export const PACK_EFFECT = { noctis: 'murcielagos', velvet: 'corazones-flotando', sakura: 'petalos-cayendo', magica: 'circulo-magico-pulsando', neon: 'glitch-y-escaneo', pixel: 'confeti', samurai: 'brasas-subiendo', academia: 'nieve-suave', cosmos: 'rafaga-de-estrellas', bosque: 'luciernagas', cielo: 'relampago-suave', oro: 'confeti', lofi: 'lluvia', crimson: 'lluvia-carmesi', emo: 'corazones-rotos' }
export const PACK_CARD = { noctis: 'cadenas-vivas', velvet: 'terciopelo-rouge', sakura: 'cuaderno-kawaii', magica: 'cielo-estelar', neon: 'terminal-hud', pixel: 'pantalla-de-inicio', samurai: 'pergamino-y-tinta', academia: 'biblioteca', cosmos: 'observatorio', bosque: 'claro-del-bosque', cielo: null, oro: 'palacio-dorado', lofi: 'cuarto-de-noche', crimson: 'altar-carmesi', emo: 'habitacion-emo' }
export const BONUSES = { completeCollection: { badge: true, exclusiveTitle: true, moons: 400 }, pack: { discount: 0.2 }, welcome: { decos: 3, fonts: 3, titles: 3, once: true, free: true }, founder: { before: '2026-10-13', frame: 'marco-fundador', badge: 'fundador', title: 'Fundador de Daiwa', nameEffect: 'oro-foil', nameEffectPalette: 'fundador', moons: 300 } }

// ── Halloween (1.5.0): títulos de colección completa y packs
Object.assign(COMPLETION_TITLES, { cripta: 'Señor de la cripta', cruces: 'Portador de la cruz de plata', calabaza: 'Rey de la cosecha', cuervo: 'Voz de la parvada', barroco: 'Duquesa del monocromo', creepy: 'Habitante del bosque', vampiro: 'Conde de la bruma azul' })
Object.assign(PACK_EFFECT, { cripta: 'bandada-de-la-cripta', cruces: 'lluvia-de-cruces', calabaza: 'calabazas-flotantes', cuervo: 'parvada-de-cuervos', barroco: 'petalos-y-perlas', creepy: 'niebla-del-bosque', vampiro: 'bruma-y-estrellas-azules' })
Object.assign(PACK_CARD, { cripta: 'cripta-de-hueso', cruces: 'altar-de-plata', calabaza: 'noche-de-calabazas', cuervo: 'reja-de-hierro', barroco: 'salon-barroco', creepy: 'bosque-sin-rostro', vampiro: 'fan-club-vampirico' })
