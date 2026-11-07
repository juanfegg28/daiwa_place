'use client'

import { useMemo, useState } from 'react'
import { renderRichText } from '../lib/hashtags'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import ConfirmDialog from '../components/ConfirmDialog'
import RoleBadges from '../components/RoleBadge'
import UserAvatar from '../components/UserAvatar'
import { inboxTime } from '../lib/dm'
import { anonCommentName, friendlyWhisperError, isMineComment, type WhisperComment } from '../lib/whispers'
import AnonAvatar from './AnonAvatar'
import CommentComposer from './CommentComposer'

// v1.8.0 · Antes cada respuesta se metía un nivel más a la derecha (avatar + línea + margen) y en el celular, a partir del 4.º nivel,
// el texto se quedaba con 1 letra de ancho («O Y E Q U E…»). Ahora solo se anidan 2 niveles; las respuestas más profundas se muestran
// en una sola columna debajo («en respuesta a …»), así el texto SIEMPRE tiene espacio.
const MAX_VISUAL_DEPTH = 2

type Props = {
  whisperId: string
  isWhisperMine: boolean
  comments: WhisperComment[]
  reportedComments: Set<string>
  highlightId: string | null
  onChanged: () => void
  onReport: (commentId: string) => void
  onNotice: (text: string) => void
}

