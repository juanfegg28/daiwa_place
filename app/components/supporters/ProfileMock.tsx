'use client'

// v1.9.0 · Maniquí de perfil con TU foto y TU nombre para probar combinaciones de cosméticos del Círculo Lunar
// (decoración + tarjeta + efecto de nombre + título + efecto de entrada). No guarda nada: es solo vista previa.
import dynamic from 'next/dynamic'
import Avatar from '../cosmetics/Avatar'
import type { Equip } from '../../lib/cosmetics'

const SkinCard = dynamic(() => import('../cosmetics/cosmetics').then((m) => m.SkinCard), { ssr: false })
const NameFx = dynamic(() => import('../cosmetics/cosmetics').then((m) => m.NameFx), { ssr: false })
const TitlePill = dynamic(() => import('../cosmetics/cosmetics').then((m) => m.TitlePill), { ssr: false })
const EntryEffect = dynamic(() => import('../cosmetics/cosmetics').then((m) => m.EntryEffect), { ssr: false })

export type Combo = { deco: Equip | null; card: Equip | null; name: Equip | null; title: Equip | null; entry: Equip | null }
export const EMPTY_COMBO: Combo = { deco: null, card: null, name: null, title: null, entry: null }
export type MockMe = { username: string; name: string; avatarUrl: string | null }

export default function ProfileMock({ me, combo, entryKey }: { me: MockMe; combo: Combo; entryKey: number }) {
  const body = (
    <div className="px-4 pb-4 pt-0">
      <div className="-mt-10 mb-2">
        <Avatar username={me.username} avatarUrl={me.avatarUrl} size="w-20 h-20" textSize="text-2xl" deco={combo.deco} decoContext="profile" sizes="96px" className="ring-4 ring-ink-900 rounded-full" />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {combo.name ? <NameFx effect={combo.name} text={me.name} className="text-lg font-bold" /> : <span className="text-lg font-bold text-neutral-50">{me.name}</span>}
        {combo.title && <TitlePill title={combo.title} />}
      </div>
      <p className="text-xs text-neutral-500">@{me.username}</p>
      <p className="mt-2 text-sm text-neutral-300">Así se vería tu perfil con estos estilos. Cambia las piezas tocando las de abajo.</p>
    </div>
  )
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
      <div className="h-20 bg-gradient-to-br from-violet-900/50 via-ink-800 to-ink-900" aria-hidden />
      {combo.card ? (
        <SkinCard card={combo.card} seam="float">
          {body}
        </SkinCard>
      ) : (
        <div className="bg-ink-800/70">{body}</div>
      )}
      {combo.entry && <EntryEffect key={entryKey} effect={combo.entry} className="pointer-events-none absolute inset-0 z-10" />}
    </div>
  )
}
