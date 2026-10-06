'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import AppShell, { useAppSession } from '../../components/AppShell'
import { ArrowLeftIcon, WhisperIcon } from '../../components/icons'
import {
  COMMENT_SELECT,
  WHISPER_SELECT,
  friendlyWhisperError,
  isMineWhisper,
  loadMyReports,
  type WhisperComment,
  type WhisperItem,
} from '../../lib/whispers'
import WhisperCard from '../WhisperCard'
import CommentComposer from '../CommentComposer'
import CommentsThread from '../CommentsThread'
import ReportDialog, { type ReportTarget } from '../ReportDialog'

export default function SusurroDetallePage() {
  return (
    <AppShell>
      <SusurroDetalle />
    </AppShell>
  )
}

function SusurroDetalle() {
  const params = useParams()
  const raw = params?.id
  const whisperId = (Array.isArray(raw) ? raw[0] : raw) ?? ''
  const { userId, loading: sessionLoading } = useAppSession()
  const router = useRouter()

  const [whisper, setWhisper] = useState<WhisperItem | null>(null)
  const [comments, setComments] = useState<WhisperComment[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'paused' | 'error'>('loading')
  const [notice, setNotice] = useState('')
  const [reportedWhispers, setReportedWhispers] = useState<Set<string>>(new Set())
  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set())
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionLoading && !userId) router.push('/login')
  }, [sessionLoading, userId, router])

  const load = useCallback(async () => {
    if (!whisperId) return
    const { data: on } = await supabase.rpc('whispers_enabled')
    if (on === false) {
      setState('paused')
      return
    }
    const [{ data: w, error: wErr }, { data: cs, error: cErr }, reports] = await Promise.all([
      supabase.from('whispers').select(WHISPER_SELECT).eq('id', whisperId).maybeSingle(),
      supabase.from('whisper_comments').select(COMMENT_SELECT).eq('whisper_id', whisperId).order('created_at', { ascending: true }),
      loadMyReports(),
    ])
    if (wErr || cErr) {
      setNotice(friendlyWhisperError((wErr ?? cErr)?.message))
      setState('error')
      return
    }
    if (!w) {
      setState('missing')
      return
    }
    setWhisper(w as unknown as WhisperItem)
    setComments((cs as unknown as WhisperComment[]) ?? [])
    setReportedWhispers(reports.whispers)
    setReportedComments(reports.comments)
    setState('ready')
  }, [whisperId])

  useEffect(() => {
    if (!userId) return
    function run() {
      load()
    }
    run()
    const interval = window.setInterval(run, 30000)
    window.addEventListener('focus', run)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', run)
    }
  }, [userId, load])

  // Llegada desde una notificación: /susurros/ID?c=COMMENT_ID → baja hasta ese comentario y lo resalta
  useEffect(() => {
    if (state !== 'ready') return
    const target = new URLSearchParams(window.location.search).get('c')
    if (!target) return
    const scrollTimer = window.setTimeout(() => {
      const el = document.getElementById(`comment-${target}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightId(target)
      }
    }, 250)
    const clearTimer = window.setTimeout(() => setHighlightId(null), 4200)
    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(clearTimer)
    }
    // solo la primera vez que carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === 'ready'])

  if (sessionLoading || !userId || state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  const back = (
    <Link href="/susurros" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-100 mb-4 transition">
      <ArrowLeftIcon className="w-4 h-4" />
      Muro de los Susurros
    </Link>
  )

  if (state === 'paused' || state === 'missing' || state === 'error' || !whisper) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        {back}
        <div className="surface-card rounded-2xl p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-ink-700 flex items-center justify-center text-garnet-400">
            <WhisperIcon className="w-6 h-6" />
          </div>
          <p className="text-neutral-200 text-sm font-medium">
            {state === 'paused'
              ? 'El Muro está en pausa por ahora'
              : state === 'error'
                ? 'No se pudo abrir esta confesión'
                : 'Esta confesión ya no está disponible'}
          </p>
          <p className="text-neutral-500 text-xs max-w-xs">
            {state === 'error' ? notice : 'Pudo ser eliminada por su autor o por moderación.'}
          </p>
        </div>
      </div>
    )
  }

  const live = whisper.status === 'visible'
  const mine = isMineWhisper(whisper)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {back}

      {notice && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-ink-800 border border-ink-600 px-3.5 py-2.5">
          <p className="text-xs text-neutral-300 flex-1">{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-xs text-neutral-500 hover:text-neutral-100">
            Cerrar
          </button>
        </div>
      )}

      <WhisperCard
        whisper={whisper}
        detail
        reported={reportedWhispers.has(whisper.id)}
        onUpdate={setWhisper}
        onDeleted={() => router.push('/susurros')}
        onReport={(id) => setReportTarget({ whisperId: id })}
        onNotice={setNotice}
      />

      <h2 className="text-sm font-semibold text-neutral-300 mt-6 mb-3">
        Comentarios {whisper.comment_count > 0 ? `(${whisper.comment_count})` : ''}
      </h2>

      {live ? (
        <div className="mb-5">
          <CommentComposer whisperId={whisper.id} isWhisperMine={mine} onPosted={load} />
        </div>
      ) : (
        <p className="text-xs text-neutral-500 mb-5">Esta confesión no admite comentarios nuevos.</p>
      )}

      <CommentsThread
        whisperId={whisper.id}
        isWhisperMine={mine}
        comments={comments}
        reportedComments={reportedComments}
        highlightId={highlightId}
        onChanged={load}
        onReport={(id) => setReportTarget({ commentId: id })}
        onNotice={setNotice}
      />

      <ReportDialog
        target={reportTarget}
        onClose={() => setReportTarget(null)}
        onDone={(t) => {
          if (t.whisperId) setReportedWhispers((prev) => new Set(prev).add(t.whisperId as string))
          if (t.commentId) setReportedComments((prev) => new Set(prev).add(t.commentId as string))
          setReportTarget(null)
          setNotice('Gracias. Recibimos tu reporte y nadie sabrá que fuiste tú.')
          load()
        }}
      />
    </div>
  )
}
