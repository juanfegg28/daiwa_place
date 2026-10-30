'use client'

import Image from 'next/image'
import { isGifUrl } from '../../lib/banner'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { decoOverhang } from '../../components/cosmetics/decoPad'
import Avatar from '../../components/cosmetics/Avatar'
import NameText from '../../components/cosmetics/NameText'
import ProfileActions from '../../components/ProfileActions'
import RoleBadges from '../../components/RoleBadge'
import ClubTags from '../../components/ClubTag'
import { RingOverlay, rememberOrigin } from '../../components/stories/StoryRing'
import type { RingStatus } from '../../lib/stories'
import { ArchiveIcon, EditIcon, PaletteIcon, PlusIcon, SnowflakeIcon, UsersIcon } from '../../components/icons'
import type { ClubMembershipTag } from '../../lib/clubs'
import type { RoleBadgeInfo } from '../../lib/types'
import { useCosmeticFont, type Equip, type NameStyle } from '../../lib/cosmetics'
import { cardTone } from '../../components/cosmetics/kit'

// El kit de diseños solo se descarga si la persona lleva algo de la tienda
const SkinCard = dynamic(() => import('../../components/cosmetics/cosmetics').then((m) => m.SkinCard), { ssr: false })
const TitlePill = dynamic(() => import('../../components/cosmetics/cosmetics').then((m) => m.TitlePill), { ssr: false })
const CollectionBadge = dynamic(() => import('../../components/cosmetics/cosmetics').then((m) => m.CollectionBadge), { ssr: false })

export type HeroProfile = {
  id: string
  username: string
  id_student: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  badge_color: string | null
  is_frozen: boolean
  created_at: string
  name_color?: string | null
}

export type HeroCosmetics = {
  deco: Equip | null
  nameStyle: NameStyle | null
  title: Equip | null
  card: Equip | null
}

