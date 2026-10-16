'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../components/AppShell'
import ResilientImage from '../../components/ResilientImage'
import AvatarPhoto from '../../components/AvatarPhoto'
import ConfirmDialog from '../../components/ConfirmDialog'
import ClubFeed from '../ClubFeed'
import ClubManage, { type JoinRequestRow } from './ClubManage'
import { ClubAvatar, KindLabel } from '../../components/ClubCard'
import { ClubTag } from '../../components/ClubTag'
import { ArrowLeftIcon, BoardPinIcon, EditIcon, UsersIcon } from '../../components/icons'
import {
  CLUB_ANNOUNCEMENT_MAX,
  CLUB_JOIN_WARNING,
  CLUB_SUMMARY_SELECT,
  friendlyClubError,
  hexToRgba,
  type ClubMemberRow,
  type ClubRole,
  type ClubSummary,
} from '../../lib/clubs'

export default function ClubPage() {
  return (
    <AppShell>
      <ClubContent />
    </AppShell>
  )
}

const MEMBERS_SELECT =
  'user_id, role_id, joined_at, profiles!club_members_user_id_fkey(username, id_student, avatar_url), club_roles!club_members_role_id_fkey(name, color, is_leader)'

function ClubContent() {
  const params = useParams()
  const slug = (params?.slug as string) ?? ''
  const { userId, loading: sessionLoading } = useAppSession()

  const [club, setClub] = useState<ClubSummary | null>(null)
  const [members, setMembers] = useState<ClubMemberRow[]>([])
  const [roles, setRoles] = useState<ClubRole[]>([])
  const [requests, setRequests] = useState<JoinRequestRow[]>([])
  const [myPending, setMyPending] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [tab, setTab] = useState<'posts' | 'members' | 'manage'>('posts')

  const [confirmJoin, setConfirmJoin] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<ClubMemberRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const [editingBoard, setEditingBoard] = useState(false)
  const [boardText, setBoardText] = useState('')
  const [savingBoard, setSavingBoard] = useState(false)

  const isLeader = !!club && !!userId && club.leader_id === userId
  const isMember = !!userId && members.some((m) => m.user_id === userId)

  const load = useCallback(async () => {
    const { data: clubRow } = await supabase.from('clubs').select(CLUB_SUMMARY_SELECT).eq('slug', slug).maybeSingle()
    const c = clubRow as ClubSummary | null
    if (!c) {
      setState('missing')
      return
    }
    setClub(c)
    const [membersRes, rolesRes, pendingRes] = await Promise.all([
      supabase.from('club_members').select(MEMBERS_SELECT).eq('club_id', c.id).order('joined_at'),
      supabase.from('club_roles').select('id, club_id, name, color, is_leader').eq('club_id', c.id).order('created_at'),
      userId
        ? supabase.from('club_join_requests').select('id').eq('club_id', c.id).eq('user_id', userId).eq('status', 'pending').maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    setMembers((membersRes.data as unknown as ClubMemberRow[]) ?? [])
    setRoles((rolesRes.data as ClubRole[]) ?? [])
    setMyPending(!!pendingRes.data)
    if (userId && c.leader_id === userId) {
      const { data: reqs } = await supabase
        .from('club_join_requests')
        .select('id, user_id, created_at, profiles!club_join_requests_user_id_fkey(username, id_student, avatar_url)')
        .eq('club_id', c.id)
        .eq('status', 'pending')
        .order('created_at')
      setRequests((reqs as unknown as JoinRequestRow[]) ?? [])
    } else {
      setRequests([])
    }
    setState('ready')
  }, [slug, userId])

  useEffect(() => {
    if (sessionLoading) return
    function run() {
      load()
    }
    run()
  }, [load, sessionLoading])

  const requestJoin = async () => {
    if (!club) return
    setBusy(true)
    const { error } = await supabase.rpc('club_request_join', { p_club: club.id })
    setBusy(false)
    setConfirmJoin(false)
    setNotice(error ? friendlyClubError(error.message) : 'Solicitud enviada. El líder la revisará.')
    load()
  }

  const cancelJoin = async () => {
    if (!club) return
    await supabase.rpc('club_cancel_join', { p_club: club.id })
    setNotice('')
    load()
  }

  const leave = async () => {
    if (!club) return
    setBusy(true)
    const { error } = await supabase.rpc('club_leave', { p_club: club.id })
    setBusy(false)
    setConfirmLeave(false)
    if (error) setNotice(friendlyClubError(error.message))
    load()
  }

  const removeMember = async () => {
    if (!club || !removeTarget) return
    setBusy(true)
    const { error } = await supabase.rpc('club_remove_member', { p_club: club.id, p_user: removeTarget.user_id })
    setBusy(false)
    setRemoveTarget(null)
    if (error) setNotice(friendlyClubError(error.message))
    load()
  }

  const setRole = async (memberId: string, roleId: string) => {
    if (!club) return
    const { error } = await supabase.rpc('club_set_member_role', { p_club: club.id, p_user: memberId, p_role: roleId || null })
    if (error) setNotice(friendlyClubError(error.message))
    load()
  }

  const saveBoard = async () => {
    if (!club) return
    setSavingBoard(true)
    const { data, error } = await supabase.from('clubs').update({ announcement: boardText.trim() || null }).eq('id', club.id).select('id')
    setSavingBoard(false)
    if (error || !data || data.length === 0) {
      setNotice(friendlyClubError(error?.message ?? 'No se pudo guardar el anuncio.'))
      return
    }
    setEditingBoard(false)
    load()
  }

  if (state === 'loading') return <p className="text-neutral-500 text-sm text-center py-20">Cargando club...</p>

  if (state === 'missing' || !club) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <h1 className="text-lg font-display font-semibold text-neutral-50 mb-2">Este club no existe</h1>
        <p className="text-sm text-neutral-500 mb-6">Puede que lo hayan cerrado o que el enlace esté mal escrito.</p>
        <Link href="/clubes" className="inline-block bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2 transition">
          Volver a Clubes
        </Link>
      </div>
    )
  }

  const leaderMember = members.find((m) => m.user_id === club.leader_id)
  const customRoles = roles.filter((r) => !r.is_leader)

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 px-4">
      <Link href="/clubes" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-garnet-400 transition mb-3">
        <ArrowLeftIcon className="w-4 h-4" />
        Clubes y Pandillas
      </Link>

      {/* Cabecera del club: diseño propio, distinto al perfil de una persona */}
      <header className="surface-card rounded-2xl overflow-hidden mb-4">
        <div className="relative h-32 sm:h-44" style={{ backgroundColor: hexToRgba(club.color, 0.25) }}>
          {club.banner_url && <ResilientImage src={club.banner_url} alt="Banner del club" fill priority sizes="(max-width: 768px) 100vw, 672px" className="object-cover" fallback={<span />} />}
          <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: club.color }} />
        </div>
        <div className="px-4 pb-4 sm:px-5">
          <div className="flex items-end justify-between gap-3 -mt-9">
            <ClubAvatar club={club} size="w-[76px] h-[76px]" textClass="text-3xl" />
            <div className="pb-1 flex flex-col items-end gap-1.5">
              {!userId ? (
                <Link href="/login" className="bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2 transition">
                  Inicia sesión para unirte
                </Link>
              ) : isLeader ? (
                <button type="button" onClick={() => setTab('manage')} className="inline-flex items-center gap-1.5 border border-ink-500 text-neutral-200 hover:bg-ink-700 text-sm rounded-full px-4 py-2 transition">
                  <EditIcon className="w-4 h-4" />
                  Administrar
                </button>
              ) : isMember ? (
                <button type="button" onClick={() => setConfirmLeave(true)} className="border border-ink-500 text-neutral-300 hover:text-garnet-400 hover:bg-ink-700 text-sm rounded-full px-4 py-2 transition">
                  Salir del club
                </button>
              ) : myPending ? (
                <button type="button" onClick={cancelJoin} className="border border-ink-500 text-neutral-300 hover:bg-ink-700 text-sm rounded-full px-4 py-2 transition" title="Toca para cancelar tu solicitud">
                  Solicitud enviada · Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmJoin(true)}
                  title={CLUB_JOIN_WARNING}
                  className="bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2 transition"
                >
                  Solicitar Unirse
                </button>
              )}
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-semibold text-neutral-50">{club.name}</h1>
              <KindLabel kind={club.kind} />
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <UsersIcon className="w-3.5 h-3.5" />
              {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
              {leaderMember?.profiles && (
                <>
                  <span>·</span>
                  <span>
                    Líder:{' '}
                    <Link href={`/perfil/${leaderMember.profiles.username}`} className="text-neutral-300 hover:text-garnet-400 transition">
                      {leaderMember.profiles.id_student || leaderMember.profiles.username}
                    </Link>
                  </span>
                </>
              )}
            </p>
            {club.description && <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap break-words mt-3">{club.description}</p>}
          </div>

          {/* Aviso para quien todavía no es miembro: ya lo coordinó por Discord */}
          {userId && !isMember && !myPending && !isLeader && (
            <p className="mt-3 text-[11.5px] text-amber-300/90 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2 leading-snug">
              {CLUB_JOIN_WARNING}
            </p>
          )}
          {notice && <p className="mt-3 text-xs text-neutral-300">{notice}</p>}
        </div>
      </header>

      {/* Tablón de anuncios fijado */}
      {(club.announcement || isLeader) && (
        <section className="rounded-2xl border border-dashed p-4 mb-4" style={{ borderColor: hexToRgba(club.color, 0.6), backgroundColor: hexToRgba(club.color, 0.08) }}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: club.color }}>
              <BoardPinIcon className="w-4 h-4" />
              Tablón de anuncios
            </p>
            {isLeader && !editingBoard && (
              <button
                type="button"
                onClick={() => {
                  setBoardText(club.announcement ?? '')
                  setEditingBoard(true)
                }}
                className="text-xs text-neutral-400 hover:text-neutral-100 transition"
              >
                {club.announcement ? 'Editar' : 'Escribir anuncio'}
              </button>
            )}
          </div>
          {editingBoard ? (
            <div>
              <textarea
                autoFocus
                value={boardText}
                onChange={(e) => setBoardText(e.target.value.slice(0, CLUB_ANNOUNCEMENT_MAX))}
                rows={3}
                placeholder="Ej: Hoy a las 8 PM reunión en la azotea del edificio C"
                className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-garnet-600"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-neutral-600">{boardText.length}/{CLUB_ANNOUNCEMENT_MAX} · déjalo vacío para quitar el anuncio</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingBoard(false)} className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1 hover:bg-ink-700 transition">Cancelar</button>
                  <button type="button" onClick={saveBoard} disabled={savingBoard} className="text-xs bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-3 py-1 transition disabled:opacity-60">
                    {savingBoard ? 'Guardando...' : 'Fijar'}
                  </button>
                </div>
              </div>
            </div>
          ) : club.announcement ? (
            <>
              <p className="text-[15px] text-neutral-50 leading-relaxed whitespace-pre-wrap break-words">{club.announcement}</p>
              {club.announcement_updated_at && (
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  Publicado el {new Date(club.announcement_updated_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-neutral-500">Aquí puedes dejar comunicados oficiales para que no se pierdan en el feed.</p>
          )}
        </section>
      )}

      {/* Pestañas */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {(
          [
            { id: 'posts', label: 'Publicaciones' },
            { id: 'members', label: `Miembros (${members.length})` },
            ...(isLeader ? [{ id: 'manage', label: requests.length > 0 ? `Administrar (${requests.length})` : 'Administrar' }] : []),
          ] as { id: 'posts' | 'members' | 'manage'; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap text-sm rounded-full px-4 py-1.5 transition ${tab === t.id ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300 hover:bg-ink-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <ClubFeed clubId={club.id} emptyText="Todavía no hay publicaciones de los miembros de este grupo." />
      )}

      {tab === 'members' && (
        <ul className="space-y-2">
          {members.map((m) => {
            const isLead = m.user_id === club.leader_id
            return (
              <li key={m.user_id} className="surface-card rounded-2xl p-3 flex items-center gap-3">
                <Link href={`/perfil/${m.profiles?.username ?? ''}`} className="relative w-10 h-10 rounded-full overflow-hidden bg-ink-700 shrink-0 flex items-center justify-center">
                  {m.profiles?.avatar_url ? (
                    <AvatarPhoto src={m.profiles.avatar_url} username={m.profiles.username} sizes="48px" />
                  ) : (
                    <span className="text-sm font-semibold text-garnet-400">{(m.profiles?.username ?? '?').charAt(0).toUpperCase()}</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1 leading-tight">
                  <Link href={`/perfil/${m.profiles?.username ?? ''}`} className="block text-sm font-bold text-neutral-50 truncate hover:text-garnet-400 transition">
                    {m.profiles?.id_student || m.profiles?.username}
                  </Link>
                  <span className="block text-xs text-neutral-600 truncate mb-1">@{m.profiles?.username}</span>
                  {m.club_roles ? (
                    <ClubTag name={m.club_roles.name} color={m.club_roles.color} kind={club.kind} leader={isLead} size="xs" />
                  ) : (
                    <span className="text-[11px] text-neutral-600">Miembro</span>
                  )}
                </div>
                {isLeader && !isLead && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={m.role_id ?? ''}
                      onChange={(e) => setRole(m.user_id, e.target.value)}
                      aria-label="Rol de este miembro"
                      className="bg-ink-900 border border-ink-700 rounded-full px-2.5 py-1 text-xs text-neutral-200 max-w-[8.5rem] focus:outline-none focus:border-garnet-600"
                    >
                      <option value="">Sin rol</option>
                      {customRoles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setRemoveTarget(m)} className="text-xs text-neutral-500 hover:text-garnet-400 px-1.5 transition">
                      Sacar
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {tab === 'manage' && isLeader && userId && (
        <ClubManage club={club} roles={roles} requests={requests} userId={userId} onChanged={load} />
      )}

      <ConfirmDialog
        open={confirmJoin}
        title={`¿Solicitar unirte a ${club.name}?`}
        message={`${CLUB_JOIN_WARNING} El líder revisará tu solicitud.`}
        confirmLabel="Ya lo coordiné · Solicitar"
        busy={busy}
        onConfirm={requestJoin}
        onCancel={() => setConfirmJoin(false)}
      />
      <ConfirmDialog
        open={confirmLeave}
        title={`¿Salir de ${club.name}?`}
        message="Dejarás de ver su etiqueta junto a tu nombre. Para volver tendrás que pedir unirte otra vez."
        confirmLabel="Salir"
        busy={busy}
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmDialog
        open={!!removeTarget}
        title="¿Sacar a este miembro?"
        message={`@${removeTarget?.profiles?.username ?? ''} dejará de pertenecer al club.`}
        confirmLabel="Sacar"
        busy={busy}
        onConfirm={removeMember}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
