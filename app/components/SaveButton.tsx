'use client'

// v1.9.0 · Botón de guardar publicación (privado). Un toque guarda; el menú deja elegir colección o quitarla de guardados.
import { memo, useEffect, useRef, useState } from 'react'
import { BookmarkIcon, CheckIcon, FolderIcon, PlusIcon } from './icons'
import {
  createCollection,
  getSavedOverview,
  savePost,
  unsavePost,
  type SavedOverview,
} from '../lib/saved'

type Props = {
  postId: string
  initiallySaved: boolean
  disabled?: boolean
  /** Avisa a la página (p. ej. «Guardados») cuando se guarda, se mueve o se quita */
  onChange?: (saved: boolean, collectionId: string | null) => void
}

function SaveButton({ postId, initiallySaved, disabled = false, onChange }: Props) {
  const [saved, setSaved] = useState(initiallySaved)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ov, setOv] = useState<SavedOverview | null>(null)
  const [current, setCurrent] = useState<string | null>(null) // colección donde la acabas de poner (solo en esta sesión)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const box = useRef<HTMLDivElement>(null)

  // si la publicación se vuelve a cargar con otro estado, se sigue lo que diga el servidor (patrón «ajustar durante el render»)
  const [prevInitial, setPrevInitial] = useState(initiallySaved)
  if (prevInitial !== initiallySaved) {
    setPrevInitial(initiallySaved)
    setSaved(initiallySaved)
  }
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = async () => {
    if (busy || disabled) return
    setError('')
    if (saved) {
      setOpen((v) => !v)
      if (!ov) void getSavedOverview().then(setOv)
      return
    }
    setBusy(true)
    setSaved(true) // al instante
    const err = await savePost(postId, null)
    setBusy(false)
    if (err) {
      setSaved(false)
      setError(err)
      setOpen(true)
      return
    }
    setCurrent(null)
    setOpen(true)
    onChange?.(true, null)
    void getSavedOverview(true).then(setOv)
  }

  const moveTo = async (collectionId: string | null) => {
    setBusy(true)
    const err = await savePost(postId, collectionId)
    setBusy(false)
    if (err) return setError(err)
    setCurrent(collectionId ?? '')
    setOpen(false)
    onChange?.(true, collectionId)
  }

  const remove = async () => {
    setBusy(true)
    const err = await unsavePost(postId)
    setBusy(false)
    if (err) return setError(err)
    setSaved(false)
    setOpen(false)
    onChange?.(false, null)
  }

  const addCollection = async () => {
    if (!newName.trim()) return
    setBusy(true)
    const { collection, error: err } = await createCollection(newName)
    if (err || !collection) {
      setBusy(false)
      return setError(err)
    }
    await moveTo(collection.id)
    setNewName('')
    setAdding(false)
    setOv(null)
  }

  return (
    <div ref={box} className="relative ml-auto">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={saved}
        aria-label={saved ? 'Guardada. Toca para ver opciones' : 'Guardar publicación'}
        title={saved ? 'Guardada' : 'Guardar'}
        className={`flex items-center rounded-full p-1.5 -m-1.5 transition disabled:opacity-40 ${saved ? 'text-amber-300' : 'hover:text-amber-300'}`}
      >
        <BookmarkIcon filled={saved} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 bottom-full mb-2 z-30 w-60 max-w-[80vw] rounded-xl border border-ink-600 bg-ink-800 shadow-xl shadow-black/40 p-1.5 text-sm"
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] uppercase tracking-wide text-neutral-500">
            {saved ? 'Guardada ✓ · solo tú la ves' : 'Guardar en…'}
          </p>
          <button
            type="button"
            onClick={() => moveTo(null)}
            disabled={busy}
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-neutral-200 hover:bg-ink-700 transition"
          >
            <BookmarkIcon className="w-4 h-4 text-neutral-400" />
            <span className="flex-1">Sin colección</span>
            {current === '' && <CheckIcon className="w-4 h-4 text-garnet-400" />}
          </button>
          {ov?.collections.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => moveTo(c.id)}
              disabled={busy}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-neutral-200 hover:bg-ink-700 transition"
            >
              <FolderIcon className="w-4 h-4 text-neutral-400" />
              <span className="flex-1 truncate">{c.name}</span>
              {current === c.id && <CheckIcon className="w-4 h-4 text-garnet-400" />}
            </button>
          ))}
          {adding ? (
            <div className="flex items-center gap-1.5 p-1.5">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, 30))}
                onKeyDown={(e) => e.key === 'Enter' && addCollection()}
                placeholder="Nombre de la colección"
                className="flex-1 min-w-0 rounded-lg bg-ink-700 border border-ink-600 px-2.5 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-garnet-500"
              />
              <button type="button" onClick={addCollection} disabled={busy || !newName.trim()} className="rounded-lg bg-garnet-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                Crear
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-garnet-400 hover:bg-ink-700 transition"
            >
              <PlusIcon className="w-4 h-4" /> Nueva colección
            </button>
          )}
          {saved && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="w-full mt-0.5 rounded-lg px-2.5 py-2 text-left text-neutral-400 hover:text-garnet-400 hover:bg-ink-700 border-t border-ink-700 transition"
            >
              Quitar de guardados
            </button>
          )}
          {error && <p className="px-2.5 py-1.5 text-xs text-garnet-400">{error}</p>}
        </div>
      )}
    </div>
  )
}

export default memo(SaveButton)
