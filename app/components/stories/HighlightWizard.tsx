'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, ChevronLeftIcon, ImageIcon } from '../icons'
import { supabase } from '../../lib/supabaseClient'
import Sheet from './Sheet'
import StoryThumb from './StoryThumb'
import HighlightCover from './HighlightCover'
import ScrollStrip from './ScrollStrip'
import {
  COVER_BUCKET,
  COVER_STYLES,
  MAX_HIGHLIGHT_STORIES,
  coverStyleCss,
  fetchArchive,
  fetchHighlightStories,
  fetchStorySettings,
  friendlyStoryError,
  newId,
  saveHighlight,
  signedStoryUrls,
  type HighlightCover as Cover,
  type HighlightRow,
  type StoryRow,
} from '../../lib/stories'
import { bakeCover, checkImageFile, loadPhoto, type PhotoSource } from '../../lib/storyBake'

type CoverTab = 'stories' | 'gallery' | 'styles'

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('es', { month: 'long', year: 'numeric' })
}

/** Recorte circular: arrastrar para mover, deslizador (o rueda) para acercar de 1× a 3× */
function CoverCropper({ src, crop, onCrop }: { src: PhotoSource; crop: { zoom: number; ox: number; oy: number }; onCrop: (c: { zoom: number; ox: number; oy: number }) => void }) {
  const SIZE = 200
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const wFrac = (src.aspect >= 1 ? src.aspect : 1) * crop.zoom
  const hFrac = wFrac / src.aspect
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-full overflow-hidden bg-[#0c0c0f] touch-none cursor-grab border border-white/15"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, ox: crop.ox, oy: crop.oy }
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          onCrop({ ...crop, ox: drag.current.ox + (e.clientX - drag.current.x) / SIZE, oy: drag.current.oy + (e.clientY - drag.current.y) / SIZE })
        }}
        onPointerUp={() => (drag.current = null)}
        onWheel={(e) => onCrop({ ...crop, zoom: Math.min(3, Math.max(1, crop.zoom - e.deltaY * 0.002)) })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src.url} alt="" draggable={false} className="absolute pointer-events-none max-w-none" style={{ width: `${wFrac * 100}%`, height: `${hFrac * 100}%`, left: `${(0.5 + crop.ox - wFrac / 2) * 100}%`, top: `${(0.5 + crop.oy - hFrac / 2) * 100}%` }} />
      </div>
      <label className="flex items-center gap-3 text-xs text-neutral-400 w-full max-w-[240px]">
        Zoom
        <input type="range" min={100} max={300} value={Math.round(crop.zoom * 100)} onChange={(e) => onCrop({ ...crop, zoom: Number(e.target.value) / 100 })} className="flex-1 accent-[var(--color-garnet-500)]" />
      </label>
    </div>
  )
}

/**
 * Asistente de destacadas (3 pasos): 1) elegir historias, 2) portada y título, 3) listo.
 * Sirve para crear y para editar. Con `startAt = 2` salta directo a portada y título (desde el visor).
 */
