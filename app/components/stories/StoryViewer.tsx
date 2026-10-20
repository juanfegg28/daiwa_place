'use client'

import Avatar from '../cosmetics/Avatar'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, CopyIcon, EyeIcon, FlagIcon, MoreIcon, PauseIcon, PlayIcon, StarIcon, TrashIcon, ArchiveIcon, HeartIcon, BlockIcon } from '../icons'
import { supabase } from '../../lib/supabaseClient'
import { useStoryAudio } from '../../lib/useStoryAudio'
import {
  addOwnSeen,
  deleteStory,
  emitStoriesChanged,
  fetchHighlightStories,
  fetchHighlights,
  fetchStoriesOf,
  fetchTray,
  fullDateLabel,
  markStoryViewed,
  ownerLabel,
  replyToStory,
  setStoryLike,
  setStoryMute,
  signedStoryUrls,
  storyAgo,
  trackFromStory,
  type StoryOwner,
  type StoryRow,
  type TrayEntry,
} from '../../lib/stories'
import StoryCanvas from './StoryCanvas'
import Sheet from './Sheet'
import ProgressBars from './viewer/ProgressBars'
import SoundControl from './viewer/SoundControl'
import ReplyBar, { type ReplyBarHandle } from './viewer/ReplyBar'
import ViewersSheet from './viewer/ViewersSheet'
import StoryReportDialog from './StoryReportDialog'
import HighlightPickerSheet from './HighlightPickerSheet'

type Group = {
  key: string
  owner: StoryOwner
  stories: StoryRow[] | null
  highlight?: { id: string; title: string }
  isFriend: boolean
  muted: boolean
}

type Me = { id: string; username: string; id_student: string | null; avatar_url: string | null }

const SHORTCUTS: [string, string][] = [
  ['← →', 'Historia anterior / siguiente'],
  ['Espacio', 'Pausa o continúa'],
  ['M', 'Silencia o activa el sonido'],
  ['↑ ↓', 'Volumen ±5 %'],
  ['L', 'Like'],
  ['R', 'Escribir una respuesta'],
  ['Esc', 'Cerrar'],
]

