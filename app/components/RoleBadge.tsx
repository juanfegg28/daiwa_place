import { isSupremeAdmin } from '../lib/permissions'
import { CrownIcon } from './icons'
import type { RoleBadgeInfo } from '../lib/types'

/**
 * Insignias junto al nombre: la corona de fundador (hardcodeada, intocable)
 * para @renshsh y @are_you_rena, más una por cada rol que tenga asignado.
 * Si la persona eligió un color de insignia personalizado (Configuración >
 * Apariencia), ese color pisa el color por defecto del rol.
 */
export default function RoleBadges({
  username,
  roles,
  badgeColorOverride,
  size = 'sm',
}: {
  username: string | null | undefined
  roles?: RoleBadgeInfo[]
  badgeColorOverride?: string | null
  size?: 'sm' | 'xs'
}) {
  const founder = isSupremeAdmin(username)
  const roleNames = (roles ?? []).map((r) => r.roles).filter((r): r is { name: string; badge_color: string } => !!r)

  if (!founder && roleNames.length === 0) return null

  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'

  return (
    <span className="inline-flex items-center gap-1 flex-wrap align-middle">
      {founder && (
        <span
          title="Creador de Daiwa Place"
          className={`inline-flex items-center gap-1 rounded-full font-semibold text-white bg-gradient-to-r from-amber-500 to-garnet-600 ${pad}`}
        >
          <CrownIcon className={iconSize} />
          Creador
        </span>
      )}
      {roleNames.map((r) => (
        <span
          key={r.name}
          className={`inline-flex items-center rounded-full font-semibold text-white ${pad}`}
          style={{ backgroundColor: badgeColorOverride || r.badge_color }}
        >
          {r.name}
        </span>
      ))}
    </span>
  )
}
