/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
// ÚNICO archivo de la app que importa el kit de diseños (carpeta _kit, sin modificar).
// Aquí se aplican las reglas de la integración: guardia de versiones, caché, y los arreglos del adaptador de referencia.
// Los diseños devuelven texto SVG/HTML generado por NUESTRO código; lo que escribe la gente se escapa dentro del kit.
// (sin comprobación de tipos: el kit es JavaScript puro)
import { AVATAR_DECOS, COLLECTIONS as DECO_COLLECTIONS } from './_kit/avatar/index.js'
import { renderLayers } from './_kit/avatar/render.js'
import { CARDS } from './_kit/cards/index.js'
import { skinParts, BASE_SKIN_CSS } from './_kit/cards/kit.js'
import { ENTRY_EFFECTS, startEntry } from './_kit/entry/engine.js'
import { NAME_EFFECTS, nameEffectHTML } from './_kit/names/index.js'
import { BACKGROUNDS, backgroundHTML } from './_kit/backgrounds/index.js'
import { TITLES, COMPLETION_TITLES, titleHTML, badgeSVG, BADGE_IDS, PACK_EFFECT, PACK_CARD } from './_kit/titles/index.js'
import { FONTS } from './_kit/fonts/index.js'
import { BASE_CSS } from './_kit/core/kit.js'
import { NEXT_KIT_COLLECTIONS, isReleasedColl } from '../../lib/cosmeticsRelease'

/** Arranca un efecto de entrada en un canvas. Devuelve {stop, seek} */
export const startEntryFx = (effect: unknown, canvas: HTMLCanvasElement, opts: { paletteId?: string; hue?: number; loop?: boolean; seed?: number; reduced?: boolean }): { stop: () => void; seek: (s: number) => void } => startEntry(effect, canvas, opts)
export { startEntry, DECO_COLLECTIONS, COMPLETION_TITLES, BADGE_IDS, PACK_EFFECT, PACK_CARD }

// ───────── Registros: lo de la 1.5.0 NO existe para la app hasta que se lance ─────────
const live = (list) => list.filter((x) => isReleasedColl(x.coll))
const released = (list) => list.filter((x) => !NEXT_KIT_COLLECTIONS.includes(x.coll))
const slugify = (n) => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Listas SOLO de lo lanzado (1.4.0). Estas son las que usan tienda, inventario, galería de pruebas… */
export const RELEASED = {
  decos: released(AVATAR_DECOS),
  cards: released(CARDS),
  entries: released(ENTRY_EFFECTS),
  names: released(NAME_EFFECTS),
  backgrounds: released(BACKGROUNDS),
  titles: released(TITLES),
  fonts: FONTS,
}
/** Lo que viene (solo para el estudio del equipo, cuando el servidor lo permite) */
export const UPCOMING = {
  decos: AVATAR_DECOS.filter((x) => NEXT_KIT_COLLECTIONS.includes(x.coll)),
  cards: CARDS.filter((x) => NEXT_KIT_COLLECTIONS.includes(x.coll)),
  entries: ENTRY_EFFECTS.filter((x) => NEXT_KIT_COLLECTIONS.includes(x.coll)),
  names: NAME_EFFECTS.filter((x) => NEXT_KIT_COLLECTIONS.includes(x.coll)),
  backgrounds: BACKGROUNDS.filter((x) => NEXT_KIT_COLLECTIONS.includes(x.coll)),
  titles: TITLES.filter((x) => NEXT_KIT_COLLECTIONS.includes(x.coll)),
}

const by = (list, slug) => (slug ? live(list).find((x) => x.slug === slug) ?? null : null)
export const decoBySlug = (s) => by(AVATAR_DECOS, s)
export const cardBySlug = (s) => by(CARDS, s)
export const entryBySlug = (s) => by(ENTRY_EFFECTS, s)
export const nameFxBySlug = (s) => by(NAME_EFFECTS, s)
export const backgroundBySlug = (s) => by(BACKGROUNDS, s)
export const fontBySlug = (s) => (s ? FONTS.find((f) => f.slug === s && !f.free) ?? (s === 'cinzel' ? FONTS.find((f) => f.slug === 'cinzel') : null) : null)

// ───────── Títulos: los de la tienda + los exclusivos por completar colección + el del Pack Fundador ─────────
const TP = (a, c, d) => [
  { id: 'a', name: 'Principal', c: [a, '#0d0b14', c, d] },
  { id: 'b', name: 'Rosa', c: ['#FF7AB8', '#16081a', '#FFD0E6', '#FFB070'] },
  { id: 'c', name: 'Cian', c: ['#4FD8FF', '#04121c', '#C8F4FF', '#8C9CFF'] },
  { id: 'd', name: 'Dorado', c: ['#F0C050', '#1a1204', '#FFF1B8', '#E08A30'] },
]
// El kit trae el NOMBRE de los títulos exclusivos pero no su pastilla: se arma con el mismo estilo de los títulos épicos
// y los colores de la primera decoración de esa colección (nada inventado: es la paleta de su propio kit).
const exclusive = (name, coll, rarity = 'epico') => {
  const d = AVATAR_DECOS.find((x) => x.coll === coll)
  const c = d?.palettes?.[0]?.c ?? ['#F0C050', '#1a1204', '#FFF1B8', '#E08A30']
  return { slug: slugify(name), name, rarity, price: 0, glyph: '✦', coll, exclusive: true, palettes: TP(c[0], c[2], c[3]) }
}
const EXCLUSIVE_TITLES = [
  ...Object.entries(COMPLETION_TITLES).map(([coll, name]) => exclusive(name, coll)),
  exclusive('Fundador de Daiwa', 'miticas', 'mitico'),
]
export const titleBySlug = (s) => (s ? live([...TITLES, ...EXCLUSIVE_TITLES]).find((x) => x.slug === s) ?? null : null)
export const EXCLUSIVE_TITLE_LIST = (includeNext = false) => (includeNext ? EXCLUSIVE_TITLES : released(EXCLUSIVE_TITLES))

