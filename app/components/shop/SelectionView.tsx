'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import BannerArt from './BannerArt'
import { FilterBar, F_INIT, applyFilters, type FState } from './ItemFilters'
import { ItemGrid } from './ShopItems'
import { useShop } from './ShopProvider'
import { fmtDate } from './shopUtil'
import { themeOf } from './shopThemes'
import { ChevronLeftIcon } from '../icons'
import type { CatalogItem } from '../../lib/cosmetics'

/** Página de una selección (p. ej. «Selección de Halloween») o de una colección: encabezado ilustrado + filtros + rejilla */
export default function SelectionView({ title, subtitle, theme, items, until, eyebrow = 'Selección' }: { title: string; subtitle?: string | null; theme: string; items: CatalogItem[]; until?: string | null; eyebrow?: string }) {
  const shop = useShop()
  const [f, setF] = useState<FState>(F_INIT)
  const t = themeOf(theme)
  const collIds = useMemo(() => Array.from(new Set(items.map((i) => i.collection))), [items])
  const shown = useMemo(() => applyFilters(items, f, shop.balance, shop.search, shop.collName), [items, f, shop.balance, shop.search, shop.collName])
  const colls = shop.collections.filter((c) => collIds.includes(c.id))
  const free = items.filter((i) => !i.owned).length
  return (
    <div className="space-y-4">
      <Link href="/tienda" className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-100"><ChevronLeftIcon className="w-4 h-4" /> Destacado</Link>
      <header className="relative overflow-hidden rounded-3xl border border-white/10 isolate">
        <BannerArt theme={theme} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
        <div className="relative z-10 p-5 sm:p-8 min-h-[200px] flex flex-col justify-end">
          <span className="self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ background: t.c, color: '#120408' }}>{eyebrow}</span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-2 drop-shadow-[0_2px_12px_rgba(0,0,0,.6)]">{title}</h1>
          {subtitle && <p className="text-sm sm:text-base text-white/85 mt-1 max-w-xl">{subtitle}</p>}
          <p className="text-xs text-white/70 mt-2">{items.length} cosméticos · {free} que aún no tienes{until ? ` · hasta el ${fmtDate(until)}` : ''}</p>
        </div>
      </header>
      {colls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Colecciones de la selección">
          <button type="button" role="tab" aria-selected={f.coll === ''} onClick={() => setF({ ...f, coll: '' })} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition ${f.coll === '' ? 'bg-garnet-600 border-garnet-500 text-white' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>Todas</button>
          {colls.map((c) => <button key={c.id} type="button" role="tab" aria-selected={f.coll === c.id} onClick={() => setF({ ...f, coll: f.coll === c.id ? '' : c.id })} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition ${f.coll === c.id ? 'bg-garnet-600 border-garnet-500 text-white' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>{c.name}</button>)}
        </div>
      )}
      <FilterBar f={f} set={setF} collections={shop.collections} showType showColl={false} total={shown.length} />
      <ItemGrid items={shown} />
    </div>
  )
}
