'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraIcon, CloseIcon, ImageIcon, MusicIcon, PaletteIcon, RedoIcon, SmileIcon, TextAaIcon, TrashIcon, UndoIcon, MapPinIcon, ClockIcon } from '../icons'
import { supabase } from '../../lib/supabaseClient'
import { toStoredTrack, type MusicTrack } from '../../lib/music'
import MusicPicker from '../MusicPicker'
import {
  BG_PRESETS,
  DEFAULT_BG_ANGLE,
  MAX_ELEMENTS,
  MAX_TEXT_CHARS,
  SOLID_BGS,
  STORY_BUCKET,
  computeDuration,
  emitStoriesChanged,
  fetchQuota,
  fetchStorySettings,
  friendlyStoryError,
  localTimeZone,
  lsGet,
  lsSet,
  newId,
  presetBg,
  quotaMessage,
  type Quota,
  type StoryAudience,
  type StoryBg,
  type StoryElement,
  type StoryLocation,
  type StoryMusicEl,
  type StoryText,
  type StoryTime,
  MUSIC_STYLES,
  LOCATION_STYLES,
  TIME_STYLES,
  untilLabel,
} from '../../lib/stories'
import { bakeStoryPhoto, checkImageFile, coverColors, defaultFit, loadPhoto, photoWidthFraction, type PhotoFit, type PhotoSource } from '../../lib/storyBake'
import { StageFrame, StoryElementView, elementBoxStyle } from './StoryCanvas'
import { textStyle } from './elements/TextElement'
import Sheet from './Sheet'
import { CustomColorPicker } from './editor/ColorPicker'
import TextControls from './editor/TextControls'
import EmojiPanel from './editor/EmojiPanel'
import LocationEditor from './editor/LocationEditor'
import TimeEditor from './editor/TimeEditor'
import MusicClipSheet from './editor/MusicClipSheet'
import AudienceSheet from './editor/AudienceSheet'
import Inspector from './editor/Inspector'

type Doc = {
  kind: 'photo' | 'text'
  bg: StoryBg
  elements: StoryElement[]
  music: MusicTrack | null
  musicStart: number
  musicClip: number
  fit: PhotoFit
}

const INITIAL: Doc = { kind: 'text', bg: presetBg('granate'), elements: [], music: null, musicStart: 0, musicClip: 15, fit: { mode: 'fill', zoom: 1, ox: 0, oy: 0 } }
const FIRST_KEY = 'daiwa_story_first_publish'

