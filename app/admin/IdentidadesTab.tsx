'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SearchIcon } from '../components/icons'
import { ESTADOS_SENTIMENTALES } from '../lib/constants'
import type { UserSearchResult } from './types'

type TargetProfile = {
  id: string
  username: string
  id_student: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  grado: string | null
  birthday: string | null
  estado_personal: string | null
}

export default function IdentidadesTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [target, setTarget] = useState<TargetProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      function clear() {
        setResults([])
      }
      clear()
      return
    }
    const timer = window.setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, id_student')
        .or(`id_student.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(8)
      setResults((data as UserSearchResult[]) ?? [])
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const pick = async (u: UserSearchResult) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, id_student, bio, avatar_url, banner_url, grado, birthday, estado_personal')
      .eq('id', u.id)
      .maybeSingle()
    if (data) setTarget(data as TargetProfile)
    setQuery('')
    setResults([])
    setMsg(null)
  }

  const save = async () => {
    if (!target) return
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        username: target.username.trim().toLowerCase(),
        id_student: target.id_student,
        bio: target.bio,
        avatar_url: target.avatar_url,
        banner_url: target.banner_url,
        grado: target.grado,
        birthday: target.birthday,
        estado_personal: target.estado_personal,
      })
      .eq('id', target.id)
    setSaving(false)
    if (error) setMsg({ type: 'error', text: error.message })
    else setMsg({ type: 'ok', text: 'Perfil actualizado correctamente.' })
  }

  return (
    <section className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold text-neutral-50 mb-1">Titiritero de Identidades</h2>
      <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
        Edita el perfil de cualquier estudiante sin necesitar su contraseña — para corregir perfiles que
        rompan el rol. Úsalo con cuidado, los cambios se guardan de inmediato.
      </p>

      <div className="relative mb-4 max-w-sm">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre o @usuario..."
          className="w-full bg-ink-900 border border-ink-700 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full surface-raised rounded-xl overflow-hidden border border-ink-600">
            {results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => pick(u)}
                className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-ink-700 transition"
              >
                {u.id_student || u.username} <span className="text-neutral-500">@{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {target && (
        <div className="space-y-3 max-w-md">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs text-neutral-400">Usuario (@)</label>
              <input
                value={target.username}
                onChange={(e) => setTarget({ ...target, username: e.target.value })}
                className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-neutral-400">Nombre de personaje</label>
              <input
                value={target.id_student ?? ''}
                onChange={(e) => setTarget({ ...target, id_student: e.target.value })}
                className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-xs text-neutral-400">Biografía</label>
            <textarea
              value={target.bio ?? ''}
              onChange={(e) => setTarget({ ...target, bio: e.target.value })}
              rows={3}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-garnet-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs text-neutral-400">Grado</label>
              <input
                value={target.grado ?? ''}
                onChange={(e) => setTarget({ ...target, grado: e.target.value })}
                className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-neutral-400">Cumpleaños</label>
              <input
                type="date"
                value={target.birthday ?? ''}
                onChange={(e) => setTarget({ ...target, birthday: e.target.value })}
                className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-xs text-neutral-400">Situación sentimental</label>
            <select
              value={target.estado_personal ?? ''}
              onChange={(e) => setTarget({ ...target, estado_personal: e.target.value || null })}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            >
              <option value="">Prefiero no decir</option>
              {ESTADOS_SENTIMENTALES.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs text-neutral-400">URL de foto de perfil</label>
              <input
                value={target.avatar_url ?? ''}
                onChange={(e) => setTarget({ ...target, avatar_url: e.target.value || null })}
                className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-neutral-400">URL de banner</label>
              <input
                value={target.banner_url ?? ''}
                onChange={(e) => setTarget({ ...target, banner_url: e.target.value || null })}
                className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
              />
            </div>
          </div>

          {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-emerald-500' : 'text-garnet-400'}`}>{msg.text}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </section>
  )
}
