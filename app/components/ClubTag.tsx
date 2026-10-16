import Link from 'next/link'
import { ClubsIcon, FireIcon, StarIcon } from './icons'
import { hexToRgba, type ClubMembershipTag } from '../lib/clubs'

/**
 * Etiqueta de facción (Club / Pandilla).
 *
 * A propósito se ve MUY distinta a las insignias oficiales (Staff / Dev / Creador):
 *  · las insignias oficiales son píldoras redondas, de color sólido y con texto blanco;
 *  · la etiqueta de facción es un rectángulo de esquinas suaves, con borde punteado,
 *    fondo transparente teñido, texto del color del club y el escudo del club al principio.
 * Así nadie confunde un rol de club con una autoridad de la página.
 */
export function ClubTag({
  name,
  color,
  kind,
  leader = false,
  size = 'sm',
  href,
  title,
}: {
  name: string
  color: string
  kind: 'club' | 'pandilla'
  leader?: boolean
  size?: 'xs' | 'sm'
  href?: string
  title?: string
}) {
  const pad = size === 'xs' ? 'px-1.5 py-[1px] text-[9.5px] gap-1' : 'px-2 py-0.5 text-[11px] gap-1.5'
  const icon = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  const Icon = leader ? StarIcon : kind === 'pandilla' ? FireIcon : ClubsIcon
  const body = (
    <span
      title={title ?? `${kind === 'pandilla' ? 'Pandilla' : 'Club'}: ${name}`}
      className={`inline-flex items-center max-w-[11rem] rounded-md border border-dashed font-medium leading-tight align-middle ${pad}`}
      style={{ color, borderColor: hexToRgba(color, 0.65), backgroundColor: hexToRgba(color, 0.12) }}
    >
      <Icon className={`${icon} shrink-0`} />
      <span className="truncate">{name}</span>
    </span>
  )
  return href ? (
    <Link href={href} className="hover:brightness-125 transition">
      {body}
    </Link>
  ) : (
    body
  )
}

/**
 * Las etiquetas de club de una persona: junto a su nombre en el feed y en su perfil.
 * Se muestra el nombre del ROL dentro del club (ej. «Tesorero»); si no tiene rol, el nombre del club.
 * En el feed se muestran máximo 2 y un «+N» si pertenece a más.
 */
export default function ClubTags({
  memberships,
  size = 'sm',
  max = 2,
}: {
  memberships?: ClubMembershipTag[] | null
  size?: 'xs' | 'sm'
  max?: number
}) {
  const list = (memberships ?? []).filter((m): m is ClubMembershipTag & { clubs: NonNullable<ClubMembershipTag['clubs']> } => !!m.clubs)
  if (list.length === 0) return null
  const shown = list.slice(0, max)
  const rest = list.length - shown.length
  return (
    <span className="inline-flex items-center gap-1 flex-wrap align-middle">
      {shown.map((m) => {
        const isLeader = !!m.club_roles?.is_leader
        // Líder: «Líder de X». Con rol: «Tesorero · X» (así se sabe de qué club es). Sin rol: solo el club.
        const label = isLeader
          ? m.club_roles?.name ?? `Líder de ${m.clubs.name}`
          : m.club_roles
            ? `${m.club_roles.name} · ${m.clubs.name}`
            : m.clubs.name
        return (
          <ClubTag
            key={m.clubs.slug}
            name={label}
            color={m.club_roles?.color ?? m.clubs.color}
            kind={m.clubs.kind}
            leader={isLeader}
            size={size}
            href={`/clubes/${m.clubs.slug}`}
            title={`${m.clubs.kind === 'pandilla' ? 'Pandilla' : 'Club'} ${m.clubs.name}`}
          />
        )
      })}
      {rest > 0 && <span className="text-[10px] text-neutral-500">+{rest}</span>}
    </span>
  )
}
