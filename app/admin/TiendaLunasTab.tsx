'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppSession } from '../components/AppShell'
import { supabase } from '../lib/supabaseClient'
import { REASON_LABELS, formatNumber } from '../lib/economy'

type Sub = 'codigos' | 'misiones' | 'economia' | 'ajuste' | 'ajustes'

const input = 'w-full rounded-lg bg-ink-950 border border-ink-700 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-garnet-500'
const btn = 'press rounded-lg bg-garnet-600 hover:bg-garnet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition'
const btn2 = 'rounded-lg border border-ink-600 text-neutral-200 text-sm px-3 py-1.5 hover:bg-ink-800 transition'

export default function TiendaLunasTab() {
  const { isSupreme, permissions } = useAppSession()
  const can = (k: 'manage_shop' | 'manage_codes' | 'adjust_coins') => isSupreme || !!permissions[k]
  const subs: { id: Sub; label: string; ok: boolean }[] = [
    { id: 'codigos', label: 'Códigos', ok: can('manage_codes') },
    { id: 'misiones', label: 'Misiones', ok: can('manage_shop') },
    { id: 'economia', label: 'Economía', ok: can('manage_shop') },
    { id: 'ajuste', label: 'Ajuste manual', ok: can('adjust_coins') || can('manage_shop') },
    { id: 'ajustes', label: 'Ajustes', ok: can('manage_shop') },
  ]
  const available = subs.filter((s) => s.ok)
  const [sub, setSub] = useState<Sub | null>(null)
  const cur = sub ?? available[0]?.id ?? null
  if (!cur) return <p className="text-sm text-neutral-500">No tienes permisos en esta sección.</p>

  return (
    <div>
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {available.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)} className={`px-3.5 py-1.5 rounded-full text-sm border transition ${cur === s.id ? 'bg-garnet-600 text-white border-garnet-500' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>
            {s.label}
          </button>
        ))}
      </div>
      {cur === 'codigos' && <CodesPanel />}
      {cur === 'misiones' && <MissionsPanel />}
      {cur === 'economia' && <EconomyPanel />}
      {cur === 'ajuste' && <AdjustPanel />}
      {cur === 'ajustes' && <SettingsPanel />}
    </div>
  )
}

// ─────────────────────────── CÓDIGOS ───────────────────────────
type CodeRow = {
  id: string; code: string; description: string | null; lunas: number; max_redemptions: number | null; max_per_user: number
  redeemed_count: number; starts_at: string | null; expires_at: string | null; min_account_age_days: number
  active: boolean; created_at: string; status: string
}

function toIso(v: string): string | null {
  return v ? new Date(v).toISOString() : null
}

function CodesPanel() {
  const [list, setList] = useState<CodeRow[]>([])
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [who, setWho] = useState<{ username: string; id_student: string | null; redeemed_at: string; lunas_granted: number }[]>([])

  // formulario
  const [code, setCode] = useState('')
  const [lunas, setLunas] = useState('100')
  const [desc, setDesc] = useState('')
  const [max, setMax] = useState('')
  const [perUser, setPerUser] = useState('1')
  const [starts, setStarts] = useState('')
  const [expires, setExpires] = useState('')
  const [minAge, setMinAge] = useState('0')
  // lote
  const [bPrefix, setBPrefix] = useState('')
  const [bCount, setBCount] = useState('10')
  const [bLunas, setBLunas] = useState('100')
  const [bDesc, setBDesc] = useState('')
  const [bExp, setBExp] = useState('')
  const [batch, setBatch] = useState<string[]>([])

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_code_list', { p_filter: filter, p_search: search || null, p_limit: 200, p_offset: 0 })
    if (error) setMsg(error.message)
    else setList((data as CodeRow[]) ?? [])
  }, [filter, search])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function create() {
    setBusy(true)
    setMsg(null)
    const { data, error } = await supabase.rpc('admin_code_create', {
      p_code: code || null, p_lunas: Number(lunas), p_description: desc || null, p_max: max ? Number(max) : null,
      p_per_user: Number(perUser) || 1, p_starts: toIso(starts), p_expires: toIso(expires), p_min_age: Number(minAge) || 0, p_active: true,
    })
    setBusy(false)
    if (error) return setMsg(error.message)
    setMsg(`Código creado: ${(data as { code: string }).code}`)
    setCode('')
    load()
  }

  async function createBatch() {
    setBusy(true)
    setMsg(null)
    const { data, error } = await supabase.rpc('admin_code_create_batch', {
      p_prefix: bPrefix, p_count: Number(bCount), p_lunas: Number(bLunas), p_description: bDesc || null, p_expires: toIso(bExp), p_min_age: 0,
    })
    setBusy(false)
    if (error) return setMsg(error.message)
    setBatch((data as { codes: string[] }).codes)
    setMsg(`Se crearon ${(data as { codes: string[] }).codes.length} códigos de un solo uso`)
    load()
  }

  function exportCsv() {
    const csv = 'codigo,lunas\n' + batch.map((c) => `${c},${bLunas}`).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'codigos-daiwaplace.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function act(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await fn()
    if (error) setMsg(error.message)
    load()
  }

  async function showWho(id: string) {
    if (open === id) return setOpen(null)
    const { data } = await supabase.rpc('admin_code_redemptions', { p_id: id })
    setWho((data as typeof who) ?? [])
    setOpen(id)
  }

  const statusColor: Record<string, string> = { activo: 'text-emerald-400', vencido: 'text-neutral-500', agotado: 'text-amber-400', desactivado: 'text-red-400', pendiente: 'text-sky-400' }

  return (
    <div className="space-y-6">
      {msg && <p className="text-sm rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-neutral-200">{msg}</p>}

      <section className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4">
        <h3 className="font-semibold text-neutral-50 mb-3">Crear código</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-400">Código (vacío = generar al azar)
            <input className={input + ' mt-1 font-mono uppercase'} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BIENVENIDA2026" maxLength={32} />
          </label>
          <label className="text-xs text-neutral-400">Lunas que da
            <input className={input + ' mt-1'} type="number" min={0} value={lunas} onChange={(e) => setLunas(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400 sm:col-span-2">Descripción interna
            <input className={input + ' mt-1'} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Sorteo de Halloween" maxLength={80} />
          </label>
          <label className="text-xs text-neutral-400">Usos totales (vacío = ilimitados)
            <input className={input + ' mt-1'} type="number" min={1} value={max} onChange={(e) => setMax(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400">Usos por persona
            <input className={input + ' mt-1'} type="number" min={1} value={perUser} onChange={(e) => setPerUser(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400">Empieza (opcional)
            <input className={input + ' mt-1'} type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400">Vence (opcional)
            <input className={input + ' mt-1'} type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400">Antigüedad mínima de la cuenta (días)
            <input className={input + ' mt-1'} type="number" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          </label>
        </div>
        {code && !max && !expires && <p className="text-xs text-amber-400 mt-3">Un código escrito a mano se puede adivinar: ponle un límite de usos o una fecha de vencimiento.</p>}
        <button className={btn + ' mt-3'} disabled={busy} onClick={create}>Crear código</button>
      </section>

      <section className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4">
        <h3 className="font-semibold text-neutral-50 mb-3">Crear en lote (un solo uso cada uno)</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="text-xs text-neutral-400">Prefijo
            <input className={input + ' mt-1 font-mono uppercase'} value={bPrefix} onChange={(e) => setBPrefix(e.target.value.toUpperCase())} placeholder="HALLOWEEN" maxLength={12} />
          </label>
          <label className="text-xs text-neutral-400">Cantidad (máx. 500)
            <input className={input + ' mt-1'} type="number" min={1} max={500} value={bCount} onChange={(e) => setBCount(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400">Lunas c/u
            <input className={input + ' mt-1'} type="number" min={0} value={bLunas} onChange={(e) => setBLunas(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400">Vence (opcional)
            <input className={input + ' mt-1'} type="datetime-local" value={bExp} onChange={(e) => setBExp(e.target.value)} />
          </label>
          <label className="text-xs text-neutral-400 sm:col-span-4">Descripción interna
            <input className={input + ' mt-1'} value={bDesc} onChange={(e) => setBDesc(e.target.value)} maxLength={80} />
          </label>
        </div>
        <div className="flex gap-2 mt-3">
          <button className={btn} disabled={busy} onClick={createBatch}>Generar lote</button>
          {batch.length > 0 && <button className={btn2} onClick={exportCsv}>Exportar CSV ({batch.length})</button>}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap gap-2 mb-3">
          <select className={input + ' !w-auto'} value={filter} onChange={(e) => setFilter(e.target.value)}>
            {['todos', 'activos', 'vencidos', 'agotados', 'desactivados'].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input className={input + ' flex-1 min-w-[10rem]'} placeholder="Buscar código o descripción" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <button className="font-mono text-sm text-neutral-50 hover:text-garnet-400" title="Copiar" onClick={() => navigator.clipboard?.writeText(c.code)}>{c.code}</button>
                <span className="text-amber-300 text-sm font-semibold">{formatNumber(c.lunas)} ☾</span>
                <span className={`text-xs ${statusColor[c.status] ?? ''}`}>{c.status}</span>
                <span className="text-xs text-neutral-500">{c.redeemed_count} / {c.max_redemptions ?? '∞'} usos</span>
                {c.expires_at && <span className="text-xs text-neutral-500">vence {new Date(c.expires_at).toLocaleDateString('es')}</span>}
              </div>
              {c.description && <p className="text-xs text-neutral-500 mt-0.5">{c.description}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                <button className={btn2} onClick={() => showWho(c.id)}>{open === c.id ? 'Ocultar' : 'Quién lo canjeó'}</button>
                <button className={btn2} onClick={() => act(() => supabase.rpc('admin_code_set_active', { p_id: c.id, p_active: !c.active }))}>{c.active ? 'Desactivar' : 'Reactivar'}</button>
                <button className={btn2} onClick={() => { setCode(''); setLunas(String(c.lunas)); setDesc(c.description ?? ''); setMax(c.max_redemptions ? String(c.max_redemptions) : ''); setMsg('Datos copiados arriba: ponle un código nuevo y créalo') }}>Duplicar</button>
                {c.redeemed_count === 0 && <button className={btn2 + ' !text-red-300'} onClick={() => confirm('¿Borrar este código?') && act(() => supabase.rpc('admin_code_delete', { p_id: c.id }))}>Borrar</button>}
              </div>
              {open === c.id && (
                <ul className="mt-2 text-xs text-neutral-400 space-y-0.5">
                  {who.length === 0 && <li>Nadie lo ha canjeado todavía.</li>}
                  {who.map((w, i) => <li key={i}>@{w.username}{w.id_student ? ` (${w.id_student})` : ''} · {new Date(w.redeemed_at).toLocaleString('es')} · +{w.lunas_granted} ☾</li>)}
                </ul>
              )}
            </li>
          ))}
          {list.length === 0 && <p className="text-sm text-neutral-500">No hay códigos con ese filtro.</p>}
        </ul>
      </section>
    </div>
  )
}

// ─────────────────────────── MISIONES ───────────────────────────
type Tpl = { id: string; period: string; difficulty: string | null; category: string; text: string; target: number; reward: number; weight: number; active: boolean; requires_feature: string | null; params: Record<string, unknown>; event_type: string }

function MissionsPanel() {
  const [list, setList] = useState<Tpl[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [period, setPeriod] = useState('daily')
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_mission_templates')
    if (error) setMsg(error.message)
    else setList((data as Tpl[]) ?? [])
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function save(t: Tpl) {
    const { error } = await supabase.rpc('admin_mission_template_set', { p_id: t.id, p_text: t.text, p_reward: t.reward, p_weight: t.weight, p_active: t.active, p_target: t.target })
    setMsg(error ? error.message : `Guardada ${t.id}`)
    load()
  }
  const upd = (id: string, patch: Partial<Tpl>) => setList((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const shown = list.filter((t) => t.period === period)
  const locked = (t: Tpl) => 'all_of' in (t.params ?? {}) || t.event_type.startsWith('state:')

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {[['daily', 'Diarias'], ['weekly', 'Semanales'], ['onboarding', 'Bienvenida'], ['achievement', 'Logros']].map(([id, l]) => (
          <button key={id} onClick={() => setPeriod(id)} className={`px-3 py-1 rounded-full text-xs border ${period === id ? 'bg-ink-700 border-ink-500 text-neutral-50' : 'border-ink-700 text-neutral-400'}`}>{l}</button>
        ))}
      </div>
      {msg && <p className="text-sm text-neutral-300 mb-3">{msg}</p>}
      <p className="text-xs text-neutral-500 mb-3">Edita texto, recompensa, peso (qué tan seguido sale) y si está activa. Las marcadas «necesita función» quedan apagadas hasta que esa función exista.</p>
      <ul className="space-y-2">
        {shown.map((t) => (
          <li key={t.id} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-garnet-300">{t.id}</span>
              <span className="text-[11px] text-neutral-500">{t.difficulty ?? ''}</span>
              {t.requires_feature && <span className="text-[11px] text-amber-400">necesita función «{t.requires_feature}»</span>}
            </div>
            <input className={input} value={t.text} onChange={(e) => upd(t.id, { text: e.target.value })} maxLength={140} />
            <div className="flex flex-wrap items-end gap-3 mt-2">
              <label className="text-[11px] text-neutral-500">Recompensa ☾<input type="number" min={0} className={input + ' !w-24 mt-0.5'} value={t.reward} onChange={(e) => upd(t.id, { reward: Number(e.target.value) })} /></label>
              <label className="text-[11px] text-neutral-500">Peso<input type="number" min={0} className={input + ' !w-20 mt-0.5'} value={t.weight} onChange={(e) => upd(t.id, { weight: Number(e.target.value) })} /></label>
              <label className="text-[11px] text-neutral-500">Meta<input type="number" min={1} disabled={locked(t)} className={input + ' !w-20 mt-0.5 disabled:opacity-40'} value={t.target} onChange={(e) => upd(t.id, { target: Number(e.target.value) })} /></label>
              <label className="text-xs text-neutral-300 flex items-center gap-1.5 pb-2"><input type="checkbox" checked={t.active} disabled={!!t.requires_feature} onChange={(e) => upd(t.id, { active: e.target.checked })} /> Activa</label>
              <button className={btn2} onClick={() => save(t)}>Guardar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────── ECONOMÍA ───────────────────────────
type Stats = {
  wallets: number; circulation: number; average: number; median: number; earned_7: number; spent_7: number; earned_30: number; spent_30: number
  by_reason_30: { reason: string; total: number; n: number }[]; codes_total: number; codes_30: number
  distribution: { label: string; n: number }[]; open_flags: number
}
type Flag = { id: number; kind: string; details: Record<string, unknown>; created_at: string; resolved_at: string | null; username: string | null; id_student: string | null }
type LogRow = { id: number; action: string; target: string | null; details: Record<string, unknown>; created_at: string; admin: string | null }

function EconomyPanel() {
  const [s, setS] = useState<Stats | null>(null)
  const [flags, setFlags] = useState<Flag[]>([])
  const [log, setLog] = useState<LogRow[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([supabase.rpc('admin_economy_stats'), supabase.rpc('admin_economy_flags'), supabase.rpc('admin_log_list', { p_limit: 30 })])
    if (a.error) setMsg(a.error.message)
    else setS(a.data as Stats)
    setFlags((b.data as Flag[]) ?? [])
    setLog((c.data as LogRow[]) ?? [])
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function audit() {
    const { data, error } = await supabase.rpc('economy_audit')
    if (error) return setMsg(error.message)
    const rows = (data as unknown[]) ?? []
    setMsg(rows.length === 0 ? '✓ Auditoría limpia: todos los saldos cuadran con el libro (0 diferencias).' : `⚠ Hay ${rows.length} cuenta(s) donde el saldo no cuadra con el libro.`)
  }
  async function scan() {
    const { data, error } = await supabase.rpc('economy_scan_farms')
    setMsg(error ? error.message : `Revisión antigranja lista: ${data} bandera(s) nueva(s).`)
    load()
  }

  if (!s) return <p className="text-sm text-neutral-500">{msg ?? 'Cargando…'}</p>
  const card = (l: string, v: string) => (
    <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-3"><p className="text-[11px] uppercase tracking-wide text-neutral-500">{l}</p><p className="text-lg font-semibold text-neutral-50 tabular-nums">{v}</p></div>
  )
  const maxN = Math.max(1, ...s.distribution.map((d) => d.n))
  return (
    <div className="space-y-6">
      {msg && <p className="text-sm rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-neutral-200">{msg}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {card('En circulación', `${formatNumber(s.circulation)} ☾`)}
        {card('Billeteras', formatNumber(s.wallets))}
        {card('Saldo medio', `${formatNumber(s.average)} ☾`)}
        {card('Mediana', `${formatNumber(s.median)} ☾`)}
        {card('Ganadas 7 d', formatNumber(s.earned_7))}
        {card('Gastadas 7 d', formatNumber(s.spent_7))}
        {card('Ganadas 30 d', formatNumber(s.earned_30))}
        {card('Por códigos (total)', formatNumber(s.codes_total))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className={btn} onClick={audit}>Auditar libro</button>
        <button className={btn2} onClick={scan}>Revisar antigranja</button>
        <button className={btn2} onClick={load}>Actualizar</button>
      </div>
      <section>
        <h3 className="text-sm font-semibold text-neutral-200 mb-2">Por fuente (30 días)</h3>
        <ul className="space-y-1 text-sm">
          {s.by_reason_30.map((r) => <li key={r.reason} className="flex justify-between border-b border-ink-800 py-1"><span className="text-neutral-300">{REASON_LABELS[r.reason] ?? r.reason} <span className="text-neutral-600">({r.n})</span></span><span className={`tabular-nums ${r.total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{r.total > 0 ? '+' : ''}{formatNumber(r.total)}</span></li>)}
          {s.by_reason_30.length === 0 && <li className="text-neutral-500">Sin movimientos todavía.</li>}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-neutral-200 mb-2">Distribución de saldos</h3>
        <ul className="space-y-1.5">
          {s.distribution.map((d) => <li key={d.label} className="flex items-center gap-2 text-xs"><span className="w-20 text-neutral-400">{d.label}</span><span className="flex-1 h-3 bg-ink-800 rounded-full overflow-hidden"><span className="block h-full bg-garnet-500" style={{ width: `${(d.n / maxN) * 100}%` }} /></span><span className="w-8 text-right text-neutral-300 tabular-nums">{d.n}</span></li>)}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-neutral-200 mb-2">Banderas ({s.open_flags} abiertas)</h3>
        <ul className="space-y-1.5 text-sm">
          {flags.map((f) => (
            <li key={f.id} className="rounded-lg border border-ink-700 p-2 flex items-center gap-2">
              <span className="flex-1 min-w-0"><b className="text-neutral-100">{f.kind === 'farming' ? 'Posible granja' : f.kind === 'daily_cap' ? 'Tope diario' : f.kind}</b> · @{f.username ?? '—'} <span className="text-neutral-600 text-xs">{new Date(f.created_at).toLocaleDateString('es')}</span></span>
              {f.resolved_at ? <span className="text-xs text-neutral-600">resuelta</span> : <button className={btn2} onClick={async () => { await supabase.rpc('admin_economy_flag_resolve', { p_id: f.id }); load() }}>Resolver</button>}
            </li>
          ))}
          {flags.length === 0 && <li className="text-neutral-500">Sin banderas.</li>}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-neutral-200 mb-2">Historial del equipo</h3>
        <ul className="space-y-1 text-xs text-neutral-400">
          {log.map((l) => <li key={l.id}>{new Date(l.created_at).toLocaleString('es')} · <b className="text-neutral-200">@{l.admin ?? 'sistema'}</b> · {l.action} {l.target ? `· ${String(l.target).slice(0, 24)}` : ''}</li>)}
        </ul>
      </section>
    </div>
  )
}

