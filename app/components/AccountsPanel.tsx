'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { forgetAccount, listAccounts, startAddAccount, subscribeAccounts, switchAccount, type PublicAccount } from '../lib/accounts'
import { FREE_PERKS, fetchMyPerks, type MyPerks } from '../lib/perks'
import Avatar from './UserAvatar'

/**
 * v1.8.0 · Lista de las cuentas guardadas en este dispositivo: tocar para cambiar, «Añadir cuenta» para entrar en otra.
 * Se usa en Configuración → Mis cuentas y en la hoja rápida del menú.
 */
export default function AccountsPanel({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<PublicAccount[]>([])
  const [perks, setPerks] = useState<MyPerks>(FREE_PERKS)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirmForget, setConfirmForget] = useState<string | null>(null)

  const refresh = useCallback((id: string | null) => setAccounts(listAccounts(id)), [])

  useEffect(() => {
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      const id = data.session?.user?.id ?? null
      setCurrentId(id)
      refresh(id)
    })
    void fetchMyPerks().then((p) => alive && setPerks(p))
    return () => {
      alive = false
    }
  }, [refresh])

  useEffect(() => subscribeAccounts(() => refresh(currentId)), [currentId, refresh])

  const doSwitch = async (id: string) => {
    if (busyId) return
    setBusyId(id)
    setError('')
    const res = await switchAccount(id)
    if (res.error) {
      setError(res.error)
      setBusyId(null)
      refresh(currentId)
      return
    }
    onDone?.()
  }

  const full = accounts.length >= perks.account_cap

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {accounts.map((a) => (
          <li key={a.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${a.current ? 'border-garnet-600/50 bg-garnet-600/10' : 'border-ink-700 bg-ink-900/60'}`}>
            <Avatar username={a.username} avatarUrl={a.avatar} size="w-10 h-10" textSize="text-sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-semibold text-neutral-100 truncate">{a.name || a.username}</p>
              <p className="text-xs text-neutral-500 truncate">@{a.username}</p>
            </div>
            {a.current ? (
              <span className="text-[11px] font-medium text-garnet-300 rounded-full bg-garnet-600/15 px-2.5 py-1">Usando ahora</span>
            ) : confirmForget === a.id ? (
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => { forgetAccount(a.id); setConfirmForget(null) }} className="text-xs rounded-full bg-garnet-700 text-white px-3 py-1.5">Quitar</button>
                <button type="button" onClick={() => setConfirmForget(null)} className="text-xs rounded-full border border-ink-600 text-neutral-300 px-3 py-1.5">No</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => doSwitch(a.id)}
                  disabled={!!busyId}
                  className="text-xs font-medium rounded-full bg-garnet-600 hover:bg-garnet-500 text-white px-3.5 py-1.5 disabled:opacity-60"
                >
                  {busyId === a.id ? 'Cambiando…' : 'Cambiar'}
                </button>
                <button type="button" onClick={() => setConfirmForget(a.id)} aria-label={`Quitar a @${a.username} de este dispositivo`} title="Quitar de este dispositivo" className="w-8 h-8 rounded-full border border-ink-600 text-neutral-400 hover:text-garnet-400 hover:border-garnet-600 text-sm">
                  ×
                </button>
              </div>
            )}
          </li>
        ))}
        {accounts.length === 0 && <li className="text-sm text-neutral-500 py-2">Todavía no hay cuentas guardadas en este dispositivo.</li>}
      </ul>

      {error && <p role="alert" className="text-xs text-garnet-400">{error}</p>}

      <button
        type="button"
        onClick={() => void startAddAccount()}
        disabled={full}
        className="w-full rounded-2xl border border-dashed border-ink-500 text-neutral-200 hover:bg-ink-800 py-3 text-sm font-medium disabled:opacity-50 disabled:hover:bg-transparent"
      >
        ＋ Añadir otra cuenta
      </button>
      <p className="text-[11.5px] text-neutral-500 leading-relaxed">
        {full
          ? `Ya tienes ${accounts.length} de ${perks.account_cap} cuentas guardadas en este dispositivo. Quita una con la × para añadir otra.`
          : `Puedes guardar hasta ${perks.account_cap >= 30 ? 'las que quieras' : `${perks.account_cap} cuentas`} en este dispositivo.`}
        {!compact && ' Cambiar no pide contraseña porque ya entraste con ella en este dispositivo; si cierras sesión en una cuenta, se quita de la lista. Nunca se cambia de cuenta por IP ni desde otro dispositivo, para que nadie pueda entrar a la tuya.'}
      </p>
    </div>
  )
}
