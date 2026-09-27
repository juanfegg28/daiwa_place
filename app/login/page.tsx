'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AuthLayout from '../components/AuthLayout'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanUsername = username.trim().toLowerCase()
    const fakeEmail = `${cleanUsername}@gmail.com`

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (loginError) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <AuthLayout>
      <h1 className="text-xl font-display font-semibold mb-6 text-center text-neutral-50">
        Entrar a Daiwa Place
      </h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Nombre de usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="text-center text-sm text-neutral-500 mt-4">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-garnet-400 hover:underline">
          Regístrate
        </Link>
      </p>
      <p className="text-center text-sm text-neutral-500 mt-2">
        <Link href="/recuperar" className="text-garnet-400 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </AuthLayout>
  )
}
