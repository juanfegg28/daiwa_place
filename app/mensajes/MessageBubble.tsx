'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CloseIcon, CopyIcon, EditIcon, MoreIcon, ReplyIcon, SmileIcon, TrashIcon } from '../components/icons'
import { MAX_MESSAGE_LENGTH, REACTIONS, formatClock, previewText, type DmMessage } from '../lib/dm'

type MenuProps = {
  anchor: DOMRect
  mine: boolean
  canEdit: boolean
  myReaction: string | null
  onClose: () => void
  onReact: (emoji: string) => void
  onReply: () => void
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
}

/** Menú flotante de un mensaje: reacciones arriba y acciones abajo. Se posiciona con la pantalla, no con el scroll del chat. */
function MessageMenu({ anchor, mine, canEdit, myReaction, onClose, onReact, onReply, onCopy, onEdit, onDelete }: MenuProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  const width = 236
  const itemCount = 2 + (mine && canEdit ? 2 : 0)
  const height = 58 + itemCount * 38
  const left = Math.max(8, Math.min(mine ? anchor.right - width : anchor.left, window.innerWidth - width - 8))
  const above = anchor.top - height - 6
  const top = above >= 8 ? above : Math.min(anchor.bottom + 6, window.innerHeight - height - 8)

  return (
    <div
      ref={ref}
      role="menu"
      style={{ position: 'fixed', left, top, width }}
      className="z-[60] rounded-2xl border border-ink-600 bg-ink-800 py-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]"
    >
      <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-ink-700">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onReact(emoji)
              onClose()
            }}
            aria-label={`Reaccionar con ${emoji}`}
            className={`w-8 h-8 rounded-full text-lg leading-none flex items-center justify-center transition hover:bg-ink-600 hover:scale-110 ${
              myReaction === emoji ? 'bg-ink-600 ring-1 ring-garnet-500' : ''
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <MenuItem icon={<ReplyIcon className="w-4 h-4" />} label="Responder" onClick={() => { onClose(); onReply() }} />
      <MenuItem icon={<CopyIcon className="w-4 h-4" />} label="Copiar" onClick={() => { onClose(); onCopy() }} />
      {mine && canEdit && (
        <>
          <MenuItem icon={<EditIcon className="w-4 h-4" />} label="Editar" onClick={() => { onClose(); onEdit() }} />
          <MenuItem icon={<TrashIcon className="w-4 h-4" />} label="Eliminar" danger onClick={() => { onClose(); onDelete() }} />
        </>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 h-[38px] text-sm text-left transition hover:bg-ink-700 ${
        danger ? 'text-garnet-400' : 'text-neutral-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export default function MessageBubble({
  message,
  me,
  otherName,
  grouped,
  showSeen,
  editing,
  flash,
  onReact,
  onReply,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onJumpTo,
  onRetry,
  onDiscard,
}: {
  message: DmMessage
  me: string
  otherName: string
  grouped: boolean
  showSeen: boolean | null
  editing: boolean
  flash: boolean
  onReact: (m: DmMessage, emoji: string) => void
  onReply: (m: DmMessage) => void
  onStartEdit: (m: DmMessage) => void
  onCancelEdit: () => void
  onSaveEdit: (m: DmMessage, text: string) => void
  onDelete: (m: DmMessage) => void
  onJumpTo: (id: string) => void
  onRetry: (m: DmMessage) => void
  onDiscard: (m: DmMessage) => void
}) {
  const mine = message.sender_id === me
  const deleted = !!message.deleted_at
  const failed = message.pending === 'failed'
  const sending = message.pending === 'sending'
  const interactive = !deleted && !message.pending

  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)
  const [draft, setDraft] = useState(message.content)
  const lastTap = useRef(0)
  const kebabRef = useRef<HTMLButtonElement | null>(null)

  const myReaction = message.message_reactions.find((r) => r.user_id === me)?.emoji ?? null

  // Reacciones agrupadas por emoji
  const grouped_reactions = new Map<string, number>()
  for (const r of message.message_reactions) grouped_reactions.set(r.emoji, (grouped_reactions.get(r.emoji) ?? 0) + 1)

  // Doble clic / doble toque = ❤️ (si ya tenías ❤️, se quita)
  const handleBubbleClick = () => {
    if (!interactive || editing) return
    const now = Date.now()
    if (now - lastTap.current < 320) {
      lastTap.current = 0
      onReact(message, '❤️')
    } else {
      lastTap.current = now
    }
  }

  const openMenu = () => {
    if (kebabRef.current) setMenuAnchor(kebabRef.current.getBoundingClientRect())
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
    } catch {
      /* el navegador no dejó copiar; no pasa nada */
    }
  }

  const submitEdit = () => {
    const clean = draft.trim()
    if (!clean) return
    onSaveEdit(message, clean)
  }

  const replyAuthor = message.reply ? (message.reply.sender_id === me ? 'Tú' : otherName) : ''

  return (
    <div
      id={`msg-${message.id}`}
      className={`group flex ${mine ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-3'} ${
        message.message_reactions.length > 0 ? 'mb-3' : ''
      }`}
    >
      <div className={`flex items-center gap-1 max-w-[86%] md:max-w-[72%] ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="min-w-0 flex flex-col">
          {message.reply_to_id && !deleted && (
            <button
              type="button"
              onClick={() => message.reply && onJumpTo(message.reply.id)}
              className={`mb-0.5 max-w-full text-left rounded-2xl px-3 py-1.5 bg-ink-800 border border-ink-700 hover:bg-ink-700 transition ${
                mine ? 'self-end' : 'self-start'
              }`}
            >
              <span className="block text-[11px] font-semibold text-garnet-400">
                Respondió a {replyAuthor || 'un mensaje'}
              </span>
              <span className="block text-xs text-neutral-400 truncate">
                {message.reply
                  ? message.reply.deleted_at
                    ? 'Mensaje eliminado'
                    : previewText(message.reply.content, 70)
                  : 'Mensaje no disponible'}
              </span>
            </button>
          )}

          <div className="relative">
            {editing ? (
              <div className="w-[min(78vw,420px)] rounded-2xl bg-ink-700 border border-garnet-600 p-2">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onCancelEdit()
                    if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia('(pointer: coarse)').matches) {
                      e.preventDefault()
                      submitEdit()
                    }
                  }}
                  rows={Math.min(6, Math.max(2, draft.split('\n').length))}
                  className="w-full bg-transparent text-[14.5px] text-neutral-50 resize-none focus:outline-none"
                />
                <div className="flex justify-end gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    aria-label="Cancelar edición"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-ink-600 transition"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={submitEdit}
                    disabled={!draft.trim()}
                    aria-label="Guardar edición"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-garnet-600 text-white hover:bg-garnet-500 transition disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={handleBubbleClick}
                className={`rounded-2xl px-3.5 py-2 text-[14.5px] leading-snug break-words whitespace-pre-wrap select-text transition ${
                  deleted
                    ? 'border border-ink-700 text-neutral-600 italic bg-transparent'
                    : mine
                      ? 'bg-garnet-600 text-white rounded-br-md'
                      : 'bg-ink-700 text-neutral-100 rounded-bl-md'
                } ${flash ? 'ring-2 ring-garnet-400' : ''} ${sending ? 'opacity-60' : ''} ${failed ? 'opacity-70 ring-1 ring-garnet-500' : ''}`}
              >
                {deleted ? (mine ? 'Eliminaste este mensaje' : 'Mensaje eliminado') : message.content}
                {!deleted && (
                  <span className={`ml-2 align-bottom text-[10px] ${mine ? 'text-white/70' : 'text-neutral-500'}`}>
                    {message.edited_at ? 'editado · ' : ''}
                    {formatClock(message.created_at)}
                  </span>
                )}
              </div>
            )}

            {grouped_reactions.size > 0 && (
              <button
                type="button"
                onClick={() => interactive && myReaction && onReact(message, myReaction)}
                title={myReaction ? 'Toca para quitar tu reacción' : undefined}
                className={`absolute -bottom-3 ${mine ? 'right-2' : 'left-2'} flex items-center gap-0.5 rounded-full bg-ink-800 border border-ink-600 px-1.5 py-[1px] text-xs leading-none shadow`}
              >
                {[...grouped_reactions.entries()].map(([emoji, count]) => (
                  <span key={emoji} className="flex items-center">
                    {emoji}
                    {count > 1 && <span className="ml-0.5 text-[10px] text-neutral-400">{count}</span>}
                  </span>
                ))}
              </button>
            )}
          </div>

          {failed && (
            <div className={`mt-1 flex items-center gap-2 text-[11px] text-garnet-400 ${mine ? 'self-end' : 'self-start'}`}>
              No se pudo enviar
              <button type="button" onClick={() => onRetry(message)} className="underline hover:text-garnet-300">
                Reintentar
              </button>
              <button type="button" onClick={() => onDiscard(message)} className="underline hover:text-garnet-300">
                Descartar
              </button>
            </div>
          )}
          {showSeen !== null && mine && !failed && (
            <span className="mt-0.5 self-end text-[10.5px] text-neutral-600">{showSeen ? 'Visto' : 'Enviado'}</span>
          )}
        </div>

        {interactive && !editing && (
          <div className="shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => onReact(message, '❤️')}
              aria-label="Me gusta"
              className="hidden md:flex w-7 h-7 rounded-full items-center justify-center text-neutral-600 hover:text-garnet-400 hover:bg-ink-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
            >
              <SmileIcon className="w-4 h-4" />
            </button>
            <button
              ref={kebabRef}
              type="button"
              onClick={openMenu}
              aria-label="Opciones del mensaje"
              aria-haspopup="menu"
              className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-200 hover:bg-ink-800 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition"
            >
              <MoreIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {menuAnchor && (
        <MessageMenu
          anchor={menuAnchor}
          mine={mine}
          canEdit={mine}
          myReaction={myReaction}
          onClose={() => setMenuAnchor(null)}
          onReact={(emoji) => onReact(message, emoji)}
          onReply={() => onReply(message)}
          onCopy={copy}
          onEdit={() => {
            setDraft(message.content)
            onStartEdit(message)
          }}
          onDelete={() => onDelete(message)}
        />
      )}
    </div>
  )
}
