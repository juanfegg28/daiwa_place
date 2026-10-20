// Desde la v1.3.0 el avatar vive en components/cosmetics/Avatar.tsx. Este archivo solo lo reexporta
// para que los usos que ya existían sigan funcionando igual.
import Avatar from './cosmetics/Avatar'

export default function UserAvatar(props: {
  username: string
  avatarUrl: string | null
  size?: string
  online?: boolean
  textSize?: string
  ring?: boolean
  priority?: boolean
}) {
  return <Avatar {...props} />
}
