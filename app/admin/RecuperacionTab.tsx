'use client'

// v1.10.0 · Centro de Mando → Recuperación de cuentas.
// Para quien olvidó AMBAS cosas (contraseña y palabra secreta): el staff autorizado busca la cuenta, verifica a la persona por un canal
// privado y genera un enlace temporal (4 h, un solo uso) que se le entrega en privado. Todo lo importante se comprueba en el servidor
// (/api/admin/account-recovery): permisos, límites, auditoría. Esta pestaña solo es la interfaz.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import UserAvatar from '../components/UserAvatar'
import { CheckIcon, CopyIcon, KeyIcon, SearchIcon } from '../components/icons'

type Found = { id: string; username: string; id_student: string | null; avatar_url: string | null; is_frozen: boolean; created_at: string | null; has_secret_word: boolean }
type Active = { id: string; created_at: string; expires_at: string } | null
type HistoryRow = { id: number; created_at: string; action: string; actor_name: string | null; detail: { note?: string } | null }
type Info = { active: Active; history: HistoryRow[]; protected: boolean; canRecover: boolean }
type Created = { url: string; expires_at: string; username: string }

async function call<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const { data: s } = await supabase.auth.getSession()
  const token = s.session?.access_token
  if (!token) return { ok: false, error: 'Inicia sesión de nuevo.' }
  try {
    const res = await fetch('/api/admin/account-recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal,
    })
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) return { ok: false, error: json.error || 'Algo salió mal. Inténtalo de nuevo.' }
    return { ok: true, data: json as T }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return { ok: false, error: '' }
    return { ok: false, error: 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.' }
  }
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : '—')

const ACTION_LABEL: Record<string, string> = {
  link_created: 'Enlace generado',
  link_revoked: 'Enlace revocado',
  link_opened: 'El enlace fue abierto',
  link_used: 'Enlace usado: la persona cambió su acceso',
  link_failed: 'Intento fallido',
}

