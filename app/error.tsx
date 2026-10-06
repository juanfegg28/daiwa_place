'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Pantalla de error en español para cualquier página de la app.
 * Antes salía el aviso genérico en inglés ("This page couldn't load") sin decir qué pasó.
 * Ahora explica, deja reintentar y muestra un detalle corto para poder reportarlo.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Error en la página:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ink-950">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 mx-auto rounded-full border border-ink-600 flex items-center justify-center text-garnet-400 text-2xl mb-4">
          !
        </div>
        <h1 className="text-lg font-semibold text-neutral-50 mb-1">Algo salió mal en esta página</h1>
        <p className="text-sm text-neutral-400 mb-5">
          No es tu culpa. Prueba a recargar; si sigue pasando, cuéntaselo al equipo con el detalle de abajo.
        </p>
        <div className="flex gap-3 justify-center mb-5">
          <button
            type="button"
            onClick={reset}
            className="bg-garnet-600 hover:bg-garnet-500 text-white rounded-full px-5 py-2 text-sm font-medium transition"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="border border-ink-500 text-neutral-300 rounded-full px-5 py-2 text-sm hover:bg-ink-800 transition"
          >
            Ir al inicio
          </Link>
        </div>
        <p className="text-[11px] text-neutral-600 break-words">
          Detalle: {error.message?.slice(0, 160) || 'sin mensaje'}
          {error.digest ? ` · ${error.digest}` : ''}
        </p>
      </div>
    </div>
  )
}
