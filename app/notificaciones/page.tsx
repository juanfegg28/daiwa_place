'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import AppShell, { useAppSession } from '../components/AppShell'
import { NOTIFICATION_SELECT } from '../lib/queries'
import type { NotificationItem, NotificationType } from '../lib/types'
import { BellIcon, CloseIcon, CommentIcon, HeartIcon, ReplyIcon, UsersIcon, WhisperIcon } from '../components/icons'
import AnonAvatar from '../susurros/AnonAvatar'
import { ANON_NAME } from '../lib/whispers'

const PAGE_SIZE = 30

type Filter = 'all' | 'unread'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
}

function shorten(text: string, max = 90) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

const ACTION_TEXT: Record<NotificationType, string> = {
  like_post: 'le dio like a tu publicación',
  like_comment: 'le dio like a tu comentario',
  comment: 'comentó tu publicación',
  reply: 'respondió tu comentario',
  follow: 'empezó a seguirte',
  like_note: 'le dio like a tu nota',
  whisper_comment: 'comentó tu confesión en el Muro',
  whisper_reply: 'respondió tu comentario en el Muro',
}

function TypeIcon({ type }: { type: NotificationType }) {
  const cls = 'w-3 h-3'
  if (type === 'like_post' || type === 'like_comment' || type === 'like_note') return <HeartIcon filled className={cls} />
  if (type === 'whisper_comment' || type === 'whisper_reply') return <WhisperIcon className={cls} />
  if (type === 'comment') return <CommentIcon className={cls} />
  if (type === 'reply') return <ReplyIcon className={cls} />
  return <UsersIcon className={cls} />
}

function hrefFor(n: NotificationItem): string {
  if (n.type === 'follow') return n.actor ? `/perfil/${n.actor.username}` : '/'
  if (n.type === 'like_note') return '/mensajes'
  if (n.type === 'whisper_comment' || n.type === 'whisper_reply') {
    return n.whisper_id ? `/susurros/${n.whisper_id}${n.whisper_comment_id ? `?c=${n.whisper_comment_id}` : ''}` : '/susurros'
  }
  if (!n.post_id) return '/'
  const focus = n.comment_id && n.type !== 'like_post' ? `?c=${n.comment_id}` : ''
  return `/post/${n.post_id}${focus}`
}

function snippetFor(n: NotificationItem): string | null {
  if (n.type === 'follow') return null
  if (n.type === 'like_note') return n.note?.content ? shorten(n.note.content) : null
  if (n.type === 'whisper_comment' || n.type === 'whisper_reply') return n.wcomment?.content ? shorten(n.wcomment.content) : null
  if (n.type === 'like_post') {
    if (!n.post) return null
    if (n.post.content?.trim()) return shorten(n.post.content)
    return (n.post.images?.length ?? 0) > 0 ? 'Publicación con foto' : null
  }
  // like_comment, comment, reply → el comentario involucrado
  return n.comment?.content ? shorten(n.comment.content) : null
}

// Los "me gusta" sobre lo mismo se juntan: "Ana, Luis y 3 más le dieron like a tu publicación"
type NotifGroup = { key: string; head: NotificationItem; items: NotificationItem[] }

const PLURAL_ACTION: Partial<Record<NotificationType, string>> = {
  like_post: 'le dieron like a tu publicación',
  like_comment: 'le dieron like a tu comentario',
  like_note: 'le dieron like a tu nota',
}

function groupKey(n: NotificationItem): string {
  if (n.type === 'like_post' && n.post_id) return `lp:${n.post_id}`
  if (n.type === 'like_comment' && n.comment_id) return `lc:${n.comment_id}`
  if (n.type === 'like_note' && n.note_id) return `ln:${n.note_id}`
  return `one:${n.id}`
}

function groupNotifications(list: NotificationItem[]): NotifGroup[] {
  const map = new Map<string, NotifGroup>()
  for (const n of list) {
    const key = groupKey(n)
    const g = map.get(key)
    if (g) g.items.push(n)
    else map.set(key, { key, head: n, items: [n] })
  }
  return [...map.values()]
}

