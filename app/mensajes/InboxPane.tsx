'use client'

import { useState } from 'react'
import Link from 'next/link'
import UserAvatar from '../components/UserAvatar'
import { ArrowLeftIcon, EditIcon, SearchIcon } from '../components/icons'
import NotesRow from './NotesRow'
import { displayName, inboxTime, previewText, type InboxItem, type NoteItem } from '../lib/dm'

export type InboxTab = 'chats' | 'requests'

export default function InboxPane({
  me,
  meUsername,
  meAvatar,
  tab,
  onTab,
  chats,
  requests,
  loading,
  error,
  activeId,
  friendIds,
  onlineIds,
  myNote,
  friendNotes,
  onOpenNote,
  onLikeNote,
  onNewChat,
}: {
  me: string
  meUsername: string
  meAvatar: string | null
  tab: InboxTab
  onTab: (t: InboxTab) => void
  chats: InboxItem[]
  requests: InboxItem[]
  loading: boolean
  error: string
  activeId: string | null
  friendIds: Set<string>
  onlineIds: Set<string>
  myNote: NoteItem | null
  friendNotes: NoteItem[]
  onOpenNote: (note: NoteItem | null) => void
  onLikeNote: (note: NoteItem) => void
  onNewChat: () => void
}) {
  const [search, setSearch] = useState('')
  const requestsUnread = requests.filter((r) => r.unread_count > 0).length

  const source = tab === 'chats' ? chats : requests
  const q = search.trim().toLowerCase()
  const list = q
    ? source.filter((c) =>
        `${c.nickname ?? ''} ${c.other_id_student ?? ''} ${c.other_username}`.toLowerCase().includes(q)
      )
    : source

  return (
    <div className="flex flex-col md:h-full min-h-0">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        {tab === 'requests' ? (
          <button
            type="button"
            onClick={() => onTab('chats')}
            className="flex items-center gap-2 text-xl font-display font-semibold text-neutral-50"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Solicitudes
          </button>
        ) : (
          <h1 className="text-xl font-display font-semibold text-neutral-50">@{meUsername}</h1>
        )}
        <button
          type="button"
          onClick={onNewChat}
          aria-label="Nuevo mensaje"
          title="Nuevo mensaje"
          className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-200 hover:bg-ink-800 transition"
        >
          <EditIcon className="w-[22px] h-[22px]" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar"
            className="w-full bg-ink-800 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-garnet-600"
          />
        </div>
      </div>

      {tab === 'chats' && !q && (
        <NotesRow
          me={me}
          myNote={myNote}
          friendNotes={friendNotes}
          meAvatar={meAvatar}
          meUsername={meUsername}
          onlineIds={onlineIds}
          onOpen={onOpenNote}
          onLike={onLikeNote}
        />
      )}

      {tab === 'chats' && (
        <div className="flex items-center justify-between px-4 pt-1 pb-2">
          <h2 className="text-[15px] font-semibold text-neutral-50">Mensajes</h2>
          <button
            type="button"
            onClick={() => onTab('requests')}
            className="flex items-center gap-1.5 text-sm font-medium text-garnet-400 hover:text-garnet-300 transition"
          >
            Solicitudes
            {requestsUnread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-garnet-600 text-white text-[10.5px] font-semibold flex items-center justify-center">
                {requestsUnread > 99 ? '99+' : requestsUnread}
              </span>
            )}
            {requestsUnread === 0 && requests.length > 0 && (
              <span className="text-xs text-neutral-500">({requests.length})</span>
            )}
          </button>
        </div>
      )}

      {tab === 'requests' && (
        <p className="px-4 pb-2 text-xs text-neutral-500 leading-relaxed">
          Mensajes de personas que no sigues. No sabrán que los viste hasta que aceptes, y puedes aceptar, eliminar o
          bloquear.
        </p>
      )}

      {/* Lista */}
      <div className="flex-1 min-h-0 md:overflow-y-auto pb-4">
        {error ? (
          <p className="px-4 py-6 text-xs text-garnet-400">{error}</p>
        ) : loading ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Cargando...</p>
        ) : list.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-neutral-300 font-medium mb-1">
              {q
                ? 'Nada coincide con tu búsqueda'
                : tab === 'chats'
                  ? 'Todavía no tienes mensajes'
                  : 'No tienes solicitudes'}
            </p>
            <p className="text-xs text-neutral-500">
              {q
                ? 'Prueba con otro nombre.'
                : tab === 'chats'
                  ? 'Toca el lápiz de arriba o el ícono de mensaje en un perfil para escribirle a alguien.'
                  : 'Cuando alguien que no sigues te escriba, aparecerá aquí.'}
            </p>
          </div>
        ) : (
          <ul>
            {list.map((c) => {
              const name = displayName({ nickname: c.nickname, id_student: c.other_id_student, username: c.other_username })
              const unread = c.unread_count > 0
              const mine = c.last_sender_id === me
              const online = friendIds.has(c.other_id) && onlineIds.has(c.other_id)
              const preview = c.last_deleted
                ? mine
                  ? 'Eliminaste un mensaje'
                  : 'Mensaje eliminado'
                : `${mine ? 'Tú: ' : ''}${previewText(c.last_content, 48)}`
              return (
                <li key={c.conversation_id}>
                  <Link
                    href={`/mensajes/${c.conversation_id}`}
                    className={`flex items-center gap-3 px-4 py-2.5 transition ${
                      activeId === c.conversation_id ? 'bg-ink-800' : 'hover:bg-ink-900'
                    }`}
                  >
                    <UserAvatar username={c.other_username} avatarUrl={c.other_avatar_url} size="w-[52px] h-[52px]" online={online} textSize="text-lg" />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className={`text-[15px] truncate ${unread ? 'font-bold text-neutral-50' : 'text-neutral-100'}`}>{name}</p>
                      <p className={`text-[13px] truncate ${unread ? 'font-semibold text-neutral-200' : 'text-neutral-500'} ${c.last_deleted ? 'italic' : ''}`}>
                        {preview}
                        <span className="text-neutral-600 font-normal"> · {inboxTime(c.last_message_at)}</span>
                      </p>
                    </div>
                    {unread && <span className="w-2.5 h-2.5 rounded-full bg-garnet-500 shrink-0" aria-label="Sin leer" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
