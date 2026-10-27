'use client'

import { useCallback, useEffect, useState } from 'react'
import CatalogoPanel from './CatalogoPanel'
import DescuentosPanel from './DescuentosPanel'
import SeleccionesPanel from './SeleccionesPanel'
import { adminCollections, adminFeatures, adminItems, adminSales, type AdminCollection, type AdminFeature, type AdminItem, type AdminSale } from '../lib/shopAdmin'

type Sub = 'descuentos' | 'selecciones' | 'catalogo'
const SUBS: { id: Sub; label: string }[] = [{ id: 'descuentos', label: 'Descuentos' }, { id: 'selecciones', label: 'Selecciones (banner)' }, { id: 'catalogo', label: 'Catálogo y precios' }]

/** Centro de Mando · Catálogo y ofertas: descuentos por grupo, selecciones del banner y catálogo con precios */
export default function TiendaCatalogoTab() {
  const [sub, setSub] = useState<Sub>('descuentos')
  const [items, setItems] = useState<AdminItem[]>([])
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [sales, setSales] = useState<AdminSale[]>([])
  const [features, setFeatures] = useState<AdminFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [prefill, setPrefill] = useState<string[]>([])
  const [salesKey, setSalesKey] = useState(0)

  const reload = useCallback(async () => {
    const [a, b, c, d] = await Promise.all([adminItems(), adminCollections(), adminSales(), adminFeatures()])
    setError(a.error || b.error || c.error || d.error)
    setItems(a.data ?? []); setCollections(b.data ?? []); setSales(c.data ?? []); setFeatures(d.data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { const t = setTimeout(reload, 0); return () => clearTimeout(t) }, [reload])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Catálogo y ofertas">
        {SUBS.map((s) => <button key={s.id} role="tab" aria-selected={sub === s.id} onClick={() => setSub(s.id)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${sub === s.id ? 'bg-garnet-600 text-white border-garnet-500' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>{s.label}</button>)}
      </div>
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
      {loading ? <div className="h-40 rounded-2xl bg-ink-800/60 animate-pulse" aria-busy="true" /> : (
        <>
          {sub === 'descuentos' && <DescuentosPanel key={salesKey} items={items} collections={collections} sales={sales} reload={reload} prefill={prefill} clearPrefill={() => setPrefill([])} />}
          {sub === 'selecciones' && <SeleccionesPanel items={items} collections={collections} features={features} reload={reload} />}
          {sub === 'catalogo' && <CatalogoPanel items={items} collections={collections} reload={reload} onSale={(ids) => { setPrefill(ids); setSalesKey((k) => k + 1); setSub('descuentos') }} />}
        </>
      )}
    </div>
  )
}
