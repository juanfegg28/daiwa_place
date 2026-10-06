'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import KebabMenu, { type MenuItem } from '../components/KebabMenu'
import ConfirmDialog from '../components/ConfirmDialog'
import { CommentIcon, FlagIcon, LinkIcon, TrashIcon } from '../components/icons'
import { inboxTime } from '../lib/dm'
import {
  ANON_NAME,
  categoryLabel,
  friendlyWhisperError,
  isMineWhisper,
  myVoteOf,
  sendVote,
  type WhisperItem,
} from '../lib/whispers'
import AnonAvatar from './AnonAvatar'
import VoteColumn from './VoteColumn'

export default function WhisperCard({
  whisper,
  detail = false,
  reported,
  onUpdate,
  onDeleted,
  onReport,
  onNotice,
}: {
  whisper: WhisperItem
  detail?: boolean
  reported: boolean
  onUpdate: (w: WhisperItem) => void
  onDeleted: (id: string) => void
  onReport: (whisperId: string) => void
  onNotice: (text: string) => void
}) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const mine = isMineWhisper(whisper)
  const myVote = myVoteOf(whisper)
  const live = whisper.status === 'visible'
  const long = whisper.content.length > 320 || whisper.content.split('\n').length > 6
  const clamp = !detail && !expanded && long

  const vote = async (value: 1 | -1) => {
    if (!live || mine) return
    const next = myVote === value ? 0 : value
    const previous = whisper
    // se ve al instante; si falla, se devuelve como estaba
    onUpdate({
      ...whisper,
      score: whisper.score + (next - myVote),
      whisper_votes: next === 0 ? [] : [{ value: next }],
    })
    const { score, error } = await sendVote(whisper.id, next)
    if (error) {
      onUpdate(previous)
      onNotice(error)
      return
    }
    if (score !== null) {
      onUpdate({
        ...whisper,
        score,
        whisper_votes: next === 0 ? [] : [{ value: next }],
      })
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.rpc('whisper_delete', { p_whisper: whisper.id })
    setDeleting(false)
    setConfirmDelete(false)
    if (error) {
      onNotice(friendlyWhisperError(error.message))
      return
    }
    onDeleted(whisper.id)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/susurros/${whisper.id}`)
      onNotice('Enlace copiado.')
    } catch {
      onNotice('No se pudo copiar el enlace.')
    }
  }

  const items: MenuItem[] = [{ label: 'Copiar enlace', icon: <LinkIcon className="w-4 h-4" />, onClick: copyLink }]
  if (mine) items.push({ label: 'Eliminar', icon: <TrashIcon className="w-4 h-4" />, danger: true, onClick: () => setConfirmDelete(true) })
  else if (live && !reported) items.push({ label: 'Reportar', icon: <FlagIcon className="w-4 h-4" />, danger: true, onClick: () => onReport(whisper.id) })

  const open = () => {
    if (!detail) router.push(`/susurros/${whisper.id}`)
  }

  return (
    <article className="surface-card rounded-2xl p-4 flex gap-3">
      {/* Votos (escritorio: en columna a la izquierda) */}
      <div className="hidden md:block shrink-0 pt-1">
        <VoteColumn
          score={whisper.score}
          myVote={myVote}
          disabled={!live || mine}
          disabledReason={mine ? 'No puedes votar tu propia confesión' : 'No disponible'}
          onVote={vote}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5 mb-2">
          <AnonAvatar />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold text-neutral-100 truncate">
              {ANON_NAME}
              {mine && <span className="ml-1.5 text-[11px] font-normal text-garnet-400">(tú)</span>}
            </p>
            <p className="text-xs text-neutral-600">
              {inboxTime(whisper.created_at)} · <span className="text-neutral-500">{categoryLabel(whisper.category)}</span>
            </p>
          </div>
          <div className="ml-auto">
            <KebabMenu items={items} label="Opciones de la confesión" small />
          </div>
        </div>

        {whisper.status === 'hidden' && (
          <p className="mb-2 text-xs rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2">
            Oculta por reportes: varias personas la reportaron y está en revisión. Solo la ves tú y moderación.
          </p>
        )}
        {whisper.status === 'removed' && (
          <p className="mb-2 text-xs rounded-lg bg-garnet-600/10 border border-garnet-600/30 text-garnet-300 px-3 py-2">
            {whisper.removed_by_author
              ? 'La eliminaste, pero tenía reportes pendientes: moderación la va a revisar antes de borrarla del todo.'
              : 'Moderación retiró esta confesión por no cumplir las reglas del Muro.'}
          </p>
        )}

        <div onClick={open} className={detail ? '' : 'cursor-pointer'}>
          <p
            className={`text-[15px] leading-relaxed text-neutral-100 whitespace-pre-wrap break-words ${
              clamp ? 'line-clamp-6' : ''
            }`}
          >
            {whisper.content}
          </p>
        </div>
        {!detail && long && (
          <button
            type="button"
            onClick={() => (expanded ? setExpanded(false) : router.push(`/susurros/${whisper.id}`))}
            className="mt-1 text-xs text-garnet-400 hover:text-garnet-300"
          >
            Leer completa
          </button>
        )}

        <div className="mt-3 flex items-center gap-3">
          {/* Votos (celular: en horizontal abajo) */}
          <div className="md:hidden">
            <VoteColumn
              orientation="horizontal"
              score={whisper.score}
              myVote={myVote}
              disabled={!live || mine}
              disabledReason={mine ? 'No puedes votar tu propia confesión' : 'No disponible'}
              onVote={vote}
            />
          </div>
          <button
            type="button"
            onClick={open}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-100 rounded-full px-2.5 py-1.5 hover:bg-ink-700 transition"
          >
            <CommentIcon className="w-4 h-4" />
            {whisper.comment_count} {whisper.comment_count === 1 ? 'comentario' : 'comentarios'}
          </button>
          {reported && <span className="text-[11px] text-neutral-600">Ya la reportaste</span>}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar esta confesión?"
        message="Se borra para todos, junto con sus comentarios y votos. Si ya tiene reportes pendientes, se conserva un tiempo para que moderación la revise."
        confirmLabel="Eliminar"
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </article>
  )
}
