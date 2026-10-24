'use client'

import Link from 'next/link'
import { MoonCoinIcon, StoreIcon, TargetIcon } from '../icons'
import { formatNumber, type WalletSummary } from '../../lib/economy'
import { ClaimDot } from './ClaimDot'

export function ShopTabs({ active }: { active: 'catalogo' | 'inventario' | 'canjear' }) {
  const tab = (on: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition ${
      on ? 'bg-garnet-600 text-white border-garnet-500' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'
    }`
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      <Link href="/tienda" className={tab(active === 'catalogo')}>Catálogo</Link>
      <Link href="/tienda/inventario" className={tab(active === 'inventario')}>Mi inventario</Link>
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
          <Link href="/monedas" aria-label={`Mi saldo: ${formatNumber(w.balance)}`} className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-gradient-to-b from-amber-400/25 to-amber-600/15 text-amber-100 px-3.5 py-2 text-[15px] font-bold tabular-nums shadow-[0_0_14px_-2px] shadow-amber-400/50 hover:from-amber-400/35 transition">
            <MoonCoinIcon className="w-5 h-5" />
            {formatNumber(w.balance)}
          </Link>
        )}
        <Link href="/misiones" className="relative inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800/70 text-neutral-200 px-3 py-1.5 text-sm hover:bg-ink-700 transition">
          <TargetIcon className="w-4 h-4" /> Misiones
          {w && w.claimable > 0 && <ClaimDot className="-top-1 -right-1 w-3 h-3" label="Tienes misiones por reclamar" />}
        </Link>
      </div>
    </div>
  )
}

