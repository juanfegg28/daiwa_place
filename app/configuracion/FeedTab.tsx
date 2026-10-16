'use client'

import AvatarPhoto from '../components/AvatarPhoto'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { EyeOffIcon } from '../components/icons'
import type { ConfigProfile } from './types'

type FeedPref = ConfigProfile['feed_pref']

const FEED_OPTIONS: { id: FeedPref; label: string; description: string }[] = [
  { id: 'all', label: 'Todos', description: 'Ves las publicaciones de todas las cuentas públicas (lo de siempre).' },
  { id: 'following', label: 'Siguiendo', description: 'Solo las publicaciones y compartidos de las personas que sigues, y los tuyos.' },
  { id: 'mutuals', label: 'Amigos', description: 'Solo de las personas que sigues y que también te siguen (mutuals), y lo tuyo.' },
]

type MutedProfile = { id: string; username: string; id_student: string | null; avatar_url: string | null }

/** Configuración → Feed: qué ves en el Inicio y a quién tienes oculto */
export default function FeedTab({ profile, onUpdate }: { profile: ConfigProfile; onUpdate: (p: ConfigProfile) => void }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [muted, setMuted] = useState<MutedProfile[]>([])
  const [loadingMuted, setLoadingMuted] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  const choose = async (pref: FeedPref) => {
    if (pref === profile.feed_pref) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('profiles').update({ feed_pref: pref }).eq('id', profile.id)
    setSaving(false)
    if (error) {
      setMessage(/feed_pref|column|schema cache/i.test(error.message) ? 'Falta correr el SQL de la v1.1.10 en Supabase.' : error.message)
      return
    }
    onUpdate({ ...profile, feed_pref: pref })
    setMessage('Guardado ✓ El Inicio ya usa esta preferencia.')
  }

  const loadMuted = async () => {
    const { data } = await supabase
      .from('muted_users')
      .select('profiles!muted_users_muted_user_id_fkey(id, username, id_student, avatar_url)')
      .eq('user_id', profile.id)
    const rows = ((data as unknown as { profiles: MutedProfile | null }[]) ?? [])
      .map((r) => r.profiles)
      .filter((p): p is MutedProfile => !!p)
    setMuted(rows)
    setLoadingMuted(false)
  }

  useEffect(() => {
    function run() {
      loadMuted()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unhide = async (id: string) => {
    setWorking(id)
    await supabase.from('muted_users').delete().eq('user_id', profile.id).eq('muted_user_id', id)
    setWorking(null)
    loadMuted()
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Qué ves en tu Inicio</h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Elige de quién quieres ver publicaciones en el feed principal. Esto no cambia lo que ves en los perfiles ni en Clubes y Pandillas.
        </p>
        <div className="space-y-2" role="radiogroup" aria-label="Preferencia del feed">
          {FEED_OPTIONS.map((opt) => {
            const active = profile.feed_pref === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={saving}
                onClick={() => choose(opt.id)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition disabled:opacity-60 ${
                  active ? 'border-garnet-500 bg-garnet-600/15' : 'border-ink-600 hover:bg-ink-800'
                }`}
              >
                <span className={`block text-sm font-semibold ${active ? 'text-garnet-300' : 'text-neutral-100'}`}>{opt.label}</span>
                <span className="block text-xs text-neutral-500 mt-0.5">{opt.description}</span>
              </button>
            )
          })}
        </div>
        {message && <p className={`text-xs mt-3 ${message.includes('✓') ? 'text-emerald-400' : 'text-garnet-400'}`}>{message}</p>}
      </section>

      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Usuarios ocultos</h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Sus publicaciones no aparecen en tu Inicio ni en Clubes y Pandillas, pero sí las ves si entras a su perfil. No se enteran de que los ocultaste.
        </p>
        {loadingMuted ? (
          <p className="text-neutral-500 text-sm">Cargando...</p>
        ) : muted.length === 0 ? (
          <p className="text-neutral-600 text-sm flex items-center gap-2">
            <EyeOffIcon className="w-4 h-4" />
            No tienes a nadie oculto. Puedes ocultar a alguien desde el menú ⋯ de una de sus publicaciones.
          </p>
        ) : (
          <ul className="space-y-2">
            {muted.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-ink-700/60 p-2.5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-ink-700 shrink-0 flex items-center justify-center">
                  {p.avatar_url ? (
                    <AvatarPhoto src={p.avatar_url} username={p.username} sizes="48px" />
                  ) : (
                    <span className="text-sm font-semibold text-garnet-400">{p.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <Link href={`/perfil/${p.username}`} className="min-w-0 flex-1 leading-tight">
                  <p className="text-sm font-semibold text-neutral-50 truncate">{p.id_student || p.username}</p>
                  <p className="text-xs text-neutral-500 truncate">@{p.username}</p>
                </Link>
                <button
                  type="button"
                  disabled={working === p.id}
                  onClick={() => unhide(p.id)}
                  className="text-xs border border-ink-500 text-neutral-200 hover:bg-ink-600 rounded-full px-3 py-1.5 transition disabled:opacity-60"
                >
                  Volver a mostrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
