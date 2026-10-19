'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { HeartIcon, SendIcon } from '../../icons'
import { MAX_REPLY_CHARS } from '../../../lib/stories'

export type ReplyBarHandle = { focus: () => void; blur: () => void; clear: () => void; hasText: () => boolean }

export const QUICK_REACTIONS = ['😂', '😮', '😍', '😢', '👏', '🔥']

/**
 * Barra de abajo (solo historias de otras personas): campo para responder + corazón.
 * Al enfocar aparecen 6 reacciones rápidas que se envían al instante.
 */
const ReplyBar = forwardRef<
  ReplyBarHandle,
  {
    ownerName: string
    blockedMessage: string | null
    liked: boolean
    canLike: boolean
    status: string
    onLike: () => void
    onSend: (text: string) => Promise<boolean>
    onReact: (emoji: string) => void
    onFocusChange: (focused: boolean) => void
  }
>(function ReplyBar({ ownerName, blockedMessage, liked, canLike, status, onLike, onSend, onReact, onFocusChange }, ref) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => setText(''),
    hasText: () => text.length > 0,
  }))

  const submit = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    const ok = await onSend(t)
    setSending(false)
    if (ok) {
      setText('')
      inputRef.current?.blur()
    }
  }

  const heart = (
    <button
      type="button"
      onClick={onLike}
      disabled={!canLike}
      aria-label={liked ? 'Quitar el like' : 'Dar like'}
      aria-pressed={liked}
      className="shrink-0 w-11 h-11 flex items-center justify-center text-white disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-full"
    >
      <span key={liked ? 'on' : 'off'} className={liked ? 'story-heart-pop text-garnet-500' : ''}>
        <HeartIcon filled={liked} className="w-7 h-7" />
      </span>
    </button>
  )

  if (blockedMessage) {
    return (
      <div className="flex items-center gap-2 px-3 pb-3 pt-2" onPointerDown={(e) => e.stopPropagation()}>
        <p className="flex-1 text-center text-[12.5px] text-white/80 rounded-full border border-white/25 px-4 py-3 bg-black/25 backdrop-blur">{blockedMessage}</p>
        {heart}
      </div>
    )
  }

  return (
    <div className="px-3 pb-3 pt-2" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {status && (
        <p role="status" className="mb-2 mx-auto w-max max-w-full rounded-full bg-black/60 backdrop-blur text-white text-[12px] px-3 py-1.5">
          {status}
        </p>
      )}
      {focused && (
        <div className="flex justify-between mb-2 px-1">
          {QUICK_REACTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => onReact(e)}
              aria-label={`Reaccionar con ${e}`}
              className="text-[30px] leading-none w-11 h-11 flex items-center justify-center hover:scale-125 transition-transform"
            >
              {e}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        <div className="flex-1 flex items-center rounded-full border border-white/35 bg-black/25 backdrop-blur h-11 pl-4 pr-1">
          <input
            ref={inputRef}
            value={text}
            maxLength={MAX_REPLY_CHARS}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => {
              setFocused(true)
              onFocusChange(true)
            }}
            onBlur={() => {
              setFocused(false)
              onFocusChange(false)
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                void submit()
              }
              if (e.key === 'Escape') {
                if (text) setText('')
                else inputRef.current?.blur()
              }
            }}
            enterKeyHint="send"
            placeholder={`Enviar mensaje a @${ownerName}…`}
            aria-label={`Responder a la historia de ${ownerName}`}
            className="flex-1 min-w-0 bg-transparent text-[14px] text-white placeholder:text-white/65 outline-none"
          />
          {text.trim() && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void submit()}
              disabled={sending}
              aria-label="Enviar respuesta"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-garnet-600 disabled:opacity-60"
            >
              <SendIcon className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
        {!text.trim() && heart}
      </div>
    </div>
  )
})

export default ReplyBar
