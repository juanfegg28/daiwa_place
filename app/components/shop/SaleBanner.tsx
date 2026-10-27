'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ChevronRightIcon } from '../icons'
import BannerArt from './BannerArt'
import { Countdown, SalePill } from './ShopBits'
import { MiniItem } from './ShopItems'
import { useShop } from './ShopProvider'
import { saleSummary } from './shopUtil'
import { themeOf } from './shopThemes'
import { SALE_KIND_LABEL, type ShopSale } from '../../lib/cosmetics'

/** Cabecera ilustrada de una oferta (la usa el banner de la portada y la página de Descuentos) */
export function SaleHeader({ sale, maxPct, count, compact = false }: { sale: ShopSale; maxPct: number; count: number; compact?: boolean }) {
  const t = themeOf(sale.theme)
  return (
    <div className="relative overflow-hidden isolate">
      <BannerArt theme={sale.theme} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
      <div className={`relative z-10 ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ background: t.c, color: '#120408' }}>{SALE_KIND_LABEL[sale.kind]}</span>
          <Countdown to={sale.ends_at} className="text-[11px] text-white/90 rounded-full bg-black/40 px-2 py-1" />
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className={`font-display font-bold text-white drop-shadow ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>{sale.name}</h3>
            {sale.blurb && <p className="text-sm text-white/85 mt-0.5">{sale.blurb}</p>}
            <p className="text-xs text-white/70 mt-1">{count} cosméticos en oferta</p>
          </div>
          {maxPct > 0 && (
            <div className="text-right leading-none">
              <span className="block text-[10px] uppercase tracking-widest text-white/70">hasta</span>
              <span className="inline-block rounded-xl bg-emerald-500 text-ink-950 font-black text-2xl sm:text-3xl px-3 py-1.5 shadow-[0_0_24px_-4px] shadow-emerald-400/70 tabular-nums">−{maxPct}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Banner 2 de la portada: las ofertas activas (un grupo por tarjeta). Sin temporizadores pesados: solo una cuenta atrás que se refresca cada 30 s */
export default function SaleBanner() {
  const shop = useShop()
  const rows = useMemo(() => shop.sales.filter((s) => s.in_banner).map((s) => ({ s, ...saleSummary(s, shop.shelf) })).filter((r) => r.count > 0), [shop.sales, shop.shelf])
  if (rows.length === 0) return null
  const many = rows.length > 1
  return (
    <section aria-label="Ofertas">
      <div className="flex items-end justify-between mb-2.5">
        <h2 className="font-display text-xl font-semibold text-neutral-50">Descuentos</h2>
        <Link href="/tienda/descuentos" className="text-sm text-amber-300 hover:text-amber-200 inline-flex items-center gap-1">Ver todos <ChevronRightIcon className="w-4 h-4" /></Link>
      </div>
      <div className={many ? 'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1' : ''}>
        {rows.map(({ s, items, maxPct, count }) => {
          const top = [...items].sort((a, b) => (b.base_price ?? 0) - a.base_price! || b.price - a.price)
          const preview = top.filter((i) => i.type === 'avatar_decoration' || i.type === 'profile_card').slice(0, 3)
          return (
            <article key={s.id} className={`snap-start overflow-hidden rounded-2xl border border-emerald-500/30 bg-ink-900/70 ${many ? 'min-w-[92%] sm:min-w-[calc(50%-6px)] lg:min-w-[calc(50%-6px)]' : 'w-full'}`}>
              <SaleHeader sale={s} maxPct={maxPct} count={count} compact />
              <div className="p-3 flex items-center gap-3 overflow-x-auto">
                {(preview.length ? preview : top.slice(0, 3)).map((i) => <MiniItem key={i.id} item={i} size="sm" />)}
                <Link href={`/tienda/descuentos#sale-${s.id}`} className="press ml-auto shrink-0 self-stretch flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 text-sm font-semibold px-4 transition">
                  <SalePill pct={maxPct} /> Ver oferta <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
