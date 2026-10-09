'use client'

import { CloseIcon } from './icons'
import { useMusic } from './MusicProvider'
import { normalizeTrack } from '../lib/music'

function PlayGlyph({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" className="w-[45%] h-[45%]" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4.2" height="14" rx="1.2" />
      <rect x="13.8" y="5" width="4.2" height="14" rx="1.2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-[48%] h-[48%] translate-x-[8%]" fill="currentColor" aria-hidden="true">
      <path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8Z" />
    </svg>
  )
}

/** Botón de play/pausa con un anillo que se llena mientras suena el fragmento. */
export function PlayButton({
  trackId,
  preview,
  size = 'w-11 h-11',
  disabledNoPreview = false,
}: {
  trackId: number
  preview?: string | null
  size?: string
  disabledNoPreview?: boolean
}) {
  const { currentId, status, progress, toggle, disabled } = useMusic()
  const mine = currentId === trackId
  const playing = mine && status === 'playing'
  const loading = mine && status === 'loading'
  const radius = 18
  const circ = 2 * Math.PI * radius
  const blocked = disabled || disabledNoPreview

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggle({ id: trackId, preview })
      }}
      disabled={disabledNoPreview}
      aria-label={playing ? 'Pausar canción' : 'Escuchar fragmento de la canción'}
      title={disabled ? 'La música está desactivada en Configuración' : disabledNoPreview ? 'Sin vista previa' : undefined}
      className={`relative shrink-0 ${size} rounded-full flex items-center justify-center transition ${
        blocked ? 'bg-ink-700 text-neutral-500' : 'bg-garnet-600 hover:bg-garnet-500 text-white shadow-[0_3px_10px_-4px_rgba(214,40,72,0.55)]'
      }`}
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
        {mine && (
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
          />
        )}
      </svg>
      {loading ? (
        <span className="w-[38%] h-[38%] rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        <PlayGlyph playing={playing} />
      )}
    </button>
  )
}

function Equalizer() {
  return (
    <span className="inline-flex items-end gap-[2px] h-3 text-garnet-400 shrink-0" aria-hidden="true">
      <span className="music-eq-bar" />
      <span className="music-eq-bar" />
      <span className="music-eq-bar" />
    </span>
  )
}

/**
 * Canción en formato "píldora" minimalista (como en Instagram): botón de play, título y artista en una
 * sola línea, sin carátula grande. Ocupa solo lo que necesita y recorta los nombres largos con "…".
 *  · card    → perfil (un poco más grande)
 *  · compact → publicaciones, notas y editores
 * Si se pasa onRemove, aparece una X pequeña dentro de la píldora para quitar la canción (al editar).
 */
export default function MusicChip({
  track,
  variant = 'compact',
  onRemove,
}: {
  track: unknown
  variant?: 'card' | 'compact'
  onRemove?: () => void
}) {
  const t = normalizeTrack(track)
  const { currentId, status, error } = useMusic()
  if (!t) return null

  const mine = currentId === t.id
  const playing = mine && status === 'playing'
  const failed = mine && status === 'error'
  const big = variant === 'card'

  return (
    <div className="flex flex-col items-start gap-1 max-w-full">
      <div
        className={`inline-flex items-center gap-2 max-w-full rounded-full border pl-1 ${onRemove ? 'pr-1.5' : 'pr-3'} ${
          big ? 'py-1' : 'py-0.5'
        } transition-colors ${
          playing ? 'border-garnet-600/60 bg-garnet-900/20' : 'border-ink-600 bg-ink-800/60'
        }`}
      >
        <PlayButton trackId={t.id} size={big ? 'w-8 h-8' : 'w-7 h-7'} />

        <span className={`min-w-0 truncate leading-none ${big ? 'text-[13px]' : 'text-xs'}`}>
          <span className="font-semibold text-neutral-100">{t.title}</span>
          {t.artist && <span className="text-neutral-500"> · {t.artist}</span>}
        </span>

        {playing && <Equalizer />}

        {t.link && (
          <a
            href={t.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Escuchar completa en Deezer"
            title="Escuchar completa en Deezer"
            className="shrink-0 text-[11px] leading-none text-neutral-600 hover:text-garnet-300 transition"
          >
            ↗
          </a>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar canción"
            className="shrink-0 w-5 h-5 rounded-full text-neutral-400 hover:text-white hover:bg-garnet-600 flex items-center justify-center transition"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {failed && <p className="text-[11px] text-garnet-300 pl-2 line-clamp-2">{error}</p>}
    </div>
  )
}
