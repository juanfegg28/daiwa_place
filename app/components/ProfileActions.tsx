'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import KebabMenu, { type MenuItem } from './KebabMenu'
import ConfirmDialog from './ConfirmDialog'
import ReportDialog from './ReportDialog'
import { FlagIcon, BlockIcon } from './icons'

type ProfileActionsProps = {
  currentUserId: string | null
  targetUserId: string
  targetUsername: string
  isFollowing: boolean
  isBlockedByMe: boolean
  onFollowChange: (following: boolean) => void
  onBlockChange: (blocked: boolean) => void
}

/** Botón de Seguir/Siguiendo + menú de tres puntitos (Reportar / Bloquear) del perfil. */
export default function ProfileActions({
  currentUserId,
  targetUserId,
  targetUsername,
  isFollowing,
  isBlockedByMe,
  onFollowChange,
  onBlockChange,
}: ProfileActionsProps) {
  const [busy, setBusy] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const router = useRouter()

  const toggleFollow = async () => {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    setBusy(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetUserId)
      onFollowChange(false)
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: targetUserId })
      if (!error) onFollowChange(true)
    }
    setBusy(false)
  }

  const doBlock = async () => {
    if (!currentUserId) return
    setBlocking(true)
    const { error } = await supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: targetUserId })
    if (!error) {
      // al bloquear se rompe el follow en ambos sentidos
      await supabase
        .from('follows')
        .delete()
        .or(
          `and(follower_id.eq.${currentUserId},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${currentUserId})`
        )
      onBlockChange(true)
      onFollowChange(false)
    }
    setBlocking(false)
    setShowBlockConfirm(false)
  }

  const doUnblock = async () => {
    if (!currentUserId) return
    setBlocking(true)
    await supabase.from('blocks').delete().eq('blocker_id', currentUserId).eq('blocked_id', targetUserId)
    onBlockChange(false)
    setBlocking(false)
  }

  if (!currentUserId || currentUserId === targetUserId) return null

  const menuItems: MenuItem[] = [
    { label: 'Reportar perfil', icon: <FlagIcon className="w-4 h-4" />, onClick: () => setShowReport(true) },
    {
      label: 'Bloquear usuario',
      icon: <BlockIcon className="w-4 h-4" />,
      danger: true,
      onClick: () => setShowBlockConfirm(true),
    },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {isBlockedByMe ? (
        <button
          type="button"
          onClick={doUnblock}
          disabled={blocking}
          className="text-sm border border-ink-600 text-neutral-300 rounded-full px-4 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
        >
          {blocking ? 'Desbloqueando...' : 'Desbloquear'}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busy}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition disabled:opacity-60 ${
              isFollowing
                ? 'border border-ink-600 text-neutral-300 hover:bg-ink-800 hover:border-garnet-600 hover:text-garnet-400'
                : 'bg-garnet-600 hover:bg-garnet-500 text-white'
            }`}
          >
            {isFollowing ? 'Siguiendo' : 'Seguir'}
          </button>
          <KebabMenu items={menuItems} label={`Más opciones sobre @${targetUsername}`} />
        </>
      )}

      <ReportDialog
        open={showReport}
        mode="profile"
        targetUsername={targetUsername}
        reportedUserId={targetUserId}
        reporterId={currentUserId}
        onClose={() => setShowReport(false)}
      />

      <ConfirmDialog
        open={showBlockConfirm}
        title={`¿Bloquear a @${targetUsername}?`}
        message="Dejarán de seguirse mutuamente y no van a poder darse like, comentar ni seguirse mientras dure el bloqueo. Puedes desbloquear a esta persona cuando quieras desde Configuración."
        confirmLabel="Bloquear"
        busy={blocking}
        onConfirm={doBlock}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </div>
  )
}