export default function RecuperacionTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Found[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selected, setSelected] = useState<Found | null>(null)
  const [info, setInfo] = useState<Info | null>(null)
  const [infoError, setInfoError] = useState('')
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [created, setCreated] = useState<Created | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeAsk, setRevokeAsk] = useState(false)
  const reqId = useRef(0)

  // Búsqueda con un pequeño retraso al escribir (300 ms) y sin respuestas desactualizadas: solo cuenta la última petición
  const active = query.trim().length >= 2
  useEffect(() => {
    if (!active) {
      reqId.current++ // cualquier respuesta que venga en camino se descarta
      return
    }
    const q = query.trim()
    const mine = ++reqId.current
    const ctrl = new AbortController()
    const flag = setTimeout(() => setSearching(true), 0)
    const t = setTimeout(async () => {
      const r = await call<{ results: Found[] }>({ action: 'search', q }, ctrl.signal)
      if (mine !== reqId.current) return
      setSearching(false)
      if (!r.ok) {
        if (r.error) setSearchError(r.error)
        return
      }
      setSearchError('')
      setResults(r.data.results)
    }, 300)
    return () => {
      clearTimeout(flag)
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query, active])
  const shownResults = active ? results : []

  const loadInfo = async (userId: string) => {
    setInfo(null)
    setInfoError('')
    const r = await call<Info>({ action: 'info', userId })
    if (!r.ok) setInfoError(r.error)
    else setInfo(r.data)
  }

  const pick = (f: Found) => {
    setSelected(f)
    setCreated(null)
    setNote('')
    setConfirmed(false)
    setFormError('')
    setRevokeAsk(false)
    void loadInfo(f.id)
  }

  const generate = async () => {
    if (!selected) return
    setFormError('')
    setCreating(true)
    const r = await call<Created>({ action: 'create', userId: selected.id, note, confirmed })
    setCreating(false)
    if (!r.ok) {
      setFormError(r.error)
      return
    }
    setCreated(r.data)
    setNote('')
    setConfirmed(false)
    void loadInfo(selected.id)
  }

  const revoke = async (linkId: string) => {
    const r = await call<{ revoked: boolean }>({ action: 'revoke', linkId })
    setRevokeAsk(false)
    if (!r.ok) setFormError(r.error)
    else if (selected) {
      setCreated(null)
      void loadInfo(selected.id)
    }
  }

  const copy = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* el campo de texto se puede seleccionar a mano */
    }
  }

  const display = (f: Found) => f.id_student?.trim() || f.username

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-neutral-50 flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-garnet-400" /> Recuperación de cuentas
        </h2>
        <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
          Para quien olvidó <b className="text-neutral-200">tanto la contraseña como la palabra secreta</b>. Verifica a la persona por un canal privado (Discord, Roblox…) y genera un
          enlace temporal: sirve <b className="text-neutral-200">una sola vez</b>, vence a las <b className="text-neutral-200">4 horas</b> y solo le deja poner una contraseña y una palabra
          secreta nuevas. No se ve ninguna contraseña ni palabra anterior y no se toca nada más de la cuenta. Todo queda en un registro de auditoría.
        </p>
      </div>

      {/* Buscador */}
      <div>
        <label htmlFor="rec-buscar" className="block text-sm text-neutral-400 mb-1">Buscar por nombre de usuario o nombre de estudiante</label>
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="rec-buscar"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe al menos 2 letras…"
            autoComplete="off"
            className="w-full bg-ink-900 border border-ink-700 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-garnet-600"
          />
        </div>
        <div aria-live="polite" className="mt-2 min-h-5 text-xs text-neutral-500">
          {!active ? '' : searching ? 'Buscando…' : searchError ? <span className="text-garnet-400">{searchError}</span> : results.length === 0 ? 'No se encontró ninguna cuenta.' : ''}
        </div>
        {shownResults.length > 0 && (
          <ul className="mt-1 space-y-1.5">
            {shownResults.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => pick(f)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${selected?.id === f.id ? 'border-garnet-500 bg-garnet-600/10' : 'border-ink-700 bg-ink-900/50 hover:bg-ink-800'}`}
                >
                  <UserAvatar username={f.username} avatarUrl={f.avatar_url} size="w-10 h-10" textSize="text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-neutral-100 truncate">{display(f)}</span>
                    <span className="block text-xs text-neutral-500 truncate">@{f.username} · ID {f.id.slice(0, 8)}</span>
                  </span>
                  {f.is_frozen && <span className="text-[10px] font-semibold uppercase text-sky-300">Congelada</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cuenta elegida */}
      {selected && (
        <section aria-label={`Recuperar la cuenta de ${selected.username}`} className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <UserAvatar username={selected.username} avatarUrl={selected.avatar_url} size="w-14 h-14" textSize="text-lg" />
            <div className="min-w-0">
              <p className="font-medium text-neutral-50 truncate">{display(selected)}</p>
              <p className="text-sm text-neutral-400 truncate">@{selected.username}</p>
              <p className="text-[11px] text-neutral-500 font-mono break-all select-all">ID {selected.id}</p>
            </div>
          </div>

          <p className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${selected.has_secret_word ? 'bg-ink-800 text-neutral-300' : 'bg-amber-500/10 text-amber-200'}`}>
            {selected.has_secret_word
              ? 'Esta cuenta tiene una palabra secreta registrada. Si la persona todavía la recuerda, puede recuperar el acceso sola desde «Recuperar cuenta» en el inicio de sesión.'
              : 'Esta cuenta NO tiene ningún método de recuperación verificable (sin palabra secreta registrada). El sistema no entrega acceso por sí solo: genera el enlace únicamente después de verificar a la persona por otro medio.'}
          </p>

          {infoError && <p className="text-sm text-garnet-400">{infoError}</p>}
          {!info && !infoError && <p className="text-sm text-neutral-500">Cargando…</p>}

          {info && !info.canRecover && (
            <p className="text-sm rounded-lg bg-garnet-600/15 text-garnet-300 px-3 py-2">
              Esta cuenta es del staff: solo el Admin Supremo puede recuperarla.
            </p>
          )}

          {info?.active && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm text-amber-100 flex flex-wrap items-center gap-2">
              <span className="flex-1 min-w-48">Hay un enlace activo (creado {fmt(info.active.created_at)}, vence {fmt(info.active.expires_at)}). Por seguridad no se puede volver a ver.</span>
              {!revokeAsk ? (
                <button type="button" onClick={() => setRevokeAsk(true)} className="text-xs rounded-full border border-amber-300/50 px-3 py-1 hover:bg-amber-300/10">Revocar</button>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="text-xs">¿Seguro?</span>
                  <button type="button" onClick={() => revoke(info.active!.id)} className="text-xs rounded-full bg-garnet-600 text-white px-3 py-1 hover:bg-garnet-500">Sí, revocar</button>
                  <button type="button" onClick={() => setRevokeAsk(false)} className="text-xs rounded-full border border-ink-600 px-3 py-1">No</button>
                </span>
              )}
            </div>
          )}

          {created ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 space-y-2">
              <p className="text-sm text-emerald-200 font-medium">Enlace generado para @{created.username}</p>
              <div className="flex gap-2">
                <input readOnly value={created.url} onFocus={(e) => e.currentTarget.select()} aria-label="Enlace de recuperación" className="flex-1 min-w-0 bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-xs font-mono text-neutral-200" />
                <button type="button" onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-garnet-600 hover:bg-garnet-500 text-white text-xs px-3 py-2">
                  {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Vence el <b>{fmt(created.expires_at)}</b> y sirve una sola vez. <b>No se vuelve a mostrar.</b> Entrégaselo solo a la persona, por un mensaje privado.
                Cuando lo abra, podrá poner su contraseña y su palabra secreta nuevas.
              </p>
              <button type="button" onClick={() => setCreated(null)} className="text-xs text-neutral-400 hover:text-neutral-200 underline">Ya lo entregué, ocultar</button>
            </div>
          ) : (
            info?.canRecover && (
              <div className="space-y-3">
                <ol className="text-xs text-neutral-400 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Verifica por un canal privado que quien lo pide es la dueña de la cuenta.</li>
                  <li>Escribe abajo cómo la verificaste (queda en el registro).</li>
                  <li>Genera el enlace y envíaselo por mensaje privado. Tiene 4 horas.</li>
                </ol>
                <div>
                  <label htmlFor="rec-nota" className="block text-sm text-neutral-400 mb-1">¿Cómo verificaste que es la dueña de la cuenta?</label>
                  <textarea
                    id="rec-nota"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 400))}
                    rows={3}
                    placeholder="Ej.: Me escribió por Discord desde su cuenta de siempre y me confirmó su nombre en Roblox y su club."
                    className="w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
                  />
                  <p className="text-[11px] text-neutral-500 text-right">{note.trim().length}/400 · mínimo 10</p>
                </div>
                <label className="flex items-start gap-2 text-sm text-neutral-200 cursor-pointer">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 accent-garnet-500" />
                  <span>Confirmo que verifiqué su identidad por un canal privado y que entregaré el enlace solo a esa persona.</span>
                </label>
                {formError && <p className="text-sm text-garnet-400" role="alert">{formError}</p>}
                <button
                  type="button"
                  onClick={generate}
                  disabled={creating || !confirmed || note.trim().length < 10}
                  className="rounded-full bg-garnet-600 hover:bg-garnet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 transition"
                >
                  {creating ? 'Generando…' : 'Generar enlace de recuperación'}
                </button>
              </div>
            )
          )}

          {info && info.history.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Historial de esta cuenta</h3>
              <ul className="space-y-1">
                {info.history.map((h) => (
                  <li key={h.id} className="text-xs text-neutral-400 leading-snug">
                    <span className="text-neutral-300">{ACTION_LABEL[h.action] ?? h.action}</span>
                    {h.actor_name ? <> · por @{h.actor_name}</> : null} · {fmt(h.created_at)}
                    {h.detail?.note ? <span className="block text-neutral-500">Motivo: {h.detail.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