export default function ProfileHero({
  profile, cos, isMyProfile, roles, clubTags, ringStatus, userId,
  isFollowing, followsMe, iBlockedThem, onFollowChange, onBlockChange,
  badges, children,
}: {
  profile: HeroProfile
  cos: HeroCosmetics
  isMyProfile: boolean
  roles: RoleBadgeInfo[]
  clubTags: ClubMembershipTag[]
  ringStatus: RingStatus | undefined
  userId: string | null
  isFollowing: boolean
  followsMe: boolean
  iBlockedThem: boolean
  onFollowChange: (f: boolean) => void
  onBlockChange: (b: boolean) => void
  badges: { slug: string; name: string }[]
  /** Bloques del perfil (bio, canción, identidad, chips, contadores): con tarjeta de la tienda van DENTRO de la tarjeta */
  children?: ReactNode
}) {
  const router = useRouter()
  const fontSlug = cos.nameStyle?.font ?? null
  useCosmeticFont(fontSlug)
  const label = profile.id_student || profile.username

  const openStories = (el: HTMLElement) => {
    rememberOrigin(el)
    router.push(`/historias/${profile.username}`)
  }

  // Botones: los míos / seguir y bloquear
  const actions = isMyProfile ? (
    <div className="flex items-center gap-2">
      <Link href="/historias/archivo" aria-label="Archivo de historias" title="Archivo de historias" className="flex items-center justify-center w-9 h-9 border border-ink-600 text-neutral-300 rounded-full hover:bg-ink-800 transition">
        <ArchiveIcon className="w-[18px] h-[18px]" />
      </Link>
      <Link href="/personalizar" aria-label="Personalizar mi perfil" title="Personalizar mi perfil" className="flex items-center justify-center w-9 h-9 border border-ink-600 text-neutral-300 rounded-full hover:bg-ink-800 transition">
        <PaletteIcon className="w-[18px] h-[18px]" />
      </Link>
      <Link href="/editar-perfil" className="flex items-center gap-1.5 whitespace-nowrap text-sm border border-ink-600 text-neutral-300 rounded-full px-4 py-1.5 hover:bg-ink-800 transition">
        <EditIcon className="w-4 h-4" />
        Editar perfil
      </Link>
    </div>
  ) : (
    <ProfileActions
      currentUserId={userId}
      targetUserId={profile.id}
      targetUsername={profile.username}
      isFollowing={isFollowing}
      isBlockedByMe={iBlockedThem}
      onFollowChange={onFollowChange}
      onBlockChange={onBlockChange}
    />
  )

  const frozenChip = profile.is_frozen && (
    <span title="Cuenta congelada" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-ink-800 text-neutral-400 rounded-full px-2 py-0.5">
      <SnowflakeIcon className="w-3 h-3" />
      Congelada
    </span>
  )
  const friendChip = !isMyProfile && isFollowing && followsMe && (
    <span title="Se siguen mutuamente" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-garnet-700/20 text-garnet-300 rounded-full px-2 py-0.5">
      <UsersIcon className="w-3 h-3" />
      Amigos
    </span>
  )
  const badgeRow = badges.length > 0 && (
    <span className="inline-flex items-center gap-1" aria-label="Insignias de colección">
      {badges.map((b) => (
        <CollectionBadge key={b.slug} collection={b.slug} size={22} title={b.name} />
      ))}
    </span>
  )

  // v1.5.10 · espacio bajo el avatar para lo que el marco deja colgando (así ningún marco tapa el nombre ni el @)
  const decoGap = cos.deco ? `max(0px, calc(var(--av) * ${decoOverhang(cos.deco.id).toFixed(3)} - 10px))` : '0px'

  // ───────── DISPOSICIÓN CON TARJETA DE LA TIENDA (v2: superficie fluida) ─────────
  //   banner del usuario (FUERA, arriba)  →  tarjeta que envuelve: avatar · nombre · bio · canción · identidad · chips · contadores
  if (cos.card) {
    const light = cardTone(cos.card.id) === 'light'
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-3">
        <div
          className="relative w-full overflow-hidden bg-gradient-to-r from-garnet-700 via-garnet-600 to-ink-900"
          style={{ aspectRatio: '3 / 1', minHeight: 110, maxHeight: 230, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        >
          {profile.banner_url && <Image src={profile.banner_url} unoptimized={isGifUrl(profile.banner_url)} alt="Banner" fill sizes="(max-width: 768px) 100vw, 672px" priority className="object-cover" />}
        </div>
        <SkinCard card={cos.card} seam="attached">
          <div style={{ ['--av' as string]: 'clamp(92px,16cqw,150px)', marginTop: 'calc(var(--av) / -2)' }} className="flex items-end justify-between gap-3">
            <div className="relative shrink-0 rounded-full" style={{ width: 'var(--av)', height: 'var(--av)', boxShadow: cos.deco ? 'none' : '0 0 0 clamp(3px,.6cqw,6px) var(--sk-base,#0b0b10)' }}>
              <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="w-full h-full" sizes="150px" priority textSize="text-3xl" deco={cos.deco} decoContext="profile">
                <RingOverlay status={ringStatus} uid={profile.id} />
              </Avatar>
              <button
                type="button"
                disabled={!ringStatus?.has_story}
                onClick={(e) => openStories(e.currentTarget)}
                aria-label={ringStatus?.has_story ? `Ver las historias de @${profile.username}` : 'Foto de perfil'}
                className={`absolute inset-0 z-[5] rounded-full ${ringStatus?.has_story ? 'cursor-pointer' : 'cursor-default'}`}
              />
              {isMyProfile && (
                <Link href="/historias/nueva" aria-label="Crear una historia" className="absolute z-[6] bottom-1 right-1 w-7 h-7 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white border-[3px] border-ink-950 flex items-center justify-center">
                  <PlusIcon className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="pb-1.5">{actions}</div>
          </div>

          <div className="mt-3 mb-4" style={{ ['--av' as string]: 'clamp(92px,16cqw,150px)', paddingTop: decoGap }}>
            <h1 className="font-semibold flex items-center gap-2 flex-wrap text-neutral-50" style={{ fontSize: 'clamp(22px,3.5cqw,30px)', lineHeight: 1.1 }}>
              <NameText name={label} color={light ? null : profile.name_color} nameStyle={cos.nameStyle} density="full" />
              <RoleBadges username={profile.username} roles={roles} badgeColorOverride={profile.badge_color} />
              <ClubTags memberships={clubTags} max={4} />
              {frozenChip}
            </h1>
            <p className="text-neutral-500 text-sm flex items-center gap-2 flex-wrap mt-1">
              {'@' + profile.username}
              {friendChip}
            </p>
            {(cos.title || badges.length > 0) && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {cos.title && <TitlePill title={cos.title} />}
                {badgeRow}
              </div>
            )}
          </div>

          {children}
        </SkinCard>
      </div>
    )
  }

  // ───────── DISPOSICIÓN CLÁSICA (igual que antes; ahora con decoración, fuente/efecto, título e insignias) ─────────
  return (
    <>
      <div className="w-full max-h-64 bg-gradient-to-r from-garnet-700 via-garnet-600 to-ink-900 relative" style={{ aspectRatio: '3 / 1' }}>
        {profile.banner_url && <Image src={profile.banner_url} unoptimized={isGifUrl(profile.banner_url)} alt="Banner" fill sizes="(max-width: 768px) 100vw, 1024px" priority className="object-cover" />}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="relative z-10 -mt-14 sm:-mt-16 mb-4 flex justify-between items-end [--av:7rem] sm:[--av:8rem]">
          <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32">
            <Avatar
              username={profile.username}
              avatarUrl={profile.avatar_url}
              size="w-full h-full"
              sizes="128px"
              priority
              textSize="text-3xl"
              photoClassName="border-4 border-ink-950 shadow-[0_0_0_2px] shadow-garnet-500/45"
              deco={cos.deco}
              decoContext="profile"
            >
              <RingOverlay status={ringStatus} uid={profile.id} />
            </Avatar>
            {/* botón transparente encima de la foto: abre las historias */}
            <button
              type="button"
              disabled={!ringStatus?.has_story}
              onClick={(e) => openStories(e.currentTarget)}
              aria-label={ringStatus?.has_story ? `Ver las historias de @${profile.username}` : 'Foto de perfil'}
              className={`absolute inset-0 z-[5] rounded-full ${ringStatus?.has_story ? 'cursor-pointer' : 'cursor-default'}`}
            />
            {isMyProfile && (
              <Link href="/historias/nueva" aria-label="Crear una historia" className="absolute z-[6] bottom-1 right-1 w-7 h-7 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white border-[3px] border-ink-950 flex items-center justify-center">
                <PlusIcon className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <div className="mb-2">{actions}</div>
        </div>

        <div className="mb-4 [--av:7rem] sm:[--av:8rem]" style={{ paddingTop: decoGap }}>
          <h1 className="text-xl font-semibold text-neutral-50 flex items-center gap-2 flex-wrap">
            <NameText name={label} color={profile.name_color} nameStyle={cos.nameStyle} density="full" />
            <RoleBadges username={profile.username} roles={roles} badgeColorOverride={profile.badge_color} />
            <ClubTags memberships={clubTags} max={4} />
            {frozenChip}
          </h1>
          <p className="text-neutral-500 text-sm flex items-center gap-2 flex-wrap">
            {'@' + profile.username}
            {friendChip}
          </p>
          {(cos.title || badges.length > 0) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {cos.title && <TitlePill title={cos.title} />}
              {badgeRow}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

