'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthLayout from '../components/AuthLayout'

export default function RecoverPage() {
  const [username, setUsername] = useState('')
  const [securityWord, setSecurityWord] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, securityWord, newPassword }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'No se pudo recuperar la cuenta')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h1 className="text-xl font-display font-semibold mb-3 text-neutral-50">¡Listo!</h1>
          <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
            Tu contraseña se cambió correctamente. Ya puedes iniciar sesión con la nueva.
          </p>
          <Link
            href="/login"
            className="inline-block bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2.5 transition"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-xl font-display font-semibold mb-2 text-center text-neutral-50">
        Recuperar cuenta
      </h1>
      <p className="text-neutral-500 text-sm text-center mb-6">
        Escribe tu usuario, tu palabra secreta, y la nueva contraseña que quieras usar.
      </p>
      <form onSubmit={handleRecover} className="space-y-4">
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
          <label className="block mb-1 text-sm text-neutral-400">Palabra secreta</label>
          <input
            type="text"
            value={securityWord}
            onChange={(e) => setSecurityWord(e.target.value)}
            required
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
        </div>
        {error && <p className="text-garnet-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full py-2.5 transition"
        >
          {loading ? 'Verificando...' : 'Cambiar contraseña'}
        </button>
      </form>
      <p className="text-center text-xs text-neutral-500 mt-6 leading-relaxed">
        ¿No pudiste recuperar tu cuenta? Comunícate con el programador de la página por Discord:{' '}
        <span className="text-neutral-300">Juanfe</span>
      </p>
    </AuthLayout>
  )
}
