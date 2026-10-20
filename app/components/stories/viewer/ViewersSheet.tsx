'use client'

import Avatar from '../../cosmetics/Avatar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { HeartIcon, SearchIcon, StarIcon, TrashIcon } from '../../icons'
import Sheet from '../Sheet'
import { fetchActivityCounts, fetchViewers, storyAgo, ownerLabel, type Viewer } from '../../../lib/stories'

function Row({ v, liked }: { v: Viewer; liked: boolean }) {
  return (
    <Link href={`/perfil/${v.username}`} className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-white/5">
      <Avatar username={v.username} avatarUrl={v.avatar_url} size="w-11 h-11" textSize="text-base" sizes="48px" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[14px] font-semibold text-neutral-50 truncate">{ownerLabel(v)}</span>
        <span className="block text-[12px] text-neutral-400 truncate">
          @{v.username} · {storyAgo(v.liked && v.liked_at ? v.liked_at : v.viewed_at)}
          {v.is_friend && <span className="ml-1.5 rounded-full bg-emerald-600/25 text-emerald-300 text-[10px] px-1.5 py-[1px]">Amigo</span>}
        </span>
      </span>
      {liked && <HeartIcon filled className="w-6 h-6 text-garnet-500 shrink-0" />}
    </Link>
  )
}

/**
 * «Actividad de tu historia» (solo el dueño): arriba «Les gustó ♥» (el like más reciente primero), después
 * «Vista por». Los que dieron like no se repiten abajo. Se refresca sola cada 10 s mientras está abierta.
 */
export default function ViewersSheet({
  storyId,
  open,
  onClose,
  onFeature,
  onDelete,
}: {
  storyId: string
  open: boolean
  onClose: () => void
  onFeature?: () => void
  onDelete?: () => void
}) {
  const [rows, setRows] = useState<Viewer[]>([])
  const [counts, setCounts] = useState({ people: 0, likes: 0 })
  const [loaded, setLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [q, setQ] = useState('')

  const refresh = useCallback(async () => {
    const [list, c] = await Promise.all([fetchViewers(storyId, 50, 0), fetchActivityCounts(storyId)])
    setRows((prev) => {
      // conserva lo que ya se había cargado de más abajo (paginación) y actualiza lo de arriba
      const first = new Set(list.map((x) => x.user_id))
      return [...list, ...prev.slice(50).filter((x) => !first.has(x.user_id))]
    })
    setHasMore(list.length === 50)
    setCounts(c)
    setLoaded(true)
  }, [storyId])

  useEffect(() => {
    if (!open) return
    function run() {
      void refresh()
    }
    run()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 10000)
    return () => window.clearInterval(id)
  }, [open, refresh])

  const loadMore = async () => {
    setLoadingMore(true)
    const more = await fetchViewers(storyId, 50, rows.length)
    setRows((prev) => {
      const seen = new Set(prev.map((x) => x.user_id))
      return [...prev, ...more.filter((x) => !seen.has(x.user_id))]
    })
    setHasMore(more.length === 50)
    setLoadingMore(false)
  }

  const needle = q.trim().toLowerCase()
  const filtered = useMemo(
    () => (needle ? rows.filter((r) => `${r.username} ${r.id_student ?? ''}`.toLowerCase().includes(needle)) : rows),
    [rows, needle]
  )
  const liked = filtered.filter((r) => r.liked)
  const others = filtered.filter((r) => !r.liked)
  const viewedOnly = Math.max(0, counts.people - counts.likes)

  return (
    <Sheet open={open} onClose={onClose} side title="Actividad de tu historia" z={140}>
      <p className="-mt-1 mb-3 text-[12.5px] text-neutral-400">
        {counts.people} {counts.people === 1 ? 'vista' : 'vistas'} · {counts.likes} me gusta
      </p>
      <div className="flex gap-2 mb-3">
        {onFeature && (
          <button type="button" onClick={onFeature} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-[13px] text-neutral-100 hover:bg-white/10">
            <StarIcon className="w-4 h-4 text-amber-300" /> Destacar
          </button>
        )}
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-[13px] text-neutral-100 hover:bg-white/10">
            <TrashIcon className="w-4 h-4" /> Eliminar
          </button>
        )}
      </div>
      {rows.length > 20 && (
        <label className="mb-3 flex items-center gap-2 rounded-full bg-white/8 border border-white/10 px-3.5 h-10">
          <SearchIcon className="w-4 h-4 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre" className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-neutral-500" />
        </label>
      )}

      {!loaded ? (
        <p className="text-sm text-neutral-500 py-6 text-center">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500 py-10 text-center">Todavía nadie ha visto esta historia</p>
      ) : (
        <>
          {liked.length > 0 && (
            <section className="mb-4">
              <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                Les gustó <HeartIcon filled className="w-3.5 h-3.5 text-garnet-500" /> ({q ? liked.length : counts.likes})
              </h3>
              {liked.map((v) => (
                <Row key={v.user_id} v={v} liked />
              ))}
            </section>
          )}
          {others.length > 0 && (
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Vista por ({q ? others.length : viewedOnly})</h3>
              {others.map((v) => (
                <Row key={v.user_id} v={v} liked={false} />
              ))}
            </section>
          )}
          {filtered.length === 0 && <p className="text-sm text-neutral-500 py-6 text-center">Nadie coincide con esa búsqueda</p>}
          {hasMore && !q && (
            <button type="button" onClick={loadMore} disabled={loadingMore} className="mt-3 w-full rounded-full border border-white/15 py-2.5 text-sm text-neutral-200 hover:bg-white/10 disabled:opacity-60">
              {loadingMore ? 'Cargando…' : 'Ver más'}
            </button>
          )}
        </>
      )}
    </Sheet>
  )
}
