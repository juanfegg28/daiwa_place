'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { clearMentionCache } from '../lib/mentions'
import { clearRingCache } from '../lib/stories'
import { fetchSuggestions, hideSuggestionsForADay, reasonText, skipSuggestion, skippedIds, type Suggestion } from '../lib/suggestions'
import UserAvatar from './UserAvatar'
import { CloseIcon } from './icons'

/**
 * v1.6.2 · «Personas que quizás conozcas»: aparece de vez en cuando entre las publicaciones del Inicio.
 * Salen personas que siguen tus amigos (y tú no), que ya te siguen, de tus clubes o recién llegadas.
 * Con la ✕ de una tarjeta se descarta esa persona; con la ✕ de arriba se esconde toda la sección por un día.
 */
export default function FollowSuggestions({ userId }: { userId: string }) {
  const [list, setList] = useState<Suggestion[] | null>(null)
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    void fetchSuggestions(14).then((rows) => {
      if (!alive) return
      const skip = skippedIds()
      setList(rows.filter((r) => !skip.has(r.user_id)).slice(0, 10))
    })
    return () => {
      alive = false
    }
  }, [])

  if (closed || !list || list.length < 2) return null

  const follow = async (s: Suggestion) => {
    if (busy) return
    setBusy(s.user_id)
    setError('')
    const { error: err } = await supabase.from('follows').insert({ follower_id: userId, following_id: s.user_id })
    setBusy(null)
    if (err && !/duplicate key/i.test(err.message)) {
      setError('No se pudo seguir. Inténtalo de nuevo.')
      return
    }
    clearMentionCache()
    clearRingCache()
    setFollowed((prev) => new Set(prev).add(s.user_id))
  }

  const dismiss = (s: Suggestion) => {
    skipSuggestion(s.user_id)
    setList((prev) => (prev ? prev.filter((x) => x.user_id !== s.user_id) : prev))
  }

  return (
    <section className="surface-card rounded-2xl py-3 sm:py-4" aria-label="Personas que quizás conozcas">
      <div className="flex items-center justify-between px-3 sm:px-4 mb-2.5">
        <h2 className="text-[14px] font-semibold text-neutral-100">Personas que quizás conozcas</h2>
        <button
          type="button"
          onClick={() => {
            hideSuggestionsForADay()
            setClosed(true)
          }}
          aria-label="Ocultar sugerencias por hoy"
          className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-ink-700"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory px-3 sm:px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain">
        {list.map((s) => {
          const name = s.id_student?.trim() || s.username
          const isFollowed = followed.has(s.user_id)
          return (
            <div key={s.user_id} className="relative snap-start shrink-0 w-[148px] rounded-2xl border border-ink-700 bg-ink-900/60 px-3 pt-4 pb-3 flex flex-col items-center text-center">
              {!isFollowed && (
                <button
                  type="button"
                  onClick={() => dismiss(s)}
                  aria-label={`No sugerirme a ${name}`}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-300"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <Link href={`/perfil/${s.username}`} className="flex flex-col items-center min-w-0 w-full">
                <UserAvatar username={s.username} avatarUrl={s.avatar_url} size="w-14 h-14" textSize="text-base" />
                <span className="mt-2 block w-full text-[13.5px] font-semibold text-neutral-100 truncate">{name}</span>
                <span className="block w-full text-[11px] text-neutral-500 truncate">@{s.username}</span>
              </Link>
              <p className="mt-1.5 text-[11px] leading-snug text-neutral-400 line-clamp-2 min-h-[2.1em]">{reasonText(s)}</p>
              <button
                type="button"
                onClick={() => follow(s)}
                disabled={isFollowed || busy === s.user_id}
                className={`mt-2.5 w-full rounded-full py-2 text-[13px] font-medium transition ${
                  isFollowed ? 'border border-ink-600 text-neutral-400' : 'bg-garnet-600 hover:bg-garnet-500 text-white'
                } disabled:opacity-70`}
              >
                {isFollowed ? 'Siguiendo' : busy === s.user_id ? '...' : 'Seguir'}
              </button>
            </div>
          )
        })}
      </div>
      {error && <p className="text-xs text-garnet-400 px-4 mt-2">{error}</p>}
    </section>
  )
}
