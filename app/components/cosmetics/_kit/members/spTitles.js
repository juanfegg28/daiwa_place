// @ts-nocheck
// MIEMBROS · TÍTULOS (pastillas míticas con borde animado). 10 paletas (las mismas de las decoraciones).
import { SP_PAL } from '../avatar/sp1.js'

const T = (slug, name, glyph) => ({ slug, name, rarity: 'mitico', price: 0, glyph, coll: 'supporters', custom: true, palettes: SP_PAL })
export const SP_TITLES = [
  T('bajo-la-luna', 'Bajo la Luna', '☾'),            // Creciente
  T('sueno-de-plata', 'Sueño de plata', '✧'),        // Creciente
  T('heredero-de-selene', 'Heredero de Selene', '♛'), // Llena
  T('reina-de-las-perlas', 'Reina de las perlas', '❀'), // Llena
  T('testigo-de-la-totalidad', 'Testigo de la Totalidad', '◍'), // Eclipse
  T('soberano-del-eclipse', 'Soberano del eclipse', '♚'), // Eclipse
]
