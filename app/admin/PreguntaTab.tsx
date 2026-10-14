'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Question = { id: string; question: string; created_at: string }

const MAX = 200

/**
 * Admin → Pregunta del día. Escribes la pregunta, le das «Publicar» y aparece en el Inicio de todos
 * (con el botón «Responder» que llena la caja con #PreguntaDelDia). Solo hay una activa a la vez.
 */
export default function PreguntaTab() {
  const [current, setCurrent] = useState<Question | null>(null)
  const [history, setHistory] = useState<Question[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('daily_questions')
      .select('id, question, created_at, active')
      .order('created_at', { ascending: false })
      .limit(15)
    const rows = (data as (Question & { active: boolean })[]) ?? []
    setCurrent(rows.find((r) => r.active) ?? null)
    setHistory(rows.filter((r) => !r.active))
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      load()
    }
    run()
  }, [])

  const publish = async (question: string) => {
    const q = question.trim()
    if (q.length < 3) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.rpc('set_daily_question', { p_question: q })
    setSaving(false)
    if (err) {
      setError('No se pudo publicar: ' + err.message)
      return
    }
    setText('')
    load()
  }

  const clear = async () => {
    setSaving(true)
    setError('')
    const { error: err } = await supabase.rpc('clear_daily_question')
    setSaving(false)
    if (err) setError('No se pudo quitar: ' + err.message)
    load()
  }

  return (
    <section className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold text-neutral-50 mb-1">#PreguntaDelDia</h2>
      <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
        Escribe la pregunta de hoy y aparecerá como una tarjeta en el Inicio de todos. Quien le dé «Responder» tendrá la
        caja de publicar lista con <b className="text-neutral-300">#PreguntaDelDia + la pregunta</b> y un renglón libre
        abajo para su respuesta. Si publicas otra, reemplaza a la anterior.
      </p>

      {loading ? (
        <p className="text-neutral-500 text-sm">Cargando...</p>
      ) : current ? (
        <div className="border border-garnet-700/40 bg-garnet-700/10 rounded-xl p-3 mb-4">
          <p className="text-xs text-neutral-500 mb-1">Pregunta activa ahora mismo:</p>
          <p className="text-sm text-neutral-100 mb-2 break-words">{current.question}</p>
          <button
            type="button"
            onClick={clear}
            disabled={saving}
            className="text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
          >
            Quitar la pregunta
          </button>
        </div>
      ) : (
        <p className="text-neutral-500 text-sm mb-4">No hay ninguna pregunta activa: la tarjeta no se muestra en el Inicio.</p>
      )}

      <div className="max-w-md space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={2}
          maxLength={MAX}
          placeholder="Ej: ¿Cuál es la canción que más has escuchado esta semana?"
          className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-garnet-600"
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => publish(text)}
            disabled={saving || text.trim().length < 3}
            className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
          >
            {saving ? 'Publicando...' : current ? 'Reemplazar pregunta' : 'Publicar pregunta'}
          </button>
          <span className="text-[11px] text-neutral-600 tabular-nums">
            {text.length}/{MAX}
          </span>
        </div>
        {error && <p className="text-xs text-garnet-400">{error}</p>}
      </div>

      {history.length > 0 && (
        <div className="mt-6 max-w-md">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Preguntas anteriores</p>
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-3 border border-ink-700 rounded-lg px-3 py-2">
                <span className="text-sm text-neutral-300 break-words min-w-0">{h.question}</span>
                <button
                  type="button"
                  onClick={() => publish(h.question)}
                  disabled={saving}
                  className="shrink-0 text-xs text-garnet-400 hover:text-garnet-300 disabled:opacity-60"
                >
                  Usar otra vez
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
