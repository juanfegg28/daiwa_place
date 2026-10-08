'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AuthLayout from '../components/AuthLayout'
import ProfilePreviewCard from '../components/ProfilePreviewCard'
import { useAvatarCropper, BANNER_CROP } from '../components/AvatarCropper'
import { CameraIcon } from '../components/icons'
import { ESTADOS_SENTIMENTALES } from '../lib/constants'
import { checkStudentName, NAME_HELP, NAME_PLACEHOLDER } from '../lib/nameFilter'
import PasswordInput from '../components/PasswordInput'

const usernameRegex = /^[a-z0-9_.]+$/

export default function RegisterPage() {
  const [idStudent, setIdStudent] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [securityWord, setSecurityWord] = useState('')
  const [bio, setBio] = useState('')
  const [grado, setGrado] = useState('')
  const [birthday, setBirthday] = useState('')
  const [estadoPersonal, setEstadoPersonal] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [postWarnings, setPostWarnings] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { openCropper, cropperElement } = useAvatarCropper((file, previewUrl) => {
    setAvatarFile(file)
    setAvatarPreview(previewUrl)
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) openCropper(file)
    e.target.value = ''
  }

  const { openCropper: openBannerCropper, cropperElement: bannerCropperElement } = useAvatarCropper(
    (file, previewUrl) => {
      setBannerFile(file)
      setBannerPreview(previewUrl)
    },
    BANNER_CROP
  )

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) openBannerCropper(file)
    e.target.value = ''
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanUsername = username.trim().toLowerCase()

    if (!usernameRegex.test(cleanUsername)) {
      setError('El usuario solo puede tener letras, números, puntos y guion bajo, sin espacios ni símbolos')
      setLoading(false)
      return
    }

    const nameCheck = checkStudentName(idStudent, cleanUsername)
    if (nameCheck.error) {
      setError(nameCheck.error)
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (existing) {
      setError('Ese nombre de usuario ya está en uso')
      setLoading(false)
      return
    }

    const fakeEmail = `${cleanUsername}@gmail.com`

    let { data, error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
    })

    // Si un registro anterior se quedó a medias (se creó el acceso pero no el perfil), el usuario
    // queda "ocupado" sin dueño. Como arriba ya comprobamos que NO hay perfil con ese @, se retoma
    // entrando con la misma contraseña en vez de dejarlo bloqueado para siempre.
    if (signUpError && /already registered|already been registered/i.test(signUpError.message)) {
      const retry = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
      if (retry.error || !retry.data.user) {
        setError(
          'Ese usuario quedó a medias en un registro anterior. Usa la misma contraseña que pusiste esa vez para terminarlo, o elige otro usuario.'
        )
        setLoading(false)
        return
      }
      data = { user: retry.data.user, session: retry.data.session }
      signUpError = null
    }

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('No se pudo crear la cuenta')
      setLoading(false)
      return
    }

    const userId = data.user.id
    let avatarUrl: string | null = null
    let bannerUrl: string | null = null
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
        avatarUrl = urlData.publicUrl
      }
    }

    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop() || 'jpg'
      const path = `${userId}/banner.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, bannerFile, { upsert: true })
      if (uploadError) {
        uploadWarnings.push('Banner: ' + uploadError.message)
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        bannerUrl = urlData.publicUrl
      }
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      username: cleanUsername,
      id_student: idStudent.trim() || null,
      security_word: securityWord.trim(),
      bio: bio.trim() || null,
      grado: grado.trim() || null,
      birthday: birthday || null,
      estado_personal: estadoPersonal || null,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
    })

    if (profileError) {
      setError('Cuenta creada, pero falló el perfil: ' + profileError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    if (uploadWarnings.length > 0) {
      setPostWarnings(uploadWarnings)
      return
    }
    router.push('/')
  }

  const nameHint = checkStudentName(idStudent, username)

  // Aviso (en vez de una ventana del navegador) cuando la cuenta se creó pero algo no se pudo guardar
  if (postWarnings) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center">
        <h1 className="text-xl font-display font-semibold text-neutral-50 mb-2">¡Tu cuenta está lista!</h1>
        <p className="text-sm text-neutral-400 mb-4">Pero hubo un detalle: no se pudo guardar lo siguiente.</p>
        <ul className="text-sm text-amber-300 space-y-1 mb-4">
          {postWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500 mb-6">
          Puedes volver a subirlo desde Editar perfil. Si sigue fallando, avisa a la administración.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-6 py-2.5 text-sm font-medium transition"
        >
          Entrar a DaiwaPlace
        </button>
      </div>
    )
  }

  return (
    <AuthLayout wide>
      <h1 className="text-xl font-display font-semibold mb-1 text-center text-neutral-50">
        Crear cuenta en DaiwaPlace
      </h1>
      <p className="text-neutral-500 text-sm text-center mb-6">Únete a la comunidad</p>

      {(avatarPreview || bannerPreview) && (
        <ProfilePreviewCard
          displayName={idStudent}
          username={username}
          bio={bio}
          grado={grado}
          birthday={birthday}
          estadoPersonal={estadoPersonal}
          avatarPreview={avatarPreview}
          bannerPreview={bannerPreview}
        />
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Nombre de tu personaje</label>
          <input
            type="text"
            value={idStudent}
            onChange={(e) => setIdStudent(e.target.value)}
            placeholder={NAME_PLACEHOLDER}
            maxLength={40}
            autoComplete="off"
            required
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
          {nameHint.error ? (
            <p className="mt-1.5 text-xs text-garnet-400">{nameHint.error}</p>
          ) : nameHint.warning ? (
            <p className="mt-1.5 text-xs text-amber-300">{nameHint.warning}</p>
          ) : (
            <p className="mt-1.5 text-xs text-neutral-500">{NAME_HELP}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm text-neutral-400">Usuario (@) — con esto entrarás</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
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

        <div className="flex gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-sm text-neutral-300 border border-ink-700 hover:bg-ink-800 rounded-xl py-2.5 transition">
            <CameraIcon className="w-4 h-4" />
            Foto de perfil
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
          <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-sm text-neutral-300 border border-ink-700 hover:bg-ink-800 rounded-xl py-2.5 transition">
            <CameraIcon className="w-4 h-4" />
            Banner
            <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block mb-1 text-sm text-neutral-400">Contraseña</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
        </div>

        <div>
          <label className="block mb-1 text-sm text-neutral-400">
            Palabra secreta (para recuperar tu cuenta)
          </label>
          <input
            type="text"
            value={securityWord}
            onChange={(e) => setSecurityWord(e.target.value)}
            required
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
        </div>

        {error && <p className="text-garnet-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full py-2.5 transition"
        >
          {loading ? 'Creando...' : 'Registrarme'}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500 mt-4">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-garnet-400 hover:underline">
          Inicia sesión
        </Link>
      </p>

      {cropperElement}
      {bannerCropperElement}
    </AuthLayout>
  )
}
