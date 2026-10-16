'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AppShell, { useAppSession } from '../components/AppShell'
import ClubCard from '../components/ClubCard'
import ClubFeed from './ClubFeed'
import ClubRequestModal from './ClubRequestModal'
import { ClubsIcon, PlusIcon, SearchIcon, CloseIcon } from '../components/icons'
import { CLUB_SUMMARY_SELECT, friendlyClubError, shuffled, type ClubRequestRow, type ClubSummary } from '../lib/clubs'

export default function ClubesPage() {
  return (
    <AppShell>
      <ClubesContent />
    </AppShell>
  )
}

function ClubesContent() {
  const { userId, loading: sessionLoading } = useAppSession()
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [clubsLoading, setClubsLoading] = useState(true)
  const [clubsError, setClubsError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClubSummary[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [myRequest, setMyRequest] = useState<ClubRequestRow | null>(null)
  const [notice, setNotice] = useState('')
  const searchSeq = useRef(0)

  // Descubrimiento: todos los clubes, mezclados DISTINTO en cada recarga para que todos tengan visibilidad
  useEffect(() => {
    async function run() {
      const { data, error } = await supabase.from('clubs').select(CLUB_SUMMARY_SELECT).limit(120)
      if (error) setClubsError(friendlyClubError(error.message))
      setClubs(shuffled((data as ClubSummary[] | null) ?? []))
      setClubsLoading(false)
    }
    run()
  }, [])

  const loadMyRequest = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('club_requests')
      .select('id, requester_id, club_name, kind, details, status, decline_reason, created_at, club_id')
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    setMyRequest(((data as ClubRequestRow[] | null) ?? [])[0] ?? null)
  }

  useEffect(() => {
    function run() {
      loadMyRequest()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Buscador: solo por nombre de club o pandilla
  useEffect(() => {
    const q = query.trim()
    if (q.length === 0) {
      function reset() {
        setResults(null)
        setSearching(false)
      }
      reset()
      return
    }
    const seq = ++searchSeq.current
    const timer = window.setTimeout(async () => {
      setSearching(true)
      const safe = q.replace(/[\\%_]/g, (c) => `\\${c}`)
      const { data } = await supabase.from('clubs').select(CLUB_SUMMARY_SELECT).ilike('name', `%${safe}%`).order('name').limit(20)
      if (seq !== searchSeq.current) return
      setResults((data as ClubSummary[] | null) ?? [])
      setSearching(false)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  const openRequest = myRequest && (myRequest.status === 'pending' || myRequest.status === 'approved') ? myRequest : null
  const declined = myRequest?.status === 'declined' ? myRequest : null

  const cancelRequest = async () => {
    if (!openRequest) return
    await supabase.rpc('club_request_cancel', { p_request: openRequest.id })
    loadMyRequest()
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="lg:flex lg:gap-6 lg:items-start">
        <div className="flex-1 min-w-0 max-w-xl mx-auto lg:mx-0">
          {/* Título + buscador (arriba de todo) */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 rounded-xl bg-garnet-600/20 text-garnet-300 flex items-center justify-center">
              <ClubsIcon filled className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-display font-semibold text-neutral-50 leading-tight">Clubes y Pandillas</h1>
              <p className="text-xs text-neutral-500">Lo que publican los miembros de los grupos del rol.</p>
            </div>
          </div>

          <div className="relative mb-4">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 40))}
              placeholder="Buscar un club o pandilla por nombre..."
              aria-label="Buscar clubes o pandillas"
              className="w-full bg-ink-800 border border-ink-700 rounded-full pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-garnet-600"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-100 hover:bg-ink-700 transition">
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {results !== null ? (
            <section className="mb-6">
              <p className="text-xs text-neutral-500 mb-2">{searching ? 'Buscando...' : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`}</p>
              {results.length === 0 && !searching ? (
                <p className="text-sm text-neutral-500 surface-card rounded-2xl p-6 text-center">No encontramos ningún club o pandilla con ese nombre.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {results.map((c) => (
                    <ClubCard key={c.id} club={c} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              {/* Solicitar crear un club / estado de mi solicitud */}
              {userId && !sessionLoading && (
                <div className="mb-5">
                  {openRequest ? (
                    <div className="surface-card rounded-2xl p-4 border border-garnet-700/40">
                      {openRequest.status === 'pending' ? (
                        <>
                          <p className="text-sm font-semibold text-neutral-50">Tu solicitud está en revisión</p>
                          <p className="text-xs text-neutral-400 mt-0.5">«{openRequest.club_name}» · te avisaremos por notificación cuando el equipo responda.</p>
                          <button type="button" onClick={cancelRequest} className="mt-2 text-xs text-neutral-500 hover:text-garnet-400 underline transition">
                            Cancelar solicitud
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-neutral-50">¡Tu solicitud fue aprobada! 🎉</p>
                          <p className="text-xs text-neutral-400 mt-0.5">Ya puedes crear la página de «{openRequest.club_name}». El enlace es solo para ti y se usa una vez.</p>
                          <Link href={`/clubes/configurar/${openRequest.id}`} className="inline-block mt-3 bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-5 py-2 transition">
                            Configurar mi club
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {declined && (
                        <p className="text-xs text-neutral-400 surface-card rounded-2xl p-3 mb-3">
                          Tu última solicitud («{declined.club_name}») fue declinada
                          {declined.decline_reason ? `: ${declined.decline_reason}` : '.'} Puedes enviar una nueva.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowRequest(true)}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-garnet-500/50 text-garnet-300 hover:bg-garnet-600/10 rounded-2xl py-3 text-sm font-medium transition"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Solicitar crear Club/Pandilla
                      </button>
                    </>
                  )}
                  {notice && <p className="text-xs text-emerald-400 mt-2">{notice}</p>}
                </div>
              )}

              {/* En celular, el descubrimiento va como una tira que se desliza */}
              <section className="lg:hidden mb-5">
                <h2 className="text-sm font-semibold text-neutral-200 mb-2">Descubre clubes y pandillas</h2>
                {clubsLoading ? (
                  <p className="text-xs text-neutral-500">Cargando...</p>
                ) : clubs.length === 0 ? (
                  <p className="text-xs text-neutral-500">{clubsError || 'Todavía no hay clubes. ¡Sé el primero en pedir el tuyo!'}</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                    {clubs.map((c) => (
                      <div key={c.id} className="snap-start">
                        <ClubCard club={c} variant="tile" />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <ClubFeed />
            </>
          )}
        </div>

        {/* Barra lateral derecha (PC): clubes existentes, mezclados en cada recarga */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
          <h2 className="text-sm font-semibold text-neutral-200 mb-3">Descubre clubes y pandillas</h2>
          {clubsLoading ? (
            <p className="text-xs text-neutral-500">Cargando...</p>
          ) : clubs.length === 0 ? (
            <p className="text-xs text-neutral-500">{clubsError || 'Todavía no hay clubes. ¡Sé el primero en pedir el tuyo!'}</p>
          ) : (
            <div className="space-y-3">
              {clubs.map((c) => (
                <ClubCard key={c.id} club={c} />
              ))}
            </div>
          )}
        </aside>
      </div>

      {showRequest && (
        <ClubRequestModal
          onClose={() => setShowRequest(false)}
          onDone={() => {
            setShowRequest(false)
            setNotice('Solicitud enviada. El equipo la revisará pronto.')
            loadMyRequest()
          }}
        />
      )}
    </div>
  )
}
