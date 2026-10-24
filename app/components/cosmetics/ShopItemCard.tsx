'use client'

import { MoonCoinIcon } from '../icons'
import ItemPreview, { type PreviewSubject } from './ItemPreview'
import { RARITY_LABEL, RARITY_STYLE, howToGet, type CatalogItem } from '../../lib/cosmetics'
import { formatNumber } from '../../lib/economy'

/** Tarjeta de un cosmético en la tienda: se ve sobre TU foto y TU nombre */
export default function ShopItemCard({ item, me, onOpen, canAfford, equipped }: { item: CatalogItem; me: PreviewSubject; onOpen: () => void; canAfford: boolean; equipped?: boolean }) {
  const forSale = item.obtainable === 'tienda' && item.price > 0
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${item.name}, ${RARITY_LABEL[item.rarity]}${item.owned ? ', ya lo tienes' : forSale ? `, ${item.price} Lunas` : ''}`}
      className={`press group relative flex flex-col text-left rounded-2xl border bg-ink-900/60 hover:bg-ink-900 overflow-hidden transition ${RARITY_STYLE[item.rarity].split(' ')[0]} ${item.rarity === 'legendario' || item.rarity === 'mitico' ? 'shadow-[0_0_18px_-6px] shadow-amber-400/40' : ''}`}
    >
      <div className="relative bg-ink-950/60 min-h-[150px]">
        <ItemPreview type={item.type} slug={item.slug} me={me} compact />
        {item.owned && (
          <span className="absolute top-2 right-2 rounded-full bg-emerald-500/90 text-ink-950 text-[10px] font-bold px-2 py-0.5">
            {equipped ? 'Puesto' : '✓ Tuyo'}
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
            <span className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${canAfford ? 'text-amber-200' : 'text-neutral-500'}`}>
              <MoonCoinIcon className="w-4 h-4" />
              {formatNumber(item.price)}
            </span>
          ) : (
            <span className="text-[11px] text-neutral-500 truncate" title={howToGet(item)}>No se vende</span>
          )}
        </div>
      </div>
    </button>
  )
}
