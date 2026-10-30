'use client'

import { useMemo, useState } from 'react'
import ItemPicker, { btnCls, btnPrimary, inputCls } from './ItemPicker'
import BannerArt from '../components/shop/BannerArt'
import { themeOf } from '../components/shop/shopThemes'
import BannerPicker from './BannerPicker'
import { adminFeatureDelete, adminFeatureSave, fromLocalInput, slugify, toLocalInput, sellable, type AdminCollection, type AdminFeature, type AdminItem } from '../lib/shopAdmin'

type Draft = { id: string | null; title: string; slug: string; slugTouched: boolean; subtitle: string; cta: string; theme: string; collections: string[]; item_ids: string[]; starts: string; ends: string; is_active: boolean; sort: number }
const STATUS_STYLE: Record<string, string> = { activa: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', programada: 'bg-sky-500/20 text-sky-300 border-sky-500/40', terminada: 'bg-ink-700 text-neutral-400 border-ink-600', pausada: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
const blank = (): Draft => ({ id: null, title: '', slug: '', slugTouched: false, subtitle: '', cta: 'Ver la selección', theme: 'halloween', collections: [], item_ids: [], starts: toLocalInput(new Date()), ends: '', is_active: true, sort: 0 })

/** Selecciones: lo que rota en el banner principal de la tienda cada 7 segundos («Selección de Halloween», etc.) */
export default function SeleccionesPanel({ items, collections, features, reload }: { items: AdminItem[]; collections: AdminCollection[]; features: AdminFeature[]; reload: () => Promise<void> | void }) {
  const [d, setD] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [showItems, setShowItems] = useState(false)
  const pool = useMemo(() => items.filter(sellable), [items])
  const up = (p: Partial<Draft>) => setD((x) => (x ? { ...x, ...p } : x))

  const edit = (f: AdminFeature) => { setMsg(null); setShowItems(f.item_ids.length > 0); setD({ id: f.id, title: f.title, slug: f.slug, slugTouched: true, subtitle: f.subtitle ?? '', cta: f.cta, theme: f.theme, collections: f.collections, item_ids: f.item_ids, starts: toLocalInput(f.starts_at), ends: toLocalInput(f.ends_at), is_active: f.is_active, sort: f.sort }) }
  async function save() {
    if (!d) return
    setBusy(true)
    const r = await adminFeatureSave(d.id, { slug: d.slug, title: d.title, subtitle: d.subtitle, cta: d.cta, theme: d.theme, collections: d.collections, item_ids: d.item_ids, starts_at: fromLocalInput(d.starts), ends_at: fromLocalInput(d.ends), is_active: d.is_active, sort: d.sort })
    setBusy(false)
    if (r.error) return setMsg({ text: r.error, ok: false })
    setMsg({ text: 'Selección guardada.', ok: true }); setD(null); await reload()
  }
  async function del(f: AdminFeature) {
    if (!confirm(`¿Quitar la selección «${f.title}»? Los cosméticos siguen en la tienda.`)) return
    setBusy(true); const r = await adminFeatureDelete(f.id); setBusy(false)
    if (r.error) setMsg({ text: r.error, ok: false }); else { setMsg({ text: 'Selección eliminada.', ok: true }); await reload() }
  }

  if (d) {
    const t = themeOf(d.theme)
    const count = new Set([...pool.filter((i) => d.collections.includes(i.collection) && i.is_active).map((i) => i.id), ...d.item_ids]).size
    const toggleColl = (id: string) => up({ collections: d.collections.includes(id) ? d.collections.filter((c) => c !== id) : [...d.collections, id] })
    const selected = new Set(d.item_ids)
    const canSave = d.title.trim().length >= 2 && /^[a-z0-9-]{2,40}$/.test(d.slug) && (d.collections.length > 0 || d.item_ids.length > 0)
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-neutral-50">{d.id ? 'Editar selección' : 'Nueva selección'}</h2><button className={btnCls} onClick={() => setD(null)} disabled={busy}>← Volver</button></div>
        <div className="relative overflow-hidden rounded-2xl border border-ink-700 isolate min-h-[170px]">
          <BannerArt theme={d.theme} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
          <div className="relative z-10 p-5">
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ background: t.c, color: '#120408' }}>Nuevo en la tienda</span>
            <h3 className="font-display text-3xl font-bold text-white mt-2">{d.title || 'Título del banner'}</h3>
            <p className="text-sm text-white/85 mt-1 max-w-md">{d.subtitle || 'Frase corta debajo del título'}</p>
            <span className="inline-block mt-3 rounded-xl bg-white text-ink-950 font-semibold px-4 py-2 text-sm">{d.cta || 'Ver la selección'} ›</span>
            <p className="text-xs text-white/70 mt-2">{count} cosméticos</p>
          </div>
        </div>
        <section className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-neutral-400">Título<input value={d.title} maxLength={60} onChange={(e) => up({ title: e.target.value, ...(d.slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="Selección de Halloween" className={`${inputCls} mt-1`} /></label>
            <label className="text-xs text-neutral-400">Enlace (…/tienda/seleccion/<b>{d.slug || 'enlace'}</b>)<input value={d.slug} maxLength={40} onChange={(e) => up({ slug: slugify(e.target.value), slugTouched: true })} className={`${inputCls} mt-1`} /></label>
            <label className="text-xs text-neutral-400 sm:col-span-2">Frase corta<input value={d.subtitle} maxLength={160} onChange={(e) => up({ subtitle: e.target.value })} placeholder="Sangre Noir, Emo Abismo y 7 colecciones nuevas…" className={`${inputCls} mt-1`} /></label>
            <label className="text-xs text-neutral-400">Texto del botón<input value={d.cta} maxLength={30} onChange={(e) => up({ cta: e.target.value })} className={`${inputCls} mt-1`} /></label>
            <label className="text-xs text-neutral-400">Orden en el carrusel (menor = primero)<input type="number" value={d.sort} onChange={(e) => up({ sort: Number(e.target.value) || 0 })} className={`${inputCls} mt-1`} /></label>
          </div>
          <BannerPicker value={d.theme} onChange={(id) => up({ theme: id })} label="Banner de la selección" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-neutral-400">Empieza<input type="datetime-local" value={d.starts} onChange={(e) => up({ starts: e.target.value })} className={`${inputCls} mt-1`} /></label>
            <label className="text-xs text-neutral-400">Termina (vacío = sin fecha de fin)<input type="datetime-local" value={d.ends} onChange={(e) => up({ ends: e.target.value })} className={`${inputCls} mt-1`} /></label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={d.is_active} onChange={(e) => up({ is_active: e.target.checked })} className="accent-garnet-500" /> Activa (se ve en la tienda)</label>
        </section>
        <section className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-100">Colecciones que entran <span className="text-neutral-500 font-normal">({d.collections.length})</span></h3>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.filter((c) => c.kind !== 'base').map((c) => (
              <label key={c.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${d.collections.includes(c.id) ? 'border-garnet-500 bg-garnet-600/10 text-white' : 'border-ink-700 text-neutral-300 hover:bg-ink-800'}`}>
                <input type="checkbox" checked={d.collections.includes(c.id)} onChange={() => toggleColl(c.id)} className="accent-garnet-500" />
                <span className="truncate">{c.name}</span><span className="ml-auto text-[11px] text-neutral-500">{c.items}{c.is_active ? '' : ' · oculta'}</span>
              </label>
            ))}
          </div>
          <button type="button" className={btnCls} onClick={() => setShowItems((s) => !s)}>{showItems ? 'Ocultar' : 'Agregar'} cosméticos sueltos ({d.item_ids.length})</button>
          {showItems && <ItemPicker items={pool} collections={collections} selected={selected} maxHeight="max-h-[320px]"
            onToggle={(i) => up({ item_ids: selected.has(i.id) ? d.item_ids.filter((x) => x !== i.id) : [...d.item_ids, i.id] })}
            onMany={(list, on) => { const s = new Set(d.item_ids); for (const i of list) { if (on) s.add(i.id); else s.delete(i.id) } up({ item_ids: [...s] }) }} />}
        </section>
        {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`} role="alert">{msg.text}</p>}
        <div className="flex gap-2 sticky bottom-2"><button className={btnPrimary} disabled={!canSave || busy} onClick={save}>{busy ? 'Guardando…' : d.id ? 'Guardar cambios' : 'Crear selección'}</button><button className={btnCls} onClick={() => setD(null)} disabled={busy}>Cancelar</button></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="font-display text-lg font-semibold text-neutral-50">Selecciones del banner</h2><p className="text-sm text-neutral-400">Cada selección es una diapositiva del banner principal (rota cada 7 segundos) y lleva a su página con los cosméticos nuevos.</p></div>
        <button className={btnPrimary} onClick={() => { setMsg(null); setShowItems(false); setD(blank()) }}>+ Nueva selección</button>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`} role="status">{msg.text}</p>}
      {features.length === 0 && <p className="rounded-xl border border-ink-700 bg-ink-900/50 p-6 text-center text-sm text-neutral-400">No hay selecciones. Si no hay ninguna, la tienda muestra un banner general de bienvenida.</p>}
      <ul className="space-y-3">
        {features.map((f) => (
          <li key={f.id} className="rounded-2xl border border-ink-700 bg-ink-900/60 overflow-hidden">
            <div className="relative h-24 isolate"><BannerArt theme={f.theme} /><div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" /><div className="relative z-10 p-4"><p className="font-display text-xl font-bold text-white">{f.title}</p><p className="text-xs text-white/75 truncate">{f.subtitle}</p></div></div>
            <div className="p-3 flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[f.status]}`}>{f.status}</span>
              <span className="text-xs text-neutral-400">{f.collections.length} colecciones{f.item_ids.length ? ` + ${f.item_ids.length} sueltos` : ''} · {f.ends_at ? `hasta ${new Date(f.ends_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}` : 'sin fecha de fin'} · /tienda/seleccion/{f.slug}</span>
              <span className="ml-auto flex gap-2"><button className={btnCls} onClick={() => edit(f)} disabled={busy}>Editar</button><button className={`${btnCls} !text-red-300`} onClick={() => del(f)} disabled={busy}>Quitar</button></span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
