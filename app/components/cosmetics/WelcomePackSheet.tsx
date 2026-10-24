'use client'

import { useState } from 'react'
import ItemPreview, { type PreviewSubject } from './ItemPreview'
import { welcomePackClaim, type CatalogItem } from '../../lib/cosmetics'

/** Pack Bienvenida: elige piezas COMUNES gratis (una sola vez). El servidor valida cuántas y de qué tipo. */
export default function WelcomePackSheet({ status, catalog, me, onClose, onDone }: {
  status: { decos: number; fonts: number; titles: number }
  catalog: CatalogItem[]
  me: PreviewSubject
  onClose: () => void
  onDone: () => void
}) {
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const commons = catalog.filter((i) => i.rarity === 'comun' && i.obtainable === 'tienda' && i.price > 0 && !i.owned)
  const groups: { type: CatalogItem['type']; label: string; max: number }[] = [
    { type: 'avatar_decoration', label: 'Decoraciones', max: status.decos },
    { type: 'font', label: 'Fuentes', max: status.fonts },
    { type: 'title', label: 'Títulos', max: status.titles },
  ]
  const count = (t: CatalogItem['type']) => commons.filter((i) => i.type === t && sel.has(i.id)).length
  function toggle(i: CatalogItem, max: number) {
    setErr('')
    const n = new Set(sel)
    if (n.has(i.id)) n.delete(i.id)
    else if (count(i.type) < max) n.add(i.id)
    else return setErr(`Solo puedes elegir ${max}`)
    setSel(n)
  }
  async function claim() {
    setBusy(true); setErr('')
    const { error } = await welcomePackClaim(Array.from(sel))
    setBusy(false)
    if (error) return setErr(error)
    onDone()
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Pack Bienvenida">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-ink-700 bg-ink-900 p-4">
        <div className="flex justify-between items-start mb-3">
          <div><h2 className="font-display text-xl font-semibold text-neutral-50">Pack Bienvenida</h2><p className="text-sm text-neutral-400">Elige lo que más te guste. Es gratis y solo se reclama una vez.</p></div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-ink-800 text-neutral-400 text-xl">×</button>
        </div>
        {groups.map((g) => (
          <section key={g.type} className="mb-4">
            <p className="text-sm font-semibold text-neutral-200 mb-2">{g.label} <span className="text-neutral-500 font-normal tabular-nums">({count(g.type)} / {g.max})</span></p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {commons.filter((i) => i.type === g.type).map((i) => {
                const on = sel.has(i.id)
                return (
                  <button key={i.id} type="button" onClick={() => toggle(i, g.max)} aria-pressed={on}
                    className={`rounded-xl border text-left overflow-hidden transition ${on ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-ink-700 hover:border-ink-500'}`}>
                    <div className="bg-ink-950/60 min-h-[96px]"><ItemPreview type={i.type} slug={i.slug} me={me} compact /></div>
                    <p className="px-2 py-1.5 text-xs text-neutral-200 truncate">{on ? '✓ ' : ''}{i.name}</p>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {err && <p className="text-sm text-red-300 mb-2" role="alert">{err}</p>}
        <button type="button" onClick={claim} disabled={busy || sel.size === 0} className="press w-full rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:bg-ink-700 disabled:text-neutral-500 text-ink-950 font-bold py-3">
          {busy ? 'Reclamando…' : `Reclamar ${sel.size} ${sel.size === 1 ? 'pieza' : 'piezas'} gratis`}
        </button>
      </div>
    </div>
  )
}
