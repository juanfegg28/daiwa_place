import Link from 'next/link'
import type { ReactNode } from 'react'

export const HASHTAG_REGEX = /#([A-Za-z0-9_]{1,50})/g

/** Convierte el texto de una publicación en texto normal + enlaces clicables por cada #hashtag. */
export function renderContentWithHashtags(content: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = new RegExp(HASHTAG_REGEX)
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
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
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }
  return parts
}
