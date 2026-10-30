// @ts-nocheck
// TARJETAS DE PERFIL v2: 27 superficies fluidas. Cada una: { slug, name, rarity, price, coll, tone, palettes, build(K,P), css }
import { N1 } from './n1.js'
import { V1 } from './v1.js'
import { S1 } from './s1.js'
import { M1 } from './m1.js'
import { J1 } from './j1.js'
import { C1 } from './c1.js'
import { H1 } from './h1.js'
import { D1 } from './d1.js'
export const CARDS = [...N1, ...V1, ...S1, ...M1, ...J1, ...C1, ...H1, ...D1]
export const CARD_COLLECTIONS = []
export { skinHTML, skinParts, BASE_SKIN_CSS, Kit } from './kit.js'
export { profileDemo, profileInner, MOCK_CSS, DEMO_BANNERS } from './mock.js'
