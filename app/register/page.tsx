'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function RegisterPage() {
  const [idStudent, setIdStudent] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [securityWord, setSecurityWord] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanUsername = username.trim().toLowerCase()

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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: cleanUsername,
        id_student: idStudent.trim(),
        security_word: securityWord.trim(),
      })

      if (profileError) {
        setError('Cuenta creada, pero falló el perfil: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta en Daiwa Place</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-neutral-400">ID de estudiante (nombre de tu personaje)</label>
            <input
              type="text"
              value={idStudent}
              onChange={(e) => setIdStudent(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-neutral-400">Usuario (@) — con esto entrarás</label>
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
              minLength={6}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
            />
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
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black text-sm font-medium rounded-full py-2"
          >
            {loading ? 'Creando...' : 'Registrarme'}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-4">
  ¿Ya tienes cuenta? <a href="/login" className="text-white underline">Inicia sesión</a>
</p>
      </div>
    </div>
  )
}