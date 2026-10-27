'use client'

import { useMemo, useState } from 'react'
import { btnCls, btnPrimary, inputCls } from './ItemPicker'
import { RARITY_LABEL, TYPE_LABEL, type CosmeticType } from '../lib/cosmetics'
import { formatNumber } from '../lib/economy'
import { adminSetPrice, pctOf, sellable, type AdminCollection, type AdminItem } from '../lib/shopAdmin'

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const TYPES: CosmeticType[] = ['avatar_decoration', 'profile_card', 'entry_effect', 'name_effect', 'font', 'background', 'title', 'badge']

/** Catálogo completo: busca, filtra, cambia precios y marca cosméticos para ponerlos en oferta */
export default function CatalogoPanel({ items, collections, reload, onSale }: { items: AdminItem[]; collections: AdminCollection[]; reload: () => Promise<void> | void; onSale: (ids: string[]) => void }) {
  const [q, setQ] = useState(''); const [type, setType] = useState(''); const [coll, setColl] = useState(''); const [ver, setVer] = useState(''); const [state, setState] = useState('')
  const [count, setCount] = useState(50)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [edit, setEdit] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const versions = useMemo(() => Array.from(new Set(items.map((i) => i.release_version))).sort(), [items])
  const shown = useMemo(() => {
    const n = norm(q.trim())
    return items.filter((i) => {
      if (type && i.type !== type) return false
      if (coll && i.collection !== coll) return false
      if (ver && i.release_version !== ver) return false
      if (state === 'activos' && !i.is_active) return false
      if (state === 'ocultos' && i.is_active) return false
      if (state === 'oferta' && i.sale_price == null) return false
      if (state === 'nosevende' && sellable(i)) return false
      if (state === 'sinduenos' && i.owners > 0) return false
      return !n || norm(`${i.name} ${i.slug} ${i.collection_name}`).includes(n)
    })
  }, [items, q, type, coll, ver, state])
  const selectable = shown.filter(sellable)
  const stats = useMemo(() => ({ total: items.length, active: items.filter((i) => i.is_active).length, sale: items.filter((i) => i.sale_price != null).length }), [items])

  async function savePrice(i: AdminItem) {
    const v = Number(edit[i.id]); if (!Number.isInteger(v) || v < 0) return setMsg({ text: 'Precio no válido', ok: false })
    setBusy(i.id); const r = await adminSetPrice(i.id, v); setBusy('')
    if (r.error) return setMsg({ text: r.error, ok: false })
    setMsg({ text: `«${i.name}» ahora cuesta ${formatNumber(v)} ☾`, ok: true }); setEdit((e) => { const n = { ...e }; delete n[i.id]; return n }); await reload()
  }
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div className="space-y-3">
      <div><h2 className="font-display text-lg font-semibold text-neutral-50">Catálogo</h2><p className="text-sm text-neutral-400">{stats.total} cosméticos · {stats.active} visibles · {stats.sale} en oferta ahora. Cambia precios aquí o marca varios y toca «Poner en oferta».</p></div>
      <div className="grid gap-2 sm:grid-cols-5">
        <input value={q} onChange={(e) => { setQ(e.target.value); setCount(50) }} placeholder="Buscar…" className={`${inputCls} sm:col-span-2`} aria-label="Buscar" />
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls} aria-label="Tipo"><option value="">Todo tipo</option>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select>
        <select value={coll} onChange={(e) => setColl(e.target.value)} className={inputCls} aria-label="Colección"><option value="">Toda colección</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={ver} onChange={(e) => setVer(e.target.value)} className={inputCls} aria-label="Versión"><option value="">Toda versión</option>{versions.map((v) => <option key={v} value={v}>v{v}</option>)}</select>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select value={state} onChange={(e) => setState(e.target.value)} className={`${inputCls} !w-auto`} aria-label="Estado"><option value="">Cualquier estado</option><option value="activos">Visibles</option><option value="ocultos">Ocultos</option><option value="oferta">En oferta</option><option value="nosevende">No se venden</option><option value="sinduenos">Sin dueños aún</option></select>
        <button className={btnCls} onClick={() => setSel(new Set(selectable.map((i) => i.id)))} disabled={!selectable.length}>Marcar los {selectable.length} vendibles que se ven</button>
        {sel.size > 0 && <button className={btnCls} onClick={() => setSel(new Set())}>Limpiar</button>}
        <button className={btnPrimary} disabled={sel.size === 0} onClick={() => onSale([...sel])}>Poner en oferta ({sel.size})</button>
        <span className="ml-auto text-xs text-neutral-500">{shown.length} resultados</span>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`} role="status">{msg.text}</p>}
      <div className="overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-ink-900 text-[11px] uppercase tracking-wide text-neutral-500"><tr><th className="w-8 px-2" /><th className="text-left px-2 py-2">Cosmético</th><th className="text-left px-2">Rareza</th><th className="text-left px-2">Versión</th><th className="text-right px-2">Dueños</th><th className="text-right px-2">♥</th><th className="text-right px-2">Precio ☾</th><th /></tr></thead>
          <tbody className="divide-y divide-ink-800">
            {shown.slice(0, count).map((i) => {
              const can = sellable(i); const ev = edit[i.id]
              return (
                <tr key={i.id} className={sel.has(i.id) ? 'bg-garnet-600/10' : ''}>
                  <td className="px-2 text-center">{can && <input type="checkbox" checked={sel.has(i.id)} onChange={() => toggle(i.id)} aria-label={`Marcar ${i.name}`} className="accent-garnet-500" />}</td>
                  <td className="px-2 py-1.5"><span className="block text-neutral-100 truncate max-w-[18rem]">{i.name}{!i.is_active && <span className="ml-2 text-[10px] rounded bg-ink-700 text-neutral-400 px-1.5 py-0.5">oculto</span>}{i.sale_price != null && <span className="ml-2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5" title={i.sale_name ?? ''}>−{pctOf(i.price, i.sale_price)}% · {formatNumber(i.sale_price)}</span>}</span><span className="block text-[11px] text-neutral-500">{TYPE_LABEL[i.type]} · {i.collection_name}</span></td>
                  <td className="px-2 text-neutral-300">{RARITY_LABEL[i.rarity]}</td>
                  <td className="px-2 text-neutral-400">v{i.release_version}</td>
                  <td className="px-2 text-right tabular-nums text-neutral-300">{i.owners}</td>
                  <td className="px-2 text-right tabular-nums text-neutral-400">{i.wishes}</td>
                  <td className="px-2 text-right">{can ? <input type="number" min={0} value={ev ?? i.price} onChange={(e) => setEdit((x) => ({ ...x, [i.id]: e.target.value }))} aria-label={`Precio de ${i.name}`} className={`${inputCls} !w-24 !py-1 text-right tabular-nums`} /> : <span className="text-neutral-500 text-xs" title={i.obtainable}>no se vende</span>}</td>
                  <td className="px-2">{ev !== undefined && Number(ev) !== i.price && <button className={`${btnCls} !py-1`} disabled={busy === i.id} onClick={() => savePrice(i)}>{busy === i.id ? '…' : 'Guardar'}</button>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {shown.length > count && <button className={btnCls} onClick={() => setCount((c) => c + 50)}>Mostrar más ({shown.length - count})</button>}
    </div>
  )
}
