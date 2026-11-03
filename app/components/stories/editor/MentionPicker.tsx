'use client'

import { useEffect, useState } from 'react'
import UserAvatar from '../../UserAvatar'
import { SearchIcon } from '../../icons'
import { displayName, findMentionPeople, type MentionPerson, type MentionResults } from '../../../lib/mentions'
import type { StoryAudience } from '../../../lib/stories'

/**
 * v1.6.2 · Buscador de personas para el sticker @mención de las historias.
 * Sin escribir: tus amigos. Escribiendo: amigos que coinciden y luego cualquier persona.
 * Si la historia es «solo amigos», avisa cuando la persona elegida no es amiga (no la podrá ver).
 */
export default function MentionPicker({
  me,
  audience,
  full,
  onPick,
}: {
  me: string
  audience: StoryAudience
  /** ya hay 5 menciones: no se pueden añadir más */
  full: boolean
  onPick: (p: MentionPerson) => void
}) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<MentionResults | null>(null)

  useEffect(() => {
    let alive = true
    const t = window.setTimeout(
      () => {
        void findMentionPeople(me, q.replace(/^@/, '')).then((r) => {
          if (alive) setRes(r)
        })
      },
      q ? 180 : 0
    )
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [me, q])

  const row = (p: MentionPerson, friend: boolean) => (
    <button
      key={p.id}
      type="button"
      disabled={full}
      onClick={() => onPick(p)}
      className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-white/8 active:bg-white/12 disabled:opacity-40"
    >
      <UserAvatar username={p.username} avatarUrl={p.avatar_url} size="w-9 h-9" textSize="text-xs" />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium truncate">{displayName(p)}</span>
        <span className="block text-[11.5px] text-neutral-400 truncate">@{p.username}</span>
      </span>
      {audience === 'friends' && !friend && <span className="shrink-0 text-[10.5px] text-amber-300">No la verá</span>}
    </button>
  )

  const empty = res && res.friends.length === 0 && res.others.length === 0

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2.5">
        <SearchIcon className="w-4 h-4 text-neutral-400 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, 24))}
          placeholder="Busca a quién mencionar"
          aria-label="Buscar persona para mencionar"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent text-[16px] outline-none placeholder:text-neutral-500"
        />
      </label>
      {full && <p className="text-[12px] text-amber-300">Máximo 5 menciones por historia. Quita alguna para añadir otra.</p>}
      {audience === 'friends' && <p className="text-[11.5px] text-neutral-500">Tu historia es solo para amigos: una persona que no sea tu amiga no la verá aunque la menciones.</p>}
      <div className="max-h-[38dvh] overflow-y-auto -mx-1 px-1 space-y-0.5">
        {res === null && <p className="text-[13px] text-neutral-500 py-4 text-center">Buscando…</p>}
        {res && res.friends.length > 0 && (
          <>
            <p className="px-2.5 pt-1 pb-0.5 text-[10.5px] uppercase tracking-wide text-neutral-500">{q ? 'Amigos' : 'Tus amigos'}</p>
            {res.friends.map((p: MentionPerson) => row(p, true))}
          </>
        )}
        {res && res.others.length > 0 && (
          <>
            <p className="px-2.5 pt-2 pb-0.5 text-[10.5px] uppercase tracking-wide text-neutral-500">Más personas</p>
            {res.others.map((p: MentionPerson) => row(p, false))}
          </>
        )}
        {empty && <p className="text-[13px] text-neutral-500 py-4 text-center">{q ? 'No encontramos a nadie con ese nombre.' : 'Escribe un nombre para buscar a alguien.'}</p>}
      </div>
    </div>
  )
}
