/** Foto de perfil redonda, con el puntico verde de "conectado" (solo se pasa online=true para amigos). */
export default function UserAvatar({
  username,
  avatarUrl,
  size = 'w-12 h-12',
  online = false,
  textSize = 'text-base',
  ring = false,
}: {
  username: string
  avatarUrl: string | null
  size?: string
  online?: boolean
  textSize?: string
  ring?: boolean
}) {
  return (
    <span className={`relative inline-block shrink-0 ${size}`}>
      <span
        className={`w-full h-full rounded-full overflow-hidden bg-ink-700 flex items-center justify-center ${
          ring ? 'ring-2 ring-garnet-500/70' : ''
        }`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
        ) : (
          <span className={`${textSize} font-semibold text-garnet-400`}>{username.charAt(0).toUpperCase()}</span>
        )}
      </span>
      {online && (
        <span
          title="Conectado"
          aria-label="Conectado"
          className="absolute bottom-0 right-0 w-[28%] h-[28%] min-w-[9px] min-h-[9px] rounded-full bg-emerald-500 border-2 border-ink-950"
        />
      )}
    </span>
  )
}
