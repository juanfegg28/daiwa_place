'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import AppShell, { useAppSession } from '../components/AppShell'
import Logo from '../components/Logo'
import MoonArt from '../components/supporters/MoonArt'
import PayPalSubscribe from '../components/supporters/PayPalSubscribe'
import ManualPayment from '../components/supporters/ManualPayment'
import ColombiaNotice, { looksColombian } from '../components/supporters/ColombiaNotice'
import { supabase } from '../lib/supabaseClient'
import { TIERS, TIER_KEYS, fetchPaypalConfig, type PaypalConfig, type TierKey } from '../lib/supporters'

const FAQ: { q: string; a: string }[] = [
  { q: '¿Qué es el Círculo Lunar?', a: 'Es la forma de apoyar a DaiwaPlace con una mensualidad pequeña. Ese dinero ayuda a mantener el proyecto (servidores, almacenamiento y mejoras) y a cambio recibes ventajas y detalles exclusivos.' },
  { q: '¿Cómo se paga?', a: 'Con PayPal, como suscripción mensual: PayPal cobra solo cada mes y DaiwaPlace activa tu membresía cuando PayPal confirma el pago (no cuando vuelves a la página). También hay un pago manual con PayPal.Me que revisa una persona del equipo.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Desde «Mi membresía» o desde tu cuenta de PayPal. Si cancelas, conservas tus ventajas hasta que termine el mes que ya pagaste.' },
  { q: '¿Qué pasa si cancelo?', a: 'Al terminar el mes dejas de recibir el bono semanal, los descuentos y el límite ampliado de historias. Los cosméticos exclusivos que ya hayas reclamado se quedan contigo.' },
  { q: '¿Y si un pago falla?', a: 'PayPal lo reintenta unos días. Mientras tanto conservas lo que ya pagaste. Si no se logra cobrar, la membresía termina al acabar el período pagado.' },
  { q: '¿Soy de Colombia, qué hago?', a: 'PayPal no permite pagos entre dos cuentas de residentes en Colombia. Escríbele al creador por Discord (@juanfegg28) y buscamos otra vía.' },
  { q: '¿Apoyar me da poderes o acceso a información privada?', a: 'No. Ser Supporter nunca da permisos de administración o moderación ni acceso a datos privados. Tampoco permite saber quién escribió un Susurro anónimo: eso es imposible para cualquiera por pagar.' },
  { q: '¿Hay reembolsos?', a: 'Si PayPal reembolsa o revierte un pago, la membresía de ese pago se corta. Si tuviste un problema con un cobro, escríbeme por Discord y lo revisamos.' },
]

export default function ApoyarPage() {
  const [auth, setAuth] = useState<'loading' | 'in' | 'out'>('loading')
  useEffect(() => {
    let alive = true
    void supabase.auth.getSession().then(({ data }) => alive && setAuth(data.session ? 'in' : 'out'))
    return () => {
      alive = false
    }
  }, [])
  if (auth === 'loading') return <div className="min-h-dvh lunar-bg" />
  if (auth === 'in')
    return (
      <AppShell>
        <InShell />
      </AppShell>
    )
  return (
    <div className="min-h-dvh lunar-bg">
      <header className="max-w-5xl mx-auto px-4 pt-5 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2 text-neutral-50"><Logo /></Link>
        <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm text-neutral-100 hover:bg-white/10">Iniciar sesión</Link>
      </header>
      <ApoyarContent userId={null} />
    </div>
  )
}

function InShell() {
  const { userId } = useAppSession()
  return (
    <div className="lunar-bg min-h-dvh">
      <ApoyarContent userId={userId} />
    </div>
  )
}

