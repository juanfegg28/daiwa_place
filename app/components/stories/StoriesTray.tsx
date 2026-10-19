'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSession } from '../AppShell'
import AvatarPhoto from '../AvatarPhoto'
import { ChevronLeftIcon, ChevronRightIcon, LockIcon, PlusIcon } from '../icons'
import StoryRing, { rememberOrigin } from './StoryRing'
import {
  STORIES_CHANGED_EVENT,
  fetchQuota,
  fetchStoriesOf,
  fetchTray,
  quotaMessage,
  readOwnSeen,
  ownerLabel,
  type Quota,
  type StoryRow,
  type TrayEntry,
} from '../../lib/stories'

function Avatar({ url, username, size }: { url: string | null; username: string; size: number }) {
  return (
    <span className="relative block w-full h-full rounded-full overflow-hidden bg-ink-700 flex items-center justify-center" style={{ fontSize: size / 3 }}>
      {url ? (
        <AvatarPhoto src={url} username={username} sizes="96px" textClass="text-xl" />
      ) : (
        <span className="font-semibold text-garnet-400">{username.charAt(0).toUpperCase()}</span>
      )}
    </span>
  )
}

/**
 * Bandeja de historias del Inicio (v1.2.0): tu historia primero, luego tus amigos (mutuals) y después las demás
 * personas que sigues. Dentro de cada grupo, primero las no vistas. Las imágenes NO se piden hasta abrir el visor.
 */