function useIsDesktop() {
  const [d, setD] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setD(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return d
}

function maxZ(els: StoryElement[]) {
  return els.reduce((m, e) => Math.max(m, e.z), 0)
}

type StickerView = 'home' | 'emoji' | 'location' | 'time'
type Gesture = {
  target: string | 'bg'
  mode: 'drag' | 'pinch' | 'handle'
  startPt: { x: number; y: number }
  startEl?: StoryElement
  startFit?: PhotoFit
  startDist: number
  startAngle: number
  startCenter: { x: number; y: number }
  elCenter?: { x: number; y: number }
  moved: boolean
  wasSelected: boolean
}

export default function StoryEditor() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const [uid, setUid] = useState<string | null>(null)
  const [quota, setQuota] = useState<Quota | null>(null)
  const [quotaErr, setQuotaErr] = useState('')
  const [places, setPlaces] = useState<string[]>([])
  const [friendsCount, setFriendsCount] = useState<number | null>(null)
  const [started, setStarted] = useState(false)

  const [doc, setDoc] = useState<Doc>(INITIAL)
  const docRef = useRef<Doc>(INITIAL)
  const past = useRef<Doc[]>([])
  const future = useRef<Doc[]>([])
  const [hist, setHist] = useState({ u: 0, r: 0 })
  const bump = useCallback(() => setHist({ u: past.current.length, r: future.current.length }), [])
  const snap = useRef<Doc | null>(null)

  const [src, setSrc] = useState<PhotoSource | null>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const creatingText = useRef(false)
  const [tab, setTab] = useState<'bg' | 'text' | 'stickers' | 'music'>('stickers')
  const [sheet, setSheet] = useState<null | 'bg' | 'stickers' | 'inspector'>(null)
  const [view, setView] = useState<StickerView>('home')
  const [draftLoc, setDraftLoc] = useState<StoryLocation | null>(null)
  const [draftTime, setDraftTime] = useState<StoryTime | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingTrack, setPendingTrack] = useState<MusicTrack | null>(null)
  const [clipOpen, setClipOpen] = useState<null | 'new' | 'edit'>(null)
  const [coverThemeOk, setCoverThemeOk] = useState(true)
  const [musicRemoveAsk, setMusicRemoveAsk] = useState<string | null>(null)
  const [audience, setAudience] = useState<StoryAudience>('followers')
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [discardAsk, setDiscardAsk] = useState(false)
  const [publishing, setPublishing] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [guides, setGuides] = useState({ v: false, h: false, rot: false })
  const [overTrash, setOverTrash] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dropHover, setDropHover] = useState(false)
  const [kbInset, setKbInset] = useState(0)
  const [custom, setCustom] = useState(false)
  const [firstNotice, setFirstNotice] = useState(false)
  const [processing, setProcessing] = useState(false)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const ptrs = useRef(new Map<number, { x: number; y: number }>())
  const gest = useRef<Gesture | null>(null)
  const lastTap = useRef<{ id: string; t: number }>({ id: '', t: 0 })
  const cameraRef = useRef<HTMLInputElement | null>(null)
  const galleryRef = useRef<HTMLInputElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    docRef.current = doc
  }, [doc])

  // ───────── sesión, cupo, lugares, amigos ─────────
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/login')
        return
      }
      setUid(data.user.id)
      const [q, settings, prof] = await Promise.all([
        fetchQuota(),
        fetchStorySettings(),
        supabase.from('profiles').select('story_default_audience').eq('id', data.user.id).maybeSingle(),
      ])
      setQuota(q.quota)
      setQuotaErr(q.error ?? '')
      setPlaces(settings.places)
      const a = (prof.data as { story_default_audience?: string } | null)?.story_default_audience
      if (a === 'friends' || a === 'followers') setAudience(a)
      // amigos = personas que me siguen y yo sigo
      const [mine, theirs] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', data.user.id).limit(3000),
        supabase.from('follows').select('follower_id').eq('following_id', data.user.id).limit(3000),
      ])
      const set = new Set(((mine.data as { following_id: string }[] | null) ?? []).map((r) => r.following_id))
      setFriendsCount(((theirs.data as { follower_id: string }[] | null) ?? []).filter((r) => set.has(r.follower_id)).length)
    }
    void init()
  }, [router])

  // teclado del celular: la barra de texto sube con él
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const on = () => setKbInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    on()
    vv.addEventListener('resize', on)
    vv.addEventListener('scroll', on)
    return () => {
      vv.removeEventListener('resize', on)
      vv.removeEventListener('scroll', on)
    }
  }, [])

  // ───────── historial (deshacer / rehacer, 30 pasos) ─────────
  const apply = useCallback((fn: (d: Doc) => Doc) => {
    past.current.push(docRef.current)
    if (past.current.length > 30) past.current.shift()
    future.current = []
    const next = fn(docRef.current)
    docRef.current = next
    setDoc(next)
    bump()
  }, [bump])
  const live = useCallback((fn: (d: Doc) => Doc) => {
    const next = fn(docRef.current)
    docRef.current = next
    setDoc(next)
  }, [])
  const beginGesture = () => {
    snap.current = docRef.current
  }
  const endGesture = () => {
    if (snap.current && snap.current !== docRef.current) {
      past.current.push(snap.current)
      if (past.current.length > 30) past.current.shift()
      future.current = []
      bump()
    }
    snap.current = null
  }
  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(docRef.current)
    docRef.current = prev
    setDoc(prev)
    setSelId(null)
    bump()
  }, [bump])
  const redo = useCallback(() => {
    const nxt = future.current.pop()
    if (!nxt) return
    past.current.push(docRef.current)
    docRef.current = nxt
    setDoc(nxt)
    setSelId(null)
    bump()
  }, [bump])

  const dirty = hist.u > 0 || !!src
  const selected = doc.elements.find((e) => e.id === selId) ?? null
  const editing = doc.elements.find((e) => e.id === editingId && e.type === 'text') as StoryText | undefined

  // ───────── elementos ─────────
  const patchEl = useCallback(
    (id: string, patch: Partial<StoryElement>, record = true) => {
      const fn = (d: Doc): Doc => ({ ...d, elements: d.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as StoryElement) : e)) })
      if (record) apply(fn)
      else live(fn)
    },
    [apply, live]
  )

  const addElement = useCallback(
    (el: StoryElement): boolean => {
      if (docRef.current.elements.length >= MAX_ELEMENTS) {
        setToast('Ya hay muchas cosas en esta historia. Quita alguna para añadir más.')
        window.setTimeout(() => setToast(''), 3000)
        return false
      }
      apply((d) => ({ ...d, elements: [...d.elements, { ...el, z: maxZ(d.elements) + 1 }] }))
      setSelId(el.id)
      return true
    },
    [apply]
  )

  const removeEl = useCallback(
    (id: string) => {
      const el = docRef.current.elements.find((e) => e.id === id)
      if (el?.type === 'music') {
        setMusicRemoveAsk(id)
        return
      }
      apply((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== id) }))
      setSelId((s) => (s === id ? null : s))
    },
    [apply]
  )

  const layer = (id: string, dir: 1 | -1) =>
    apply((d) => {
      const sorted = [...d.elements].sort((a, b) => a.z - b.z)
      const i = sorted.findIndex((e) => e.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= sorted.length) return d
      const zi = sorted[i].z
      sorted[i] = { ...sorted[i], z: sorted[j].z }
      sorted[j] = { ...sorted[j], z: zi }
      return { ...d, elements: sorted }
    })

  const duplicate = (id: string) => {
    const el = docRef.current.elements.find((e) => e.id === id)
    if (!el || el.type === 'music') return
    addElement({ ...el, id: newId(), x: Math.min(100, el.x + 4), y: Math.min(100, el.y + 4) })
  }

  const base = (z = 0) => ({ id: newId(), x: 50, y: 50, scale: 1, rotation: 0, z })

  const addText = () => {
    const el: StoryText = { ...base(), type: 'text', y: 42, text: '', font: 'clasica', align: 'center', color: '#FFFFFF', bgMode: 'none', size: 7 }
    if (addElement(el)) {
      creatingText.current = true
      setEditingId(el.id)
      setSheet(null)
    }
  }
  const finishText = () => {
    const id = editingId
    setEditingId(null)
    if (!id) return
    const el = docRef.current.elements.find((e) => e.id === id) as StoryText | undefined
    if (el && el.text.trim() === '') {
      // texto vacío: se quita sin dejar rastro en el historial
      if (creatingText.current) {
        past.current.pop()
        const prev = docRef.current
        const next = { ...prev, elements: prev.elements.filter((e) => e.id !== id) }
        docRef.current = next
        setDoc(next)
        bump()
      } else removeEl(id)
      setSelId(null)
    }
    creatingText.current = false
  }

  useEffect(() => {
    if (editingId) window.setTimeout(() => textAreaRef.current?.focus(), 30)
  }, [editingId])

  const addEmoji = (emoji: string) => {
    if (addElement({ ...base(), type: 'emoji', emoji, size: 16 })) setSheet(null)
  }

  const addMusicSticker = (track: MusicTrack, start: number, clip: number) => {
    apply((d) => {
      const has = d.elements.some((e) => e.type === 'music')
      const elements = has ? d.elements : [...d.elements, { ...base(maxZ(d.elements) + 1), type: 'music', y: 70, style: 'cover-card', theme: 'light' } as StoryMusicEl]
      return { ...d, music: toStoredTrack(track) as MusicTrack, musicStart: start, musicClip: clip, elements }
    })
    const id = docRef.current.elements.find((e) => e.type === 'music')?.id
    if (id) setSelId(id)
    setSheet(null)
    void coverColors(track.cover).then((c) => setCoverThemeOk(!!c))
  }

  const cycleStyle = (el: StoryElement) => {
    if (el.type === 'music') {
      const i = MUSIC_STYLES.findIndex((s) => s.id === el.style)
      patchEl(el.id, { style: MUSIC_STYLES[(i + 1) % MUSIC_STYLES.length].id } as Partial<StoryMusicEl>)
    } else if (el.type === 'location') {
      const i = LOCATION_STYLES.findIndex((s) => s.id === el.style)
      patchEl(el.id, { style: LOCATION_STYLES[(i + 1) % LOCATION_STYLES.length].id } as Partial<StoryLocation>)
    } else if (el.type === 'time') {
      const i = TIME_STYLES.findIndex((s) => s.id === el.style)
      patchEl(el.id, { style: TIME_STYLES[(i + 1) % TIME_STYLES.length].id } as Partial<StoryTime>)
    }
  }

  const newLocation = (): StoryLocation => ({ ...base(), type: 'location', y: 62, label: '', style: 'pill', theme: 'light' })
  const newTime = (): StoryTime => ({
    ...base(), type: 'time', y: 30, style: 'digital', iso: new Date().toISOString(), tz: localTimeZone(),
    hour12: true, showDate: 'short', showPeriod: true, showZone: false, color: '#FFFFFF',
  })

  // ───────── foto ─────────
  const loadFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return
      const bad = checkImageFile(file)
      if (bad) {
        setError(bad)
        return
      }
      setProcessing(true)
      setError('')
      try {
        const p = await loadPhoto(file)
        setSrc((old) => {
          if (old) URL.revokeObjectURL(old.url)
          return p
        })
        apply((d) => ({ ...d, kind: 'photo', fit: defaultFit(p.aspect) }))
        setStarted(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo leer la foto.')
      }
      setProcessing(false)
    },
    [apply]
  )

  // PC: soltar y pegar una imagen
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'))
      if (f) {
        e.preventDefault()
        void loadFile(f)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [loadFile])

  const startText = () => {
    apply((d) => ({ ...d, kind: 'text' }))
    setStarted(true)
  }
  const startMusic = () => {
        setPickerOpen(true)
  }

  // ───────── gestos: arrastrar, pellizcar, girar ─────────
  const stageRect = () => stageRef.current?.getBoundingClientRect()
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
  const angle = (a: { x: number; y: number }, b: { x: number; y: number }) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI

  const baseline = (target: string | 'bg', mode: Gesture['mode'], wasSelected: boolean) => {
    const pts = [...ptrs.current.values()]
    const r = stageRect()
    const startEl = target === 'bg' ? undefined : docRef.current.elements.find((e) => e.id === target)
    const p0 = pts[0]
    const center = pts.length >= 2 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : p0
    let elCenter: { x: number; y: number } | undefined
    if (startEl && r) elCenter = { x: r.left + (startEl.x / 100) * r.width, y: r.top + (startEl.y / 100) * r.height }
    const handleRef = mode === 'handle' && elCenter ? elCenter : null
    gest.current = {
      target,
      mode: pts.length >= 2 ? 'pinch' : mode,
      startPt: p0,
      startEl,
      startFit: docRef.current.fit,
      startDist: pts.length >= 2 ? dist(pts[0], pts[1]) : handleRef ? dist(handleRef, p0) : 1,
      startAngle: pts.length >= 2 ? angle(pts[0], pts[1]) : handleRef ? angle(handleRef, p0) : 0,
      startCenter: center,
      elCenter,
      moved: gest.current?.moved ?? false,
      wasSelected,
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (editingId) return
    const targetEl = (e.target as HTMLElement).closest('[data-el]') as HTMLElement | null
    const handle = (e.target as HTMLElement).closest('[data-handle]') as HTMLElement | null
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    if (ptrs.current.size === 1) {
      beginGesture()
      gest.current = null
    }
    if (ptrs.current.size === 1) {
      if (handle && selId) {
        baseline(selId, 'handle', true)
      } else if (targetEl) {
        const id = targetEl.dataset.el as string
        baseline(id, 'drag', id === selId)
        setSelId(id)
      } else if (docRef.current.kind === 'photo') {
        baseline('bg', 'drag', false)
        setSelId(null)
      } else {
        gest.current = null
        setSelId(null)
        // toque sobre el fondo en historias de texto: pasa al siguiente fondo
        gest.current = { target: 'bgtap', mode: 'drag', startPt: { x: e.clientX, y: e.clientY }, startDist: 1, startAngle: 0, startCenter: { x: e.clientX, y: e.clientY }, moved: false, wasSelected: false }
      }
    } else if (gest.current) {
      baseline(gest.current.target === 'bgtap' ? 'bg' : gest.current.target, 'pinch', gest.current.wasSelected)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId)) return
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gest.current
    const r = stageRect()
    if (!g || !r) return
    const pts = [...ptrs.current.values()]
    if (g.target === 'bgtap') {
      if (dist(pts[0], g.startPt) > 8) g.moved = true
      return
    }
    if (dist(pts[0], g.startPt) > 6 || pts.length >= 2) {
      if (!g.moved) {
        g.moved = true
        if (g.target !== 'bg') setDragging(true)
      }
    }
    if (!g.moved) return

    if (g.target === 'bg') {
      const f = g.startFit ?? docRef.current.fit
      if (pts.length >= 2) {
        const ratio = dist(pts[0], pts[1]) / g.startDist
        live((d) => ({ ...d, fit: { ...d.fit, zoom: Math.min(4, Math.max(1, f.zoom * ratio)) } }))
      } else {
        live((d) => ({ ...d, fit: { ...d.fit, ox: f.ox + (pts[0].x - g.startPt.x) / r.width, oy: f.oy + (pts[0].y - g.startPt.y) / r.height } }))
      }
      return
    }

    const s = g.startEl
    if (!s) return
    let patch: Partial<StoryElement> = {}
    const nextGuides = { v: false, h: false, rot: false }
    if (g.mode === 'drag' && pts.length === 1) {
      let x = s.x + ((pts[0].x - g.startPt.x) / r.width) * 100
      let y = s.y + ((pts[0].y - g.startPt.y) / r.height) * 100
      if (Math.abs(x - 50) <= 1.5) { x = 50; nextGuides.v = true }
      if (Math.abs(y - 50) <= 1.5) { y = 50; nextGuides.h = true }
      x = Math.min(110, Math.max(-10, x))
      y = Math.min(110, Math.max(-10, y))
      patch = { x, y }
      const inTrash = pts[0].y > r.bottom - 76 && Math.abs(pts[0].x - (r.left + r.width / 2)) < 46
      setOverTrash(inTrash)
      if (inTrash && !overTrash && 'vibrate' in navigator) navigator.vibrate?.(10)
    } else if (g.mode === 'handle' && g.elCenter) {
      const d = dist(g.elCenter, pts[0]) / Math.max(1, g.startDist)
      let rot = s.rotation + (angle(g.elCenter, pts[0]) - g.startAngle)
      rot = ((rot + 540) % 360) - 180
      for (const t of [0, 90, -90, 180, -180]) if (Math.abs(rot - t) <= 3) { rot = t; nextGuides.rot = true }
      patch = { scale: Math.min(6, Math.max(0.2, s.scale * d)), rotation: rot }
    } else if (pts.length >= 2) {
      const ratio = dist(pts[0], pts[1]) / Math.max(1, g.startDist)
      let rot = s.rotation + (angle(pts[0], pts[1]) - g.startAngle)
      rot = ((rot + 540) % 360) - 180
      for (const t of [0, 90, -90, 180, -180]) if (Math.abs(rot - t) <= 3) { rot = t; nextGuides.rot = true }
      const cx = (pts[0].x + pts[1].x) / 2
      const cy = (pts[0].y + pts[1].y) / 2
      patch = {
        scale: Math.min(6, Math.max(0.2, s.scale * ratio)),
        rotation: rot,
        x: s.x + ((cx - g.startCenter.x) / r.width) * 100,
        y: s.y + ((cy - g.startCenter.y) / r.height) * 100,
      }
    }
    setGuides(nextGuides)
    patchEl(g.target, patch, false)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId)) return
    ptrs.current.delete(e.pointerId)
    const g = gest.current
    if (ptrs.current.size === 0) {
      if (g) {
        if (g.target === 'bgtap' && !g.moved && docRef.current.kind === 'text') {
          const cur = docRef.current.bg
          const idx = cur.type === 'gradient' ? BG_PRESETS.findIndex((p) => p.id === cur.id) : -1
          apply((d) => ({ ...d, bg: presetBg(BG_PRESETS[(idx + 1) % BG_PRESETS.length].id) }))
        } else if (g.target !== 'bg' && g.target !== 'bgtap') {
          const el = docRef.current.elements.find((x) => x.id === g.target)
          if (g.moved && overTrash && el) {
            snap.current = snap.current ?? docRef.current
            removeEl(g.target)
          } else if (!g.moved && el) {
            const now = Date.now()
            if (el.type === 'text' && lastTap.current.id === el.id && now - lastTap.current.t < 350) {
              setEditingId(el.id)
              lastTap.current = { id: '', t: 0 }
            } else {
              lastTap.current = { id: el.id, t: now }
              // un toque sobre un sticker ya seleccionado cambia al siguiente estilo
              if (g.wasSelected && el.type !== 'text' && el.type !== 'emoji') cycleStyle(el)
            }
          }
        }
      }
      endGesture()
      gest.current = null
      setGuides({ v: false, h: false, rot: false })
      setOverTrash(false)
      setDragging(false)
    } else if (g) {
      baseline(g.target === 'bgtap' ? 'bg' : g.target, 'drag', g.wasSelected)
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    if (editingId) return
    const factor = Math.exp(-e.deltaY * 0.0015)
    if (selected && selected.type !== 'music') {
      patchEl(selected.id, { scale: Math.min(6, Math.max(0.2, selected.scale * factor)) }, false)
    } else if (doc.kind === 'photo') {
      live((d) => ({ ...d, fit: { ...d.fit, zoom: Math.min(4, Math.max(1, d.fit.zoom * factor)) } }))
    }
  }

  // ───────── publicar ─────────
  const totalChars = doc.elements.reduce((n, e) => n + (e.type === 'text' ? e.text.length : 0), 0)
  const hasContent = doc.kind === 'photo' ? !!src : doc.elements.some((e) => e.type === 'text' && e.text.trim()) || !!doc.music || doc.elements.length > 0
  const full = !!quota && quota.used >= quota.max

  const publish = async () => {
    if (!uid || publishing) return
    setError('')
    // primera vez: se explica lo de las 24 h y el archivo (se recuerda en este dispositivo)
    if (!lsGet(FIRST_KEY) && !firstNotice) {
      setFirstNotice(true)
      return
    }
    let uploaded: string | null = null
    try {
      setPublishing('Comprobando tu cupo…')
      const q = await fetchQuota()
      if (q.quota && q.quota.used >= q.quota.max) throw new Error(quotaMessage(q.quota))
      let media: { path: string; w: number; h: number } | null = null
      if (doc.kind === 'photo') {
        if (!src) throw new Error('Falta la foto.')
        setPublishing('Preparando la foto…')
        const baked = await bakeStoryPhoto(src, doc.fit)
        setPublishing('Subiendo la foto…')
        const path = `${uid}/${newId()}.jpg`
        const up = await supabase.storage.from(STORY_BUCKET).upload(path, baked.blob, { contentType: 'image/jpeg', upsert: false })
        if (up.error) throw new Error(friendlyStoryError(up.error.message))
        uploaded = path
        media = { path, w: baked.w, h: baked.h }
      }
      setPublishing('Publicando…')
      const round = (n: number) => Math.round(n * 100) / 100
      const elements = doc.elements.map((e) => ({ ...e, x: round(e.x), y: round(e.y), scale: round(e.scale), rotation: round(e.rotation) }))
      const { data, error: rpcErr } = await supabase.rpc('story_create', {
        p_kind: doc.kind,
        p_media_path: media?.path ?? null,
        p_media_w: media?.w ?? null,
        p_media_h: media?.h ?? null,
        p_bg: doc.kind === 'text' ? doc.bg : null,
        p_elements: elements,
        p_music: doc.music ? toStoredTrack(doc.music) : null,
        p_music_start: doc.music ? Math.round(doc.musicStart) : 0,
        p_music_clip: doc.music ? Math.round(doc.musicClip) : 15,
        p_duration_ms: computeDuration(totalChars, !!doc.music, doc.musicClip),
        p_audience: audience,
      })
      if (rpcErr || !data) throw new Error(friendlyStoryError(rpcErr?.message))
      emitStoriesChanged()
      const left = Math.max(0, (q.quota?.max ?? 3) - ((q.quota?.used ?? 0) + 1))
      try {
        window.sessionStorage.setItem('daiwa_story_published', JSON.stringify({ left, max: q.quota?.max ?? 3, id: (data as { id: string }).id }))
      } catch {
        /* sin almacenamiento */
      }
      if (window.history.length > 1) router.back()
      else router.push('/')
    } catch (e) {
      // si falló después de subir, no se deja el archivo huérfano
      if (uploaded) void supabase.storage.from(STORY_BUCKET).remove([uploaded])
      setError(e instanceof Error ? e.message : 'No se pudo publicar tu historia.')
      setPublishing('')
    }
  }

  const exit = () => {
    if (editingId) {
      finishText()
      return
    }
    if (dirty && started) setDiscardAsk(true)
    else if (window.history.length > 1) router.back()
    else router.push('/')
  }

  // ───────── atajos (PC) ─────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (e.key === 'Escape') {
        if (editingId) finishText()
        else if (sheet || pickerOpen || clipOpen || audienceOpen) return
        else exit()
        return
      }
      if (typing || !started) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        e.preventDefault()
        removeEl(selId)
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        addText()
      } else if (selId && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 5 : 1
        const el = docRef.current.elements.find((x) => x.id === selId)
        if (!el) return
        patchEl(selId, {
          x: el.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
          y: el.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0),
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, sheet, pickerOpen, clipOpen, audienceOpen, selId, started, dirty])

  // ───────── piezas de interfaz ─────────
  const photoLayers = useMemo(() => {
    if (doc.kind !== 'photo' || !src) return null
    const wFrac = photoWidthFraction(src.aspect, 9 / 16, doc.fit)
    const hFrac = (wFrac * (9 / 16)) / src.aspect
    return (
      <>
        {doc.fit.mode === 'fit' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src.url} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ filter: 'blur(26px) brightness(.75)', transform: 'scale(1.25)' }} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src.url} alt="" draggable={false} className="absolute pointer-events-none max-w-none" style={{ width: `${wFrac * 100}%`, height: `${hFrac * 100}%`, left: `${(0.5 + doc.fit.ox - wFrac / 2) * 100}%`, top: `${(0.5 + doc.fit.oy - hFrac / 2) * 100}%` }} />
      </>
    )
  }, [doc.kind, doc.fit, src])

  const ctxBase = { track: doc.music, playing: false, progress: 0.4, noAudio: doc.music?.hasPreview === false }
  const sorted = [...doc.elements].sort((a, b) => a.z - b.z)
  const unsafe = doc.elements.some((e) => e.y < 12 || e.y > 86)

  const BackgroundPanel = (
    <div className="space-y-4">
      {doc.kind === 'photo' ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['fit', 'fill'] as const).map((m) => (
              <button key={m} type="button" onClick={() => apply((d) => ({ ...d, fit: { ...d.fit, mode: m, ox: 0, oy: 0, zoom: 1 } }))} aria-pressed={doc.fit.mode === m} className={`flex-1 rounded-xl py-2.5 text-sm border ${doc.fit.mode === m ? 'bg-white text-black border-white font-medium' : 'border-white/20'}`}>
                {m === 'fit' ? 'Ajustar' : 'Llenar'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-[13px] text-neutral-300">
            Zoom
            <input type="range" min={100} max={400} value={Math.round(doc.fit.zoom * 100)} onChange={(e) => live((d) => ({ ...d, fit: { ...d.fit, zoom: Number(e.target.value) / 100 } }))} onPointerUp={() => { past.current.push(docRef.current); bump() }} className="flex-1 accent-[var(--color-garnet-500)]" />
          </label>
          <p className="text-[12px] text-neutral-500">Arrastra la foto para moverla. Pellizca (o usa la rueda del ratón) para acercar.</p>
          <button type="button" onClick={() => { setSrc(null); apply((d) => ({ ...d, kind: 'text' })); setStarted(false) }} className="w-full rounded-xl border border-white/20 py-2 text-[13px]">Cambiar de foto</button>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-neutral-400">Toca el fondo de la historia para ir pasando al siguiente.</p>
          <div className="grid grid-cols-4 gap-2">
            {BG_PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => apply((d) => ({ ...d, bg: presetBg(p.id) }))} aria-label={`Fondo ${p.name}`} aria-pressed={doc.bg.type === 'gradient' && doc.bg.id === p.id} className={`h-14 rounded-xl border-2 ${doc.bg.type === 'gradient' && doc.bg.id === p.id ? 'border-white' : 'border-transparent'}`} style={{ background: `linear-gradient(160deg, ${p.colors.join(',')})` }}>
                <span className="sr-only">{p.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {SOLID_BGS.map((c) => (
              <button key={c} type="button" onClick={() => apply((d) => ({ ...d, bg: { type: 'solid', color: c } }))} aria-label={`Color ${c}`} className="w-8 h-8 rounded-full border-2 border-white/40" style={{ background: c }} />
            ))}
            <button type="button" onClick={() => setCustom((v) => !v)} className="rounded-full border border-white/30 px-3 py-1.5 text-xs">Elegir color</button>
          </div>
          {custom && <CustomColorPicker value={doc.bg.type === 'solid' ? doc.bg.color : doc.bg.colors[0]} onChange={(c) => live((d) => ({ ...d, bg: { type: 'solid', color: c } }))} onCommit={() => { past.current.push(docRef.current); bump() }} />}
          {doc.bg.type === 'gradient' && (
            <label className="flex items-center gap-3 text-[13px] text-neutral-300">
              Ángulo
              <input type="range" min={0} max={360} value={doc.bg.angle ?? DEFAULT_BG_ANGLE} onChange={(e) => live((d) => (d.bg.type === 'gradient' ? { ...d, bg: { ...d.bg, angle: Number(e.target.value) } } : d))} className="flex-1 accent-[var(--color-garnet-500)]" />
            </label>
          )}
        </>
      )}
    </div>
  )

  const StickersPanel = (
    <div>
      {view === 'home' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => { setPickerOpen(true) }} className="rounded-2xl bg-white/8 hover:bg-white/12 p-3 text-left">
              <MusicIcon className="w-6 h-6 text-garnet-300" />
              <span className="block mt-2 text-[13px] font-semibold">Música</span>
              <span className="block text-[11px] text-neutral-400">{doc.music ? 'Cambiar' : 'Añadir'}</span>
            </button>
            <button type="button" onClick={() => { setDraftLoc(newLocation()); setView('location') }} className="rounded-2xl bg-white/8 hover:bg-white/12 p-3 text-left">
              <MapPinIcon className="w-6 h-6 text-emerald-300" />
              <span className="block mt-2 text-[13px] font-semibold">Ubicación</span>
              <span className="block text-[11px] text-neutral-400">4 estilos</span>
            </button>
            <button type="button" onClick={() => { setDraftTime(newTime()); setView('time') }} className="rounded-2xl bg-white/8 hover:bg-white/12 p-3 text-left">
              <ClockIcon className="w-6 h-6 text-sky-300" />
              <span className="block mt-2 text-[13px] font-semibold">Hora</span>
              <span className="block text-[11px] text-neutral-400">8 estilos</span>
            </button>
          </div>
          <EmojiPanel onPick={addEmoji} />
        </div>
      )}
      {view === 'location' && draftLoc && (
        <div className="space-y-3">
          <button type="button" onClick={() => setView('home')} className="text-[13px] text-neutral-400">‹ Volver</button>
          <LocationEditor el={draftLoc} places={places} onChange={(p) => setDraftLoc({ ...draftLoc, ...p })} />
          <button type="button" disabled={!draftLoc.label.trim()} onClick={() => { if (addElement({ ...draftLoc, label: draftLoc.label.trim() })) { setDraftLoc(null); setView('home'); setSheet(null) } }} className="w-full rounded-full bg-garnet-600 py-2.5 text-sm font-medium disabled:opacity-40">Añadir ubicación</button>
        </div>
      )}
      {view === 'time' && draftTime && (
        <div className="space-y-3">
          <button type="button" onClick={() => setView('home')} className="text-[13px] text-neutral-400">‹ Volver</button>
          <TimeEditor el={draftTime} onChange={(p) => setDraftTime({ ...draftTime, ...p })} />
          <button type="button" onClick={() => { if (addElement(draftTime)) { setDraftTime(null); setView('home'); setSheet(null) } }} className="w-full rounded-full bg-garnet-600 py-2.5 text-sm font-medium">Añadir hora</button>
        </div>
      )}
    </div>
  )

  const MusicPanel = (
    <div className="space-y-3">
      {doc.music ? (
        <div className="rounded-2xl bg-white/8 p-3 flex items-center gap-3">
          {doc.music.cover && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.music.cover} alt="" className="w-12 h-12 rounded-lg" />
            </>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold truncate">{doc.music.title}</p>
            <p className="text-[12px] text-neutral-400 truncate">{doc.music.artist} · {doc.musicStart}–{doc.musicStart + doc.musicClip} s</p>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-neutral-400">Elige una canción y el momento que quieres que suene.</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => { setPickerOpen(true) }} className="rounded-xl border border-white/20 py-2.5 text-[13px]">{doc.music ? 'Cambiar canción' : 'Elegir canción'}</button>
        <button type="button" disabled={!doc.music} onClick={() => setClipOpen('edit')} className="rounded-xl border border-white/20 py-2.5 text-[13px] disabled:opacity-40">Elegir momento</button>
      </div>
      {doc.music && !doc.elements.some((e) => e.type === 'music') && <p className="text-[12px] text-neutral-500">Solo sonido: la canción suena sin sticker. La verá cualquiera en la cabecera.</p>}
      {doc.music && <button type="button" onClick={() => apply((d) => ({ ...d, music: null, elements: d.elements.filter((e) => e.type !== 'music') }))} className="w-full rounded-xl border border-white/20 py-2 text-[13px] text-garnet-300">Quitar canción</button>}
    </div>
  )

  const inspector = selected && (
    <Inspector
      el={selected}
      places={places}
      coverThemeOk={coverThemeOk}
      hasTrack={!!doc.music}
      onChange={(p) => patchEl(selected.id, p)}
      onDelete={() => removeEl(selected.id)}
      onLayer={(dir) => layer(selected.id, dir)}
      onDuplicate={() => duplicate(selected.id)}
      onEditText={() => setEditingId(selected.id)}
      onChangeSong={() => { setPickerOpen(true) }}
      onPickClip={() => setClipOpen('edit')}
    />
  )

  const audienceChip = (
    <button type="button" onClick={() => setAudienceOpen(true)} className="flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur border border-white/20 px-3.5 h-11 text-[13.5px] font-medium">
      {audience === 'friends' ? '💚 Solo amigos' : '👥 Seguidores'}{audience === 'friends' && friendsCount !== null ? ` · ${friendsCount}` : ''}
    </button>
  )
  const shareBtn = (
    <button type="button" onClick={publish} disabled={!hasContent || !!publishing || full || processing} className="rounded-full bg-garnet-600 hover:bg-garnet-500 text-white px-5 h-11 text-[14px] font-semibold disabled:opacity-45 active:scale-95 transition">
      {publishing ? 'Publicando…' : `Compartir · ${audience === 'friends' ? 'Amigos' : 'Seguidores'} ›`}
    </button>
  )

  const quotaLine = quota ? <p className={`text-[12px] ${full ? 'text-amber-300' : 'text-neutral-400'}`}>{quotaMessage(quota)}</p> : quotaErr ? <p className="text-[12px] text-garnet-300">{quotaErr}</p> : <p className="text-[12px] text-neutral-500">Comprobando tu cupo…</p>

  // ───────── pantalla de entrada ─────────
  if (!started) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-[#0c0c0f] text-white flex items-end md:items-center justify-center"
        onDragOver={(e) => { e.preventDefault(); setDropHover(true) }}
        onDragLeave={() => setDropHover(false)}
        onDrop={(e) => { e.preventDefault(); setDropHover(false); void loadFile(e.dataTransfer.files?.[0]) }}
      >
        <div className={`w-full md:max-w-[420px] bg-[#17171b] border border-white/10 rounded-t-3xl md:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl ${dropHover ? 'ring-2 ring-garnet-500' : ''}`} style={{ animation: 'daiwa-sheet-up .22s ease-out' }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[17px] font-semibold">Crear historia</h1>
            <button type="button" onClick={exit} aria-label="Cerrar" className="w-9 h-9 -mr-2 rounded-full hover:bg-white/10 flex items-center justify-center"><CloseIcon className="w-5 h-5" /></button>
          </div>
          <div className="mb-4">{quotaLine}</div>
          {full ? (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-100">{quota && quotaMessage(quota)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => cameraRef.current?.click()} className="md:hidden rounded-2xl bg-white/8 hover:bg-white/12 p-4 text-left active:scale-95 transition"><CameraIcon className="w-7 h-7 text-garnet-300" /><span className="block mt-2 text-[14px] font-semibold">Cámara</span></button>
              <button type="button" onClick={() => galleryRef.current?.click()} className="rounded-2xl bg-white/8 hover:bg-white/12 p-4 text-left active:scale-95 transition"><ImageIcon className="w-7 h-7 text-sky-300" /><span className="block mt-2 text-[14px] font-semibold">Galería</span><span className="hidden md:block text-[11px] text-neutral-400">o arrastra / pega una imagen</span></button>
              <button type="button" onClick={startText} className="rounded-2xl bg-white/8 hover:bg-white/12 p-4 text-left active:scale-95 transition"><TextAaIcon className="w-7 h-7 text-amber-300" /><span className="block mt-2 text-[14px] font-semibold">Texto</span></button>
              <button type="button" onClick={startMusic} className="rounded-2xl bg-white/8 hover:bg-white/12 p-4 text-left active:scale-95 transition"><MusicIcon className="w-7 h-7 text-emerald-300" /><span className="block mt-2 text-[14px] font-semibold">Música</span></button>
            </div>
          )}
          {processing && <p className="mt-3 text-sm text-neutral-400">Abriendo la foto…</p>}
          {error && <p className="mt-3 text-sm text-garnet-300">{error}</p>}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = '' }} />
          <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <MusicPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(t) => { setPickerOpen(false); setPendingTrack(t); setClipOpen('new') }}
          title="Elige una canción"
        />
        <MusicClipSheet
          open={clipOpen === 'new'}
          track={pendingTrack}
          start={0}
          clip={15}
          onClose={() => { setClipOpen(null); setPendingTrack(null) }}
          onDone={async (s, c) => {
            const t = pendingTrack
            setClipOpen(null)
            if (!t) return
            const cols = await coverColors(t.cover)
            setCoverThemeOk(!!cols)
            const bg: StoryBg = cols ? { type: 'gradient', id: 'cover', colors: cols, angle: 180 } : presetBg('granate')
            apply((d) => ({
              ...d,
              kind: 'text',
              bg,
              music: toStoredTrack(t) as MusicTrack,
              musicStart: s,
              musicClip: c,
              elements: [{ ...base(1), type: 'music', y: 50, style: 'cover-card', theme: 'light' } as StoryMusicEl],
            }))
            setStarted(true)
          }}
        />
      </div>
    )
  }

  // ───────── editor ─────────
  const iconBtn = 'shrink-0 w-11 h-11 max-[380px]:w-9 max-[380px]:h-9 rounded-full bg-black/45 backdrop-blur flex items-center justify-center text-white disabled:opacity-35 active:scale-95 transition touch-manipulation'
  const tabs: [typeof tab, string][] = [['bg', 'Fondo'], ['text', 'Texto'], ['stickers', 'Stickers'], ['music', 'Música']]

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0c0f] text-white overflow-hidden" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void loadFile(e.dataTransfer.files?.[0]) }}>
      <div className="absolute inset-0 flex flex-col md:flex-row md:items-center md:justify-center md:gap-6 md:p-6">
        {/* escenario */}
        <div className="story-editor-area relative flex-1 md:flex-none min-h-0 flex items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="story-editor-stage relative h-full md:h-[min(86dvh,780px)] max-h-full" style={{ aspectRatio: '9 / 16' }}>
            <div
              ref={stageRef}
              className="absolute inset-0 touch-none md:rounded-[18px] overflow-hidden md:shadow-2xl"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              style={{ containerType: 'size' }}
            >
              <StageFrame bg={doc.bg} className="absolute inset-0 w-full h-full" style={{ aspectRatio: 'auto' }}>
                {photoLayers}
                {/* zonas seguras: la cabecera (12 % de arriba) y la barra de respuesta (14 % de abajo) */}
                <div className="absolute inset-x-0 top-0 pointer-events-none border-b border-dashed border-white/25" style={{ height: '12%', background: 'linear-gradient(rgba(0,0,0,.18),transparent)' }} />
                <div className="absolute inset-x-0 bottom-0 pointer-events-none border-t border-dashed border-white/25" style={{ height: '14%', background: 'linear-gradient(transparent,rgba(0,0,0,.18))' }} />
                {guides.v && <div className="absolute top-0 bottom-0 left-1/2 w-px bg-garnet-300 pointer-events-none z-[60]" />}
                {guides.h && <div className="absolute left-0 right-0 top-1/2 h-px bg-garnet-300 pointer-events-none z-[60]" />}
                {sorted.map((el) => {
                  const isSel = el.id === selId
                  return (
                    <div key={el.id} data-el={el.id} style={{ ...elementBoxStyle(el), cursor: 'move', visibility: el.id === editingId ? 'hidden' : 'visible' }}>
                      <div style={{ outline: isSel ? '1.5px dashed rgba(255,255,255,.9)' : undefined, outlineOffset: '1.2cqw', borderRadius: '1cqw' }}>
                        <StoryElementView el={el} ctx={ctxBase} animate={false} />
                      </div>
                      {isSel && !dragging && (
                        <>
                          {['-left-[2.4cqw] -top-[2.4cqw]', '-right-[2.4cqw] -top-[2.4cqw]', '-left-[2.4cqw] -bottom-[2.4cqw]', '-right-[2.4cqw] -bottom-[2.4cqw]'].map((pos) => (
                            <span key={pos} data-handle="1" className={`hidden md:block absolute ${pos} w-[3.2cqw] h-[3.2cqw] rounded-full bg-white border-2 border-garnet-500 cursor-nwse-resize`} />
                          ))}
                        </>
                      )}
                    </div>
                  )
                })}

                {/* edición de texto sobre el escenario */}
                {editing && (
                  <div className="absolute inset-0 z-[70] bg-black/45 flex items-center justify-center" onPointerDown={(e) => e.stopPropagation()}>
                    <textarea
                      ref={textAreaRef}
                      value={editing.text}
                      maxLength={MAX_TEXT_CHARS}
                      rows={1}
                      onChange={(e) => {
                        patchEl(editing.id, { text: e.target.value }, false)
                        e.target.style.height = 'auto'
                        e.target.style.height = `${e.target.scrollHeight}px`
                      }}
                      placeholder="Escribe algo…"
                      aria-label="Texto de la historia"
                      className="bg-transparent outline-none resize-none overflow-hidden placeholder:text-white/50"
                      style={{ ...textStyle(editing), width: '84cqw', maxWidth: '84cqw', transform: `rotate(${editing.rotation}deg) scale(${editing.scale})`, caretColor: '#fff' }}
                    />
                    {editing.text.length >= 180 && <span className="absolute bottom-[16cqw] right-[8cqw] text-[3cqw] text-white/70">{editing.text.length}/{MAX_TEXT_CHARS}</span>}
                  </div>
                )}

                {/* papelera: suelta encima para borrar */}
                {dragging && selId && (
                  <div className={`absolute left-1/2 -translate-x-1/2 bottom-[3%] w-12 h-12 rounded-full flex items-center justify-center z-[80] pointer-events-none transition-transform ${overTrash ? 'bg-garnet-600 scale-125' : 'bg-black/60'}`}>
                    <TrashIcon className="w-6 h-6" />
                  </div>
                )}
              </StageFrame>
            </div>

            {/* herramientas del elemento seleccionado (celular) */}
            {selected && !editing && (
              <div className="md:hidden absolute left-1/2 -translate-x-1/2 bottom-[16%] z-[85] flex items-center gap-1 rounded-full bg-black/70 backdrop-blur px-2 py-1.5">
                <button type="button" className="px-3 py-1.5 text-[12.5px]" onClick={() => setSheet('inspector')}>Ajustes</button>
                {(selected.type === 'music' || selected.type === 'location' || selected.type === 'time') && <button type="button" className="px-3 py-1.5 text-[12.5px]" onClick={() => cycleStyle(selected)}>↻ Estilo</button>}
                {selected.type === 'text' && <button type="button" className="px-3 py-1.5 text-[12.5px]" onClick={() => setEditingId(selected.id)}>Editar</button>}
                <button type="button" aria-label="Borrar" className="px-2.5 py-1.5" onClick={() => removeEl(selected.id)}><TrashIcon className="w-4 h-4" /></button>
              </div>
            )}
            {unsafe && !editing && <p className="absolute left-2 right-2 bottom-[15%] mx-auto w-max max-w-full rounded-full bg-amber-500/90 text-black text-[11px] px-3 py-1 z-[84] pointer-events-none md:static md:mt-2">Algo queda tapado por la cabecera o la barra de respuesta</p>}
            {toast && <p role="status" className="absolute left-2 right-2 top-14 mx-auto w-max max-w-full rounded-full bg-white text-black text-[12.5px] px-4 py-2 z-[90] shadow-lg">{toast}</p>}
          </div>

        {/* barra de herramientas del celular (v1.5.8: anclada a la PANTALLA, ya no al escenario, que en celulares altos era más ancho que la pantalla y dejaba los íconos cortados) */}
        <div className="md:hidden fixed inset-x-0 z-[85] flex items-center gap-1.5 px-3 pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button type="button" onClick={exit} aria-label="Cerrar" className={iconBtn}><CloseIcon className="w-5 h-5" /></button>
                <button type="button" onClick={undo} disabled={hist.u === 0} aria-label="Deshacer" className={iconBtn}><UndoIcon className="w-5 h-5" /></button>
                <button type="button" onClick={redo} disabled={hist.r === 0} aria-label="Rehacer" className={iconBtn}><RedoIcon className="w-5 h-5" /></button>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button type="button" onClick={addText} aria-label="Añadir texto" className={iconBtn}><TextAaIcon className="w-5 h-5" /></button>
                <button type="button" onClick={() => { setView('home'); setSheet('stickers') }} aria-label="Stickers" className={iconBtn}><SmileIcon className="w-5 h-5" /></button>
                <button type="button" onClick={() => { setPickerOpen(true) }} aria-label="Música" className={iconBtn}><MusicIcon className="w-5 h-5" /></button>
                <button type="button" onClick={() => setSheet('bg')} aria-label={doc.kind === 'text' ? 'Fondo' : 'Ajustar foto'} className={iconBtn}><PaletteIcon className="w-5 h-5" /></button>
              </div>
            </div>

          {/* abajo (celular): audiencia + compartir */}
          <div className="md:hidden absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 z-[85]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {audienceChip}
            {shareBtn}
          </div>
          {error && <p role="alert" className="md:hidden absolute left-3 right-3 bottom-20 rounded-xl bg-garnet-700 text-white text-[12.5px] px-3 py-2 z-[90]">{error}</p>}
        </div>

        {/* panel de PC */}
        <aside className="hidden md:flex flex-col w-[360px] h-[min(86dvh,780px)] rounded-2xl bg-[#17171b] border border-white/10 overflow-hidden">
          <div className="flex items-center gap-1 p-2 border-b border-white/10">
            <button type="button" onClick={exit} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><CloseIcon className="w-5 h-5" /></button>
            <button type="button" onClick={undo} disabled={hist.u === 0} aria-label="Deshacer (Ctrl+Z)" className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-35"><UndoIcon className="w-5 h-5" /></button>
            <button type="button" onClick={redo} disabled={hist.r === 0} aria-label="Rehacer (Ctrl+Shift+Z)" className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-35"><RedoIcon className="w-5 h-5" /></button>
            <div className="flex-1" />
            <button type="button" onClick={addText} className="rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[12.5px]">+ Texto <kbd className="opacity-60">T</kbd></button>
          </div>
          <div className="flex border-b border-white/10">
            {tabs.map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setTab(id); if (id === 'stickers') setView('home') }} className={`flex-1 py-2.5 text-[13px] ${tab === id ? 'text-white border-b-2 border-garnet-500 font-semibold' : 'text-neutral-400'}`}>{label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 story-scroll-hide space-y-5">
            {selected && !editing && (
              <section>
                <h2 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">Elemento seleccionado</h2>
                {inspector}
              </section>
            )}
            {editing && <TextControls el={editing} onChange={(p) => patchEl(editing.id, p, false)} />}
            {!selected && !editing && (
              <>
                {tab === 'bg' && BackgroundPanel}
                {tab === 'text' && (
                  <div className="space-y-3">
                    <p className="text-[13px] text-neutral-400">Añade texto en 8 estilos, con colores, fondo y tamaño.</p>
                    <button type="button" onClick={addText} className="w-full rounded-full bg-garnet-600 py-2.5 text-sm font-medium">Añadir texto</button>
                  </div>
                )}
                {tab === 'stickers' && StickersPanel}
                {tab === 'music' && MusicPanel}
              </>
            )}
            {selected && !editing && tab === 'stickers' && view !== 'home' && StickersPanel}
          </div>
          <div className="p-3 border-t border-white/10 space-y-2">
            {error && <p role="alert" className="rounded-lg bg-garnet-700 text-[12.5px] px-3 py-2">{error}</p>}
            {quotaLine}
            <div className="flex items-center gap-2">
              {audienceChip}
              <div className="flex-1" />
              {shareBtn}
            </div>
          </div>
        </aside>
      </div>

      {/* barra de texto sobre el teclado (celular) */}
      {editing && (
        <div className="md:hidden fixed inset-x-0 z-[95] bg-[#17171b]/95 backdrop-blur border-t border-white/10 px-3 pt-3 pb-3" style={{ bottom: kbInset }}>
          <div className="flex justify-end mb-2">
            <button type="button" onClick={finishText} className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-semibold">Listo</button>
          </div>
          <TextControls el={editing} onChange={(p) => patchEl(editing.id, p, false)} compact />
        </div>
      )}
      {editing && <button type="button" onClick={finishText} className="hidden md:block absolute right-6 top-6 z-[95] rounded-full bg-white text-black px-4 py-1.5 text-sm font-semibold">Listo</button>}

      {publishing && (
        <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center" role="status" aria-live="polite">
          <div className="rounded-2xl bg-[#17171b] border border-white/10 px-6 py-5 w-[min(86vw,300px)] text-center">
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden mb-3"><div className="h-full bg-garnet-500 animate-pulse w-2/3" /></div>
            <p className="text-sm">{publishing}</p>
          </div>
        </div>
      )}

      {/* hojas del celular */}
      <Sheet open={!isDesktop && sheet === 'bg'} onClose={() => setSheet(null)} title={doc.kind === 'text' ? 'Fondo' : 'Foto'}>{BackgroundPanel}</Sheet>
      <Sheet open={!isDesktop && sheet === 'stickers'} onClose={() => setSheet(null)} title="Stickers" tall>{StickersPanel}</Sheet>
      <Sheet open={!isDesktop && sheet === 'inspector' && !!selected} onClose={() => setSheet(null)} title="Ajustes">{inspector}</Sheet>

      <MusicPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(t) => { setPickerOpen(false); setPendingTrack(t); setClipOpen('new') }}
        title={doc.music ? 'Reemplazar canción' : 'Elige una canción'}
      />
      <MusicClipSheet
        open={clipOpen !== null}
        track={clipOpen === 'edit' ? doc.music : pendingTrack}
        start={clipOpen === 'edit' ? doc.musicStart : 0}
        clip={clipOpen === 'edit' ? doc.musicClip : 15}
        onClose={() => { setClipOpen(null); setPendingTrack(null) }}
        onDone={(s, c) => {
          if (clipOpen === 'edit' && doc.music) apply((d) => ({ ...d, musicStart: s, musicClip: c }))
          else if (pendingTrack) addMusicSticker(pendingTrack, s, c)
          setClipOpen(null)
          setPendingTrack(null)
        }}
      />
      <AudienceSheet open={audienceOpen} value={audience} friendsCount={friendsCount} onClose={() => setAudienceOpen(false)} onPick={(a) => { setAudience(a); lsSet('daiwa_story_audience', a) }} />

      <Sheet open={!!musicRemoveAsk} onClose={() => setMusicRemoveAsk(null)} title="Quitar el sticker de música" z={150}>
        <div className="space-y-2">
          <button type="button" className="w-full rounded-xl border border-white/15 px-4 py-3 text-left text-[14.5px] hover:bg-white/5" onClick={() => { apply((d) => ({ ...d, music: null, elements: d.elements.filter((e) => e.type !== 'music') })); setSelId(null); setMusicRemoveAsk(null) }}>
            Quitar también el sonido
          </button>
          <button type="button" className="w-full rounded-xl border border-white/15 px-4 py-3 text-left text-[14.5px] hover:bg-white/5" onClick={() => { apply((d) => ({ ...d, elements: d.elements.filter((e) => e.type !== 'music') })); setSelId(null); setMusicRemoveAsk(null) }}>
            Mantener solo el sonido
          </button>
        </div>
      </Sheet>

      <Sheet open={discardAsk} onClose={() => setDiscardAsk(false)} title="¿Descartar historia?" z={150}
        footer={<div className="flex gap-3"><button type="button" onClick={() => setDiscardAsk(false)} className="flex-1 rounded-full border border-white/20 py-2.5 text-sm">Seguir editando</button><button type="button" onClick={() => { if (window.history.length > 1) router.back(); else router.push('/') }} className="flex-1 rounded-full bg-garnet-600 py-2.5 text-sm font-medium">Descartar</button></div>}>
        <p className="text-sm text-neutral-300">Perderás los cambios de esta historia.</p>
      </Sheet>

      <Sheet open={firstNotice} onClose={() => setFirstNotice(false)} title="Antes de publicar" z={150}
        footer={<button type="button" onClick={() => { lsSet(FIRST_KEY, '1'); setFirstNotice(false); void publish() }} className="w-full rounded-full bg-garnet-600 py-2.5 text-sm font-medium">Entendido, publicar</button>}>
        <div className="space-y-3 text-sm text-neutral-300">
          <p>Tu historia desaparece para los demás en 24 horas. Tú la conservas en tu archivo privado 30 días para poder armar destacadas.</p>
          <p className="text-[13px] text-neutral-400">Quien ve tu historia podría hacer una captura de pantalla.</p>
          {quota && <p className="text-[12.5px] text-neutral-500">{quotaMessage(quota)}{quota.resetsAt ? ` (${untilLabel(quota.resetsAt)})` : ''}</p>}
        </div>
      </Sheet>
    </div>
  )
}
