'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Post, Comment } from '../lib/types'
import { HeartIcon, CommentIcon, SendIcon, ReplyIcon } from './icons'

type PostCardProps = {
  post: Post
  currentUserId: string | null
  showAuthor?: boolean
  onToggleLike: (post: Post) => void
  onToggleCommentLike: (commentId: string, alreadyLiked: boolean) => void
  onAddComment: (postId: string, text: string, parentCommentId?: string | null) => Promise<void> | void
}

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

const MAX_INDENT_LEVEL = 4
const INDENT_PX = 18

type CommentThreadProps = {
  comment: Comment
  childrenByParent: Map<string, Comment[]>
  depth: number
  currentUserId: string | null
  onToggleCommentLike: (commentId: string, alreadyLiked: boolean) => void
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  replyText: string
  setReplyText: (v: string) => void
  sendingReply: boolean
  submitReply: (parentId: string) => void
}

function CommentThread({
  comment,
  childrenByParent,
  depth,
  currentUserId,
  onToggleCommentLike,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  sendingReply,
  submitReply,
}: CommentThreadProps) {
  const commentLikedByMe = currentUserId
    ? comment.comment_likes.some((l) => l.user_id === currentUserId)
    : false
  const commentAuthor = comment.profiles
  const children = childrenByParent.get(comment.id) ?? []
  const isReplyingHere = replyingTo === comment.id
  const indent = depth > 0 ? Math.min(depth, MAX_INDENT_LEVEL) * INDENT_PX : 0

  return (
    <div style={{ marginLeft: indent }}>
      <div className="flex items-start gap-2">
        <MiniAvatar
          username={commentAuthor?.username ?? 'usuario'}
          avatarUrl={commentAuthor?.avatar_url ?? null}
          size={depth > 0 ? 'w-6 h-6' : 'w-7 h-7'}
        />
        <div className="flex-1 min-w-0">
          <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-ink-700 px-3 py-2">
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

          <div className="flex items-center gap-3 mt-1 ml-1">
            <button
              onClick={() => onToggleCommentLike(comment.id, commentLikedByMe)}
              className={`flex items-center gap-1 text-[11px] transition ${
                commentLikedByMe ? 'text-garnet-500' : 'text-neutral-600 hover:text-garnet-400'
              }`}
            >
              <HeartIcon filled={commentLikedByMe} className="w-3 h-3" />
              {comment.comment_likes.length}
            </button>
            {currentUserId && (
              <button
                onClick={() => {
                  setReplyingTo(isReplyingHere ? null : comment.id)
                  setReplyText('')
                }}
                className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-garnet-400 transition"
              >
                <ReplyIcon className="w-3 h-3" />
                {isReplyingHere ? 'Cancelar' : 'Responder'}
              </button>
            )}
          </div>

          {isReplyingHere && (
            <div className="flex items-center gap-2 mt-2">
              <input
                autoFocus
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitReply(comment.id)
                }}
                placeholder={`Responder a @${commentAuthor?.username ?? 'usuario'}...`}
                className="flex-1 bg-ink-900 border border-ink-700 rounded-full px-3.5 py-1.5 text-xs focus:outline-none focus:border-garnet-600"
              />
              <button
                onClick={() => submitReply(comment.id)}
                disabled={sendingReply}
                className="w-7 h-7 shrink-0 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center transition disabled:opacity-60"
                aria-label="Enviar respuesta"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-ink-700/80 pl-2">
          {children.map((child) => (
            <CommentThread
              key={child.id}
              comment={child}
              childrenByParent={childrenByParent}
              depth={depth + 1}
              currentUserId={currentUserId}
              onToggleCommentLike={onToggleCommentLike}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              sendingReply={sendingReply}
              submitReply={submitReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostCard({
  post,
  currentUserId,
  showAuthor = true,
  onToggleLike,
  onToggleCommentLike,
  onAddComment,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const router = useRouter()

  const likedByMe = currentUserId ? post.likes.some((l) => l.user_id === currentUserId) : false
  const author = post.profiles

  // Arma el árbol de comentarios: raíz vs. respuestas, agrupadas por su padre
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

  const canGoToProfile = showAuthor && !!author

  const goToProfile = () => {
    if (author) router.push(`/perfil/${author.username}`)
  }

  const submitComment = async () => {
    if (!commentText.trim() || sending) return
    setSending(true)
    await onAddComment(post.id, commentText.trim())
    setCommentText('')
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

  return (
    <article className="surface-card rounded-2xl p-4">
      {showAuthor && (
        <div className="flex items-center gap-2.5 mb-3">
          <button
            type="button"
            onClick={goToProfile}
            className="shrink-0 cursor-pointer"
            aria-label={author ? `Ver perfil de @${author.username}` : 'Ver perfil'}
          >
            <MiniAvatar username={author?.username ?? 'usuario'} avatarUrl={author?.avatar_url ?? null} />
          </button>
          <div className="leading-tight">
            {author ? (
              <Link
                href={`/perfil/${author.username}`}
                className="text-sm font-semibold text-neutral-100 hover:text-garnet-400"
              >
                @{author.username}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-neutral-100">@usuario</span>
            )}
            <p className="text-[11px] text-neutral-500">{timeAgo(post.created_at)}</p>
          </div>
        </div>
      )}

      <p
        onClick={canGoToProfile ? goToProfile : undefined}
        className={`text-[15px] text-neutral-100 leading-relaxed whitespace-pre-wrap mb-3 ${
          canGoToProfile ? 'cursor-pointer' : ''
        }`}
      >
        {post.content}
      </p>

      <div className="flex items-center gap-5 text-neutral-500">
        <button
          onClick={() => onToggleLike(post)}
          className={`flex items-center gap-1.5 text-sm transition ${
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
        <div className="mt-4 pt-4 border-t border-ink-700 space-y-3">
          {rootComments.length === 0 && (
            <p className="text-xs text-neutral-500">Todavía no hay comentarios. Sé el primero.</p>
          )}

          {rootComments.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              childrenByParent={childrenByParent}
              depth={0}
              currentUserId={currentUserId}
              onToggleCommentLike={onToggleCommentLike}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              sendingReply={sendingReply}
              submitReply={submitReply}
            />
          ))}

          {currentUserId ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitComment()
                }}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-ink-900 border border-ink-700 rounded-full px-3.5 py-2 text-sm focus:outline-none focus:border-garnet-600"
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
      )}
    </article>
  )
}
