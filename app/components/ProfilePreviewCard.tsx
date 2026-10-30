import type { ReactNode } from 'react'
import { GraduationCapIcon, CalendarIcon, HeartIcon, SparklesIcon } from './icons'
import IdentitySeal from './IdentitySeal'
import MusicChip from './MusicChip'
import { normalizeTrack } from '../lib/music'
import { formatIdentityDetail, identityField, isCommonIdentity, IDENTITY_VISIBILITY_OPTIONS, type IdentityVisibility } from '../lib/identities'

function formatBirthdayPreview(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

function InfoChip({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-ink-900/70 border border-ink-700 text-neutral-300 text-[11px] font-medium px-2.5 py-1 rounded-full">
      <span className="text-garnet-400">{icon}</span>
      {text}
    </span>
  )
}

type ProfilePreviewCardProps = {
  displayName: string
  username: string
  bio: string
  grado: string
  birthday: string
  estadoPersonal: string
  avatarPreview: string | null
  bannerPreview: string | null
  /** v1.5.10 · lo que se ve en el perfil real: identidad (con su campo especial), quién la ve y la canción */
  identity?: string
  identityDetail?: string
  identityVisibility?: IdentityVisibility
  music?: unknown
}

export default function ProfilePreviewCard({
  displayName,
  username,
  bio,
  grado,
  birthday,
  estadoPersonal,
  avatarPreview,
  bannerPreview,
  identity = '',
  identityDetail = '',
  identityVisibility = 'todos',
  music = null,
}: ProfilePreviewCardProps) {
  const special = !!identity && !isCommonIdentity(identity)
  const common = !!identity && isCommonIdentity(identity)
  const field = identityField(identity)
  const track = normalizeTrack(music)
  const visLabel = identityVisibility !== 'todos' ? IDENTITY_VISIBILITY_OPTIONS.find((o) => o.id === identityVisibility)?.label : null
  return (
    <div className="mb-8 rounded-2xl overflow-hidden surface-card">
      <div className="text-center text-xs text-neutral-500 py-2 border-b border-ink-700 bg-ink-900/60">
        Así se verá tu perfil
      </div>
      <div
        className="w-full bg-gradient-to-r from-garnet-700 via-garnet-600 to-ink-900 relative"
        style={{ aspectRatio: '3 / 1' }}
      >
        {bannerPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="px-4 pb-4">
        <div className="relative z-10 -mt-10 mb-2 w-20 h-20 rounded-full border-4 border-ink-800 bg-ink-700 overflow-hidden flex items-center justify-center">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-garnet-400">
              {(username || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-neutral-50">
          {displayName || 'Nombre de tu personaje'}
        </h3>
        <p className="text-neutral-500 text-sm mb-2">{'@' + (username || 'usuario')}</p>
        {(bio || track) && (
          <div className="mb-3 space-y-3">
            {bio && <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">{bio}</p>}
            {track && <MusicChip track={music} variant="card" />}
          </div>
        )}
        {special && (
          <div className="relative overflow-hidden mb-3 rounded-2xl border border-garnet-500/30 bg-gradient-to-br from-garnet-600/15 via-garnet-600/5 to-transparent px-4 py-3">
            <IdentitySeal identity={identity} className="absolute right-1 top-1 w-[72px] h-[50px] text-garnet-300 opacity-90" />
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-garnet-300">
              <SparklesIcon className="w-3.5 h-3.5" />
              Identidad
            </p>
            <p className="text-lg font-display font-semibold text-neutral-50 leading-tight mt-0.5">{identity}</p>
            {identityDetail && field && (
              <p className="text-sm text-neutral-300 mt-1.5">
                <span className="text-neutral-500">{field.label}: </span>
                <span className="font-medium text-neutral-100">{formatIdentityDetail(identity, identityDetail)}</span>
              </p>
            )}
            {visLabel && <p className="mt-2 text-[11px] text-neutral-500">👁 La ve: {visLabel}</p>}
          </div>
        )}
        {(common || grado || birthday || estadoPersonal) && (
          <div className="flex flex-wrap gap-1.5">
            {common && <span className="inline-flex items-center gap-1.5 bg-ink-900/70 border border-ink-700 text-neutral-300 text-[11px] font-medium px-2.5 py-1 rounded-full">{identity}</span>}
            {grado && <InfoChip icon={<GraduationCapIcon className="w-3.5 h-3.5" />} text={grado} />}
            {birthday && (
              <InfoChip
                icon={<CalendarIcon className="w-3.5 h-3.5" />}
                text={formatBirthdayPreview(birthday)}
              />
            )}
            {estadoPersonal && (
              <InfoChip icon={<HeartIcon className="w-3.5 h-3.5" />} text={estadoPersonal} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
