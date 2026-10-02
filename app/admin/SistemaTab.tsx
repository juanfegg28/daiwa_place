'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'
import ConfirmDialog from '../components/ConfirmDialog'
import { SearchIcon, WrenchIcon, TrashIcon } from '../components/icons'
import type { UserSearchResult } from './types'

export default function SistemaTab() {
  const { refresh } = useAppSession()
  const [maintenance, setMaintenance] = useState(false)
  const [loadingSetting, setLoadingSetting] = useState(true)
  const [togglingMaintenance, setTogglingMaintenance] = useState(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [target, setTarget] = useState<UserSearchResult | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState('')

  const loadSetting = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'maintenance_mode').maybeSingle()
    setMaintenance(data?.value === true)
    setLoadingSetting(false)
  }

  useEffect(() => {
    function run() {
      loadSetting()
    }
    run()
  }, [])

  const toggleMaintenance = async () => {
    setTogglingMaintenance(true)
    const next = !maintenance
    const { error } = await supabase.from('app_settings').update({ value: next }).eq('key', 'maintenance_mode')
    setTogglingMaintenance(false)
    if (!error) {
      setMaintenance(next)
      refresh()
    }
  }

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

  const deleteAccount = async () => {
    if (!target) return
    setDeleting(true)
    setDeleteMsg('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ targetUserId: target.id }),
    })
    const result = await res.json()
    setDeleting(false)
    if (!res.ok) {
      setDeleteMsg(result.error || 'No se pudo eliminar la cuenta')
      return
    }
    setConfirmOpen(false)
    setTarget(null)
    setDeleteMsg(`Se eliminó la cuenta de @${target.username}.`)
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
              <WrenchIcon className="w-4 h-4 text-garnet-400" />
              Modo Mantenimiento
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
              Bloquea el acceso a todos los estudiantes normales y les muestra una pantalla de &quot;en
              mantenimiento&quot;. El staff con algún rol asignado, y tú, siguen entrando normal.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMaintenance}
            disabled={loadingSetting || togglingMaintenance}
            role="switch"
            aria-checked={maintenance}
            className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${
              maintenance ? 'bg-garnet-600' : 'bg-ink-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                maintenance ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5 border border-garnet-700/40">
        <h2 className="flex items-center gap-2 text-base font-semibold text-garnet-400 mb-1">
          <TrashIcon className="w-4 h-4" />
          Eliminación Maestra
        </h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Borra para siempre la cuenta de cualquier estudiante, directamente desde aquí, sin entrar a
          Supabase. No se puede deshacer.
        </p>

        <div className="relative mb-3 max-w-sm">
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
                  onClick={() => {
                    setTarget(u)
                    setQuery('')
                    setResults([])
                    setDeleteMsg('')
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-ink-700 transition"
                >
                  {u.id_student || u.username} <span className="text-neutral-500">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {target && (
          <div className="flex items-center justify-between gap-3 border border-ink-700 rounded-xl p-3">
            <span className="text-sm text-neutral-200">
              {target.id_student || target.username} <span className="text-neutral-500">@{target.username}</span>
            </span>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-xs border border-garnet-600 text-garnet-400 hover:bg-garnet-600 hover:text-white rounded-full px-3 py-1.5 transition shrink-0"
            >
              Eliminar cuenta
            </button>
          </div>
        )}

        {deleteMsg && <p className="text-sm text-neutral-400 mt-3">{deleteMsg}</p>}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={`¿Eliminar para siempre a @${target?.username ?? ''}?`}
        message="Se borra su perfil, publicaciones, comentarios y likes. No se puede deshacer."
        confirmLabel="Sí, eliminar"
        busy={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
