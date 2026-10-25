'use client'
/** /dev/closet — prueba del clóset (v1.4.5) sin base de datos: catálogo de muestra con TODO lo lanzado. Apagada en producción salvo NEXT_PUBLIC_DEV_COSMETICOS=1. */
import { useMemo, useState } from 'react'
import { notFound } from 'next/navigation'
import ClosetView, { EMPTY_LOOK, SLOT, type Draft, type Look, type Tab } from '../../personalizar/Closet'
import { RELEASED } from '../../components/cosmetics/kit'
import { palettesOf } from '../../components/cosmetics/kit'
import type { CatalogItem, CosmeticType, Equip, Rarity } from '../../lib/cosmetics'

const PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d36a8a"/><stop offset="1" stop-color="#3b2a6e"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="38" r="17" fill="#f6dfe6"/><path d="M14 100c0-22 16-36 36-36s36 14 36 36z" fill="#f6dfe6"/></svg>`)

type K = { slug: string; name: string; rarity: Rarity; price: number; coll?: string }
function mk(type: CosmeticType, list: K[]): CatalogItem[] {
  return list.map((x, n) => ({ id: `${type}:${x.slug}`, type, slug: x.slug, name: x.name, rarity: x.rarity, price: x.price, collection: x.coll ?? 'base', min_size: null, custom_hue: x.rarity === 'legendario', palettes: [], meta: {}, obtainable: 'tienda', release_version: '1.4.0', owned: n % 3 === 0 }))
}

function Demo() {
  const items = useMemo(() => [
    ...mk('avatar_decoration', RELEASED.decos), ...mk('profile_card', RELEASED.cards), ...mk('entry_effect', RELEASED.entries),
    ...mk('name_effect', RELEASED.names), ...mk('background', RELEASED.backgrounds), ...mk('title', RELEASED.titles),
  ], [])
  const [tab, setTab] = useState<Tab>('avatar')
  const [look, setLook] = useState<Look>(EMPTY_LOOK)
  const [draft, setDraft] = useState<Draft>({ profile_color: null, name_color: null, card_color: null, card_mode: 'suave' })
  const [showEntry, setShowEntry] = useState(0)
  const trying = ([['avatar_decoration', look.avatar_deco], ['name_effect', look.effect], ['profile_card', look.card], ['entry_effect', look.entry], ['background', look.bg], ['title', look.title]] as [CosmeticType, Equip | null][])
    .map(([t, e]) => (e ? items.find((i) => i.type === t && i.slug === e.id) : null)).filter((i): i is CatalogItem => !!i && !i.owned)
  return (
    <ClosetView
      username="ren" userId="demo" links={false} display="Ren Shiraishi" me={{ username: 'ren', name: 'Ren Shiraishi', avatarUrl: PHOTO }}
      info={{ id_student: 'Ren Shiraishi', avatar_url: PHOTO, bio: 'Música, café y noches largas.', grado: '3er año', banner_url: null, created_at: '2026-09-02T10:00:00Z' }}
      draft={draft} onDraft={(p) => setDraft({ ...draft, ...p })} look={look} savedLook={EMPTY_LOOK} items={items} lockedIds={new Set()} balance={2095}
      tab={tab} onTab={setTab}
      onPick={(item, palette, hue = 0) => {
        const pal = palette ?? palettesOf(item.type, item.slug)[0]?.id
        const eq: Equip = { id: item.slug, ...(pal ? { palette: pal } : {}), ...(hue ? { hue } : {}) }
        const s = Object.values(SLOT).find((v) => v.type === item.type)
        if (s) setLook((l) => ({ ...l, [s.key]: eq }))
        if (item.type === 'entry_effect') setShowEntry((n) => n + 1)
      }}
      onClear={(k) => setLook((l) => ({ ...l, [k]: null }))}
      trying={trying} tryLocked={undefined} tryBuy={trying.find((i) => i.price > 0)} busy={false} msg={null} dirty={false}
      onSave={() => {}} onBuy={() => {}} onDiscard={() => {}} onClearTrial={() => setLook(EMPTY_LOOK)} rain={false} onRainDone={() => {}}
      showEntry={showEntry} onReplayEntry={() => setShowEntry((n) => n + 1)}
    />
  )
}
export default function DevClosetPage() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEV_COSMETICOS !== '1') notFound()
  return <Demo />
}
