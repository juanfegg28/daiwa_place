'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PAY_METHOD_LABEL, TIERS, TIER_KEYS, tierName, type PayMethod, type TierKey } from '../lib/supporters'

// v1.7.0 · Centro de Mando → Supporters. Todo lo que se hace aquí queda en supporter_admin_log.
// v1.7.2 · Las solicitudes pueden ser de PayPal.Me o de Ko-fi (cada una se comprueba en su sitio).
type Overview = { active: number; by_tier: Record<string, number>; pending_requests: number; pending_paypalme?: number; pending_kofi?: number; payments_30d: number; events_failed: number }
type Sub = { user_id: string; username: string; id_student: string | null; tier: TierKey; status: string; source: string; paid_until: string; started_at: string; active: boolean; hide_badge: boolean }
type Req = { id: string; user_id: string; username: string; id_student: string | null; tier: TierKey; tier_name: string; price_usd: number; months: number; expected_usd: number; reference: string; note: string | null; status: string; created_at: string; reviewed_at: string | null; review_note: string | null; is_renewal: boolean; method: PayMethod }
type Exp = { user_id: string; username: string; id_student: string | null; tier: TierKey; source: string; paid_until: string; days_left: number; pending_request: boolean }
type Row = Record<string, unknown>

const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
const err = (m?: string) => (m && /Could not find the function|schema cache/i.test(m) ? 'Falta correr el SQL más reciente (v1.7.2) en Supabase.' : m ?? 'Error')
const METHOD_CLS: Record<PayMethod, string> = { paypalme: 'bg-[#FFC439]/20 text-[#FFD675]', kofi: 'bg-[#FF5E5B]/20 text-[#FF9C9A]' }

export default function SupportersTab() {
  const [sub, setSub] = useState<'solicitudes' | 'por renovar' | 'suscriptores' | 'historial'>('solicitudes')
  const [ov, setOv] = useState<Overview | null>(null)
  const [msg, setMsg] = useState('')

  const loadOv = useCallback(async () => {
    const { data, error } = await supabase.rpc('supporter_admin_overview')
    if (error) setMsg(err(error.message))
    else setOv(data as Overview)
  }, [])
  useEffect(() => {
    const t = window.setTimeout(() => void loadOv(), 0)
    return () => window.clearTimeout(t)
  }, [loadOv])

  return (
    <div className="space-y-4">
      {msg && <p className="text-sm text-garnet-400">{msg}</p>}
      {ov && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="rounded-xl bg-ink-800 p-3"><p className="text-neutral-500 text-[12px]">Supporters activos</p><p className="text-xl font-semibold text-neutral-50">{ov.active}</p><p className="text-[11px] text-neutral-500">{TIER_KEYS.map((k) => `${TIERS[k].short} ${ov.by_tier[k] ?? 0}`).join(' · ')}</p></div>
          <div className="rounded-xl bg-ink-800 p-3"><p className="text-neutral-500 text-[12px]">Solicitudes manuales</p><p className={`text-xl font-semibold ${ov.pending_requests > 0 ? 'text-amber-300' : 'text-neutral-50'}`}>{ov.pending_requests}</p>{ov.pending_paypalme !== undefined && <p className="text-[11px] text-neutral-500">PayPal.Me {ov.pending_paypalme} · Ko-fi {ov.pending_kofi ?? 0}</p>}</div>
          <div className="rounded-xl bg-ink-800 p-3"><p className="text-neutral-500 text-[12px]">Pagos últimos 30 días</p><p className="text-xl font-semibold text-neutral-50">${Number(ov.payments_30d).toFixed(2)}</p></div>
          <div className="rounded-xl bg-ink-800 p-3"><p className="text-neutral-500 text-[12px]">Avisos de PayPal con error (7 d)</p><p className={`text-xl font-semibold ${ov.events_failed > 0 ? 'text-garnet-400' : 'text-neutral-50'}`}>{ov.events_failed}</p></div>
        </div>
      )}
      <div className="flex gap-1.5">
        {(['solicitudes', 'por renovar', 'suscriptores', 'historial'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setSub(t)} className={`rounded-full px-3.5 py-1.5 text-sm capitalize ${sub === t ? 'bg-white text-black' : 'bg-ink-800 text-neutral-300 hover:bg-ink-700'}`}>{t}</button>
        ))}
      </div>
      {sub === 'solicitudes' && <Requests onChanged={loadOv} />}
      {sub === 'por renovar' && <Expiring />}
      {sub === 'suscriptores' && <Subscribers onChanged={loadOv} />}
      {sub === 'historial' && <Activity />}
    </div>
  )
}

