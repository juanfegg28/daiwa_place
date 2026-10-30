'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSession } from '../AppShell'
import MoonRain from '../economy/MoonRain'
import ItemSheet from '../cosmetics/ItemSheet'
import { useShopData, type Worn } from '../cosmetics/useShopData'
import type { PreviewSubject } from '../cosmetics/ItemPreview'
import { supabase } from '../../lib/supabaseClient'
import { refreshWallet, subscribeWallet, type WalletSummary } from '../../lib/economy'
import { shopFeaturesActive, shopSalesActive, shopWishToggle, type CatalogItem, type ShopCollection, type ShopFeature, type ShopSale } from '../../lib/cosmetics'
import { featureItems } from './shopUtil'
import { allShopKeys, markShopEntered, readSeenTabs, shopKeysFrom, type ShopNoveltyKeys } from '../../lib/novelty'

export type ShopCtx = {
  userId: string | null
  me: PreviewSubject
  worn: Worn
  /** Todo lo que hay a la venta o por ganar (ya con deseos aplicados) */
  catalog: CatalogItem[]
  /** Lo que se muestra en las vitrinas (sin insignias ni títulos exclusivos, etc.) */
  shelf: CatalogItem[]
  collections: ShopCollection[]
  collName: Map<string, string>
  sales: ShopSale[]
  features: ShopFeature[]
  newIds: Set<string>
  /** v1.5.10 · «llaves» de lo que hay de nuevo (selecciones, ofertas y colecciones) */
  noveltyKeys: ShopNoveltyKeys
  /** v1.5.10 · lo que estaba sin ver al abrir la tienda (se queda fijo durante la visita para que las tarjetas muestren su «NOVEDAD») */
  freshKeys: Set<string>
  wallet: WalletSummary | null
  balance: number
  loading: boolean
  /** ofertas y selecciones ya cargadas */
  ready: boolean
  error: string
  reload: () => void
  open: (i: CatalogItem) => void
  toggleWish: (i: CatalogItem) => void
  wishCount: number
  rain: () => void
  isWorn: (i: CatalogItem) => boolean
  search: string
  setSearch: (s: string) => void
}

export const ShopContext = createContext<ShopCtx | null>(null)
const Ctx = ShopContext
export function useShop(): ShopCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useShop debe usarse dentro de <ShopProvider>')
  return c
}

