'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import PasswordInput from '../components/PasswordInput'
import ConfirmDialog from '../components/ConfirmDialog'
import { SnowflakeIcon } from '../components/icons'

export default function CuentaTab({
  userId,
  username,
  isFrozen,
  onFrozenChange,
}: {
  userId: string
  username: string
  isFrozen: boolean
  onFrozenChange: (frozen: boolean) => void
}) {
  const router = useRouter()

  const [secForPassword, setSecForPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const [passwordForSec, setPasswordForSec] = useState('')
  const [newSecurityWord, setNewSecurityWord] = useState('')
  const [savingSecWord, setSavingSecWord] = useState(false)
  const [secWordMsg, setSecWordMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const [freezing, setFreezing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState('')

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordMsg(null)
    const res = await fetch('/api/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, securityWord: secForPassword, newPassword }),
    })
    const result = await res.json()
    setSavingPassword(false)
    if (!res.ok) {
      setPasswordMsg({ type: 'error', text: result.error || 'No se pudo cambiar la contraseña' })
      return
    }
    setSecForPassword('')
    setNewPassword('')
    setPasswordMsg({ type: 'ok', text: 'Tu contraseña se cambió correctamente.' })
  }

  const changeSecurityWord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSecWord(true)
    setSecWordMsg(null)
    const res = await fetch('/api/change-security-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordForSec, newSecurityWord }),
    })
    const result = await res.json()
    setSavingSecWord(false)
    if (!res.ok) {
      setSecWordMsg({ type: 'error', text: result.error || 'No se pudo cambiar la palabra secreta' })
      return
    }
    setPasswordForSec('')
    setNewSecurityWord('')
    setSecWordMsg({ type: 'ok', text: 'Tu palabra secreta se cambió correctamente.' })
  }

  const toggleFrozen = async () => {
    setFreezing(true)
    const { error } = await supabase.from('profiles').update({ is_frozen: !isFrozen }).eq('id', userId)
    setFreezing(false)
    if (!error) onFrozenChange(!isFrozen)
  }

  const deleteAccount = async () => {
    setDeleting(true)
    setDeleteMsg('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
    })
    const result = await res.json()
    if (!res.ok) {
      setDeleteMsg(result.error || 'No se pudo eliminar la cuenta')
      setDeleting(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Cambiar contraseña</h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Por seguridad, para poner una contraseña nueva primero tienes que escribir tu palabra secreta
          actual — la misma que usarías para recuperar la cuenta.
        </p>
        <form onSubmit={changePassword} className="space-y-3 max-w-sm">
          <div>
            <label className="block mb-1 text-xs text-neutral-400">Palabra secreta actual</label>
            <input
              type="text"
              value={secForPassword}
              onChange={(e) => setSecForPassword(e.target.value)}
              required
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs text-neutral-400">Contraseña nueva</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.type === 'ok' ? 'text-emerald-500' : 'text-garnet-400'}`}>
              {passwordMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
          >
            {savingPassword ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Cambiar palabra secreta</h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Es la palabra que usas para recuperar tu cuenta si algún día olvidas la contraseña. Para cambiarla,
          primero escribe tu contraseña actual.
        </p>
        <form onSubmit={changeSecurityWord} className="space-y-3 max-w-sm">
          <div>
            <label className="block mb-1 text-xs text-neutral-400">Contraseña actual</label>
            <PasswordInput
              value={passwordForSec}
              onChange={(e) => setPasswordForSec(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs text-neutral-400">Palabra secreta nueva</label>
            <input
              type="text"
              value={newSecurityWord}
              onChange={(e) => setNewSecurityWord(e.target.value)}
              required
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            />
          </div>
          {secWordMsg && (
            <p className={`text-sm ${secWordMsg.type === 'ok' ? 'text-emerald-500' : 'text-garnet-400'}`}>
              {secWordMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={savingSecWord}
            className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
          >
            {savingSecWord ? 'Guardando...' : 'Cambiar palabra secreta'}
          </button>
        </form>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
              <SnowflakeIcon className="w-4 h-4 text-garnet-400" />
              Congelar cuenta
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
              Úsalo si vas a hacer una pausa larga en el rol. Tu perfil se queda visible tal cual está, pero
              nadie va a poder darle like ni comentar tus publicaciones mientras esté congelada. Tú sí puedes
              seguir usando la página con normalidad, y puedes descongelarla cuando quieras.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFrozen}
            disabled={freezing}
            role="switch"
            aria-checked={isFrozen}
            className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${
              isFrozen ? 'bg-garnet-600' : 'bg-ink-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                isFrozen ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5 border border-garnet-700/40">
        <h2 className="text-base font-semibold text-garnet-400 mb-1">Eliminar cuenta</h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Esto borra tu cuenta para siempre: tu perfil, publicaciones, comentarios y likes desaparecen. No hay
          forma de recuperarlo después — úsalo solo si de verdad quieres terminar tu personaje o salir del rol.
        </p>
        {deleteMsg && <p className="text-sm text-garnet-400 mb-3">{deleteMsg}</p>}
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="text-sm border border-garnet-600 text-garnet-400 hover:bg-garnet-600 hover:text-white rounded-full px-5 py-2 transition"
        >
          Eliminar mi cuenta
        </button>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar tu cuenta para siempre?"
        message="Se borra tu perfil, publicaciones, comentarios y likes. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        busy={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
