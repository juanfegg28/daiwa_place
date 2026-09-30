'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { ConfigProfile } from './types'

const OPTIONS: { key: keyof ConfigProfile['notif_prefs']; label: string; description: string }[] = [
  { key: 'comments', label: 'Comentarios', description: 'Cuando alguien comenta una de tus publicaciones.' },
  { key: 'mentions', label: 'Menciones y respuestas', description: 'Cuando alguien te menciona o responde uno de tus comentarios.' },
  { key: 'likes', label: 'Likes', description: 'Cuando alguien le da like a tu publicación o a un comentario tuyo.' },
]

export default function NotificacionesTab({
  profile,
  onUpdate,
}: {
  profile: ConfigProfile
  onUpdate: (p: ConfigProfile) => void
}) {
  const [saving, setSaving] = useState<string | null>(null)

  const toggle = async (key: keyof ConfigProfile['notif_prefs']) => {
    setSaving(key)
    const next = { ...profile.notif_prefs, [key]: !profile.notif_prefs[key] }
    const { error } = await supabase.from('profiles').update({ notif_prefs: next }).eq('id', profile.id)
    setSaving(null)
    if (!error) onUpdate({ ...profile, notif_prefs: next })
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Qué te queremos avisar</h2>
        <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
          Elige qué tipo de actividad quieres que te avise la página. Esto se conecta con el panel de
          Notificaciones que estamos terminando de construir — por ahora, tu preferencia queda guardada y
          lista para cuando esté funcionando.
        </p>
        <div className="space-y-1">
          {OPTIONS.map((opt) => {
            const enabled = profile.notif_prefs[opt.key]
            return (
              <div
                key={opt.key}
                className="flex items-center justify-between gap-4 py-3 border-b border-ink-800 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-100">{opt.label}</p>
                  <p className="text-xs text-neutral-500">{opt.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(opt.key)}
                  disabled={saving === opt.key}
                  role="switch"
                  aria-checked={enabled}
                  className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${
                    enabled ? 'bg-garnet-600' : 'bg-ink-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
