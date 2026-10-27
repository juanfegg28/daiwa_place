'use client'

import { RARITY_LABEL, TYPE_LABEL, onSale, salePct, type CatalogItem, type CosmeticType, type Rarity, type ShopCollection } from '../../lib/cosmetics'
import { sortItems } from './shopUtil'

export type SortMode = 'reco' | 'precio-asc' | 'precio-desc' | 'descuento' | 'rareza' | 'nombre'
export type FState = { type: CosmeticType | 'todo'; rarity: Rarity | ''; coll: string; afford: boolean; hideOwned: boolean; sort: SortMode }
export const F_INIT: FState = { type: 'todo', rarity: '', coll: '', afford: false, hideOwned: false, sort: 'reco' }
const RARITIES: Rarity[] = ['comun', 'raro', 'epico', 'legendario', 'mitico']
const TYPES: CosmeticType[] = ['avatar_decoration', 'profile_card', 'entry_effect', 'name_effect', 'font', 'background', 'title']

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function applyFilters(items: CatalogItem[], f: FState, balance: number, q = '', collName?: Map<string, string>): CatalogItem[] {
  const needle = norm(q.trim())
  const out = items.filter((i) => {
    if (f.type !== 'todo' && i.type !== f.type) return false
    if (f.rarity && i.rarity !== f.rarity) return false
    if (f.coll && i.collection !== f.coll) return false
    if (f.afford && !(i.price > 0 && i.price <= balance && !i.owned)) return false
    if (f.hideOwned && i.owned) return false
    if (needle) {
      const hay = norm(`${i.name} ${collName?.get(i.collection) ?? ''} ${TYPE_LABEL[i.type]} ${RARITY_LABEL[i.rarity]} ${i.sale_id ? 'oferta descuento' : ''}`)
      if (!needle.split(/\s+/).every((w) => hay.includes(w))) return false
    }
    return true
  })
  return sortItems(out, f.sort)
}

const sel = 'rounded-full bg-ink-800 border border-ink-700 text-neutral-200 px-3 py-1.5 text-sm'

/** Barra de filtros compartida (Explorar, Selecciones, Descuentos). Los selectores sobrantes se esconden con las banderas. */
export function FilterBar({ f, set, collections, showType = false, showColl = true, total, types }: {
  f: FState; set: (n: FState) => void; collections?: ShopCollection[]; showType?: boolean; showColl?: boolean; total: number; types?: CosmeticType[]
}) {
  const up = (p: Partial<FState>) => set({ ...f, ...p })
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {showType && (
        <select value={f.type} onChange={(e) => up({ type: e.target.value as FState['type'] })} aria-label="Tipo" className={sel}>
          <option value="todo">Todo tipo</option>
          {(types ?? TYPES).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      )}
      <select value={f.rarity} onChange={(e) => up({ rarity: e.target.value as Rarity | '' })} aria-label="Rareza" className={sel}>
        <option value="">Toda rareza</option>
        {RARITIES.map((r) => <option key={r} value={r}>{RARITY_LABEL[r]}</option>)}
      </select>
      {showColl && collections && (
        <select value={f.coll} onChange={(e) => up({ coll: e.target.value })} aria-label="Colección" className={`${sel} max-w-[11rem]`}>
          <option value="">Toda colección</option>
          {collections.filter((c) => c.kind !== 'base').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      <select value={f.sort} onChange={(e) => up({ sort: e.target.value as SortMode })} aria-label="Ordenar" className={sel}>
        <option value="reco">Recomendado</option>
        <option value="descuento">Mayor descuento</option>
        <option value="precio-asc">Precio: menor a mayor</option>
        <option value="precio-desc">Precio: mayor a menor</option>
        <option value="rareza">Más raros primero</option>
        <option value="nombre">Nombre A–Z</option>
      </select>
      <label className="inline-flex items-center gap-1.5 text-neutral-300"><input type="checkbox" checked={f.afford} onChange={(e) => up({ afford: e.target.checked })} className="accent-amber-400" /> Lo que puedo pagar</label>
      <label className="inline-flex items-center gap-1.5 text-neutral-300"><input type="checkbox" checked={f.hideOwned} onChange={(e) => up({ hideOwned: e.target.checked })} className="accent-amber-400" /> Ocultar lo que ya tengo</label>
      <span className="ml-auto text-xs text-neutral-500">{total} cosméticos</span>
    </div>
  )
}
export { onSale, salePct }
