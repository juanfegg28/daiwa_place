'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { GiftIcon } from '../components/icons'
import ShopItemCard from '../components/cosmetics/ShopItemCard'
import WelcomePackSheet from '../components/cosmetics/WelcomePackSheet'
import { CollectionBadge } from '../components/cosmetics/lazy'
import HeroCarousel from '../components/shop/HeroCarousel'
import SaleBanner from '../components/shop/SaleBanner'
import { Rail } from '../components/shop/ShopItems'
import { useShop } from '../components/shop/ShopProvider'
import { CATEGORY_SLUGS } from '../components/shop/shopRoutes'
import { sortItems } from '../components/shop/shopUtil'
import { welcomePackStatus } from '../lib/cosmetics'

/** Destacado: banner de novedades (rota cada 7 s), banner de descuentos, y carriles. Todo sale del mismo catálogo ya cargado. */
export default function TiendaDestacado() {
  const shop = useShop()
  const [welcome, setWelcome] = useState<{ claimed: boolean; decos: number; fonts: number; titles: number } | null>(null)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  useEffect(() => { welcomePackStatus().then((r) => setWelcome(r.data)) }, [])

  const fresh = useMemo(() => sortItems(shop.shelf.filter((i) => shop.newIds.has(i.id) && !i.owned), 'rareza').slice(0, 16), [shop.shelf, shop.newIds])
  const reach = useMemo(() => shop.balance > 0 ? sortItems(shop.shelf.filter((i) => !i.owned && i.obtainable === 'tienda' && i.price > 0 && i.price <= shop.balance), 'precio-desc').slice(0, 12) : [], [shop.shelf, shop.balance])
  const colls = shop.collections.filter((c) => c.kind === 'coleccion' || c.kind === 'miticas')
  const w = shop.wallet

  return (
    <div className="space-y-8">
      {shop.loading || !shop.ready ? <div className="h-[400px] sm:h-[330px] rounded-3xl bg-ink-800/60 animate-pulse" aria-busy="true" /> : <HeroCarousel />}

      {(welcome && !welcome.claimed) || w?.founder_available ? (
        <section className="grid gap-3 sm:grid-cols-2" aria-label="Gratis para ti">
          {welcome && !welcome.claimed && (
            <button type="button" onClick={() => setWelcomeOpen(true)} className="press text-left rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-transparent p-4 hover:from-emerald-500/25 transition">
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-300 font-semibold flex items-center gap-1.5"><GiftIcon className="w-4 h-4" /> Gratis para ti</p>
              <p className="font-display text-lg font-semibold text-neutral-50 mt-1">Pack Bienvenida</p>
              <p className="text-sm text-neutral-300">Elige {welcome.decos} decoraciones, {welcome.fonts} fuentes y {welcome.titles} títulos comunes. Una sola vez.</p>
            </button>
          )}
          {w?.founder_available && (
            <Link href="/monedas" className="press rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-400/15 to-transparent p-4 hover:from-amber-400/25 transition">
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300 font-semibold flex items-center gap-1.5"><GiftIcon className="w-4 h-4" /> Solo cuentas de la beta</p>
              <p className="font-display text-lg font-semibold text-neutral-50 mt-1">Pack Fundador</p>
              <p className="text-sm text-neutral-300">Marco Fundador, insignia, título, Oro foil y 300 ☾. Reclámalo →</p>
            </Link>
          )}
        </section>
      ) : null}

      <SaleBanner />

      {fresh.length > 0 && (
        <section aria-label="Lo nuevo">
          <div className="flex items-end justify-between mb-2.5">
            <h2 className="font-display text-xl font-semibold text-neutral-50">Lo nuevo</h2>
            {shop.features[0] && <Link href={`/tienda/seleccion/${shop.features[0].slug}`} className="text-sm text-amber-300 hover:text-amber-200">Ver la selección →</Link>}
          </div>
          <Rail label="Cosméticos nuevos">
            {fresh.map((i) => <div key={i.id} className="snap-start shrink-0 w-[168px] sm:w-[190px]"><ShopItemCard item={i} me={shop.me} canAfford={i.price <= shop.balance} isNew equipped={shop.isWorn(i)} onOpen={() => shop.open(i)} onWish={() => shop.toggleWish(i)} /></div>)}
          </Rail>
        </section>
      )}

      {colls.length > 0 && (
        <section aria-label="Colecciones">
          <div className="flex items-end justify-between mb-2.5">
            <h2 className="font-display text-xl font-semibold text-neutral-50">Colecciones</h2>
            <Link href="/tienda/colecciones" className="text-sm text-amber-300 hover:text-amber-200">Packs y premios →</Link>
          </div>
          <Rail label="Colecciones">
            {[...colls].sort((a, b) => Number(shop.newIds.has(shop.catalog.find((i) => i.collection === b.id)?.id ?? '')) - Number(shop.newIds.has(shop.catalog.find((i) => i.collection === a.id)?.id ?? ''))).map((c) => {
              const isNew = shop.catalog.some((i) => i.collection === c.id && shop.newIds.has(i.id))
              return (
                <Link key={c.id} href={`/tienda/coleccion/${c.id}`} className="press snap-start shrink-0 w-[150px] rounded-2xl border border-ink-700 bg-ink-900/60 hover:bg-ink-900 p-3 flex flex-col items-center text-center gap-2 transition">
                  <CollectionBadge collection={c.kind === 'miticas' ? 'miticas' : c.id} size={52} />
                  <p className="text-sm font-semibold text-neutral-100 leading-tight line-clamp-2">{c.name}</p>
                  <p className="text-[11px] text-neutral-500 tabular-nums">{c.owned} / {c.total} decoraciones</p>
                  {isNew && <span className="rounded-md bg-garnet-600 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">Nuevo</span>}
                </Link>
              )
            })}
          </Rail>
        </section>
      )}

      {reach.length > 0 && (
        <section aria-label="Al alcance de tus Lunas">
          <h2 className="font-display text-xl font-semibold text-neutral-50 mb-2.5">Al alcance de tus Lunas</h2>
          <Rail label="Lo que puedes comprar ahora">
            {reach.map((i) => <div key={i.id} className="snap-start shrink-0 w-[168px] sm:w-[190px]"><ShopItemCard item={i} me={shop.me} canAfford isNew={shop.newIds.has(i.id)} equipped={shop.isWorn(i)} onOpen={() => shop.open(i)} onWish={() => shop.toggleWish(i)} /></div>)}
          </Rail>
        </section>
      )}

      <section aria-label="Explorar por categoría">
        <h2 className="font-display text-xl font-semibold text-neutral-50 mb-2.5">Explorar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CATEGORY_SLUGS.map((c) => (
            <Link key={c.slug} href={`/tienda/explorar/${c.slug}`} className="press rounded-2xl border border-ink-700 bg-ink-900/60 hover:bg-ink-800 px-4 py-4 text-sm font-medium text-neutral-100 transition">
              {c.label}<span className="block text-[11px] text-neutral-500 font-normal mt-0.5">{shop.shelf.filter((i) => i.type === c.type).length} cosméticos</span>
            </Link>
          ))}
          <Link href="/tienda/explorar" className="press rounded-2xl border border-garnet-500/40 bg-garnet-600/10 hover:bg-garnet-600/20 px-4 py-4 text-sm font-semibold text-garnet-200 transition">Todo el catálogo →</Link>
        </div>
      </section>

      {welcomeOpen && welcome && (
        <WelcomePackSheet status={welcome} catalog={shop.catalog} me={shop.me} onClose={() => setWelcomeOpen(false)} onDone={() => { setWelcomeOpen(false); setWelcome({ ...welcome, claimed: true }); shop.reload() }} />
      )}
    </div>
  )
}
