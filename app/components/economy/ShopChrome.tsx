'use client'

import Link from 'next/link'
import { MoonCoinIcon, StoreIcon, TargetIcon } from '../icons'
import { formatNumber, type WalletSummary } from '../../lib/economy'

export function ShopTabs({ active }: { active: 'catalogo' | 'canjear' }) {
  const tab = (on: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition ${
      on ? 'bg-garnet-600 text-white border-garnet-500' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'
    }`
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      <Link href="/tienda" className={tab(active === 'catalogo')}>Catálogo</Link>
      <Link href="/tienda/canjear" className={tab(active === 'canjear')}>Canjear código</Link>
    </div>
  )
}

export function ShopHeader({ w }: { w: WalletSummary | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <h1 className="font-display text-2xl font-semibold text-neutral-50 flex items-center gap-2">
        <StoreIcon className="w-6 h-6 text-garnet-400" /> Tienda
      </h1>
      <div className="flex items-center gap-2">
        {w && (
          <Link href="/monedas" className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 px-3 py-1.5 text-sm font-semibold tabular-nums">
            <MoonCoinIcon className="w-[18px] h-[18px]" />
            {formatNumber(w.balance)}
          </Link>
        )}
        <Link href="/misiones" className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800/70 text-neutral-200 px-3 py-1.5 text-sm hover:bg-ink-700 transition">
          <TargetIcon className="w-4 h-4" /> Misiones
        </Link>
      </div>
    </div>
  )
}

