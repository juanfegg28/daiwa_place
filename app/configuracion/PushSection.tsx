'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { disablePush, enablePush, sendTestPush, usePushState, type EnableResult } from '../lib/push'
import type { ConfigProfile } from './types'

const MSG: Record<EnableResult, string> = {
  ok: '',
  denied: 'No diste permiso. Si cambias de idea, actívalo en los ajustes del navegador o de la app (Notificaciones) y vuelve a tocar el botón.',
  unsupported: 'Este navegador no permite notificaciones. Prueba con Chrome en Android, o instala la app.',
  'needs-install': 'En iPhone primero tienes que instalar DaiwaPlace en tu pantalla de inicio.',
  'no-key': 'Las notificaciones todavía no están configuradas en el servidor (falta la clave). Avisa al equipo.',
  'no-sw': 'La app todavía no terminó de prepararse. Espera unos segundos y vuelve a intentarlo.',
  error: 'No se pudo activar. Revisa tu conexión y vuelve a intentarlo.',
}

function Switch({ on, busy, onClick, label }: { on: boolean; busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} role="switch" aria-checked={on} aria-label={label} className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-60 ${on ? 'bg-garnet-600' : 'bg-ink-600'}`}>
      <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

/** v1.6.1 · Notificaciones en el celular (como WhatsApp): activar/desactivar en este dispositivo, probar y qué mostrar. */
export default function PushSection({ profile, onUpdate }: { profile: ConfigProfile; onUpdate: (p: ConfigProfile) => void }) {
  const st = usePushState()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  const prefs = profile.notif_prefs
  const dmOn = prefs.dm !== false
  const previewOn = prefs.push_preview !== false

  const toggle = async (key: 'dm' | 'push_preview') => {
    setSaving(key)
    const next = { ...prefs, [key]: !(prefs[key] !== false) }
    const { error } = await supabase.from('profiles').update({ notif_prefs: next }).eq('id', profile.id)
    setSaving(null)
    if (!error) onUpdate({ ...profile, notif_prefs: next })
  }

  const activate = async () => {
    setBusy(true)
    setMsg('')
    const r = await enablePush()
    setBusy(false)
    if (r !== 'ok') setMsg(MSG[r])
    st.refresh()
  }
  const deactivate = async () => {
    setBusy(true)
    setMsg('')
    await disablePush()
    setBusy(false)
    setMsg('Listo: este dispositivo ya no recibirá notificaciones.')
    st.refresh()
  }
  const test = async () => {
    setBusy(true)
    setMsg('')
    const r = await sendTestPush()
    setBusy(false)
    setMsg(
      r === 'ok' ? 'Enviada. Debería llegarte en unos segundos (si estás mirando la app, la notificación igual aparece para la prueba).'
      : r === 'sin-dispositivos' ? 'Este dispositivo todavía no está registrado. Toca «Activar» primero.'
      : r === 'config' ? 'El servidor todavía no tiene las claves de las notificaciones. Avisa al equipo.'
      : r === 'no-llego' ? 'El servidor no pudo entregarla. Desactiva y vuelve a activar las notificaciones.'
      : 'No se pudo enviar la prueba. Vuelve a intentarlo.',
    )
  }

  return (
    <section className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold text-neutral-50 mb-1">Notificaciones en tu celular</h2>
      <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">Recibe un aviso en el celular cuando alguien te escribe o interactúa contigo, aunque tengas la app cerrada, como en WhatsApp.</p>

      {!st.ready ? (
        <p className="text-sm text-neutral-500">Revisando…</p>
      ) : st.needsInstall ? (
        <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-3.5 text-sm text-neutral-300">
          En iPhone y iPad las notificaciones funcionan solo si DaiwaPlace está <b>instalada en tu pantalla de inicio</b> (iOS 16.4 o más nuevo). <Link href="/descargar" className="text-garnet-300 underline">Cómo instalarla</Link>, y luego vuelve aquí desde la app.
        </div>
      ) : !st.supported ? (
        <p className="rounded-xl border border-ink-700 bg-ink-900/60 p-3.5 text-sm text-neutral-300">Este navegador no permite notificaciones. En Android usa Chrome o instala la app desde <Link href="/descargar" className="text-garnet-300 underline">Descargar app</Link>.</p>
      ) : st.permission === 'denied' ? (
        <p className="rounded-xl border border-amber-600/40 bg-amber-600/10 p-3.5 text-sm text-amber-200">Bloqueaste las notificaciones de DaiwaPlace. Para volver a activarlas: abre los <b>ajustes del navegador o de la app</b> → Notificaciones → permitir, y vuelve aquí.</p>
      ) : st.subscribed && st.permission === 'granted' ? (
        <div className="space-y-3">
          <p className="rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-3.5 py-2.5 text-sm text-emerald-300">✓ Activadas en este dispositivo</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={test} disabled={busy} className="press rounded-full border border-ink-600 px-4 py-2 text-sm text-neutral-200 hover:bg-ink-800 transition disabled:opacity-60">Enviar notificación de prueba</button>
            <button type="button" onClick={deactivate} disabled={busy} className="press rounded-full border border-ink-700 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-ink-800 transition disabled:opacity-60">Desactivar en este dispositivo</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={activate} disabled={busy} className="press rounded-full bg-garnet-600 hover:bg-garnet-500 text-white font-semibold text-sm px-5 py-2.5 transition disabled:opacity-60">{busy ? 'Activando…' : 'Activar notificaciones'}</button>
      )}

      {msg && <p className="mt-3 text-sm text-neutral-300 leading-relaxed" role="status">{msg}</p>}

      <div className="mt-5 space-y-1">
        <div className="flex items-center justify-between gap-4 py-3 border-t border-ink-800">
          <div>
            <p className="text-sm font-medium text-neutral-100">Mensajes directos</p>
            <p className="text-xs text-neutral-500">Que te avise en el celular cuando alguien te escribe.</p>
          </div>
          <Switch on={dmOn} busy={saving === 'dm'} onClick={() => toggle('dm')} label="Avisar de mensajes directos" />
        </div>
        <div className="flex items-center justify-between gap-4 py-3 border-t border-ink-800">
          <div>
            <p className="text-sm font-medium text-neutral-100">Mostrar el texto del mensaje</p>
            <p className="text-xs text-neutral-500">Si lo apagas, la notificación solo dice «Te envió un mensaje» (nadie ve el contenido en tu pantalla de bloqueo).</p>
          </div>
          <Switch on={previewOn} busy={saving === 'push_preview'} onClick={() => toggle('push_preview')} label="Mostrar el texto del mensaje en la notificación" />
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-500 leading-relaxed">Los demás avisos (comentarios, likes, seguidores, Muro…) siguen los interruptores de abajo: lo que apagues ahí tampoco te llega al celular.</p>
    </section>
  )
}
