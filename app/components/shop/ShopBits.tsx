'use client'

import { useEffect, useState } from 'react'
import { ClockIcon, MoonCoinIcon } from '../icons'
import { formatNumber } from '../../lib/economy'
import { onSale, salePct, type CatalogItem } from '../../lib/cosmetics'
import { timeLeft } from './shopUtil'

/** Cuenta atrás ligera: se refresca cada 30 s (no cada segundo) y solo mientras está en pantalla */
export function Countdown({ to, className = '', label = 'Termina en' }: { to: string; className?: string; label?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) setNow(Date.now()) }, 30000)
    return () => clearInterval(t)
  }, [])
  const left = timeLeft(to, now)
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${className}`} title={new Date(to).toLocaleString('es')}>
      <ClockIcon className="w-3.5 h-3.5" />
      {left === 'terminó' ? 'Terminó' : <>{label} <b className="font-semibold">{left}</b></>}
    </span>
  )
}

export function SalePill({ pct, className = '' }: { pct: number; className?: string }) {
  if (pct <= 0) return null
  return <span className={`inline-flex items-center rounded-md bg-emerald-500 text-ink-950 text-[11px] font-extrabold px-1.5 py-0.5 tabular-nums ${className}`}>−{pct}%</span>
}

/** Precio con oferta: lo normal tachado + el precio vigente en grande */
export function PriceLine({ item, canAfford = true, big = false }: { item: Pick<CatalogItem, 'price' | 'base_price' | 'sale_id'>; canAfford?: boolean; big?: boolean }) {
  const sale = onSale(item)
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${big ? 'text-lg' : 'text-sm'}`}>
      <span className={`inline-flex items-center gap-1 font-bold ${sale ? 'text-emerald-300' : canAfford ? 'text-amber-200' : 'text-neutral-500'}`}>
        <MoonCoinIcon className={big ? 'w-5 h-5' : 'w-4 h-4'} />
        {formatNumber(item.price)}
      </span>
      {sale && <s className="text-[11px] font-normal text-neutral-500">{formatNumber(item.base_price ?? 0)}</s>}
      {sale && big && <SalePill pct={salePct(item as CatalogItem)} />}
    </span>
  )
}
