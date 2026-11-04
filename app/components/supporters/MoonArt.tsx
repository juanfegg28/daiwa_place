import type { TierKey } from '../../lib/supporters'

/** Luna conceptual de cada nivel (SVG ligero; sin imágenes pesadas). */
export default function MoonArt({ tier, className = '' }: { tier: TierKey; className?: string }) {
  const id = `moonart-${tier}`
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      {tier === 'creciente' && (
        <>
          <defs>
            <radialGradient id={id} cx="30%" cy="28%" r="85%">
              <stop offset="0%" stopColor="#EDE9FE" />
              <stop offset="55%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#4C1D95" />
            </radialGradient>
          </defs>
          <path d="M104 14a68 68 0 1 0 42 106A56 56 0 0 1 104 14Z" fill={`url(#${id})`} />
          <circle cx="62" cy="96" r="6" fill="#4C1D95" opacity=".35" />
          <circle cx="82" cy="122" r="9" fill="#4C1D95" opacity=".28" />
          <circle cx="46" cy="64" r="4" fill="#4C1D95" opacity=".3" />
        </>
      )}
      {tier === 'llena' && (
        <>
          <defs>
            <radialGradient id={id} cx="35%" cy="30%" r="85%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="66" fill={`url(#${id})`} />
          <circle cx="58" cy="62" r="10" fill="#64748B" opacity=".4" />
          <circle cx="102" cy="96" r="14" fill="#64748B" opacity=".35" />
          <circle cx="74" cy="108" r="6" fill="#64748B" opacity=".4" />
          <circle cx="112" cy="54" r="5" fill="#64748B" opacity=".35" />
        </>
      )}
      {tier === 'eclipse' && (
        <>
          <defs>
            <radialGradient id={id} cx="50%" cy="50%" r="50%">
              <stop offset="58%" stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="72%" stopColor="#F59E0B" stopOpacity=".55" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="78" fill={`url(#${id})`} className="moon-corona" />
          <circle cx="80" cy="80" r="50" fill="#07070B" stroke="#FDE68A" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}
