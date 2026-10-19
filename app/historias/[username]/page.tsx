'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import StoryViewer from '../../components/stories/StoryViewer'

// Visor de historias (pantalla completa, sin menú). ?s=<id> abre esa historia, ?h=<id> una destacada,
// ?vistas=1 abre la hoja de actividad (tu propia historia).
function ViewerRoute() {
  const params = useParams<{ username: string }>()
  const sp = useSearchParams()
  return (
    <StoryViewer
      username={decodeURIComponent(params.username)}
      storyId={sp.get('s')}
      highlightId={sp.get('h')}
      openViewers={sp.get('vistas') === '1'}
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-black" />}>
      <ViewerRoute />
    </Suspense>
  )
}
