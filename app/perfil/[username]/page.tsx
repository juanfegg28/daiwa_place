'use client'

import { useEffect, useState } from 'react'
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
} from '../../components/icons'
import RoleBadges from '../../components/RoleBadge'
import { PROFILE_POST_SELECT } from '../../lib/queries'
import type { Post, RoleBadgeInfo } from '../../lib/types'

type Profile = {
  id: string
  username: string
  id_student: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  birthday: string | null
  grado: string | null
  estado_personal: string | null
  badge_color: string | null
  is_frozen: boolean
  posts_visibility: 'public' | 'followers'
  created_at: string
}

export default function ProfilePage() {
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
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [roles, setRoles] = useState<RoleBadgeInfo[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [iBlockedThem, setIBlockedThem] = useState(false)
  const [theyBlockedMe, setTheyBlockedMe] = useState(false)

  const loadPosts = async (profileId: string) => {
    const { data } = await supabase
      .from('posts')
      .select(PROFILE_POST_SELECT)
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
    setPosts((data as unknown as Post[]) ?? [])
  }

  const loadFollowState = async (profileId: string) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
    ])
    setFollowersCount(followers ?? 0)
    setFollowingCount(following ?? 0)

    if (userId && userId !== profileId) {
      const { data: followRow } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', userId)
        .eq('following_id', profileId)
        .maybeSingle()
      setIsFollowing(!!followRow)

      const { data: blockRows } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(
          `and(blocker_id.eq.${userId},blocked_id.eq.${profileId}),and(blocker_id.eq.${profileId},blocked_id.eq.${userId})`
        )
      setIBlockedThem(!!blockRows?.some((b) => b.blocker_id === userId))
      setTheyBlockedMe(!!blockRows?.some((b) => b.blocker_id === profileId))
    } else {
      setIsFollowing(false)
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
        'id, username, id_student, bio, avatar_url, banner_url, birthday, grado, estado_personal, badge_color, is_frozen, posts_visibility, created_at'
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
    await Promise.all([loadPosts(profileData.id), loadFollowState(profileData.id), loadRoles()])
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
    if (profile) loadPosts(profile.id)
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
    if (profile) loadPosts(profile.id)
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
    if (profile) loadPosts(profile.id)
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="relative z-10 -mt-14 sm:-mt-16 mb-4 flex justify-between items-end">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-ink-950 bg-ink-700 overflow-hidden flex items-center justify-center shadow-[0_0_0_2px] shadow-garnet-500/45">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
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
          <p className="text-neutral-500 text-sm">{'@' + profile.username}</p>
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
                <b className="text-neutral-100">{posts.length}</b>{' '}
                <span className="text-neutral-500">publicaciones</span>
              </span>
              <span>
                <b className="text-neutral-100">{followersCount}</b>{' '}
                <span className="text-neutral-500">seguidores</span>
              </span>
              <span>
                <b className="text-neutral-100">{followingCount}</b>{' '}
                <span className="text-neutral-500">seguidos</span>
              </span>
            </div>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-10">
                  {isMyProfile
                    ? 'Todavía no has publicado nada.'
                    : isPrivateForMe
                      ? `Este perfil es solo para seguidores. Sigue a @${profile.username} para ver sus publicaciones.`
                      : 'Todavía no hay publicaciones.'}
                </p>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={userId}
                    showAuthor={false}
                    authorIsFrozen={profile.is_frozen}
                    onToggleLike={handleLike}
                    onToggleCommentLike={handleLikeComment}
                    onAddComment={handleAddComment}
                    onRefresh={() => loadPosts(profile.id)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
