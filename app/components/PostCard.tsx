'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { POST_IMAGES_BUCKET } from '../lib/queries'
import { renderContentWithHashtags } from '../lib/hashtags'
import type { Post, Comment } from '../lib/types'
import {
  HeartIcon,
  CommentIcon,
  SendIcon,
  ReplyIcon,
  EditIcon,
  TrashIcon,
  LinkIcon,
  SnowflakeIcon,
} from './icons'
import KebabMenu, { type MenuItem } from './KebabMenu'
import ConfirmDialog from './ConfirmDialog'
import PostImages from './PostImages'
import ImageLightbox from './ImageLightbox'

type PostCardProps = {
  post: Post
  currentUserId: string | null
  /** Muestra avatar y nombre del autor (feed). En el perfil se oculta. */
  showAuthor?: boolean
  /** Vista individual de la publicación: todos los comentarios visibles y sin salto al perfil */
  detail?: boolean
  /** Abre la sección de comentarios desde el inicio */
  defaultExpanded?: boolean
  /**
   * En el perfil (showAuthor=false) el autor no viaja embebido en la publicación,
   * así que la página de perfil le pasa aquí si ESA cuenta está congelada.
   */
  authorIsFrozen?: boolean
  onToggleLike: (post: Post) => void
  onToggleCommentLike: (commentId: string, alreadyLiked: boolean) => void
  onAddComment: (postId: string, text: string, parentCommentId?: string | null) => Promise<void> | void
  /** Se llama después de editar o borrar para volver a cargar los datos */
  onRefresh: () => void | Promise<void>
  /** Se llama cuando el dueño borra la publicación (por defecto usa onRefresh) */
  onPostDeleted?: () => void
}

const ROOT_PREVIEW = 3 // comentarios principales visibles antes de "Ver más"
const COLLAPSE_THRESHOLD = 2 // hilos con más respuestas que esto empiezan ocultos
const MAX_INDENT_LEVEL = 4 // después de este nivel las respuestas ya no se corren más a la derecha

const EDIT_ERROR_HINT =
  'No se pudo completar la acción. Revisa que hayas corrido el SQL de permisos (RLS) en Supabase.'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
}

