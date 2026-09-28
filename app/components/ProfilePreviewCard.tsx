import type { ReactNode } from 'react'
import { GraduationCapIcon, CalendarIcon, HeartIcon } from './icons'

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
}: ProfilePreviewCardProps) {
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
          <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="px-4 pb-4">
        <div className="relative z-10 -mt-10 mb-2 w-20 h-20 rounded-full border-4 border-ink-800 bg-ink-700 overflow-hidden flex items-center justify-center">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
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
        {bio && (
          <p className="text-sm text-neutral-200 mb-3 leading-relaxed whitespace-pre-wrap">{bio}</p>
        )}
        {(grado || birthday || estadoPersonal) && (
          <div className="flex flex-wrap gap-1.5">
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
