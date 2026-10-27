'use client'

import { useMemo, useState } from 'react'
import { RARITY_LABEL, TYPE_LABEL, type CosmeticType } from '../lib/cosmetics'
import { formatNumber } from '../lib/economy'
import type { AdminCollection, AdminItem } from '../lib/shopAdmin'

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const inputCls = 'w-full rounded-lg bg-ink-800 border border-ink-700 focus:border-garnet-500 outline-none px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500'
export const btnCls = 'rounded-lg border border-ink-600 bg-ink-800 hover:bg-ink-700 text-neutral-100 px-3 py-1.5 text-sm transition disabled:opacity-50'
export const btnPrimary = 'rounded-lg bg-garnet-600 hover:bg-garnet-500 text-white font-semibold px-4 py-2 text-sm transition disabled:opacity-50'

const TYPES: CosmeticType[] = ['avatar_decoration', 'profile_card', 'entry_effect', 'name_effect', 'font', 'background', 'title']

/**
 * Selector de cosméticos con buscador y filtros. Sirve para armar ofertas y selecciones:
 * se pueden marcar de uno en uno, todo lo que se ve con el filtro actual, o una colección entera.
 */
export default function ItemPicker({ items, collections, selected, onToggle, onMany, maxHeight = 'max-h-[420px]' }: {
  items: AdminItem[]; collections: AdminCollection[]; selected: Set<string>
  onToggle: (item: AdminItem) => void
  /** marca o desmarca varios a la vez */
  onMany: (items: AdminItem[], on: boolean) => void
  maxHeight?: string
}) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<CosmeticType | ''>('')
  const [coll, setColl] = useState('')
  const [rarity, setRarity] = useState('')
  const [onlySel, setOnlySel] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [count, setCount] = useState(60)

  const shown = useMemo(() => {
    const n = norm(q.trim())
    return items.filter((i) => {
      if (!hidden && !i.is_active) return false
      if (type && i.type !== type) return false
      if (coll && i.collection !== coll) return false
      if (rarity && i.rarity !== rarity) return false
      if (onlySel && !selected.has(i.id)) return false
      if (n && !norm(`${i.name} ${i.collection_name} ${TYPE_LABEL[i.type]} ${i.slug}`).includes(n)) return false
      return true
    })
  }, [items, q, type, coll, rarity, onlySel, hidden, selected])

  const allShownOn = shown.length > 0 && shown.every((i) => selected.has(i.id))
  const collsWithItems = collections.filter((c) => items.some((i) => i.collection === c.id))
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-4">
        <input value={q} onChange={(e) => { setQ(e.target.value); setCount(60) }} placeholder="Buscar por nombre…" className={`${inputCls} sm:col-span-2`} aria-label="Buscar cosmético" />
        <select value={type} onChange={(e) => { setType(e.target.value as CosmeticType | ''); setCount(60) }} className={inputCls} aria-label="Tipo"><option value="">Todo tipo</option>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select>
        <select value={coll} onChange={(e) => { setColl(e.target.value); setCount(60) }} className={inputCls} aria-label="Colección"><option value="">Toda colección</option>{collsWithItems.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active ? '' : ' (oculta)'}</option>)}</select>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select value={rarity} onChange={(e) => setRarity(e.target.value)} className={`${inputCls} !w-auto`} aria-label="Rareza"><option value="">Toda rareza</option>{(['comun', 'raro', 'epico', 'legendario', 'mitico'] as const).map((r) => <option key={r} value={r}>{RARITY_LABEL[r]}</option>)}</select>
        <label className="inline-flex items-center gap-1.5 text-neutral-300"><input type="checkbox" checked={onlySel} onChange={(e) => setOnlySel(e.target.checked)} className="accent-garnet-500" /> Solo los elegidos</label>
        <label className="inline-flex items-center gap-1.5 text-neutral-300"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="accent-garnet-500" /> Incluir ocultos (aún no lanzados)</label>
        <span className="ml-auto flex gap-2">
          <button type="button" className={btnCls} disabled={shown.length === 0} onClick={() => onMany(shown, !allShownOn)}>{allShownOn ? `Quitar los ${shown.length} que se ven` : `Elegir los ${shown.length} que se ven`}</button>
          {selected.size > 0 && <button type="button" className={btnCls} onClick={() => onMany(items.filter((i) => selected.has(i.id)), false)}>Limpiar ({selected.size})</button>}
        </span>
      </div>
      <ul className={`${maxHeight} overflow-y-auto rounded-xl border border-ink-700 divide-y divide-ink-800 bg-ink-950/40`}>
        {shown.slice(0, count).map((i) => {
          const on = selected.has(i.id)
          return (
            <li key={i.id}>
              <label className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-ink-800/70 ${on ? 'bg-garnet-600/10' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => onToggle(i)} className="accent-garnet-500 w-4 h-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-neutral-100 truncate">{i.name}{!i.is_active && <span className="ml-2 text-[10px] rounded bg-ink-700 text-neutral-400 px-1.5 py-0.5">oculto</span>}</span>
                  <span className="block text-[11px] text-neutral-500 truncate">{TYPE_LABEL[i.type]} · {i.collection_name} · {RARITY_LABEL[i.rarity]}</span>
                </span>
                {i.sale_price != null && <span className="text-[10px] rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 shrink-0" title={i.sale_name ?? ''}>ya en oferta</span>}
                <span className="text-sm tabular-nums text-amber-200 shrink-0">{formatNumber(i.price)} ☾</span>
              </label>
            </li>
          )
        })}
        {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">Nada con esos filtros.</li>}
      </ul>
      {shown.length > count && <button type="button" className={btnCls} onClick={() => setCount((c) => c + 60)}>Mostrar más ({shown.length - count})</button>}
    </div>
  )
}
