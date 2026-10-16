'use client'

import Link from 'next/link'
import ResilientImage from './ResilientImage'
import { ClubsIcon, FireIcon } from './icons'
import { CLUB_KIND_LABEL, hexToRgba, type ClubKind } from '../lib/clubs'

type ClubLite = {
  slug: string
  name: string
  kind: ClubKind
  color: string
  avatar_url: string | null
  banner_url: string | null
}

/** Foto de perfil del club (cuadrada con esquinas suaves, distinta al círculo de las personas) */
export function ClubAvatar({ club, size = 'w-12 h-12', textClass = 'text-lg' }: { club: Pick<ClubLite, 'name' | 'avatar_url' | 'color'>; size?: string; textClass?: string }) {
  return (
    <span
      className={`relative ${size} rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-ink-700`}
      style={{ boxShadow: `0 0 0 2px ${hexToRgba(club.color, 0.7)}` }}
    >
      {club.avatar_url ? (
        <ResilientImage
          src={club.avatar_url}
          alt={club.name}
          fill
          sizes="96px"
          className="object-cover"
          fallback={<span className={`absolute inset-0 flex items-center justify-center font-bold ${textClass}`} style={{ color: club.color }}>{club.name.charAt(0).toUpperCase()}</span>}
        />
      ) : (
        <span className={`font-bold ${textClass}`} style={{ color: club.color }}>
          {club.name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

/** Etiqueta «Club» / «Pandilla», bien clara y con colores distintos para cada tipo */
export function KindLabel({ kind, className = '' }: { kind: ClubKind; className?: string }) {
  const Icon = kind === 'pandilla' ? FireIcon : ClubsIcon
  const style =
    kind === 'pandilla'
      ? 'bg-amber-500/15 text-amber-300 border-amber-400/40'
      : 'bg-sky-500/15 text-sky-300 border-sky-400/40'
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-wide ${style} ${className}`}>
      <Icon className="w-3 h-3" />
      {CLUB_KIND_LABEL[kind]}
    </span>
  )
}

/** Tarjeta de un club: foto de perfil, banner en miniatura, nombre y etiqueta Club/Pandilla */
export default function ClubCard({ club, variant = 'row' }: { club: ClubLite; variant?: 'row' | 'tile' }) {
  const banner = (
    <div className="relative h-12 w-full overflow-hidden" style={{ backgroundColor: hexToRgba(club.color, 0.25) }}>
      {club.banner_url && (
        <ResilientImage src={club.banner_url} alt="" fill sizes="320px" className="object-cover" fallback={<span />} />
      )}
    </div>
  )
  return (
    <Link
      href={`/clubes/${club.slug}`}
      className={`group block overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 hover:border-ink-500 hover:bg-ink-700/60 transition ${
        variant === 'tile' ? 'w-44 shrink-0' : ''
      }`}
    >
      {banner}
      <div className="px-3 pb-3 -mt-5 relative">
        <ClubAvatar club={club} size="w-10 h-10" textClass="text-base" />
        <p className="mt-1.5 text-sm font-semibold text-neutral-50 truncate group-hover:text-garnet-300 transition">{club.name}</p>
        <KindLabel kind={club.kind} className="mt-1" />
      </div>
    </Link>
  )
}
