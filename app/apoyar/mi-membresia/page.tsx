'use client'

import Link from 'next/link'
import SupporterTabs from '../../components/supporters/SupporterTabs'
import { useCallback, useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import MoonArt from '../../components/supporters/MoonArt'
import DecoStrip from '../../components/supporters/DecoStrip'
import { MoonCoinIcon } from '../../components/icons'
import {
  PAY_METHOD_LABEL, TIERS, cancelSubscription, claimAllPerks, claimPerk, fetchSupporterMe, setHideBadge, tierName, type SupporterMe,
} from '../../lib/supporters'

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  active: { text: 'Activa', cls: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30' },
  cancelled: { text: 'Cancelada · activa hasta el fin del mes pagado', cls: 'bg-amber-400/15 text-amber-200 border-amber-400/30' },
  past_due: { text: 'Pago pendiente · conserva lo ya pagado', cls: 'bg-amber-400/15 text-amber-200 border-amber-400/30' },
  expired: { text: 'Vencida', cls: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30' },
  suspended: { text: 'Suspendida', cls: 'bg-garnet-600/15 text-garnet-300 border-garnet-600/30' },
}
const SOURCE_LABEL: Record<string, string> = { paypal: 'PayPal', manual: 'Pago manual (PayPal.Me o Ko-fi)', admin: 'Concedida por el equipo' }
/** Etiqueta de un pago: si se sabe el método (PayPal.Me / Ko-fi) se muestra ese; si no, el origen. */
const payLabel = (source: string, method?: string | null) =>
  method && method in PAY_METHOD_LABEL ? `${PAY_METHOD_LABEL[method as keyof typeof PAY_METHOD_LABEL]} (manual)` : SOURCE_LABEL[source] ?? source
const PAY_STATUS: Record<string, string> = { completed: 'Completado', refunded: 'Reembolsado', reversed: 'Revertido', failed: 'Fallido' }
const REQ_STATUS: Record<string, string> = { pending: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada' }

export default function MiMembresiaPage() {
  return (
    <AppShell>
      <Content />
    </AppShell>
  )
}

function nextMonday(weekStart: string): string {
  // week_start es el lunes de esta semana (hora de Colombia); el próximo bono es el lunes siguiente a las 00:00 de Colombia
  const d = new Date(`${weekStart}T00:00:00-05:00`)
  d.setDate(d.getDate() + 7)
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' })
}

function Content() {
  const [me, setMe] = useState<SupporterMe | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [note, setNote] = useState('')
  const [nowMs, setNowMs] = useState(0)

  const load = useCallback(async () => {
    const r = await fetchSupporterMe()
    if (r.error) setError(r.error)
    else {
      setError('')
      setNowMs(Date.now())
      setMe(r.data)
    }
  }, [])
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  if (error) return <div className="max-w-2xl mx-auto px-4 py-10"><p className="text-garnet-400 text-sm">{error}</p></div>
  if (!me) return <div className="max-w-2xl mx-auto px-4 py-10"><p className="text-neutral-500 text-sm">Cargando…</p></div>

  const m = me.membership
  const tier = m ? TIERS[m.tier] : null
  const active = !!m?.active
  const st = m ? STATUS_LABEL[m.status] : null

  const toggleHide = async () => {
    if (!m || busy) return
    setBusy(true)
    const err = await setHideBadge(!m.hide_badge)
    setBusy(false)
    if (err) setNote(err)
    else void load()
  }
  const doCancel = async () => {
    setBusy(true)
    setNote('')
    const r = await cancelSubscription()
    setBusy(false)
    setConfirmCancel(false)
    setNote(r.ok ? 'Listo: tu suscripción se canceló. Conservas tus ventajas hasta que termine el mes pagado.' : r.message ?? 'No se pudo cancelar.')
    void load()
  }
  const claim = async (code: string) => {
    setBusy(true)
    const err = await claimPerk(code)
    setBusy(false)
    setNote(err ?? '¡Reclamado! Lo encontrarás en Personalizar.')
    void load()
  }

  const claimAll = async () => {
    setBusy(true)
    const r = await claimAllPerks()
    setBusy(false)
    setNote(r.error ?? (r.claimed > 0 ? `¡Listo! Reclamaste ${r.claimed} ${r.claimed === 1 ? 'beneficio' : 'beneficios'}. Los encontrarás en Personalizar.` : 'Ya tienes todo lo de tu nivel.'))
    void load()
  }

  return (
    <div className="lunar-bg min-h-dvh">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <SupporterTabs active="membresia" signedIn />
        <div>
          <h1 className="font-display text-3xl font-semibold text-neutral-50">Mi membresía</h1>
          <p className="text-sm text-neutral-400 mt-1">Círculo Lunar · <Link href="/apoyar" className="underline underline-offset-2">ver niveles</Link> · <Link href="/apoyar/estilos" className="underline underline-offset-2">ver todos los estilos</Link></p>
        </div>

        {note && <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200">{note}</p>}

        {/* Estado actual */}
        <section className="lunar-card p-6" style={{ ['--lc' as string]: `${tier?.accent ?? '#ffffff'}55`, ['--lg' as string]: tier?.glow }}>
          {tier && <MoonArt tier={tier.key} className="absolute -top-6 -right-6 w-32 h-32 pointer-events-none" />}
          {m && tier ? (
            <>
              <p className="text-[12px] uppercase tracking-widest text-neutral-400">Tu nivel</p>
              <h2 className="text-3xl font-semibold text-neutral-50 pr-24">{tier.name}</h2>
              {st && <span className={`inline-block mt-2 rounded-full border px-3 py-1 text-[12px] ${st.cls}`}>{st.text}</span>}
              <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-black/25 p-3">
                  <dt className="text-neutral-500 text-[12px]">{m.status === 'active' && m.source === 'paypal' ? 'Próxima renovación' : active ? 'Cubierta hasta' : 'Terminó el'}</dt>
                  <dd className="text-neutral-100 font-medium">{fmtDate(m.paid_until)}</dd>
                </div>
                <div className="rounded-xl bg-black/25 p-3">
                  <dt className="text-neutral-500 text-[12px]">Cómo pagas</dt>
                  <dd className="text-neutral-100 font-medium">{payLabel(m.source, me.payments.find((p) => p.source === 'manual' && p.method)?.method)}</dd>
                </div>
                <div className="rounded-xl bg-black/25 p-3">
                  <dt className="text-neutral-500 text-[12px]">Historias por día</dt>
                  <dd className="text-neutral-100 font-medium">{active ? tier.stories : 3}</dd>
                </div>
                <div className="rounded-xl bg-black/25 p-3">
                  <dt className="text-neutral-500 text-[12px]">Descuento en la tienda</dt>
                  <dd className="text-neutral-100 font-medium">{active ? `${tier.discountPct} %` : '—'}</dd>
                </div>
              </dl>
              {active && m.source !== 'paypal' && nowMs > 0 && Date.parse(m.paid_until) - nowMs < 7 * 86400_000 && (
                <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm">
                  <p className="text-amber-100">Tu período termina pronto ({fmtDate(m.paid_until)}). Para seguir con tus ventajas, renueva: los meses nuevos se suman a lo que te quede.</p>
                  <Link href={`/apoyar?tier=${m.tier}`} className="inline-block mt-2 rounded-full bg-white text-black px-4 py-1.5 text-[13px] font-semibold">Renovar</Link>
                </div>
              )}
              {me.requests.some((r) => r.status === 'pending') && (
                <p className="mt-3 rounded-xl bg-black/25 p-3 text-sm text-neutral-200">Tienes un pago <b>en revisión</b>. Cuando se compruebe, tu membresía se activa o se extiende.</p>
              )}
              {active && (
                <div className="mt-3 rounded-xl bg-black/25 p-3 text-sm flex items-center gap-2">
                  <MoonCoinIcon className="w-5 h-5 text-amber-300 shrink-0" />
                  <p className="text-neutral-200">
                    {me.weekly_granted ? <>Ya recibiste tus <b>{tier.weeklyLunas.toLocaleString('es-CO')} Lunas</b> de esta semana. </> : <>Tu bono es de <b>{tier.weeklyLunas.toLocaleString('es-CO')} Lunas</b> por semana. </>}
                    <span className="text-neutral-400">Próximo bono: {nextMonday(me.week_start)} (hora de Colombia).</span>
                  </p>
                </div>
              )}
              {!active && <Link href="/apoyar" className="inline-block mt-4 rounded-full bg-white text-black px-5 py-2 text-sm font-semibold">Renovar mi membresía</Link>}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-neutral-50 pr-24">Aún no eres Supporter</h2>
              <p className="text-sm text-neutral-300 mt-2">Únete al Círculo Lunar y recibe Lunas cada semana, más historias, descuentos y una insignia en tu perfil.</p>
              <Link href="/apoyar" className="inline-block mt-4 rounded-full bg-white text-black px-5 py-2 text-sm font-semibold">Ver niveles</Link>
            </>
          )}
        </section>

        {/* Gestión */}
        {m && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <h2 className="text-base font-semibold text-neutral-50">Gestionar</h2>
            <label className="flex items-center justify-between gap-4 text-sm text-neutral-200">
              <span>
                Mostrar mi insignia de Supporter
                <span className="block text-[12px] text-neutral-500">Si la ocultas, sigues teniendo todos tus beneficios.</span>
              </span>
              <button type="button" role="switch" aria-checked={!m.hide_badge} onClick={toggleHide} disabled={busy}
                className={`relative w-12 h-7 rounded-full transition ${!m.hide_badge ? 'bg-garnet-600' : 'bg-ink-700'} disabled:opacity-60`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${!m.hide_badge ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </label>
            {m.has_subscription && m.status === 'active' && (
              !confirmCancel ? (
                <button type="button" onClick={() => setConfirmCancel(true)} className="text-sm text-garnet-400 hover:text-garnet-300 underline underline-offset-2">Cancelar mi suscripción</button>
              ) : (
                <div className="rounded-xl border border-garnet-600/40 bg-garnet-600/10 p-4 text-sm">
                  <p className="text-neutral-100">¿Seguro? Dejarás de pagar y conservarás tus ventajas hasta el {fmtDate(m.paid_until)}.</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={doCancel} disabled={busy} className="rounded-full bg-garnet-600 text-white px-4 py-2 disabled:opacity-60">{busy ? 'Cancelando…' : 'Sí, cancelar'}</button>
                    <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-full border border-white/20 px-4 py-2 text-neutral-200">Mantenerla</button>
                  </div>
                </div>
              )
            )}
            {m.has_subscription && <p className="text-[12px] text-neutral-500">También puedes gestionarla desde tu cuenta de PayPal → Pagos automáticos.</p>}
          </section>
        )}

        {/* Beneficios cosméticos */}
        {(() => {
          const decos = me.perks.filter((p) => p.kind === 'decoration' && p.slug)
          const others = me.perks.filter((p) => !(p.kind === 'decoration' && p.slug))
          const pending = me.perks.filter((p) => p.available && p.unlocked && !p.claimed).length
          const total = decos.length
          const have = decos.filter((p) => p.claimed).length
          return (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-neutral-50">Cosméticos míticos de miembros</h2>
                  <p className="text-[12px] text-neutral-500">{me.perks.filter((p) => p.claimed).length} de {me.perks.filter((p) => p.available).length} entregados ({have}/{total} decoraciones) · cada uno con 10 paletas y color libre. Se entregan solos al tener tu nivel (no hace falta reclamar ni volver a pagar) y se quedan contigo aunque canceles. Ponlos en Personalizar.</p>
                </div>
                {pending > 0 && <button type="button" disabled={busy} onClick={claimAll} className="rounded-full bg-white text-black px-4 py-2 text-[13px] font-semibold disabled:opacity-60">Entregar los {pending} pendientes</button>}
              </div>
              {(['creciente', 'llena', 'eclipse'] as const).map((tk) => {
                const group = decos.filter((p) => p.min_tier === tk)
                if (group.length === 0) return null
                const locked = group.every((p) => !p.unlocked)
                return (
                  <div key={tk} className="mt-5">
                    <h3 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: TIERS[tk].accent }}>{TIERS[tk].name}{locked ? ' · sube de nivel para desbloquear' : ''}</h3>
                    <div className={locked ? 'opacity-55' : ''}>
                      <DecoStrip decos={group.map((p) => ({ slug: p.slug as string, name: p.name.replace(/^Decoración /, '') }))} offset={TIERS[tk].rank * 2} claimedSlugs={new Set(group.filter((p) => p.claimed).map((p) => p.slug as string))} />
                    </div>
                    <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {group.map((p) => (
                        <li key={p.code} className="flex items-center justify-between gap-2 text-[13px] rounded-xl bg-black/20 px-3 py-2">
                          <span className="min-w-0 truncate text-neutral-100">{p.name.replace(/^Decoración /, '')}</span>
                          {p.claimed ? <span className="text-[12px] text-emerald-300 shrink-0">Tuya ✓</span>
                            : p.available && p.unlocked ? <button type="button" disabled={busy} onClick={() => claim(p.code)} className="rounded-full bg-white text-black px-3 py-1 text-[12px] font-semibold disabled:opacity-60 shrink-0">Reclamar</button>
                            : <span className="text-[11px] uppercase tracking-wide text-neutral-500 shrink-0">{p.available ? 'Sube de nivel' : 'Pronto'}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
              {others.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Tarjetas, efectos y títulos</h3>
                  <ul className="mt-2 space-y-1.5">
                    {others.map((p) => (
                      <li key={p.code} className="flex items-center justify-between gap-3 text-[13px] rounded-xl bg-black/20 px-3 py-2">
                        <span className="min-w-0 text-neutral-200">{p.name}<span className="block text-[11px] text-neutral-500">Desde {tierName(p.min_tier)} · 10 paletas y color libre</span></span>
                        {p.claimed ? <span className="text-[12px] text-emerald-300">Tuyo ✓</span>
                          : p.available && !p.unlocked ? <span className="text-[11px] uppercase tracking-wide text-neutral-500">Sube de nivel</span>
                          : p.available && p.unlocked ? <button type="button" disabled={busy} onClick={() => claim(p.code)} className="rounded-full bg-white text-black px-3 py-1 text-[12px] font-semibold disabled:opacity-60">Reclamar</button>
                          : <span className="text-[11px] uppercase tracking-wide text-neutral-500">Pronto</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )
        })()}

        {/* Historial */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-neutral-50 mb-3">Historial de pagos</h2>
          {me.payments.length === 0 ? <p className="text-sm text-neutral-500">Todavía no hay pagos.</p> : (
            <ul className="divide-y divide-white/5 text-sm">
              {me.payments.map((p, i) => (
                <li key={i} className="py-2 flex items-center justify-between gap-3">
                  <span className="text-neutral-200">{tierName(p.tier)} · {fmtDate(p.paid_at)}<span className="block text-[11px] text-neutral-500">{payLabel(p.source, p.method)}</span></span>
                  <span className="text-right text-neutral-100">${Number(p.amount).toFixed(2)} {p.currency}<span className={`block text-[11px] ${p.status === 'completed' ? 'text-emerald-300' : 'text-amber-200'}`}>{PAY_STATUS[p.status] ?? p.status}</span></span>
                </li>
              ))}
            </ul>
          )}
          {me.requests.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-neutral-200 mt-4 mb-2">Solicitudes de pago manual</h3>
              <ul className="space-y-1.5 text-sm">
                {me.requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-neutral-300">
                    <span>{tierName(r.tier)}{r.method && r.method in PAY_METHOD_LABEL ? ` · ${PAY_METHOD_LABEL[r.method]}` : ''} · {fmtDate(r.created_at)}{r.review_note && <span className="block text-[11px] text-neutral-500">{r.review_note}</span>}</span>
                    <span className={`text-[12px] ${r.status === 'approved' ? 'text-emerald-300' : r.status === 'rejected' ? 'text-garnet-400' : 'text-amber-200'}`}>{REQ_STATUS[r.status]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
