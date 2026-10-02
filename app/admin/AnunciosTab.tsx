'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAppSession } from '../components/AppShell'

type Announcement = { id: string; content: string; active: boolean; created_at: string }

export default function AnunciosTab() {
  const { userId } = useAppSession()
  const [current, setCurrent] = useState<Announcement | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('id, content, active, created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCurrent((data as Announcement) ?? null)
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      load()
    }
    run()
  }, [])

  const publish = async () => {
    if (!text.trim()) return
    setSaving(true)
    if (current) await supabase.from('announcements').update({ active: false }).eq('id', current.id)
    await supabase.from('announcements').insert({ content: text.trim(), created_by: userId })
    setText('')
    setSaving(false)
    load()
  }

  const remove = async () => {
    if (!current) return
    setSaving(true)
    await supabase.from('announcements').update({ active: false }).eq('id', current.id)
    setSaving(false)
    load()
  }

  return (
    <section className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold text-neutral-50 mb-1">Anuncios Globales</h2>
      <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
        Publica un banner fijado arriba del Inicio de TODOS los estudiantes de la red. Solo puede haber uno
        activo a la vez — si publicas uno nuevo, reemplaza al anterior.
      </p>

      {loading ? (
        <p className="text-neutral-500 text-sm">Cargando...</p>
      ) : current ? (
        <div className="border border-garnet-700/40 bg-garnet-700/10 rounded-xl p-3 mb-4">
          <p className="text-xs text-neutral-500 mb-1">Anuncio activo ahora mismo:</p>
          <p className="text-sm text-neutral-200 mb-2">{current.content}</p>
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
          >
            Quitar anuncio actual
          </button>
        </div>
      ) : (
        <p className="text-neutral-500 text-sm mb-4">No hay ningún anuncio activo ahora mismo.</p>
      )}

      <div className="max-w-md space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="Escribe el anuncio..."
          className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-garnet-600"
        />
        <button
          type="button"
          onClick={publish}
          disabled={saving || !text.trim()}
          className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
        >
          {saving ? 'Publicando...' : current ? 'Reemplazar anuncio' : 'Publicar anuncio'}
        </button>
      </div>
    </section>
  )
}
