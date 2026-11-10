// @ts-nocheck
// REGISTRO DE LO EXCLUSIVO DE MIEMBROS (Círculo Lunar) — un solo archivo que se importa UNA vez (desde kit.ts).
// Así no se tocan los índices del kit (avatar/cards/names/entry/titles) y no choca con nada que ya tengas puesto (p. ej. Lestat).
import { AVATAR_DECOS, COLLECTIONS } from '../avatar/index.js'
import { CARDS } from '../cards/index.js'
import { NAME_EFFECTS } from '../names/index.js'
import { ENTRY_EFFECTS } from '../entry/engine.js'
import { TITLES } from '../titles/index.js'
import { SP1 } from '../avatar/sp1.js'
import { SP2 } from '../avatar/sp2.js'
import { SP_CARDS } from './spCards.js'
import { SP_ENTRY } from './spEntry.js'
import { SP_NAMES } from './spNames.js'
import { SP_TITLES } from './spTitles.js'

const add = (list, items) => { for (const it of items) if (!list.some((x) => x.slug === it.slug)) list.push(it) }
{
  add(AVATAR_DECOS, [...SP1, ...SP2])
  if (!COLLECTIONS.some((c) => c.id === 'supporters')) COLLECTIONS.push({ id: 'supporters', name: 'Círculo Lunar', theme: 'exclusivo de miembros' })
  add(CARDS, SP_CARDS)
  add(NAME_EFFECTS, SP_NAMES)
  add(ENTRY_EFFECTS, SP_ENTRY)
  add(TITLES, SP_TITLES)
}
export { SP1, SP2, SP_CARDS, SP_ENTRY, SP_NAMES, SP_TITLES }
