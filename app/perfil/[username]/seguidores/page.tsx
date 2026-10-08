'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../../components/AppShell'
import UserAvatar from '../../../components/UserAvatar'
import { ArrowLeftIcon } from '../../../components/icons'

type Tab = 'followers' | 'following'

type Row = {
  profile_id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  is_frozen: boolean
  i_follow: boolean
  follows_me: boolean
  followed_at: string
}

const PAGE = 40

export default function SeguidoresPage() {
  return (
    <AppShell>
      <SeguidoresContent />
    </AppShell>
  )
}

function SeguidoresContent() {
  const params = useParams()
  const raw = params?.username
  const username = ((Array.isArray(raw) ? raw[0] : raw) ?? '').toString().toLowerCase()
  const { userId, loading: sessionLoading, onlineIds } = useAppSession()
  const router = useRouter()

  const [profile, setProfile] = useState<{ id: string; username: string; id_student: string | null } | null>(null)
  const [missing, setMissing] = useState(false)
  const [counts, setCounts] = useState({ followers: 0, following: 0 })
  const [tab, setTab] = useState<Tab>('followers')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionLoading && !userId) router.push('/login')
  }, [sessionLoading, userId, router])

  // Pestaña inicial: /perfil/usuario/seguidores?tab=siguiendo
  useEffect(() => {
    function run() {
      if (new URLSearchParams(window.location.search).get('tab') === 'siguiendo') setTab('following')
    }
    run()
  }, [])

  // Datos básicos del perfil y los totales
  useEffect(() => {
    if (!userId || !username) return
    let cancelled = false
    async function run() {
      const { data } = await supabase.from('profiles').select('id, username, id_student').eq('username', username).maybeSingle()
      if (cancelled) return
      if (!data) {
        setMissing(true)
        setLoading(false)
        return
      }
      setProfile(data as { id: string; username: string; id_student: string | null })
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', data.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', data.id),
      ])
      if (!cancelled) setCounts({ followers: followers ?? 0, following: following ?? 0 })
    }
    run()
    return () => {
      cancelled = true
    }
  }, [userId, username])

  const fetchPage = useCallback(
    async (offset: number) => {
      if (!profile) return { rows: [] as Row[], error: '' }
      const { data, error: err } = await supabase.rpc('follow_list', {
        p_user: profile.id,
        p_kind: tab,
        p_limit: PAGE,
        p_offset: offset,
      })
      if (err) {
        const msg = /Could not find the function/.test(err.message)
          ? 'Falta correr el SQL de la v0.13.5 en Supabase.'
          : `No se pudo cargar la lista. Detalle: ${err.message}`
        return { rows: [] as Row[], error: msg }
      }
      return { rows: (data as Row[] | null) ?? [], error: '' }
    },
    [profile, tab]
  )

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    async function run() {
      setLoading(true)
      const res = await fetchPage(0)
      if (cancelled) return
      setError(res.error)
      setRows(res.rows)
      setHasMore(res.rows.length === PAGE)
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [profile, fetchPage])

  const loadMore = async () => {
    setLoadingMore(true)
    const res = await fetchPage(rows.length)
    setLoadingMore(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.profile_id))
      return [...prev, ...res.rows.filter((r) => !seen.has(r.profile_id))]
    })
    setHasMore(res.rows.length === PAGE)
  }

  const toggleFollow = async (row: Row) => {
    if (!userId || busyId) return
    setBusyId(row.profile_id)
    const next = !row.i_follow
    setRows((prev) => prev.map((r) => (r.profile_id === row.profile_id ? { ...r, i_follow: next } : r)))
    const { error: err } = next
      ? await supabase.from('follows').insert({ follower_id: userId, following_id: row.profile_id })
      : await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', row.profile_id)
    setBusyId(null)
    if (err) {
      setRows((prev) => prev.map((r) => (r.profile_id === row.profile_id ? { ...r, i_follow: row.i_follow } : r)))
      setError('No se pudo actualizar. Inténtalo de nuevo.')
    }
  }

  if (sessionLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  if (missing) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center">
        <p className="text-neutral-300 text-sm font-medium mb-3">Este perfil no existe</p>
        <Link href="/" className="text-sm text-garnet-400 hover:text-garnet-300">
          Volver al inicio
        </Link>
      </div>
    )
  }

  const name = profile?.id_student || profile?.username || ''
  const isOwn = profile?.id === userId
  const anyFollowed = rows.some((r) => r.i_follow)
  const anyOthers = rows.some((r) => !r.i_follow)

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <Link
        href={`/perfil/${username}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-100 mb-3 transition"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        {name || 'Volver al perfil'}
      </Link>
      <h1 className="text-xl font-display font-semibold text-neutral-50 mb-4">
        {isOwn ? 'Tus conexiones' : `Conexiones de ${name}`}
      </h1>

      <div className="flex border-b border-ink-800 mb-4" role="tablist">
        {(
          [
            { id: 'followers', label: 'Seguidores', n: counts.followers },
            { id: 'following', label: 'Siguiendo', n: counts.following },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id)
              window.history.replaceState(null, '', `/perfil/${username}/seguidores${t.id === 'following' ? '?tab=siguiendo' : ''}`)
            }}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.id ? 'border-garnet-500 text-neutral-50' : 'border-transparent text-neutral-500 hover:text-neutral-200'
            }`}
          >
            {t.label} <span className="text-neutral-500 font-normal">{t.n}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500 text-center py-10">Cargando...</p>
      ) : rows.length === 0 && !error ? (
        <p className="text-sm text-neutral-500 text-center py-10">
          {tab === 'followers' ? 'Todavía no tiene seguidores.' : 'Todavía no sigue a nadie.'}
        </p>
      ) : (
        <ul>
          {rows.map((r, i) => {
            const friend = r.i_follow && r.follows_me
            const online = friend && onlineIds.has(r.profile_id)
            const self = r.profile_id === userId
            const showSectionHeader = anyFollowed && anyOthers && !self && (i === 0 || rows[i - 1].i_follow !== r.i_follow)
            return (
              <li key={r.profile_id}>
                {showSectionHeader && (
                  <p className="text-[11px] uppercase tracking-wide text-neutral-500 px-1 pt-3 pb-1">
                    {r.i_follow ? 'Personas que sigues' : 'Otras personas'}
                  </p>
                )}
                <div className="flex items-center gap-3 py-2.5 px-1">
                  <Link href={`/perfil/${r.username}`} className="shrink-0">
                    <UserAvatar username={r.username} avatarUrl={r.avatar_url} size="w-11 h-11" online={online} />
                  </Link>
                  <Link href={`/perfil/${r.username}`} className="min-w-0 flex-1 leading-tight">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-100 truncate">{r.id_student || r.username}</span>
                      {friend && (
                        <span className="text-[10px] uppercase tracking-wide bg-garnet-700/20 text-garnet-300 rounded-full px-1.5 py-0.5">
                          Amigos
                        </span>
                      )}
                      {!friend && r.follows_me && !self && (
                        <span className="text-[10px] uppercase tracking-wide bg-ink-700 text-neutral-400 rounded-full px-1.5 py-0.5">
                          Te sigue
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-neutral-500 truncate">@{r.username}</span>
                  </Link>
                  {!self && (
                    <button
                      type="button"
                      onClick={() => toggleFollow(r)}
                      disabled={busyId === r.profile_id}
                      className={`shrink-0 text-xs font-medium rounded-full px-4 py-1.5 transition disabled:opacity-60 ${
                        r.i_follow
                          ? 'border border-ink-500 text-neutral-300 hover:bg-ink-800'
                          : 'bg-garnet-600 hover:bg-garnet-500 text-white'
                      }`}
                    >
                      {r.i_follow ? 'Siguiendo' : r.follows_me ? 'Seguir también' : 'Seguir'}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition disabled:opacity-60"
          >
            {loadingMore ? 'Cargando...' : 'Ver más'}
          </button>
        </div>
      )}
    </div>
  )
}
