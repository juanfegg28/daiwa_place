'use client'
/** /dev/tienda — prueba visual de la tienda v1.5.0 sin base de datos: catálogo de muestra con ofertas y selecciones. Apagada en producción salvo NEXT_PUBLIC_DEV_COSMETICOS=1. */
import { useMemo, useState } from 'react'
import { notFound } from 'next/navigation'
import HeroCarousel from '../../components/shop/HeroCarousel'
import SaleBanner from '../../components/shop/SaleBanner'
import CollectionsView from '../../components/shop/CollectionsView'
import { ItemGrid } from '../../components/shop/ShopItems'
import { ShopContext, type ShopCtx } from '../../components/shop/ShopProvider'
import { featureItems } from '../../components/shop/shopUtil'
import { RELEASED } from '../../components/cosmetics/kit'
import type { CatalogItem, CosmeticType, Rarity, ShopCollection, ShopFeature, ShopSale } from '../../lib/cosmetics'

const PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a1530"/><stop offset="1" stop-color="#20060e"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="38" r="18" fill="#e8c9b4"/><path d="M14 100 C14 66 86 66 86 100Z" fill="#e8c9b4"/></svg>`)
type K = { slug: string; name: string; rarity: Rarity; price: number; coll?: string }
const mk = (type: CosmeticType, list: K[]): CatalogItem[] => list.map((x, n) => ({ id: `${type}:${x.slug}`, type, slug: x.slug, name: x.name, rarity: x.rarity, price: x.price, base_price: x.price, collection: x.coll ?? 'base', min_size: null, custom_hue: false, palettes: [], meta: {}, obtainable: 'tienda', release_version: '1.5.0', owned: n % 7 === 0, wished: n % 9 === 0 }))

function Demo() {
  const [t0] = useState(() => Date.now())
  const [wish, setWish] = useState<Record<string, boolean>>({})
  const base = useMemo(() => [...mk('avatar_decoration', RELEASED.decos), ...mk('profile_card', RELEASED.cards), ...mk('entry_effect', RELEASED.entries), ...mk('background', RELEASED.backgrounds)], [])
  const colls: ShopCollection[] = useMemo(() => {
    const ids = Array.from(new Set(base.map((i) => i.collection))).filter((c) => c !== 'base')
    return ids.map((id) => { const decos = base.filter((i) => i.collection === id && i.type === 'avatar_decoration'); return { id, name: id.charAt(0).toUpperCase() + id.slice(1), kind: 'coleccion', theme: 'Colección de muestra', completion_title: 'Título exclusivo', has_pack: true, pack_card: null, pack_effect: null, total: decos.length, owned: decos.filter((d) => d.owned).length, all_owned: false, pack_price: 1200, pack_full_price: 1500 } as unknown as ShopCollection })
  }, [base])
  const hallo = ['calabaza', 'cuervo', 'cripta', 'crimson', 'emo', 'vampiro', 'creepy', 'cruces', 'barroco']
  const sales: ShopSale[] = useMemo(() => [
    { id: 's1', name: 'Rebajas de Halloween', blurb: 'Solo esta semana', kind: 'semana', theme: 'halloween', starts_at: new Date(t0).toISOString(), ends_at: new Date(t0 + 3 * 86400000 + 5 * 3600000).toISOString(), in_banner: true, sort: 0 },
    { id: 's2', name: 'Oferta del día', blurb: 'Hasta medianoche', kind: 'dia', theme: 'ember', starts_at: new Date(t0).toISOString(), ends_at: new Date(t0 + 7 * 3600000).toISOString(), in_banner: true, sort: 1 },
  ], [t0])
  const catalog = useMemo(() => base.map((i, n) => { const w = wish[i.id]; const x = { ...i, wished: w ?? i.wished }; if (n % 11 === 0 && !i.owned) return { ...x, sale_id: 's1', sale_name: 'Rebajas de Halloween', sale_ends_at: sales[0].ends_at, price: Math.round(i.price * 0.6) }; if (n % 13 === 0 && !i.owned) return { ...x, sale_id: 's2', sale_name: 'Oferta del día', sale_ends_at: sales[1].ends_at, price: Math.round(i.price * 0.75) }; return x }), [base, wish, sales])
  const features: ShopFeature[] = useMemo(() => [
    { id: 'f1', slug: 'halloween', title: 'Selección de Halloween', subtitle: 'Sangre Noir, Emo Abismo y 7 colecciones nuevas: criptas, cuervos, calabazas, vampiros y más.', cta: 'Ver la selección', theme: 'halloween', collections: hallo, item_ids: [], starts_at: new Date(t0).toISOString(), ends_at: null, sort: 0 },
    { id: 'f2', slug: 'rosa', title: 'Colección Sakura', subtitle: 'Pétalos y noches de primavera.', cta: 'Ver la selección', theme: 'rose', collections: ['sakura'], item_ids: [], starts_at: new Date(t0).toISOString(), ends_at: null, sort: 1 },
  ], []) // eslint-disable-line react-hooks/exhaustive-deps
  const newIds = useMemo(() => { const s = new Set<string>(); for (const f of features) for (const i of featureItems(f, catalog)) s.add(i.id); return s }, [features, catalog])
  const [opened, setOpened] = useState('')
  const ctx: ShopCtx = {
    userId: 'demo', me: { username: 'ren', name: 'Ren Shiraishi', avatarUrl: PHOTO }, worn: { avatar_deco: null, name_style: null, title_style: null, card_style: null, entry_effect: null, profile_bg: null },
    catalog, shelf: catalog, collections: colls, collName: new Map(colls.map((c) => [c.id, c.name])), sales, features, newIds, wallet: null, balance: 2095, loading: false, ready: true, error: '',
    reload: () => {}, open: (i) => setOpened(i.name), toggleWish: (i) => setWish((w) => ({ ...w, [i.id]: !i.wished })), wishCount: catalog.filter((i) => i.wished).length, rain: () => {}, isWorn: () => false, search: '', setSearch: () => {},
  }
  return (
    <ShopContext.Provider value={ctx}>
      <div className="w-full min-w-0 max-w-5xl mx-auto px-3 py-6 space-y-8" data-testid="demo">
        <HeroCarousel />
        <SaleBanner />
        <section><h2 className="font-display text-xl text-neutral-50 mb-2">Rejilla (ofertas y deseos)</h2><ItemGrid items={catalog.filter((i) => i.type === 'avatar_decoration').slice(0, 12)} /></section>
        <section data-testid="colls"><h2 className="font-display text-xl text-neutral-50 mb-2">Colecciones</h2><CollectionsView collections={colls.slice(0, 4)} catalog={catalog} balance={2095} onChanged={() => {}} onRain={() => {}} me={ctx.me} onOpen={ctx.open} newIds={newIds} /></section>
        {opened && <p className="text-sm text-amber-200">Abrirías: {opened}</p>}
      </div>
    </ShopContext.Provider>
  )
}
export default function DevTiendaPage() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEV_COSMETICOS !== '1') notFound()
  return <Demo />
}
