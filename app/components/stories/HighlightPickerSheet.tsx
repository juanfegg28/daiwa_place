'use client'

import { useCallback, useEffect, useState } from 'react'
import { PlusIcon, CheckIcon } from '../icons'
import Sheet from './Sheet'
import HighlightWizard from './HighlightWizard'
import HighlightCover from './HighlightCover'
import { emitStoriesChanged, fetchHighlights, highlightsContaining, toggleHighlightStory, type HighlightRow } from '../../lib/stories'

/** «★ Destacar» desde el visor: tus destacadas con ✓ si esta historia ya está + «Nueva destacada» */
export default function HighlightPickerSheet({ open, onClose, storyId, userId }: { open: boolean; onClose: () => void; storyId: string; userId: string }) {
  const [list, setList] = useState<HighlightRow[]>([])
  const [inside, setInside] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [wizard, setWizard] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const hs = await fetchHighlights(userId)
    setList(hs)
    setInside(await highlightsContaining(storyId, hs))
    setLoading(false)
  }, [userId, storyId])

  useEffect(() => {
    if (!open) return
    function run() {
      void load()
    }
    run()
  }, [open, load])

  const toggle = async (h: HighlightRow) => {
    const add = !inside.has(h.id)
    const err = await toggleHighlightStory(h.id, storyId, add)
    if (err) {
      setMsg(err)
      return
    }
    setInside((s) => {
      const n = new Set(s)
      if (add) n.add(h.id)
      else n.delete(h.id)
      return n
    })
    setMsg(add ? `Añadida a “${h.title}”.` : `Quitada de “${h.title}”.`)
    emitStoriesChanged()
  }

  return (
    <>
      <Sheet open={open && !wizard} onClose={onClose} title="Agregar a destacadas" z={150}>
        <button type="button" onClick={() => setWizard(true)} className="w-full flex items-center gap-3 rounded-xl border border-dashed border-white/25 px-3 py-3 mb-3 hover:bg-white/5">
          <span className="w-12 h-12 rounded-full border border-dashed border-white/40 flex items-center justify-center text-garnet-400">
            <PlusIcon className="w-6 h-6" />
          </span>
          <span className="text-[14.5px] font-medium">Nueva destacada</span>
        </button>
        {loading ? (
          <p className="text-sm text-neutral-500 py-4 text-center">Cargando…</p>
        ) : (
          <ul className="space-y-1">
            {list.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => void toggle(h)} className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 text-left">
                  <HighlightCover cover={h.cover} size={48} />
                  <span className="flex-1 min-w-0 text-[14.5px] truncate">{h.title}</span>
                  {inside.has(h.id) && <CheckIcon className="w-5 h-5 text-emerald-400" />}
                </button>
              </li>
            ))}
          </ul>
        )}
        {msg && <p role="status" className="mt-3 text-[12.5px] text-emerald-300">{msg}</p>}
      </Sheet>
      <HighlightWizard
        open={open && wizard}
        onClose={() => setWizard(false)}
        userId={userId}
        preselect={[storyId]}
        startAt={2}
        onSaved={() => {
          setWizard(false)
          emitStoriesChanged()
          void load()
        }}
      />
    </>
  )
}
