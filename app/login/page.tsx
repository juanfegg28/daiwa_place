'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Entrar a Daiwa Place</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-neutral-400">Nombre de usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-neutral-400">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black text-sm font-medium rounded-full py-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-4">
          ¿No tienes cuenta? <a href="/register" className="text-white underline">Regístrate</a>
        </p>
        <p className="text-center text-sm text-neutral-500 mt-2">
  <a href="/recuperar" className="text-white underline">¿Olvidaste tu contraseña?</a>
</p>
      </div>
    </div>
  )
}