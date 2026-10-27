'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import SelectionView from '../../../components/shop/SelectionView'
import { useShop } from '../../../components/shop/ShopProvider'

export default function Coleccion() {
  const { id } = useParams<{ id: string }>()
  const shop = useShop()
  const c = shop.collections.find((x) => x.id === id)
  const items = useMemo(() => shop.shelf.filter((i) => i.collection === id), [shop.shelf, id])
  if (shop.loading) return <div className="h-52 rounded-3xl bg-ink-800/60 animate-pulse" aria-busy="true" />
  if (!c || items.length === 0) {
    return (
      <div className="text-center py-16 rounded-3xl border border-ink-700 bg-ink-900/50">
        <h1 className="font-display text-xl font-semibold text-neutral-50">No encontramos esa colección</h1>
        <Link href="/tienda/colecciones" className="press inline-block mt-4 rounded-xl bg-garnet-600 hover:bg-garnet-500 text-white font-semibold px-5 py-2.5 text-sm">Ver colecciones</Link>
      </div>
    )
  }
  const theme = shop.newIds.has(items[0].id) ? 'halloween' : 'garnet'
  return <SelectionView title={c.name} subtitle={c.theme} theme={theme} items={items} eyebrow="Colección" />
}
