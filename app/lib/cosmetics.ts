// Cosméticos de DaiwaPlace (v1.4.0 «Tienda y Estilo»): tipos, llamadas al servidor, preferencias y guardia de versiones.
// El servidor decide TODO (qué es tuyo, precios, qué está lanzado). Aquí solo se pide y se muestra.
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { FONT_META } from './cosmeticFonts'

// ───────── Lo que lleva puesta una persona (viaja en las mismas consultas que su avatar y su nombre) ─────────
export type Equip = { id: string; palette?: string; hue?: number }
export type NameStyle = { font?: string | null; effect?: Equip | null }
export type ProfileCosmetics = {
  avatar_deco?: Equip | null
  name_style?: NameStyle | null
  title_style?: Equip | null
  card_style?: Equip | null
  entry_effect?: Equip | null
  profile_bg?: Equip | null
}

/** Columnas que acompañan a cada avatar/nombre en el feed y los comentarios (v1.4.0) */
export const COSMETIC_MINI_COLS = 'avatar_deco, name_style, title_style'
/** Columnas extra que solo necesita el perfil abierto */
export const COSMETIC_PROFILE_COLS = 'card_style, entry_effect, profile_bg'

const SLUG = /^[a-z0-9-]{1,48}$/

/** Valida lo que llega de la base (nunca se confía en el JSON tal cual) */
export function normalizeEquip(v: unknown): Equip | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || !SLUG.test(o.id)) return null
  const palette = typeof o.palette === 'string' && SLUG.test(o.palette) ? o.palette : undefined
  const hue = typeof o.hue === 'number' && o.hue >= 0 && o.hue <= 355 ? Math.round(o.hue) : undefined
  return { id: o.id, ...(palette ? { palette } : {}), ...(hue ? { hue } : {}) }
}

export function normalizeNameStyle(v: unknown): NameStyle | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const font = typeof o.font === 'string' && SLUG.test(o.font) ? o.font : null
  const effect = normalizeEquip(o.effect)
  return font || effect ? { font, effect } : null
}

// ───────── Guardia de versiones (archivo aparte, puro; se reexporta aquí) ─────────
export { NEXT_KIT_COLLECTIONS, RELEASED_VERSION, setAllowNextKits, nextKitsAllowed, isReleasedColl } from './cosmeticsRelease'

// ───────── Tipos de cosméticos ─────────
export type CosmeticType = 'avatar_decoration' | 'profile_card' | 'entry_effect' | 'name_effect' | 'background' | 'title' | 'font' | 'badge'
export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario' | 'mitico'

export type CatalogItem = {
  id: string
  type: CosmeticType
  slug: string
  name: string
  rarity: Rarity
  price: number
  collection: string
  min_size: number | null
  custom_hue: boolean
  palettes: string[]
  meta: Record<string, unknown>
  obtainable: 'tienda' | 'gratis' | 'logro' | 'evento' | 'fundador'
  release_version: string
  owned: boolean
  /** v1.5.0 · `price` ya es el precio VIGENTE (con oferta si la hay); `base_price` es el de lista. */
  base_price?: number
  sale_id?: string | null
  sale_name?: string | null
  sale_ends_at?: string | null
  wished?: boolean
}

/** v1.5.0 · Oferta activa (el grupo de cosméticos rebajados). Los ítems vienen en el catálogo con su `sale_id`. */
export type ShopSale = {
  id: string
  name: string
  blurb: string | null
  kind: 'oferta' | 'dia' | 'semana' | 'evento'
  theme: string
  starts_at: string
  ends_at: string
  in_banner: boolean
  sort: number
}

/** v1.5.0 · «Selección» del banner principal (p. ej. «Selección de Halloween») */
export type ShopFeature = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cta: string
  theme: string
  collections: string[]
  item_ids: string[]
  starts_at: string
  ends_at: string | null
  sort: number
}

export type InventoryItem = Omit<CatalogItem, 'price' | 'release_version' | 'owned'> & { source: string; acquired_at: string }

export type ShopCollection = {
  id: string
  name: string
  theme: string | null
  kind: 'coleccion' | 'base' | 'miticas'
  has_pack: boolean
  pack_card: string | null
  pack_effect: string | null
  completion_title: string | null
  total: number
  owned: number
  pack_price: number
  pack_full_price: number
  all_owned: boolean
}

export type PackQuote = {
  collection: string
  items: { id: string; type: CosmeticType; slug: string; name: string; price: number }[]
  full_price: number
  discount_pct: number
  price: number
}

// ───────── Ofertas (v1.5.0) ─────────
/** ¿Tiene una oferta vigente? (el servidor ya puso en `price` el precio rebajado) */
export const onSale = (i: Pick<CatalogItem, 'sale_id' | 'base_price' | 'price'>): boolean => !!i.sale_id && (i.base_price ?? 0) > i.price
/** Porcentaje de descuento redondeado (0 si no hay oferta) */
export function salePct(i: Pick<CatalogItem, 'sale_id' | 'base_price' | 'price'>): number {
  return onSale(i) ? Math.max(1, Math.round(100 - (i.price * 100) / (i.base_price as number))) : 0
}
export const SALE_KIND_LABEL: Record<ShopSale['kind'], string> = { oferta: 'Oferta', dia: 'Oferta del día', semana: 'Destacado de la semana', evento: 'Oferta especial' }

