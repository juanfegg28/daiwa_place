'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { bgToCss, signedStoryUrls, type StoryBg } from '../lib/stories'

type Card = { id: string; kind: 'photo' | 'text'; media_path: string | null; bg: StoryBg | null } | null

const cache = new Map<string, Card>()

/** «Respondió a tu historia»: miniatura mientras la historia siga viva; «Historia no disponible» si ya venció.
 *  Por privacidad NO se guarda copia de la imagen en el mensaje. */
export default function StoryReplyCard({ storyId, mine, ownerName }: { storyId: string; mine: boolean; ownerName: string }) {
  const [card, setCard] = useState<Card | undefined>(cache.get(storyId))
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      const { data } = await supabase.rpc('story_card', { p_story: storyId })
      const c = (data as Card) ?? null
      cache.set(storyId, c)
      if (!alive) return
      setCard(c)
      if (c?.media_path) {
        const m = await signedStoryUrls([c.media_path])
        if (alive) setUrl(m[c.media_path] ?? null)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [storyId])

  const label = mine ? `Respondiste a la historia de ${ownerName}` : 'Respondió a tu historia'
  return (
    <div className={`mb-0.5 flex items-center gap-2 rounded-2xl bg-ink-800 border border-ink-700 p-1.5 pr-3 ${mine ? 'self-end' : 'self-start'}`}>
      <span className="w-9 h-12 rounded-lg overflow-hidden bg-ink-700 shrink-0 flex items-center justify-center text-[10px] text-neutral-500" style={card && card.kind === 'text' ? { background: bgToCss(card.bg) } : undefined}>
        {card && card.kind === 'photo' && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" draggable={false} className="w-full h-full object-cover" />
        ) : card === null ? (
          '—'
        ) : null}
      </span>
      <span className="leading-tight">
        <span className="block text-[11px] font-semibold text-garnet-400">{label}</span>
        <span className="block text-xs text-neutral-500">{card === null ? 'Historia no disponible' : card ? 'Historia' : '…'}</span>
      </span>
    </div>
  )
}
