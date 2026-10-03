import { isSupremeAdmin } from '../lib/permissions'
import { CrownIcon } from './icons'
import type { RoleBadgeInfo } from '../lib/types'

/**
 * Insignias junto al nombre: la corona de fundador (hardcodeada, intocable)
 * para @renshsh y @are_you_rena, más una por cada rol que tenga asignado.
 * Si la persona eligió un color de insignia personalizado (Configuración >
 * Apariencia), ese color pisa el color por defecto del rol.
 *
 * founderStyle:
 *  - 'full' (por defecto): píldora dorada con corona + "Creador de DaiwaPlace"
 *    (se usa en el encabezado del perfil).
 *  - 'icon': solo la coronita dentro de un círculo dorado (se usa en las
 *    publicaciones del inicio y del perfil, para no ocupar tanto espacio).
 */
export default function RoleBadges({
  username,
  roles,
  badgeColorOverride,
  size = 'sm',
  founderStyle = 'full',
}: {
  username: string | null | undefined
  roles?: RoleBadgeInfo[]
  badgeColorOverride?: string | null
  size?: 'sm' | 'xs'
  founderStyle?: 'full' | 'icon'
}) {
  const founder = isSupremeAdmin(username)
  const roleNames = (roles ?? []).map((r) => r.roles).filter((r): r is { name: string; badge_color: string } => !!r)

  if (!founder && roleNames.length === 0) return null

  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  // Colores fijos (no variables CSS): esta insignia es intocable y nunca debe
  // cambiar, ni con el acento de quien la mira ni con el color VIP de nadie.
  const founderBackground = 'linear-gradient(100deg, #f4c858 0%, #d79a2c 45%, #9a5a16 100%)'
  const founderShadow = '0 0 0 1px rgba(255,220,150,0.5) inset'
  const iconOnlyBox = size === 'xs' ? 'w-[18px] h-[18px]' : 'w-5 h-5'

  return (
    <span className="inline-flex items-center gap-1 flex-wrap align-middle">
      {founder &&
        (founderStyle === 'icon' ? (
          <span
            title="Creador de DaiwaPlace"
            aria-label="Creador de DaiwaPlace"
            className={`inline-flex items-center justify-center rounded-full ${iconOnlyBox}`}
            style={{ background: founderBackground, color: '#2a1600', boxShadow: founderShadow }}
          >
            <CrownIcon className={iconSize} />
          </span>
        ) : (
          <span
            title="Creador de DaiwaPlace"
            className={`inline-flex items-center gap-1 rounded-full font-semibold tracking-wide ${pad}`}
            style={{ background: founderBackground, color: '#2a1600', boxShadow: founderShadow }}
          >
            <CrownIcon className={iconSize} />
            Creador de DaiwaPlace
          </span>
        ))}
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
