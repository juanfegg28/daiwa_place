'use client'

import dynamic from 'next/dynamic'
import ProfileHero from './ProfileHero'
import ProfileCard from '../../components/cosmetics/ProfileCard'
import IdentitySeal from '../../components/IdentitySeal'
import { profileThemeVars } from '../../lib/color'
import HighlightsRow from '../../components/stories/HighlightsRow'
import { useRingStatus } from '../../components/stories/StoryRing'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../components/AppShell'
import PostCard from '../../components/PostCard'
import { GraduationCapIcon, CalendarIcon, HeartIcon, BlockIcon } from '../../components/icons'
import type { ClubMembershipTag } from '../../lib/clubs'
import MusicChip from '../../components/MusicChip'
import { normalizeTrack } from '../../lib/music'
import { PROFILE_POST_SELECT, attachCosmetics, fetchFeedItems } from '../../lib/queries'
import { formatIdentityDetail, identityField, isCommonIdentity } from '../../lib/identities'
import { SparklesIcon } from '../../components/icons'
import type { AuthorProfile, FeedItem, Post, RoleBadgeInfo } from '../../lib/types'
import {
  COSMETIC_PROFILE_COLS, COSMETIC_MINI_COLS, normalizeEquip, normalizeNameStyle, profileBadges,
  type Equip,
} from '../../lib/cosmetics'

// El kit de diseños solo se descarga si la persona lleva fondo o efecto de entrada
const ProfileBackground = dynamic(() => import('../../components/cosmetics/cosmetics').then((m) => m.ProfileBackground), { ssr: false })
const EntryEffect = dynamic(() => import('../../components/cosmetics/cosmetics').then((m) => m.EntryEffect), { ssr: false })

type Profile = {
  id: string
  username: string
  id_student: string | null
  bio: string | null
  music?: unknown
  avatar_url: string | null
  banner_url: string | null
  birthday: string | null
  grado: string | null
  estado_personal: string | null
  badge_color: string | null
  is_frozen: boolean
  posts_visibility: 'public' | 'followers'
  pinned_post_id?: string | null
  created_at: string
  // v1.3.0: personalización gratis
  profile_color?: string | null
  name_color?: string | null
  card_color?: string | null
  card_mode?: string | null
  // v1.4.0: lo que lleva puesto de la tienda (columnas que solo escribe cosmetic_save_look)
  avatar_deco?: unknown
  name_style?: unknown
  title_style?: unknown
  card_style?: unknown
  entry_effect?: unknown
  profile_bg?: unknown
}

/** Efecto de entrada: una vez por visita (≈4 s), no tapa ni bloquea nada. Los visitantes pueden repetirlo. */
function EntryOverlay({ effect, allowReplay }: { effect: Equip; allowReplay: boolean }) {
  const [run, setRun] = useState(1)
  const [fading, setFading] = useState(false)
  const [on, setOn] = useState(true)
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 3800)
    const t2 = setTimeout(() => setOn(false), 4500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [run])
  return (
    <>
      {on && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[44vh] max-h-[420px] overflow-hidden transition-opacity duration-700" style={{ opacity: fading ? 0 : 1 }}>
          <EntryEffect key={run} effect={effect} loop={false} className="w-full h-full" />
        </div>
      )}
      {allowReplay && !on && (
        <button type="button" onClick={() => { setOn(true); setFading(false); setRun((n) => n + 1) }} className="absolute right-3 top-3 z-20 rounded-full border border-ink-600 bg-ink-900/80 backdrop-blur px-3 py-1 text-xs text-neutral-300 hover:bg-ink-800 transition">
          ↻ Repetir efecto
        </button>
      )}
    </>
  )
}

// Lista clásica (sin compartidos): solo se usa si todavía no se corrió el SQL de la v1.1.10
async function loadLegacyProfilePosts(profileId: string, limit: number) {
  const { data, error } = await supabase
    .from('posts')
    .select(PROFILE_POST_SELECT)
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)
  return { posts: (data as unknown as Post[]) ?? [], error: error?.message ?? '' }
}

