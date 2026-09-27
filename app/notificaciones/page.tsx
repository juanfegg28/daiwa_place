'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { BellIcon } from '../components/icons'

export default function NotificacionesPage() {
  return (
    <AppShell>
      <NotificacionesContent />
    </AppShell>
  )
}

function NotificacionesContent() {
  const { userId, loading } = useAppSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !userId) router.push('/login')
  }, [loading, userId, router])

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-display font-semibold mb-1 text-neutral-50">Notificaciones</h1>
      <p className="text-neutral-500 text-sm mb-8">Todavía estamos construyendo esta sección</p>

      <div className="surface-card rounded-2xl p-10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-ink-700 flex items-center justify-center text-garnet-400">
          <BellIcon className="w-6 h-6" />
        </div>
        <p className="text-neutral-200 text-sm font-medium">Muy pronto vas a ver tus notificaciones aquí</p>
        <p className="text-neutral-500 text-xs max-w-xs">
          Likes, comentarios, respuestas y más van a aparecer en esta pantalla. La organizamos en el próximo paso.
        </p>
      </div>
    </div>
  )
}