export const RARITY_LABEL: Record<Rarity, string> = { comun: 'Común', raro: 'Raro', epico: 'Épico', legendario: 'Legendario', mitico: 'Mítico' }
export const RARITY_STYLE: Record<Rarity, string> = {
  comun: 'border-ink-600 text-neutral-300',
  raro: 'border-sky-500/60 text-sky-300',
  epico: 'border-violet-500/60 text-violet-300',
  legendario: 'border-amber-400/70 text-amber-300',
  mitico: 'border-fuchsia-400/70 text-fuchsia-300',
}
export const TYPE_LABEL: Record<CosmeticType, string> = {
  avatar_decoration: 'Decoración de avatar',
  profile_card: 'Tarjeta de perfil',
  entry_effect: 'Efecto de entrada',
  name_effect: 'Efecto de nombre',
  background: 'Fondo de perfil',
  title: 'Título',
  font: 'Fuente',
  badge: 'Insignia',
}

// ───────── Llamadas al servidor ─────────
type Rpc<T> = Promise<{ data: T | null; error: string }>
async function rpc<T>(fn: string, args?: Record<string, unknown>): Rpc<T> {
  const { data, error } = await supabase.rpc(fn, args ?? {})
  return { data: (data as T) ?? null, error: error ? cleanError(error.message) : '' }
}

/** Mensajes de la base en español, sin ruido técnico */
export function cleanError(msg: string): string {
  if (/permission denied|does not exist|schema cache|Could not find the function/i.test(msg)) {
    return 'Esta función todavía no está disponible (falta correr el SQL de la tienda de la v1.5.0).'
  }
  return msg.replace(/^.*?ERROR:\s*/, '')
}

export const shopCatalog = () => rpc<CatalogItem[]>('shop_catalog')
export const shopCollections = () => rpc<ShopCollection[]>('shop_collections')
export const shopSalesActive = () => rpc<ShopSale[]>('shop_sales_active')
export const shopFeaturesActive = () => rpc<ShopFeature[]>('shop_features_active')
/** Corazón: devuelve true si quedó en la lista de deseos */
export const shopWishToggle = (item: string) => rpc<boolean>('shop_wish_toggle', { p_item: item })
export const shopPackQuote = (collection: string) => rpc<PackQuote | null>('shop_pack_quote', { p_collection: collection })
export const myInventory = () => rpc<InventoryItem[]>('my_inventory')
/** Solo devuelve filas para la cuenta del equipo con acceso total; para el resto, vacío. */
export const staffPreviewItems = () => rpc<CatalogItem[]>('staff_preview_items')
export const shopBuy = (item: string, expected: number) => rpc<{ ok: boolean; balance: number; name: string }>('shop_buy', { p_item: item, p_expected_price: expected, p_key: crypto.randomUUID() })
export const shopBuyPack = (collection: string, expected: number) => rpc<{ ok: boolean; balance: number; items: number }>('shop_buy_pack', { p_collection: collection, p_expected_price: expected, p_key: crypto.randomUUID() })
export const welcomePackStatus = () => rpc<{ claimed: boolean; decos: number; fonts: number; titles: number }>('welcome_pack_status')
export const welcomePackClaim = (items: string[]) => rpc<{ ok: boolean; items: number }>('welcome_pack_claim', { p_items: items })
export const profileBadges = (user: string) => rpc<{ slug: string; name: string }[]>('profile_badges', { p_user: user })

export type LookConfig = {
  avatar_deco?: Equip | null
  name_font?: string | null
  name_effect?: Equip | null
  title?: Equip | null
  card?: Equip | null
  entry?: Equip | null
  background?: Equip | null
}
export const saveLook = (config: LookConfig) => rpc<ProfileCosmetics>('cosmetic_save_look', { p_config: config })

// ───────── Preferencias de movimiento (solo en este dispositivo) ─────────
export type AnimPref = 'todas' | 'perfiles' | 'ninguna'
export type NameFxPref = 'full' | 'lite' | 'plain'
export type CosmeticPrefs = { anim: AnimPref; nameFx: NameFxPref }
const PREF_KEY = 'daiwa.cosmetics.prefs'
const DEFAULT_PREFS: CosmeticPrefs = { anim: 'todas', nameFx: 'full' }
const listeners = new Set<() => void>()
let prefsCache: CosmeticPrefs | null = null