export default function ProfilePageClient() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  )
}

function ProfileContent() {
  const params = useParams()
  const router = useRouter()
  const usernameParam = (params?.username as string) ?? ''
  const { userId, username: myUsername } = useAppSession()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<FeedItem[]>([])
  const [hasMoreItems, setHasMoreItems] = useState(false)
  const [identity, setIdentity] = useState<{ identity: string | null; detail: string | null }>({ identity: null, detail: null })
  const [pinnedPost, setPinnedPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [roles, setRoles] = useState<RoleBadgeInfo[]>([])
  const [clubTags, setClubTags] = useState<ClubMembershipTag[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const ringStatus = useRingStatus(profile?.id)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followsMe, setFollowsMe] = useState(false)
  const [iBlockedThem, setIBlockedThem] = useState(false)
  const [theyBlockedMe, setTheyBlockedMe] = useState(false)

  // Se cargan de 15 en 15 ("Ver más"); el total sale aparte para que el contador del perfil sea el real
  const postsLimit = useRef(15)
  const [postsTotal, setPostsTotal] = useState(0)
  const [badges, setBadges] = useState<{ slug: string; name: string }[]>([])
  const [loadingMorePosts, setLoadingMorePosts] = useState(false)

  // `pinned` = id de la publicación fijada del perfil (por defecto, la que ya tiene cargada el perfil)
  const loadPosts = async (profileId: string, pinned: string | null) => {
    // Publicaciones + compartidos de esta persona, mezclados del más nuevo al más viejo (feed_items).
    // Si falta el SQL de la v1.1.10, se usa la lista de siempre (sin compartidos).
    const [feed, { count }, { data: pinnedData }] = await Promise.all([
      fetchFeedItems('profile', postsLimit.current, profileId, (l) => loadLegacyProfilePosts(profileId, l)),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profileId),
      pinned
        ? supabase.from('posts').select(PROFILE_POST_SELECT).eq('id', pinned).eq('user_id', profileId).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    const pinnedPostRow = (pinnedData as unknown as Post | null) ?? null
    if (pinnedPostRow) await attachCosmetics([pinnedPostRow])
    setPinnedPost(pinnedPostRow)
    // la fijada va aparte, arriba de todo, así que no se repite en la lista
    setItems(feed.items.filter((it) => !(it.repostedBy === null && it.post.id === pinnedPostRow?.id)))
    setHasMoreItems(feed.hasMore)
    setPostsTotal(count ?? 0)
  }

  // Fijar / desfijar una de mis publicaciones (solo en mi propio perfil)
  const handleTogglePin = async (post: Post, pin: boolean): Promise<string | null> => {
    if (!profile) return 'No se pudo cambiar la publicación fijada'
    const { error } = pin ? await supabase.rpc('pin_post', { p_post: post.id }) : await supabase.rpc('unpin_post')
    if (error) return 'No se pudo cambiar la publicación fijada: ' + error.message
    const newPinned = pin ? post.id : null
    setProfile((prev) => (prev ? { ...prev, pinned_post_id: newPinned } : prev))
    await loadPosts(profile.id, newPinned)
    return null
  }

  const loadMorePosts = async () => {
    if (!profile) return
    setLoadingMorePosts(true)
    postsLimit.current += 15
    await loadPosts(profile.id, profile.pinned_post_id ?? null)
    setLoadingMorePosts(false)
  }

  const loadFollowState = async (profileId: string) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
    ])
    setFollowersCount(followers ?? 0)
    setFollowingCount(following ?? 0)

    if (userId && userId !== profileId) {
      const [{ data: followRow }, { data: followsMeRow }, { data: blockRows }] = await Promise.all([
        supabase.from('follows').select('follower_id').eq('follower_id', userId).eq('following_id', profileId).maybeSingle(),
        supabase.from('follows').select('follower_id').eq('follower_id', profileId).eq('following_id', userId).maybeSingle(),
        supabase
          .from('blocks')
          .select('blocker_id, blocked_id')
          .or(
            `and(blocker_id.eq.${userId},blocked_id.eq.${profileId}),and(blocker_id.eq.${profileId},blocked_id.eq.${userId})`
          ),
      ])
      setIsFollowing(!!followRow)
      setFollowsMe(!!followsMeRow)
      setIBlockedThem(!!blockRows?.some((b) => b.blocker_id === userId))
      setTheyBlockedMe(!!blockRows?.some((b) => b.blocker_id === profileId))
    } else {
      setIsFollowing(false)
      setFollowsMe(false)
      setIBlockedThem(false)
      setTheyBlockedMe(false)
    }
  }

  const loadEverything = async () => {
    setLoading(true)
    setNotFound(false)

    // v1.4.0: las columnas de la tienda se piden junto con el perfil; si todavía no se corrió el SQL de la 1.4.0, se reintenta sin ellas
    const BASE_COLS = 'id, username, id_student, bio, music, avatar_url, banner_url, birthday, grado, estado_personal, badge_color, is_frozen, posts_visibility, pinned_post_id, created_at, profile_color, name_color, card_color, card_mode'
    const COS_COLS = `${COSMETIC_MINI_COLS}, ${COSMETIC_PROFILE_COLS}`
    let res = await supabase.from('profiles').select(`${BASE_COLS}, ${COS_COLS}`).eq('username', usernameParam.toLowerCase()).maybeSingle()
    if (res.error) res = await supabase.from('profiles').select(BASE_COLS).eq('username', usernameParam.toLowerCase()).maybeSingle()
    const profileData = res.data as unknown as Profile | null
    const profileError = res.error

    if (profileError || !profileData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile(profileData)
    const loadRoles = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('roles(name, badge_color)')
        .eq('user_id', profileData.id)
      setRoles((data as unknown as RoleBadgeInfo[]) ?? [])
    }
    // Etiquetas de club/pandilla: se piden aparte, así el perfil carga igual aunque falte el SQL de la v1.1.0
    const loadClubTags = async () => {
      const { data } = await supabase
        .from('club_members')
        .select('joined_at, clubs!club_members_club_id_fkey(slug, name, kind, color), club_roles!club_members_role_id_fkey(name, color, is_leader)')
        .eq('user_id', profileData.id)
        .order('joined_at')
      setClubTags((data as unknown as ClubMembershipTag[]) ?? [])
    }
    // Identidad: se pide aparte, así el perfil carga igual aunque falte el SQL de la v1.1.10
    const loadIdentity = async () => {
      const { data } = await supabase.rpc('profile_identity', { p_user: profileData.id })
      const row = (Array.isArray(data) ? data[0] : data) as { identity: string | null; identity_detail: string | null } | null
      setIdentity({ identity: row?.identity ?? null, detail: row?.identity_detail ?? null })
    }
    // v1.4.0: insignias de colección (trofeos públicos)
    const loadCosmeticExtras = async () => {
      const { data } = await profileBadges(profileData.id)
      setBadges(Array.isArray(data) ? data : [])
    }
    // v1.3.0: cuenta como «visita» para las misiones (la base de datos ignora las propias y limita el total)
    if (userId && userId !== profileData.id) supabase.rpc('track_profile_visit', { p_user: profileData.id }).then(() => {})
    postsLimit.current = 15
    await Promise.all([loadPosts(profileData.id, profileData.pinned_post_id ?? null), loadFollowState(profileData.id), loadRoles(), loadClubTags(), loadIdentity(), loadCosmeticExtras()])
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      loadEverything()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameParam])

  // Vuelve a calcular follow/bloqueo cuando la sesión termina de cargar (userId cambia de null a un id)
  useEffect(() => {
    function run() {
      if (profile) loadFollowState(profile.id)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleLike = async (post: Post) => {
    if (!userId) {
      router.push('/login')
      return
    }
    const alreadyLiked = post.likes.some((l) => l.user_id === userId)
    if (alreadyLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', userId)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: userId })
    }
    if (profile) loadPosts(profile.id, profile.pinned_post_id ?? null)
  }

  const handleLikeComment = async (commentId: string, alreadyLiked: boolean) => {
    if (!userId) {
      router.push('/login')
      return
    }
    if (alreadyLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
    }
    if (profile) loadPosts(profile.id, profile.pinned_post_id ?? null)
  }

  const handleAddComment = async (postId: string, text: string, parentCommentId?: string | null) => {
    if (!userId) {
      router.push('/login')
      return
    }
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: text,
      parent_comment_id: parentCommentId ?? null,
    })
    if (profile) loadPosts(profile.id, profile.pinned_post_id ?? null)
  }

  const formatJoinDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  const formatBirthday = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando perfil...</p>
      </div>
    )
  }

  // La publicación fijada va primero
  const shownPosts: FeedItem[] = [
    ...(pinnedPost ? [{ key: `pinned:${pinnedPost.id}`, post: pinnedPost, repostedBy: null, sortAt: pinnedPost.created_at }] : []),
    ...items,
  ]

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Este perfil no existe</p>
          <Link href="/" className="text-garnet-400 underline text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  // Las publicaciones del perfil no traen al autor embebido (ya lo conocemos),
  // así que se lo ponemos aquí para que se vean igual que en el feed: foto,
  // nombre de personaje, @usuario y la insignia (la corona, solo con el ícono).
  const postAuthor: AuthorProfile = {
    username: profile.username,
    avatar_url: profile.avatar_url,
    id_student: profile.id_student,
    name_color: profile.name_color,
    avatar_deco: normalizeEquip(profile.avatar_deco),
    name_style: normalizeNameStyle(profile.name_style),
    is_frozen: profile.is_frozen,
    badge_color: profile.badge_color,
    user_roles: roles,
    club_members: clubTags,
  }

  const isMyProfile = myUsername === profile.username
  const isBlockedEitherWay = iBlockedThem || theyBlockedMe
  const isPrivateForMe =
    !isMyProfile && !isBlockedEitherWay && profile.posts_visibility === 'followers' && !isFollowing

  const themeVars = profileThemeVars(profile.profile_color)
  // Lo de la tienda, validado (nunca se confía en el JSON tal cual) y SOLO si se puede ver el contenido de este perfil
  const cos = {
    deco: normalizeEquip(profile.avatar_deco),
    nameStyle: normalizeNameStyle(profile.name_style),
    title: normalizeEquip(profile.title_style),
    card: normalizeEquip(profile.card_style),
    entry: normalizeEquip(profile.entry_effect),
    bg: normalizeEquip(profile.profile_bg),
  }
  const canSeeCosmetics = !isBlockedEitherWay
  const heroCos = { deco: cos.deco, nameStyle: cos.nameStyle, title: cos.title, card: canSeeCosmetics ? cos.card : null }
  const cardMode = !!heroCos.card


  // Bloques del perfil: sin tarjeta de la tienda van en la tarjeta de color de siempre; con tarjeta, DENTRO de ella
  const profileBlocks = (
    <>
          {/* Biografía y canción: dentro de una caja con los tokens de la tarjeta (sin tarjeta no cambia nada) */}
          {(profile.bio || !!normalizeTrack(profile.music)) && (
            <div className="pf-box">
              {profile.bio && <p className="text-sm text-neutral-200 mb-3 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>}
              {!!normalizeTrack(profile.music) && (
                <div className="mb-3">
                  <MusicChip track={profile.music} variant="card" />
                </div>
              )}
            </div>
          )}

          {/* Identidad ESPECIAL: tarjeta con su sello animado y su campo especial */}
          {identity.identity && !isCommonIdentity(identity.identity) && (
            <div className="pf-id relative overflow-hidden mb-3 rounded-2xl border border-garnet-500/30 bg-gradient-to-br from-garnet-600/15 via-garnet-600/5 to-transparent px-4 py-3">
              <IdentitySeal identity={identity.identity} className="absolute right-1 top-1 w-[72px] h-[50px] text-garnet-300 opacity-90" />
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-garnet-300">
                <SparklesIcon className="w-3.5 h-3.5" />
                Identidad
              </p>
              <p className="text-lg font-display font-semibold text-neutral-50 leading-tight mt-0.5">{identity.identity}</p>
              {identity.detail && identityField(identity.identity) && (
                <p className="text-sm text-neutral-300 mt-1.5">
                  <span className="text-neutral-500">{identityField(identity.identity)?.label}: </span>
                  <span className="font-medium text-neutral-100">{formatIdentityDetail(identity.identity, identity.detail)}</span>
                </p>
              )}
            </div>
          )}

          {/* Chips: identidad común (solo el nombre), grado, cumpleaños y estado */}
          {((identity.identity && isCommonIdentity(identity.identity)) || profile.grado || profile.birthday || profile.estado_personal) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {identity.identity && isCommonIdentity(identity.identity) && (
                <span className="pf-chip inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  {identity.identity}
                </span>
              )}
              {profile.grado && (
                <span className="pf-chip inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  <GraduationCapIcon className="w-3.5 h-3.5 text-garnet-400" />
                  {profile.grado}
                </span>
              )}
              {profile.birthday && (
                <span className="pf-chip inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  <CalendarIcon className="w-3.5 h-3.5 text-garnet-400" />
                  {formatBirthday(profile.birthday)}
                </span>
              )}
              {profile.estado_personal && (
                <span className="pf-chip inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  <HeartIcon className="w-3.5 h-3.5 text-garnet-400" />
                  {profile.estado_personal}
                </span>
              )}
            </div>
          )}

          <p className="text-xs text-neutral-600 mb-4">Se unió en {formatJoinDate(profile.created_at)}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm [&>*]:whitespace-nowrap">
            <span>
              <b className="text-neutral-100">{postsTotal}</b>{' '}
              <span className="text-neutral-500">publicaciones</span>
            </span>
            <Link href={`/perfil/${profile.username}/seguidores`} className="hover:text-garnet-400 transition">
              <b className="text-neutral-100">{followersCount}</b>{' '}
              <span className="text-neutral-500">seguidores</span>
            </Link>
            <Link href={`/perfil/${profile.username}/seguidores?tab=siguiendo`} className="hover:text-garnet-400 transition">
              <b className="text-neutral-100">{followingCount}</b>{' '}
              <span className="text-neutral-500">seguidos</span>
            </Link>
          </div>
    </>
  )

  return (
    <div className={`relative isolate pb-10 ${themeVars ? 'profile-theme' : ''}`} style={themeVars}>
      {/* Fondo prediseñado de la tienda (detrás de todo; con velo oscuro para que las publicaciones se lean) */}
      {canSeeCosmetics && cos.bg && <ProfileBackground background={cos.bg} />}
      {/* Efecto de entrada: una vez por visita, encima del tercio superior, sin bloquear toques */}
      {canSeeCosmetics && cos.entry && <EntryOverlay key={profile.id} effect={cos.entry} allowReplay={!isMyProfile} />}

      <div className="relative z-10">
        <ProfileHero
          profile={profile}
          cos={heroCos}
          isMyProfile={isMyProfile}
          roles={roles}
          clubTags={clubTags}
          ringStatus={ringStatus}
          userId={userId}
          isFollowing={isFollowing}
          followsMe={followsMe}
          iBlockedThem={iBlockedThem}
          onFollowChange={(f) => {
            setIsFollowing(f)
            setFollowersCount((c) => Math.max(0, c + (f ? 1 : -1)))
          }}
          onBlockChange={(b) => setIBlockedThem(b)}
          badges={canSeeCosmetics ? badges : []}
        >
          {cardMode && !isBlockedEitherWay ? profileBlocks : null}
        </ProfileHero>

      <div className={`max-w-2xl mx-auto px-4 sm:px-6 ${cardMode ? 'mt-4' : ''}`}>
        {isBlockedEitherWay ? (
          <div className="surface-card rounded-2xl p-6 text-center my-6">
            <BlockIcon className="w-6 h-6 mx-auto mb-2 text-neutral-500" />
            {iBlockedThem ? (
              <>
                <p className="text-neutral-200 text-sm font-medium mb-1">Bloqueaste a @{profile.username}</p>
                <p className="text-neutral-500 text-xs">
                  No pueden interactuar mientras dure el bloqueo. Puedes desbloquear desde el botón de arriba o
                  desde Configuración → Cuentas bloqueadas.
                </p>
              </>
            ) : (
              <>
                <p className="text-neutral-200 text-sm font-medium mb-1">Este perfil no está disponible</p>
                <p className="text-neutral-500 text-xs">No puedes ver sus publicaciones ni interactuar por ahora.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {!cardMode && (
              <ProfileCard color={profile.card_color} mode={profile.card_mode} solid={!!cos.bg}>
                {profileBlocks}
              </ProfileCard>
            )}

            {/* Destacadas (v1.2.0) */}
            <HighlightsRow profileId={profile.id} username={profile.username} isOwn={isMyProfile} />

            <div className="space-y-4 mt-4">
              {items.length === 0 && !pinnedPost ? (
                <p className="text-neutral-500 text-sm text-center py-10">
                  {isMyProfile
                    ? 'Todavía no has publicado nada.'
                    : isPrivateForMe
                      ? `Este perfil es solo para seguidores. Sigue a @${profile.username} para ver sus publicaciones.`
                      : 'Todavía no hay publicaciones.'}
                </p>
              ) : (
                shownPosts.map(({ key, post, repostedBy }) => (
                  <PostCard
                    key={key}
                    repostedBy={repostedBy}
                    authorVisibility={post.user_id === profile.id ? profile.posts_visibility ?? null : null}
                    post={{ ...post, profiles: post.user_id === profile.id ? postAuthor : post.profiles }}
                    currentUserId={userId}
                    showAuthor
                    onProfilePage
                    authorIsFrozen={profile.is_frozen}
                    pinned={!repostedBy && post.id === pinnedPost?.id}
                    onTogglePin={isMyProfile ? handleTogglePin : undefined}
                    onToggleLike={handleLike}
                    onToggleCommentLike={handleLikeComment}
                    onAddComment={handleAddComment}
                    // loadPosts solo se ejecuta al tocar (no durante el render), el aviso del lint es un falso positivo
                    // eslint-disable-next-line react-hooks/refs
                    onRefresh={() => loadPosts(profile.id, pinnedPost?.id ?? null)}
                    onPostDeleted={async () => {
                      // si borra la fijada, el perfil queda sin fijada (la base de datos ya la suelta sola)
                      const stillPinned = post.id === pinnedPost?.id ? null : (profile.pinned_post_id ?? null)
                      if (post.id === pinnedPost?.id) setProfile((prev) => (prev ? { ...prev, pinned_post_id: null } : prev))
                      await loadPosts(profile.id, stillPinned)
                    }}
                  />
                ))
              )}
            </div>

            {hasMoreItems && (
              <div className="flex justify-center mt-5">
                <button
                  type="button"
                  onClick={loadMorePosts}
                  disabled={loadingMorePosts}
                  className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition disabled:opacity-60"
                >
                  {loadingMorePosts ? 'Cargando...' : 'Ver más publicaciones'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  )
}