/** Datos de TODA la tienda en un solo lugar: se cargan una vez y se comparten entre Destacado, Explorar, Descuentos, etc. */
export function ShopProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { loading: sessionLoading } = useAppSession()
  const { userId, me, catalog: rawCatalog, collections, worn, loading, error, reload: reloadData } = useShopData({ collections: true })
  const [wallet, setWallet] = useState<WalletSummary | null>(null)
  const [sales, setSales] = useState<ShopSale[]>([])
  const [features, setFeatures] = useState<ShopFeature[]>([])
  const [wishOverride, setWishOverride] = useState<Record<string, boolean>>({})
  const [openItem, setOpenItem] = useState<CatalogItem | null>(null)
  const [raining, setRaining] = useState(false)
  const [search, setSearch] = useState('')
  const [ready, setReady] = useState(false)

  const loadExtras = useCallback(async () => {
    const [s, f] = await Promise.all([shopSalesActive(), shopFeaturesActive()])
    setSales(s.data ?? [])
    setFeatures(f.data ?? [])
    setReady(true)
  }, [])

  const reload = useCallback(() => {
    setWishOverride({})
    reloadData()
    loadExtras()
    refreshWallet(true)
  }, [reloadData, loadExtras])

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeWallet(setWallet)
    refreshWallet()
    supabase.rpc('track_shop_visit').then(() => {})
    const t = setTimeout(loadExtras, 0)
    return () => { unsub(); clearTimeout(t) }
  }, [userId, loadExtras])

  useEffect(() => {
    if (!sessionLoading && !userId) router.replace('/login')
  }, [sessionLoading, userId, router])

  // Cuando termina una oferta (o empieza una selección) se recarga sola: el precio vuelve a la normalidad sin tener que refrescar la página
  const reloadRef = useRef(reload)
  useEffect(() => { reloadRef.current = reload }, [reload])
  useEffect(() => {
    const ends = [...sales.map((s) => s.ends_at), ...features.filter((f) => f.ends_at).map((f) => f.ends_at as string)]
      .map((x) => new Date(x).getTime()).filter((t) => t > Date.now())
    if (!ends.length) return
    const wait = Math.min(Math.min(...ends) - Date.now() + 1500, 2_000_000_000)
    const t = setTimeout(() => reloadRef.current(), wait)
    return () => clearTimeout(t)
  }, [sales, features])

  const catalog = useMemo(() => rawCatalog.map((i) => (i.id in wishOverride ? { ...i, wished: wishOverride[i.id] } : i)), [rawCatalog, wishOverride])
  const shelf = useMemo(() => catalog.filter((i) => {
    if (i.type === 'badge') return false
    if (i.obtainable === 'gratis') return false
    if (i.type === 'title' && i.obtainable !== 'tienda') return false // los títulos exclusivos van en las colecciones
    if (i.obtainable === 'fundador' && i.type !== 'avatar_decoration') return false
    return true
  }), [catalog])
  const collName = useMemo(() => new Map(collections.map((c) => [c.id, c.name])), [collections])
  const newIds = useMemo(() => {
    const s = new Set<string>()
    for (const f of features) for (const i of featureItems(f, shelf)) s.add(i.id)
    return s
  }, [features, shelf])
  const noveltyKeys = useMemo(() => shopKeysFrom(features, sales, collections), [features, sales, collections])
  const [freshKeys, setFreshKeys] = useState<Set<string>>(() => new Set())
  const snapped = useRef(false)
  useEffect(() => {
    if (!userId || !ready || collections.length === 0 || snapped.current) return
    const t = window.setTimeout(() => {
      snapped.current = true
      const seen = readSeenTabs(userId)
      const fresh = allShopKeys(noveltyKeys).filter((x) => !seen.has(x))
      if (fresh.length) setFreshKeys(new Set(fresh))
    }, 0)
    return () => window.clearTimeout(t)
  }, [userId, ready, collections.length, noveltyKeys])
  // v1.5.10 · entrar a la tienda apaga el brillito «Novedad» de la barra lateral
  useEffect(() => {
    if (userId && ready && collections.length > 0) markShopEntered(userId, noveltyKeys)
  }, [userId, ready, collections.length, noveltyKeys])
  const wishCount = useMemo(() => catalog.filter((i) => i.wished && !i.owned).length, [catalog])

  const toggleWish = useCallback(async (i: CatalogItem) => {
    const next = !i.wished
    setWishOverride((o) => ({ ...o, [i.id]: next }))
    const { data, error: err } = await shopWishToggle(i.id)
    if (err || data === null) setWishOverride((o) => ({ ...o, [i.id]: !next }))
    else if (data !== next) setWishOverride((o) => ({ ...o, [i.id]: data }))
  }, [])

  const isWorn = useCallback((i: CatalogItem) =>
    (i.type === 'avatar_decoration' && worn.avatar_deco?.id === i.slug) || (i.type === 'profile_card' && worn.card_style?.id === i.slug) ||
    (i.type === 'entry_effect' && worn.entry_effect?.id === i.slug) || (i.type === 'background' && worn.profile_bg?.id === i.slug) ||
    (i.type === 'title' && worn.title_style?.id === i.slug) || (i.type === 'name_effect' && worn.name_style?.effect?.id === i.slug) ||
    (i.type === 'font' && worn.name_style?.font === i.slug), [worn])

  const balance = wallet?.balance ?? 0
  const value: ShopCtx = {
    userId, me, worn, catalog, shelf, collections, collName, sales, features, newIds, noveltyKeys, freshKeys, wallet, balance, loading, ready, error, reload,
    open: setOpenItem, toggleWish, wishCount, rain: () => setRaining(true), isWorn, search, setSearch,
  }
  // La hoja abierta lee la versión más nueva del ítem (por si cambió la oferta o el deseo mientras estaba abierta)
  const sheetItem = openItem ? catalog.find((i) => i.id === openItem.id) ?? openItem : null

  if (!userId) return null
  return (
    <Ctx.Provider value={value}>
      <MoonRain show={raining} onDone={() => setRaining(false)} />
      {children}
      {sheetItem && (
        <ItemSheet item={sheetItem} me={me} balance={balance} onClose={() => setOpenItem(null)} onChanged={reload} onRain={() => setRaining(true)}
          wished={!!sheetItem.wished} onWish={() => toggleWish(sheetItem)} />
      )}
    </Ctx.Provider>
  )
}
