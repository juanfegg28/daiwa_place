'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ItemPreview, { type PreviewSubject } from './ItemPreview'
import { HeartIcon, MoonCoinIcon } from '../icons'
import { Countdown, SalePill } from '../shop/ShopBits'
import { palettesOf } from './kit'
import {
  RARITY_LABEL, RARITY_STYLE, TYPE_LABEL, howToGet, lookPatch, onSale, salePct, saveLook, shopBuy,
  type CatalogItem, type Equip,
} from '../../lib/cosmetics'
import { formatNumber, refreshWallet } from '../../lib/economy'

/** Hoja de detalle: ver sobre ti, elegir paleta/color, probar, comprar (con confirmación) y equipar */
export default function ItemSheet({
  item, me, balance, onClose, onChanged, onRain, wished, onWish,
}: {
  item: CatalogItem
  me: PreviewSubject
  balance: number
  onClose: () => void
  /** se llama después de comprar/equipar para recargar el catálogo */
  onChanged: () => void
  onRain?: () => void
  /** v1.5.0 · corazón de la lista de deseos (solo en la tienda) */
  wished?: boolean
  onWish?: () => void
}) {
  const pals = useMemo(() => (item.type === 'font' ? [] : palettesOf(item.type, item.slug)), [item.type, item.slug])
  const [palette, setPalette] = useState<string | undefined>(pals[0]?.id)
  const [hue, setHue] = useState(0)
  const [step, setStep] = useState<'view' | 'confirm' | 'done'>('view')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [owned, setOwned] = useState(item.owned)
  const [bal, setBal] = useState(balance)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const forSale = item.obtainable === 'tienda' && item.price > 0
  const short = item.price - bal
  const eq: Equip = { id: item.slug, ...(palette ? { palette } : {}), ...(hue ? { hue } : {}) }
  const tryHref = `/personalizar?probar=${item.type}:${item.slug}:${palette ?? ''}:${hue}`

  async function buy() {
    setBusy(true)
    setErr('')
    const { data, error } = await shopBuy(item.id, item.price)
    setBusy(false)
    if (error || !data) {
      if (error && /precio cambi/i.test(error)) onChanged() // la oferta empezó o terminó mientras mirabas: se actualiza el precio
      return setErr(error || 'No se pudo comprar')
    }
    setOwned(true)
    setBal(data.balance)
    setStep('done')
    onRain?.()
    refreshWallet(true)
    onChanged()
  }

  async function equipNow() {
    const patch = lookPatch(item.type, eq)
    if (!patch) return
    setBusy(true)
    setErr('')
    const { error } = await saveLook(patch)
    setBusy(false)
    if (error) return setErr(error)
    onChanged()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={item.name}>
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-ink-700 bg-ink-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{TYPE_LABEL[item.type]}</p>
            <h2 className="font-display text-xl font-semibold text-neutral-50 leading-tight">{item.name}</h2>
            <span className={`inline-block mt-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${RARITY_STYLE[item.rarity]}`}>{RARITY_LABEL[item.rarity]}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onWish && !owned && forSale && (
              <button type="button" onClick={onWish} aria-pressed={!!wished} aria-label={wished ? 'Quitar de mi lista de deseos' : 'Agregar a mi lista de deseos'} title={wished ? 'Quitar de deseos' : 'Agregar a deseos'}
                className={`w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-ink-800 transition ${wished ? 'text-garnet-400' : 'text-neutral-400'}`}>
                <HeartIcon className="w-5 h-5" filled={!!wished} />
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-ink-800 text-neutral-400 text-xl leading-none">×</button>
          </div>
        </div>
        {onSale(item) && !owned && item.sale_ends_at && (
          <div className="mb-3 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-transparent px-3 py-2 flex items-center justify-between gap-2">
            <p className="text-sm text-emerald-200 font-semibold flex items-center gap-2 min-w-0"><SalePill pct={salePct(item)} /> <span className="truncate">{item.sale_name ?? 'Oferta'}</span></p>
            <Countdown to={item.sale_ends_at} className="text-[11px] text-emerald-200/90 shrink-0" />
          </div>
        )}

        <div className="rounded-2xl border border-ink-700 bg-ink-950/70 overflow-hidden mb-3 min-h-[180px]">
          <ItemPreview type={item.type} slug={item.slug} palette={palette} hue={hue} me={me} />
        </div>

        {pals.length > 1 && (
          <div className="mb-3">
            <p className="text-xs text-neutral-500 mb-1.5">Paletas incluidas con tu compra</p>
            <div className="flex flex-wrap gap-2">
              {pals.map((p) => (
                <button key={p.id} type="button" onClick={() => setPalette(p.id)} aria-label={`Paleta ${p.name}`} title={p.name}
                  className={`h-9 w-9 rounded-full border-2 transition ${palette === p.id ? 'border-white scale-110' : 'border-ink-600'}`}
                  style={{ background: `linear-gradient(135deg, ${p.c[0]} 50%, ${p.c[2]} 50%)` }} />
              ))}
            </div>
          </div>
        )}
        {item.custom_hue && (
          <div className="mb-3">
            <label className="text-xs text-neutral-500" htmlFor="hue">Color libre (este ítem lo permite)</label>
            <input id="hue" type="range" min={0} max={355} step={5} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full accent-amber-400" />
          </div>
        )}

        {!forSale && !owned && <p className="text-sm text-amber-300/90 mb-3">Este cosmético no se vende. {howToGet(item)}</p>}
        {err && <p className="text-sm text-red-300 mb-3" role="alert">{err}</p>}

        {step === 'view' && (
          <div className="flex flex-col gap-2">
            {owned ? (
              lookPatch(item.type, eq) ? (
                <button type="button" onClick={equipNow} disabled={busy} className="press rounded-xl bg-garnet-600 hover:bg-garnet-500 disabled:opacity-50 text-white font-semibold py-3 transition">
                  {busy ? 'Poniéndolo…' : 'Equipar ahora'}
                </button>
              ) : (
                <p className="text-sm text-emerald-400 text-center">¡Ya es tuyo! Se muestra solo junto a tu nombre.</p>
              )
            ) : forSale ? (
              <button type="button" onClick={() => setStep('confirm')} disabled={short > 0}
                className="press rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-ink-700 disabled:text-neutral-500 text-ink-950 font-bold py-3 transition inline-flex items-center justify-center gap-2">
                <MoonCoinIcon className="w-5 h-5" />
                {short > 0 ? `Te faltan ${formatNumber(short)} ☾` : `Comprar por ${formatNumber(item.price)} ☾`}
                {onSale(item) && short <= 0 && <s className="font-normal text-ink-800/70 text-sm">{formatNumber(item.base_price ?? 0)}</s>}
              </button>
            ) : null}
            {short > 0 && forSale && !owned && (
              <Link href="/misiones" className="text-center text-sm text-amber-300 hover:text-amber-200">Mira tus misiones para ganar Lunas →</Link>
            )}
            <Link href={tryHref} className="press text-center rounded-xl border border-ink-600 text-neutral-200 hover:bg-ink-800 py-2.5 text-sm transition">Probar en mi perfil</Link>
          </div>
        )}

        {step === 'confirm' && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-3">
            <p className="text-sm text-neutral-200">Vas a comprar <b>{item.name}</b></p>
            <dl className="mt-2 text-sm grid grid-cols-2 gap-y-1 tabular-nums">
              <dt className="text-neutral-500">Precio</dt><dd className="text-right text-amber-200 font-semibold">{onSale(item) && <s className="text-neutral-500 font-normal mr-1.5">{formatNumber(item.base_price ?? 0)}</s>}{formatNumber(item.price)} ☾</dd>
              <dt className="text-neutral-500">Tu saldo</dt><dd className="text-right text-neutral-200">{formatNumber(bal)} ☾</dd>
              <dt className="text-neutral-500">Saldo después</dt><dd className="text-right text-neutral-200">{formatNumber(bal - item.price)} ☾</dd>
            </dl>
            <p className="text-[11px] text-neutral-500 mt-2">Las compras no se devuelven (salvo errores). Lo conservas para siempre.</p>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => setStep('view')} disabled={busy} className="flex-1 rounded-xl border border-ink-600 text-neutral-200 py-2.5 text-sm hover:bg-ink-800">Volver</button>
              <button type="button" onClick={buy} disabled={busy} className="press flex-[2] rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-ink-950 font-bold py-2.5">{busy ? 'Comprando…' : 'Confirmar compra'}</button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-300">¡Es tuyo! 🎉</p>
            <p className="text-sm text-neutral-400 mb-3">Te quedan {formatNumber(bal)} ☾</p>
            {lookPatch(item.type, eq) && (
              <button type="button" onClick={equipNow} disabled={busy} className="press w-full rounded-xl bg-garnet-600 hover:bg-garnet-500 text-white font-semibold py-3 transition">Equipar ahora</button>
            )}
            <button type="button" onClick={onClose} className="mt-2 text-sm text-neutral-400 hover:text-neutral-100">Seguir en la tienda</button>
          </div>
        )}
      </div>
    </div>
  )
}