function actorLabel(g: NotifGroup): string {
  const names: string[] = []
  for (const x of g.items) {
    const name = x.actor?.id_student || x.actor?.username || 'Alguien'
    if (!names.includes(name)) names.push(name)
  }
  if (names.length <= 1) return names[0] ?? 'Alguien'
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names[0]}, ${names[1]} y ${names.length - 2} más`
}

export default function NotificacionesPage() {
  return (
    <AppShell>
      <NotificacionesContent />
    </AppShell>
  )
}

function NotificacionesContent() {
  const { userId, loading: sessionLoading, notificationsVersion, refreshNotifications } = useAppSession()
  const router = useRouter()

  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')
  const firstLoadDone = useRef(false)

  useEffect(() => {
    if (!sessionLoading && !userId) router.push('/login')
  }, [sessionLoading, userId, router])

  // Primera carga y recargas cuando llega algo nuevo en vivo (se mezcla con lo que ya estaba cargado)
  useEffect(() => {
    if (!userId) return
    const id = userId
    async function run() {
      const { data, error: err } = await supabase
        .from('notifications')
        .select(NOTIFICATION_SELECT)
        .eq('recipient_id', id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (err) {
        setError('No se pudieron cargar tus notificaciones. Revisa que hayas corrido el SQL de la v0.11.0 en Supabase.')
        setLoading(false)
        return
      }
      setError('')
      const fresh = (data as unknown as NotificationItem[]) ?? []
      if (!firstLoadDone.current) {
        firstLoadDone.current = true
        setItems(fresh)
        setHasMore(fresh.length === PAGE_SIZE)
      } else {
        setItems((prev) => {
          const byId = new Map(prev.map((n) => [n.id, n]))
          for (const n of fresh) byId.set(n.id, n)
          return [...byId.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        })
      }
      setLoading(false)
    }
    run()
  }, [userId, notificationsVersion])

  const loadMore = async () => {
    if (!userId || loadingMore || items.length === 0) return
    setLoadingMore(true)
    const last = items[items.length - 1]
    const { data } = await supabase
      .from('notifications')
      .select(NOTIFICATION_SELECT)
      .eq('recipient_id', userId)
      .lt('created_at', last.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    const more = (data as unknown as NotificationItem[]) ?? []
    setItems((prev) => {
      const seen = new Set(prev.map((n) => n.id))
      return [...prev, ...more.filter((n) => !seen.has(n.id))]
    })
    setHasMore(more.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  const markGroupRead = async (g: NotifGroup) => {
    const ids = g.items.filter((x) => !x.read).map((x) => x.id)
    if (ids.length === 0) return
    setItems((prev) => prev.map((x) => (ids.includes(x.id) ? { ...x, read: true } : x)))
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    refreshNotifications()
  }

  const markAllRead = async () => {
    if (!userId || markingAll) return
    setMarkingAll(true)
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId).eq('read', false)
    setMarkingAll(false)
    refreshNotifications()
  }

  const removeGroup = async (g: NotifGroup) => {
    const ids = g.items.map((x) => x.id)
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)))
    await supabase.from('notifications').delete().in('id', ids)
    refreshNotifications()
  }

  const unreadInList = useMemo(() => items.filter((n) => !n.read).length, [items])
  const visible = filter === 'unread' ? items.filter((n) => !n.read) : items

  if (sessionLoading || !userId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-display font-semibold text-neutral-50">Notificaciones</h1>
        {unreadInList > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="mt-1 shrink-0 text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
          >
            Marcar todo como leído
          </button>
        )}
      </div>
      <p className="text-neutral-500 text-sm mb-5">
        Likes, comentarios, respuestas y nuevos seguidores. Puedes elegir qué avisos recibir en Configuración.
      </p>

      <div className="flex gap-1.5 mb-4">
        {(
          [
            { id: 'all', label: 'Todas' },
            { id: 'unread', label: unreadInList > 0 ? `Sin leer (${unreadInList})` : 'Sin leer' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`text-xs rounded-full px-3.5 py-1.5 transition ${
              filter === f.id
                ? 'bg-garnet-600 text-white'
                : 'border border-ink-600 text-neutral-400 hover:bg-ink-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-garnet-400 mb-4">{error}</p>}

      {visible.length === 0 && !error ? (
        <div className="surface-card rounded-2xl p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-ink-700 flex items-center justify-center text-garnet-400">
            <BellIcon className="w-6 h-6" />
          </div>
          <p className="text-neutral-200 text-sm font-medium">
            {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'Todavía no tienes notificaciones'}
          </p>
          <p className="text-neutral-500 text-xs max-w-xs">
            {filter === 'unread'
              ? 'Estás al día. Cuando pase algo nuevo, te va a aparecer aquí y en la campana.'
              : 'Cuando alguien le dé like a lo que publicas, te comente, te responda o te siga, lo vas a ver aquí.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groupNotifications(visible).map((g) => {
            const n = g.head
            const many = g.items.length > 1
            const unread = g.items.some((x) => !x.read)
            // En el Muro, si el comentario es anónimo no se muestra a nadie (ni foto ni @usuario)
            const anon = !!n.anonymous
            const actorName = anon ? ANON_NAME : many ? actorLabel(g) : n.actor?.id_student || n.actor?.username || 'Alguien'
            const snippet = snippetFor(n)
            return (
              <li key={g.key} className="relative group">
                <Link
                  href={hrefFor(n)}
                  onClick={() => markGroupRead(g)}
                  className={`flex items-start gap-3 rounded-2xl p-3.5 pr-10 transition border ${
                    !unread
                      ? 'surface-card border-transparent hover:bg-ink-700'
                      : 'bg-garnet-700/10 border-garnet-700/40 hover:bg-garnet-700/20'
                  }`}
                >
                  <div className="relative shrink-0">
                    {anon ? (
                      <AnonAvatar size="w-10 h-10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-ink-700 flex items-center justify-center">
                        {n.actor?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img loading="lazy" decoding="async" src={n.actor.avatar_url} alt={n.actor.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-garnet-400">
                            {(n.actor?.username ?? '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full bg-garnet-600 text-white border-2 border-ink-800 flex items-center justify-center">
                      <TypeIcon type={n.type} />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 leading-snug">
                    <p className="text-sm text-neutral-200">
                      <span className="font-bold text-neutral-50">{actorName}</span>{' '}
                      {!anon && !many && n.actor && <span className="text-neutral-600 text-xs">@{n.actor.username} </span>}
                      {many ? (PLURAL_ACTION[n.type] ?? ACTION_TEXT[n.type]) : ACTION_TEXT[n.type]}
                    </p>
                    {snippet && (
                      <p className="mt-1 text-xs text-neutral-500 border-l-2 border-ink-600 pl-2 break-words">
                        {snippet}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-neutral-600" title={fullDate(n.created_at)}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {unread && <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-garnet-500 shrink-0" aria-label="Sin leer" />}
                </Link>

                <button
                  type="button"
                  onClick={() => removeGroup(g)}
                  aria-label="Eliminar notificación"
                  title="Eliminar notificación"
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-neutral-600 hover:text-garnet-400 hover:bg-ink-700 transition opacity-60 group-hover:opacity-100"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && filter === 'all' && (
        <div className="flex justify-center mt-5">
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
