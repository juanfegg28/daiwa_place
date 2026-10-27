'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { HeartIcon, MoonCoinIcon } from '../../components/icons'
import { ItemGrid } from '../../components/shop/ShopItems'
import { useShop } from '../../components/shop/ShopProvider'
import { formatNumber } from '../../lib/economy'

export default function Deseos() {
  const shop = useShop()
  const wished = useMemo(() => shop.shelf.filter((i) => i.wished && !i.owned).sort((a, b) => Number(!!b.sale_id) - Number(!!a.sale_id) || a.price - b.price), [shop.shelf])
  const total = wished.reduce((n, i) => n + i.price, 0)
  const onSaleN = wished.filter((i) => i.sale_id).length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-neutral-50 inline-flex items-center gap-2"><HeartIcon className="w-6 h-6 text-garnet-400" filled /> Mi lista de deseos</h1>
        {wished.length > 0 && (
          <p className="text-sm text-neutral-300 inline-flex items-center gap-1.5 flex-wrap">
            Todo junto: <b className="inline-flex items-center gap-1 text-amber-200 tabular-nums"><MoonCoinIcon className="w-4 h-4" />{formatNumber(total)}</b>
            {total > shop.balance ? <span className="text-neutral-500">· te faltan {formatNumber(total - shop.balance)} ☾</span> : <span className="text-emerald-400">· ¡te alcanza!</span>}
            {onSaleN > 0 && <span className="rounded-md bg-emerald-500 text-ink-950 text-[11px] font-extrabold px-1.5 py-0.5">{onSaleN} en oferta</span>}
          </p>
        )}
      </div>
      {wished.length === 0 && !shop.loading ? (
        <div className="text-center py-14 rounded-3xl border border-ink-700 bg-ink-900/50">
          <HeartIcon className="w-10 h-10 mx-auto text-garnet-400/70" />
          <h2 className="font-display text-lg font-semibold text-neutral-50 mt-2">Aún no guardas nada</h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">Toca el corazón de cualquier cosmético para guardarlo aquí. Si entra en oferta, lo verás marcado.</p>
          <Link href="/tienda/explorar" className="press inline-block mt-4 rounded-xl bg-garnet-600 hover:bg-garnet-500 text-white font-semibold px-5 py-2.5 text-sm">Explorar la tienda</Link>
        </div>
      ) : <ItemGrid items={wished} />}
    </div>
  )
}