/** Todas las respuestas (hijos, nietos…) de un comentario, de la más vieja a la más nueva */
function collectDescendants(id: string, childrenMap: Map<string, WhisperComment[]>): WhisperComment[] {
  const out: WhisperComment[] = []
  const walk = (cid: string) => {
    for (const c of childrenMap.get(cid) ?? []) {
      out.push(c)
      walk(c.id)
    }
  }
  walk(id)
  return out.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

function shortName(c: WhisperComment | undefined): string {
  if (!c) return ''
  if (c.is_anonymous) return anonCommentName(c)
  if (!c.author_id) return 'Cuenta eliminada'
  return c.profiles?.id_student || c.profiles?.username || 'usuario'
}

export default function CommentsThread({ comments, ...rest }: Props) {
  // Árbol de respuestas. Si el comentario "padre" no se ve (oculto por reportes), la respuesta sube al primer nivel.
  const { roots, children } = useMemo(() => {
    const ids = new Set(comments.map((c) => c.id))
    const byParent = new Map<string, WhisperComment[]>()
    const rootList: WhisperComment[] = []
    const sorted = [...comments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    for (const c of sorted) {
      if (c.parent_comment_id && ids.has(c.parent_comment_id)) {
        const list = byParent.get(c.parent_comment_id) ?? []
        list.push(c)
        byParent.set(c.parent_comment_id, list)
      } else {
        rootList.push(c)
      }
    }
    return { roots: rootList, children: byParent }
  }, [comments])
  const byId = useMemo(() => new Map(comments.map((c) => [c.id, c])), [comments])

  if (roots.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">Todavía no hay comentarios. Sé el primero en susurrar algo.</p>
  }

  return (
    <div className="space-y-4">
      {roots.map((c) => (
        <CommentNode key={c.id} comment={c} depth={0} childrenMap={children} byId={byId} {...rest} />
      ))}
    </div>
  )
}

function CommentNode({
  comment,
  depth,
  childrenMap,
  byId,
  flat = false,
  whisperId,
  isWhisperMine,
  reportedComments,
  highlightId,
  onChanged,
  onReport,
  onNotice,
}: {
  comment: WhisperComment
  depth: number
  childrenMap: Map<string, WhisperComment[]>
  byId: Map<string, WhisperComment>
  /** true = es una respuesta «aplanada»: sus propias respuestas las dibuja el comentario de arriba */
  flat?: boolean
} & Omit<Props, 'comments'>) {
  const [replying, setReplying] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const nested = depth < MAX_VISUAL_DEPTH
  // más profundo del límite: todas las respuestas van juntas, en una sola columna
  const replies = flat ? [] : nested ? childrenMap.get(comment.id) ?? [] : collectDescendants(comment.id, childrenMap)
  const replyTo = flat && comment.parent_comment_id ? shortName(byId.get(comment.parent_comment_id)) : ''
  const small = depth > 0
  const mine = isMineComment(comment)
  const deleted = !!comment.deleted_at
  const removedByMod = comment.status === 'removed'
  const hidden = comment.status === 'hidden'
  const accountGone = !comment.is_anonymous && !comment.author_id
  const reported = reportedComments.has(comment.id)

  const doDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.rpc('whisper_comment_delete', { p_comment: comment.id })
    setDeleting(false)
    setConfirmDelete(false)
    if (error) {
      onNotice(friendlyWhisperError(error.message))
      return
    }
    onChanged()
  }

  const author = comment.profiles

  return (
    <div id={`comment-${comment.id}`} className="min-w-0">
      <div className={`flex items-start ${small ? 'gap-2' : 'gap-2.5'}`}>
        {comment.is_anonymous || accountGone ? (
          <AnonAvatar size={small ? 'w-6 h-6' : 'w-8 h-8'} />
        ) : (
          <UserAvatar username={author?.username ?? 'usuario'} avatarUrl={author?.avatar_url ?? null} size={small ? 'w-6 h-6' : 'w-8 h-8'} textSize="text-xs" />
        )}

        <div className="min-w-0 flex-1">
          <div
            className={`rounded-2xl rounded-tl-sm ${small ? 'px-3 py-2' : 'px-3.5 py-2.5'} transition ${
              highlightId === comment.id ? 'bg-garnet-600/15 ring-2 ring-garnet-500/70' : 'bg-ink-800'
            }`}
          >
            {replyTo && <p className="text-[11px] text-neutral-500 mb-0.5 truncate">↪ en respuesta a {replyTo}</p>}
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              {comment.is_anonymous ? (
                <span className="text-[13px] font-semibold text-neutral-200">{anonCommentName(comment)}</span>
              ) : accountGone ? (
                <span className="text-[13px] font-semibold text-neutral-500">Cuenta eliminada</span>
              ) : (
                <>
                  <Link href={`/perfil/${author?.username}`} className="text-[13px] font-semibold text-neutral-100 hover:text-garnet-400 truncate">
                    {author?.id_student || author?.username}
                  </Link>
                  <RoleBadges username={author?.username} size="xs" founderStyle="icon" />
                  <span className="text-[11px] text-neutral-600">@{author?.username}</span>
                </>
              )}
              {comment.is_op && (
                <span className="text-[10px] uppercase tracking-wide rounded-full bg-garnet-600/20 text-garnet-300 px-1.5 py-0.5">Autor</span>
              )}
              {mine && <span className="text-[11px] text-garnet-400">(tú)</span>}
              <span className="text-[11px] text-neutral-600">· {inboxTime(comment.created_at)}</span>
            </div>

            {deleted ? (
              <p className="text-sm italic text-neutral-600">
                {removedByMod ? 'Comentario eliminado por moderación' : 'Comentario eliminado'}
              </p>
            ) : (
              <>
                {hidden && (
                  <p className="text-[11px] text-amber-300 mb-1">
                    Oculto por reportes: solo lo ves tú y moderación mientras se revisa.
                  </p>
                )}
                <p className="text-sm text-neutral-100 leading-relaxed whitespace-pre-wrap break-words">{renderRichText(comment.content, { hashtags: false })}</p>
              </>
            )}
          </div>

          {!deleted && (
            <div className="flex items-center gap-3 mt-1 ml-1">
              {!hidden && (
                <button type="button" onClick={() => setReplying((v) => !v)} className="text-xs text-neutral-500 hover:text-neutral-200 transition">
                  Responder
                </button>
              )}
              {mine ? (
                <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs text-neutral-500 hover:text-garnet-400 transition">
                  Eliminar
                </button>
              ) : reported ? (
                <span className="text-[11px] text-neutral-600">Reportado</span>
              ) : (
                <button type="button" onClick={() => onReport(comment.id)} className="text-xs text-neutral-500 hover:text-garnet-400 transition">
                  Reportar
                </button>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-2">
              <CommentComposer
                whisperId={whisperId}
                parentId={comment.id}
                isWhisperMine={isWhisperMine}
                autoFocus
                placeholder="Escribe tu respuesta…"
                onCancel={() => setReplying(false)}
                onPosted={() => {
                  setReplying(false)
                  onChanged()
                }}
              />
            </div>
          )}

          {replies.length > 0 && (
            <div className={`mt-3 space-y-3 ${nested ? 'pl-2.5 sm:pl-3 border-l border-ink-700' : 'pl-2.5 border-l border-ink-700/60'}`}>
              {replies.map((r) => (
                <CommentNode
                  key={r.id}
                  comment={r}
                  depth={nested ? depth + 1 : depth}
                  flat={!nested}
                  childrenMap={childrenMap}
                  byId={byId}
                  whisperId={whisperId}
                  isWhisperMine={isWhisperMine}
                  reportedComments={reportedComments}
                  highlightId={highlightId}
                  onChanged={onChanged}
                  onReport={onReport}
                  onNotice={onNotice}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar tu comentario?"
        message="Se borra el texto. Si tiene respuestas, quedará el aviso de que se eliminó."
        confirmLabel="Eliminar"
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
