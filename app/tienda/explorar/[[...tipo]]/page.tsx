'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FilterBar, F_INIT, applyFilters, type FState } from '../../../components/shop/ItemFilters'
import { ItemGrid } from '../../../components/shop/ShopItems'
import { useShop } from '../../../components/shop/ShopProvider'
import { CATEGORY_SLUGS } from '../../../components/shop/shopRoutes'

export default function Explorar() {
  const shop = useShop()
  const params = useParams<{ tipo?: string[] }>()
  const cat = CATEGORY_SLUGS.find((c) => c.slug === params.tipo?.[0])
  const [f, setF] = useState<FState>(F_INIT)
  const base = useMemo(() => (cat ? shop.shelf.filter((i) => i.type === cat.type) : shop.shelf), [shop.shelf, cat])
  const shown = useMemo(() => applyFilters(base, f, shop.balance, shop.search, shop.collName), [base, f, shop.balance, shop.search, shop.collName])
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categorías">
        <Link href="/tienda/explorar" role="tab" aria-selected={!cat} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition ${!cat ? 'bg-garnet-600 border-garnet-500 text-white' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>Todo</Link>
        {CATEGORY_SLUGS.map((c) => (
          <Link key={c.slug} href={`/tienda/explorar/${c.slug}`} role="tab" aria-selected={cat?.slug === c.slug} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition ${cat?.slug === c.slug ? 'bg-garnet-600 border-garnet-500 text-white' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>{c.label}</Link>
        ))}
      </div>
      {shop.search.trim() && (
        <p className="text-sm text-neutral-300 flex items-center gap-2">Resultados para <b className="text-neutral-50">«{shop.search.trim()}»</b>
          <button type="button" onClick={() => shop.setSearch('')} className="text-xs rounded-full border border-ink-600 px-2 py-0.5 text-neutral-400 hover:text-white hover:bg-ink-800">Borrar búsqueda</button></p>
      )}
      <FilterBar f={f} set={setF} collections={shop.collections} total={shown.length} />
      <ItemGrid items={shown} />
    </div>
  )
}
