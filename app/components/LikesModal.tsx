'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from './AppShell'
import UserAvatar from './UserAvatar'
import { CloseIcon, HeartIcon } from './icons'

type Row = {
  profile_id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  is_frozen: boolean
  i_follow: boolean
  follows_me: boolean
  liked_at: string
}

const PAGE = 40

/**
 * Quién le dio "me gusta" a una publicación. Misma lógica que seguidores y seguidos:
 * primero las personas que tú sigues, después el resto. Cada fila trae su botón de Seguir.
 */
export default function LikesModal({ postId, total, onClose }: { postId: string; total: number; onClose: () => void }) {
  const { userId, onlineIds } = useAppSession()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchPage = useCallback(
    async (offset: number) => {
      const { data, error: err } = await supabase.rpc('post_like_list', { p_post: postId, p_limit: PAGE, p_offset: offset })
      if (err) {
        return {
          rows: [] as Row[],
          error: /Could not find the function/.test(err.message)
            ? 'Falta correr el SQL de la v0.14.0 en Supabase.'
            : `No se pudo cargar la lista. Detalle: ${err.message}`,
        }
      }
      return { rows: (data as Row[] | null) ?? [], error: '' }
    },
    [postId]
  )

  useEffect(() => {
    let cancelled = false
    async function run() {
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
  }, [fetchPage])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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

  const anyFollowed = rows.some((r) => r.i_follow)
  const anyOthers = rows.some((r) => !r.i_follow)

  return (
    <div className="fixed inset-0 z-[65] bg-black/70 flex items-end md:items-center justify-center md:px-4" onClick={onClose}>
      <div
        className="surface-raised border border-ink-600 rounded-t-3xl md:rounded-3xl w-full md:max-w-md h-[70dvh] md:h-[560px] md:max-h-[80dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Personas a las que les gustó"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink-700">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50">
            <HeartIcon filled className="w-4 h-4 text-garnet-500" />
            Les gustó
            <span className="text-sm font-normal text-neutral-500">{total}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-ink-600 transition">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
          {error && <p className="text-xs text-garnet-400 px-2 pt-3">{error}</p>}
          {loading ? (
            <p className="text-sm text-neutral-500 text-center py-10">Cargando...</p>
          ) : rows.length === 0 && !error ? (
            <p className="text-sm text-neutral-500 text-center py-10">Todavía nadie le dio like.</p>
          ) : (
            <ul>
              {rows.map((r, i) => {
                const friend = r.i_follow && r.follows_me
                const self = r.profile_id === userId
                const showHeader = anyFollowed && anyOthers && !self && (i === 0 || rows[i - 1].i_follow !== r.i_follow)
                return (
                  <li key={r.profile_id}>
                    {showHeader && (
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500 px-1 pt-3 pb-1">
                        {r.i_follow ? 'Personas que sigues' : 'Otras personas'}
                      </p>
                    )}
                    <div className="flex items-center gap-3 py-2 px-1">
                      <Link href={`/perfil/${r.username}`} onClick={onClose} className="shrink-0">
                        <UserAvatar username={r.username} avatarUrl={r.avatar_url} size="w-11 h-11" online={friend && onlineIds.has(r.profile_id)} />
                      </Link>
                      <Link href={`/perfil/${r.username}`} onClick={onClose} className="min-w-0 flex-1 leading-tight">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-neutral-100 truncate">{r.id_student || r.username}</span>
                          {friend && (
                            <span className="text-[10px] uppercase tracking-wide bg-garnet-700/20 text-garnet-300 rounded-full px-1.5 py-0.5">Amigos</span>
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
                            r.i_follow ? 'border border-ink-500 text-neutral-300 hover:bg-ink-800' : 'bg-garnet-600 hover:bg-garnet-500 text-white'
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
            <div className="flex justify-center py-3">
              <button type="button" onClick={loadMore} disabled={loadingMore} className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition disabled:opacity-60">
                {loadingMore ? 'Cargando...' : 'Ver más'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
