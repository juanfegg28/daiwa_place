'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MAX_COMMENT_LENGTH, friendlyWhisperError } from '../lib/whispers'

/** Caja para comentar (o responder). Cada quien elige: anónimo o con su perfil. */
export default function CommentComposer({
  whisperId,
  parentId = null,
  isWhisperMine,
  autoFocus = false,
  placeholder = 'Escribe un comentario…',
  onPosted,
  onCancel,
}: {
  whisperId: string
  parentId?: string | null
  isWhisperMine: boolean
  autoFocus?: boolean
  placeholder?: string
  onPosted: () => void
  onCancel?: () => void
}) {
  const [text, setText] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const clean = text.trim()

  const submit = async () => {
    if (!clean || sending) return
    setSending(true)
    setError('')
    const { error: err } = await supabase.rpc('whisper_comment_create', {
      p_whisper: whisperId,
      p_content: clean,
      p_parent: parentId,
      p_anonymous: anonymous,
    })
    setSending(false)
    if (err) {
      setError(friendlyWhisperError(err.message))
      return
    }
    setText('')
    onPosted()
  }

  return (
    <div className="rounded-2xl bg-ink-900 border border-ink-700 p-3">
      <textarea
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
        rows={parentId ? 2 : 3}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <div className="inline-flex rounded-full bg-ink-800 p-0.5" role="radiogroup" aria-label="Comentar como">
          <button
            type="button"
            role="radio"
            aria-checked={anonymous}
            onClick={() => setAnonymous(true)}
            className={`text-xs rounded-full px-3 py-1.5 transition ${anonymous ? 'bg-garnet-600 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            Anónimo
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!anonymous}
            onClick={() => setAnonymous(false)}
            className={`text-xs rounded-full px-3 py-1.5 transition ${!anonymous ? 'bg-garnet-600 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            Con mi perfil
          </button>
        </div>
        <span className="text-[11px] text-neutral-600">{text.length}/{MAX_COMMENT_LENGTH}</span>
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={sending} className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1.5 transition">
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!clean || sending}
            className="bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-4 py-1.5 text-xs font-medium transition disabled:opacity-50"
          >
            {sending ? 'Enviando...' : parentId ? 'Responder' : 'Comentar'}
          </button>
        </div>
      </div>

      {!anonymous && isWhisperMine && (
        <p className="mt-2 text-[11px] text-amber-300">
          Ojo: si comentas con tu perfil en tu propia confesión, los demás podrían sospechar que es tuya.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-garnet-400">{error}</p>}
    </div>
  )
}
