'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../../components/AppShell'
import { useAvatarCropper, BANNER_CROP } from '../../../components/AvatarCropper'
import { ClubAvatar, KindLabel } from '../../../components/ClubCard'
import { ClubTag } from '../../../components/ClubTag'
import { CameraIcon } from '../../../components/icons'
import {
  CLUB_DESC_MAX,
  CLUB_PALETTE,
  DEFAULT_CLUB_COLOR,
  friendlyClubError,
  hexToRgba,
  type ClubRequestRow,
} from '../../../lib/clubs'

export default function ConfigurarClubPage() {
  return (
    <AppShell>
      <ConfigurarContent />
    </AppShell>
  )
}

function ConfigurarContent() {
  const params = useParams()
  const requestId = (params?.request as string) ?? ''
  const router = useRouter()
  const { userId, loading: sessionLoading } = useAppSession()

  const [request, setRequest] = useState<ClubRequestRow | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'blocked'>('loading')
  const [existingSlug, setExistingSlug] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>(DEFAULT_CLUB_COLOR)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // El MISMO editor de recorte y zoom del registro de usuarios
  const { openCropper, cropperElement } = useAvatarCropper(
    (file, previewUrl) => {
      setAvatarFile(file)
      setAvatarPreview(previewUrl)
    },
    { title: 'Acomoda la foto de tu club', fileName: 'club-avatar.jpg' }
  )
  const { openCropper: openBannerCropper, cropperElement: bannerCropperElement } = useAvatarCropper(
    (file, previewUrl) => {
      setBannerFile(file)
      setBannerPreview(previewUrl)
    },
    { ...BANNER_CROP, title: 'Acomoda el banner de tu club', fileName: 'club-banner.jpg' }
  )

  useEffect(() => {
    if (sessionLoading) return
    if (!userId) {
      router.push('/login')
      return
    }
    async function run() {
      const { data } = await supabase
        .from('club_requests')
        .select('id, requester_id, club_name, kind, details, status, decline_reason, created_at, club_id')
        .eq('id', requestId)
        .maybeSingle()
      const row = data as ClubRequestRow | null
      // El enlace es solo del creador: si no es suyo, para la base de datos ni existe
      if (!row || row.requester_id !== userId) {
        setState('blocked')
        return
      }
      setRequest(row)
      if (row.status === 'completed' && row.club_id) {
        const { data: club } = await supabase.from('clubs').select('slug').eq('id', row.club_id).maybeSingle()
        setExistingSlug((club as { slug: string } | null)?.slug ?? null)
      }
      setState(row.status === 'approved' ? 'ready' : 'blocked')
    }
    run()
  }, [sessionLoading, userId, requestId, router])

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>, open: (f: File) => void) => {
    const file = e.target.files?.[0] ?? null
    if (file) open(file)
    e.target.value = ''
  }

  const handleCreate = async () => {
    if (!userId || !request || saving) return
    setSaving(true)
    setError('')

    let avatarUrl: string | null = null
    let bannerUrl: string | null = null
    if (avatarFile) {
      const path = `${userId}/club-${request.id}-avatar.jpg`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (upErr) {
        setError('No se pudo subir la foto del club: ' + upErr.message)
        setSaving(false)
        return
      }
      avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
    }
    if (bannerFile) {
      const path = `${userId}/club-${request.id}-banner.jpg`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, bannerFile, { upsert: true })
      if (upErr) {
        setError('No se pudo subir el banner del club: ' + upErr.message)
        setSaving(false)
        return
      }
      bannerUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
    }

    const { data, error: rpcErr } = await supabase.rpc('club_create_from_request', {
      p_request: request.id,
      p_description: description.trim() || null,
      p_avatar: avatarUrl,
      p_banner: bannerUrl,
      p_color: color,
    })
    setSaving(false)
    if (rpcErr || !data) {
      setError(friendlyClubError(rpcErr?.message))
      return
    }
    router.push(`/clubes/${data as string}`)
  }

  if (state === 'loading') {
    return <p className="text-neutral-500 text-sm text-center py-20">Cargando...</p>
  }

  if (state === 'blocked' || !request) {
    const used = request?.status === 'completed'
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <h1 className="text-lg font-display font-semibold text-neutral-50 mb-2">
          {used ? 'Este enlace ya se usó' : request ? 'Todavía no puedes crear este club' : 'Este enlace no es para ti'}
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          {used
            ? 'La página de tu club ya fue creada. Desde ahí puedes editarla.'
            : request?.status === 'pending'
              ? 'Tu solicitud sigue en revisión. Te avisaremos cuando el equipo responda.'
              : request?.status === 'declined'
                ? 'Esta solicitud fue declinada.'
                : 'El enlace de configuración es personal y solo funciona para quien hizo la solicitud.'}
        </p>
        <Link href={used && existingSlug ? `/clubes/${existingSlug}` : '/clubes'} className="inline-block bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2 transition">
          {used && existingSlug ? 'Ir a mi club' : 'Volver a Clubes'}
        </Link>
      </div>
    )
  }

  const previewClub = { name: request.club_name, avatar_url: avatarPreview, color }

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <h1 className="text-xl font-display font-semibold text-neutral-50 mb-1">Crea la página de tu {request.kind === 'pandilla' ? 'pandilla' : 'club'}</h1>
      <p className="text-sm text-neutral-500 mb-5">
        Tu solicitud fue aprobada. Este enlace es solo para ti y se puede usar <b className="text-neutral-300">una sola vez</b>.
      </p>

      <div className="surface-card rounded-2xl overflow-hidden mb-4">
        {/* Banner */}
        <div className="relative h-28 sm:h-36" style={{ backgroundColor: hexToRgba(color, 0.25) }}>
          {bannerPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerPreview} alt="Banner del club" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <label className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 bg-black/60 hover:bg-black/75 text-white text-xs font-medium rounded-full px-3 py-1.5 cursor-pointer transition">
            <CameraIcon className="w-4 h-4" />
            {bannerPreview ? 'Cambiar banner' : 'Agregar banner'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, openBannerCropper)} />
          </label>
        </div>
        <div className="px-4 pb-4 -mt-9 relative">
          <div className="flex items-end gap-3">
            <div className="relative">
              <ClubAvatar club={previewClub} size="w-[72px] h-[72px]" textClass="text-2xl" />
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-garnet-600 hover:bg-garnet-500 text-white flex items-center justify-center cursor-pointer transition border-2 border-ink-800">
                <CameraIcon className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, openCropper)} aria-label="Cambiar foto del club" />
              </label>
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-base font-bold text-neutral-50 truncate">{request.club_name}</p>
              <KindLabel kind={request.kind} />
            </div>
          </div>
          <p className="text-[11px] text-neutral-600 mt-3">El nombre y el tipo quedan tal como los aprobó el equipo.</p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-4 mb-4">
        <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="club-desc">
          Descripción del club
        </label>
        <textarea
          id="club-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, CLUB_DESC_MAX))}
          rows={4}
          placeholder="¿De qué trata el grupo? ¿Qué hacen? ¿Cuándo se reúnen?"
          className="w-full bg-ink-900 border border-ink-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-garnet-600"
        />
        <p className="text-[11px] text-neutral-600 text-right mt-1 mb-4">{description.length}/{CLUB_DESC_MAX}</p>

        <p className="text-xs font-medium text-neutral-400 mb-2">Color del grupo (para las etiquetas de sus miembros)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CLUB_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`w-8 h-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-offset-ink-800 ring-neutral-100 scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <p className="text-[11px] text-neutral-500 mb-1.5">Así se verá tu etiqueta de líder:</p>
        <ClubTag name={`Líder de ${request.club_name}`} color={color} kind={request.kind} leader />
      </div>

      {error && <p className="text-xs text-garnet-400 mb-3">{error}</p>}

      <button
        type="button"
        onClick={handleCreate}
        disabled={saving}
        className="w-full bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white font-medium rounded-full py-3 text-sm transition"
      >
        {saving ? 'Creando tu página...' : 'Crear la página del club'}
      </button>
      <p className="text-[11px] text-neutral-600 text-center mt-2">Serás el líder: tendrás control de administrador solo dentro de la página de tu club.</p>

      {cropperElement}
      {bannerCropperElement}
    </div>
  )
}
