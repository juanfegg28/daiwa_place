'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MegaphoneIcon, CloseIcon } from './icons'

type Announcement = { id: string; content: string }

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('id, content')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setAnnouncement((data as Announcement) ?? null)
  }

  useEffect(() => {
    function run() {
      load()
    }
    run()
  }, [])

  if (!announcement || dismissed) return null

  return (
    <div className="flex items-start gap-3 bg-garnet-600/15 border border-garnet-600/40 rounded-2xl px-4 py-3 mb-4">
      <MegaphoneIcon className="w-5 h-5 text-garnet-400 shrink-0 mt-0.5" />
      <p className="text-sm text-neutral-100 flex-1 leading-relaxed">{announcement.content}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Cerrar anuncio"
        className="text-neutral-500 hover:text-neutral-200 transition shrink-0"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