export function readPrefs(): CosmeticPrefs {
  if (prefsCache) return prefsCache
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PREF_KEY) : null
    const o = raw ? (JSON.parse(raw) as Partial<CosmeticPrefs>) : {}
    prefsCache = {
      anim: o.anim === 'perfiles' || o.anim === 'ninguna' ? o.anim : 'todas',
      nameFx: o.nameFx === 'lite' || o.nameFx === 'plain' ? o.nameFx : 'full',
    }
  } catch {
    prefsCache = { ...DEFAULT_PREFS }
  }
  return prefsCache
}
export function writePrefs(p: Partial<CosmeticPrefs>) {
  prefsCache = { ...readPrefs(), ...p }
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefsCache))
  } catch {
    /* modo privado: se queda solo en memoria */
  }
  listeners.forEach((l) => l())
}
export function useCosmeticPrefs(): CosmeticPrefs {
  const [p, setP] = useState<CosmeticPrefs>(DEFAULT_PREFS)
  useEffect(() => {
    const sync = () => setP(readPrefs())
    sync()
    listeners.add(sync)
    return () => {
      listeners.delete(sync)
    }
  }, [])
  return p
}

/** ¿El sistema pide menos movimiento? */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
/** ¿Ahorro de datos activado? */
export function saveDataOn(): boolean {
  if (typeof navigator === 'undefined') return false
  return !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
}

/** Recorta la biografía para el hueco de la tarjeta (corta en palabra y pone «…») */
export function bioExcerpt(bio: string | null | undefined, max = 92): { text: string; cut: boolean } {
  const t = (bio ?? '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return { text: t, cut: false }
  const sl = t.slice(0, max)
  const sp = sl.lastIndexOf(' ')
  return { text: (sp > max * 0.6 ? sl.slice(0, sp) : sl).replace(/[\s,.;:!¡?¿-]+$/, '') + '…', cut: true }
}

// ───────── Fuentes (autoalojadas, se cargan SOLO cuando alguien en pantalla las usa) ─────────
const loaded = new Map<string, Promise<boolean>>()
export type FontDef = { slug: string; family: string; weight: number; italic: boolean }
/** Nombre de familia interno (no choca con nada de la app) */
export const fontFamilyOf = (slug: string) => `'dp-${slug}', Georgia, serif`

export function loadCosmeticFont(def: FontDef): Promise<boolean> {
  if (typeof document === 'undefined' || !('FontFace' in window)) return Promise.resolve(false)
  const hit = loaded.get(def.slug)
  if (hit) return hit
  const face = new FontFace(`dp-${def.slug}`, `url(/fonts/cosmetics/${def.slug}.woff2) format('woff2')`, {
    weight: String(def.weight),
    style: def.italic ? 'italic' : 'normal',
    display: 'swap',
  })
  const p = face
    .load()
    .then((f) => {
      document.fonts.add(f)
      return true
    })
    .catch(() => false)
  loaded.set(def.slug, p)
  return p
}

/** Carga la fuente de un nombre cuando se muestra (una sola vez por fuente). Devuelve la familia CSS lista para usar. */
export function useCosmeticFont(slug: string | null | undefined): string | undefined {
  const meta = slug ? FONT_META[slug] : undefined
  useEffect(() => {
    if (slug && meta) loadCosmeticFont({ slug, family: meta.family, weight: meta.weight, italic: meta.italic })
  }, [slug, meta])
  return slug && meta ? fontFamilyOf(slug) : undefined
}

/** Qué pieza del «look» cambia cada tipo de cosmético (para equipar desde la tienda o el inventario) */
export function lookPatch(type: CosmeticType, eq: Equip | null): LookConfig | null {
  switch (type) {
    case 'avatar_decoration': return { avatar_deco: eq }
    case 'profile_card': return { card: eq }
    case 'entry_effect': return { entry: eq }
    case 'name_effect': return { name_effect: eq }
    case 'background': return { background: eq }
    case 'title': return { title: eq }
    case 'font': return { name_font: eq ? eq.id : null }
    default: return null // las insignias no se «equipan»: se muestran solas
  }
}

/** Texto de cómo conseguir un cosmético que no se vende */
export function howToGet(it: Pick<CatalogItem, 'obtainable' | 'meta'>): string {
  const how = typeof it.meta?.how === 'string' ? it.meta.how : ''
  if (how) return how
  if (it.obtainable === 'fundador') return 'Solo para cuentas de la beta (Pack Fundador)'
  if (it.obtainable === 'logro') return 'Se consigue con un logro'
  if (it.obtainable === 'evento') return 'Se consigue en un evento'
  return ''
}

export const CATEGORIES: { id: CosmeticType | 'todo' | 'colecciones'; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'avatar_decoration', label: 'Avatares' },
  { id: 'profile_card', label: 'Tarjetas' },
  { id: 'entry_effect', label: 'Entradas' },
  { id: 'name_effect', label: 'Efectos de nombre' },
  { id: 'font', label: 'Fuentes' },
  { id: 'background', label: 'Fondos' },
  { id: 'title', label: 'Títulos' },
  { id: 'colecciones', label: 'Colecciones' },
]
