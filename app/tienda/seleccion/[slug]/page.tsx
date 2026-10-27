'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import SelectionView from '../../../components/shop/SelectionView'
import { useShop } from '../../../components/shop/ShopProvider'
import { featureItems } from '../../../components/shop/shopUtil'

export default function Seleccion() {
  const { slug } = useParams<{ slug: string }>()
  const shop = useShop()
  const f = shop.features.find((x) => x.slug === slug)
  const items = useMemo(() => (f ? featureItems(f, shop.shelf) : []), [f, shop.shelf])
  if (!shop.ready || shop.loading) return <div className="h-52 rounded-3xl bg-ink-800/60 animate-pulse" aria-busy="true" />
  if (!f) {
    return (
      <div className="text-center py-16 rounded-3xl border border-ink-700 bg-ink-900/50">
        <h1 className="font-display text-xl font-semibold text-neutral-50">Esta selección ya no está disponible</h1>
        <p className="text-sm text-neutral-400 mt-1">Pudo haber terminado. Mira lo que hay en la tienda:</p>
        <Link href="/tienda/explorar" className="press inline-block mt-4 rounded-xl bg-garnet-600 hover:bg-garnet-500 text-white font-semibold px-5 py-2.5 text-sm">Explorar la tienda</Link>
      </div>
    )
  }
  return <SelectionView title={f.title} subtitle={f.subtitle} theme={f.theme} items={items} until={f.ends_at} />
}
