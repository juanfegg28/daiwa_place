import { onSale, salePct, type CatalogItem, type ShopFeature, type ShopSale } from '../../lib/cosmetics'

const RANK: Record<string, number> = { mitico: 5, legendario: 4, epico: 3, raro: 2, comun: 1 }

/** Los cosméticos de una selección: de sus colecciones + los sueltos (solo lo que de verdad se vende y está en el catálogo) */
export function featureItems(f: Pick<ShopFeature, 'collections' | 'item_ids'>, shelf: CatalogItem[]): CatalogItem[] {
  const ids = new Set(f.item_ids)
  const colls = new Set(f.collections)
  return shelf.filter((i) => colls.has(i.collection) || ids.has(i.id))
}

/** Elige n destacados para las tarjetas del banner: mejores rarezas, de colecciones distintas y priorizando decoraciones y tarjetas */
export function pickHighlights(items: CatalogItem[], n: number): CatalogItem[] {
  const pool = items
    .filter((i) => (i.type === 'avatar_decoration' || i.type === 'profile_card') && i.obtainable === 'tienda' && !i.owned)
    .sort((a, b) => (RANK[b.rarity] - RANK[a.rarity]) || (b.price - a.price) || a.name.localeCompare(b.name))
  const out: CatalogItem[] = []
  const usedColl = new Set<string>()
  for (const i of pool) {
    if (out.length >= n) break
    if (usedColl.has(i.collection)) continue
    if (i.type === 'avatar_decoration' || out.filter((o) => o.type === 'profile_card').length < 1) { out.push(i); usedColl.add(i.collection) }
  }
  for (const i of pool) { if (out.length >= n) break; if (!out.includes(i)) out.push(i) }
  return out.slice(0, n)
}

/** Resumen de una oferta para el banner: cuántos ítems y el descuento más grande */
export function saleSummary(sale: ShopSale, shelf: CatalogItem[]) {
  const items = shelf.filter((i) => i.sale_id === sale.id)
  const maxPct = items.reduce((m, i) => Math.max(m, salePct(i)), 0)
  return { items, maxPct, count: items.length }
}

export const sortItems = (items: CatalogItem[], mode: 'reco' | 'precio-asc' | 'precio-desc' | 'descuento' | 'rareza' | 'nombre'): CatalogItem[] => {
  const a = [...items]
  switch (mode) {
    case 'precio-asc': return a.sort((x, y) => x.price - y.price)
    case 'precio-desc': return a.sort((x, y) => y.price - x.price)
    case 'descuento': return a.sort((x, y) => salePct(y) - salePct(x) || x.price - y.price)
    case 'rareza': return a.sort((x, y) => RANK[y.rarity] - RANK[x.rarity] || y.price - x.price)
    case 'nombre': return a.sort((x, y) => x.name.localeCompare(y.name))
    default: return a
  }
}
export { onSale, salePct }

export function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long' }) } catch { return '' }
}
/** "2 d 4 h", "3 h 12 min", "12 min" */
export function timeLeft(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return 'terminó'
  const min = Math.floor(ms / 60000)
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60
  if (d >= 1) return `${d} d ${h} h`
  if (h >= 1) return `${h} h ${m} min`
  return m >= 1 ? `${m} min` : 'menos de 1 min'
}
