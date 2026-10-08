'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import KebabMenu, { type MenuItem } from '../components/KebabMenu'
import ConfirmDialog from '../components/ConfirmDialog'
import UserAvatar from '../components/UserAvatar'
import { ArrowLeftIcon, BlockIcon, CloseIcon, EditIcon, FlagIcon, SendIcon, TrashIcon, UserIcon } from '../components/icons'
import MessageBubble from './MessageBubble'
import DmReportDialog from './DmReportDialog'
import {
  MAX_MESSAGE_LENGTH,
  MAX_NICKNAME_LENGTH,
  MESSAGE_SELECT,
  PAGE_SIZE,
  PENDING_LIMIT,
  dayLabel,
  displayName,
  friendlyDmError,
  mergeById,
  previewText,
  sameDay,
  type ChatInfo,
  type DmMessage,
} from '../lib/dm'

const sortKey = (m: DmMessage) => new Date(m.created_at).getTime()

type Props = {
  convId: string
  me: string
  friendIds: Set<string>
}

export default function ChatPane({ convId, me, friendIds }: Props) {
  const router = useRouter()
  const { onlineIds, refreshDm, showReadReceipts } = useAppSession()

  const [info, setInfo] = useState<ChatInfo | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null)

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<DmMessage | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<DmMessage | null>(null)
  const [deletingMsg, setDeletingMsg] = useState(false)
  const [showNickname, setShowNickname] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const [showHideChat, setShowHideChat] = useState(false)
  const [showBlock, setShowBlock] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ messageId: string | null } | null>(null)
  const [busyAction, setBusyAction] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const stickToBottom = useRef(true)
  const prependAnchor = useRef<number | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const hiddenAtRef = useRef<string | null>(null)
  const markTimer = useRef<number | null>(null)

  // ───────────────────────── carga ─────────────────────────

  const fetchOne = useCallback(async (id: string) => {
    const { data } = await supabase.from('messages').select(MESSAGE_SELECT).eq('id', id).maybeSingle()
    return (data as unknown as DmMessage | null) ?? null
  }, [])

  const fetchLatest = useCallback(async () => {
    let query = supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (hiddenAtRef.current) query = query.gt('created_at', hiddenAtRef.current)
    const { data, error } = await query
    if (error) setNotice(friendlyDmError(error.message))
    return ((data as unknown as DmMessage[]) ?? []).reverse()
  }, [convId])

  const markRead = useCallback(async () => {
    if (document.visibilityState === 'hidden') return
    const { data } = await supabase.rpc('dm_mark_read', { p_conv: convId })
    refreshDm()
    const ch = channelRef.current
    if (data && ch && ch.state === 'joined' && showReadReceipts) {
      ch.send({ type: 'broadcast', event: 'read', payload: { at: data as string } })
    }
  }, [convId, refreshDm, showReadReceipts])

  // el "visto" no se manda en cada mensaje: se junta en una sola marca
  const scheduleMarkRead = useCallback(() => {
    if (markTimer.current) window.clearTimeout(markTimer.current)
    markTimer.current = window.setTimeout(() => {
      markTimer.current = null
      markRead()
    }, 350)
  }, [markRead])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data, error } = await supabase.rpc('dm_chat_info', { p_conv: convId })
      if (cancelled) return
      if (error) {
        setState('error')
        setNotice(friendlyDmError(error.message))
        return
      }
      const row = (Array.isArray(data) ? data[0] : data) as ChatInfo | undefined
      if (!row) {
        setState('missing')
        return
      }
      hiddenAtRef.current = row.hidden_at
      setInfo(row)
      setOtherReadAt(row.other_read_at)
      const latest = await fetchLatest()
      if (cancelled) return
      setMessages(latest)
      setHasMore(latest.length === PAGE_SIZE)
      setState('ready')
      markRead()
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId])

  // Tiempo real del chat abierto: mensajes nuevos / editados / borrados, reacciones y "visto"
  useEffect(() => {
    if (state !== 'ready') return
    const refetchReactions = async () => {
      const { data } = await supabase
        .from('message_reactions')
        .select('message_id, user_id, emoji')
        .eq('conversation_id', convId)
      const byMessage = new Map<string, { user_id: string; emoji: string }[]>()
      for (const r of (data ?? []) as { message_id: string; user_id: string; emoji: string }[]) {
        const list = byMessage.get(r.message_id) ?? []
        list.push({ user_id: r.user_id, emoji: r.emoji })
        byMessage.set(r.message_id, list)
      }
      setMessages((prev) => prev.map((m) => ({ ...m, message_reactions: byMessage.get(m.id) ?? [] })))
    }

    const onMessage = async (payload: { new?: Record<string, unknown> }) => {
      const id = payload.new?.id as string | undefined
      if (!id) return
      const full = await fetchOne(id)
      if (!full) return
      setMessages((prev) => mergeById(prev, [full], sortKey))
      if (full.sender_id !== me) scheduleMarkRead()
    }

    const channel = supabase
      .channel(`chat-${convId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` }, onMessage)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, refetchReactions)
      .on('broadcast', { event: 'read' }, (msg) => {
        const at = (msg.payload as { at?: string } | undefined)?.at
        if (at) setOtherReadAt(at)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${convId}` }, async () => {
        const { data } = await supabase.rpc('dm_chat_info', { p_conv: convId })
        const row = (Array.isArray(data) ? data[0] : data) as ChatInfo | undefined
        if (row) setInfo(row)
      })
      .subscribe()
    channelRef.current = channel

    // Respaldo por si Realtime se corta: se vuelve a mirar cada 15 s y al volver a la pestaña
    const refresh = async () => {
      const latest = await fetchLatest()
      setMessages((prev) => {
        const keep = prev.filter((m) => m.pending)
        const merged = mergeById(
          prev.filter((m) => !m.pending),
          latest,
          sortKey
        )
        return [...merged, ...keep]
      })
      const { data } = await supabase.rpc('dm_other_read_at', { p_conv: convId })
      if (data) setOtherReadAt(data as string)
    }
    const interval = window.setInterval(refresh, 15000)
    const onFocus = () => {
      refresh()
      scheduleMarkRead()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      if (markTimer.current) window.clearTimeout(markTimer.current)
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [state, convId, me, fetchOne, fetchLatest, scheduleMarkRead])

  // ───────────────────────── scroll ─────────────────────────

  const lastKey = messages.length > 0 ? `${messages[messages.length - 1].id}:${messages.length}` : ''

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (prependAnchor.current !== null) {
      el.scrollTop += el.scrollHeight - prependAnchor.current
      prependAnchor.current = null
      return
    }
    const last = messages[messages.length - 1]
    if (stickToBottom.current || last?.sender_id === me) {
      el.scrollTop = el.scrollHeight
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastKey, state])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140
  }

  const loadOlder = async () => {
    const el = scrollRef.current
    const oldest = messages.find((m) => !m.pending)
    if (!el || !oldest || loadingMore) return
    setLoadingMore(true)
    let query = supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('conversation_id', convId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (hiddenAtRef.current) query = query.gt('created_at', hiddenAtRef.current)
    const { data } = await query
    const older = ((data as unknown as DmMessage[]) ?? []).reverse()
    prependAnchor.current = el.scrollHeight
    setMessages((prev) => mergeById(prev, older, sortKey))
    setHasMore(older.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  // ───────────────────────── acciones ─────────────────────────

  const jumpTo = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlashId(id)
    window.setTimeout(() => setFlashId(null), 1500)
  }

  const sendMessage = async (content: string, reply: DmMessage | null, retryId?: string) => {
    const tempId = retryId ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const temp: DmMessage = {
      id: tempId,
      conversation_id: convId,
      sender_id: me,
      content,
      reply_to_id: reply?.id ?? null,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      message_reactions: [],
      reply: reply
        ? { id: reply.id, content: reply.content, sender_id: reply.sender_id, deleted_at: reply.deleted_at }
        : null,
      pending: 'sending',
    }
    setMessages((prev) => [...prev.filter((m) => m.id !== tempId), temp])
    stickToBottom.current = true

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: me, content, reply_to_id: reply?.id ?? null })
      .select(MESSAGE_SELECT)
      .single()

    if (error || !data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: 'failed' } : m)))
      setNotice(friendlyDmError(error?.message))
      return
    }
    setNotice('')
    const real = data as unknown as DmMessage
    setMessages((prev) => mergeById(prev.filter((m) => m.id !== tempId), [real], sortKey))
    // si era una solicitud y la otra persona ya la había aceptado/rechazado, se refresca la cabecera
    if (info?.status === 'pending') {
      const { data: infoData } = await supabase.rpc('dm_chat_info', { p_conv: convId })
      const row = (Array.isArray(infoData) ? infoData[0] : infoData) as ChatInfo | undefined
      if (row) setInfo(row)
    }
    refreshDm()
  }

  const submit = () => {
    const content = text.trim()
    if (!content) return
    const reply = replyTo
    setText('')
    setReplyTo(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMessage(content, reply)
  }

  const retry = (m: DmMessage) => {
    const reply = m.reply ? ({ ...m.reply, conversation_id: convId } as unknown as DmMessage) : null
    sendMessage(m.content, reply, m.id)
  }

  const react = async (m: DmMessage, emoji: string) => {
    const existing = m.message_reactions.find((r) => r.user_id === me)
    const removing = existing?.emoji === emoji

    // se ve al instante; si falla, se vuelve a pedir lo real
    setMessages((prev) =>
      prev.map((x) => {
        if (x.id !== m.id) return x
        const others = x.message_reactions.filter((r) => r.user_id !== me)
        return { ...x, message_reactions: removing ? others : [...others, { user_id: me, emoji }] }
      })
    )

    let error: { message: string } | null = null
    if (removing) {
      const res = await supabase.from('message_reactions').delete().eq('message_id', m.id).eq('user_id', me)
      error = res.error
    } else if (existing) {
      const res = await supabase.from('message_reactions').update({ emoji }).eq('message_id', m.id).eq('user_id', me)
      error = res.error
    } else {
      const res = await supabase.from('message_reactions').insert({ message_id: m.id, user_id: me, emoji })
      error = res.error
    }
    if (error) {
      const full = await fetchOne(m.id)
      if (full) setMessages((prev) => mergeById(prev, [full], sortKey))
      setNotice('No se pudo guardar tu reacción.')
    }
  }

  const saveEdit = async (m: DmMessage, newText: string) => {
    setEditingId(null)
    if (newText === m.content) return
    const editedAt = new Date().toISOString()
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, content: newText, edited_at: editedAt } : x)))
    const { error } = await supabase.from('messages').update({ content: newText, edited_at: editedAt }).eq('id', m.id)
    if (error) {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, content: m.content, edited_at: m.edited_at } : x)))
      setNotice('No se pudo editar el mensaje.')
    }
  }

  const confirmDelete = async () => {
    const m = deleteTarget
    if (!m) return
    setDeletingMsg(true)
    const deletedAt = new Date().toISOString()
    const { error } = await supabase.from('messages').update({ content: '', deleted_at: deletedAt }).eq('id', m.id)
    setDeletingMsg(false)
    setDeleteTarget(null)
    if (error) {
      setNotice('No se pudo eliminar el mensaje.')
      return
    }
    setMessages((prev) =>
      prev.map((x) => {
        if (x.id === m.id) return { ...x, content: '', deleted_at: deletedAt, message_reactions: [] }
        if (x.reply?.id === m.id) return { ...x, reply: { ...x.reply, content: '', deleted_at: deletedAt } }
        return x
      })
    )
    if (replyTo?.id === m.id) setReplyTo(null)
    refreshDm()
  }

  const saveNickname = async () => {
    if (!info) return
    setSavingNickname(true)
    const clean = nicknameDraft.trim().slice(0, MAX_NICKNAME_LENGTH)
    const value = clean.length > 0 ? clean : null
    const { error } = await supabase
      .from('conversation_members')
      .update({ other_nickname: value })
      .eq('conversation_id', convId)
      .eq('user_id', me)
    setSavingNickname(false)
    if (error) {
      setNotice('No se pudo guardar el apodo.')
      return
    }
    setInfo({ ...info, nickname: value })
    setShowNickname(false)
    refreshDm()
  }

  const respond = async (action: 'accept' | 'decline') => {
    setBusyAction(true)
    const { error } = await supabase.rpc('dm_respond', { p_conv: convId, p_action: action })
    setBusyAction(false)
    if (error) {
      setNotice(friendlyDmError(error.message))
      return
    }
    refreshDm()
    if (action === 'decline') {
      router.push('/mensajes')
      return
    }
    const { data } = await supabase.rpc('dm_chat_info', { p_conv: convId })
    const row = (Array.isArray(data) ? data[0] : data) as ChatInfo | undefined
    if (row) setInfo(row)
  }

  const hideChat = async () => {
    setBusyAction(true)
    await supabase.rpc('dm_hide', { p_conv: convId })
    setBusyAction(false)
    setShowHideChat(false)
    refreshDm()
    router.push('/mensajes')
  }

  const blockUser = async () => {
    if (!info) return
    setBusyAction(true)
    const { error } = await supabase.from('blocks').insert({ blocker_id: me, blocked_id: info.other_id })
    if (!error) {
      // igual que en el perfil: al bloquear se rompe el follow en los dos sentidos
      await supabase
        .from('follows')
        .delete()
        .or(
          `and(follower_id.eq.${me},following_id.eq.${info.other_id}),and(follower_id.eq.${info.other_id},following_id.eq.${me})`
        )
      if (info.status === 'pending' && info.initiator_id !== me) {
        await supabase.rpc('dm_respond', { p_conv: convId, p_action: 'decline' })
      }
    }
    setBusyAction(false)
    setShowBlock(false)
    if (error) {
      setNotice('No se pudo bloquear a esta persona.')
      return
    }
    refreshDm()
    router.push('/mensajes')
  }

  // ───────────────────────── pantalla ─────────────────────────

  if (state === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando chat...</p>
      </div>
    )
  }

  if (state === 'missing' || state === 'error' || !info) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-neutral-300 text-sm font-medium">
          {state === 'error' ? 'No se pudo abrir el chat' : 'Esta conversación no está disponible'}
        </p>
        {notice && <p className="text-xs text-neutral-500 max-w-xs">{notice}</p>}
        <Link href="/mensajes" className="text-sm border border-ink-600 text-neutral-300 rounded-full px-4 py-1.5 hover:bg-ink-800 transition">
          Volver a mensajes
        </Link>
      </div>
    )
  }

  const isFriend = friendIds.has(info.other_id)
  const online = isFriend && onlineIds.has(info.other_id)
  const name = displayName({ nickname: info.nickname, id_student: info.other_id_student, username: info.other_username })
  const isRecipientOfPending = info.status === 'pending' && info.initiator_id !== me
  const iDeclined = info.status === 'declined' && info.initiator_id !== me
  const theyDeclined = info.status === 'declined' && info.initiator_id === me
  const myRealCount = messages.filter((m) => m.sender_id === me && !m.pending).length
  const hitPendingLimit = info.status === 'pending' && info.initiator_id === me && myRealCount >= PENDING_LIMIT

  let composerBlock: string | null = null
  if (info.blocked) composerBlock = info.i_blocked ? `Bloqueaste a @${info.other_username}. Desbloquéalo desde su perfil para volver a escribirle.` : 'No puedes enviar mensajes a esta persona.'
  else if (info.other_frozen) composerBlock = 'Esta cuenta está congelada y no puede recibir mensajes por ahora.'
  else if (theyDeclined) composerBlock = 'Esta persona no aceptó tu solicitud, así que no puedes enviarle más mensajes.'
  else if (hitPendingLimit) composerBlock = `Ya enviaste ${PENDING_LIMIT} mensajes. Cuando acepten tu solicitud podrás seguir escribiendo.`

  const lastMineIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id === me && !messages[i].deleted_at && !messages[i].pending) return i
    }
    return -1
  })()
  const seen = (m: DmMessage) =>
    showReadReceipts && !!otherReadAt && new Date(otherReadAt).getTime() >= new Date(m.created_at).getTime()

  const menuItems: MenuItem[] = [
    {
      label: 'Cambiar apodo',
      icon: <EditIcon className="w-4 h-4" />,
      onClick: () => {
        setNicknameDraft(info.nickname ?? '')
        setShowNickname(true)
      },
    },
    { label: 'Ver perfil', icon: <UserIcon className="w-4 h-4" />, onClick: () => router.push(`/perfil/${info.other_username}`) },
    { label: 'Reportar conversación', icon: <FlagIcon className="w-4 h-4" />, onClick: () => setReportTarget({ messageId: null }) },
    { label: 'Eliminar chat', icon: <TrashIcon className="w-4 h-4" />, onClick: () => setShowHideChat(true) },
    { label: 'Bloquear', icon: <BlockIcon className="w-4 h-4" />, danger: true, onClick: () => setShowBlock(true) },
  ]

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-ink-950">
      {/* Cabecera */}
      <div className="relative z-20 shrink-0 flex items-center gap-2 px-2 md:px-4 py-2.5 border-b border-ink-800 bg-ink-900/80 backdrop-blur">
        <Link href="/mensajes" aria-label="Volver a mensajes" className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-neutral-300 hover:bg-ink-800 transition">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <Link href={`/perfil/${info.other_username}`} className="flex items-center gap-3 min-w-0 flex-1">
          <UserAvatar username={info.other_username} avatarUrl={info.other_avatar_url} size="w-10 h-10" online={online} />
          <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-semibold text-neutral-50 truncate">{name}</p>
            <p className={`text-xs truncate ${online ? 'text-emerald-400' : 'text-neutral-500'}`}>
              {online ? 'Conectado' : info.nickname ? `${info.other_id_student || info.other_username} · @${info.other_username}` : `@${info.other_username}`}
              {isFriend && !online ? ' · Amigos' : ''}
            </p>
          </div>
        </Link>
        <KebabMenu items={menuItems} label="Opciones del chat" />
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto px-3 md:px-5 py-3">
        {hasMore && (
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingMore}
              className="text-xs border border-ink-600 text-neutral-400 rounded-full px-3.5 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
            >
              {loadingMore ? 'Cargando...' : 'Ver mensajes anteriores'}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
            <UserAvatar username={info.other_username} avatarUrl={info.other_avatar_url} size="w-16 h-16" textSize="text-2xl" />
            <p className="text-sm font-medium text-neutral-200">{name}</p>
            <p className="text-xs text-neutral-500 max-w-xs">
              {isRecipientOfPending ? 'No hay mensajes por mostrar.' : 'Aún no hay mensajes. Escribe el primero 👋'}
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1]
            const newDay = !prev || !sameDay(prev.created_at, m.created_at)
            const grouped = !newDay && prev.sender_id === m.sender_id
            return (
              <div key={m.id}>
                {newDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-neutral-500 bg-ink-800 rounded-full px-3 py-0.5 capitalize">
                      {dayLabel(m.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={m}
                  me={me}
                  otherName={name}
                  grouped={grouped}
                  showSeen={i === lastMineIndex ? seen(m) : null}
                  editing={editingId === m.id}
                  flash={flashId === m.id}
                  onReact={react}
                  onReply={(x) => {
                    setReplyTo(x)
                    textareaRef.current?.focus()
                  }}
                  onStartEdit={(x) => setEditingId(x.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={saveEdit}
                  onDelete={(x) => setDeleteTarget(x)}
                  onJumpTo={jumpTo}
                  onRetry={retry}
                  onDiscard={(x) => setMessages((prev2) => prev2.filter((y) => y.id !== x.id))}
                  onReport={(x) => setReportTarget({ messageId: x.id })}
                />
              </div>
            )
          })
        )}
      </div>

      {notice && (
        <div className="shrink-0 px-4 py-2 bg-garnet-700/15 border-t border-garnet-700/40 flex items-start gap-2">
          <p className="text-xs text-garnet-300 flex-1">{notice}</p>
          <button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso" className="text-garnet-300 hover:text-white">
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Parte de abajo: solicitud, bloqueo o caja para escribir */}
      {isRecipientOfPending || iDeclined ? (
        <div className="shrink-0 border-t border-ink-800 bg-ink-900 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <p className="text-sm text-neutral-200 font-medium mb-0.5">
            {iDeclined ? 'Eliminaste esta solicitud' : `${name} quiere enviarte un mensaje`}
          </p>
          <p className="text-xs text-neutral-500 mb-3">
            {iDeclined
              ? 'Si la aceptas, podrán escribirse normalmente.'
              : 'No te sigues con esta persona. Si aceptas, podrán escribirse. Si la eliminas, no podrá enviarte más mensajes.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => respond('accept')}
              disabled={busyAction}
              className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition disabled:opacity-60"
            >
              Aceptar
            </button>
            {!iDeclined && (
              <button
                type="button"
                onClick={() => respond('decline')}
                disabled={busyAction}
                className="flex-1 border border-ink-500 text-neutral-200 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60"
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowBlock(true)}
              disabled={busyAction}
              className="flex-1 border border-ink-500 text-garnet-400 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60"
            >
              Bloquear
            </button>
          </div>
        </div>
      ) : composerBlock ? (
        <div className="shrink-0 border-t border-ink-800 bg-ink-900 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <p className="text-xs text-neutral-500 text-center">{composerBlock}</p>
        </div>
      ) : (
        <div className="shrink-0 border-t border-ink-800 bg-ink-900 px-3 md:px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {info.status === 'pending' && info.initiator_id === me && (
            <p className="text-[11px] text-neutral-500 mb-1.5 px-1">
              Tu mensaje llegará como solicitud porque esta persona no te sigue. Puedes enviar hasta {PENDING_LIMIT} mensajes
              hasta que lo acepte.
            </p>
          )}
          {replyTo && (
            <div className="mb-2 flex items-start gap-2 rounded-xl bg-ink-800 border border-ink-700 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-garnet-400">
                  Respondiendo a {replyTo.sender_id === me ? 'ti' : name}
                </p>
                <p className="text-xs text-neutral-400 truncate">{previewText(replyTo.content, 90)}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                aria-label="Cancelar respuesta"
                className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-100 hover:bg-ink-700 transition shrink-0"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
                const el = e.target
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 130)}px`
              }}
              onKeyDown={(e) => {
                // En PC Enter envía y Shift+Enter hace salto de línea; en celular Enter hace salto de línea
                if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia('(pointer: coarse)').matches) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={1}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-ink-800 border border-ink-700 rounded-2xl px-4 py-2.5 text-[15px] resize-none focus:outline-none focus:border-garnet-600 max-h-[130px]"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim()}
              aria-label="Enviar mensaje"
              className="shrink-0 w-10 h-10 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center transition disabled:opacity-40 disabled:hover:bg-garnet-600"
            >
              <SendIcon className="w-[18px] h-[18px]" />
            </button>
          </div>
          {text.length > MAX_MESSAGE_LENGTH - 200 && (
            <p className="text-[10.5px] text-neutral-600 text-right mt-1">{text.length}/{MAX_MESSAGE_LENGTH}</p>
          )}
        </div>
      )}

      {/* Apodo */}
      {showNickname && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => !savingNickname && setShowNickname(false)}>
          <div className="surface-raised border border-ink-600 rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="text-base font-semibold text-neutral-50 mb-1">Apodo para {info.other_id_student || info.other_username}</h2>
            <p className="text-sm text-neutral-400 mb-4">
              Solo tú lo ves, y es el nombre que aparecerá en este chat. Déjalo vacío para quitarlo.
            </p>
            <input
              autoFocus
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value.slice(0, MAX_NICKNAME_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveNickname()
              }}
              placeholder={info.other_id_student || info.other_username}
              className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-garnet-600"
            />
            <p className="text-[11px] text-neutral-600 text-right mt-1 mb-4">{nicknameDraft.length}/{MAX_NICKNAME_LENGTH}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowNickname(false)} disabled={savingNickname} className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60">
                Cancelar
              </button>
              <button type="button" onClick={saveNickname} disabled={savingNickname} className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition disabled:opacity-60">
                {savingNickname ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DmReportDialog
        open={!!reportTarget}
        convId={convId}
        messageId={reportTarget?.messageId ?? null}
        onClose={() => setReportTarget(null)}
        onDone={() => {
          setReportTarget(null)
          setNotice('Gracias. Recibimos tu reporte; el equipo revisará los últimos mensajes de la conversación.')
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="¿Eliminar este mensaje?"
        message="Se elimina para las dos personas. En el chat va a quedar el aviso de que se eliminó un mensaje."
        confirmLabel="Eliminar"
        busy={deletingMsg}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={showHideChat}
        title="¿Eliminar este chat?"
        message="Se borra el historial solo para ti. La otra persona sigue viéndolo, y si te escribe de nuevo el chat vuelve a aparecer sin los mensajes de antes."
        confirmLabel="Eliminar chat"
        busy={busyAction}
        onConfirm={hideChat}
        onCancel={() => setShowHideChat(false)}
      />
      <ConfirmDialog
        open={showBlock}
        title={`¿Bloquear a @${info.other_username}?`}
        message="Dejarán de seguirse mutuamente y no podrán escribirse, darse like ni comentar mientras dure el bloqueo. Puedes desbloquear cuando quieras desde Configuración."
        confirmLabel="Bloquear"
        busy={busyAction}
        onConfirm={blockUser}
        onCancel={() => setShowBlock(false)}
      />
    </div>
  )
}
