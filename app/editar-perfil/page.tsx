'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AppShell, { useAppSession } from '../components/AppShell'
import ProfilePreviewCard from '../components/ProfilePreviewCard'
import { useAvatarCropper, BANNER_CROP_GIF } from '../components/AvatarCropper'
import { uploadBanner } from '../lib/banner'
import { CameraIcon } from '../components/icons'
import IdentityFields from '../components/IdentityFields'
import { IDENTITY_VISIBILITY_OPTIONS, type IdentityVisibility } from '../lib/identities'
import { ESTADOS_SENTIMENTALES } from '../lib/constants'
import { checkStudentName, NAME_HELP, NAME_PLACEHOLDER } from '../lib/nameFilter'
import MusicField from '../components/MusicField'
import { normalizeTrack } from '../lib/music'

export default function EditProfilePage() {
  return (
    <AppShell>
      <EditProfileForm />
    </AppShell>
  )
}

function EditProfileForm() {
  const { userId, username, loading: sessionLoading, refresh } = useAppSession()
  const [idStudent, setIdStudent] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [uploadNotice, setUploadNotice] = useState<string[] | null>(null)
  const [bio, setBio] = useState('')
  const [music, setMusic] = useState<unknown>(null)
  const [grado, setGrado] = useState('')
  const [birthday, setBirthday] = useState('')
  const [estadoPersonal, setEstadoPersonal] = useState('')
  const [identity, setIdentity] = useState('')
  const [identityDetail, setIdentityDetail] = useState('')
  const [identityVisibility, setIdentityVisibility] = useState<IdentityVisibility>('todos')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const { openCropper, cropperElement } = useAvatarCropper((file, previewUrl) => {
    setAvatarFile(file)
    setAvatarPreview(previewUrl)
  })

  const { openCropper: openBannerCropper, cropperElement: bannerCropperElement } = useAvatarCropper(
    (file, previewUrl) => {
      setBannerFile(file)
      setBannerPreview(previewUrl)
    },
    BANNER_CROP_GIF
  )

  const loadProfile = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id_student, bio, grado, birthday, estado_personal, avatar_url, banner_url, music')
      .eq('id', id)
      .single()

    if (data) {
      setIdStudent(data.id_student ?? '')
      setOriginalName((data.id_student ?? '').trim())
      setBio(data.bio ?? '')
      setMusic(data.music ?? null)
      setGrado(data.grado ?? '')
      setBirthday(data.birthday ?? '')
      setEstadoPersonal(data.estado_personal ?? '')
      // Identidad (v1.1.10): se pide aparte para que Editar perfil cargue igual si todavía falta el SQL nuevo
      const { data: idData } = await supabase.rpc('profile_identity', { p_user: userId })
      const idRow = (Array.isArray(idData) ? idData[0] : idData) as { identity: string | null; identity_detail: string | null; identity_visibility: string | null } | null
      setIdentity(idRow?.identity ?? '')
      setIdentityDetail(idRow?.identity_detail ?? '')
      setIdentityVisibility((idRow?.identity_visibility as IdentityVisibility) || 'todos')
      setAvatarPreview(data.avatar_url ?? null)
      setBannerPreview(data.banner_url ?? null)
    }

    setLoadingProfile(false)
  }

  useEffect(() => {
    if (sessionLoading) return
    if (!userId) {
      router.push('/login')
      return
    }
    function run() {
      loadProfile(userId as string)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, userId])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) openCropper(file)
    e.target.value = ''
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) openBannerCropper(file)
    e.target.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setSuccess(false)

    // Solo se valida si cambió el nombre: así quien tiene un nombre antiguo puede guardar lo demás sin problema
    if (idStudent.trim() !== originalName) {
      const nameCheck = checkStudentName(idStudent, username ?? '')
      if (nameCheck.error) {
        setError(nameCheck.error)
        setSaving(false)
        return
      }
    }

    let avatarUrl: string | null = avatarPreview && !avatarFile ? avatarPreview : null
    let bannerUrl: string | null = bannerPreview && !bannerFile ? bannerPreview : null
    const uploadWarnings: string[] = []

    if (avatarFile) {
      const path = `${userId}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) {
        uploadWarnings.push('Foto de perfil: ' + uploadError.message)
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
      }
    }

    if (bannerFile) {
      const up = await uploadBanner(supabase, userId, bannerFile)
      if ('error' in up) uploadWarnings.push('Banner: ' + up.error)
      else bannerUrl = up.url
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        id_student: idStudent.trim() || null,
        bio: bio.trim() || null,
        grado: grado.trim() || null,
        birthday: birthday || null,
        estado_personal: estadoPersonal || null,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        music: normalizeTrack(music) ? music : null,
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    const { error: identityError } = await supabase
      .from('profiles')
      .update({ identity: identity || null, identity_detail: identityDetail.trim() || null, identity_visibility: identityVisibility })
      .eq('id', userId)
    if (identityError && !/identity|column|schema cache/i.test(identityError.message)) {
      setError(identityError.message)
      setSaving(false)
      return
    }
    if (identityError && identity) {
      uploadWarnings.push('Identidad: falta correr el SQL de la v1.1.10 en Supabase')
    }

    setUploadNotice(uploadWarnings.length > 0 ? uploadWarnings : null)
    setOriginalName(idStudent.trim())
    setAvatarFile(null)
    setBannerFile(null)
    refresh()
    setSaving(false)
    setSuccess(true)
  }

  const nameHint = checkStudentName(idStudent, username ?? '')

  if (sessionLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-display font-semibold mb-1 text-neutral-50">Editar perfil</h1>
      <p className="text-neutral-500 text-sm mb-6">{'@' + username}</p>

      <ProfilePreviewCard
        displayName={idStudent}
        username={username ?? ''}
        bio={bio}
        grado={grado}
        birthday={birthday}
        estadoPersonal={estadoPersonal}
        avatarPreview={avatarPreview}
        bannerPreview={bannerPreview}
        identity={identity}
        identityDetail={identityDetail}
        identityVisibility={identityVisibility}
        music={music}
      />

      <form onSubmit={handleSave} className="space-y-5">
        <div className="flex gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-sm text-neutral-300 border border-ink-700 hover:bg-ink-800 rounded-xl py-2.5 transition">
            <CameraIcon className="w-4 h-4" />
            Cambiar foto de perfil
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
          <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-sm text-neutral-300 border border-ink-700 hover:bg-ink-800 rounded-xl py-2.5 transition">
            <CameraIcon className="w-4 h-4" />
            Cambiar banner <span className="text-[10px] text-neutral-500">(GIF ok)</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleBannerChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block mb-1 text-sm text-neutral-400">Nombre de tu personaje</label>
          <input
            type="text"
            value={idStudent}
            onChange={(e) => setIdStudent(e.target.value)}
            placeholder={NAME_PLACEHOLDER}
            maxLength={40}
            autoComplete="off"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
          {nameHint.error && idStudent.trim() !== originalName ? (
            <p className="mt-1.5 text-xs text-garnet-400">{nameHint.error}</p>
          ) : nameHint.warning && idStudent.trim() !== originalName ? (
            <p className="mt-1.5 text-xs text-amber-300">{nameHint.warning}</p>
          ) : (
            <p className="mt-1.5 text-xs text-neutral-500">{NAME_HELP}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm text-neutral-400">Biografía</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-garnet-600"
          />
          <p className="text-xs text-neutral-600 mt-1">{bio.length}/300</p>
        </div>

        <div>
          <label className="block mb-1 text-sm text-neutral-400">Canción del perfil</label>
          <p className="text-xs text-neutral-500 mb-2">
            Se muestra en tu perfil con un botón de play (fragmento de 30 segundos). Puedes cambiarla o quitarla cuando quieras.
          </p>
          <MusicField
            value={music}
            onChange={setMusic}
            variant="card"
            label="Elegir canción del perfil"
            pickerTitle="Elige la canción de tu perfil"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm text-neutral-400">Grado</label>
            <input
              type="text"
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              placeholder="ej. 3er año"
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-neutral-400">Cumpleaños</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm text-neutral-400">Situación sentimental</label>
          <select
            value={estadoPersonal}
            onChange={(e) => setEstadoPersonal(e.target.value)}
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          >
            <option value="">Prefiero no decir</option>
            {ESTADOS_SENTIMENTALES.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        <IdentityFields
          identity={identity}
          detail={identityDetail}
          onIdentityChange={setIdentity}
          onDetailChange={setIdentityDetail}
          labelClass="block mb-1 text-sm text-neutral-400"
          inputClass="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
        />

        {identity && (
          <div>
            <label className="block mb-1 text-sm text-neutral-400">¿Quién puede ver tu identidad?</label>
            <select
              value={identityVisibility}
              onChange={(e) => setIdentityVisibility(e.target.value as IdentityVisibility)}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            >
              {IDENTITY_VISIBILITY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-600 mt-1">Es un dato personal: tú decides quién lo ve. Lo respeta la base de datos, no solo la pantalla.</p>
          </div>
        )}

        <Link href="/personalizar" className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-sm text-neutral-200 hover:bg-ink-800 transition">
          <span>🎨 Color de tu perfil, nombre y tarjeta</span>
          <span className="text-garnet-400">Personalizar →</span>
        </Link>

        {error && <p className="text-garnet-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-500 text-sm">Perfil actualizado</p>}
        {uploadNotice && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-300 space-y-0.5">
            <p className="font-semibold">Se guardaron tus datos, pero no se pudo subir:</p>
            {uploadNotice.map((w) => (
              <p key={w}>{w}</p>
            ))}
            <p className="text-amber-300/80">Inténtalo de nuevo; si sigue fallando, avisa a la administración.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {username && (
            <Link
              href={`/perfil/${username}`}
              className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition inline-flex items-center"
            >
              Cancelar
            </Link>
          )}
        </div>
      </form>

      {cropperElement}
      {bannerCropperElement}
    </div>
  )
}
