'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { normalizeUsername } from '../../lib/authRules'
import AuthField from '../../components/auth/AuthField'
import PasswordField from '../../components/auth/PasswordField'
import SoftNotice from '../../components/auth/SoftNotice'
import { useLoginBrake } from '../../components/auth/useLoginBrake'
import { UserIcon } from '../../components/icons'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const brake = useLoginBrake()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (brake.locked || loading) return // en pausa: ni con Enter
    setError('')
    setLoading(true)

    const fakeEmail = `${username.trim().toLowerCase()}@gmail.com`
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })

    if (loginError) {
      setLoading(false)
      // Solo las contraseñas/usuarios incorrectos cuentan para el freno; una falla de red no es culpa de la persona
      if (/invalid login credentials/i.test(loginError.message) || loginError.status === 400) {
        brake.registerFailure()
        setError('Usuario o contraseña incorrectos. ¡Inténtalo de nuevo con calma!')
      } else {
        setError('No pudimos conectarnos en este momento. Inténtalo de nuevo en unos segundos.')
      }
      return
    }

    brake.registerSuccess()
    setLoading(false)
    router.push('/')
  }

  const blocked = brake.locked
  const empty = username.trim().length === 0 || password.length === 0

  return (
    <form onSubmit={handleLogin} className="space-y-4" noValidate>
      <AuthField
        id="username"
        label="Tu usuario"
        icon={<UserIcon className="h-[18px] w-[18px]" />}
        value={username}
        // Auto-corrección silenciosa: minúsculas y "_" en vez de espacios, sin que se note
        onChange={(e) => setUsername(normalizeUsername(e.target.value))}
        autoComplete="username"
        placeholder="tu_usuario"
        required
        autoFocus
      />
      <PasswordField
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder="Tu contraseña"
        required
      />

      {error && !blocked && <SoftNotice tone="error">{error}</SoftNotice>}
      {!error && !blocked && brake.attemptsLeft > 0 && brake.attemptsLeft <= 2 && (
        <SoftNotice tone="info">
          Te quedan {brake.attemptsLeft} {brake.attemptsLeft === 1 ? 'intento' : 'intentos'} antes de un pequeño descanso.
        </SoftNotice>
      )}
      {blocked && (
        <SoftNotice tone="info">
          Por tu seguridad pausamos el acceso un momento. Si no recuerdas tu contraseña, puedes{' '}
          <Link href="/recuperar" className="font-medium text-garnet-300 underline-offset-2 hover:underline">
            recuperarla aquí
          </Link>
          .
        </SoftNotice>
      )}

      <button
        type="submit"
        disabled={blocked || loading || empty}
        className={`w-full rounded-2xl py-3.5 text-[15px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
          blocked
            ? 'bg-ink-700 text-neutral-400'
            : 'bg-garnet-600 text-white shadow-[0_12px_30px_-12px_rgba(214,40,72,0.9)] hover:bg-garnet-500 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none'
        }`}
      >
        {blocked ? `Demasiados intentos. Tómate un respiro de ${brake.secondsLeft}s ☕` : loading ? 'Entrando...' : 'Entrar'}
      </button>

      <div className="space-y-1.5 pt-1 text-center text-sm text-neutral-500">
        <p>
          ¿Aún no tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-garnet-300 hover:underline">
            Únete a DaiwaPlace
          </Link>
        </p>
        <p>
          <Link href="/recuperar" className="text-neutral-500 transition hover:text-garnet-300">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </form>
  )
}
