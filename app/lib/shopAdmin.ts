import { supabase } from './supabaseClient'
import type { CosmeticType, Rarity } from './cosmetics'

// Llamadas del Centro de Mando para el catálogo, las ofertas y las selecciones (todas exigen el permiso «manage_shop» en el servidor)
export type AdminItem = {
  id: string; type: CosmeticType; slug: string; name: string; rarity: Rarity; price: number; collection: string; collection_name: string
  release_version: string; is_active: boolean; obtainable: string; owners: number; sale_price: number | null; sale_name: string | null; wishes: number
}
export type AdminCollection = { id: string; name: string; kind: string; release_version: string; is_active: boolean; items: number }
export type SaleStatus = 'activa' | 'programada' | 'terminada' | 'pausada'
export type AdminSale = {
  id: string; name: string; blurb: string | null; kind: 'oferta' | 'dia' | 'semana' | 'evento'; theme: string
  starts_at: string; ends_at: string; is_active: boolean; in_banner: boolean; sort: number; status: SaleStatus
  items: { item_id: string; sale_price: number }[]
}
export type AdminFeature = {
  id: string; slug: string; title: string; subtitle: string | null; cta: string; theme: string; collections: string[]; item_ids: string[]
  starts_at: string; ends_at: string | null; is_active: boolean; sort: number; status: SaleStatus
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: string }> {
  const { data, error } = await supabase.rpc(fn, args ?? {})
  if (error) {
    const m = error.message || 'Error'
    return { data: null, error: /could not find the function|schema cache/i.test(m) ? 'Falta correr el SQL de la v1.5.0 (v1.5.0_tienda_descuentos.sql).' : m }
  }
  return { data: data as T, error: '' }
}

export const adminItems = () => call<AdminItem[]>('admin_cosmetic_list')
export const adminCollections = () => call<AdminCollection[]>('admin_shop_collections')
export const adminSetPrice = (id: string, price: number) => call<null>('admin_cosmetic_set_price', { p_id: id, p_price: price })
export const adminSales = () => call<AdminSale[]>('admin_shop_sales')
export const adminSaleSave = (id: string | null, data: Record<string, unknown>) => call<{ id: string; items: number }>('admin_shop_sale_save', { p_id: id, p_data: data })
export const adminSaleActive = (id: string, active: boolean) => call<null>('admin_shop_sale_set_active', { p_id: id, p_active: active })
export const adminSaleEnd = (id: string) => call<null>('admin_shop_sale_end', { p_id: id })
export const adminSaleDelete = (id: string) => call<null>('admin_shop_sale_delete', { p_id: id })
export const adminFeatures = () => call<AdminFeature[]>('admin_shop_features')
export const adminFeatureSave = (id: string | null, data: Record<string, unknown>) => call<{ id: string }>('admin_shop_feature_save', { p_id: id, p_data: data })
export const adminFeatureDelete = (id: string) => call<null>('admin_shop_feature_delete', { p_id: id })

/** «2026-10-26T18:30» (hora local) ⇄ ISO */
export function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return ''
  const x = typeof d === 'string' ? new Date(d) : d
  if (isNaN(x.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`
}
export const fromLocalInput = (s: string): string | null => { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d.toISOString() }
export const addHours = (h: number, from: Date = new Date()) => new Date(from.getTime() + h * 3600_000)
export const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
export const sellable = (i: AdminItem) => i.obtainable === 'tienda' && i.price > 0
export const discounted = (base: number, pct: number) => Math.max(1, Math.min(base - 1, Math.round((base * (100 - pct)) / 100)))
export const pctOf = (base: number, sale: number) => (base > 0 ? Math.round(100 - (sale * 100) / base) : 0)
