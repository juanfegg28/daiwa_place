import { GhostIcon } from '../components/icons'

/** Avatar de quien participa de forma anónima: nunca muestra foto ni inicial. */
export default function AnonAvatar({ size = 'w-9 h-9', iconSize = 'w-[55%] h-[55%]' }: { size?: string; iconSize?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${size} shrink-0 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center text-garnet-400`}
    >
      <GhostIcon className={iconSize} />
    </span>
  )
}
