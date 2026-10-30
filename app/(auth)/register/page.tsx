'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import ProfilePreviewCard from '../../components/ProfilePreviewCard'
import { useAvatarCropper, BANNER_CROP_GIF } from '../../components/AvatarCropper'
import { uploadBanner } from '../../lib/banner'
import { ArrowLeftIcon, CalendarIcon, CameraIcon, CommentIcon, GraduationCapIcon, HeartIcon, KeyIcon, UserIcon } from '../../components/icons'
import { ESTADOS_SENTIMENTALES } from '../../lib/constants'
import { checkStudentName, NAME_HELP, NAME_PLACEHOLDER } from '../../lib/nameFilter'
import { USERNAME_MIN, USERNAME_REGEX, normalizeUsername, passwordReport } from '../../lib/authRules'
import AuthField, { AuthSelect, AuthTextarea, type FieldTone } from '../../components/auth/AuthField'
import { IDENTITIES, identityField } from '../../lib/identities'
import { SparklesIcon } from '../../components/icons'
import PasswordField from '../../components/auth/PasswordField'
import PasswordMeter from '../../components/auth/PasswordMeter'
import SoftNotice from '../../components/auth/SoftNotice'

type Avail = 'idle' | 'checking' | 'available' | 'taken' | 'unknown'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [idStudent, setIdStudent] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [securityWord, setSecurityWord] = useState('')
  const [bio, setBio] = useState('')
  const [grado, setGrado] = useState('')
  const [birthday, setBirthday] = useState('')
  const [estadoPersonal, setEstadoPersonal] = useState('')
  const [identity, setIdentity] = useState('')
  const [identityDetail, setIdentityDetail] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [postWarnings, setPostWarnings] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [avail, setAvail] = useState<{ name: string; state: Avail }>({ name: '', state: 'idle' })
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

  // ¿Está libre el @usuario? Se comprueba mientras escribes (con una pausa de 0.45 s para no preguntar en cada letra)
  useEffect(() => {
    if (username.length < USERNAME_MIN) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const { data, error: err } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
      if (cancelled) return
      setAvail({ name: username, state: err ? 'unknown' : data ? 'taken' : 'available' })
    }, 450)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [username])

  // Si el nombre cambió y todavía no hay respuesta para ese nombre, se está comprobando
  const availState: Avail = username.length < USERNAME_MIN ? 'idle' : avail.name === username ? avail.state : 'checking'

  const nameHint = checkStudentName(idStudent, username)
  const nameOk = idStudent.trim().length >= 2 && !nameHint.error
  const pwReport = passwordReport(password, username)
  const wordOk = securityWord.trim().length >= 4
  const usernameOk = username.length >= USERNAME_MIN && (availState === 'available' || availState === 'unknown')
  const step1Ok = nameOk && usernameOk && pwReport.meetsRules && wordOk

  let usernameHint: string
  let usernameTone: FieldTone = 'neutral'
  if (username.length === 0) usernameHint = 'Con esto entrarás. Todo en minúsculas; los espacios se vuelven _ solos.'
  else if (username.length < USERNAME_MIN) usernameHint = `Un poquito más largo: mínimo ${USERNAME_MIN} caracteres`
  else if (availState === 'checking') usernameHint = 'Buscando si está libre…'
  else if (availState === 'available') {
    usernameHint = `¡Gran nombre! @${username} está disponible`
    usernameTone = 'good'
  } else if (availState === 'taken') {
    usernameHint = 'Ese ya lo tiene alguien. ¡Prueba con otro toque personal!'
    usernameTone = 'warn'
  } else usernameHint = 'No pudimos comprobarlo ahora; lo revisaremos al crear tu cuenta.'

  const nameTone: FieldTone = nameHint.error || nameHint.warning ? 'warn' : 'neutral'
  const nameHintText = nameHint.error ?? nameHint.warning ?? NAME_HELP

  const goTo = (next: 1 | 2) => {
    setDirection(next > step ? 'next' : 'back')
    setStep(next)
    setError('')
  }

  const handleRegister = async () => {
    setError('')
    const cleanUsername = username

    // Las mismas comprobaciones de siempre (por si algo se escapó del paso 1)
    if (!USERNAME_REGEX.test(cleanUsername) || cleanUsername.length < USERNAME_MIN) {
      setDirection('back')
      setStep(1)
      setError('Revisa tu usuario: letras, números, puntos y guion bajo, mínimo 3 caracteres.')
      return
    }
    if (nameHint.error) {
      setDirection('back')
      setStep(1)
      setError(nameHint.error)
      return
    }
    if (!pwReport.meetsRules) {
      setDirection('back')
      setStep(1)
      setError('Tu contraseña necesita al menos 8 caracteres y un número. ¡Ya casi!')
      return
    }

    setLoading(true)

    const { data: existing } = await supabase.from('profiles').select('id').eq('username', cleanUsername).maybeSingle()
    if (existing) {
      setLoading(false)
      setDirection('back')
      setStep(1)
      setError('Ese nombre de usuario ya está en uso. ¡Elige otro!')
      return
    }

    const fakeEmail = `${cleanUsername}@gmail.com`

    let { data, error: signUpError } = await supabase.auth.signUp({ email: fakeEmail, password })

    // Si un registro anterior se quedó a medias (se creó el acceso pero no el perfil), el usuario queda
    // "ocupado" sin dueño. Como arriba ya comprobamos que NO hay perfil con ese @, se retoma entrando con
    // la misma contraseña en vez de dejarlo bloqueado para siempre.
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
      setError('No se pudo crear la cuenta. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    const userId = data.user.id
    let avatarUrl: string | null = null
    let bannerUrl: string | null = null
    const uploadWarnings: string[] = []

    if (avatarFile) {
      const path = `${userId}/avatar.jpg`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (uploadError) {
        uploadWarnings.push('Foto de perfil: ' + uploadError.message)
      } else {
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }
    }

    if (bannerFile) {
      const up = await uploadBanner(supabase, userId, bannerFile)
      if ('error' in up) uploadWarnings.push('Banner: ' + up.error)
      else bannerUrl = up.url
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
      setError('Tu cuenta se creó, pero no pudimos guardar el perfil: ' + profileError.message)
      setLoading(false)
      return
    }

    // Identidad (v1.1.10): se guarda aparte para que el registro nunca falle si todavía falta el SQL nuevo
    if (identity) {
      await supabase.from('profiles').update({ identity, identity_detail: identityDetail.trim() || null }).eq('id', userId)
    }

    setLoading(false)
    if (uploadWarnings.length > 0) {
      setPostWarnings(uploadWarnings)
      return
    }
    router.push('/')
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (step === 1) {
      if (step1Ok) goTo(2)
      return
    }
    void handleRegister()
  }

  // Aviso (en vez de una ventana del navegador) cuando la cuenta se creó pero algo no se pudo guardar
  if (postWarnings) {
    return (
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold text-neutral-50">¡Tu cuenta está lista! 🎉</h2>
        <p className="mb-4 text-sm text-neutral-400">Solo hubo un detalle: no se pudo guardar lo siguiente.</p>
        <ul className="mb-4 space-y-1 text-sm text-amber-300">
          {postWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p className="mb-6 text-xs text-neutral-500">
          Puedes volver a subirlo desde Editar perfil. Si sigue fallando, avisa a la administración.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="w-full rounded-2xl bg-garnet-600 py-3.5 text-[15px] font-semibold text-white transition hover:bg-garnet-500 active:scale-[0.98]"
        >
          Entrar a DaiwaPlace
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Progreso: 2 pasos cortitos */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-300">{step === 1 ? 'Tu cuenta' : 'Tu perfil'}</span>
          <span className="text-neutral-500">Paso {step} de 2</span>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-1 flex-1 rounded-full bg-garnet-500" />
          <span className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step === 2 ? 'bg-garnet-500' : 'bg-white/10'}`} />
        </div>
      </div>

      <div key={step} className={direction === 'next' ? 'auth-enter-right' : 'auth-enter-left'}>
        {step === 1 ? (
          <div className="space-y-4">
            <AuthField
              id="idStudent"
              label="Nombre de tu personaje"
              icon={<UserIcon className="h-[18px] w-[18px]" />}
              value={idStudent}
              onChange={(e) => setIdStudent(e.target.value)}
              placeholder={NAME_PLACEHOLDER}
              maxLength={40}
              autoComplete="off"
              required
              hint={nameHintText}
              tone={nameTone}
            />

            <AuthField
              id="username"
              label="Tu usuario"
              icon={<span className="text-base font-semibold leading-none">@</span>}
              value={username}
              // Auto-corrección silenciosa: minúsculas, "_" en vez de espacios, sin tildes ni símbolos raros
              onChange={(e) => setUsername(normalizeUsername(e.target.value))}
              placeholder="tu_usuario"
              autoComplete="username"
              required
              status={availState === 'checking' ? 'checking' : availState === 'available' ? 'good' : 'idle'}
              hint={usernameHint}
              tone={usernameTone}
            />

            <div className="space-y-3">
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Crea una contraseña"
                required
              />
              <PasswordMeter report={pwReport} />
            </div>

            <AuthField
              id="securityWord"
              label="Palabra secreta"
              icon={<KeyIcon className="h-[18px] w-[18px]" />}
              value={securityWord}
              onChange={(e) => setSecurityWord(e.target.value)}
              autoComplete="off"
              required
              hint={
                securityWord.length > 0 && !wordOk
                  ? 'Un poquito más larga: mínimo 4 caracteres'
                  : 'Es tu llave para recuperar la cuenta. Elige algo que recuerdes y nadie adivine.'
              }
              tone={securityWord.length > 0 && !wordOk ? 'warn' : 'neutral'}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400">
              Todo esto es opcional: puedes completarlo cuando quieras desde Editar perfil. 💫
            </p>

            {(avatarPreview || bannerPreview || bio || identity || grado || birthday || estadoPersonal) && (
              <ProfilePreviewCard
                displayName={idStudent}
                username={username}
                bio={bio}
                grado={grado}
                birthday={birthday}
                estadoPersonal={estadoPersonal}
                avatarPreview={avatarPreview}
                bannerPreview={bannerPreview}
                identity={identity}
                identityDetail={identityDetail}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="press flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-ink-950/40 py-3.5 text-sm text-neutral-300 transition hover:border-garnet-500/60 hover:text-garnet-300">
                <CameraIcon className="h-4 w-4" />
                {avatarPreview ? 'Cambiar foto' : 'Foto de perfil'}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <label className="press flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-ink-950/40 py-3.5 text-sm text-neutral-300 transition hover:border-garnet-500/60 hover:text-garnet-300">
                <CameraIcon className="h-4 w-4" />
                {bannerPreview ? 'Cambiar banner' : 'Banner'}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleBannerChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AuthField
                id="grado"
                label="Grado"
                icon={<GraduationCapIcon className="h-[18px] w-[18px]" />}
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                placeholder="ej. 3er año"
                autoComplete="off"
              />
              <AuthField
                id="birthday"
                label="Cumpleaños"
                icon={<CalendarIcon className="h-[18px] w-[18px]" />}
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            <AuthSelect
              id="estado"
              label="Situación sentimental"
              icon={<HeartIcon className="h-[18px] w-[18px]" />}
              value={estadoPersonal}
              onChange={(e) => setEstadoPersonal(e.target.value)}
            >
              <option value="">Prefiero no decir</option>
              {ESTADOS_SENTIMENTALES.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </AuthSelect>

            <AuthSelect
              id="identity"
              label="Identidad"
              icon={<SparklesIcon className="h-[18px] w-[18px]" />}
              value={identity}
              onChange={(e) => {
                setIdentity(e.target.value)
                setIdentityDetail('')
              }}
            >
              <option value="">Sin especificar</option>
              {IDENTITIES.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </AuthSelect>

            {identityField(identity) && (
              identityField(identity)?.type === 'select' ? (
                <AuthSelect
                  id="identity-detail"
                  label={identityField(identity)?.label ?? ''}
                  icon={<SparklesIcon className="h-[18px] w-[18px]" />}
                  value={identityDetail}
                  onChange={(e) => setIdentityDetail(e.target.value)}
                >
                  <option value="">Sin especificar</option>
                  {identityField(identity)?.options?.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </AuthSelect>
              ) : (
                <AuthField
                  id="identity-detail"
                  label={identityField(identity)?.label ?? ''}
                  icon={<SparklesIcon className="h-[18px] w-[18px]" />}
                  type={identityField(identity)?.type === 'date' ? 'date' : identityField(identity)?.type === 'number' ? 'number' : 'text'}
                  value={identityDetail}
                  onChange={(e) => setIdentityDetail(e.target.value.slice(0, identityField(identity)?.max ?? 80))}
                  placeholder={identityField(identity)?.placeholder}
                />
              )
            )}

            <AuthTextarea
              id="bio"
              label="Biografía"
              icon={<CommentIcon className="h-[18px] w-[18px]" />}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos algo sobre ti…"
              maxLength={300}
              hint={`${bio.length}/300`}
            />
          </div>
        )}
      </div>

      {error && <SoftNotice tone="error">{error}</SoftNotice>}

      {step === 1 ? (
        <button
          type="submit"
          disabled={!step1Ok}
          className={`w-full rounded-2xl py-3.5 text-[15px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
            step1Ok
              ? 'bg-garnet-600 text-white shadow-[0_12px_30px_-12px_rgba(214,40,72,0.9)] hover:bg-garnet-500 active:scale-[0.98]'
              : 'bg-ink-700 text-neutral-500'
          }`}
        >
          Siguiente
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => goTo(1)}
            disabled={loading}
            aria-label="Volver al paso anterior"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-5 text-sm text-neutral-300 transition hover:bg-white/5 active:scale-[0.98] disabled:opacity-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Atrás
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-2xl bg-garnet-600 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(214,40,72,0.9)] transition hover:bg-garnet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creando tu cuenta...' : 'Crear mi cuenta'}
          </button>
        </div>
      )}

      <p className="text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-garnet-300 hover:underline">
          Inicia sesión
        </Link>
      </p>

      {cropperElement}
      {bannerCropperElement}
    </form>
  )
}
