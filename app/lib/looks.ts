// v1.9.0 · Looks guardados (combinaciones de cosméticos) y temas del Círculo Lunar.
// Guardar/leer/borrar pasa por Supabase (look_save / look_list / look_delete): ahí se valida que todo sea tuyo.
import { supabase } from './supabaseClient'
import type { Equip } from './cosmetics'

export type LookLike = { avatar_deco: Equip | null; font: string | null; effect: Equip | null; title: Equip | null; card: Equip | null; entry: Equip | null; bg: Equip | null }
export type LookCfg = { avatar_deco?: Equip | null; name_font?: string | null; name_effect?: Equip | null; title?: Equip | null; card?: Equip | null; entry?: Equip | null; background?: Equip | null }
export type SavedLook = { id: string; name: string; config: LookCfg; created_at: string }

export function lookToConfig(l: LookLike): LookCfg {
  const c: LookCfg = {}
  if (l.avatar_deco) c.avatar_deco = l.avatar_deco
  if (l.font) c.name_font = l.font
  if (l.effect) c.name_effect = l.effect
  if (l.title) c.title = l.title
  if (l.card) c.card = l.card
  if (l.entry) c.entry = l.entry
  if (l.bg) c.background = l.bg
  return c
}
export function lookFromConfig(c: LookCfg): LookLike {
  return { avatar_deco: c.avatar_deco ?? null, font: c.name_font ?? null, effect: c.name_effect ?? null, title: c.title ?? null, card: c.card ?? null, entry: c.entry ?? null, bg: c.background ?? null }
}

let cache: { at: number; looks: SavedLook[]; max: number } | null = null
export function invalidateLooks() {
  cache = null
}

export async function listLooks(force = false): Promise<{ looks: SavedLook[]; max: number } | null> {
  if (!force && cache && Date.now() - cache.at < 60_000) return { looks: cache.looks, max: cache.max }
  const { data, error } = await supabase.rpc('look_list')
  if (error) return null
  const rows = (data as { id: string; name: string; config: LookCfg; created_at: string; max_looks: number }[] | null) ?? []
  cache = { at: Date.now(), looks: rows.map((r) => ({ id: r.id, name: r.name, config: r.config, created_at: r.created_at })), max: rows[0]?.max_looks ?? 2 }
  return { looks: cache.looks, max: cache.max }
}

/** Guarda lo que llevas puesto como un look con nombre. Devuelve el texto del error, o '' si salió bien. */
export async function saveLookAs(name: string, look: LookLike): Promise<string> {
  const { error } = await supabase.rpc('look_save', { p_name: name.trim(), p_config: lookToConfig(look) })
  invalidateLooks()
  return error ? error.message : ''
}

export async function deleteLookById(id: string): Promise<string> {
  const { error } = await supabase.rpc('look_delete', { p_id: id })
  invalidateLooks()
  return error ? error.message : ''
}

/* ───────── Temas del Círculo Lunar: combinaciones listas, hechas solo con cosméticos de miembros ───────── */
export type ThemePiece = { type: 'avatar_decoration' | 'profile_card' | 'name_effect' | 'title' | 'entry_effect'; slug: string; palette?: string }
export type LookTheme = { id: string; name: string; tier: 'creciente' | 'llena' | 'eclipse'; blurb: string; pieces: ThemePiece[] }

