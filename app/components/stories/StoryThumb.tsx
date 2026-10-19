'use client'

import type { StoryRow } from '../../lib/stories'
import StoryCanvas from './StoryCanvas'

/** Miniatura 9:16 de una historia (usa el mismo escenario del visor, así se ve igual) */
export default function StoryThumb({ story, url, className = '' }: { story: StoryRow; url?: string | null; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#17171b] ${className}`} style={{ aspectRatio: '9 / 16' }}>
      <StoryCanvas bg={story.bg} mediaUrl={url ?? null} elements={story.elements} track={null} animate={false} className="w-full" />
    </div>
  )
}