function Requests({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [filter, setFilter] = useState<'all' | PayMethod>('all')
  const [rows, setRows] = useState<Req[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [months, setMonths] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('supporter_admin_requests', { p_status: status })
    if (error) setMsg(err(error.message))
    else setRows((data as Req[]) ?? [])
  }, [status])
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  const review = async (r: Req, approve: boolean) => {
    if (busy) return
    setBusy(r.id)
    setMsg('')
    const { error } = await supabase.rpc('supporter_admin_review', { p_id: r.id, p_approve: approve, p_note: notes[r.id] || null, p_months: approve ? months[r.id] ?? r.months : null })
    setBusy(null)
    if (error) setMsg(err(error.message))
    else {
      void load()
      onChanged()
    }
  }

  const shown = rows && filter !== 'all' ? rows.filter((r) => r.method === filter) : rows
  const count = (m: PayMethod) => (rows ?? []).filter((r) => r.method === m).length

  return (
    <div className="space-y-3">
      <div className="text-[12px] text-neutral-500 space-y-1">
        <p><b className="text-neutral-300">PayPal.Me:</b> abre tu PayPal → Actividad, busca el ID de transacción y comprueba que el pago esté <b>Completado</b> y por el <b>monto esperado</b>.</p>
        <p><b className="text-neutral-300">Ko-fi:</b> abre tu Ko-fi (tu actividad de propinas, o el correo que Ko-fi te manda por cada una) y busca una propina que tenga <b>el código</b> de la solicitud en su mensaje y sea por el <b>monto esperado</b> (en USD).</p>
        <p>Cada mes aprobado da 30 días (se suman a lo que ya tenga) y el bono de la semana.</p>
      </div>
      <div className="flex gap-1.5 text-[12px]">
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 ${status === s ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300'}`}>{s === 'pending' ? 'En revisión' : s === 'approved' ? 'Aprobadas' : 'Rechazadas'}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 text-[12px]" aria-label="Filtrar por método">
        <button type="button" onClick={() => setFilter('all')} className={`rounded-full px-3 py-1 ${filter === 'all' ? 'bg-white text-black' : 'bg-ink-800 text-neutral-300'}`}>Todos{rows ? ` (${rows.length})` : ''}</button>
        {(['paypalme', 'kofi'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setFilter(m)} className={`rounded-full px-3 py-1 ${filter === m ? 'bg-white text-black' : 'bg-ink-800 text-neutral-300'}`}>{PAY_METHOD_LABEL[m]}{rows ? ` (${count(m)})` : ''}</button>
        ))}
      </div>
      {msg && <p className="text-sm text-garnet-400">{msg}</p>}
      {shown === null ? <p className="text-sm text-neutral-500">Cargando…</p> : shown.length === 0 ? <p className="text-sm text-neutral-500">No hay solicitudes aquí.</p> : (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li key={r.id} className="rounded-xl bg-ink-800 p-3 text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-neutral-50 font-medium">
                  {r.id_student || r.username} <span className="text-neutral-500 font-normal">@{r.username}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold align-middle ${METHOD_CLS[r.method ?? 'paypalme']}`}>{PAY_METHOD_LABEL[r.method ?? 'paypalme']}</span>
                </span>
                <span className="text-neutral-300">{r.tier_name} · {r.months} {r.months === 1 ? 'mes' : 'meses'} · esperado <b className="text-neutral-50">${Number(r.expected_usd).toFixed(2)} USD</b>{r.is_renewal ? ' · renovación' : ' · nueva'}</span>
              </div>
              <p className="text-neutral-400 text-[12px]">
                {r.method === 'kofi' ? 'Código en el mensaje de la propina de Ko-fi' : 'ID de transacción'}: <span className="font-mono text-neutral-200 select-all">{r.reference}</span> · {fmt(r.created_at)}
              </p>
              {r.note && <p className="text-[12px] text-neutral-400">Nota: {r.note}</p>}
              {r.status === 'pending' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select value={months[r.id] ?? r.months} onChange={(e) => setMonths((m) => ({ ...m, [r.id]: Number(e.target.value) }))} aria-label="Meses a aprobar" className="rounded-lg bg-ink-900 border border-ink-600 px-2 py-2 text-[16px]">
                    {[1, 2, 3, 4, 5, 6, 9, 12].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'mes' : 'meses'}</option>)}
                  </select>
                  <input value={notes[r.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value.slice(0, 200) }))} placeholder="Nota para la persona (opcional)" className="flex-1 min-w-[10rem] rounded-lg bg-ink-900 border border-ink-600 px-3 py-2 text-[16px]" />
                  <button type="button" disabled={busy === r.id} onClick={() => review(r, true)} className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 disabled:opacity-60">Aprobar</button>
                  <button type="button" disabled={busy === r.id} onClick={() => review(r, false)} className="rounded-full border border-garnet-600/60 text-garnet-300 px-4 py-2 disabled:opacity-60">Rechazar</button>
                </div>
              ) : <p className="text-[12px] text-neutral-500">Revisada {fmt(r.reviewed_at)}{r.review_note ? ` · ${r.review_note}` : ''}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Subscribers({ onChanged }: { onChanged: () => void }) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Sub[] | null>(null)
  const [msg, setMsg] = useState('')
  // formulario de ajuste manual
  const [target, setTarget] = useState('')
  const [tier, setTier] = useState<TierKey | ''>('llena')
  const [days, setDays] = useState(30)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('supporter_admin_list', { p_query: q || null, p_limit: 60 })
    if (error) setMsg(err(error.message))
    else setRows((data as Sub[]) ?? [])
  }, [q])
  useEffect(() => {
    const t = window.setTimeout(() => void load(), q ? 300 : 0)
    return () => window.clearTimeout(t)
  }, [load, q])

  const apply = async (remove: boolean) => {
    const username = target.trim().replace(/^@/, '').toLowerCase()
    if (!username || busy) return
    setBusy(true)
    setMsg('')
    const { data: prof } = await supabase.from('profiles').select('id').ilike('username', username).maybeSingle()
    if (!prof) {
      setBusy(false)
      setMsg('No existe esa persona (escribe su @usuario exacto).')
      return
    }
    const { error } = await supabase.rpc('supporter_admin_set', { p_user: prof.id, p_tier: remove ? null : tier || null, p_days: remove ? null : days, p_reason: reason })
    setBusy(false)
    if (error) setMsg(err(error.message))
    else {
      setMsg(remove ? 'Membresía quitada.' : 'Membresía concedida/extendida.')
      setReason('')
      void load()
      onChanged()
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-ink-800 p-3 space-y-2">
        <p className="text-sm font-medium text-neutral-100">Ajuste manual</p>
        <div className="flex flex-wrap gap-2">
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="@usuario" className="rounded-lg bg-ink-900 border border-ink-600 px-3 py-2 text-[16px] w-40" />
          <select value={tier} onChange={(e) => setTier(e.target.value as TierKey)} className="rounded-lg bg-ink-900 border border-ink-600 px-3 py-2 text-[16px]">
            {TIER_KEYS.map((k) => <option key={k} value={k}>{TIERS[k].name}</option>)}
          </select>
          <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg bg-ink-900 border border-ink-600 px-3 py-2 text-[16px] w-24" aria-label="Días" />
        </div>
        <input value={reason} onChange={(e) => setReason(e.target.value.slice(0, 200))} placeholder="Motivo (obligatorio, queda registrado)" className="w-full rounded-lg bg-ink-900 border border-ink-600 px-3 py-2 text-[16px]" />
        <div className="flex gap-2">
          <button type="button" disabled={busy || reason.trim().length < 3 || !target.trim()} onClick={() => apply(false)} className="rounded-full bg-garnet-600 text-white px-4 py-2 text-sm disabled:opacity-50">Dar / extender días</button>
          <button type="button" disabled={busy || reason.trim().length < 3 || !target.trim()} onClick={() => apply(true)} className="rounded-full border border-garnet-600/60 text-garnet-300 px-4 py-2 text-sm disabled:opacity-50">Quitar membresía</button>
        </div>
        {msg && <p className="text-sm text-amber-200">{msg}</p>}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar suscriptor por @usuario o nombre" className="w-full rounded-xl bg-ink-800 border border-ink-700 px-3 py-2.5 text-[16px]" />
      {rows === null ? <p className="text-sm text-neutral-500">Cargando…</p> : rows.length === 0 ? <p className="text-sm text-neutral-500">Sin resultados.</p> : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.user_id} className="rounded-xl bg-ink-800 px-3 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2">
              <span className="text-neutral-100">{r.id_student || r.username} <span className="text-neutral-500">@{r.username}</span></span>
              <span className="text-[12px] text-neutral-400">{tierName(r.tier)} · {r.source} · <span className={r.active ? 'text-emerald-300' : 'text-neutral-500'}>{r.status}</span> · hasta {fmt(r.paid_until)}{r.hide_badge ? ' · insignia oculta' : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Activity() {
  const [kind, setKind] = useState<'payments' | 'grants' | 'log' | 'events'>('payments')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    setRows(null)
    const { data, error } = await supabase.rpc('supporter_admin_activity', { p_kind: kind, p_limit: 80 })
    if (error) setMsg(err(error.message))
    else setRows((data as Row[]) ?? [])
  }, [kind])
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])
  const LABEL = { payments: 'Pagos', grants: 'Bonos semanales', log: 'Registro de cambios', events: 'Avisos de PayPal' }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 text-[12px]">
        {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-full px-3 py-1 ${kind === k ? 'bg-garnet-600 text-white' : 'bg-ink-800 text-neutral-300'}`}>{LABEL[k]}</button>
        ))}
      </div>
      {msg && <p className="text-sm text-garnet-400">{msg}</p>}
      {rows === null ? <p className="text-sm text-neutral-500">Cargando…</p> : rows.length === 0 ? <p className="text-sm text-neutral-500">Aún no hay nada.</p> : (
        <ul className="space-y-1.5 text-[12.5px]">
          {rows.map((r, i) => (
            <li key={i} className="rounded-lg bg-ink-800 px-3 py-2 text-neutral-300 break-words">
              {Object.entries(r).filter(([, v]) => v !== null && v !== '').map(([k, v]) => (
                <span key={k} className="mr-3 inline-block"><span className="text-neutral-500">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : /_at$/.test(k) ? fmt(String(v)) : String(v)}</span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


function Expiring() {
  const [rows, setRows] = useState<Exp[] | null>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    let alive = true
    void supabase.rpc('supporter_admin_expiring', { p_days: 10 }).then(({ data, error }) => {
      if (!alive) return
      if (error) setMsg(err(error.message))
      else setRows((data as Exp[]) ?? [])
    })
    return () => {
      alive = false
    }
  }, [])
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-neutral-500">Quiénes vencen en los próximos 10 días o vencieron hace poco (14 días). Escríbeles (Discord) para recordarles que renueven; cuando paguen les llegará una solicitud nueva.</p>
      {msg && <p className="text-sm text-garnet-400">{msg}</p>}
      {rows === null ? <p className="text-sm text-neutral-500">Cargando…</p> : rows.length === 0 ? <p className="text-sm text-neutral-500">Nadie vence pronto. 🌙</p> : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.user_id} className="rounded-xl bg-ink-800 px-3 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2">
              <span className="text-neutral-100">{r.id_student || r.username} <span className="text-neutral-500">@{r.username}</span> · {tierName(r.tier)}</span>
              <span className={`text-[12px] ${r.days_left < 0 ? 'text-garnet-400' : r.days_left <= 3 ? 'text-amber-300' : 'text-neutral-400'}`}>
                {r.days_left < 0 ? `venció hace ${Math.abs(r.days_left)} d` : r.days_left === 0 ? 'vence hoy' : `vence en ${r.days_left} d`} · {fmt(r.paid_until)}{r.pending_request ? ' · ya envió un pago' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
