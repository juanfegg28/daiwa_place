'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { GiftIcon, MoonCoinIcon } from '../components/icons'
import { ShopHeader, ShopTabs } from '../components/economy/ShopChrome'
import MoonRain from '../components/economy/MoonRain'
import ShopItemCard from '../components/cosmetics/ShopItemCard'
import ItemSheet from '../components/cosmetics/ItemSheet'
import { CollectionBadge } from '../components/cosmetics/lazy'
import WelcomePackSheet from '../components/cosmetics/WelcomePackSheet'
import { useShopData } from '../components/cosmetics/useShopData'
import { supabase } from '../lib/supabaseClient'
import { refreshWallet, subscribeWallet, formatNumber, type WalletSummary } from '../lib/economy'
import {
  CATEGORIES, RARITY_LABEL, shopBuyPack, welcomePackStatus,
  type CatalogItem, type CosmeticType, type Rarity, type ShopCollection,
} from '../lib/cosmetics'

export default function TiendaPage() {
  return (
    <AppShell>
      <TiendaContent />
    </AppShell>
  )
}

const RARITIES: Rarity[] = ['comun', 'raro', 'epico', 'legendario', 'mitico']

function TiendaContent() {
  const router = useRouter()
  const { loading: sessionLoading } = useAppSession()
  const { userId, me, catalog, collections, worn, loading, error, reload } = useShopData({ collections: true })
  const [w, setW] = useState<WalletSummary | null>(null)
  const [cat, setCat] = useState<CosmeticType | 'todo' | 'colecciones'>('todo')
  const [rarity, setRarity] = useState<Rarity | ''>('')
  const [coll, setColl] = useState('')
  const [onlyAfford, setOnlyAfford] = useState(false)
  const [hideOwned, setHideOwned] = useState(false)
  const [open, setOpen] = useState<CatalogItem | null>(null)
  const [rain, setRain] = useState(false)
  const [welcome, setWelcome] = useState<{ claimed: boolean; decos: number; fonts: number; titles: number } | null>(null)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeWallet(setW)
    refreshWallet()
    supabase.rpc('track_shop_visit').then(() => {})
    welcomePackStatus().then((r) => setWelcome(r.data))
    return unsub
  }, [userId])
  useEffect(() => {
    if (!sessionLoading && !userId) router.replace('/login')
  }, [sessionLoading, userId, router])

  const balance = w?.balance ?? 0
  const shelf = useMemo(() => catalog.filter((i) => {
    if (i.type === 'badge') return false
    if (i.obtainable === 'gratis') return false
    if (i.type === 'title' && i.obtainable !== 'tienda') return false // los títulos exclusivos van en las colecciones
    if (i.obtainable === 'fundador' && i.type !== 'avatar_decoration') return false
    return true
  }), [catalog])
  const collName = useMemo(() => new Map(collections.map((c) => [c.id, c.name])), [collections])
  const shown = useMemo(() => shelf.filter((i) => {
    if (cat !== 'todo' && cat !== 'colecciones' && i.type !== cat) return false
    if (rarity && i.rarity !== rarity) return false
    if (coll && i.collection !== coll) return false
    if (onlyAfford && !(i.price > 0 && i.price <= balance && !i.owned)) return false
    if (hideOwned && i.owned) return false
    return true
  }), [shelf, cat, rarity, coll, onlyAfford, hideOwned, balance])
  const wornSlug = (i: CatalogItem) =>
    (i.type === 'avatar_decoration' && worn.avatar_deco?.id === i.slug) || (i.type === 'profile_card' && worn.card_style?.id === i.slug) ||
    (i.type === 'entry_effect' && worn.entry_effect?.id === i.slug) || (i.type === 'background' && worn.profile_bg?.id === i.slug) ||
    (i.type === 'title' && worn.title_style?.id === i.slug) || (i.type === 'name_effect' && worn.name_style?.effect?.id === i.slug) ||
    (i.type === 'font' && worn.name_style?.font === i.slug)

  if (!userId) return null
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <MoonRain show={rain} onDone={() => setRain(false)} />
      <ShopHeader w={w} />
      <ShopTabs active="catalogo" />

      {/* Gratis para ti */}
      {(welcome && !welcome.claimed) || w?.founder_available ? (
        <section className="grid gap-3 sm:grid-cols-2 mb-5" aria-label="Gratis para ti">
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

      {/* Categorías */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" role="tablist" aria-label="Categorías">
        {CATEGORIES.map((c) => (
          <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition ${cat === c.id ? 'bg-garnet-600 border-garnet-500 text-white' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-300 mb-3" role="alert">{error}</p>}

      {cat === 'colecciones' ? (
        <CollectionsView collections={collections} catalog={catalog} balance={balance} onChanged={() => { reload(); refreshWallet(true) }} onRain={() => setRain(true)} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
            <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity | '')} aria-label="Rareza" className="rounded-full bg-ink-800 border border-ink-700 text-neutral-200 px-3 py-1.5">
              <option value="">Toda rareza</option>
              {RARITIES.map((r) => <option key={r} value={r}>{RARITY_LABEL[r]}</option>)}
            </select>
            <select value={coll} onChange={(e) => setColl(e.target.value)} aria-label="Colección" className="rounded-full bg-ink-800 border border-ink-700 text-neutral-200 px-3 py-1.5 max-w-[11rem]">
              <option value="">Toda colección</option>
              {collections.filter((c) => c.kind !== 'base').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="inline-flex items-center gap-1.5 text-neutral-300"><input type="checkbox" checked={onlyAfford} onChange={(e) => setOnlyAfford(e.target.checked)} className="accent-amber-400" /> Lo que puedo pagar</label>
            <label className="inline-flex items-center gap-1.5 text-neutral-300"><input type="checkbox" checked={hideOwned} onChange={(e) => setHideOwned(e.target.checked)} className="accent-amber-400" /> Ocultar lo que ya tengo</label>
            <span className="ml-auto text-xs text-neutral-500">{shown.length} cosméticos</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-ink-800/60 animate-pulse" />)}
            </div>
          ) : shown.length === 0 ? (
            <p className="text-center text-neutral-500 py-12">No hay nada con esos filtros.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {shown.map((i) => (
                <ShopItemCard key={i.id} item={i} me={me} canAfford={i.price <= balance} equipped={wornSlug(i)} onOpen={() => setOpen(i)} />
              ))}
            </div>
          )}
          {cat !== 'todo' && coll === '' && <p className="sr-only">{collName.size} colecciones</p>}
        </>
      )}

      <p className="text-xs text-neutral-500 text-center mt-8">Las Lunas no se pueden comprar ni regalar. Se ganan con <Link href="/misiones" className="text-amber-300 hover:text-amber-200">misiones</Link>.</p>

      {open && <ItemSheet item={open} me={me} balance={balance} onClose={() => setOpen(null)} onChanged={() => { reload(); refreshWallet(true) }} onRain={() => setRain(true)} />}
      {welcomeOpen && welcome && (
        <WelcomePackSheet status={welcome} catalog={catalog} me={me} onClose={() => setWelcomeOpen(false)} onDone={() => { setWelcomeOpen(false); setWelcome({ ...welcome, claimed: true }); reload() }} />
      )}
    </div>
  )
}

/** Colecciones: progreso, pack con descuento y premio por completarlas */
function CollectionsView({ collections, catalog, balance, onChanged, onRain }: {
  collections: ShopCollection[]; catalog: CatalogItem[]; balance: number; onChanged: () => void; onRain: () => void
}) {
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)
  const list = collections.filter((c) => c.kind === 'coleccion' || c.kind === 'miticas')
  async function buyPack(c: ShopCollection) {
    setBusy(c.id); setMsg(null)
    const { data, error } = await shopBuyPack(c.id, c.pack_price)
    setBusy('')
    if (error || !data) return setMsg({ id: c.id, text: error || 'No se pudo comprar el pack', ok: false })
    setMsg({ id: c.id, text: `¡Pack comprado! (${data.items} piezas nuevas)`, ok: true })
    onRain(); onChanged()
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((c) => {
        const pct = c.total ? Math.round((c.owned / c.total) * 100) : 0
        const inPack = catalog.filter((i) => !i.owned && i.obtainable === 'tienda' && ((i.collection === c.id && i.type === 'avatar_decoration') || (i.type === 'profile_card' && i.slug === c.pack_card) || (i.type === 'entry_effect' && i.slug === c.pack_effect)))
        const save = c.pack_full_price - c.pack_price
        return (
          <article key={c.id} className="rounded-2xl border border-ink-700 bg-ink-900/60 p-4">
            <div className="flex items-start gap-3">
              <CollectionBadge collection={c.kind === 'miticas' ? 'miticas' : c.id} size={44} />
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-semibold text-neutral-50 leading-tight">{c.name}</h3>
                {c.theme && <p className="text-xs text-neutral-500 truncate">{c.theme}</p>}
              </div>
              {c.all_owned && <span className="rounded-full bg-emerald-500/90 text-ink-950 text-[10px] font-bold px-2 py-0.5">¡Completa!</span>}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-neutral-400 mb-1"><span>Decoraciones</span><span className="tabular-nums">{c.owned} / {c.total}</span></div>
              <div className="h-2 rounded-full bg-ink-700 overflow-hidden"><div className="h-full bg-gradient-to-r from-garnet-500 to-amber-300" style={{ width: `${pct}%` }} /></div>
            </div>
            <p className="text-xs text-neutral-400 mt-2">Al completarla: insignia + título exclusivo{c.completion_title ? <> «<b className="text-neutral-200">{c.completion_title}</b>»</> : null} + 400 ☾</p>
            {c.has_pack && inPack.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
                <p className="text-sm text-neutral-200 font-medium">Pack de la colección <span className="text-amber-300">−20 %</span></p>
                <p className="text-xs text-neutral-500">{inPack.length} piezas que aún no tienes: {inPack.slice(0, 3).map((i) => i.name).join(', ')}{inPack.length > 3 ? '…' : ''}</p>
                <button type="button" disabled={busy === c.id || c.pack_price > balance} onClick={() => buyPack(c)}
                  className="press mt-2 w-full rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-ink-700 disabled:text-neutral-500 text-ink-950 font-bold py-2 text-sm inline-flex items-center justify-center gap-1.5">
                  <MoonCoinIcon className="w-4 h-4" />
                  {c.pack_price > balance ? `Te faltan ${formatNumber(c.pack_price - balance)} ☾` : `Comprar pack · ${formatNumber(c.pack_price)} ☾`}
                  {save > 0 && c.pack_price <= balance && <s className="font-normal text-ink-800/70 ml-1">{formatNumber(c.pack_full_price)}</s>}
                </button>
              </div>
            )}
            {c.has_pack && inPack.length === 0 && <p className="text-xs text-emerald-400 mt-3">Ya tienes todo lo del pack.</p>}
            {msg?.id === c.id && <p className={`text-sm mt-2 ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`} role="status">{msg.text}</p>}
          </article>
        )
      })}
    </div>
  )
}