export default function StoriesTray() {
  const router = useRouter()
  const { userId, username, avatarUrl, onlineIds } = useAppSession()
  const [tray, setTray] = useState<TrayEntry[]>([])
  const [mine, setMine] = useState<StoryRow[]>([])
  const [quota, setQuota] = useState<Quota | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toast, setToast] = useState('')
  const [ownSeen, setOwnSeen] = useState<Set<string>>(new Set())
  const [pulseIds, setPulseIds] = useState<Set<string>>(new Set())
  const [followingFew, setFollowingFew] = useState(false)
  const prevLatest = useRef<Map<string, string> | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    const [t, own, q] = await Promise.all([fetchTray(), fetchStoriesOf(userId), fetchQuota()])
    if (t.error && !t.tray.length) {
      setError(true)
      setLoading(false)
      return
    }
    setError(false)
    // un anillo de historia NUEVA (llegó mientras tienes la pantalla abierta) hace un pulso, una sola vez
    const prev = prevLatest.current
    const next = new Map(t.tray.map((x) => [x.user_id, x.latest_at]))
    if (prev) {
      const fresh = t.tray.filter((x) => x.unseen_count > 0 && (!prev.has(x.user_id) || prev.get(x.user_id) !== x.latest_at)).map((x) => x.user_id)
      if (fresh.length) {
        setPulseIds(new Set(fresh))
        window.setTimeout(() => setPulseIds(new Set()), 1200)
      }
    }
    prevLatest.current = next
    setTray(t.tray)
    setMine(own.stories)
    setQuota(q.quota)
    setOwnSeen(readOwnSeen())
    setFollowingFew(t.tray.length < 3)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    function run() {
      void load()
    }
    run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    const onChanged = () => void load()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(STORIES_CHANGED_EVENT, onChanged)
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 60000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(STORIES_CHANGED_EVENT, onChanged)
      window.clearInterval(interval)
    }
  }, [load])

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const first = window.setTimeout(updateArrows, 0)
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      window.clearTimeout(first)
      ro.disconnect()
    }
  }, [updateArrows, tray.length, loading])

  // «Historia publicada · Te quedan 1 de 3 hoy» (lo deja el editor al terminar)
  const [published, setPublished] = useState<{ left: number; max: number } | null>(null)
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('daiwa_story_published')
      if (!raw) return
      window.sessionStorage.removeItem('daiwa_story_published')
      const v = JSON.parse(raw) as { left: number; max: number }
      function show() {
        setPublished(v)
      }
      show()
      const t = window.setTimeout(() => setPublished(null), 5000)
      return () => window.clearTimeout(t)
    } catch {
      /* sin almacenamiento */
    }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3200)
  }

  if (!userId || !username) return null

  const scrollByPage = (dir: 1 | -1) => scrollRef.current?.scrollBy({ left: dir * Math.max(180, (scrollRef.current?.clientWidth ?? 300) * 0.75), behavior: 'smooth' })

  const canCreate = !!quota && quota.used < quota.max
  const goCreate = () => {
    if (quota && !canCreate) {
      showToast(quotaMessage(quota))
      return
    }
    router.push('/historias/nueva')
  }

  const openMine = (e: React.MouseEvent) => {
    if (mine.length === 0) {
      goCreate()
      return
    }
    rememberOrigin(e.currentTarget)
    router.push(`/historias/${username}`)
  }

  const mineSegments = mine.map((s) => ({ seen: ownSeen.has(s.id), friends: s.audience === 'friends' }))
  const arrowCls =
    'hidden md:flex absolute top-[40px] -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-ink-800/95 border border-ink-600 text-neutral-200 shadow-lg hover:bg-ink-700 hover:text-white transition'

  return (
    <div className="relative mb-3 sm:mb-4 -mx-1">
      {canLeft && (
        <button type="button" onClick={() => scrollByPage(-1)} className={`${arrowCls} left-0`} aria-label="Ver historias anteriores">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
      )}
      {canRight && (
        <button type="button" onClick={() => scrollByPage(1)} className={`${arrowCls} right-0`} aria-label="Ver más historias">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      )}

      <div ref={scrollRef} onScroll={updateArrows} className="flex gap-1.5 md:gap-2 overflow-x-auto px-1 pt-1 pb-2 scroll-smooth story-scroll-hide">
        {/* Tu historia */}
        <div className="shrink-0 flex flex-col items-center w-[78px] md:w-[88px] story-tray-in">
          <div className="relative">
            <button
              type="button"
              onClick={openMine}
              aria-label={mine.length ? 'Ver tu historia' : 'Crear una historia'}
              className="rounded-full touch-manipulation focus-visible:ring-2 focus-visible:ring-garnet-400 outline-none"
            >
              <span className="md:hidden">
                    <StoryRing avatarSize={64} segments={mineSegments} uid="mine">
                <Avatar url={avatarUrl} username={username} size={64} />
              </StoryRing>
                  </span>
              <span className="hidden md:inline-flex">
                    <StoryRing avatarSize={72} segments={mineSegments} uid="mine-d">
                <Avatar url={avatarUrl} username={username} size={72} />
              </StoryRing>
                  </span>
            </button>
            <button
              type="button"
              onClick={goCreate}
              aria-label={canCreate || !quota ? 'Crear una historia' : 'Ya no te quedan historias hoy'}
              className={`absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border-2 border-ink-950 flex items-center justify-center text-white ${canCreate || !quota ? 'bg-garnet-600' : 'bg-ink-500'}`}
            >
              {canCreate || !quota ? <PlusIcon className="w-3 h-3" /> : <LockIcon className="w-2.5 h-2.5" />}
            </button>
          </div>
          <span className="mt-1 w-full truncate text-center text-[12px] text-neutral-300">Tu historia</span>
        </div>

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 flex flex-col items-center w-[78px] md:w-[88px] animate-pulse">
              <span className="w-[73px] h-[73px] md:w-[81px] md:h-[81px] rounded-full bg-ink-800" />
              <span className="mt-1.5 h-2.5 w-12 rounded bg-ink-800" />
            </div>
          ))}

        {!loading &&
          tray.map((u, i) => {
            const label = ownerLabel(u)
            const segs = u.segments.length ? u.segments : [{ seen: u.unseen_count === 0, friends: u.all_friends_only }]
            const online = u.is_friend && onlineIds.has(u.user_id)
            return (
              <button
                key={u.user_id}
                type="button"
                onClick={(e) => {
                  rememberOrigin(e.currentTarget)
                  router.push(`/historias/${u.username}`)
                }}
                aria-label={`Historias de ${label}`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className={`story-tray-in shrink-0 flex flex-col items-center w-[78px] md:w-[88px] touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-garnet-400 rounded-xl ${u.is_muted ? 'opacity-55' : ''}`}
              >
                <span className="relative">
                  <span className="md:hidden">
                    <StoryRing avatarSize={64} segments={segs} pulse={pulseIds.has(u.user_id)} uid={`t${i}`}>
                    <Avatar url={u.avatar_url} username={u.username} size={64} />
                  </StoryRing>
                  </span>
                  <span className="hidden md:inline-flex">
                    <StoryRing avatarSize={72} segments={segs} pulse={pulseIds.has(u.user_id)} uid={`td${i}`}>
                    <Avatar url={u.avatar_url} username={u.username} size={72} />
                  </StoryRing>
                  </span>
                  {u.all_friends_only && (
                    <span className="absolute -bottom-0.5 right-0 rounded-full bg-emerald-600 text-white text-[9.5px] font-semibold leading-none px-1.5 py-[3px] border-2 border-ink-950">
                      Amigos
                    </span>
                  )}
                  {online && (
                    <span title="Conectado" className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-ink-950" />
                  )}
                </span>
                <span className="mt-1 w-full truncate text-center text-[12px] text-neutral-300">{label}</span>
              </button>
            )
          })}
      </div>

      {error && (
        <p className="px-2 text-xs text-neutral-500">
          No se pudieron cargar las historias ·{' '}
          <button type="button" onClick={() => void load()} className="text-garnet-400 underline">
            Reintentar
          </button>
        </p>
      )}
      {!loading && !error && tray.length === 0 && followingFew && (
        <p className="px-2 -mt-1 text-[12px] text-neutral-500">Aquí verás las historias de las personas que sigues.</p>
      )}
      {published && (
        <p role="status" className="mx-2 mt-1 flex items-center justify-between gap-3 rounded-lg bg-emerald-600/15 border border-emerald-600/30 px-3 py-2 text-xs text-emerald-200">
          <span>Historia publicada · Te quedan {published.left} de {published.max} hoy</span>
          <button type="button" onClick={() => router.push(`/historias/${username}`)} className="font-semibold underline">Ver</button>
        </p>
      )}
      {toast && (
        <p role="status" className="mx-2 mt-1 rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-xs text-neutral-200">
          {toast}
        </p>
      )}
    </div>
  )
}
