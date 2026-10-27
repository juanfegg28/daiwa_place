'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MoonCoinIcon } from '../icons'
import ItemPreview, { type PreviewSubject } from '../cosmetics/ItemPreview'
import { RARITY_STYLE } from '../../lib/cosmetics'
import { CollectionBadge } from '../cosmetics/lazy'
import { SalePill } from './ShopBits'
import { formatNumber } from '../../lib/economy'
import { shopBuyPack, type CatalogItem, type ShopCollection } from '../../lib/cosmetics'

/** Colecciones: progreso, pack con descuento y premio por completarlas */
export default function CollectionsView({ collections, catalog, balance, onChanged, onRain, newIds, me, onOpen }: {
  collections: ShopCollection[]; catalog: CatalogItem[]; balance: number; onChanged: () => void; onRain: () => void; newIds?: Set<string>
  /** para dibujar las decoraciones sobre tu foto y abrirlas al tocarlas */
  me: PreviewSubject; onOpen: (i: CatalogItem) => void
}) {
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)
  const list = collections.filter((c) => c.kind === 'coleccion' || c.kind === 'miticas')
  async function buyPack(c: ShopCollection) {
    setBusy(c.id); setMsg(null)
    const { data, error } = await shopBuyPack(c.id, c.pack_price)
    setBusy('')
    if (error || !data) { if (error && /precio cambi/i.test(error)) onChanged(); return setMsg({ id: c.id, text: error || 'No se pudo comprar el pack', ok: false }) }
    setMsg({ id: c.id, text: `¡Pack comprado! (${data.items} piezas nuevas)`, ok: true })
    onRain(); onChanged()
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((c) => {
        const pct = c.total ? Math.round((c.owned / c.total) * 100) : 0
        const inPack = catalog.filter((i) => !i.owned && i.obtainable === 'tienda' && ((i.collection === c.id && i.type === 'avatar_decoration') || (i.type === 'profile_card' && i.slug === c.pack_card) || (i.type === 'entry_effect' && i.slug === c.pack_effect)))
        const save = c.pack_full_price - c.pack_price
        const packPct = c.pack_full_price > 0 ? Math.round((save * 100) / c.pack_full_price) : 0
        const isNew = !!newIds && catalog.some((i) => i.collection === c.id && newIds.has(i.id))
        return (
          <article key={c.id} className="min-w-0 rounded-2xl border border-ink-700 bg-ink-900/60 p-4">
            <div className="flex items-start gap-3">
              <CollectionBadge collection={c.kind === 'miticas' ? 'miticas' : c.id} size={44} />
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-semibold text-neutral-50 leading-tight flex items-center gap-2">
                  <Link href={`/tienda/coleccion/${c.id}`} className="hover:text-garnet-300">{c.name}</Link>
                  {isNew && <span className="rounded-md bg-garnet-600 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">Nuevo</span>}
                </h3>
                {c.theme && <p className="text-xs text-neutral-500 truncate">{c.theme}</p>}
              </div>
              {c.all_owned && <span className="rounded-full bg-emerald-500/90 text-ink-950 text-[10px] font-bold px-2 py-0.5">¡Completa!</span>}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-neutral-400 mb-1"><span>Decoraciones</span><span className="tabular-nums">{c.owned} / {c.total}</span></div>
              <div className="h-2 rounded-full bg-ink-700 overflow-hidden"><div className="h-full bg-gradient-to-r from-garnet-500 to-amber-300" style={{ width: `${pct}%` }} /></div>
            </div>
            <Decos items={catalog.filter((i) => i.collection === c.id && i.type === 'avatar_decoration')} me={me} onOpen={onOpen} />
            <p className="text-xs text-neutral-400 mt-2">Al completarla: insignia + título exclusivo{c.completion_title ? <> «<b className="text-neutral-200">{c.completion_title}</b>»</> : null} + 400 ☾</p>
            {c.has_pack && inPack.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
                <p className="text-sm text-neutral-200 font-medium flex items-center gap-2">Pack de la colección {packPct > 0 && <SalePill pct={packPct} />}</p>
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

/** Las decoraciones de avatar que pertenecen a la colección, sobre tu foto. Quietas (no gastan animaciones); tocas una para verla en grande. */
function Decos({ items, me, onOpen }: { items: CatalogItem[]; me: PreviewSubject; onOpen: (i: CatalogItem) => void }) {
  if (items.length === 0) return null
  return (
    <div className="mt-3">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1.5">Decoraciones de esta colección · {items.length}</p>
      <ul className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x" aria-label="Decoraciones de la colección">
        {items.map((i) => (
          <li key={i.id} className="snap-start shrink-0">
            <button type="button" onClick={() => onOpen(i)} aria-label={`${i.name}${i.owned ? ', ya lo tienes' : ''}`} className={`press relative w-[88px] rounded-xl border bg-ink-950/70 overflow-hidden text-left hover:bg-ink-900 transition ${RARITY_STYLE[i.rarity].split(' ')[0]}`}>
              <div className="h-[84px] overflow-hidden"><ItemPreview type={i.type} slug={i.slug} me={me} compact lazy playing={false} /></div>
              <p className="px-1.5 py-1 text-[10px] text-neutral-200 truncate border-t border-ink-800">{i.name}</p>
              {i.owned && <span className="absolute top-1 right-1 rounded-full bg-emerald-500 text-ink-950 text-[9px] font-bold px-1.5 leading-4">✓</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
