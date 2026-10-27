'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HeartIcon, MoonCoinIcon, SearchIcon, StoreIcon, TargetIcon } from '../icons'
import { ClaimDot } from '../economy/ClaimDot'
import { formatNumber } from '../../lib/economy'
import { useShop } from './ShopProvider'
import { CATEGORY_SLUGS } from './shopRoutes'

const Chevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
)

/** Barra de la tienda estilo Discord: Destacado · Explorar ▾ · Descuentos · Colecciones · Inventario · Canjear, buscador, deseos y saldo */
export default function ShopFrame({ children }: { children: ReactNode }) {
  const shop = useShop()
  const path = usePathname()
  const router = useRouter()
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const off = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [menu])

  const saleCount = shop.shelf.filter((i) => i.sale_id && !i.owned).length
  const on = (href: string, exact = false) => (exact ? path === href : path === href || path.startsWith(href + '/'))
  const tab = (active: boolean) => `relative shrink-0 px-3 sm:px-4 py-3 text-[15px] font-medium whitespace-nowrap transition ${active ? 'text-white' : 'text-neutral-400 hover:text-neutral-100'}`
  const bar = <span className="absolute left-3 right-3 sm:left-4 sm:right-4 -bottom-px h-[3px] rounded-full bg-garnet-500" />
  const w = shop.wallet

  function submitSearch(v: string) {
    shop.setSearch(v)
    if (v.trim() && !path.startsWith('/tienda/explorar')) router.push('/tienda/explorar')
  }

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto px-3 sm:px-4 pt-4 pb-10">
      {/* Fila de arriba: marca, buscador, deseos, saldo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/tienda" className="shrink-0 inline-flex items-center gap-2 font-display text-xl font-semibold text-neutral-50 pr-1" aria-label="Tienda: inicio">
          <StoreIcon className="w-6 h-6 text-garnet-400" /> <span className="hidden sm:inline">Tienda</span>
        </Link>
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="search" value={shop.search} onChange={(e) => submitSearch(e.target.value)} placeholder="Busca en la tienda" aria-label="Buscar en la tienda"
            className="w-full rounded-xl bg-ink-800/80 border border-ink-700 focus:border-garnet-500 outline-none text-sm text-neutral-100 placeholder:text-neutral-500 pl-9 pr-3 py-2.5" />
        </div>
        <Link href="/tienda/deseos" aria-label={`Lista de deseos${shop.wishCount ? `, ${shop.wishCount}` : ''}`} title="Lista de deseos"
          className={`press relative shrink-0 w-11 h-11 rounded-xl border inline-flex items-center justify-center transition ${on('/tienda/deseos') ? 'bg-garnet-600/30 border-garnet-500 text-garnet-300' : 'bg-ink-800/80 border-ink-700 text-neutral-200 hover:bg-ink-700'}`}>
          <HeartIcon className="w-5 h-5" filled={on('/tienda/deseos') || shop.wishCount > 0} />
          {shop.wishCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-garnet-500 text-white text-[10px] font-bold inline-flex items-center justify-center px-1 tabular-nums">{shop.wishCount}</span>}
        </Link>
        {w && (
          <Link href="/monedas" aria-label={`Mi saldo: ${formatNumber(w.balance)}`} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-amber-400/70 bg-gradient-to-b from-amber-400/25 to-amber-600/15 text-amber-100 px-3 h-11 text-[15px] font-bold tabular-nums shadow-[0_0_14px_-2px] shadow-amber-400/50 hover:from-amber-400/35 transition">
            <MoonCoinIcon className="w-5 h-5" /> {formatNumber(w.balance)}
          </Link>
        )}
        <Link href="/misiones" aria-label="Misiones" title="Misiones" className="relative hidden sm:inline-flex shrink-0 w-11 h-11 rounded-xl border border-ink-700 bg-ink-800/80 text-neutral-200 items-center justify-center hover:bg-ink-700 transition">
          <TargetIcon className="w-5 h-5" />
          {w && w.claimable > 0 && <ClaimDot className="-top-1 -right-1 w-3 h-3" label="Tienes misiones por reclamar" />}
        </Link>
      </div>

      {/* Pestañas */}
      <nav aria-label="Secciones de la tienda" className="mt-2 border-b border-ink-700 flex items-center overflow-x-auto sm:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0">
        <Link href="/tienda" className={tab(on('/tienda', true) || on('/tienda/seleccion') || on('/tienda/coleccion'))} aria-current={on('/tienda', true) ? 'page' : undefined}>Destacado{(on('/tienda', true) || on('/tienda/seleccion')) && bar}</Link>
        <div ref={menuRef} className="relative shrink-0">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} className={`${tab(on('/tienda/explorar'))} inline-flex items-center gap-1`}>
            Explorar <Chevron open={menu} />{on('/tienda/explorar') && bar}
          </button>
          {menu && (
            <div role="menu" className="absolute z-40 left-0 top-full mt-1 w-56 rounded-2xl border border-ink-600 bg-ink-900 shadow-2xl shadow-black/60 p-1.5">
              <Link role="menuitem" href="/tienda/explorar" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-neutral-100 hover:bg-ink-700 font-medium">Todo el catálogo</Link>
              {CATEGORY_SLUGS.map((c) => (
                <Link role="menuitem" key={c.slug} href={`/tienda/explorar/${c.slug}`} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-ink-700 hover:text-white">{c.label}</Link>
              ))}
            </div>
          )}
        </div>
        <Link href="/tienda/descuentos" className={`${tab(on('/tienda/descuentos'))} inline-flex items-center gap-1.5`}>
          Descuentos {saleCount > 0 && <span className="rounded-full bg-emerald-500 text-ink-950 text-[10px] font-extrabold px-1.5 py-0.5 tabular-nums">{saleCount}</span>}{on('/tienda/descuentos') && bar}
        </Link>
        <Link href="/tienda/colecciones" className={tab(on('/tienda/colecciones'))}>Colecciones{on('/tienda/colecciones') && bar}</Link>
        <Link href="/tienda/inventario" className={tab(on('/tienda/inventario'))}>Mi inventario{on('/tienda/inventario') && bar}</Link>
        <Link href="/tienda/canjear" className={tab(on('/tienda/canjear'))}>Canjear código{on('/tienda/canjear') && bar}</Link>
      </nav>

      {shop.error && <p className="text-sm text-red-300 mt-3" role="alert">{shop.error}</p>}
      <div className="mt-5">{children}</div>
      <p className="text-xs text-neutral-500 text-center mt-10">Las Lunas no se pueden comprar ni regalar. Se ganan con <Link href="/misiones" className="text-amber-300 hover:text-amber-200">misiones</Link>.</p>
    </div>
  )
}
