'use client'

import Image from 'next/image'
import { useState } from 'react'
import { usePwa } from '../lib/pwa'
import { APK_URL } from '../lib/appConfig'

const Steps = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="space-y-2 text-sm text-neutral-300">
    {items.map((it, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="shrink-0 w-5 h-5 mt-0.5 rounded-full bg-garnet-600/25 text-garnet-200 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
        <span className="min-w-0">{it}</span>
      </li>
    ))}
  </ol>
)

/** v1.5.11 · Página «Descargar app»: instalar desde el navegador, APK para Android y guía para iPhone. */
export default function DownloadApp() {
  const pwa = usePwa()
  const [msg, setMsg] = useState('')

  const doInstall = async () => {
    const r = await pwa.install()
    if (r === 'accepted') setMsg('¡Listo! Busca DaiwaPlace en tu pantalla de inicio.')
    else if (r === 'none') setMsg('Tu navegador no deja instalar con un toque. Mira los pasos de abajo.')
  }

  const android = (
    <section className="surface-card rounded-2xl p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold text-neutral-50 mb-1">Android</h2>
      <p className="text-sm text-neutral-400 mb-3">Dos formas. La primera es la más fácil y no necesita descargar ningún archivo.</p>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-3.5 mb-3">
        <p className="text-sm font-semibold text-neutral-100 mb-2">Opción 1 · Instalar desde el navegador</p>
        {pwa.canPrompt ? (
          <button type="button" onClick={doInstall} className="press rounded-full bg-garnet-600 hover:bg-garnet-500 text-white font-semibold text-sm px-5 py-2.5 transition">Instalar DaiwaPlace</button>
        ) : (
          <Steps items={[<>Abre DaiwaPlace en <b>Chrome</b>.</>, <>Toca los <b>tres puntitos ⋮</b> de arriba a la derecha.</>, <>Elige <b>«Instalar app»</b> (o «Añadir a la pantalla de inicio»).</>, 'Confirma. Aparece el ícono de la luna en tu pantalla.']} />
        )}
      </div>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-3.5">
        <p className="text-sm font-semibold text-neutral-100 mb-2">Opción 2 · Descargar el APK</p>
        {APK_URL ? (
          <>
            <a href={APK_URL} download className="press inline-block rounded-full bg-garnet-600 hover:bg-garnet-500 text-white font-semibold text-sm px-5 py-2.5 transition">Descargar APK</a>
            <details className="mt-3 text-sm text-neutral-300">
              <summary className="cursor-pointer text-garnet-300">¿Cómo se instala? (4 pasos)</summary>
              <div className="mt-2.5">
                <Steps items={[
                  'Cuando termine de bajar, toca el archivo descargado.',
                  <>Si Android dice que no se puede instalar de esta fuente, toca <b>Ajustes</b> y activa <b>«Permitir de esta fuente»</b>.</>,
                  <>Vuelve y toca <b>Instalar</b>.</>,
                  <>Si sale un aviso de <b>Play Protect</b>, toca <b>«Más detalles» → «Instalar de todos modos»</b>. Es normal: la app no viene de la tienda de Google.</>,
                ]} />
              </div>
            </details>
          </>
        ) : (
          <p className="text-sm text-neutral-400">El APK llega pronto. Mientras tanto usa la Opción 1: queda igual.</p>
        )}
      </div>
    </section>
  )

  const ios = (
    <section className="surface-card rounded-2xl p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold text-neutral-50 mb-1">iPhone y iPad</h2>
      <p className="text-sm text-neutral-400 mb-3">En iPhone no existe el APK. Se instala desde <b className="text-neutral-200">Safari</b>:</p>
      <Steps items={[
        <>Abre DaiwaPlace en <b>Safari</b> (no dentro de Instagram, TikTok ni otra app).</>,
        <>Toca el botón <b>Compartir</b> (el cuadradito con la flecha hacia arriba).</>,
        <>Baja y toca <b>«Añadir a pantalla de inicio»</b>.</>,
        <>Toca <b>Añadir</b>. Listo: ya tienes la luna en tu pantalla.</>,
      ]} />
    </section>
  )

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      <div className="flex items-center gap-4">
        <Image src="/icons/icon-192.png" alt="" width={64} height={64} className="rounded-2xl border border-ink-700" />
        <div>
          <h1 className="text-2xl font-display font-semibold text-neutral-50 leading-tight">Descargar app</h1>
          <p className="text-neutral-500 text-sm">Lleva DaiwaPlace en tu celular, con su propio ícono y a pantalla completa.</p>
        </div>
      </div>

      {pwa.standalone && <p className="rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-300">✓ Ya estás usando la app instalada.</p>}
      {msg && <p className="rounded-xl border border-garnet-700/60 bg-garnet-700/10 px-4 py-3 text-sm text-garnet-200" role="status">{msg}</p>}

      {pwa.platform === 'ios' ? <>{ios}{android}</> : <>{android}{ios}</>}

      <p className="text-xs text-neutral-500 leading-relaxed px-1">Es la misma DaiwaPlace de siempre: tu cuenta, tus mensajes y todo lo tuyo. La app se actualiza sola cada vez que hay una versión nueva; no tienes que volver a instalar nada.</p>
    </div>
  )
}
