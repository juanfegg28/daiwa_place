'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import UserAvatar from '../components/UserAvatar'
import { CloseIcon, SearchIcon } from '../components/icons'
import { startConversation } from '../lib/dm'

type Person = { id: string; username: string; id_student: string | null; avatar_url: string | null }

/** Ventana "Nuevo mensaje": tus amigos arriba y un buscador para hablarle a cualquiera. */
export default function NewChatModal({
  open,
  me,
  friendIds,
  onlineIds,
  onClose,
}: {
  open: boolean
  me: string
  friendIds: Set<string>
  onlineIds: Set<string>
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [friends, setFriends] = useState<Person[]>([])
  const [results, setResults] = useState<Person[]>([])
  const [searching, setSearching] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    function reset() {
      setQuery('')
      setResults([])
      setError('')
    }
    reset()
    const ids = [...friendIds]
    if (ids.length === 0) {
      function clear() {
        setFriends([])
      }
      clear()
      return
    }
    let cancelled = false
    async function run() {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, id_student, avatar_url')
        .in('id', ids.slice(0, 80))
        .order('id_student', { ascending: true })
      if (!cancelled) setFriends((data as Person[]) ?? [])
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, friendIds])

  useEffect(() => {
    if (!open) return
    const q = query.trim().replace(/[%,()]/g, '')
    if (q.length < 2) {
      function clear() {
        setResults([])
        setSearching(false)
      }
      clear()
      return
    }
    function start() {
      setSearching(true)
    }
    start()
    const timer = window.setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, id_student, avatar_url')
        .eq('ghost_mode', false)
        .neq('id', me)
        .or(`id_student.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(15)
      setResults((data as Person[]) ?? [])
      setSearching(false)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, open, me])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const pick = async (p: Person) => {
    if (opening) return
    setOpening(p.id)
    setError('')
    const { id, error: err } = await startConversation(p.id)
    setOpening(null)
    if (err || !id) {
      setError(err ?? 'No se pudo abrir el chat.')
      return
    }
    onClose()
    router.push(`/mensajes/${id}`)
  }

  const showingSearch = query.trim().length >= 2
  const list = showingSearch ? results : friends

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center md:px-4" onClick={onClose}>
      <div
        className="surface-raised border border-ink-600 rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[85dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-base font-semibold text-neutral-50">Nuevo mensaje</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-100 hover:bg-ink-600 transition">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o @usuario"
              className="w-full bg-ink-900 border border-ink-700 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-garnet-600"
            />
          </div>
          {error && <p className="text-xs text-garnet-400 mt-2">{error}</p>}
        </div>

        <div className="px-2 pb-4 overflow-y-auto">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wide text-neutral-500">
            {showingSearch ? (searching ? 'Buscando…' : 'Resultados') : 'Tus amigos'}
          </p>
          {list.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-neutral-500">
              {showingSearch
                ? searching
                  ? ''
                  : 'No encontramos a nadie con ese nombre.'
                : 'Todavía no tienes amigos. Los amigos son las personas que se siguen mutuamente contigo. Mientras tanto, puedes buscar a cualquiera arriba.'}
            </p>
          ) : (
            <ul>
              {list.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pick(p)}
                    disabled={opening !== null}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-ink-700 transition text-left disabled:opacity-60"
                  >
                    <UserAvatar
                      username={p.username}
                      avatarUrl={p.avatar_url}
                      size="w-10 h-10"
                      online={friendIds.has(p.id) && onlineIds.has(p.id)}
                    />
                    <span className="min-w-0 leading-tight">
                      <span className="block text-sm font-semibold text-neutral-100 truncate">{p.id_student || p.username}</span>
                      <span className="block text-xs text-neutral-500 truncate">@{p.username}</span>
                    </span>
                    {opening === p.id && <span className="ml-auto text-xs text-neutral-500">Abriendo…</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
