'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CloseIcon, MusicIcon, SearchIcon } from './icons'
import { PlayButton } from './MusicChip'
import { useMusic } from './MusicProvider'
import { formatDuration, searchTracks, uniqueById, type MusicTrack } from '../lib/music'

/**
 * Buscador de canciones (catálogo de Deezer). Escribes lo que quieras, escuchas un fragmento
 * y eliges. Se abre desde abajo en el celular y centrado en el computador.
 */
export default function MusicPicker({
  open,
  onClose,
  onPick,
  title = 'Elige una canción',
}: {
  open: boolean
  onClose: () => void
  onPick: (track: MusicTrack) => void
  title?: string
}) {
  const { stop } = useMusic()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextIndex, setNextIndex] = useState(0)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const requestId = useRef(0)

  const close = useCallback(() => {
    stop()
    onClose()
  }, [onClose, stop])

  // Al abrir, todo en blanco
  useEffect(() => {
    if (!open) return
    function reset() {
      setQuery('')
      setResults([])
      setError('')
      setSearched(false)
      setHasMore(false)
    }
    reset()
  }, [open])

  // Búsqueda con pausa de 0.35 s (para no preguntarle a Deezer en cada letra)
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) {
      requestId.current += 1
      function clear() {
        setResults([])
        setLoading(false)
        setSearched(false)
        setHasMore(false)
        setError('')
      }
      clear()
      return
    }
    function start() {
      setLoading(true)
    }
    start()
    const mine = ++requestId.current
    const timer = window.setTimeout(async () => {
      const res = await searchTracks(q, 0)
      if (mine !== requestId.current) return
      setResults(uniqueById(res.tracks))
      setHasMore(res.hasMore)
      setNextIndex(res.nextIndex)
      setError(res.error ?? '')
      setSearched(true)
      setLoading(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  const loadMore = async () => {
    setLoadingMore(true)
    const res = await searchTracks(query, nextIndex)
    setLoadingMore(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setResults((prev) => uniqueById([...prev, ...res.tracks]))
    setNextIndex(res.nextIndex)
    setHasMore(res.hasMore)
  }

  const pick = (t: MusicTrack) => {
    stop()
    onPick(t)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 flex items-end md:items-center justify-center md:px-4" onClick={close}>
      <div
        className="surface-raised border border-ink-600 rounded-t-3xl md:rounded-3xl w-full md:max-w-lg h-[82dvh] md:h-[640px] md:max-h-[85dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Cabecera */}
        <div className="px-5 pt-4 pb-3 bg-gradient-to-b from-garnet-900/30 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50">
              <span className="w-8 h-8 rounded-full bg-garnet-600 text-white flex items-center justify-center">
                <MusicIcon className="w-4 h-4" />
              </span>
              {title}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-ink-600 transition"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por canción o artista"
              className="w-full bg-ink-900 border border-ink-700 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-garnet-600"
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
          {error && <p className="mx-3 my-2 text-xs text-garnet-300">{error}</p>}

          {!searched && !loading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-2">
              <div className="w-14 h-14 rounded-full bg-ink-700 flex items-center justify-center text-garnet-400">
                <MusicIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-200">Busca cualquier canción</p>
              <p className="text-xs text-neutral-500">
                Escribe el nombre de la canción o del artista. Puedes escuchar un fragmento de 30 segundos antes de elegir.
              </p>
            </div>
          )}

          {loading && results.length === 0 && (
            <ul className="space-y-1 px-1 pt-1" aria-label="Buscando">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                  <span className="w-12 h-12 rounded-xl bg-ink-700" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-2/3 rounded bg-ink-700" />
                    <span className="block h-2.5 w-1/3 rounded bg-ink-800" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {searched && !loading && results.length === 0 && !error && (
            <p className="text-center text-sm text-neutral-500 px-8 py-12">
              No encontramos canciones con ese nombre. Prueba con el nombre y el artista, por ejemplo «canción artista».
            </p>
          )}

          {results.length > 0 && (
            <ul className={loading ? 'opacity-60 transition' : 'transition'}>
              {results.map((t) => (
                <li key={t.id}>
                  <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-ink-700/70 transition">
                    {t.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={t.cover} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <span className="w-12 h-12 rounded-xl bg-ink-700 flex items-center justify-center text-garnet-400 shrink-0">
                        <MusicIcon className="w-5 h-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="text-sm font-semibold text-neutral-100 truncate">{t.title}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {t.artist}
                        {t.duration ? ` · ${formatDuration(t.duration)}` : ''}
                        {t.explicit ? ' · 🅴' : ''}
                      </p>
                      {t.hasPreview === false && <p className="text-[11px] text-amber-300/80">Sin fragmento de audio</p>}
                    </div>
                    <PlayButton trackId={t.id} preview={t.preview} size="w-9 h-9" disabledNoPreview={t.hasPreview === false} />
                    <button
                      type="button"
                      onClick={() => pick(t)}
                      className="shrink-0 text-xs font-medium rounded-full px-3.5 py-1.5 bg-ink-600 hover:bg-garnet-600 text-neutral-100 transition"
                    >
                      Elegir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMore && !loading && (
            <div className="flex justify-center py-3">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm border border-ink-600 text-neutral-300 rounded-full px-5 py-2 hover:bg-ink-800 transition disabled:opacity-60"
              >
                {loadingMore ? 'Cargando...' : 'Ver más canciones'}
              </button>
            </div>
          )}
        </div>

        <p className="px-5 py-2.5 text-[11px] text-neutral-600 border-t border-ink-700 text-center">
          Música de Deezer · se escucha un fragmento de 30 segundos
        </p>
      </div>
    </div>
  )
}
