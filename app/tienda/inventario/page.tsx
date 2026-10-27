'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSession } from '../../components/AppShell'
import ItemPreview from '../../components/cosmetics/ItemPreview'
import { useHoverPlay } from '../../components/cosmetics/usePlay'
import { useShopData } from '../../components/cosmetics/useShopData'
import { setAllowNextKits } from '../../lib/cosmeticsRelease'
import { RARITY_LABEL, RARITY_STYLE, TYPE_LABEL, lookPatch, saveLook, type CatalogItem, type CosmeticType, type InventoryItem } from '../../lib/cosmetics'

export default function InventarioPage() {
  return <Content />
}

const ORDER: CosmeticType[] = ['avatar_decoration', 'profile_card', 'entry_effect', 'name_effect', 'font', 'background', 'title', 'badge']

function Content() {
  const router = useRouter()
  const { loading: sessionLoading } = useAppSession()
  const { userId, me, inventory, upcoming, worn, loading, reload } = useShopData({ inventory: true, preview: true })
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!sessionLoading && !userId) router.replace('/login')
  }, [sessionLoading, userId, router])
  // Solo la cuenta del equipo con acceso total recibe filas en `upcoming`; para el resto siempre está vacío
  useEffect(() => {
    setAllowNextKits(upcoming.length > 0)
    return () => setAllowNextKits(false)
  }, [upcoming.length])

  const isOn = (i: InventoryItem) =>
    (i.type === 'avatar_decoration' && worn.avatar_deco?.id === i.slug) || (i.type === 'profile_card' && worn.card_style?.id === i.slug) ||
    (i.type === 'entry_effect' && worn.entry_effect?.id === i.slug) || (i.type === 'background' && worn.profile_bg?.id === i.slug) ||
    (i.type === 'title' && worn.title_style?.id === i.slug) || (i.type === 'name_effect' && worn.name_style?.effect?.id === i.slug) ||
    (i.type === 'font' && worn.name_style?.font === i.slug)

  async function toggle(i: InventoryItem) {
    const on = isOn(i)
    const patch = lookPatch(i.type, on ? null : { id: i.slug, palette: i.palettes[0] })
    if (!patch) return
    setBusy(i.id); setErr('')
    const { error } = await saveLook(patch)
    setBusy('')
    if (error) return setErr(error)
    reload()
  }

  const groups = useMemo(() => ORDER.map((t) => ({ type: t, items: inventory.filter((i) => i.type === t) })).filter((g) => g.items.length), [inventory])
  if (!userId) return null
  return (
    <div>
      {err && <p className="text-sm text-red-300 mb-3" role="alert">{err}</p>}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-ink-800/60 animate-pulse" />)}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-neutral-300">Todavía no tienes cosméticos.</p>
          <Link href="/tienda" className="inline-block mt-3 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white px-5 py-2 text-sm">Ir a la tienda</Link>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.type} className="mb-7">
            <h2 className="font-display text-lg font-semibold text-neutral-100 mb-2">{TYPE_LABEL[g.type]}s <span className="text-sm text-neutral-500 font-normal">({g.items.length})</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {g.items.map((i) => {
                const on = isOn(i)
                const equippable = !!lookPatch(i.type, { id: i.slug })
                return <InvCard key={i.id} item={i} me={me} on={on} equippable={equippable} busy={busy === i.id} onToggle={() => toggle(i)} />
              })}
            </div>
          </section>
        ))
      )}

      {/* Solo la cuenta del equipo con acceso total (renshsh): lo que viene, para probarlo. Para cualquier otra cuenta no aparece NADA. */}
      {upcoming.length > 0 && <UpcomingSection items={upcoming} me={me} />}
    </div>
  )
}


/** Tarjeta del inventario: quieta; se anima con el cursor encima (PC) o al tocar la vista previa (celular) */
function InvCard({ item: i, me, on, equippable, busy, onToggle }: { item: InventoryItem; me: ReturnType<typeof useShopData>['me']; on: boolean; equippable: boolean; busy: boolean; onToggle: () => void }) {
  const [tapped, setTapped] = useState(false)
  const { playing, bind } = useHoverPlay(tapped)
  return (
    <article {...bind} className={`rounded-2xl border bg-ink-900/60 overflow-hidden ${on ? 'border-emerald-400/70' : RARITY_STYLE[i.rarity].split(' ')[0]}`}>
      <div className="relative bg-ink-950/60 min-h-[140px] cursor-pointer" onClick={() => setTapped((v) => !v)}>
        <ItemPreview type={i.type} slug={i.slug} me={me} compact lazy playing={playing} />
        {!playing && <span className="play-hint pointer-events-none absolute bottom-2 left-2 w-6 h-6 rounded-full bg-ink-950/70 border border-ink-600 text-[10px] text-neutral-300 flex items-center justify-center" aria-hidden="true">▶</span>}
      </div>
      <div className="px-3 py-2.5 border-t border-ink-800">
        <p className="text-sm font-semibold text-neutral-100 truncate">{i.name}</p>
        <p className={`text-[10px] uppercase tracking-wide font-semibold ${RARITY_STYLE[i.rarity].split(' ')[1]}`}>{RARITY_LABEL[i.rarity]}</p>
        {equippable ? (
          <button type="button" disabled={busy} onClick={onToggle} className={`press mt-2 w-full rounded-lg py-1.5 text-sm font-medium transition ${on ? 'border border-ink-600 text-neutral-300 hover:bg-ink-800' : 'bg-garnet-600 hover:bg-garnet-500 text-white'}`}>
            {on ? 'Quitar' : 'Equipar'}
          </button>
        ) : <p className="mt-2 text-xs text-emerald-400">Se muestra en tu perfil</p>}
      </div>
    </article>
  )
}

function UpcomingSection({ items, me }: { items: CatalogItem[]; me: ReturnType<typeof useShopData>['me'] }) {
  const shown = items.filter((i) => i.type !== 'badge' && i.type !== 'font')
  return (
    <section className="mt-10 rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/5 p-4" aria-label="Lo que viene (solo equipo)">
      <h2 className="font-display text-lg font-semibold text-fuchsia-200">Lo que viene · solo equipo</h2>
      <p className="text-sm text-neutral-400 mb-3">Acceso total gratis para probar. Todavía no se puede equipar ni lo ve nadie más: se enciende cuando se lance la 1.5.0.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {shown.slice(0, 12).map((i) => (
          <article key={i.id} className="rounded-xl border border-fuchsia-500/30 bg-ink-900/60 overflow-hidden">
            <div className="bg-ink-950/60 min-h-[130px]"><ItemPreview type={i.type} slug={i.slug} me={me} compact lazy playing={false} /></div>
            <p className="px-3 py-2 text-sm text-neutral-200 truncate">{i.name} <span className="text-[10px] text-fuchsia-300">· {i.release_version}</span></p>
          </article>
        ))}
      </div>
      {shown.length > 12 && <p className="text-xs text-neutral-500 mt-2">…y {shown.length - 12} más (galería completa en el estudio).</p>}
    </section>
  )
}