// ─────────────────────────── AJUSTE MANUAL ───────────────────────────
function AdjustPanel() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<{ id: string; username: string; id_student: string | null; coins: number }[]>([])
  const [sel, setSel] = useState<{ id: string; username: string } | null>(null)
  const [w, setW] = useState<{ balance: number; history: { delta: number; balance_after: number; reason: string; ref_id: string | null; created_at: string }[] } | null>(null)
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q.trim().length < 2) { setRes([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('admin_user_search', { p_q: q })
      setRes((data as typeof res) ?? [])
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  async function pick(u: { id: string; username: string }) {
    setSel(u); setRes([]); setQ('')
    const { data } = await supabase.rpc('admin_wallet_of', { p_user: u.id })
    setW(data as typeof w)
  }
  async function apply() {
    if (!sel) return
    const { error } = await supabase.rpc('admin_coins_adjust', { p_user: sel.id, p_delta: Number(delta), p_reason: reason })
    if (error) return setMsg(error.message)
    setMsg('Ajuste aplicado y registrado en el libro.')
    setDelta(''); setReason('')
    pick(sel)
  }

  return (
    <div className="space-y-4 max-w-xl">
      <label className="text-xs text-neutral-400 block">Buscar persona
        <input className={input + ' mt-1'} value={q} onChange={(e) => setQ(e.target.value)} placeholder="usuario o nombre" />
      </label>
      {res.length > 0 && (
        <ul className="rounded-xl border border-ink-700 divide-y divide-ink-800">
          {res.map((u) => <li key={u.id}><button className="w-full text-left px-3 py-2 text-sm hover:bg-ink-800" onClick={() => pick(u)}>@{u.username} {u.id_student ? <span className="text-neutral-500">({u.id_student})</span> : null} <span className="float-right text-amber-300 tabular-nums">{formatNumber(u.coins)} ☾</span></button></li>)}
        </ul>
      )}
      {sel && w && (
        <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 space-y-3">
          <p className="text-sm text-neutral-100">@{sel.username} · saldo <b className="text-amber-300">{formatNumber(w.balance)} ☾</b></p>
          <div className="grid grid-cols-3 gap-2">
            <input className={input} type="number" placeholder="+/− Lunas" value={delta} onChange={(e) => setDelta(e.target.value)} />
            <input className={input + ' col-span-2'} placeholder="Motivo (obligatorio)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} />
          </div>
          <button className={btn} onClick={apply} disabled={!delta || reason.trim().length < 3}>Aplicar ajuste</button>
          <ul className="text-xs text-neutral-400 space-y-0.5 pt-2 border-t border-ink-800">
            {w.history.map((h, i) => <li key={i}>{new Date(h.created_at).toLocaleDateString('es')} · {REASON_LABELS[h.reason] ?? h.reason} · <span className={h.delta > 0 ? 'text-emerald-400' : 'text-red-400'}>{h.delta > 0 ? '+' : ''}{h.delta}</span> → {h.balance_after}</li>)}
          </ul>
        </div>
      )}
      {msg && <p className="text-sm text-neutral-300">{msg}</p>}
    </div>
  )
}

// ─────────────────────────── AJUSTES ───────────────────────────
const SETTING_LABELS: Record<string, { label: string; hint?: string }> = {
  currency_name: { label: 'Nombre de la moneda', hint: 'Por ejemplo: Lunas' },
  coins_multiplier: { label: 'Multiplicador de misiones', hint: '1 = normal · 2 = doble Lunas (eventos). De 0.5 a 5' },
  missions_timezone: { label: 'Zona horaria del reinicio', hint: 'America/Bogota, America/Mexico_City, Europe/Madrid…' },
  welcome_coins: { label: 'Lunas de bienvenida', hint: 'Solo para cuentas nuevas' },
  founder_coins: { label: 'Lunas del Pack Fundador' },
  founder_cutoff: { label: 'Fecha límite del Pack Fundador', hint: 'Cuentas creadas ANTES de esta fecha (AAAA-MM-DD)' },
  coins_daily_cap: { label: 'Tope diario de seguridad', hint: 'Máximo de Lunas por día de premios repetibles (racha, cofre, bono)' },
  daily_bonus_coins: { label: 'Bono «las 3 del día»' },
  chest_coins: { label: 'Cofre semanal' },
  reroll_cost: { label: 'Costo de cambiar misión extra' },
  code_max_lunas_staff: { label: 'Tope de Lunas por código (equipo no supremo)' },
}

function SettingsPanel() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_eco_settings')
    if (error) return setMsg(error.message)
    const o: Record<string, string> = {}
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) o[k] = String(v)
    setVals(o)
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])
  async function save(k: string) {
    const { error } = await supabase.rpc('admin_eco_setting_set', { p_key: k, p_value: vals[k] })
    setMsg(error ? error.message : 'Guardado ✓')
    load()
  }
  return (
    <div className="max-w-xl space-y-3">
      {msg && <p className="text-sm text-neutral-300">{msg}</p>}
      {Object.keys(SETTING_LABELS).map((k) => (
        <div key={k} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
          <label className="text-xs text-neutral-300 font-semibold">{SETTING_LABELS[k].label}</label>
          {SETTING_LABELS[k].hint && <p className="text-[11px] text-neutral-500">{SETTING_LABELS[k].hint}</p>}
          <div className="flex gap-2 mt-1.5">
            <input className={input} value={vals[k] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} />
            <button className={btn2} onClick={() => save(k)}>Guardar</button>
          </div>
        </div>
      ))}
    </div>
  )
}
