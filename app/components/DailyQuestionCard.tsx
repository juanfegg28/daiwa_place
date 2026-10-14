'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SparklesIcon } from './icons'

export const DAILY_TAG = 'PreguntaDelDia'

type DailyQuestion = { id: string; question: string }

/**
 * La #PreguntaDelDia del Inicio. Al darle «Responder» se llena la caja de publicar con
 * «#PreguntaDelDia + la pregunta» y el cursor queda en el renglón de abajo para escribir la respuesta.
 * La pregunta la cambia el equipo desde Admin → Pregunta del día. Si no hay ninguna, no se muestra nada.
 */
export default function DailyQuestionCard({ onAnswer }: { onAnswer: (question: string) => void }) {
  const [q, setQ] = useState<DailyQuestion | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data } = await supabase
        .from('daily_questions')
        .select('id, question')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) setQ((data as DailyQuestion | null) ?? null)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (!q) return null

  return (
    <section
      aria-label="Pregunta del día"
      className="relative overflow-hidden rounded-2xl border border-garnet-700/40 bg-gradient-to-br from-garnet-700/20 via-ink-900 to-ink-900 p-4 mb-4 sm:mb-6"
    >
      <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-garnet-600/10 blur-2xl" aria-hidden="true" />
      <div className="relative">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-garnet-300">
          <SparklesIcon className="w-3.5 h-3.5" />
          Pregunta del día
        </p>
        <p className="mt-2 text-[17px] leading-snug font-semibold text-neutral-50 break-words">{q.question}</p>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => onAnswer(q.question)}
            className="bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-medium rounded-full px-4 py-1.5 transition"
          >
            Responder
          </button>
          <Link
            href={`/tag/${DAILY_TAG.toLowerCase()}`}
            className="text-sm text-neutral-400 hover:text-garnet-400 transition"
          >
            Ver respuestas
          </Link>
        </div>
      </div>
    </section>
  )
}