// ───────── CSS (los keyframes de decoraciones, tarjetas y fondos) ─────────
const cssOf = (lists) => lists.flat().map((d) => d.css || '').join('\n')
const REDUCED = '@media (prefers-reduced-motion:reduce){.dpw *,.pcw *,.bgl *{animation:none!important}}\n.dpw[data-static="1"] *,.dpw[data-static="1"].pcw *{animation:none!important}'
/** CSS de lo lanzado: se monta UNA vez en el layout raíz */
export const RELEASED_CSS = BASE_CSS + '\n' + BASE_SKIN_CSS + '\n' + cssOf([RELEASED.decos, RELEASED.cards, RELEASED.backgrounds]) + '\n' + REDUCED
/** CSS de lo que viene: solo se inyecta en el estudio del equipo */
export const UPCOMING_CSS = cssOf([UPCOMING.decos, UPCOMING.cards, UPCOMING.backgrounds])

// ───────── Ayudantes de renderizado ─────────
const hashStr = (s) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}
const layerCache = new Map()
/** Capas back/front de una decoración. Con identificadores fijos (mismo diseño = mismos ids): se calcula una sola vez */
export function decoLayers(slug: string, palette?: string, hue = 0): { back: string; front: string; min: number; name: string } | null {
  const d = decoBySlug(slug)
  if (!d) return null
  const key = `${slug}|${palette || ''}|${hue}`
  let hit = layerCache.get(key)
  if (!hit) {
    const L = renderLayers(d, { paletteId: palette, hue, uid: 'dp' + hashStr(key) })
    hit = { back: L.back, front: L.front, min: d.min || 0, name: d.name }
    layerCache.set(key, hit)
  }
  return hit
}

/** URL del banner para ir DENTRO de un atributo style="…": solo https y todo lo peligroso codificado.
 *  (El adaptador de referencia dejaba comillas dobles dentro del atributo y rompía el HTML de la tarjeta.) */
export function safeCssUrl(u) {
  if (!u || !/^https:\/\//i.test(u)) return null
  const enc = encodeURI(u).replace(/["'()\\\s<>`]/g, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).replace(/&/g, '&amp;')
  return `url(${enc})`
}

export function nameFx(effectSlug: string, text: string, { palette, hue = 0, mode = 'full' }: { palette?: string; hue?: number; mode?: string }) {
  const fx = nameFxBySlug(effectSlug)
  if (!fx) return null
  return nameEffectHTML(fx, text, { paletteId: palette, hue, mode, uid: hashStr(`${effectSlug}|${palette || ''}|${hue}|${mode}`) })
}

export function titleOut(slug: string, { palette, hue = 0 }: { palette?: string; hue?: number } = {}) {
  const t = titleBySlug(slug)
  if (!t) return null
  return titleHTML(t, { paletteId: palette, hue, uid: hashStr(`${slug}|${palette || ''}|${hue}`) })
}

export function backgroundOut(slug: string, { palette, hue = 0 }: { palette?: string; hue?: number } = {}) {
  const b = backgroundBySlug(slug)
  return b ? backgroundHTML(b, { paletteId: palette, hue, uid: 'bg' + hashStr(`${slug}|${palette || ''}|${hue}`) }) : ''
}

export function badgeOut(coll: string, size = 24): string {
  return BADGE_IDS.includes(coll) && isReleasedColl(coll) ? badgeSVG(coll, { size }) : ''
}

// ───────── Tarjetas de perfil v2: SUPERFICIE FLUIDA que envuelve los bloques reales del perfil ─────────
// (reemplaza a la tarjeta-póster 340×420). El banner es del usuario y va FUERA, arriba: la tarjeta nunca dibuja sobre él.
const skinCache = new Map()
/** Partes de una tarjeta: { slug, tone, vars, bg, fg }. Mismo diseño + paleta + color libre = mismos ids: se calcula una vez. */
export function skinPartsFor(slug: string, palette?: string, hue = 0): { slug: string; tone: string; vars: Record<string, string>; bg: string; fg: string } | null {
  const c = cardBySlug(slug)
  if (!c) return null
  const key = `${slug}|${palette || ''}|${hue}`
  let hit = skinCache.get(key)
  if (!hit) {
    hit = skinParts(c, { paletteId: palette, hue, uid: 'sk' + hashStr(key) })
    skinCache.set(key, hit)
  }
  return hit
}
/** ¿La tarjeta es clara? (su texto es oscuro: el color de nombre elegido para tema oscuro no sirve ahí) */
export const cardTone = (slug: string): string => cardBySlug(slug)?.tone ?? 'dark'

// ───────── Paletas y listas por tipo (tienda, inventario, estudio y galería) ─────────
const LISTS: Record<string, () => any[]> = {
  avatar_decoration: () => live(AVATAR_DECOS),
  profile_card: () => live(CARDS),
  entry_effect: () => live(ENTRY_EFFECTS),
  name_effect: () => live(NAME_EFFECTS),
  background: () => live(BACKGROUNDS),
  title: () => live([...TITLES, ...EXCLUSIVE_TITLES]),
}
export function kitItem(type: string, slug: string): any | null {
  const l = LISTS[type]
  return l ? l().find((x) => x.slug === slug) ?? null : null
}
/** Paletas incluidas con un cosmético: [{id, name, c:[d1..d4]}] */
export function palettesOf(type: string, slug: string): { id: string; name: string; c: string[] }[] {
  return kitItem(type, slug)?.palettes ?? []
}
export const kitFontList = () => FONTS
