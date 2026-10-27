'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import ItemPreview from '../cosmetics/ItemPreview'
import ShopItemCard from '../cosmetics/ShopItemCard'
import { useHoverPlay } from '../cosmetics/usePlay'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import { PriceLine, SalePill } from './ShopBits'
import { useShop } from './ShopProvider'
import { RARITY_STYLE, onSale, salePct, type CatalogItem } from '../../lib/cosmetics'

/** Rejilla de cosméticos con «Mostrar más»: solo se dibujan 24 a la vez (más rápido que pintar todo el catálogo) */
export function ItemGrid({ items, pageSize = 24, emptyText = 'No hay nada con esos filtros.', cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' }: { items: CatalogItem[]; pageSize?: number; emptyText?: string; cols?: string }) {
  const shop = useShop()
  const [count, setCount] = useState(pageSize)
  // Si cambian los filtros (otra lista), se vuelve a la primera página
  const sig = items.length + ':' + (items[0]?.id ?? '') + ':' + (items[items.length - 1]?.id ?? '')
  const lastSig = useRef(sig)
  useEffect(() => { if (lastSig.current !== sig) { lastSig.current = sig; setCount(pageSize) } }, [sig, pageSize])
  if (shop.loading) return <div className={`grid ${cols} gap-3`} aria-busy="true">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-ink-800/60 animate-pulse" />)}</div>
  if (items.length === 0) return <p className="text-center text-neutral-500 py-12">{emptyText}</p>
  const shown = items.slice(0, count)
  return (
    <>
      <div className={`grid ${cols} gap-3`}>
        {shown.map((i) => (
          <ShopItemCard key={i.id} item={i} me={shop.me} canAfford={i.price <= shop.balance} equipped={shop.isWorn(i)} isNew={shop.newIds.has(i.id)}
            onOpen={() => shop.open(i)} onWish={() => shop.toggleWish(i)} />
        ))}
      </div>
      {items.length > count && (
        <div className="text-center mt-5">
          <button type="button" onClick={() => setCount((c) => c + pageSize)} className="press rounded-full border border-ink-600 bg-ink-800/70 hover:bg-ink-700 text-neutral-100 px-5 py-2 text-sm font-medium">
            Mostrar más <span className="text-neutral-500">({items.length - count} restantes)</span>
          </button>
        </div>
      )}
    </>
  )
}

/** Tarjeta chica para los banners: miniatura quieta (se anima con el cursor) + nombre + precio */
export function MiniItem({ item, size = 'md' }: { item: CatalogItem; size?: 'sm' | 'md' }) {
  const shop = useShop()
  const { playing, bind } = useHoverPlay()
  const w = size === 'sm' ? 'w-[104px] sm:w-[120px]' : 'w-[118px] sm:w-[152px]'
  const h = size === 'sm' ? 'h-[92px] sm:h-[104px]' : 'h-[112px] sm:h-[150px]'
  return (
    <button type="button" onClick={() => shop.open(item)} {...bind} aria-label={`${item.name}: ver detalle`}
      className={`press group relative ${w} shrink-0 text-left rounded-2xl border bg-ink-950/75 backdrop-blur-sm overflow-hidden hover:bg-ink-950/90 transition ${RARITY_STYLE[item.rarity].split(' ')[0]}`}>
      <div className={`relative ${h} overflow-hidden`}>
        <ItemPreview type={item.type} slug={item.slug} me={shop.me} compact playing={playing} />
        {onSale(item) && <SalePill pct={salePct(item)} className="absolute top-1.5 left-1.5" />}
      </div>
      <div className="px-2.5 py-2 border-t border-white/5">
        <p className="text-[12px] font-semibold text-neutral-100 truncate">{item.name}</p>
        <div className="mt-0.5">{item.owned ? <span className="text-[11px] text-emerald-400">Ya lo tienes</span> : <PriceLine item={item} canAfford={item.price <= shop.balance} />}</div>
      </div>
    </button>
  )
}

/** Carril horizontal con flechas en PC y deslizar en el celular */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: 'smooth' })
  return (
    <div className="relative group/rail" role="region" aria-label={label}>
      <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scroll-smooth [scrollbar-width:thin]">{children}</div>
      <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="hidden md:inline-flex absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ink-950/85 border border-ink-600 items-center justify-center text-neutral-100 opacity-0 group-hover/rail:opacity-100 focus:opacity-100 transition"><ChevronLeftIcon className="w-5 h-5" /></button>
      <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="hidden md:inline-flex absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ink-950/85 border border-ink-600 items-center justify-center text-neutral-100 opacity-0 group-hover/rail:opacity-100 focus:opacity-100 transition"><ChevronRightIcon className="w-5 h-5" /></button>
    </div>
  )
}
