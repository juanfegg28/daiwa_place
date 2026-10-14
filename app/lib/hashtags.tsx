import Link from 'next/link'
import type { ReactNode } from 'react'

export const HASHTAG_REGEX = /#([A-Za-z0-9_]{1,50})/g

type RichOptions = {
  hashtags?: boolean
  mentions?: boolean
  /** **negrita**, *cursiva*, __subrayado__ (v1.0.6; solo en publicaciones) */
  formatting?: boolean
}

// Cada pieza que sabe reconocer el texto. Las de formato van primero para que ganen en la misma posición.
// · @usuario: mismas reglas que la base de datos (3 a 24 caracteres: letras, números, _ y .; un punto final no cuenta)
const PIECES = {
  bi: String.raw`\*\*\*(?<bi>[^\s*](?:[^\n]*?[^\s*])?)\*\*\*`,
  b: String.raw`\*\*(?<b>[^\s*](?:[^\n]*?[^\s*])?)\*\*`,
  u: String.raw`__(?<u>[^\s_](?:[^\n]*?[^\s_])?)__`,
  i: String.raw`\*(?<i>[^\s*](?:[^*\n]*[^\s*])?)\*`,
  tag: String.raw`#(?<tag>[A-Za-z0-9_]{1,50})`,
  at: String.raw`(?<lead>^|[^A-Za-z0-9_.@#])@(?<user>[A-Za-z0-9_.]{3,24})`,
}

function buildRegex({ hashtags, mentions, formatting }: Required<RichOptions>): RegExp | null {
  const parts: string[] = []
  if (formatting) parts.push(PIECES.bi, PIECES.b, PIECES.u, PIECES.i)
  if (hashtags) parts.push(PIECES.tag)
  if (mentions) parts.push(PIECES.at)
  return parts.length ? new RegExp(parts.join('|'), 'g') : null
}

/**
 * Convierte el texto en texto normal + enlaces clicables (#hashtags hacia /tag, @etiquetas hacia el perfil)
 * y, si se pide, en negritas / cursivas / subrayado. Por defecto: hashtags y @etiquetas, sin formato.
 */
export function renderRichText(content: string, options: RichOptions = {}): ReactNode[] {
  const opts: Required<RichOptions> = {
    hashtags: options.hashtags ?? true,
    mentions: options.mentions ?? true,
    formatting: options.formatting ?? false,
  }
  const regex = buildRegex(opts)
  if (!regex) return [content]

  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(content)) !== null) {
    const g = match.groups ?? {}

    // --- formato (lo de adentro también se interpreta: una @etiqueta puede ir dentro de una negrita) ---
    if (g.bi !== undefined || g.b !== undefined || g.u !== undefined || g.i !== undefined) {
      if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index))
      if (g.bi !== undefined) {
        parts.push(
          <strong key={`f-${key++}`} className="font-bold">
            <em>{renderRichText(g.bi, opts)}</em>
          </strong>
        )
      } else if (g.b !== undefined) {
        parts.push(
          <strong key={`f-${key++}`} className="font-bold">
            {renderRichText(g.b, opts)}
          </strong>
        )
      } else if (g.u !== undefined) {
        parts.push(
          <u key={`f-${key++}`} className="underline underline-offset-2">
            {renderRichText(g.u, opts)}
          </u>
        )
      } else {
        parts.push(<em key={`f-${key++}`}>{renderRichText(g.i, opts)}</em>)
      }
      lastIndex = match.index + match[0].length
      continue
    }

    // --- #hashtag ---
    if (g.tag !== undefined) {
      if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index))
      parts.push(
        <Link
          key={`tag-${key++}`}
          href={`/tag/${g.tag.toLowerCase()}`}
          onClick={(e) => e.stopPropagation()}
          className="text-garnet-400 hover:underline"
        >
          #{g.tag}
        </Link>
      )
      lastIndex = match.index + match[0].length
      continue
    }

    // --- @etiqueta: el carácter que va antes (espacio, signo...) se queda como texto normal ---
    const lead = g.lead ?? ''
    const username = (g.user ?? '').replace(/\.+$/, '')
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

/** Publicaciones: #hashtags, @etiquetas y formato de texto */
export function renderContentWithHashtags(content: string): ReactNode[] {
  return renderRichText(content, { hashtags: true, mentions: true, formatting: true })
}

/** Quita las marcas de formato (**, *, __) para mostrar un fragmento limpio, por ejemplo en las notificaciones */
export function stripFormatting(text: string): string {
  let out = text
  for (let i = 0; i < 3; i++) {
    const next = out
      .replace(/\*\*\*([^\s*](?:[^\n]*?[^\s*])?)\*\*\*/g, '$1')
      .replace(/\*\*([^\s*](?:[^\n]*?[^\s*])?)\*\*/g, '$1')
      .replace(/__([^\s_](?:[^\n]*?[^\s_])?)__/g, '$1')
      .replace(/\*([^\s*](?:[^*\n]*[^\s*])?)\*/g, '$1')
    if (next === out) break
    out = next
  }
  return out
}
