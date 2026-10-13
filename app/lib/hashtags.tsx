import Link from 'next/link'
import type { ReactNode } from 'react'

export const HASHTAG_REGEX = /#([A-Za-z0-9_]{1,50})/g

// Mismas reglas que usa la base de datos: la @ va al inicio o después de un espacio/signo, y el usuario
// tiene de 3 a 24 caracteres (letras, números, _ y .). Un punto final ("hola @ana.") no cuenta.
const RICH_REGEX = /#([A-Za-z0-9_]{1,50})|(^|[^A-Za-z0-9_.@#])@([A-Za-z0-9_.]{3,24})/g

type RichOptions = { hashtags?: boolean; mentions?: boolean }

/**
 * Convierte el texto en texto normal + enlaces clicables: #hashtags (hacia /tag) y @etiquetas (hacia el perfil).
 * Por defecto hace las dos cosas; en comentarios y en el Muro se usa solo { hashtags: false }.
 */
export function renderRichText(content: string, { hashtags = true, mentions = true }: RichOptions = {}): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = new RegExp(RICH_REGEX)
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(content)) !== null) {
    const isTag = match[1] !== undefined
    if (isTag && !hashtags) continue
    if (!isTag && !mentions) continue

    if (isTag) {
      if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index))
      const tag = match[1]
      parts.push(
        <Link
          key={`tag-${key++}`}
          href={`/tag/${tag.toLowerCase()}`}
          onClick={(e) => e.stopPropagation()}
          className="text-garnet-400 hover:underline"
        >
          #{tag}
        </Link>
      )
      lastIndex = match.index + match[0].length
      continue
    }

    // @etiqueta: el carácter que va antes (espacio, signo...) se queda como texto normal
    const lead = match[2]
    const raw = match[3]
    const username = raw.replace(/\.+$/, '')
    if (username.length < 3) continue
    const mentionStart = match.index + lead.length
    if (mentionStart > lastIndex) parts.push(content.slice(lastIndex, mentionStart))
    parts.push(
      <Link
        key={`at-${key++}`}
        href={`/perfil/${username.toLowerCase()}`}
        onClick={(e) => e.stopPropagation()}
        className="font-medium text-garnet-300 rounded px-0.5 -mx-0.5 hover:bg-garnet-600/15 hover:underline"
      >
        @{username}
      </Link>
    )
    lastIndex = mentionStart + 1 + username.length
    // si se recortó un punto final, se retoma justo después del usuario
    regex.lastIndex = lastIndex
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex))
  return parts
}

/** Compatibilidad: publicaciones con #hashtags y @etiquetas */
export function renderContentWithHashtags(content: string): ReactNode[] {
  return renderRichText(content, { hashtags: true, mentions: true })
}