export default function StoryViewer({
  username,
  storyId,
  highlightId,
  openViewers,
}: {
  username: string
  storyId: string | null
  highlightId: string | null
  openViewers: boolean
}) {
  const router = useRouter()
  const audio = useStoryAudio()
  const [me, setMe] = useState<Me | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [gi, setGi] = useState(0)
  const [si, setSi] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'gone'>('loading')
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [readyId, setReadyId] = useState<string | null>(null)
  const [imgErrorId, setImgErrorId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [replyFocus, setReplyFocus] = useState(false)
  const [volDrag, setVolDrag] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([])
  const [floaters, setFloaters] = useState<{ id: number; emoji: string; left: number; delay: number }[]>([])
  const [replyStatus, setReplyStatus] = useState('')
  const [replyModes, setReplyModes] = useState<Record<string, string>>({})
  const [blockedOwners, setBlockedOwners] = useState<Set<string>>(new Set())
  const [mutedOwners, setMutedOwners] = useState<Set<string>>(new Set())
  const [viewersOpen, setViewersOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hint, setHint] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)
  const [anim, setAnim] = useState<{ dir: 'left' | 'right'; n: number } | null>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const [hoverSide, setHoverSide] = useState<'prev' | 'next' | null>(null)
  const [closing, setClosing] = useState(false)
  const [copied, setCopied] = useState(false)

  const elapsedRef = useRef(0)
  const markedRef = useRef<Set<string>>(new Set())
  const groupsRef = useRef<Group[]>([])
  const loadingGroups = useRef<Set<string>>(new Set())
  const replyRef = useRef<ReplyBarHandle | null>(null)
  const hintShown = useRef(false)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const idleTimer = useRef<number | null>(null)
  const goNextRef = useRef<() => void>(() => {})
  const switchGroupRef = useRef<(t: number, w?: 'first' | 'last', d?: 'left' | 'right') => void>(() => {})
  const gesture = useRef({ x: 0, y: 0, t: 0, moved: false, holding: false, hold: 0, tap: 0, lastTap: 0, active: false })
  const initDone = useRef(false)

  useEffect(() => {
    groupsRef.current = groups
  }, [groups])

  const group = groups[gi]
  const story = group?.stories?.[si] ?? null
  const isMine = !!me && !!story && story.user_id === me.id
  const isHighlight = !!group?.highlight
  const track = useMemo(() => (story ? trackFromStory(story) : null), [story])
  const mediaUrl = story?.media_path ? urls[story.media_path] ?? null : null
  const ready = !!story && (story.kind === 'text' || readyId === story.id)
  const anySheet = viewersOpen || menuOpen || reportOpen || deleteOpen || pickerOpen || shortcutsOpen
  const running = ready && !holding && !userPaused && !replyFocus && !volDrag && !tabHidden && !anySheet && !closing && imgErrorId !== story?.id
  const canLike = !!story && !isMine && !isHighlight && story.is_active

  // ───────── carga de una persona (sus historias + enlaces firmados) ─────────
  const loadGroup = useCallback(async (key: string): Promise<StoryRow[]> => {
    const g = groupsRef.current.find((x) => x.key === key)
    if (!g) return []
    if (g.stories) return g.stories
    if (loadingGroups.current.has(key)) return []
    loadingGroups.current.add(key)
    let list: StoryRow[] = []
    if (g.highlight) list = await fetchHighlightStories(g.highlight.id)
    else {
      const res = await fetchStoriesOf(g.owner.user_id)
      list = res.stories.filter((s) => new Date(s.expires_at).getTime() > Date.now())
    }
    const paths = list.map((s) => s.media_path).filter((p): p is string => !!p)
    if (paths.length) {
      const map = await signedStoryUrls(paths)
      setUrls((prev) => ({ ...prev, ...map }))
    }
    const { data } = await supabase.from('profiles').select('story_replies').eq('id', g.owner.user_id).maybeSingle()
    setReplyModes((prev) => ({ ...prev, [g.owner.user_id]: (data as { story_replies?: string } | null)?.story_replies ?? 'all' }))
    setLikedMap((prev) => {
      const next = { ...prev }
      for (const s of list) if (next[s.id] === undefined) next[s.id] = s.liked_by_me
      return next
    })
    loadingGroups.current.delete(key)
    setGroups((prev) => prev.map((x) => (x.key === key ? { ...x, stories: list } : x)))
    return list
  }, [])

  // ───────── arranque ─────────
  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    async function init() {
      try {
        const raw = window.sessionStorage.getItem('daiwa_story_origin')
        if (raw) setOrigin(JSON.parse(raw))
        window.sessionStorage.removeItem('daiwa_story_origin')
      } catch {
        /* sin almacenamiento */
      }
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.replace('/login')
        return
      }
      const { data: mine } = await supabase.from('profiles').select('id, username, id_student, avatar_url').eq('id', auth.user.id).maybeSingle()
      if (!mine) {
        setPhase('gone')
        return
      }
      const meRow = mine as Me
      setMe(meRow)
      const asOwner = (p: Me): StoryOwner => ({ user_id: p.id, username: p.username, id_student: p.id_student, avatar_url: p.avatar_url })

      let target: Me | null = meRow
      if (username.toLowerCase() !== meRow.username.toLowerCase()) {
        const { data } = await supabase.from('profiles').select('id, username, id_student, avatar_url').eq('username', username).maybeSingle()
        target = (data as Me | null) ?? null
      }
      if (!target) {
        setPhase('gone')
        return
      }
      const owner = asOwner(target)
      let list: Group[] = []
      let start = 0

      if (highlightId) {
        const hs = await fetchHighlights(owner.user_id)
        list = hs.map((h) => ({ key: `h:${h.id}`, owner, highlight: { id: h.id, title: h.title }, stories: null, isFriend: false, muted: false }))
        start = list.findIndex((g) => g.highlight?.id === highlightId)
        if (start < 0) {
          list = [{ key: `h:${highlightId}`, owner, highlight: { id: highlightId, title: 'Destacada' }, stories: null, isFriend: false, muted: false }, ...list]
          start = 0
        }
      } else {
        const { tray } = await fetchTray()
        const fromTray = (t: TrayEntry): Group => ({
          key: t.user_id,
          owner: { user_id: t.user_id, username: t.username, id_student: t.id_student, avatar_url: t.avatar_url, is_friend: t.is_friend },
          stories: null,
          isFriend: t.is_friend,
          muted: t.is_muted,
        })
        const others = tray.map(fromTray)
        if (target.id === meRow.id) {
          list = [{ key: meRow.id, owner, stories: null, isFriend: false, muted: false }, ...others]
          start = 0
        } else {
          list = others
          start = others.findIndex((g) => g.owner.user_id === owner.user_id)
          if (start < 0) {
            list = [{ key: owner.user_id, owner, stories: null, isFriend: false, muted: false }, ...others]
            start = 0
          }
        }
        setMutedOwners(new Set(tray.filter((t) => t.is_muted).map((t) => t.user_id)))
      }
      groupsRef.current = list
      setGroups(list)
      setGi(start)
      const loaded = await loadGroup(list[start].key)
      if (loaded.length === 0) {
        setPhase('gone')
        return
      }
      let idx = 0
      if (storyId) {
        const f = loaded.findIndex((s) => s.id === storyId)
        idx = f >= 0 ? f : 0
      } else if (!highlightId && target.id !== meRow.id) {
        const f = loaded.findIndex((s) => !s.seen)
        idx = f >= 0 ? f : 0
      }
      setSi(idx)
      setPhase('ready')
      if (openViewers && target.id === meRow.id) setViewersOpen(true)
    }
    void init()
  }, [username, storyId, highlightId, openViewers, router, loadGroup])

  // precarga: la persona anterior y la siguiente (para los vecinos de PC y el cambio rápido)
  useEffect(() => {
    if (phase !== 'ready') return
    for (const k of [groups[gi + 1]?.key, groups[gi - 1]?.key]) if (k) void loadGroup(k)
  }, [phase, gi, groups, loadGroup])

  // precarga de la imagen de la historia siguiente
  useEffect(() => {
    const next = group?.stories?.[si + 1] ?? groups[gi + 1]?.stories?.[0]
    const url = next?.media_path ? urls[next.media_path] : null
    if (url) {
      const i = new Image()
      i.src = url
    }
  }, [group, groups, gi, si, urls])

  // ───────── imagen actual lista / con error ─────────
  useEffect(() => {
    if (!story || story.kind === 'text') return
    const url = mediaUrl
    if (!url) {
      // el enlace firmado todavía no llegó (o caducó): se pide de nuevo
      if (story.media_path) {
        signedStoryUrls([story.media_path]).then((map) => setUrls((prev) => ({ ...prev, ...map })))
      }
      return
    }
    const img = new Image()
    img.onload = () => setReadyId(story.id)
    img.onerror = () => setImgErrorId(story.id)
    img.src = url
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [story, mediaUrl])

  // ───────── cambio de historia: reinicia el tiempo ─────────
  const storyKey = story?.id ?? null
  useEffect(() => {
    elapsedRef.current = 0
    function reset() {
      setProgress(0)
    }
    reset()
    if (!story) return
    if (story.user_id === me?.id) addOwnSeen(story.id)
    if (track && audio.muted && !hintShown.current) {
      hintShown.current = true
      setHint(true)
      const id = window.setTimeout(() => setHint(false), 4000)
      return () => window.clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyKey])

  // dirección en la URL (sin llenar el historial)
  useEffect(() => {
    if (phase !== 'ready' || !group || !story) return
    const q = new URLSearchParams()
    q.set('s', story.id)
    if (group.highlight) q.set('h', group.highlight.id)
    try {
      window.history.replaceState(window.history.state, '', `/historias/${group.owner.username}?${q.toString()}`)
    } catch {
      /* ignorar */
    }
  }, [phase, group, story])

  // ───────── navegación ─────────
  const close = useCallback(() => {
    setClosing(true)
    emitStoriesChanged()
    window.setTimeout(() => {
      if (window.history.length > 1) router.back()
      else router.push('/')
    }, 140)
  }, [router])

  const switchGroup = useCallback(
    async (target: number, where: 'first' | 'last' = 'first', dir: 'left' | 'right' = 'left') => {
      const list = groupsRef.current
      if (target < 0) {
        close()
        return
      }
      if (target >= list.length) {
        close()
        return
      }
      const loaded = await loadGroup(list[target].key)
      const stories = loaded.length ? loaded : groupsRef.current[target]?.stories ?? []
      if (stories.length === 0) {
        // nada que ver ahí (venció o dejó de ser visible): se salta
        const nextTarget = target + (dir === 'left' ? 1 : -1)
        if (nextTarget < 0 || nextTarget >= list.length) close()
        else switchGroupRef.current(nextTarget, where, dir)
        return
      }
      setAnim((a) => ({ dir, n: (a?.n ?? 0) + 1 }))
      setGi(target)
      setSi(where === 'last' ? stories.length - 1 : Math.max(0, stories.findIndex((s) => !s.seen && !list[target].highlight)))
      setReadyId(null)
    },
    [close, loadGroup]
  )

  useEffect(() => {
    switchGroupRef.current = (t, w, d) => void switchGroup(t, w, d)
  }, [switchGroup])

  const goNext = useCallback(() => {
    const g = groupsRef.current[gi]
    const len = g?.stories?.length ?? 0
    if (si < len - 1) {
      setSi(si + 1)
      return
    }
    void switchGroup(gi + 1, 'first', 'left')
  }, [gi, si, switchGroup])

  const goPrev = useCallback(() => {
    if (si > 0) {
      setSi(si - 1)
      elapsedRef.current = 0
      setProgress(0)
      return
    }
    if (gi === 0) {
      elapsedRef.current = 0
      setProgress(0)
      return
    }
    void switchGroup(gi - 1, 'last', 'right')
  }, [gi, si, switchGroup])

  useEffect(() => {
    goNextRef.current = goNext
  }, [goNext])

  // ───────── temporizador (requestAnimationFrame: acumula tiempo transcurrido) ─────────
  useEffect(() => {
    if (!running || !story) return
    let raf = 0
    let last = performance.now()
    let lastRender = 0
    const duration = story.duration_ms
    const id = story.id
    const mine = story.user_id === me?.id
    const tick = (now: number) => {
      elapsedRef.current += now - last
      last = now
      if (!mine && !isHighlight && !markedRef.current.has(id) && elapsedRef.current >= 1000) {
        markedRef.current.add(id)
        void markStoryViewed(id)
        setGroups((prev) => prev.map((g) => ({ ...g, stories: g.stories ? g.stories.map((s) => (s.id === id ? { ...s, seen: true } : s)) : g.stories })))
      }
      if (elapsedRef.current >= duration) {
        setProgress(1)
        goNextRef.current()
        return
      }
      if (now - lastRender > 60) {
        lastRender = now
        setProgress(elapsedRef.current / duration)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, story, me?.id, isHighlight])

  // ───────── audio: se reconcilia con lo que corresponde a esta historia ─────────
  const trackRef = useMemo(
    () => (track && story ? { id: track.id, start: story.music_start, clip: story.music_clip } : null),
    [track, story]
  )
  const { sync } = audio
  useEffect(() => {
    sync(trackRef, running, () => elapsedRef.current)
  }, [trackRef, running, audio.muted, sync])

  const musicPlaying = audio.playing && !audio.muted && !!track
  const musicProgress = story ? Math.min(1, (progress * story.duration_ms) / 1000 / Math.max(1, story.music_clip)) : 0

  // pestaña oculta → pausa
  useEffect(() => {
    const on = () => setTabHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  // bloquea el scroll de fondo
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // ───────── like ─────────
  const setLike = useCallback(
    async (like: boolean) => {
      if (!story || !me || !canLike) return
      const id = story.id
      setLikedMap((m) => ({ ...m, [id]: like }))
      const err = await setStoryLike(id, me.id, like)
      if (err) {
        setLikedMap((m) => ({ ...m, [id]: !like }))
        setReplyStatus(err)
        window.setTimeout(() => setReplyStatus(''), 2500)
      }
    },
    [story, me, canLike]
  )
  const liked = !!story && !!likedMap[story.id]

  const burstHeart = (x: number, y: number) => {
    const id = Date.now() + Math.random()
    setHearts((h) => [...h, { id, x, y }])
    window.setTimeout(() => setHearts((h) => h.filter((v) => v.id !== id)), 760)
  }

  // ───────── responder ─────────
  const ownerReplyBlocked = useMemo(() => {
    if (!group) return null
    const uid = group.owner.user_id
    const mode = replyModes[uid] ?? 'all'
    if (blockedOwners.has(uid) || mode === 'off' || (mode === 'friends' && !group.isFriend)) {
      return `@${group.owner.username} no permite respuestas a sus historias`
    }
    return null
  }, [group, replyModes, blockedOwners])

  const flashStatus = (msg: string) => {
    setReplyStatus(msg)
    window.setTimeout(() => setReplyStatus(''), 2200)
  }

  const sendReply = useCallback(
    async (text: string): Promise<boolean> => {
      if (!story || !group) return false
      const res = await replyToStory(story.id, text)
      if (!res.ok) {
        if (/no permite respuestas/i.test(res.error ?? '')) setBlockedOwners((s) => new Set(s).add(group.owner.user_id))
        flashStatus(res.error ?? 'No se pudo enviar.')
        return false
      }
      flashStatus(res.isRequest ? 'Enviado como solicitud de mensaje.' : 'Respuesta enviada')
      return true
    },
    [story, group]
  )

  const sendReaction = useCallback(
    async (emoji: string) => {
      const ok = await sendReply(emoji)
      if (!ok) return
      const base = Date.now()
      setFloaters((f) => [...f, ...Array.from({ length: 7 }).map((_, i) => ({ id: base + i, emoji, left: 12 + Math.random() * 76, delay: i * 90 }))])
      window.setTimeout(() => setFloaters((f) => f.filter((x) => x.id < base || x.id > base + 7)), 2200)
    },
    [sendReply]
  )

  // ───────── gestos del escenario ─────────
  const onPointerDown = (e: React.PointerEvent) => {
    const g = gesture.current
    g.active = true
    g.x = e.clientX
    g.y = e.clientY
    g.t = Date.now()
    g.moved = false
    g.holding = false
    window.clearTimeout(g.hold)
    g.hold = window.setTimeout(() => {
      g.holding = true
      setHolding(true)
      setUiVisible(false)
    }, 260)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (e.pointerType === 'mouse' && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect()
      const fx = (e.clientX - r.left) / r.width
      setHoverSide(fx < 0.33 ? 'prev' : 'next')
    }
    if (!g.active) return
    if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 12) {
      g.moved = true
      if (!g.holding) window.clearTimeout(g.hold)
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g.active) return
    g.active = false
    window.clearTimeout(g.hold)
    if (g.holding) {
      g.holding = false
      setHolding(false)
      setUiVisible(true)
      return
    }
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) {
      if (dy > 0) close()
      else if (isMine) setViewersOpen(true)
      else if (!isHighlight) replyRef.current?.focus()
      return
    }
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) void switchGroup(gi + 1, 'first', 'left')
      else void switchGroup(gi - 1, 'last', 'right')
      return
    }
    if (g.moved) return
    const r = stageRef.current?.getBoundingClientRect()
    const fx = r ? (e.clientX - r.left) / r.width : 0.7
    const fy = r ? (e.clientY - r.top) / r.height : 0.5
    const side: 'prev' | 'next' = fx < 0.33 ? 'prev' : 'next'
    const now = Date.now()
    if (canLike && now - g.lastTap < 300) {
      window.clearTimeout(g.tap)
      g.lastTap = 0
      burstHeart(fx * 100, fy * 100)
      if (!liked) void setLike(true)
      return
    }
    g.lastTap = now
    const nav = () => (side === 'prev' ? goPrev() : goNext())
    if (canLike) g.tap = window.setTimeout(nav, 240)
    else nav()
  }
  const onPointerCancel = () => {
    const g = gesture.current
    g.active = false
    window.clearTimeout(g.hold)
    if (g.holding) {
      g.holding = false
      setHolding(false)
      setUiVisible(true)
    }
  }

  // mostrar/ocultar controles de PC tras 2 s sin mover el ratón
  const wakeUi = () => {
    setUiVisible(true)
    if (idleTimer.current) window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => {
      if (!gesture.current.holding) setUiVisible(false)
    }, 2000)
  }

  // ───────── teclado (PC) ─────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
      if (typing) return
      if (anySheet) return
      switch (e.key) {
        case 'ArrowRight':
          goNext()
          break
        case 'ArrowLeft':
          goPrev()
          break
        case ' ':
          e.preventDefault()
          setUserPaused((v) => !v)
          break
        case 'm':
        case 'M':
          audio.toggleMuted()
          break
        case 'ArrowUp':
          e.preventDefault()
          audio.setVolume(audio.volume + 0.05)
          break
        case 'ArrowDown':
          e.preventDefault()
          audio.setVolume(audio.volume - 0.05)
          break
        case 'l':
        case 'L':
          if (canLike) {
            burstHeart(50, 45)
            void setLike(!liked)
          }
          break
        case 'r':
        case 'R':
          if (!isMine && !isHighlight) {
            e.preventDefault()
            replyRef.current?.focus()
          }
          break
        case 'Escape':
          close()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [anySheet, goNext, goPrev, audio, canLike, liked, setLike, close, isMine, isHighlight])

  // ───────── acciones del menú ─────────
  const doDelete = async () => {
    if (!story) return
    setDeleting(true)
    const err = await deleteStory(story.id)
    setDeleting(false)
    setDeleteOpen(false)
    if (err) {
      flashStatus(err)
      return
    }
    emitStoriesChanged()
    const gKey = group?.key
    const remaining = (group?.stories ?? []).filter((s) => s.id !== story.id)
    setGroups((prev) => prev.map((g) => (g.key === gKey ? { ...g, stories: remaining } : g)))
    if (remaining.length === 0) close()
    else setSi(Math.min(si, remaining.length - 1))
  }

  const toggleMute = async () => {
    if (!group) return
    const uid = group.owner.user_id
    const mute = !mutedOwners.has(uid)
    const err = await setStoryMute(uid, mute)
    setMenuOpen(false)
    if (err) {
      flashStatus(err)
      return
    }
    setMutedOwners((s) => {
      const n = new Set(s)
      if (mute) n.add(uid)
      else n.delete(uid)
      return n
    })
    emitStoriesChanged()
    flashStatus(mute ? `Silenciaste las historias de @${group.owner.username}` : 'Historias reactivadas')
  }

  const copyProfileLink = async () => {
    if (!group) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/perfil/${group.owner.username}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      flashStatus('No se pudo copiar el enlace')
    }
    setMenuOpen(false)
  }

  // ───────── pantallas de estado ─────────
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <span className="w-9 h-9 rounded-full border-2 border-white/25 border-t-white animate-spin" aria-label="Cargando" />
      </div>
    )
  }
  if (phase === 'gone' || !group || !story) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-base font-medium">Esta historia ya no está disponible</p>
        <button type="button" onClick={close} className="rounded-full bg-garnet-600 hover:bg-garnet-500 px-6 py-2.5 text-sm font-medium">
          Volver
        </button>
      </div>
    )
  }

  const stories = group.stories ?? []
  const label = ownerLabel(group.owner)
  const hasUnseenMore = stories.some((s) => !s.seen && s.user_id !== me?.id)
  const originStyle = origin ? { transformOrigin: `${origin.x}px ${origin.y}px` } : undefined
  const animClass = anim ? (anim.dir === 'left' ? 'story-cube-left' : 'story-cube-right') : ''
  const prevGroup = groups[gi - 1]
  const nextGroup = groups[gi + 1]
  const uiOn = uiVisible && !holding

  const renderNeighbor = (g: Group, side: 'left' | 'right') => {
    const first = g.stories?.[0]
    const url = first?.media_path ? urls[first.media_path] : null
    return (
      <button
        key={`n-${side}`}
        type="button"
        onClick={() => void switchGroup(side === 'left' ? gi - 1 : gi + 1, side === 'left' ? 'last' : 'first', side === 'left' ? 'right' : 'left')}
        aria-label={`Ir a ${g.highlight ? g.highlight.title : ownerLabel(g.owner)}`}
        className="hidden xl:flex flex-col items-center gap-2 opacity-55 hover:opacity-90 transition-opacity w-[170px] shrink-0"
        style={{ transform: 'scale(.9)' }}
      >
        <span className="w-full rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: '9 / 16', background: '#17171b' }}>
          {first ? (
            <StoryCanvas bg={first.bg} mediaUrl={url} elements={first.elements} track={null} animate={false} />
          ) : (
            <span className="w-full h-full flex items-center justify-center">
              <Avatar username={g.owner.username} avatarUrl={g.owner.avatar_url} size="w-16 h-16" textSize="text-xl" sizes="64px" />
            </span>
          )}
        </span>
        <span className="text-[12.5px] text-white/90 truncate max-w-full">{g.highlight ? g.highlight.title : ownerLabel(g.owner)}</span>
      </button>
    )
  }

  const menuItems = (
    <div className="space-y-1">
      {isMine ? (
        <>
          {!isHighlight && (
            <button type="button" className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-[14.5px] hover:bg-white/8 text-left" onClick={() => { setMenuOpen(false); setPickerOpen(true) }}>
              <StarIcon className="w-5 h-5" /> Agregar a destacadas
            </button>
          )}
          <button type="button" className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-[14.5px] hover:bg-white/8 text-left" onClick={() => { setMenuOpen(false); router.push('/historias/archivo') }}>
            <ArchiveIcon className="w-5 h-5" /> Ver en archivo
          </button>
          {!isHighlight && (
            <button type="button" className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-[14.5px] hover:bg-white/8 text-left text-garnet-300" onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}>
              <TrashIcon className="w-5 h-5" /> Eliminar historia
            </button>
          )}
        </>
      ) : (
        <>
          <button type="button" className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-[14.5px] hover:bg-white/8 text-left text-garnet-300" onClick={() => { setMenuOpen(false); setReportOpen(true) }}>
            <FlagIcon className="w-5 h-5" /> Reportar historia
          </button>
          <button type="button" className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-[14.5px] hover:bg-white/8 text-left" onClick={toggleMute}>
            <BlockIcon className="w-5 h-5" /> {mutedOwners.has(group.owner.user_id) ? `Reactivar historias de @${group.owner.username}` : `Silenciar historias de @${group.owner.username}`}
          </button>
          <button type="button" className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-[14.5px] hover:bg-white/8 text-left" onClick={copyProfileLink}>
            <CopyIcon className="w-5 h-5" /> Copiar enlace al perfil
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden" role="dialog" aria-modal="true" aria-label={`Historias de ${label}`} onMouseMove={wakeUi}>
      {/* PC: la foto de la historia, muy desenfocada y oscurecida, hace de marco */}
      <div className="hidden md:block absolute inset-0 overflow-hidden" aria-hidden="true">
        {mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" draggable={false} className="w-full h-full object-cover scale-110" style={{ filter: 'blur(40px) brightness(.35)' }} />
        )}
      </div>

      <div className="absolute inset-0 md:flex md:items-center md:justify-center md:gap-8">
        {prevGroup && renderNeighbor(prevGroup, 'left')}

        {/* flecha izquierda (PC) */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Historia anterior"
          className={`hidden md:flex w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 items-center justify-center shrink-0 transition-opacity ${uiOn ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div
          ref={stageRef}
          className={`fixed inset-0 md:relative md:inset-auto md:h-[min(92dvh,860px)] md:aspect-[9/16] md:rounded-[18px] overflow-hidden bg-black md:shadow-2xl shrink-0 ${closing ? 'opacity-0 scale-95 transition-all duration-150' : origin ? 'story-grow' : ''}`}
          style={originStyle}
        >
          <div key={`${gi}`} className={`absolute inset-0 ${animClass}`}>
            {/* escenario: se agranda hasta cubrir la pantalla en celulares altos (recorta solo fondo) */}
            <div className="story-stage-wrap">
              <StoryCanvas
                bg={story.bg}
                mediaUrl={mediaUrl}
                elements={story.elements}
                track={track}
                playing={musicPlaying}
                progress={musicProgress}
              >
                {hearts.map((h) => (
                  <span key={h.id} className="story-heart-float absolute text-garnet-500 pointer-events-none" style={{ left: `${h.x}%`, top: `${h.y}%`, width: 96, height: 96, zIndex: 50 }}>
                    <HeartIcon filled className="w-full h-full drop-shadow-lg" />
                  </span>
                ))}
                {floaters.map((f) => (
                  <span key={f.id} className="absolute bottom-[12%] pointer-events-none text-[9cqw]" style={{ left: `${f.left}%`, animation: 'story-emoji-rise 1.6s ease-out both', animationDelay: `${f.delay}ms`, zIndex: 50 }}>
                    {f.emoji}
                  </span>
                ))}
              </StoryCanvas>
            </div>

            {!ready && imgErrorId !== story.id && (
              <div className="absolute inset-0 bg-[#131317] animate-pulse z-[3]" aria-label="Cargando la historia" />
            )}
            {imgErrorId === story.id && (
              <div className="absolute inset-0 z-[6] bg-[#131317] flex flex-col items-center justify-center gap-3 text-center px-8">
                <p className="text-sm">No se pudo cargar esta historia</p>
                <div className="flex gap-2">
                  <button type="button" className="rounded-full bg-garnet-600 px-4 py-2 text-sm" onClick={() => { setImgErrorId(null); if (story.media_path) void signedStoryUrls([story.media_path]).then((m) => setUrls((p) => ({ ...p, ...m }))) }}>
                    Reintentar
                  </button>
                  <button type="button" className="rounded-full border border-white/25 px-4 py-2 text-sm" onClick={goNext}>
                    Saltar
                  </button>
                </div>
              </div>
            )}

            {/* zonas táctiles y gestos */}
            <div
              className="absolute inset-0 z-[5] touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onPointerLeave={() => setHoverSide(null)}
              onContextMenu={(e) => e.preventDefault()}
            />
            {hoverSide && uiOn && (
              <div className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-[6] pointer-events-none w-9 h-9 rounded-full bg-black/40 items-center justify-center ${hoverSide === 'prev' ? 'left-3' : 'right-3'}`}>
                {hoverSide === 'prev' ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
              </div>
            )}

            {/* arriba: degradado + barras + cabecera */}
            <div
              className={`absolute inset-x-0 top-0 z-10 pointer-events-none transition-opacity duration-200 ${uiOn ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,0))', paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="px-2.5 pt-2.5 pb-10">
                <ProgressBars count={stories.length} index={si} progress={progress} />
                <div className="mt-2.5 flex items-center gap-2.5">
                  <Avatar username={group.owner.username} avatarUrl={group.owner.avatar_url} size="w-[34px] h-[34px]" textSize="text-sm" sizes="40px" photoClassName="ring-2" className={hasUnseenMore ? '[--tw-ring-color:var(--color-garnet-400)]' : '[--tw-ring-color:rgba(255,255,255,.3)]'} />
                  <div className="min-w-0 flex-1 leading-tight pointer-events-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-bold truncate">{isMine ? 'Tu historia' : label}</span>
                      <span className="text-[12px] text-white/70 shrink-0">{isHighlight ? fullDateLabel(story.created_at) : storyAgo(story.created_at)}</span>
                      {story.audience === 'friends' && <span className="rounded-full bg-emerald-600 text-white text-[10px] font-semibold px-1.5 py-[2px] shrink-0">Amigos</span>}
                    </div>
                    {isHighlight && <div className="text-[11.5px] text-white/75 truncate">{group.highlight?.title}</div>}
                    {track && (
                      <a href={track.link ?? undefined} target="_blank" rel="noopener noreferrer" className="block text-[12px] text-white/90 overflow-hidden whitespace-nowrap">
                        <span className={track.title.length + track.artist.length > 34 ? 'story-marquee' : ''}>♪ {track.title} · {track.artist}</span>
                      </a>
                    )}
                    {audio.error && <div className="text-[11px] text-white/70">{audio.error}</div>}
                  </div>
                  <div className="flex items-center gap-1 pointer-events-auto" data-nogesture>
                    <button type="button" onClick={() => setUserPaused((v) => !v)} aria-label={userPaused ? 'Continuar' : 'Pausar'} className="hidden md:flex w-9 h-9 rounded-full bg-black/40 backdrop-blur items-center justify-center">
                      {userPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                    </button>
                    {track && (
                      <SoundControl
                        muted={audio.muted}
                        volume={audio.volume}
                        disabled={audio.disabled}
                        hasMusic={!!track}
                        hint={hint}
                        onToggle={audio.toggleMuted}
                        onVolume={audio.setVolume}
                        onDragging={setVolDrag}
                      />
                    )}
                    <button type="button" onClick={() => setMenuOpen(true)} aria-label="Más opciones" className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                      <MoreIcon className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => setShortcutsOpen(true)} aria-label="Atajos de teclado" className="hidden md:flex w-9 h-9 rounded-full bg-black/40 backdrop-blur items-center justify-center text-sm font-semibold">
                      ?
                    </button>
                    <button type="button" onClick={close} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* abajo */}
            <div
              className={`absolute inset-x-0 bottom-0 z-10 transition-opacity duration-200 ${uiOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), rgba(0,0,0,0))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              data-nogesture
            >
              {isHighlight ? (
                <p className="px-4 pb-4 pt-8 text-center text-[13px] text-white/85">Destacada de @{group.owner.username}</p>
              ) : isMine ? (
                <button
                  type="button"
                  onClick={() => setViewersOpen(true)}
                  className="w-full flex items-center justify-between gap-3 px-4 pb-4 pt-8 text-left"
                  aria-label="Ver quién vio tu historia"
                >
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <EyeIcon className="w-5 h-5" /> {story.view_count ?? 0} {(story.view_count ?? 0) === 1 ? 'vista' : 'vistas'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[14px] font-medium">
                    <HeartIcon filled className="w-5 h-5 text-garnet-500" /> {story.like_count ?? 0}
                  </span>
                </button>
              ) : (
                <ReplyBar
                  ref={replyRef}
                  ownerName={group.owner.username}
                  blockedMessage={ownerReplyBlocked}
                  liked={liked}
                  canLike={canLike}
                  status={replyStatus}
                  onLike={() => void setLike(!liked)}
                  onSend={sendReply}
                  onReact={(e) => void sendReaction(e)}
                  onFocusChange={setReplyFocus}
                />
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Historia siguiente"
          className={`hidden md:flex w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 items-center justify-center shrink-0 transition-opacity ${uiOn ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        {nextGroup && renderNeighbor(nextGroup, 'right')}
      </div>

      <div className="sr-only" aria-live="polite">{`Historia ${si + 1} de ${stories.length} de ${label}`}</div>

      {/* hojas */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones de la historia">
        {menuItems}
      </Sheet>
      <Sheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Atajos de teclado">
        <ul className="space-y-2">
          {SHORTCUTS.map(([k, d]) => (
            <li key={k} className="flex items-center justify-between gap-3 text-sm">
              <kbd className="rounded-md bg-white/10 px-2 py-1 text-[12px] font-semibold">{k}</kbd>
              <span className="text-neutral-300">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-neutral-500">Nadie puede impedir que alguien haga una captura de pantalla de una historia.</p>
      </Sheet>
      <Sheet
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="¿Eliminar esta historia?"
        footer={
          <div className="flex gap-3">
            <button type="button" disabled={deleting} onClick={() => setDeleteOpen(false)} className="flex-1 rounded-full border border-white/20 py-2.5 text-sm hover:bg-white/10">
              Cancelar
            </button>
            <button type="button" disabled={deleting} onClick={doDelete} className="flex-1 rounded-full bg-garnet-600 hover:bg-garnet-500 py-2.5 text-sm font-medium disabled:opacity-60">
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-neutral-300">Esta historia se borrará también de tus destacadas.</p>
      </Sheet>
      <StoryReportDialog open={reportOpen} storyId={story.id} onClose={() => setReportOpen(false)} />
      {isMine && (
        <ViewersSheet
          storyId={story.id}
          open={viewersOpen}
          onClose={() => setViewersOpen(false)}
          onFeature={() => { setViewersOpen(false); setPickerOpen(true) }}
          onDelete={() => { setViewersOpen(false); setDeleteOpen(true) }}
        />
      )}
      {isMine && me && <HighlightPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} storyId={story.id} userId={me.id} />}
      {copied && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[160] rounded-full bg-white text-black text-sm px-4 py-2">Enlace copiado</div>}
    </div>
  )
}