export default function HighlightWizard({
  open,
  onClose,
  userId,
  editing = null,
  preselect = [],
  startAt = 1,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  userId: string
  editing?: HighlightRow | null
  preselect?: string[]
  startAt?: 1 | 2
  onSaved: (id: string | null) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(startAt)
  const [stories, setStories] = useState<StoryRow[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'archive'>('active')
  const [archiveDays, setArchiveDays] = useState(30)
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState('Destacadas')
  const [coverTab, setCoverTab] = useState<CoverTab>('stories')
  const [coverStory, setCoverStory] = useState<string | null>(null)
  const [styleId, setStyleId] = useState<string | null>(null)
  const [src, setSrc] = useState<PhotoSource | null>(null)
  const [crop, setCrop] = useState({ zoom: 1, ox: 0, oy: 0 })
  const [understood, setUnderstood] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedCover, setSavedCover] = useState<Cover | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const startRef = useRef(false)

  const reset = useCallback(() => {
    setStep(startAt)
    setTab('active')
    setError('')
    setSaving(false)
    setSrc(null)
    setCrop({ zoom: 1, ox: 0, oy: 0 })
    setCoverTab('stories')
    setCoverStory(null)
    setStyleId(null)
    setUnderstood(false)
    setSavedCover(null)
  }, [startAt])

  useEffect(() => {
    if (!open) {
      startRef.current = false
      return
    }
    if (startRef.current) return
    startRef.current = true
    reset()
    async function load() {
      setLoading(true)
      const [list, settings] = await Promise.all([fetchArchive(null, 200), fetchStorySettings()])
      setStories(list)
      setArchiveDays(settings.archive_days)
      const paths = list.map((s) => s.media_path).filter((p): p is string => !!p)
      if (paths.length) setUrls(await signedStoryUrls(paths))
      if (editing) {
        const inside = await fetchHighlightStories(editing.id)
        setSelected(inside.map((s) => s.id))
        setTitle(editing.title)
        if (editing.cover.type === 'style') {
          setCoverTab('styles')
          setStyleId(editing.cover.id)
        }
      } else {
        setSelected(preselect)
        setTitle('Destacadas')
      }
      setLoading(false)
    }
    void load()
  }, [open, editing, preselect, reset])

  const visible = useMemo(() => stories.filter((s) => (tab === 'active' ? s.is_active : !s.is_active)), [stories, tab])
  const months = useMemo(() => {
    const m = new Map<string, StoryRow[]>()
    for (const s of visible) {
      const k = monthLabel(s.created_at)
      m.set(k, [...(m.get(k) ?? []), s])
    }
    return [...m.entries()]
  }, [visible])
  const selectedRows = selected.map((id) => stories.find((s) => s.id === id)).filter((s): s is StoryRow => !!s)
  const photoRows = selectedRows.filter((s) => s.kind === 'photo' && s.media_path)

  const toggle = (id: string) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= MAX_HIGHLIGHT_STORIES) return cur
      return [...cur, id]
    })
  }

  // el recorte parte de la foto de la historia elegida
  const pickCoverStory = async (s: StoryRow) => {
    setCoverStory(s.id)
    setStyleId(null)
    setUnderstood(false)
    const url = s.media_path ? urls[s.media_path] : null
    if (!url) return
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      setSrc(await loadPhoto(new File([blob], 'portada.jpg', { type: blob.type || 'image/jpeg' })))
      setCrop({ zoom: 1, ox: 0, oy: 0 })
      setError('')
    } catch {
      setError('No se pudo abrir esa foto. Prueba con otra.')
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const bad = checkImageFile(file)
    if (bad) {
      setError(bad)
      return
    }
    try {
      setSrc(await loadPhoto(file))
      setCrop({ zoom: 1, ox: 0, oy: 0 })
      setStyleId(null)
      setCoverStory(null)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer la foto.')
    }
  }

  const coverIsFriends = coverTab === 'stories' && !!coverStory && stories.find((s) => s.id === coverStory)?.audience === 'friends'
  const hasCover = coverTab === 'styles' ? !!styleId : !!src
  const keepOldCover = !!editing && editing.cover.type === 'image' && coverTab === 'stories' && !src

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      let cover: Cover
      if (coverTab === 'styles' && styleId) cover = { type: 'style', id: styleId }
      else if (src) {
        const blob = await bakeCover(src, crop)
        const path = `${userId}/${newId()}.jpg`
        const up = await supabase.storage.from(COVER_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        if (up.error) throw new Error(friendlyStoryError(up.error.message))
        cover = { type: 'image', url: supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl }
      } else if (keepOldCover && editing) cover = editing.cover
      else throw new Error('Elige una portada.')
      const res = await saveHighlight(editing?.id ?? null, title.trim() || 'Destacadas', cover, selected)
      if (res.error) throw new Error(res.error)
      setSavedCover(cover)
      setStep(3)
      onSaved(res.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la destacada.')
    }
    setSaving(false)
  }

  const canNext1 = selected.length >= 1
  const canSave = (hasCover || keepOldCover) && title.trim().length >= 1 && selected.length >= 1 && (!coverIsFriends || understood) && !saving

  const header = (
    <div className="flex items-center justify-between -mt-1 mb-3 gap-2">
      {step === 2 && startAt === 1 ? (
        <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-neutral-300">
          <ChevronLeftIcon className="w-4 h-4" /> Atrás
        </button>
      ) : (
        <span />
      )}
      {step === 1 && (
        <button type="button" disabled={!canNext1} onClick={() => setStep(2)} className="rounded-full bg-garnet-600 px-4 py-1.5 text-sm font-medium disabled:opacity-40">
          Siguiente
        </button>
      )}
      {step === 2 && (
        <button type="button" disabled={!canSave} onClick={save} className="rounded-full bg-garnet-600 px-4 py-1.5 text-sm font-medium disabled:opacity-40">
          {saving ? 'Guardando…' : 'Listo'}
        </button>
      )}
    </div>
  )

  return (
    <Sheet open={open} onClose={onClose} tall z={160} title={step === 1 ? 'Elige las historias' : step === 2 ? 'Portada y título' : '¡Lista tu destacada!'}>
      {step !== 3 && header}

      {step === 1 && (
        <div>
          <div className="flex gap-2 mb-3">
            {(['active', ...(archiveDays > 0 ? ['archive'] : [])] as ('active' | 'archive')[]).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-3.5 py-1.5 text-[13px] ${tab === t ? 'bg-white text-black font-medium' : 'bg-white/10 text-neutral-200'}`}>
                {t === 'active' ? 'Activas' : 'Archivo'}
              </button>
            ))}
            <span className="ml-auto self-center text-[12.5px] text-neutral-400">{selected.length} de {MAX_HIGHLIGHT_STORIES}</span>
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-neutral-500">Cargando…</p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">{tab === 'active' ? 'No tienes historias activas ahora mismo.' : 'Tu archivo está vacío.'}</p>
          ) : (
            months.map(([month, rows]) => (
              <section key={month} className="mb-4">
                {tab === 'archive' && <h3 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400 mb-1.5 capitalize">{month}</h3>}
                <div className="grid grid-cols-3 gap-1.5">
                  {rows.map((s) => {
                    const idx = selected.indexOf(s.id)
                    return (
                      <button key={s.id} type="button" onClick={() => toggle(s.id)} aria-pressed={idx >= 0} className="relative rounded-lg overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white">
                        <StoryThumb story={s} url={s.media_path ? urls[s.media_path] : null} />
                        <span className="absolute left-1 bottom-1 rounded bg-black/55 text-[10px] px-1">{new Date(s.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '')}</span>
                        {s.is_active && <span className="absolute left-1 top-1 rounded bg-emerald-600 text-[9px] px-1 font-semibold">Activa</span>}
                        <span className={`absolute right-1 top-1 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${idx >= 0 ? 'bg-garnet-600 text-white' : 'border-2 border-white/80 bg-black/20'}`}>{idx >= 0 ? idx + 1 : ''}</span>
                        {idx >= 0 && <span className="absolute inset-0 ring-2 ring-garnet-500 rounded-lg" />}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-1.5">
            {src && coverTab !== 'styles' ? (
              <CoverCropper src={src} crop={crop} onCrop={setCrop} />
            ) : coverTab === 'styles' && styleId ? (
              <HighlightCover cover={{ type: 'style', id: styleId }} size={110} />
            ) : keepOldCover && editing ? (
              <HighlightCover cover={editing.cover} size={110} />
            ) : (
              <span className="w-[110px] h-[110px] rounded-full border border-dashed border-white/30 flex items-center justify-center text-neutral-500"><ImageIcon className="w-7 h-7" /></span>
            )}
            <span className="text-[13px] text-neutral-200 max-w-[110px] truncate">{title || 'Destacadas'}</span>
          </div>

          <div className="flex gap-1.5 justify-center">
            {([['stories', 'De tus historias'], ['gallery', 'De la galería'], ['styles', 'Estilos']] as [CoverTab, string][]).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setCoverTab(id)} className={`rounded-full px-3 py-1.5 text-[12.5px] ${coverTab === id ? 'bg-white text-black font-medium' : 'bg-white/10 text-neutral-200'}`}>
                {label}
              </button>
            ))}
          </div>

          {coverTab === 'stories' && (
            photoRows.length === 0 ? (
              <p className="text-center text-[13px] text-neutral-400">Ninguna de las historias elegidas tiene foto. Usa un estilo o una foto de tu galería.</p>
            ) : (
              <ScrollStrip>
                {photoRows.map((s) => (
                  <button key={s.id} type="button" onClick={() => void pickCoverStory(s)} className={`shrink-0 w-[68px] rounded-lg overflow-hidden ${coverStory === s.id ? 'ring-2 ring-garnet-500' : ''}`}>
                    <StoryThumb story={s} url={s.media_path ? urls[s.media_path] : null} />
                  </button>
                ))}
              </ScrollStrip>
            )
          )}
          {coverTab === 'gallery' && (
            <div className="text-center">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Elegir una foto</button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
            </div>
          )}
          {coverTab === 'styles' && (
            <div className="grid grid-cols-6 gap-2 justify-items-center">
              {COVER_STYLES.map((c) => (
                <button key={c.id} type="button" onClick={() => { setStyleId(c.id); setSrc(null) }} aria-label={`Estilo ${c.id}`} className={`rounded-full ${styleId === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#17171b]' : ''}`}>
                  <span className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: coverStyleCss(c.id).background, color: c.iconColor }}>{c.icon}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12.5px] text-neutral-400">Historias ({selected.length})</span>
              <button type="button" onClick={() => setStep(1)} className="text-[12.5px] font-medium text-garnet-300 hover:text-garnet-200">＋ Añadir historias</button>
            </div>
            <ScrollStrip>
              {selectedRows.map((s) => (
                <div key={s.id} className="relative shrink-0 w-[58px] rounded-lg overflow-hidden">
                  <StoryThumb story={s} url={s.media_path ? urls[s.media_path] : null} />
                  <button
                    type="button"
                    disabled={selected.length <= 1}
                    onClick={() => setSelected((cur) => cur.filter((x) => x !== s.id))}
                    aria-label="Quitar de la destacada"
                    className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-[11px] leading-none flex items-center justify-center disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </ScrollStrip>
            {selected.length <= 1 && <p className="mt-1 text-[11.5px] text-neutral-500">Una destacada necesita al menos una historia. Para borrarla entera usa «Eliminar» en su menú.</p>}
          </div>

          <label className="block">
            <span className="text-[12.5px] text-neutral-400 flex justify-between mb-1"><span>Título</span><span>{title.length}/16</span></span>
            <input value={title} maxLength={16} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-[15px] outline-none focus:border-garnet-500" />
          </label>

          <p className="text-[12px] text-neutral-400">La portada la podrán ver todas las personas que vean tu perfil.</p>
          {coverIsFriends && (
            <label className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[12.5px] text-amber-200">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5" />
              Esa historia era solo para amigos, pero la portada será visible para cualquiera que vea tu perfil. Entiendo.
            </label>
          )}
          {error && <p className="text-[12.5px] text-garnet-300">{error}</p>}
        </div>
      )}

      {step === 3 && savedCover && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <HighlightCover cover={savedCover} size={110} />
          <p className="text-[15px] font-semibold">{title}</p>
          <p className="text-[13px] text-neutral-400 flex items-center gap-1"><CheckIcon className="w-4 h-4 text-emerald-400" /> Guardada en tu perfil</p>
          <button type="button" onClick={onClose} className="mt-2 rounded-full bg-garnet-600 px-6 py-2.5 text-sm font-medium">Ver destacada</button>
        </div>
      )}
    </Sheet>
  )
}
