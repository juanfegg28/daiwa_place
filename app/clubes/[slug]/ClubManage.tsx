'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { useAvatarCropper, BANNER_CROP } from '../../components/AvatarCropper'
import { ClubAvatar } from '../../components/ClubCard'
import { ClubTag } from '../../components/ClubTag'
import AvatarPhoto from '../../components/AvatarPhoto'
import { CameraIcon, CheckIcon, CloseIcon, EditIcon, PlusIcon, TrashIcon } from '../../components/icons'
import {
  CLUB_DESC_MAX,
  CLUB_MAX_ROLES,
  CLUB_PALETTE,
  CLUB_ROLE_NAME_MAX,
  friendlyClubError,
  hexToRgba,
  type ClubRole,
  type ClubSummary,
} from '../../lib/clubs'

export type JoinRequestRow = {
  id: string
  user_id: string
  created_at: string
  profiles: { username: string; id_student: string | null; avatar_url: string | null } | null
}

/** Panel del líder: solo dentro de la página de SU club. Nada de esto da permisos en el resto de la página. */
export default function ClubManage({
  club,
  roles,
  requests,
  userId,
  onChanged,
}: {
  club: ClubSummary
  roles: ClubRole[]
  requests: JoinRequestRow[]
  userId: string
  onChanged: () => void | Promise<void>
}) {
  const [description, setDescription] = useState(club.description ?? '')
  const [color, setColor] = useState(club.color)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(club.avatar_url)
  const [bannerPreview, setBannerPreview] = useState<string | null>(club.banner_url)
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleColor, setNewRoleColor] = useState<string>(CLUB_PALETTE[1])
  const [roleError, setRoleError] = useState('')
  const [editingRole, setEditingRole] = useState<{ id: string; name: string; color: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  // El mismo editor de recorte y zoom del registro
  const { openCropper, cropperElement } = useAvatarCropper(
    (file, url) => {
      setAvatarFile(file)
      setAvatarPreview(url)
    },
    { title: 'Acomoda la foto de tu club', fileName: 'club-avatar.jpg' }
  )
  const { openCropper: openBannerCropper, cropperElement: bannerCropperElement } = useAvatarCropper(
    (file, url) => {
      setBannerFile(file)
      setBannerPreview(url)
    },
    { ...BANNER_CROP, title: 'Acomoda el banner de tu club', fileName: 'club-banner.jpg' }
  )

  const pick = (e: React.ChangeEvent<HTMLInputElement>, open: (f: File) => void) => {
    const f = e.target.files?.[0] ?? null
    if (f) open(f)
    e.target.value = ''
  }

  const saveInfo = async () => {
    setSavingInfo(true)
    setInfoMsg('')
    let avatarUrl = club.avatar_url
    let bannerUrl = club.banner_url
    if (avatarFile) {
      const path = `${userId}/club-${club.id}-avatar.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (error) {
        setInfoMsg('No se pudo subir la foto: ' + error.message)
        setSavingInfo(false)
        return
      }
      avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
    }
    if (bannerFile) {
      const path = `${userId}/club-${club.id}-banner.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, bannerFile, { upsert: true })
      if (error) {
        setInfoMsg('No se pudo subir el banner: ' + error.message)
        setSavingInfo(false)
        return
      }
      bannerUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
    }
    const { data, error } = await supabase
      .from('clubs')
      .update({ description: description.trim() || null, color, avatar_url: avatarUrl, banner_url: bannerUrl })
      .eq('id', club.id)
      .select('id')
    setSavingInfo(false)
    if (error || !data || data.length === 0) {
      setInfoMsg(friendlyClubError(error?.message ?? 'No se pudo guardar.'))
      return
    }
    setAvatarFile(null)
    setBannerFile(null)
    setInfoMsg('Guardado ✓')
    await onChanged()
  }

  const respond = async (id: string, action: 'accept' | 'decline') => {
    setBusy(id)
    await supabase.rpc('club_respond_join', { p_request: id, p_action: action })
    setBusy(null)
    await onChanged()
  }

  const customRoles = roles.filter((r) => !r.is_leader)
  const leaderRole = roles.find((r) => r.is_leader)

  const addRole = async () => {
    const name = newRoleName.replace(/\s+/g, ' ').trim()
    if (!name) return
    setRoleError('')
    setBusy('new-role')
    const { error } = await supabase.from('club_roles').insert({ club_id: club.id, name, color: newRoleColor })
    setBusy(null)
    if (error) {
      setRoleError(
        error.message.includes('club_roles_name_unique') || error.message.includes('duplicate')
          ? 'Ya tienes un rol con ese nombre'
          : friendlyClubError(error.message)
      )
      return
    }
    setNewRoleName('')
    await onChanged()
  }

  const saveRole = async () => {
    if (!editingRole) return
    const name = editingRole.name.replace(/\s+/g, ' ').trim()
    if (!name) return
    setBusy(editingRole.id)
    const { error } = await supabase.from('club_roles').update({ name, color: editingRole.color }).eq('id', editingRole.id)
    setBusy(null)
    if (error) {
      setRoleError(error.message.includes('duplicate') ? 'Ya tienes un rol con ese nombre' : friendlyClubError(error.message))
      return
    }
    setEditingRole(null)
    setRoleError('')
    await onChanged()
  }

  const deleteRole = async (id: string) => {
    setBusy(id)
    await supabase.from('club_roles').delete().eq('id', id)
    setBusy(null)
    await onChanged()
  }

  return (
    <div className="space-y-4">
      {/* Solicitudes para unirse */}
      <section className="surface-card rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-neutral-50 mb-1">Solicitudes para unirse {requests.length > 0 && <span className="text-garnet-400">({requests.length})</span>}</h3>
        <p className="text-xs text-neutral-500 mb-3">Acepta solo a quienes ya coordinaron su ingreso contigo por Discord.</p>
        {requests.length === 0 ? (
          <p className="text-xs text-neutral-600">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-ink-700/60 p-2.5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-ink-700 shrink-0 flex items-center justify-center">
                  {r.profiles?.avatar_url ? (
                    <AvatarPhoto src={r.profiles.avatar_url} username={r.profiles.username} sizes="48px" />
                  ) : (
                    <span className="text-sm font-semibold text-garnet-400">{(r.profiles?.username ?? '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <Link href={`/perfil/${r.profiles?.username ?? ''}`} className="min-w-0 flex-1 leading-tight">
                  <p className="text-sm font-semibold text-neutral-50 truncate">{r.profiles?.id_student || r.profiles?.username}</p>
                  <p className="text-xs text-neutral-500 truncate">@{r.profiles?.username}</p>
                </Link>
                <button type="button" disabled={busy === r.id} onClick={() => respond(r.id, 'accept')} aria-label="Aceptar" className="w-8 h-8 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center transition disabled:opacity-60">
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button type="button" disabled={busy === r.id} onClick={() => respond(r.id, 'decline')} aria-label="Declinar" className="w-8 h-8 rounded-full border border-ink-500 text-neutral-300 hover:bg-ink-600 flex items-center justify-center transition disabled:opacity-60">
                  <CloseIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Roles internos (puramente estéticos) */}
      <section className="surface-card rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-neutral-50 mb-1">Roles de tu {club.kind === 'pandilla' ? 'pandilla' : 'club'}</h3>
        <p className="text-xs text-neutral-500 mb-3">
          Son <b className="text-neutral-300">solo de adorno</b>: se ven como etiqueta junto al nombre de cada miembro, pero no dan ningún permiso en DaiwaPlace.
          Se asignan desde la pestaña «Miembros». Máximo {CLUB_MAX_ROLES}.
        </p>

        {leaderRole && (
          <div className="mb-2">
            <ClubTag name={leaderRole.name} color={leaderRole.color} kind={club.kind} leader title="Rol base del líder (automático)" />
          </div>
        )}

        <ul className="space-y-2 mb-3">
          {customRoles.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              {editingRole?.id === r.id ? (
                <div className="flex-1 rounded-xl bg-ink-700/60 p-2.5">
                  <input
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value.slice(0, CLUB_ROLE_NAME_MAX) })}
                    className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-garnet-600 mb-2"
                  />
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {CLUB_PALETTE.map((c) => (
                      <button key={c} type="button" onClick={() => setEditingRole({ ...editingRole, color: c })} aria-label={`Color ${c}`} className={`w-6 h-6 rounded-full ${editingRole.color === c ? 'ring-2 ring-neutral-100' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditingRole(null)} className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1 hover:bg-ink-700 transition">Cancelar</button>
                    <button type="button" onClick={saveRole} disabled={busy === r.id} className="text-xs bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-3 py-1 transition disabled:opacity-60">Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <ClubTag name={r.name} color={r.color} kind={club.kind} title="Rol del club" />
                  </div>
                  <button type="button" onClick={() => setEditingRole({ id: r.id, name: r.name, color: r.color })} aria-label={`Editar ${r.name}`} className="w-7 h-7 rounded-full text-neutral-500 hover:text-neutral-100 hover:bg-ink-700 flex items-center justify-center transition">
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => deleteRole(r.id)} disabled={busy === r.id} aria-label={`Eliminar ${r.name}`} className="w-7 h-7 rounded-full text-neutral-500 hover:text-garnet-400 hover:bg-ink-700 flex items-center justify-center transition disabled:opacity-60">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

        {customRoles.length < CLUB_MAX_ROLES && (
          <div className="rounded-xl border border-dashed border-ink-600 p-3">
            <p className="text-xs text-neutral-400 mb-2">Crear un rol nuevo (ej. «Tesorero», «Comandante»)</p>
            <div className="flex gap-2 mb-2">
              <input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.slice(0, CLUB_ROLE_NAME_MAX))}
                onKeyDown={(e) => e.key === 'Enter' && addRole()}
                placeholder="Nombre del rol"
                className="flex-1 min-w-0 bg-ink-900 border border-ink-700 rounded-full px-3.5 py-1.5 text-sm focus:outline-none focus:border-garnet-600"
              />
              <button type="button" onClick={addRole} disabled={!newRoleName.trim() || busy === 'new-role'} className="shrink-0 inline-flex items-center gap-1 bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-3.5 py-1.5 text-sm transition disabled:opacity-50">
                <PlusIcon className="w-4 h-4" />
                Crear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CLUB_PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => setNewRoleColor(c)} aria-label={`Color ${c}`} className={`w-6 h-6 rounded-full ${newRoleColor === c ? 'ring-2 ring-neutral-100' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            {newRoleName.trim() && (
              <div className="mt-2">
                <ClubTag name={newRoleName.trim()} color={newRoleColor} kind={club.kind} />
              </div>
            )}
          </div>
        )}
        {roleError && <p className="text-xs text-garnet-400 mt-2">{roleError}</p>}
      </section>

      {/* Información del club */}
      <section className="surface-card rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-neutral-50 mb-3">Información de la página</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <ClubAvatar club={{ name: club.name, avatar_url: avatarPreview, color }} size="w-14 h-14" textClass="text-xl" />
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center cursor-pointer border-2 border-ink-800 transition">
              <CameraIcon className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" aria-label="Cambiar foto del club" onChange={(e) => pick(e, openCropper)} />
            </label>
          </div>
          <div className="relative flex-1 h-14 rounded-xl overflow-hidden" style={{ backgroundColor: hexToRgba(color, 0.25) }}>
            {bannerPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <label className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 bg-black/60 hover:bg-black/75 text-white text-[11px] rounded-full px-2.5 py-1 cursor-pointer transition">
              <CameraIcon className="w-3 h-3" />
              Banner
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, openBannerCropper)} />
            </label>
          </div>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, CLUB_DESC_MAX))}
          rows={3}
          placeholder="Descripción del club"
          className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-garnet-600"
        />
        <p className="text-[11px] text-neutral-600 text-right mt-1 mb-3">{description.length}/{CLUB_DESC_MAX}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CLUB_PALETTE.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`} aria-pressed={color === c} className={`w-7 h-7 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-offset-ink-800 ring-neutral-100' : ''}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={saveInfo} disabled={savingInfo} className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition">
            {savingInfo ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {infoMsg && <span className={`text-xs ${infoMsg.includes('✓') ? 'text-emerald-400' : 'text-garnet-400'}`}>{infoMsg}</span>}
        </div>
        <p className="text-[11px] text-neutral-600 mt-3">El nombre y el tipo del club no se pueden cambiar desde aquí: si hace falta, escríbele al equipo.</p>
      </section>

      {cropperElement}
      {bannerCropperElement}
    </div>
  )
}
