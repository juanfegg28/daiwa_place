'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import Avatar from './Avatar'
import NameText from './NameText'
import { useCosmeticFont, type CosmeticType, type Equip } from '../../lib/cosmetics'
import { backgroundOut, palettesOf } from './kit'

const NameFx = dynamic(() => import('./cosmetics').then((m) => m.NameFx), { ssr: false })
const TitlePill = dynamic(() => import('./cosmetics').then((m) => m.TitlePill), { ssr: false })
const CollectionBadge = dynamic(() => import('./cosmetics').then((m) => m.CollectionBadge), { ssr: false })
const SkinThumb = dynamic(() => import('./cosmetics').then((m) => m.SkinThumb), { ssr: false })
const EntryEffect = dynamic(() => import('./cosmetics').then((m) => m.EntryEffect), { ssr: false })

export type PreviewSubject = { username: string; name: string; avatarUrl: string | null; bio?: string | null; bannerUrl?: string | null }

/** Fondo en miniatura (sin velo ni sticky): se ve el arte tal cual */
function BackgroundThumb({ item }: { item: Equip }) {
  const html = useMemo(() => backgroundOut(item.id, { palette: item.palette, hue: item.hue ?? 0 }), [item.id, item.palette, item.hue])
  return <div className="dpw absolute inset-0" data-live="1" data-static="0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * Cómo se ve un cosmético SOBRE TI (tu foto y tu nombre, no un maniquí).
 * `current` = lo que llevas puesto hoy, para mostrar el cosmético probado junto al resto de tu look.
 */
export default function ItemPreview({
  type, slug, palette, hue, me, font, compact = false,
}: {
  type: CosmeticType
  slug: string
  palette?: string
  hue?: number
  me: PreviewSubject
  /** slug de fuente (solo para type = font) */
  font?: string
  compact?: boolean
}) {
  const eq: Equip = { id: slug, palette: palette ?? palettesOf(type, slug)[0]?.id, ...(hue ? { hue } : {}) }
  const fam = useCosmeticFont(type === 'font' ? font ?? slug : null)

  if (type === 'avatar_decoration') {
    return (
      <div className="flex items-center justify-center h-full py-3">
        <Avatar username={me.username} avatarUrl={me.avatarUrl} size={compact ? 'w-16 h-16' : 'w-24 h-24'} sizes="128px" textSize="text-2xl" deco={eq} decoContext="profile" />
      </div>
    )
  }
  if (type === 'name_effect') {
    return (
      <div className="flex items-center justify-center h-full px-3 py-5 text-center">
        <NameFx effect={eq} text={me.name} density="full" className="font-display text-xl font-semibold" />
      </div>
    )
  }
  if (type === 'font') {
    return (
      <div className="flex items-center justify-center h-full px-3 py-5 text-center">
        <span className="text-2xl text-neutral-50 leading-tight break-words" style={fam ? { fontFamily: fam } : undefined}>{me.name}</span>
      </div>
    )
  }
  if (type === 'title') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
        <NameText name={me.name} className="text-base font-semibold text-neutral-50" />
        <TitlePill title={eq} />
      </div>
    )
  }
  if (type === 'badge') {
    return (
      <div className="flex items-center justify-center h-full py-4">
        <CollectionBadge collection={slug} size={compact ? 44 : 60} />
      </div>
    )
  }
  if (type === 'background') {
    return (
      <div className="relative h-full min-h-[130px] overflow-hidden rounded-xl">
        <BackgroundThumb item={eq} />
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-ink-950/60 backdrop-blur-sm px-3 py-2 text-[11px] text-neutral-200">Tu publicación se vería así</div>
      </div>
    )
  }
  if (type === 'entry_effect') {
    return (
      <div className="relative h-full min-h-[130px] overflow-hidden rounded-xl bg-ink-950">
        <EntryEffect effect={eq} loop className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-3 text-center text-[11px] text-neutral-400">Así cae sobre tu perfil</div>
      </div>
    )
  }
  // profile_card: la tarjeta v2 (superficie fluida) suelta, con un perfil de muestra con TU foto y TU nombre
  return (
    <div className="flex justify-center py-3 px-2">
      <SkinThumb card={eq} name={me.name} photoUrl={me.avatarUrl} width={compact ? 170 : 250} />
    </div>
  )
}
