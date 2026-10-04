'use client'

import { useRef, useState } from 'react'
import { HeartIcon, MusicIcon } from '../components/icons'
import UserAvatar from '../components/UserAvatar'
import type { NoteItem } from '../lib/dm'

/**
 * Fila de notas de arriba de los mensajes (como en Instagram).
 * · Tu nota va primero. Si no tienes, sale "Novedades…" para crear una.
 * · Las notas de tus amigos van después.
 * · Un toque abre la nota. Doble clic (PC) o doble toque (celular) le da like.
 */
export default function NotesRow({
  me,
  myNote,
  friendNotes,
  meAvatar,
  meUsername,
  onlineIds,
  onOpen,
  onLike,
}: {
  me: string
  myNote: NoteItem | null
  friendNotes: NoteItem[]
  meAvatar: string | null
  meUsername: string
  onlineIds: Set<string>
  onOpen: (note: NoteItem | null) => void
  onLike: (note: NoteItem) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pt-14 pb-3 -mt-10 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <NoteItemView
        note={myNote}
        isMine
        me={me}
        avatarUrl={meAvatar}
        username={meUsername}
        label="Tu nota"
        online={false}
        onOpen={() => onOpen(myNote)}
        onLike={() => {}}
      />
      {friendNotes.map((n) => (
        <NoteItemView
          key={n.id}
          note={n}
          isMine={false}
          me={me}
          avatarUrl={n.profiles?.avatar_url ?? null}
          username={n.profiles?.username ?? 'usuario'}
          label={n.profiles?.id_student || n.profiles?.username || 'Amigo'}
          online={onlineIds.has(n.user_id)}
          onOpen={() => onOpen(n)}
          onLike={() => onLike(n)}
        />
      ))}
    </div>
  )
}

function NoteItemView({
  note,
  isMine,
  me,
  avatarUrl,
  username,
  label,
  online,
  onOpen,
  onLike,
}: {
  note: NoteItem | null
  isMine: boolean
  me: string
  avatarUrl: string | null
  username: string
  label: string
  online: boolean
  onOpen: () => void
  onLike: () => void
}) {
  const clickTimer = useRef<number | null>(null)
  const [burst, setBurst] = useState(0)

  const likedByMe = !!note && note.note_likes.some((l) => l.user_id === me)
  const likeCount = note?.note_likes.length ?? 0
  const hasMusic = !!note?.music

  // Un toque abre la nota (con una pequeña espera); dos toques seguidos dan like
  const handleClick = () => {
    if (isMine || !note) {
      onOpen()
      return
    }
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current)
      clickTimer.current = null
      onLike()
      setBurst((b) => b + 1)
      return
    }
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null
      onOpen()
    }, 260)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={(e) => e.preventDefault()}
      className="relative shrink-0 w-[84px] flex flex-col items-center text-center select-none touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-label={isMine ? 'Tu nota' : `Nota de ${label}`}
    >
      {/* burbuja de la nota, montada sobre la parte de arriba de la foto */}
      <span
        className={`relative z-10 -mb-3.5 max-w-[92px] min-h-[34px] rounded-2xl px-2.5 py-1.5 text-[11.5px] leading-tight flex items-center justify-center ${
          note
            ? 'bg-ink-700 text-neutral-100 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.8)]'
            : 'bg-ink-800 text-neutral-500 border border-ink-700'
        }`}
      >
        <span className="line-clamp-3 break-words">
          {note ? note.content : isMine ? 'Novedades…' : ''}
        </span>
        {hasMusic && (
          <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-garnet-600 text-white flex items-center justify-center">
            <MusicIcon className="w-2.5 h-2.5" />
          </span>
        )}
        {note && likeCount > 0 && (
          <span
            className={`absolute -bottom-2 -right-1.5 flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[10px] font-semibold border border-ink-950 ${
              likedByMe ? 'bg-garnet-600 text-white' : 'bg-ink-600 text-neutral-200'
            }`}
          >
            <HeartIcon filled className="w-2.5 h-2.5" />
            {likeCount}
          </span>
        )}
        {burst > 0 && (
          <span key={burst} className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping text-garnet-400">
            <HeartIcon filled className="w-6 h-6" />
          </span>
        )}
      </span>

      <UserAvatar username={username} avatarUrl={avatarUrl} size="w-16 h-16" online={online} textSize="text-xl" />
      <span className="mt-1.5 w-full truncate text-[12px] text-neutral-300">{label}</span>
    </button>
  )
}
