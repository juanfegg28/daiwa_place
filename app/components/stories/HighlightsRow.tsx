'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon, GripIcon, MoreIcon, PlusIcon } from '../icons'
import Sheet from './Sheet'
import HighlightCover from './HighlightCover'
import HighlightWizard from './HighlightWizard'
import { STORIES_CHANGED_EVENT, deleteHighlight, emitStoriesChanged, fetchHighlights, reorderHighlights, type HighlightRow } from '../../lib/stories'

/**
 * Fila de destacadas del perfil (debajo de bio y contadores, encima de las publicaciones).
 * En perfiles ajenos solo aparecen las que tengan al menos una historia visible para ti; si no hay, no deja espacio.
 */
export default function HighlightsRow({ profileId, username, isOwn }: { profileId: string; username: string; isOwn: boolean }) {
  const router = useRouter()
  const [list, setList] = useState<HighlightRow[]>([])
  const [loading, setLoading] = useState(true)
  const [wizard, setWizard] = useState<{ open: boolean; editing: HighlightRow | null }>({ open: false, editing: null })
  const [manage, setManage] = useState<HighlightRow | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [sorting, setSorting] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const press = useRef<number | null>(null)
  const longPressed = useRef(false)

  const load = useCallback(async () => {
    setList(await fetchHighlights(profileId))
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    function run() {
      void load()
    }
    run()
    window.addEventListener(STORIES_CHANGED_EVENT, run)
    return () => window.removeEventListener(STORIES_CHANGED_EVENT, run)
  }, [load])

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])
  useEffect(() => {
    const t = window.setTimeout(updateArrows, 50)
    return () => window.clearTimeout(t)
  }, [list, updateArrows])

  const move = async (id: string, dir: -1 | 1) => {
    const i = list.findIndex((h) => h.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    setList(next)
    await reorderHighlights(next.map((h) => h.id))
  }

  const dropOn = async (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const from = list.findIndex((h) => h.id === dragId)
    const to = list.findIndex((h) => h.id === targetId)
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setList(next)
    setDragId(null)
    await reorderHighlights(next.map((h) => h.id))
  }

  if (loading && !isOwn) return <div className="h-[104px]" aria-hidden="true" />
  if (!isOwn && list.length === 0) return null

  const open = (h: HighlightRow) => router.push(`/historias/${username}?h=${h.id}`)
  const arrowCls = 'hidden md:flex absolute top-[34px] -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-ink-800/95 border border-ink-600 text-neutral-200 shadow-lg hover:bg-ink-700'

  return (
    <div className="relative mt-4 -mx-1" style={{ minHeight: loading ? 104 : undefined }}>
      {canLeft && <button type="button" onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={`${arrowCls} left-0`} aria-label="Ver destacadas anteriores"><ChevronLeftIcon className="w-4 h-4" /></button>}
      {canRight && <button type="button" onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={`${arrowCls} right-0`} aria-label="Ver más destacadas"><ChevronRightIcon className="w-4 h-4" /></button>}
      <div ref={scrollRef} onScroll={updateArrows} className="flex gap-4 overflow-x-auto px-1 pb-2 story-scroll-hide">
        {isOwn && (
          <div className="shrink-0 flex flex-col items-center w-[72px] md:w-[84px]">
            <button type="button" onClick={() => setWizard({ open: true, editing: null })} aria-label="Nueva destacada" className="w-16 h-16 md:w-[76px] md:h-[76px] rounded-full border-2 border-dashed border-ink-500 flex items-center justify-center text-garnet-400 hover:border-garnet-400 transition">
              <PlusIcon className="w-7 h-7" />
            </button>
            <span className="mt-1 text-[12px] text-neutral-300">Nueva</span>
          </div>
        )}
        {list.map((h, i) => (
          <div
            key={h.id}
            className="group relative shrink-0 flex flex-col items-center w-[72px] md:w-[84px]"
            draggable={isOwn && sorting}
            onDragStart={() => setDragId(h.id)}
            onDragOver={(e) => sorting && e.preventDefault()}
            onDrop={() => void dropOn(h.id)}
          >
            <button
              type="button"
              onClick={() => {
                // si el toque largo ya abrió el menú, soltar el dedo NO debe abrir la destacada
                if (longPressed.current) {
                  longPressed.current = false
                  return
                }
                if (!sorting) open(h)
              }}
              onContextMenu={(e) => {
                if (!isOwn) return
                e.preventDefault()
                longPressed.current = true
                setManage(h)
              }}
              onPointerDown={() => {
                longPressed.current = false
                if (isOwn && !sorting) {
                  press.current = window.setTimeout(() => {
                    longPressed.current = true
                    setManage(h)
                  }, 520)
                }
              }}
              onPointerUp={() => press.current && window.clearTimeout(press.current)}
              onPointerLeave={() => press.current && window.clearTimeout(press.current)}
              onPointerCancel={() => press.current && window.clearTimeout(press.current)}
              aria-label={`Destacada ${h.title}`}
              className="rounded-full p-[3px] border-[1.5px] border-ink-500 group-hover:border-ink-400 group-hover:-translate-y-0.5 transition touch-manipulation select-none"
              style={{ WebkitTouchCallout: 'none' }}
            >
              <span className="block md:hidden"><HighlightCover cover={h.cover} size={58} /></span>
              <span className="hidden md:block"><HighlightCover cover={h.cover} size={70} /></span>
            </button>
            {isOwn && !sorting && (
              <button type="button" onClick={() => { longPressed.current = false; setManage(h) }} aria-label={`Opciones de ${h.title}`} className="hidden md:flex absolute -top-1 -right-0 w-6 h-6 rounded-full bg-ink-800 border border-ink-600 items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <MoreIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {sorting && (
              <div className="mt-0.5 flex items-center gap-0.5 text-neutral-400">
                <button type="button" onClick={() => void move(h.id, -1)} disabled={i === 0} aria-label="Mover a la izquierda" className="p-0.5 disabled:opacity-30"><ChevronLeftIcon className="w-4 h-4" /></button>
                <GripIcon className="w-4 h-4 cursor-grab" />
                <button type="button" onClick={() => void move(h.id, 1)} disabled={i === list.length - 1} aria-label="Mover a la derecha" className="p-0.5 disabled:opacity-30"><ChevronRightIcon className="w-4 h-4" /></button>
              </div>
            )}
            <span className="mt-1 w-full truncate text-center text-[12px] text-neutral-300">{h.title}</span>
          </div>
        ))}
      </div>
      {isOwn && list.length === 0 && !loading && <p className="px-1 -mt-0.5 text-[12.5px] text-neutral-500">Guarda tus mejores historias para siempre.</p>}
      {isOwn && sorting && (
        <button type="button" onClick={() => setSorting(false)} className="mx-1 mt-1 rounded-full bg-garnet-600 px-4 py-1.5 text-xs font-medium text-white">Listo</button>
      )}

      <Sheet open={!!manage && !confirmDel} onClose={() => { longPressed.current = false; setManage(null) }} title={manage?.title}>
        <div className="space-y-1">
          <button type="button" className="w-full rounded-xl px-3 py-3 text-left text-[14.5px] hover:bg-white/8" onClick={() => { setWizard({ open: true, editing: manage }); setManage(null) }}>Editar destacada</button>
          {list.length > 1 && <button type="button" className="w-full rounded-xl px-3 py-3 text-left text-[14.5px] hover:bg-white/8" onClick={() => { setSorting(true); setManage(null) }}>Reordenar</button>}
          <button type="button" className="w-full rounded-xl px-3 py-3 text-left text-[14.5px] text-garnet-300 hover:bg-white/8" onClick={() => setConfirmDel(true)}>Eliminar</button>
        </div>
      </Sheet>
      <Sheet
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title={`¿Eliminar la destacada “${manage?.title ?? ''}”?`}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setConfirmDel(false)} className="flex-1 rounded-full border border-white/20 py-2.5 text-sm">Cancelar</button>
            <button
              type="button"
              onClick={async () => {
                if (manage) await deleteHighlight(manage.id)
                setConfirmDel(false)
                setManage(null)
                emitStoriesChanged()
                void load()
              }}
              className="flex-1 rounded-full bg-garnet-600 py-2.5 text-sm font-medium"
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-neutral-300">Las historias seguirán en tu archivo hasta que venzan sus 30 días.</p>
      </Sheet>
      <HighlightWizard
        open={wizard.open}
        editing={wizard.editing}
        startAt={wizard.editing ? 2 : 1}
        userId={profileId}
        onClose={() => setWizard({ open: false, editing: null })}
        onSaved={() => { emitStoriesChanged(); void load() }}
      />
    </div>
  )
}
