'use client'

import Image from 'next/image'
import AvatarPhoto from '../../components/AvatarPhoto'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../components/AppShell'
import PostCard from '../../components/PostCard'
import ProfileActions from '../../components/ProfileActions'
import {
  EditIcon,
  GraduationCapIcon,
  CalendarIcon,
  HeartIcon,
  SnowflakeIcon,
  BlockIcon,
  UsersIcon,
} from '../../components/icons'
import RoleBadges from '../../components/RoleBadge'
import ClubTags from '../../components/ClubTag'
import type { ClubMembershipTag } from '../../lib/clubs'
import MusicChip from '../../components/MusicChip'
import { normalizeTrack } from '../../lib/music'
import { PROFILE_POST_SELECT, fetchFeedItems } from '../../lib/queries'
import { formatIdentityDetail, identityField } from '../../lib/identities'
import { SparklesIcon } from '../../components/icons'
import type { AuthorProfile, FeedItem, Post, RoleBadgeInfo } from '../../lib/types'

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
  const [isFollowing, setIsFollowing] = useState(false)
  const [followsMe, setFollowsMe] = useState(false)
  const [iBlockedThem, setIBlockedThem] = useState(false)
  const [theyBlockedMe, setTheyBlockedMe] = useState(false)

  // Se cargan de 15 en 15 ("Ver más"); el total sale aparte para que el contador del perfil sea el real
  const postsLimit = useRef(15)
  const [postsTotal, setPostsTotal] = useState(0)
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

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, username, id_student, bio, music, avatar_url, banner_url, birthday, grado, estado_personal, badge_color, is_frozen, posts_visibility, pinned_post_id, created_at'
      )
      .eq('username', usernameParam.toLowerCase())
      .maybeSingle()

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
      const { data } = await supabase.from('profiles').select('identity, identity_detail').eq('id', profileData.id).maybeSingle()
      const row = data as { identity: string | null; identity_detail: string | null } | null
      setIdentity({ identity: row?.identity ?? null, detail: row?.identity_detail ?? null })
    }
    postsLimit.current = 15
    await Promise.all([loadPosts(profileData.id, profileData.pinned_post_id ?? null), loadFollowState(profileData.id), loadRoles(), loadClubTags(), loadIdentity()])
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
    is_frozen: profile.is_frozen,
    badge_color: profile.badge_color,
    user_roles: roles,
    club_members: clubTags,
  }

  const isMyProfile = myUsername === profile.username
  const isBlockedEitherWay = iBlockedThem || theyBlockedMe
  const isPrivateForMe =
    !isMyProfile && !isBlockedEitherWay && profile.posts_visibility === 'followers' && !isFollowing

  return (
    <div className="pb-10">
      <div
        className="w-full max-h-64 bg-gradient-to-r from-garnet-700 via-garnet-600 to-ink-900 relative"
        style={{ aspectRatio: '3 / 1' }}
      >
        {profile.banner_url && (
          <Image src={profile.banner_url} alt="Banner" fill sizes="(max-width: 768px) 100vw, 1024px" priority className="object-cover" />
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="relative z-10 -mt-14 sm:-mt-16 mb-4 flex justify-between items-end">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-ink-950 bg-ink-700 overflow-hidden flex items-center justify-center shadow-[0_0_0_2px] shadow-garnet-500/45">
            {profile.avatar_url ? (
              <AvatarPhoto src={profile.avatar_url} username={profile.username} sizes="128px" priority textClass="text-3xl" />
            ) : (
              <span className="text-3xl font-semibold text-garnet-400">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {isMyProfile ? (
            <Link
              href="/editar-perfil"
              className="mb-2 flex items-center gap-1.5 text-sm border border-ink-600 text-neutral-300 rounded-full px-4 py-1.5 hover:bg-ink-800 transition"
            >
              <EditIcon className="w-4 h-4" />
              Editar perfil
            </Link>
          ) : (
            <div className="mb-2">
              <ProfileActions
                currentUserId={userId}
                targetUserId={profile.id}
                targetUsername={profile.username}
                isFollowing={isFollowing}
                isBlockedByMe={iBlockedThem}
                onFollowChange={(f) => {
                  setIsFollowing(f)
                  setFollowersCount((c) => Math.max(0, c + (f ? 1 : -1)))
                }}
                onBlockChange={(b) => setIBlockedThem(b)}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <h1 className="text-xl font-semibold text-neutral-50 flex items-center gap-2 flex-wrap">
            {profile.id_student || profile.username}
            <RoleBadges username={profile.username} roles={roles} badgeColorOverride={profile.badge_color} />
            <ClubTags memberships={clubTags} max={4} />
            {profile.is_frozen && (
              <span
                title="Cuenta congelada"
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-ink-800 text-neutral-400 rounded-full px-2 py-0.5"
              >
                <SnowflakeIcon className="w-3 h-3" />
                Congelada
              </span>
            )}
          </h1>
          <p className="text-neutral-500 text-sm flex items-center gap-2 flex-wrap">
            {'@' + profile.username}
            {!isMyProfile && isFollowing && followsMe && (
              <span
                title="Se siguen mutuamente"
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-garnet-700/20 text-garnet-300 rounded-full px-2 py-0.5"
              >
                <UsersIcon className="w-3 h-3" />
                Amigos
              </span>
            )}
          </p>
        </div>

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
            {profile.bio && (
              <p className="text-sm text-neutral-200 mb-3 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            )}
            {!!normalizeTrack(profile.music) && (
              <div className="mb-3">
                <MusicChip track={profile.music} variant="card" />
              </div>
            )}

            {/* Identidad + su campo especial: bien visible en la cabecera */}
            {identity.identity && (
              <div className="mb-3 rounded-2xl border border-garnet-500/30 bg-gradient-to-br from-garnet-600/15 via-garnet-600/5 to-transparent px-4 py-3">
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

            {(profile.grado || profile.birthday || profile.estado_personal) && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {profile.grado && (
                  <span className="inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    <GraduationCapIcon className="w-3.5 h-3.5 text-garnet-400" />
                    {profile.grado}
                  </span>
                )}
                {profile.birthday && (
                  <span className="inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    <CalendarIcon className="w-3.5 h-3.5 text-garnet-400" />
                    {formatBirthday(profile.birthday)}
                  </span>
                )}
                {profile.estado_personal && (
                  <span className="inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    <HeartIcon className="w-3.5 h-3.5 text-garnet-400" />
                    {profile.estado_personal}
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-600 mb-4">Se unió en {formatJoinDate(profile.created_at)}</p>

            <div className="flex gap-4 text-sm mb-6 pb-4 border-b border-ink-800">
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

            <div className="space-y-4">
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
  )
}
