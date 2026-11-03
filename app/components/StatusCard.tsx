'use client'

import Link from 'next/link'
import { memo, useState } from 'react'
import UserAvatar from './UserAvatar'
import { HeartIcon } from './icons'
import { statusAgo, toggleStatusLike, type FeedStatus } from '../lib/status'

/**
 * v1.6.2 · Tarjetita pequeña de «Estado» para el Inicio: una sola línea, como un mini‑post.
 * Se puede dar like (un toque). Si es el tuyo, el lápiz abre la hoja para cambiarlo.
 */
function StatusCardBase({ item, mine, onEdit }: { item: FeedStatus; mine: boolean; onEdit?: () => void }) {
  const [liked, setLiked] = useState(item.liked_by_me)
  const [count, setCount] = useState(item.like_count)
  const [busy, setBusy] = useState(false)
  const name = item.id_student?.trim() || item.username

  const like = async () => {
    if (busy) return
    setBusy(true)
    const prevLiked = liked
    setLiked(!prevLiked)
    setCount((c) => Math.max(0, c + (prevLiked ? -1 : 1)))
    const res = await toggleStatusLike(item.user_id)
    setBusy(false)
    if (res.error || res.liked === null) {
      setLiked(prevLiked)
      setCount((c) => Math.max(0, c + (prevLiked ? 1 : -1)))
    }
  }

  return (
    <div className="surface-card rounded-2xl px-3 py-2.5 sm:px-4 flex items-center gap-3">
      <Link href={`/perfil/${item.username}`} aria-label={`Ir al perfil de ${name}`} className="shrink-0">
        <UserAvatar username={item.username} avatarUrl={item.avatar_url} size="w-9 h-9" textSize="text-xs" />
      </Link>
      <div className="min-w-0 flex-1 leading-snug">
        <p className="text-[14px] text-neutral-200 break-words">
          <Link href={`/perfil/${item.username}`} className="font-semibold text-neutral-50 hover:underline underline-offset-2">
            {mine ? 'Tú' : name}
          </Link>{' '}
          <span className="text-neutral-500">{mine ? 'estás' : 'está'}</span>{' '}
          {item.emoji && <span aria-hidden="true">{item.emoji} </span>}
          <span className="font-semibold text-garnet-300">{item.text}</span>
        </p>
        <p className="text-[11px] text-neutral-500 mt-0.5">Estado · {statusAgo(item.updated_at)}</p>
      </div>
      {mine && onEdit && (
        <button type="button" onClick={onEdit} className="shrink-0 text-xs text-neutral-400 hover:text-neutral-100 border border-ink-600 rounded-full px-3 py-1.5" aria-label="Cambiar mi estado">
          Cambiar
        </button>
      )}
      <button
        type="button"
        onClick={like}
        disabled={busy}
        aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
        aria-pressed={liked}
        className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-2 text-xs transition ${liked ? 'text-garnet-400' : 'text-neutral-400 hover:text-garnet-400'} hover:bg-ink-700`}
      >
        <HeartIcon filled={liked} className="w-[18px] h-[18px]" />
        {count > 0 && <span className="tabular-nums">{count}</span>}
      </button>
    </div>
  )
}

const StatusCard = memo(StatusCardBase)
export default StatusCard