const p = (type: ThemePiece['type'], slug: string, palette?: string): ThemePiece => ({ type, slug, palette })
export const THEMES: LookTheme[] = [
  { id: 'noche-de-plata', name: 'Noche de plata', tier: 'creciente', blurb: 'Luz de luna fría sobre fondo oscuro.', pieces: [p('avatar_decoration', 'halo-naciente', 'medianoche'), p('profile_card', 'velo-de-luna', 'medianoche'), p('name_effect', 'luz-de-luna', 'medianoche'), p('title', 'bajo-la-luna', 'medianoche'), p('entry_effect', 'marea-de-petalos-lunares', 'medianoche')] },
  { id: 'jardin-lunar', name: 'Jardín lunar', tier: 'creciente', blurb: 'Pétalos de sakura bajo la luna.', pieces: [p('avatar_decoration', 'jardin-de-luna', 'sakura'), p('profile_card', 'velo-de-luna', 'sakura'), p('name_effect', 'luz-de-luna', 'sakura'), p('title', 'sueno-de-plata', 'sakura'), p('entry_effect', 'marea-de-petalos-lunares', 'sakura')] },
  { id: 'seda-y-perlas', name: 'Seda y perlas', tier: 'llena', blurb: 'Suave, rosa y brillante como una perla.', pieces: [p('avatar_decoration', 'lazo-de-seda-y-perlas', 'algodon'), p('profile_card', 'jardin-de-seda', 'algodon'), p('name_effect', 'seda-y-perlas', 'algodon'), p('title', 'reina-de-las-perlas', 'algodon'), p('entry_effect', 'lluvia-de-estrellas-de-plata', 'algodon')] },
  { id: 'medianoche-de-selene', name: 'Medianoche de Selene', tier: 'llena', blurb: 'Astrolabio y mareas de plata.', pieces: [p('avatar_decoration', 'astrolabio-de-selene', 'abismo'), p('profile_card', 'marea-de-plata', 'abismo'), p('name_effect', 'seda-y-perlas', 'abismo'), p('title', 'heredero-de-selene', 'abismo'), p('entry_effect', 'lluvia-de-estrellas-de-plata', 'abismo')] },
  { id: 'polilla-lunar', name: 'Polilla lunar', tier: 'llena', blurb: 'Alas de polilla en una noche violeta.', pieces: [p('avatar_decoration', 'polilla-lunar', 'orquidea'), p('profile_card', 'marea-de-plata', 'orquidea'), p('name_effect', 'luz-de-luna', 'orquidea'), p('title', 'heredero-de-selene', 'orquidea'), p('entry_effect', 'lluvia-de-estrellas-de-plata', 'orquidea')] },
  { id: 'eclipse-total', name: 'Eclipse total', tier: 'eclipse', blurb: 'La corona de la Totalidad en rojo lunar.', pieces: [p('avatar_decoration', 'corona-de-la-totalidad', 'sangre-lunar'), p('profile_card', 'umbra', 'sangre-lunar'), p('name_effect', 'aura-de-eclipse', 'sangre-lunar'), p('title', 'testigo-de-la-totalidad', 'sangre-lunar'), p('entry_effect', 'eclipse-total-lunar', 'sangre-lunar')] },
  { id: 'rosa-eclipse', name: 'Rosa de eclipse', tier: 'eclipse', blurb: 'Cáliz de rosas y cristal.', pieces: [p('avatar_decoration', 'caliz-de-rosas', 'rosa-eclipse'), p('profile_card', 'salon-de-cristal', 'rosa-eclipse'), p('name_effect', 'aura-de-eclipse', 'rosa-eclipse'), p('title', 'soberano-del-eclipse', 'rosa-eclipse'), p('entry_effect', 'eclipse-total-lunar', 'rosa-eclipse')] },
  { id: 'serafin-dorado', name: 'Serafín dorado', tier: 'eclipse', blurb: 'Alas de serafín en rosa y oro.', pieces: [p('avatar_decoration', 'serafin-lunar', 'rosa-oro'), p('profile_card', 'salon-de-cristal', 'rosa-oro'), p('name_effect', 'aura-de-eclipse', 'rosa-oro'), p('title', 'soberano-del-eclipse', 'rosa-oro'), p('entry_effect', 'eclipse-total-lunar', 'rosa-oro')] },
  { id: 'gatita-celestial', name: 'Gatita celestial', tier: 'eclipse', blurb: 'Dulce, pastel y con orejitas de luna.', pieces: [p('avatar_decoration', 'gatita-celestial', 'chicle'), p('profile_card', 'jardin-de-seda', 'chicle'), p('name_effect', 'seda-y-perlas', 'chicle'), p('title', 'reina-de-las-perlas', 'chicle'), p('entry_effect', 'lluvia-de-estrellas-de-plata', 'chicle')] },
]

/** Las piezas de un tema como cambios para el borrador del clóset */
export function themeToPatch(t: LookTheme, ownedSlugs: Set<string>): { patch: Partial<LookLike>; missing: number } {
  const patch: Partial<LookLike> = {}
  let missing = 0
  for (const piece of t.pieces) {
    if (!ownedSlugs.has(`${piece.type}:${piece.slug}`)) {
      missing++
      continue
    }
    const eq: Equip = { id: piece.slug, palette: piece.palette }
    if (piece.type === 'avatar_decoration') patch.avatar_deco = eq
    else if (piece.type === 'profile_card') patch.card = eq
    else if (piece.type === 'name_effect') patch.effect = eq
    else if (piece.type === 'title') patch.title = eq
    else patch.entry = eq
  }
  return { patch, missing }
}
