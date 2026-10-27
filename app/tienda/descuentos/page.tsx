'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FilterBar, F_INIT, applyFilters, type FState } from '../../components/shop/ItemFilters'
import { ItemGrid } from '../../components/shop/ShopItems'
import { useShop } from '../../components/shop/ShopProvider'
import { SaleHeader } from '../../components/shop/SaleBanner'
import { saleSummary } from '../../components/shop/shopUtil'
import { type CatalogItem } from '../../lib/cosmetics'

export default function Descuentos() {
  const shop = useShop()
  const [f, setF] = useState<FState>({ ...F_INIT, sort: 'descuento' })
  const groups = useMemo(() => shop.sales.map((s) => ({ s, ...saleSummary(s, shop.shelf) })).filter((g) => g.count > 0), [shop.sales, shop.shelf])
  const known = new Set(groups.map((g) => g.s.id))
  const loose = useMemo(() => shop.shelf.filter((i) => i.sale_id && !known.has(i.sale_id)), [shop.shelf, groups]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = shop.shelf.filter((i) => i.sale_id).length

  // Entrar con #sale-<id> lleva directo a esa oferta (el banner de la portada usa esto)
  useEffect(() => {
    if (!groups.length || typeof window === 'undefined') return
    const id = window.location.hash.slice(1)
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [groups.length])

  if (shop.loading || !shop.ready) return <div className="space-y-3" aria-busy="true"><div className="h-40 rounded-3xl bg-ink-800/60 animate-pulse" /><div className="h-52 rounded-2xl bg-ink-800/60 animate-pulse" /></div>
  if (total === 0) {
    return (
      <div className="text-center py-16 rounded-3xl border border-ink-700 bg-ink-900/50">
        <p className="text-4xl mb-2" aria-hidden="true">🌙</p>
        <h2 className="font-display text-xl font-semibold text-neutral-50">No hay descuentos por ahora</h2>
        <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">Cuando haya ofertas aparecerán aquí con su cuenta atrás. Agrega cosméticos a tu lista de deseos con el corazón para no perdértelas.</p>
        <Link href="/tienda/explorar" className="press inline-block mt-4 rounded-xl bg-garnet-600 hover:bg-garnet-500 text-white font-semibold px-5 py-2.5 text-sm">Explorar la tienda</Link>
      </div>
    )
  }
  const view = (items: CatalogItem[]) => applyFilters(items, f, shop.balance)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-neutral-50">Descuentos <span className="text-base text-neutral-500 font-normal">· {total} cosméticos</span></h1>
      </div>
      <FilterBar f={f} set={setF} collections={shop.collections} showType showColl={false} total={groups.reduce((n, g) => n + view(g.items).length, 0) + view(loose).length} />
      {groups.map(({ s, items, maxPct, count }) => {
        const list = view(items)
        return (
          <section key={s.id} id={`sale-${s.id}`} className="scroll-mt-4 rounded-3xl border border-emerald-500/30 bg-ink-900/40 overflow-hidden">
            <SaleHeader sale={s} maxPct={maxPct} count={count} />
            <div className="p-3 sm:p-4"><ItemGrid items={list} emptyText="Nada de esta oferta con esos filtros." /></div>
          </section>
        )
      })}
      {loose.length > 0 && <section><h2 className="font-display text-lg font-semibold text-neutral-50 mb-2">Otras ofertas</h2><ItemGrid items={view(loose)} /></section>}
    </div>
  )
}