function MiniAvatar({
  username,
  avatarUrl,
  size = 'w-8 h-8',
}: {
  username: string
  avatarUrl: string | null
  size?: string
}) {
  return (
    <div className={`${size} rounded-full overflow-hidden bg-ink-700 flex items-center justify-center shrink-0`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-garnet-400">{username.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}

function countDescendants(id: string, map: Map<string, Comment[]>): number {
  const kids = map.get(id) ?? []
  return kids.reduce((total, kid) => total + 1 + countDescendants(kid.id, map), 0)
}

/* ---------- Contexto compartido por todos los comentarios de una publicación ---------- */

type ThreadContextValue = {
  childrenByParent: Map<string, Comment[]>
  currentUserId: string | null
  interactionsDisabled: boolean
  onToggleCommentLike: (commentId: string, alreadyLiked: boolean) => void
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  replyText: string
  setReplyText: (v: string) => void
  sendingReply: boolean
  submitReply: (parentId: string) => void
  /** Devuelven un mensaje de error, o null si todo salió bien */
  editComment: (id: string, text: string) => Promise<string | null>
  deleteComment: (id: string) => Promise<string | null>
}

const ThreadContext = createContext<ThreadContextValue | null>(null)

function useThread() {
  const ctx = useContext(ThreadContext)
  if (!ctx) throw new Error('CommentThread debe usarse dentro de PostCard')
  return ctx
}

/* ---------- Un comentario (y, de forma recursiva, sus respuestas) ---------- */

function CommentThread({ comment, depth }: { comment: Comment; depth: number }) {
  const t = useThread()
  const commentAuthor = comment.profiles
  const children = t.childrenByParent.get(comment.id) ?? []
  const descendants = countDescendants(comment.id, t.childrenByParent)
  const isReplyingHere = t.replyingTo === comment.id
  const isMine = !!t.currentUserId && comment.user_id === t.currentUserId
  const likedByMe = t.currentUserId ? comment.comment_likes.some((l) => l.user_id === t.currentUserId) : false

  const [collapsed, setCollapsed] = useState(descendants > COLLAPSE_THRESHOLD)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const saveEdit = async () => {
    const text = editText.trim()
    if (!text) {
      setError('El comentario no puede quedar vacío')
      return
    }
    if (text === comment.content) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError('')
    const err = await t.editComment(comment.id, text)
    setSaving(false)
    if (err) setError(err)
    else setEditing(false)
  }

  const doDelete = async () => {
    setDeleting(true)
    const err = await t.deleteComment(comment.id)
    setDeleting(false)
    if (err) {
      setError(err)
      setConfirmDelete(false)
    }
  }

  const menuItems: MenuItem[] = isMine
    ? [
        {
          label: 'Editar',
          icon: <EditIcon className="w-4 h-4" />,
          onClick: () => {
            setEditText(comment.content)
            setError('')
            setEditing(true)
          },
        },
        {
          label: 'Eliminar',
          icon: <TrashIcon className="w-4 h-4" />,
          danger: true,
          onClick: () => setConfirmDelete(true),
        },
      ]
    : []

  return (
    <div>
      <div className="flex items-start gap-2">
        <MiniAvatar
          username={commentAuthor?.username ?? 'usuario'}
          avatarUrl={commentAuthor?.avatar_url ?? null}
          size={depth > 0 ? 'w-6 h-6' : 'w-7 h-7'}
        />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div>
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2 text-sm resize-y focus:outline-none focus:border-garnet-600"
              />
              <div className="flex justify-end gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setError('')
                  }}
                  className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1 hover:bg-ink-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="text-xs bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white rounded-full px-3 py-1 transition"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1">
              <div className="min-w-0 rounded-2xl rounded-tl-sm bg-ink-700 px-3 py-2">
                {commentAuthor ? (
                  <Link
                    href={`/perfil/${commentAuthor.username}`}
                    className="text-xs font-semibold text-garnet-400 hover:underline"
                  >
                    @{commentAuthor.username}
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-garnet-400">@usuario</span>
                )}
                <p className="text-sm text-neutral-100 break-words whitespace-pre-wrap">{comment.content}</p>
              </div>
              <KebabMenu items={menuItems} label="Opciones del comentario" small />
            </div>
          )}

          {error && <p className="text-xs text-garnet-400 mt-1 ml-1">{error}</p>}

          {!editing && (
            <div className="flex items-center gap-3 mt-1 ml-1">
              <button
                onClick={() => t.onToggleCommentLike(comment.id, likedByMe)}
                disabled={t.interactionsDisabled}
                className={`flex items-center gap-1 text-[11px] transition disabled:opacity-40 ${
                  likedByMe ? 'text-garnet-500' : 'text-neutral-600 hover:text-garnet-400'
                }`}
              >
                <HeartIcon filled={likedByMe} className="w-3 h-3" />
                {comment.comment_likes.length}
              </button>
              {t.currentUserId && !t.interactionsDisabled && (
                <button
                  onClick={() => {
                    t.setReplyingTo(isReplyingHere ? null : comment.id)
                    t.setReplyText('')
                    setCollapsed(false)
                  }}
                  className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-garnet-400 transition"
                >
                  <ReplyIcon className="w-3 h-3" />
                  {isReplyingHere ? 'Cancelar' : 'Responder'}
                </button>
              )}
              <span className="text-[10px] text-neutral-600" title={fullDate(comment.created_at)}>
                {timeAgo(comment.created_at)}
                {comment.edited_at ? ' · editado' : ''}
              </span>
            </div>
          )}

          {isReplyingHere && (
            <div className="flex items-center gap-2 mt-2">
              <input
                autoFocus
                type="text"
                value={t.replyText}
                onChange={(e) => t.setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') t.submitReply(comment.id)
                }}
                placeholder={`Responder a @${commentAuthor?.username ?? 'usuario'}...`}
                className="flex-1 min-w-0 bg-ink-900 border border-ink-700 rounded-full px-3.5 py-1.5 text-xs focus:outline-none focus:border-garnet-600"
              />
              <button
                onClick={() => t.submitReply(comment.id)}
                disabled={t.sendingReply}
                className="w-7 h-7 shrink-0 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center transition disabled:opacity-60"
                aria-label="Enviar respuesta"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {children.length > 0 && !editing && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="mt-1.5 ml-1 text-[11px] font-medium text-garnet-400 hover:underline"
            >
              {collapsed
                ? `Ver ${descendants} ${descendants === 1 ? 'respuesta' : 'respuestas'}`
                : 'Ocultar respuestas'}
            </button>
          )}
        </div>
      </div>

      {children.length > 0 && !collapsed && (
        <div
          className={`mt-2 space-y-2 ${
            depth < MAX_INDENT_LEVEL ? 'ml-3 pl-3 border-l border-ink-600' : ''
          }`}
        >
          {children.map((child) => (
            <CommentThread key={child.id} comment={child} depth={depth + 1} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar comentario?"
        message={
          descendants > 0
            ? 'Se borrará este comentario y también todas sus respuestas. No se puede deshacer.'
            : 'Se borrará este comentario. No se puede deshacer.'
        }
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

/* ---------- La publicación ---------- */

export default function PostCard({
  post,
  currentUserId,
  showAuthor = true,
  detail = false,
  defaultExpanded = false,
  authorIsFrozen,
  onToggleLike,
  onToggleCommentLike,
  onAddComment,
  onRefresh,
  onPostDeleted,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [showAllRoots, setShowAllRoots] = useState(false)

  const [editingPost, setEditingPost] = useState(false)
  const [editText, setEditText] = useState(post.content)
  const [savingPost, setSavingPost] = useState(false)
  const [confirmDeletePost, setConfirmDeletePost] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)
  const [actionError, setActionError] = useState('')
  const [copied, setCopied] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const closeLightbox = useCallback(() => setLightbox(null), [])

  const router = useRouter()

  const likedByMe = currentUserId ? post.likes.some((l) => l.user_id === currentUserId) : false
  const author = post.profiles
  const isMine = !!currentUserId && post.user_id === currentUserId
  const images = post.images ?? []
  const isFrozen = (authorIsFrozen ?? author?.is_frozen ?? false) && !isMine
  const interactionsDisabled = isFrozen

  // Árbol de comentarios: principales vs. respuestas agrupadas por su padre
  const childrenByParent = new Map<string, Comment[]>()
  const rootComments: Comment[] = []
  const sortedByTime = [...post.comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  for (const c of sortedByTime) {
    if (c.parent_comment_id) {
      const list = childrenByParent.get(c.parent_comment_id) ?? []
      list.push(c)
      childrenByParent.set(c.parent_comment_id, list)
    } else {
      rootComments.push(c)
    }
  }

  const showAllComments = detail || showAllRoots
  const visibleRoots = showAllComments ? rootComments : rootComments.slice(0, ROOT_PREVIEW)
  const hiddenRoots = rootComments.length - visibleRoots.length

  const canGoToProfile = showAuthor && !!author && !detail

  const goToProfile = () => {
    if (author) router.push(`/perfil/${author.username}`)
  }

  const submitComment = async () => {
    if (!commentText.trim() || sending) return
    setSending(true)
    await onAddComment(post.id, commentText.trim())
    setCommentText('')
    setShowAllRoots(true)
    setSending(false)
  }

  const submitReply = async (parentId: string) => {
    if (!replyText.trim() || sendingReply) return
    setSendingReply(true)
    await onAddComment(post.id, replyText.trim(), parentId)
    setReplyText('')
    setReplyingTo(null)
    setSendingReply(false)
  }

  /* --- acciones de la publicación --- */

  const copyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        // si tampoco funciona, no hay mucho más que hacer
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const savePost = async () => {
    const text = editText.trim()
    if (!text && images.length === 0) {
      setActionError('La publicación no puede quedar vacía')
      return
    }
    if (text === post.content) {
      setEditingPost(false)
      return
    }
    setSavingPost(true)
    setActionError('')
    const { data, error } = await supabase
      .from('posts')
      .update({ content: text, edited_at: new Date().toISOString() })
      .eq('id', post.id)
      .select('id')
    setSavingPost(false)
    if (error || !data || data.length === 0) {
      setActionError(error ? error.message : EDIT_ERROR_HINT)
      return
    }
    setEditingPost(false)
    await onRefresh()
  }

  const deletePost = async () => {
    setDeletingPost(true)
    setActionError('')
    const { data, error } = await supabase.from('posts').delete().eq('id', post.id).select('id')
    if (error || !data || data.length === 0) {
      setActionError(error ? error.message : EDIT_ERROR_HINT)
      setDeletingPost(false)
      setConfirmDeletePost(false)
      return
    }
    // Limpieza de las fotos guardadas (si falla no pasa nada grave)
    const paths = images.map((img) => img.path).filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove(paths)
    }
    setDeletingPost(false)
    setConfirmDeletePost(false)
    if (onPostDeleted) onPostDeleted()
    else await onRefresh()
  }

  /* --- acciones de comentarios (las usa CommentThread por contexto) --- */

  const editComment = async (id: string, text: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('comments')
      .update({ content: text, edited_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
    if (error) return error.message
    if (!data || data.length === 0) return EDIT_ERROR_HINT
    await onRefresh()
    return null
  }

  const deleteComment = async (id: string): Promise<string | null> => {
    const { data, error } = await supabase.from('comments').delete().eq('id', id).select('id')
    if (error) return error.message
    if (!data || data.length === 0) return EDIT_ERROR_HINT
    await onRefresh()
    return null
  }

  const postMenu: MenuItem[] = [
    { label: 'Copiar enlace', icon: <LinkIcon className="w-4 h-4" />, onClick: copyLink },
    ...(isMine
      ? [
          {
            label: 'Editar',
            icon: <EditIcon className="w-4 h-4" />,
            onClick: () => {
              setEditText(post.content)
              setActionError('')
              setEditingPost(true)
            },
          },
          {
            label: 'Eliminar',
            icon: <TrashIcon className="w-4 h-4" />,
            danger: true,
            onClick: () => setConfirmDeletePost(true),
          },
        ]
      : []),
  ]

  const timeLine = (
    <p className="text-[11px] text-neutral-500">
      <Link href={`/post/${post.id}`} title={fullDate(post.created_at)} className="hover:underline">
        {timeAgo(post.created_at)}
      </Link>
      {post.edited_at && <span title={fullDate(post.edited_at)}> · editado</span>}
    </p>
  )

  // Jerarquía de nombres: nombre del personaje grande y en blanco arriba,
  // @usuario chico y gris abajo.
  const nameBlock = author ? (
    <div className="leading-tight min-w-0">
      <Link href={`/perfil/${author.username}`} className="block text-[15px] font-bold text-neutral-50 hover:text-garnet-400 truncate">
        {author.id_student || author.username}
      </Link>
      <Link href={`/perfil/${author.username}`} className="block text-xs text-neutral-600 hover:text-garnet-400 truncate">
        @{author.username}
      </Link>
      {timeLine}
    </div>
  ) : (
    <div className="leading-tight min-w-0">
      <span className="block text-[15px] font-bold text-neutral-50">Estudiante</span>
      <span className="block text-xs text-neutral-600">@usuario</span>
      {timeLine}
    </div>
  )

  return (
    <article className="surface-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {showAuthor ? (
            <>
              <button
                type="button"
                onClick={goToProfile}
                disabled={!author}
                className="shrink-0 cursor-pointer"
                aria-label={author ? `Ver perfil de @${author.username}` : 'Ver perfil'}
              >
                <MiniAvatar username={author?.username ?? 'usuario'} avatarUrl={author?.avatar_url ?? null} />
              </button>
              {nameBlock}
            </>
          ) : (
            timeLine
          )}
        </div>

        <div className="flex items-center gap-1">
          {copied && <span className="text-[11px] text-emerald-400">Enlace copiado</span>}
          <KebabMenu items={postMenu} label="Opciones de la publicación" />
        </div>
      </div>

      {editingPost ? (
        <div className="mb-3">
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2 text-[15px] resize-y focus:outline-none focus:border-garnet-600"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setEditingPost(false)
                setActionError('')
              }}
              className="text-sm border border-ink-600 text-neutral-300 rounded-full px-4 py-1.5 hover:bg-ink-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={savePost}
              disabled={savingPost}
              className="text-sm bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white rounded-full px-4 py-1.5 transition"
            >
              {savingPost ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        post.content && (
          <p
            onClick={canGoToProfile ? goToProfile : undefined}
            className={`text-[15px] text-neutral-100 leading-relaxed whitespace-pre-wrap break-words mb-3 ${
              canGoToProfile ? 'cursor-pointer' : ''
            }`}
          >
            {renderContentWithHashtags(post.content)}
          </p>
        )
      )}

      {images.length > 0 && (
        <div className="mb-3">
          <PostImages images={images} onOpen={setLightbox} />
        </div>
      )}

      {actionError && <p className="text-xs text-garnet-400 mb-3">{actionError}</p>}

      {isFrozen && (
        <p className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-3">
          <SnowflakeIcon className="w-3.5 h-3.5" />
          Esta cuenta está congelada: nadie puede darle like ni comentar por ahora.
        </p>
      )}

      <div className="flex items-center gap-5 text-neutral-500">
        <button
          onClick={() => onToggleLike(post)}
          disabled={interactionsDisabled}
          className={`flex items-center gap-1.5 text-sm transition disabled:opacity-40 ${
            likedByMe ? 'text-garnet-500' : 'hover:text-garnet-400'
          }`}
        >
          <HeartIcon filled={likedByMe} className="w-[18px] h-[18px]" />
          {post.likes.length}
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm hover:text-garnet-400 transition"
        >
          <CommentIcon className="w-[18px] h-[18px]" />
          {post.comments.length}
        </button>
      </div>

      {expanded && (
        <ThreadContext.Provider
          value={{
            childrenByParent,
            currentUserId,
            interactionsDisabled,
            onToggleCommentLike,
            replyingTo,
            setReplyingTo,
            replyText,
            setReplyText,
            sendingReply,
            submitReply,
            editComment,
            deleteComment,
          }}
        >
          <div className="mt-4 pt-4 border-t border-ink-700 space-y-3">
            {rootComments.length === 0 && (
              <p className="text-xs text-neutral-500">Todavía no hay comentarios. Sé el primero.</p>
            )}

            {visibleRoots.map((c) => (
              <CommentThread key={c.id} comment={c} depth={0} />
            ))}

            {hiddenRoots > 0 && (
              <button
                type="button"
                onClick={() => setShowAllRoots(true)}
                className="text-xs font-medium text-garnet-400 hover:underline"
              >
                Ver {hiddenRoots} {hiddenRoots === 1 ? 'comentario más' : 'comentarios más'}
              </button>
            )}

            {!detail && showAllRoots && rootComments.length > ROOT_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllRoots(false)}
                className="text-xs font-medium text-neutral-500 hover:text-garnet-400 hover:underline"
              >
                Mostrar menos comentarios
              </button>
            )}

            {interactionsDisabled ? null : currentUserId ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitComment()
                  }}
                  placeholder="Escribe un comentario..."
                  className="flex-1 min-w-0 bg-ink-900 border border-ink-700 rounded-full px-3.5 py-2 text-sm focus:outline-none focus:border-garnet-600"
                />
                <button
                  onClick={submitComment}
                  disabled={sending}
                  className="w-9 h-9 shrink-0 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center transition disabled:opacity-60"
                  aria-label="Enviar comentario"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-xs text-neutral-400 underline">
                Inicia sesión para comentar
              </Link>
            )}
          </div>
        </ThreadContext.Provider>
      )}

      {lightbox !== null && <ImageLightbox images={images} startIndex={lightbox} onClose={closeLightbox} />}

      <ConfirmDialog
        open={confirmDeletePost}
        title="¿Eliminar publicación?"
        message="Se borrará la publicación con sus fotos, likes y comentarios. No se puede deshacer."
        busy={deletingPost}
        onConfirm={deletePost}
        onCancel={() => setConfirmDeletePost(false)}
      />
    </article>
  )
}
