'use client'

import dynamic from 'next/dynamic'
import { useMemo, type ReactNode } from 'react'
import Avatar from './Avatar'
import NameText from './NameText'
import { useCosmeticFont, type CosmeticType, type Equip } from '../../lib/cosmetics'
import { backgroundOut, decoGeometry, palettesOf } from './kit'
import { PlayCtx, useFitScale, useSeenOnce } from './usePlay'

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

/** Caja que escala su contenido (side × side px) para que quepa en el ancho disponible: las alas, llamas y anillos se ven COMPLETOS. */
function FitBox({ side, children }: { side: number; children: ReactNode }) {
  const [ref, k] = useFitScale(side)
  return (
    <div ref={ref} className="w-full flex justify-center" style={{ height: Math.ceil(side * k) }}>
      <div style={{ width: side, height: side, flex: 'none', transform: `scale(${k})`, transformOrigin: 'top center' }}>{children}</div>
    </div>
  )
}

export type ItemPreviewProps = {
  type: CosmeticType
  slug: string
  palette?: string
  hue?: number
  me: PreviewSubject
  /** slug de fuente (solo para type = font) */
  font?: string
  compact?: boolean
  /** false = en reposo (sin animación). Por defecto se anima (hoja de detalle, estudio). Las cuadrículas pasan el estado del cursor. */
  playing?: boolean
  /** cuadrículas largas: no dibuja la miniatura hasta que se acerca a la pantalla */
  lazy?: boolean
}

/**
 * Cómo se ve un cosmético SOBRE TI (tu foto y tu nombre, no un maniquí).
 * v1.4.5: en cuadrículas se dibuja solo lo cercano a la pantalla (`lazy`) y queda quieto hasta que lo señalas (`playing`).
 */
export default function ItemPreview({ playing = true, lazy = false, ...p }: ItemPreviewProps) {
  const [ref, seen] = useSeenOnce<HTMLDivElement>(lazy)
  return (
    <div ref={ref} className={`w-full h-full ${playing ? '' : 'pv-idle'}`} style={seenFallback(seen)}>
      {seen && (
        <PlayCtx.Provider value={playing}>
          <Preview {...p} playing={playing} />
        </PlayCtx.Provider>
      )}
    </div>
  )
}
const seenFallback = (seen: boolean) => (seen ? undefined : { minHeight: 96 })

function Preview({ type, slug, palette, hue, me, font, compact = false, playing = true }: Omit<ItemPreviewProps, 'lazy'>) {
  const eq: Equip = { id: slug, palette: palette ?? palettesOf(type, slug)[0]?.id, ...(hue ? { hue } : {}) }
  const fam = useCosmeticFont(type === 'font' ? font ?? slug : null)

  if (type === 'avatar_decoration') {
    // La decoración solo se dibuja si el avatar mide al menos su «tamaño mínimo» (las alas piden 80 px) y se sale de la foto
    // (pad): se dibuja el avatar a su tamaño natural y se escala TODO el conjunto para que quepa. Antes se usaba un avatar de 64 px
    // y las alas (mínimo 80) simplemente no salían.
    const g = decoGeometry(slug)
    const avatarPx = Math.max(g?.min ?? 0, 88)
    const extent = Math.max(1.3, (288 + 2 * (g?.pad ?? 0)) / 222)
    const side = Math.ceil(avatarPx * extent)
    return (
      <div className="flex items-center justify-center h-full py-2">
        <FitBox side={side}>
          <div className="w-full h-full flex items-center justify-center">
            <div style={{ width: avatarPx, height: avatarPx }}>
              <Avatar username={me.username} avatarUrl={me.avatarUrl} size="w-full h-full" sizes="128px" textSize="text-2xl" deco={eq} decoContext="profile" />
            </div>
          </div>
        </FitBox>
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
  // «w-full»: dentro de un contenedor flex centrado un hijo sin ancho mide 0 y estas vistas salían EN BLANCO
  if (type === 'background') {
    return (
      <div className="relative w-full h-full min-h-[130px] overflow-hidden rounded-xl">
        <BackgroundThumb item={eq} />
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-ink-950/60 backdrop-blur-sm px-3 py-2 text-[11px] text-neutral-200">Tu publicación se vería así</div>
      </div>
    )
  }
  if (type === 'entry_effect') {
    return (
      <div className="relative w-full h-full min-h-[130px] overflow-hidden rounded-xl bg-ink-950">
        <EntryEffect effect={eq} loop={playing} still={!playing} className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-3 text-center text-[11px] text-neutral-400">{playing ? 'Así cae sobre tu perfil' : 'Señálalo o tócalo para animar'}</div>
      </div>
    )
  }
  // profile_card: la tarjeta v2 (superficie fluida) suelta, con un perfil de muestra con TU foto y TU nombre
  return (
    <div className="flex justify-center w-full py-3 px-2">
      <SkinThumb card={eq} name={me.name} photoUrl={me.avatarUrl} width={compact ? 170 : 250} anim={playing} />
    </div>
  )
}
