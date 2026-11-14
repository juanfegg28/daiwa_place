'use client'

// v1.10.0 · Página a la que llega quien recibe un enlace de recuperación del staff.
// El secreto viaja en el fragmento (#…) de la URL: no llega a los registros del servidor ni a otros sitios. Se lee una vez, se borra de la barra
// de direcciones y solo se manda en el cuerpo de la petición. El enlace sirve una vez y vence a las 4 horas.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthLayout from '../../components/AuthLayout'
import PasswordInput from '../../components/PasswordInput'

type Phase = 'checking' | 'ready' | 'invalid' | 'done'

export default function RecoverLinkPage() {
  const [token, setToken] = useState('')
  const [phase, setPhase] = useState<Phase>('checking')
  const [username, setUsername] = useState('')
  const [invalidMsg, setInvalidMsg] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [word, setWord] = useState('')
  const [word2, setWord2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '').replace(/^t=/, '').trim()
    // se quita de la barra de direcciones y del historial para que no quede a la vista
    window.history.replaceState(null, '', window.location.pathname)
    if (!raw) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el efecto lee la URL (sistema externo); sin token no hay nada que comprobar
      setInvalidMsg('Este enlace está incompleto. Pide uno nuevo al staff.')
      setPhase('invalid')
      return
    }
    setToken(raw)
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/recover/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check', token: raw }) })
        const json = (await res.json().catch(() => ({}))) as { username?: string; error?: string }
        if (cancelled) return
        if (!res.ok || !json.username) {
          setInvalidMsg(json.error || 'Este enlace no es válido o ya venció. Pide uno nuevo al staff.')
          setPhase('invalid')
          return
        }
        setUsername(json.username)
        setPhase('ready')
      } catch {
        if (cancelled) return
        setInvalidMsg('No se pudo comprobar el enlace. Revisa tu internet e inténtalo de nuevo.')
        setPhase('invalid')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    if (password !== password2) return setError('Las dos contraseñas no coinciden.')
    if (word.trim().length < 4) return setError('La palabra secreta debe tener al menos 4 caracteres.')
    if (word.trim().toLowerCase() !== word2.trim().toLowerCase()) return setError('Las dos palabras secretas no coinciden.')
    setLoading(true)
    try {
      const res = await fetch('/api/recover/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use', token, newPassword: password, newSecurityWord: word }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(json.error || 'No se pudo completar. Inténtalo de nuevo.')
        // si el enlace ya no sirve, no tiene caso seguir mostrando el formulario
        if (res.status === 400 && /enlace/i.test(json.error ?? '')) {
          setInvalidMsg(json.error ?? '')
          setPhase('invalid')
        }
        setLoading(false)
        return
      }
      setPhase('done')
    } catch {
      setError('No se pudo conectar. Revisa tu internet e inténtalo de nuevo.')
    }
    setLoading(false)
  }

  if (phase === 'checking') {
    return (
      <AuthLayout>
        <p className="text-center text-sm text-neutral-400" role="status">Comprobando tu enlace…</p>
      </AuthLayout>
    )
  }

  if (phase === 'invalid') {
    return (
      <AuthLayout>
        <div className="text-center">
          <h1 className="text-xl font-display font-semibold mb-3 text-neutral-50">Enlace no disponible</h1>
          <p className="text-neutral-400 mb-6 text-sm leading-relaxed">{invalidMsg}</p>
          <Link href="/login" className="inline-block bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2.5 transition">
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (phase === 'done') {
    return (
      <AuthLayout>
        <div className="text-center">
          <h1 className="text-xl font-display font-semibold mb-3 text-neutral-50">¡Listo!</h1>
          <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
            Cambiaste tu contraseña y tu palabra secreta. Ya puedes iniciar sesión con la nueva contraseña. Las demás sesiones abiertas de tu cuenta se cerraron.
          </p>
          <Link href="/login" className="inline-block bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2.5 transition">
            Iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-xl font-display font-semibold mb-2 text-center text-neutral-50">Recupera tu acceso</h1>
      <p className="text-neutral-500 text-sm text-center mb-6">
        Cuenta de <b className="text-neutral-200">@{username}</b>. Elige una contraseña y una palabra secreta nuevas.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Nueva contraseña</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
        </div>
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Repite la contraseña</label>
          <PasswordInput value={password2} onChange={(e) => setPassword2(e.target.value)} required minLength={6} autoComplete="new-password" />
        </div>
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Nueva palabra secreta</label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            required
            minLength={4}
            maxLength={100}
            autoComplete="off"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
          <p className="text-xs text-neutral-500 mt-1">Te servirá para recuperar la cuenta tú sola la próxima vez. Anótala en un lugar seguro.</p>
        </div>
        <div>
          <label className="block mb-1 text-sm text-neutral-400">Repite la palabra secreta</label>
          <input
            type="text"
            value={word2}
            onChange={(e) => setWord2(e.target.value)}
            required
            autoComplete="off"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
        </div>
        {error && <p className="text-garnet-400 text-sm" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full py-2.5 transition"
        >
          {loading ? 'Guardando…' : 'Guardar y recuperar mi acceso'}
        </button>
      </form>
      <p className="text-center text-xs text-neutral-500 mt-6 leading-relaxed">Este enlace sirve una sola vez. Si algo falla, pide uno nuevo al staff.</p>
    </AuthLayout>
  )
}
