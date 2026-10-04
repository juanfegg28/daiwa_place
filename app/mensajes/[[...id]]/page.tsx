'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../components/AppShell'
import { MessageIcon } from '../../components/icons'
import InboxPane, { type InboxTab } from '../InboxPane'
import ChatPane from '../ChatPane'
import NoteModal from '../NoteModal'
import NewChatModal from '../NewChatModal'
import { NOTE_SELECT, friendlyDmError, type InboxItem, type NoteItem } from '../../lib/dm'

export default function MensajesPage() {
  // /mensajes → la bandeja. /mensajes/<id> → esa conversación (en celular ocupa toda la pantalla)
  const params = useParams()
  const raw = params?.id
  const convId = (Array.isArray(raw) ? raw[0] : raw) ?? null
  return (
    <AppShell hideMobileChrome={!!convId}>
      <MensajesContent convId={convId} />
    </AppShell>
  )
}

function MensajesContent({ convId }: { convId: string | null }) {
  const { userId, loading: sessionLoading, username, avatarUrl, dmVersion, onlineIds, refreshDm } = useAppSession()
  const router = useRouter()

  const [tab, setTab] = useState<InboxTab>('chats')
  const [chats, setChats] = useState<InboxItem[]>([])
  const [requests, setRequests] = useState<InboxItem[]>([])
  const [inboxLoading, setInboxLoading] = useState(true)
  const [inboxError, setInboxError] = useState('')
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [viewing, setViewing] = useState<{ id: string | null; mine: boolean } | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)

  useEffect(() => {
    if (!sessionLoading && !userId) router.push('/login')
  }, [sessionLoading, userId, router])

  // Bandeja (chats y solicitudes): se recarga cuando llega algo en vivo
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function run() {
      const [a, b] = await Promise.all([
        supabase.rpc('dm_inbox', { p_requests: false }),
        supabase.rpc('dm_inbox', { p_requests: true }),
      ])
      if (cancelled) return
      if (a.error) {
        setInboxError(friendlyDmError(a.error.message))
        setInboxLoading(false)
        return
      }
      setInboxError('')
      setChats((a.data as InboxItem[]) ?? [])
      setRequests((b.data as InboxItem[]) ?? [])
      setInboxLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [userId, dmVersion])

  // Amigos = se siguen mutuamente
  useEffect(() => {
    if (!userId) return
    const id = userId
    let cancelled = false
    async function run() {
      const [{ data: following }, { data: followers }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', id),
        supabase.from('follows').select('follower_id').eq('following_id', id),
      ])
      if (cancelled) return
      const mine = new Set((following ?? []).map((r) => r.following_id as string))
      const friends = new Set<string>()
      for (const r of followers ?? []) {
        const other = r.follower_id as string
        if (mine.has(other)) friends.add(other)
      }
      setFriendIds(friends)
    }
    run()
    const onFocus = () => run()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [userId])

  // Notas (tuya + las de tus amigos, solo las que no han vencido)
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function run() {
      const { data } = await supabase
        .from('notes')
        .select(NOTE_SELECT)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (!cancelled) setNotes((data as unknown as NoteItem[]) ?? [])
    }
    run()
    return () => {
      cancelled = true
    }
  }, [userId, dmVersion])

  const reloadNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select(NOTE_SELECT)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    setNotes((data as unknown as NoteItem[]) ?? [])
    refreshDm()
  }

  const myNote = useMemo(() => notes.find((n) => n.user_id === userId) ?? null, [notes, userId])
  const friendNotes = useMemo(() => notes.filter((n) => n.user_id !== userId), [notes, userId])

  const toggleNoteLike = async (note: NoteItem) => {
    if (!userId) return
    const liked = note.note_likes.some((l) => l.user_id === userId)
    // se ve al instante, y después se confirma con la base de datos
    setNotes((prev) =>
      prev.map((n) =>
        n.id !== note.id
          ? n
          : {
              ...n,
              note_likes: liked
                ? n.note_likes.filter((l) => l.user_id !== userId)
                : [...n.note_likes, { user_id: userId }],
            }
      )
    )
    if (liked) await supabase.from('note_likes').delete().eq('note_id', note.id).eq('user_id', userId)
    else await supabase.from('note_likes').insert({ note_id: note.id, user_id: userId })
    reloadNotes()
  }

  // Doble clic / doble toque en una nota: da like (no lo quita por accidente: para quitarlo se abre la nota)
  const likeFromRow = (note: NoteItem) => {
    if (!userId) return
    if (note.note_likes.some((l) => l.user_id === userId)) return
    toggleNoteLike(note)
  }

  const noteForModal = viewing ? (viewing.mine ? myNote : (friendNotes.find((n) => n.id === viewing.id) ?? null)) : null
  const modalOpen = !!viewing && (viewing.mine || !!noteForModal)

  if (sessionLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="md:h-screen md:overflow-hidden flex">
      <aside
        className={`${convId ? 'hidden md:flex' : 'flex'} w-full md:w-[370px] md:shrink-0 md:border-r border-ink-800 flex-col md:h-full`}
      >
        <InboxPane
          me={userId}
          meUsername={username ?? 'tu_usuario'}
          meAvatar={avatarUrl}
          tab={tab}
          onTab={setTab}
          chats={chats}
          requests={requests}
          loading={inboxLoading}
          error={inboxError}
          activeId={convId}
          friendIds={friendIds}
          onlineIds={onlineIds}
          myNote={myNote}
          friendNotes={friendNotes}
          onOpenNote={(n) => setViewing(n ? { id: n.id, mine: n.user_id === userId } : { id: null, mine: true })}
          onLikeNote={likeFromRow}
          onNewChat={() => setShowNewChat(true)}
        />
      </aside>

      <section className={`${convId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col h-[100dvh] md:h-full`}>
        {convId ? (
          <ChatPane key={convId} convId={convId} me={userId} friendIds={friendIds} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-16 h-16 rounded-full border border-ink-600 flex items-center justify-center text-garnet-400">
              <MessageIcon className="w-7 h-7" />
            </div>
            <p className="text-neutral-100 font-medium">Tus mensajes</p>
            <p className="text-xs text-neutral-500 max-w-xs">
              Elige una conversación o empieza una nueva con el lápiz de arriba. Los amigos (quienes se siguen
              mutuamente) pueden ver tus notas y tu estado «conectado».
            </p>
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="mt-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-5 py-2 text-sm font-medium transition"
            >
              Enviar mensaje
            </button>
          </div>
        )}
      </section>

      <NoteModal
        open={modalOpen}
        note={noteForModal}
        isMine={!!viewing?.mine}
        me={userId}
        onClose={() => setViewing(null)}
        onChanged={reloadNotes}
        onToggleLike={toggleNoteLike}
      />

      <NewChatModal
        open={showNewChat}
        me={userId}
        friendIds={friendIds}
        onlineIds={onlineIds}
        onClose={() => setShowNewChat(false)}
      />
    </div>
  )
}
