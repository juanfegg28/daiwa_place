import { MusicIcon } from './icons'
import { normalizeTrack } from '../lib/music'

/**
 * Muestra una canción (carátula + título + artista). Por ahora solo se ve si la
 * base de datos ya trae una canción guardada; elegirlas desde la pantalla llega después.
 */
export default function MusicChip({ track, compact = false }: { track: unknown; compact?: boolean }) {
  const t = normalizeTrack(track)
  if (!t) return null

  const body = (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-ink-900/70 border border-ink-600 max-w-full ${
        compact ? 'pl-1 pr-2.5 py-0.5' : 'pl-1.5 pr-3 py-1'
      }`}
    >
      {t.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.cover} alt="" className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full object-cover shrink-0`} />
      ) : (
        <span className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-ink-700 flex items-center justify-center text-garnet-400 shrink-0`}>
          <MusicIcon className="w-3 h-3" />
        </span>
      )}
      <span className="min-w-0 truncate text-[11px] text-neutral-300">
        <b className="font-semibold text-neutral-100">{t.title}</b>
        {t.artist ? ` · ${t.artist}` : ''}
      </span>
    </span>
  )

  return t.link ? (
    <a href={t.link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full">
      {body}
    </a>
  ) : (
    body
  )
}
