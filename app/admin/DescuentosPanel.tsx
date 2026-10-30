'use client'

import { useMemo, useState } from 'react'
import ItemPicker, { btnCls, btnPrimary, inputCls } from './ItemPicker'
import { SaleHeader } from '../components/shop/SaleBanner'
import BannerPicker from './BannerPicker'
import { SALE_KIND_LABEL, TYPE_LABEL, type ShopSale } from '../lib/cosmetics'
import { formatNumber } from '../lib/economy'
import {
  addHours, adminSaleActive, adminSaleDelete, adminSaleEnd, adminSaleSave, discounted, fromLocalInput, pctOf, sellable, toLocalInput,
  type AdminCollection, type AdminItem, type AdminSale,
} from '../lib/shopAdmin'

type Draft = {
  id: string | null; name: string; blurb: string; kind: AdminSale['kind']; theme: string
  starts: string; ends: string; startNow: boolean; is_active: boolean; in_banner: boolean; sort: number
  picked: Record<string, number>; mode: 'pct' | 'fixed'; pct: number
}
const KIND_HOURS: Record<AdminSale['kind'], number> = { oferta: 72, dia: 24, semana: 168, evento: 168 }
const STATUS_STYLE: Record<string, string> = { activa: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', programada: 'bg-sky-500/20 text-sky-300 border-sky-500/40', terminada: 'bg-ink-700 text-neutral-400 border-ink-600', pausada: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }

const blank = (ids: string[], items: AdminItem[]): Draft => {
  const picked: Record<string, number> = {}
  for (const id of ids) { const it = items.find((x) => x.id === id); if (it && sellable(it)) picked[id] = discounted(it.price, 30) }
  return { id: null, name: '', blurb: '', kind: 'oferta', theme: 'ember', starts: toLocalInput(new Date()), ends: toLocalInput(addHours(72)), startNow: true, is_active: true, in_banner: true, sort: 0, picked, mode: 'pct', pct: 30 }
}

export default function DescuentosPanel({ items, collections, sales, reload, prefill, clearPrefill }: {
  items: AdminItem[]; collections: AdminCollection[]; sales: AdminSale[]; reload: () => Promise<void> | void; prefill: string[]; clearPrefill: () => void
}) {
  const [draft, setDraft] = useState<Draft | null>(() => (prefill.length ? blank(prefill, items) : null))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const pool = useMemo(() => items.filter(sellable), [items])

  const flash = (text: string, ok = true) => setMsg({ text, ok })
  const edit = (s: AdminSale) => {
    const picked: Record<string, number> = {}
    for (const it of s.items) picked[it.item_id] = it.sale_price
    setMsg(null)
    setDraft({ id: s.id, name: s.name, blurb: s.blurb ?? '', kind: s.kind, theme: s.theme, starts: toLocalInput(s.starts_at), ends: toLocalInput(s.ends_at), startNow: false, is_active: s.is_active, in_banner: s.in_banner, sort: s.sort, picked, mode: 'fixed', pct: 30 })
  }
  const duplicate = (s: AdminSale) => { edit(s); setDraft((d) => d && { ...d, id: null, name: `${s.name} (copia)`, starts: toLocalInput(new Date()), ends: toLocalInput(addHours(KIND_HOURS[s.kind])), startNow: true, is_active: true }) }
  const act = async (fn: () => Promise<{ error: string }>, ok: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.error) flash(r.error, false); else { flash(ok); await reload() } }

  if (draft) return <Editor draft={draft} setDraft={setDraft} items={pool} byId={byId} collections={collections} busy={busy}
    onCancel={() => { setDraft(null); clearPrefill() }}
    onSave={async () => {
      const d = draft
      const rows = Object.entries(d.picked).map(([item_id, sale_price]) => ({ item_id, sale_price }))
      setBusy(true)
      const r = await adminSaleSave(d.id, { name: d.name, blurb: d.blurb, kind: d.kind, theme: d.theme, starts_at: d.startNow && !d.id ? null : fromLocalInput(d.starts), ends_at: fromLocalInput(d.ends), is_active: d.is_active, in_banner: d.in_banner, sort: d.sort, items: rows })
      setBusy(false)
      if (r.error) return flash(r.error, false)
      flash(`Oferta guardada con ${r.data?.items ?? rows.length} cosméticos.`)
      setDraft(null); clearPrefill(); await reload()
    }} msg={msg} />

  const live = sales.filter((s) => s.status === 'activa').length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-50">Descuentos</h2>
          <p className="text-sm text-neutral-400">Agrupa cosméticos, ponles un precio rebajado y una hora de fin. Aparecen solos en el banner de ofertas y en la pestaña «Descuentos» de la tienda.</p>
        </div>
        <button type="button" className={btnPrimary} onClick={() => { setMsg(null); setDraft(blank([], items)) }}>+ Nueva oferta</button>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`} role="status">{msg.text}</p>}
      <p className="text-xs text-neutral-500">{live} activa{live === 1 ? '' : 's'} ahora · {sales.length} en total</p>
      {sales.length === 0 && <p className="rounded-xl border border-ink-700 bg-ink-900/50 p-6 text-center text-sm text-neutral-400">Todavía no hay ofertas. Crea la primera con «Nueva oferta», o marca cosméticos en la pestaña Catálogo y toca «Poner en oferta».</p>}
      <ul className="space-y-3">
        {sales.map((s) => {
          const maxPct = Math.max(0, ...s.items.map((it) => { const b = byId.get(it.item_id); return b ? pctOf(b.price, it.sale_price) : 0 }))
          const preview: ShopSale = { id: s.id, name: s.name, blurb: s.blurb, kind: s.kind, theme: s.theme, starts_at: s.starts_at, ends_at: s.ends_at, in_banner: s.in_banner, sort: s.sort }
          return (
            <li key={s.id} className="rounded-2xl border border-ink-700 bg-ink-900/60 overflow-hidden">
              <div className="relative"><SaleHeader sale={preview} maxPct={maxPct} count={s.items.length} compact /></div>
              <div className="p-3 flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                <span className="text-neutral-400 text-xs">{new Date(s.starts_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })} → {new Date(s.ends_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                {!s.in_banner && <span className="text-[11px] text-neutral-500">(sin banner en la portada)</span>}
                <span className="ml-auto flex flex-wrap gap-2">
                  <button className={btnCls} onClick={() => edit(s)} disabled={busy}>Editar</button>
                  <button className={btnCls} onClick={() => duplicate(s)} disabled={busy}>Duplicar</button>
                  {s.status !== 'terminada' && <button className={btnCls} disabled={busy} onClick={() => act(() => adminSaleActive(s.id, !s.is_active), s.is_active ? 'Oferta pausada.' : 'Oferta reanudada.')}>{s.is_active ? 'Pausar' : 'Reanudar'}</button>}
                  {s.status !== 'terminada' && <button className={btnCls} disabled={busy} onClick={() => { if (confirm(`¿Terminar «${s.name}» ahora mismo? Los precios vuelven a la normalidad.`)) act(() => adminSaleEnd(s.id), 'Oferta terminada.') }}>Terminar ya</button>}
                  <button className={`${btnCls} !text-red-300`} disabled={busy} onClick={() => { if (confirm(`¿Borrar «${s.name}» para siempre?`)) act(() => adminSaleDelete(s.id), 'Oferta borrada.') }}>Borrar</button>
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Editor({ draft: d, setDraft, items, byId, collections, busy, onSave, onCancel, msg }: {
  draft: Draft; setDraft: (f: (d: Draft | null) => Draft | null) => void; items: AdminItem[]; byId: Map<string, AdminItem>; collections: AdminCollection[]
  busy: boolean; onSave: () => void; onCancel: () => void; msg: { text: string; ok: boolean } | null
}) {
  const up = (p: Partial<Draft>) => setDraft((x) => (x ? { ...x, ...p } : x))
  const ids = Object.keys(d.picked)
  const selected = useMemo(() => new Set(ids), [ids])
  const rows = ids.map((id) => byId.get(id)).filter((x): x is AdminItem => !!x)
  const problems = rows.filter((i) => !(d.picked[i.id] >= 1 && d.picked[i.id] < i.price))
  const totalBase = rows.reduce((n, i) => n + i.price, 0)
  const totalSale = rows.reduce((n, i) => n + (d.picked[i.id] ?? i.price), 0)
  const maxPct = Math.max(0, ...rows.map((i) => pctOf(i.price, d.picked[i.id] ?? i.price)))
  const [nowMs] = useState(() => Date.now())
  const endsOk = !!fromLocalInput(d.ends) && new Date(d.ends).getTime() > (d.startNow ? nowMs : new Date(d.starts).getTime())
  const canSave = d.name.trim().length >= 2 && rows.length > 0 && problems.length === 0 && endsOk

  const toggle = (i: AdminItem) => { const n = { ...d.picked }; if (n[i.id] != null) delete n[i.id]; else n[i.id] = discounted(i.price, d.pct); up({ picked: n }) }
  const many = (list: AdminItem[], on: boolean) => { const n = { ...d.picked }; for (const i of list) { if (on) n[i.id] = n[i.id] ?? discounted(i.price, d.pct); else delete n[i.id] } up({ picked: n }) }
  const applyPct = (pct: number) => { const n: Record<string, number> = {}; for (const i of rows) n[i.id] = discounted(i.price, pct); up({ pct, picked: n, mode: 'pct' }) }
  const setKind = (kind: Draft['kind']) => up({ kind, ends: toLocalInput(addHours(KIND_HOURS[kind], d.startNow ? new Date() : new Date(d.starts))) })
  const preview: ShopSale = { id: 'p', name: d.name || 'Nombre de la oferta', blurb: d.blurb || null, kind: d.kind, theme: d.theme, starts_at: new Date().toISOString(), ends_at: fromLocalInput(d.ends) ?? addHours(24).toISOString(), in_banner: d.in_banner, sort: d.sort }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-neutral-50">{d.id ? 'Editar oferta' : 'Nueva oferta'}</h2>
        <button type="button" className={btnCls} onClick={onCancel} disabled={busy}>← Volver</button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-ink-700" aria-label="Vista previa del banner"><SaleHeader sale={preview} maxPct={maxPct} count={rows.length} compact /></div>

      <section className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-100">1 · Datos de la oferta</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-neutral-400">Nombre (se ve en el banner)<input value={d.name} onChange={(e) => up({ name: e.target.value })} maxLength={60} placeholder="Rebajas de Halloween" className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-neutral-400">Frase corta (opcional)<input value={d.blurb} onChange={(e) => up({ blurb: e.target.value })} maxLength={140} placeholder="Solo esta semana, hasta agotar el tiempo" className={`${inputCls} mt-1`} /></label>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1.5">Tipo (cambia la etiqueta y propone una duración)</p>
          <div className="flex flex-wrap gap-2">{(Object.keys(SALE_KIND_LABEL) as AdminSale['kind'][]).map((k) => <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-full border px-3 py-1 text-sm ${d.kind === k ? 'bg-garnet-600 border-garnet-500 text-white' : 'bg-ink-800 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>{SALE_KIND_LABEL[k]}</button>)}</div>
        </div>
        <BannerPicker value={d.theme} onChange={(id) => up({ theme: id })} label="Banner de la oferta" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="text-xs text-neutral-400">Empieza
            {d.id ? <input type="datetime-local" value={d.starts} onChange={(e) => up({ starts: e.target.value })} className={`${inputCls} mt-1`} /> : (
              <div className="mt-1 space-y-1.5">
                <label className="inline-flex items-center gap-2 text-neutral-300 text-sm"><input type="checkbox" checked={d.startNow} onChange={(e) => up({ startNow: e.target.checked })} className="accent-garnet-500" /> Ahora mismo</label>
                {!d.startNow && <input type="datetime-local" value={d.starts} onChange={(e) => up({ starts: e.target.value })} className={inputCls} />}
              </div>
            )}
          </div>
          <div className="text-xs text-neutral-400">Termina (fecha y hora)
            <input type="datetime-local" value={d.ends} onChange={(e) => up({ ends: e.target.value })} className={`${inputCls} mt-1`} />
            <div className="flex flex-wrap gap-1.5 mt-1.5">{[['+24 h', 24], ['+3 días', 72], ['+7 días', 168], ['+14 días', 336]].map(([l, h]) => <button key={l} type="button" className="rounded-full border border-ink-600 bg-ink-800 hover:bg-ink-700 px-2.5 py-0.5 text-[11px] text-neutral-300" onClick={() => up({ ends: toLocalInput(addHours(h as number, d.startNow ? new Date() : new Date(d.starts))) })}>{l}</button>)}</div>
            {!endsOk && <p className="text-red-300 mt-1">La hora de fin debe ser posterior al inicio.</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-neutral-300">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={d.in_banner} onChange={(e) => up({ in_banner: e.target.checked })} className="accent-garnet-500" /> Mostrar en el banner de la portada</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={d.is_active} onChange={(e) => up({ is_active: e.target.checked })} className="accent-garnet-500" /> Activa</label>
          <label className="inline-flex items-center gap-2">Orden <input type="number" value={d.sort} onChange={(e) => up({ sort: Number(e.target.value) || 0 })} className={`${inputCls} !w-20`} /></label>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-100">2 · Elige los cosméticos <span className="text-neutral-500 font-normal">({rows.length} elegidos)</span></h3>
        <ItemPicker items={items} collections={collections} selected={selected} onToggle={toggle} onMany={many} />
      </section>

      <section className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-100">3 · Precios de oferta</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-neutral-300">Aplicar a todos:</span>
          {[10, 20, 30, 40, 50, 70].map((p) => <button key={p} type="button" onClick={() => applyPct(p)} className={`rounded-full border px-2.5 py-0.5 ${d.mode === 'pct' && d.pct === p ? 'bg-emerald-500 text-ink-950 border-emerald-400 font-bold' : 'bg-ink-800 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>−{p}%</button>)}
          <label className="inline-flex items-center gap-1 text-neutral-400">otro <input type="number" min={1} max={95} value={d.pct} onChange={(e) => applyPct(Math.min(95, Math.max(1, Number(e.target.value) || 1)))} className={`${inputCls} !w-16 !py-1`} />%</label>
          <span className="text-xs text-neutral-500">…o cambia el precio de cada uno abajo.</span>
        </div>
        {rows.length === 0 ? <p className="text-sm text-neutral-500">Elige cosméticos arriba para ponerles precio.</p> : (
          <>
            <div className="max-h-[360px] overflow-y-auto rounded-xl border border-ink-700">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-900 text-[11px] uppercase tracking-wide text-neutral-500"><tr><th className="text-left px-3 py-2">Cosmético</th><th className="text-right px-2">Normal</th><th className="text-right px-2">Oferta</th><th className="text-right px-3">Dto.</th><th /></tr></thead>
                <tbody className="divide-y divide-ink-800">
                  {rows.map((i) => {
                    const sp = d.picked[i.id]; const bad = !(sp >= 1 && sp < i.price)
                    return (
                      <tr key={i.id}>
                        <td className="px-3 py-1.5"><span className="block text-neutral-100 truncate max-w-[16rem]">{i.name}</span><span className="block text-[11px] text-neutral-500">{TYPE_LABEL[i.type]} · {i.collection_name}</span></td>
                        <td className="text-right px-2 tabular-nums text-neutral-400">{formatNumber(i.price)}</td>
                        <td className="text-right px-2"><input type="number" min={1} max={i.price - 1} value={sp} onChange={(e) => up({ mode: 'fixed', picked: { ...d.picked, [i.id]: Number(e.target.value) } })} aria-label={`Precio de oferta de ${i.name}`} className={`${inputCls} !w-24 !py-1 text-right tabular-nums ${bad ? '!border-red-500' : ''}`} /></td>
                        <td className={`text-right px-3 tabular-nums font-semibold ${bad ? 'text-red-400' : 'text-emerald-300'}`}>{bad ? '—' : `−${pctOf(i.price, sp)}%`}</td>
                        <td className="pr-2"><button type="button" aria-label={`Quitar ${i.name}`} onClick={() => { const n = { ...d.picked }; delete n[i.id]; up({ picked: n }) }} className="text-neutral-500 hover:text-red-300 px-1">×</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400">Si lo compraran todo: <s>{formatNumber(totalBase)} ☾</s> → <b className="text-emerald-300">{formatNumber(totalSale)} ☾</b> (la gente ahorra {formatNumber(totalBase - totalSale)} ☾).</p>
            {problems.length > 0 && <p className="text-xs text-red-300">{problems.length} precio(s) no válidos: la oferta debe ser de al menos 1 ☾ y menor que el precio normal.</p>}
          </>
        )}
      </section>

      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`} role="alert">{msg.text}</p>}
      <div className="flex flex-wrap gap-2 sticky bottom-2">
        <button type="button" className={btnPrimary} disabled={!canSave || busy} onClick={onSave}>{busy ? 'Guardando…' : d.id ? 'Guardar cambios' : 'Crear oferta'}</button>
        <button type="button" className={btnCls} onClick={onCancel} disabled={busy}>Cancelar</button>
        {!canSave && <span className="self-center text-xs text-neutral-500">{d.name.trim().length < 2 ? 'Falta el nombre. ' : ''}{rows.length === 0 ? 'Elige al menos un cosmético. ' : ''}{problems.length ? 'Revisa los precios. ' : ''}</span>}
      </div>
    </div>
  )
}
