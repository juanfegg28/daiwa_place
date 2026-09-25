'use client'

import { useState } from 'react'

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
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-4">Listo!</h1>
          <p className="text-neutral-400 mb-6">
            Tu contrasena se cambio correctamente. Ya puedes iniciar sesion con la nueva.
          </p>
          <a
            href="/login"
            className="inline-block bg-white text-black text-sm font-medium rounded-full px-4 py-2"
          >
            Ir a iniciar sesion
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">Recuperar cuenta</h1>
        <p className="text-neutral-500 text-sm text-center mb-6">
          Escribe tu usuario, tu palabra secreta, y la nueva contrasena que quieras usar.
        </p>
        <form onSubmit={handleRecover} className="space-y-4">
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
            <label className="block mb-1 text-sm text-neutral-400">Palabra secreta</label>
            <input
              type="text"
              value={securityWord}
              onChange={(e) => setSecurityWord(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-neutral-400">Nueva contrasena</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black text-sm font-medium rounded-full py-2"
          >
            {loading ? 'Verificando...' : 'Cambiar contrasena'}
          </button>
        </form>
        <p className="text-center text-xs text-neutral-500 mt-6 leading-relaxed">
          No pudiste recuperar tu cuenta? Comunicate con el programador de la pagina por
          Discord: <span className="text-neutral-300">Juanfe</span>
        </p>
      </div>
    </div>
  )
}
