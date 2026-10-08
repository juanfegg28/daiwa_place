'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EyeIcon, GhostIcon, UsersIcon } from '../components/icons'
import { useAppSession } from '../components/AppShell'
import type { ConfigProfile } from './types'

export default function PrivacidadTab({
  profile,
  onUpdate,
}: {
  profile: ConfigProfile
  onUpdate: (p: ConfigProfile) => void
}) {
  const [saving, setSaving] = useState(false)
  const { refresh } = useAppSession()

  const toggleOnline = async () => {
    setSaving(true)
    const next = !profile.show_online_status
    const { error } = await supabase.from('profiles').update({ show_online_status: next }).eq('id', profile.id)
    setSaving(false)
    if (!error) {
      onUpdate({ ...profile, show_online_status: next })
      refresh() // el puntico verde se apaga/enciende al instante
    }
  }

  const toggleReceipts = async () => {
    setSaving(true)
    const next = !profile.show_read_receipts
    const { error } = await supabase.from('profiles').update({ show_read_receipts: next }).eq('id', profile.id)
    setSaving(false)
    if (!error) {
      onUpdate({ ...profile, show_read_receipts: next })
      refresh()
    }
  }

  const setVisibility = async (v: 'public' | 'followers') => {
    if (v === profile.posts_visibility) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ posts_visibility: v }).eq('id', profile.id)
    setSaving(false)
    if (!error) onUpdate({ ...profile, posts_visibility: v })
  }

  const toggleGhost = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ ghost_mode: !profile.ghost_mode })
      .eq('id', profile.id)
    setSaving(false)
    if (!error) onUpdate({ ...profile, ghost_mode: !profile.ghost_mode })
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Visibilidad de tus publicaciones</h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Decide quién puede ver lo que publicas. Aplica para todas tus publicaciones, nuevas y viejas.
        </p>
        <div className="space-y-2 max-w-md">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            disabled={saving}
            className={`w-full text-left rounded-xl border px-4 py-3 transition disabled:opacity-60 ${
              profile.posts_visibility === 'public'
                ? 'border-garnet-600 bg-garnet-600/10'
                : 'border-ink-700 hover:bg-ink-800'
            }`}
          >
            <p className="text-sm font-medium text-neutral-100">Públicos</p>
            <p className="text-xs text-neutral-500">Todo el servidor puede ver tus publicaciones, te siga o no.</p>
          </button>
          <button
            type="button"
            onClick={() => setVisibility('followers')}
            disabled={saving}
            className={`w-full text-left rounded-xl border px-4 py-3 transition disabled:opacity-60 ${
              profile.posts_visibility === 'followers'
                ? 'border-garnet-600 bg-garnet-600/10'
                : 'border-ink-700 hover:bg-ink-800'
            }`}
          >
            <p className="text-sm font-medium text-neutral-100">Solo seguidores</p>
            <p className="text-xs text-neutral-500">
              Ideal para tramas privadas: solo las personas que te siguen ven tus publicaciones.
            </p>
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
              <UsersIcon className="w-4 h-4 text-garnet-400" />
              Estado «conectado»
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
              Muestra un puntico verde a tus amigos (las personas que se siguen mutuamente contigo) cuando estás
              en DaiwaPlace. Si lo apagas, nadie te ve conectado, pero tampoco ves tú el puntico verde de los demás.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleOnline}
            disabled={saving}
            role="switch"
            aria-checked={profile.show_online_status}
            className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${
              profile.show_online_status ? 'bg-garnet-600' : 'bg-ink-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                profile.show_online_status ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
              <EyeIcon className="w-4 h-4 text-garnet-400" />
              Confirmación de lectura («Visto»)
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
              Muestra «Visto» en tus mensajes cuando los lees. Si lo apagas, nadie ve cuándo leíste, pero tampoco ves tú
              cuándo leen los demás tus mensajes.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleReceipts}
            disabled={saving}
            role="switch"
            aria-checked={profile.show_read_receipts}
            aria-label="Mostrar o esconder el Visto"
            className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${
              profile.show_read_receipts ? 'bg-garnet-600' : 'bg-ink-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                profile.show_read_receipts ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
              <GhostIcon className="w-4 h-4 text-garnet-400" />
              Modo Fantasma
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
              Tu perfil sigue existiendo normal, pero no va a aparecer en el Top 5 de populares, en Nuevos
              Ingresos ni en los resultados de búsqueda de Explorar. Ideal para personajes espías o
              misteriosos que no quieren ser encontrados fácilmente.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleGhost}
            disabled={saving}
            role="switch"
            aria-checked={profile.ghost_mode}
            className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${
              profile.ghost_mode ? 'bg-garnet-600' : 'bg-ink-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                profile.ghost_mode ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  )
}
