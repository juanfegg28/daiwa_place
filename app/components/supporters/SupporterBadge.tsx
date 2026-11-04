import { TIERS, type TierKey } from '../../lib/supporters'

/** Lunita de Supporter junto al nombre. Es independiente de los roles de Daiwa Academy (no usa user_roles). */
export default function SupporterBadge({ tier, size = 16, className = '' }: { tier: TierKey | null | undefined; size?: number; className?: string }) {
  if (!tier || !(tier in TIERS)) return null
  const t = TIERS[tier]
  const label = `${t.name} · Círculo Lunar`
  const id = `sb-${tier}`
  return (
    <span className={`inline-flex shrink-0 align-middle ${className}`} title={label} role="img" aria-label={label} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        {tier === 'creciente' && (
          <path d="M16.5 3.2A9 9 0 1 0 20.8 15 7.4 7.4 0 0 1 16.5 3.2Z" fill={t.accent} stroke="rgba(255,255,255,.5)" strokeWidth=".6" />
        )}
        {tier === 'llena' && (
          <>
            <defs>
              <radialGradient id={id} cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#B8C0D4" />
              </radialGradient>
            </defs>
            <circle cx="12" cy="12" r="9" fill={`url(#${id})`} stroke="rgba(255,255,255,.6)" strokeWidth=".6" />
            <circle cx="9" cy="10" r="1.5" fill="#94A3B8" opacity=".55" />
            <circle cx="14.5" cy="14.5" r="2" fill="#94A3B8" opacity=".45" />
          </>
        )}
        {tier === 'eclipse' && (
          <>
            <defs>
              <radialGradient id={id} cx="50%" cy="50%" r="50%">
                <stop offset="62%" stopColor="#F59E0B" stopOpacity=".95" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="12" cy="12" r="11" fill={`url(#${id})`} />
            <circle cx="12" cy="12" r="7.2" fill="#0B0B10" stroke="#FDE68A" strokeWidth=".7" />
          </>
        )}
      </svg>
    </span>
  )
}
