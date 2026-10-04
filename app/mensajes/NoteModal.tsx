'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CloseIcon, HeartIcon, MusicIcon } from '../components/icons'
import UserAvatar from '../components/UserAvatar'
import MusicChip from '../components/MusicChip'
import { MAX_NOTE_LENGTH, friendlyDmError, type NoteItem } from '../lib/dm'

type Liker = {
  user_id: string
  profiles: { username: string; id_student: string | null; avatar_url: string | null } | null
}

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'venció'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

/** Ventana para crear tu nota, o para ver una nota (con sus likes). */
export default function NoteModal({
  note,
  isMine,
  me,
  open,
  onClose,
  onChanged,
  onToggleLike,
}: {
  note: NoteItem | null
  isMine: boolean
  me: string
  open: boolean
  onClose: () => void
  onChanged: () => void
  onToggleLike: (note: NoteItem) => void
}) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [likers, setLikers] = useState<Liker[]>([])
  const [composing, setComposing] = useState(false)

  useEffect(() => {
    if (!open) return
    function reset() {
      setText('')
      setError('')
      setComposing(false)
    }
    reset()
  }, [open, note?.id])

  // Quiénes le dieron like (los ve cualquiera que pueda ver la nota)
  useEffect(() => {
    if (!open || !note) return
    const noteId = note.id
    let cancelled = false
    async function run() {
      const { data } = await supabase
        .from('note_likes')
        .select('user_id, profiles!note_likes_user_id_fkey(username, id_student, avatar_url)')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false })
      if (!cancelled) setLikers((data as unknown as Liker[]) ?? [])
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, note, note?.note_likes.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, saving, onClose])

  if (!open) return null

  const showComposer = isMine && (!note || composing)
  const likedByMe = !!note && note.note_likes.some((l) => l.user_id === me)

  const publish = async () => {
    const clean = text.trim()
    if (!clean || saving) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.rpc('set_note', { p_content: clean })
    setSaving(false)
    if (err) {
      setError(friendlyDmError(err.message))
      return
    }
    onChanged()
    onClose()
  }

  const remove = async () => {
    if (!note || saving) return
    setSaving(true)
    const { error: err } = await supabase.from('notes').delete().eq('id', note.id)
    setSaving(false)
    if (err) {
      setError(friendlyDmError(err.message))
      return
    }
    onChanged()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="surface-raised border border-ink-600 rounded-2xl p-5 w-full max-w-sm max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-neutral-50">
            {showComposer ? 'Nueva nota' : isMine ? 'Tu nota' : `Nota de ${note?.profiles?.id_student || note?.profiles?.username || ''}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-100 hover:bg-ink-600 transition"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {showComposer ? (
          <>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value.replace(/\n/g, ' ').slice(0, MAX_NOTE_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  publish()
                }
              }}
              rows={3}
              placeholder="Comparte lo que estás pensando…"
              className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-garnet-600"
            />
            <div className="flex items-center justify-between mt-1.5 mb-3">
              <span className="text-[11px] text-neutral-600">{text.length}/{MAX_NOTE_LENGTH}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600" title="Llega en una próxima actualización">
                <MusicIcon className="w-3 h-3" /> Música: próximamente
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed mb-4">
              La ven tus amigos (las personas que se siguen mutuamente contigo) y dura 24 horas. Si publicas otra,
              reemplaza a la anterior.
            </p>
            {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => (note ? setComposing(false) : onClose())}
                disabled={saving}
                className="flex-1 border border-ink-500 text-neutral-300 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={saving || !text.trim()}
                className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? 'Compartiendo...' : 'Compartir'}
              </button>
            </div>
          </>
        ) : note ? (
          <>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="relative z-10 -mb-3 max-w-full rounded-2xl bg-ink-600 px-4 py-2.5 text-sm text-neutral-50 break-words shadow-[0_6px_16px_-8px_rgba(0,0,0,0.8)]">
                {note.content}
              </div>
              <UserAvatar
                username={note.profiles?.username ?? 'usuario'}
                avatarUrl={note.profiles?.avatar_url ?? null}
                size="w-20 h-20"
                textSize="text-2xl"
              />
              <p className="mt-2 text-[11px] text-neutral-600">Vence en {timeLeft(note.expires_at)}</p>
              {!!note.music && (
                <div className="mt-2 max-w-full">
                  <MusicChip track={note.music} />
                </div>
              )}
            </div>

            {!isMine && (
              <button
                type="button"
                onClick={() => onToggleLike(note)}
                className={`w-full flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition mb-4 ${
                  likedByMe
                    ? 'bg-garnet-600 text-white hover:bg-garnet-500'
                    : 'border border-ink-500 text-neutral-200 hover:bg-ink-700'
                }`}
              >
                <HeartIcon filled={likedByMe} className="w-4 h-4" />
                {likedByMe ? 'Te gusta' : 'Dar like'}
              </button>
            )}

            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                Likes {likers.length > 0 ? `(${likers.length})` : ''}
              </h3>
              {likers.length === 0 ? (
                <p className="text-xs text-neutral-600">
                  {isMine ? 'Todavía nadie le dio like a tu nota.' : 'Sé el primero en darle like. También puedes dar doble clic a la nota.'}
                </p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {likers.map((l) => (
                    <li key={l.user_id} className="flex items-center gap-2.5">
                      <UserAvatar
                        username={l.profiles?.username ?? 'usuario'}
                        avatarUrl={l.profiles?.avatar_url ?? null}
                        size="w-8 h-8"
                        textSize="text-xs"
                      />
                      <div className="min-w-0 leading-tight">
                        <p className="text-sm font-semibold text-neutral-100 truncate">
                          {l.profiles?.id_student || l.profiles?.username || 'Alguien'}
                          {l.user_id === me && <span className="text-neutral-500 font-normal"> (tú)</span>}
                        </p>
                        <p className="text-[11px] text-neutral-600 truncate">@{l.profiles?.username}</p>
                      </div>
                      <HeartIcon filled className="w-3.5 h-3.5 ml-auto text-garnet-500 shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}

            {isMine && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="flex-1 border border-ink-500 text-garnet-400 rounded-full py-2 text-sm hover:bg-ink-800 transition disabled:opacity-60"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setComposing(true)}
                  disabled={saving}
                  className="flex-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full py-2 text-sm font-medium transition disabled:opacity-60"
                >
                  Nueva nota
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
