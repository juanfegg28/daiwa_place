'use client'

import { HeartIcon } from '../icons'
import ItemPreview, { type PreviewSubject } from './ItemPreview'
import { useHoverPlay } from './usePlay'
import { PriceLine, SalePill } from '../shop/ShopBits'
import { RARITY_LABEL, RARITY_STYLE, howToGet, onSale, salePct, type CatalogItem } from '../../lib/cosmetics'
import { MoonCoinIcon } from '../icons'
import { formatNumber } from '../../lib/economy'

/** Tarjeta de un cosmético en la tienda: se ve sobre TU foto y TU nombre */
export default function ShopItemCard({ item, me, onOpen, canAfford, equipped, isNew, onWish }: {
  item: CatalogItem; me: PreviewSubject; onOpen: () => void; canAfford: boolean; equipped?: boolean
  /** v1.5.0 · etiqueta «Nuevo» */
  isNew?: boolean
  /** v1.5.0 · corazón de deseos (si no se pasa, no se muestra) */
  onWish?: () => void
}) {
  const forSale = item.obtainable === 'tienda' && item.price > 0
  const sale = onSale(item)
  // v1.4.5: la miniatura está quieta; se anima solo con el cursor encima (PC). En el celular el toque abre la hoja de detalle, que sí se anima.
  const { playing, bind } = useHoverPlay()
  return (
    <div className="relative group/card" {...bind}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${item.name}, ${RARITY_LABEL[item.rarity]}${item.owned ? ', ya lo tienes' : forSale ? `, ${formatNumber(item.price)} Lunas${sale ? `, en oferta, antes ${formatNumber(item.base_price ?? 0)}` : ''}` : ''}`}
        className={`press group relative flex flex-col w-full h-full text-left rounded-2xl border bg-ink-900/60 hover:bg-ink-900 overflow-hidden transition ${RARITY_STYLE[item.rarity].split(' ')[0]} ${item.rarity === 'legendario' || item.rarity === 'mitico' ? 'shadow-[0_0_18px_-6px] shadow-amber-400/40' : ''} ${sale && !item.owned ? 'ring-1 ring-emerald-500/50' : ''}`}
      >
        <div className="relative bg-ink-950/60 min-h-[150px]">
          <ItemPreview type={item.type} slug={item.slug} me={me} compact lazy playing={playing} />
          {item.owned ? (
            <span className="absolute top-2 right-2 rounded-full bg-emerald-500/90 text-ink-950 text-[10px] font-bold px-2 py-0.5">
              {equipped ? 'Puesto' : '✓ Tuyo'}
            </span>
          ) : (
            <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
              {sale && <SalePill pct={salePct(item)} className="shadow" />}
              {isNew && <span className="rounded-md bg-garnet-600 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide shadow">Nuevo</span>}
            </span>
          )}
        </div>
        <div className="px-3 py-2.5 border-t border-ink-800">
          <p className="text-sm font-semibold text-neutral-100 truncate">{item.name}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className={`text-[10px] uppercase tracking-wide font-semibold ${RARITY_STYLE[item.rarity].split(' ')[1]}`}>{RARITY_LABEL[item.rarity]}</span>
            {item.owned ? (
              <span className="text-xs text-emerald-400">Ya lo tienes</span>
            ) : forSale ? (
              sale ? <PriceLine item={item} canAfford={canAfford} /> : (
                <span className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${canAfford ? 'text-amber-200' : 'text-neutral-500'}`}>
                  <MoonCoinIcon className="w-4 h-4" />
                  {formatNumber(item.price)}
                </span>
              )
            ) : (
              <span className="text-[11px] text-neutral-500 truncate" title={howToGet(item)}>No se vende</span>
            )}
          </div>
        </div>
      </button>
      {onWish && forSale && !item.owned && (
        <button type="button" onClick={onWish} aria-pressed={!!item.wished} aria-label={item.wished ? `Quitar ${item.name} de mis deseos` : `Agregar ${item.name} a mis deseos`}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-ink-950/70 border border-ink-700 inline-flex items-center justify-center transition hover:bg-ink-900 active:scale-90 ${item.wished ? 'text-garnet-400' : 'text-neutral-300 sm:opacity-0 sm:group-hover/card:opacity-100 focus:opacity-100'}`}>
          <HeartIcon className="w-4 h-4" filled={!!item.wished} />
        </button>
      )}
    </div>
  )
}