function ApoyarContent({ userId }: { userId: string | null }) {
  const [cfg, setCfg] = useState<PaypalConfig | null>(null)
  const [open, setOpen] = useState<TierKey | null>(null)
  const [done, setDone] = useState<'active' | 'pending' | null>(null)
  const [colombian, setColombian] = useState(false)
  const [forceButtons, setForceButtons] = useState(false)

  useEffect(() => {
    let alive = true
    const t = window.setTimeout(() => setColombian(looksColombian()), 0)
    void fetchPaypalConfig().then((c) => alive && setCfg(c))
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [])

  const onDone = useCallback((r: { status: 'active' | 'pending' }) => setDone(r.status), [])
  const hideButtons = colombian && !forceButtons

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <section className="text-center max-w-2xl mx-auto">
        <p className="text-[12px] tracking-[0.25em] uppercase text-violet-300/80">Apoya a DaiwaPlace</p>
        <h1 className="font-display text-4xl sm:text-6xl font-semibold mt-2 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">Círculo Lunar</h1>
        <p className="mt-4 text-neutral-300 leading-relaxed">
          DaiwaPlace es gratis y seguirá siéndolo. Si te gusta y quieres ayudar a mantenerla viva, únete al Círculo Lunar con una mensualidad pequeña
          y recibe ventajas exclusivas como agradecimiento.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[12px] text-neutral-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">☾ Lunas cada semana</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Más historias al día</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Descuentos en la tienda</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Insignia en tu perfil</span>
        </div>
        {userId && (
          <Link href="/apoyar/mi-membresia" className="inline-block mt-5 text-sm text-violet-300 hover:text-violet-200 underline underline-offset-4">Ver mi membresía →</Link>
        )}
      </section>

      {done && (
        <div className="mt-8 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5 text-center">
          <p className="text-lg font-semibold text-emerald-200">{done === 'active' ? '¡Gracias por unirte al Círculo Lunar! 🌙' : '¡Gracias! Estamos confirmando tu pago 🌙'}</p>
          <p className="text-sm text-neutral-300 mt-1">
            {done === 'active' ? 'Tu membresía ya está activa y tu primer bono de Lunas ya llegó.' : 'PayPal aún está procesando el cobro. Tu membresía se activará sola en unos minutos.'}
          </p>
          <Link href="/apoyar/mi-membresia" className="inline-block mt-3 rounded-full bg-white text-black px-5 py-2 text-sm font-semibold">Ir a Mi membresía</Link>
        </div>
      )}

      <div className="mt-8"><ColombiaNotice emphasized={colombian} /></div>

      <section className="mt-8 grid gap-5 md:grid-cols-3" aria-label="Niveles de apoyo">
        {TIER_KEYS.map((k) => {
          const t = TIERS[k]
          const planId = cfg?.plans[k]
          const canAuto = cfg?.mode === 'auto' && !!planId
          return (
            <article key={k} className="lunar-card p-6 pt-7 flex flex-col" style={{ ['--lc' as string]: `${t.accent}66`, ['--lg' as string]: t.glow }}>
              <MoonArt tier={k} className="absolute -top-6 -right-6 w-36 h-36 opacity-95 pointer-events-none" />
              <h2 className="text-3xl font-semibold text-neutral-50 pr-24">{t.name}</h2>
              <p className="mt-1 text-sm text-neutral-300 pr-16 min-h-[2.6em]">{t.tagline}</p>
              {t.includes && <p className="mt-3 text-[12px] text-neutral-400">{t.includes}</p>}
              <ul className="mt-3 space-y-2 flex-1">
                {t.perks.map((p) => (
                  <li key={p.text} className="flex items-start gap-2.5 text-[13.5px] text-neutral-200">
                    <span className="shrink-0 mt-0.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: `${t.accent}26`, color: t.accent }}>{p.label}</span>
                    <span className="min-w-0">
                      {p.text}
                      {p.soon && <span className="ml-1.5 text-[10.5px] text-neutral-500 uppercase tracking-wide">Pronto</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <p className="text-2xl font-semibold text-neutral-50">${t.priceUsd} <span className="text-sm font-normal text-neutral-400">USD / mes</span></p>
                {hideButtons ? (
                  <p className="mt-3 text-xs text-amber-200">Escríbeme por Discord para apoyar (arriba).</p>
                ) : !userId ? (
                  <Link href="/login" className="mt-3 inline-flex w-full justify-center rounded-full py-2.5 text-sm font-semibold text-black" style={{ background: t.accent }}>Inicia sesión para apoyar</Link>
                ) : open === k && canAuto && cfg ? (
                  <PayPalSubscribe clientId={cfg.clientId} planId={planId!} userId={userId} onDone={onDone} />
                ) : canAuto ? (
                  <button type="button" onClick={() => setOpen(k)} className="mt-3 w-full rounded-full py-2.5 text-sm font-semibold text-black transition hover:brightness-110" style={{ background: t.accent }}>
                    Unirme a {t.short}
                  </button>
                ) : cfg ? (
                  <p className="mt-3 text-xs text-neutral-400">Los pagos automáticos todavía no están listos. Mientras tanto puedes usar el pago manual de abajo.</p>
                ) : (
                  <p className="mt-3 text-xs text-neutral-500">Cargando…</p>
                )}
              </div>
            </article>
          )
        })}
      </section>

      {colombian && (
        <p className="mt-3 text-center text-xs text-neutral-500">
          ¿No estás en Colombia?{' '}
          <button type="button" className="underline underline-offset-2" onClick={() => setForceButtons((v) => !v)}>{forceButtons ? 'Ocultar botones de PayPal' : 'Mostrar los botones de PayPal'}</button>
        </p>
      )}

      <section className="mt-10 max-w-3xl mx-auto space-y-4">
        <ManualPayment signedIn={!!userId} />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 text-[13px] text-neutral-400 leading-relaxed">
          El pago se procesa en PayPal; DaiwaPlace nunca ve ni guarda los datos de tu tarjeta. La membresía se activa solo cuando PayPal confirma el cobro.
          Cada mes de suscripción son ~30 días. Ser Supporter no da permisos de moderación ni de administración, ni acceso a información privada.
        </div>
      </section>

      <section className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-neutral-50 mb-3">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-[14.5px] font-medium text-neutral-100">
                {f.q}<span className="text-neutral-500 group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-2 text-sm text-neutral-300 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
