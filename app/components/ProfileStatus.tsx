'use client'

import { useEffect, useState } from 'react'
import { STATUS_CHANGED_EVENT, fetchStatus, statusAgo, type StatusRow } from '../lib/status'
import StatusSheet from './StatusSheet'

/**
 * v1.6.2 · «Estado: Vegetal» en el perfil. Si es el tuyo, se puede cambiar con un toque
 * (y si no tienes, te invita a poner uno). En perfiles ajenos solo se muestra si hay estado.
 */
export default function ProfileStatus({ profileId, isMine }: { profileId: string; isMine: boolean }) {
  const [status, setStatus] = useState<StatusRow | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () =>
      void fetchStatus(profileId).then((s) => {
        if (!alive) return
        setStatus(s)
        setLoaded(true)
      })
    load()
    window.addEventListener(STATUS_CHANGED_EVENT, load)
    return () => {
      alive = false
      window.removeEventListener(STATUS_CHANGED_EVENT, load)
    }
  }, [profileId])

  if (!loaded) return null
  if (!status && !isMine) return null

  return (
    <>
      <div className="pf-box flex items-center gap-2.5">
        {status ? (
          <p className="min-w-0 flex-1 text-sm text-neutral-200 break-words">
            <span className="font-semibold text-neutral-400">Estado:</span>{' '}
            {status.emoji && <span aria-hidden="true">{status.emoji} </span>}
            <span className="font-semibold text-garnet-300">{status.text}</span>
            <span className="block text-[11px] text-neutral-500 mt-0.5">{statusAgo(status.updated_at)}</span>
          </p>
        ) : (
          <p className="min-w-0 flex-1 text-sm text-neutral-500">Aún no tienes un estado. Cuéntale a los demás cómo andas hoy.</p>
        )}
        {isMine && (
          <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800">
            {status ? 'Cambiar' : 'Poner estado'}
          </button>
        )}
      </div>
      {isMine && <StatusSheet open={open} current={status} onClose={() => setOpen(false)} onSaved={setStatus} />}
    </>
  )
}
