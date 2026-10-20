'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import Avatar from '../components/cosmetics/Avatar'
import NameText from '../components/cosmetics/NameText'
import ProfileCard from '../components/cosmetics/ProfileCard'
import { CustomColorPicker } from '../components/ColorPicker'
import { supabase } from '../lib/supabaseClient'
import { CARD_MODES, PROFILE_PALETTE, profileThemeVars, type CardMode } from '../lib/color'
import { isValidHex } from '../lib/theme'
import { HeartIcon } from '../components/icons'

type Tab = 'color' | 'nombre' | 'tarjeta'
type Draft = { profile_color: string | null; name_color: string | null; card_color: string | null; card_mode: CardMode }

export default function PersonalizarPage() {
  return (
    <AppShell>
      <PersonalizarContent />
    </AppShell>
  )
}

function Swatches({ value, onPick, allowNone }: { value: string | null; onPick: (hex: string | null) => void; allowNone?: string }) {
  const [custom, setCustom] = useState(false)
  return (
    <div>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-3">
        {allowNone && (
          <button type="button" onClick={() => onPick(null)} aria-label={allowNone} title={allowNone}
            className={`h-9 rounded-full border-2 text-[10px] text-neutral-400 ${value === null ? 'border-garnet-400' : 'border-ink-600'} bg-ink-800`}>
            Ninguno
          </button>
        )}
        {PROFILE_PALETTE.map((c) => (
          <button key={c.hex} type="button" onClick={() => onPick(c.hex)} aria-label={c.name} title={c.name}
            className={`h-9 rounded-full border-2 transition ${value?.toLowerCase() === c.hex.toLowerCase() ? 'border-white scale-110' : 'border-transparent'}`}
            style={{ background: c.hex }} />
        ))}
      </div>
      <button type="button" className="text-sm text-garnet-400 hover:text-garnet-300 mb-3" onClick={() => setCustom((v) => !v)}>
        {custom ? 'Ocultar selector libre' : 'Elegir otro color…'}
      </button>
      {custom && <CustomColorPicker themed value={value ?? '#C81B3E'} onChange={(hex) => onPick(hex)} />}
    </div>
  )
}

function PersonalizarContent() {
  const { userId, username, loading, refresh } = useAppSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('color')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<Draft | null>(null)
  const [info, setInfo] = useState<{ id_student: string | null; avatar_url: string | null; bio: string | null; grado: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('id_student, avatar_url, bio, grado, profile_color, name_color, card_color, card_mode')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as (Draft & { id_student: string | null; avatar_url: string | null; bio: string | null; grado: string | null }) | null
        if (!d) return
        const base: Draft = { profile_color: d.profile_color, name_color: d.name_color, card_color: d.card_color, card_mode: (d.card_mode as CardMode) || 'suave' }
        setDraft(base)
        setSaved(base)
        setInfo({ id_student: d.id_student, avatar_url: d.avatar_url, bio: d.bio, grado: d.grado })
      })
  }, [userId])

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved])
  if (loading || !userId || !draft || !info) return null

  const themeVars = profileThemeVars(draft.profile_color)
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })

  async function save() {
    if (!draft) return
    for (const k of ['profile_color', 'name_color', 'card_color'] as const) {
      const v = draft[k]
      if (v && !isValidHex(v)) return setMsg('Hay un color con formato incorrecto')
    }
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.from('profiles').update(draft).eq('id', userId)
    setBusy(false)
    if (error) return setMsg('No se pudo guardar: ' + error.message)
    setSaved(draft)
    setMsg('¡Guardado! Ya lo ven todos en tu perfil.')
    refresh()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'color', label: 'Color del perfil' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'tarjeta', label: 'Tarjeta' },
  ]
  const display = info.id_student || username || 'Tu nombre'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold text-neutral-50">Personalizar</h1>
        <Link href={`/perfil/${username ?? ''}`} className="text-sm text-neutral-400 hover:text-neutral-100">Ver mi perfil →</Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Vista previa en vivo */}
        <div className={`rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden ${themeVars ? 'profile-theme' : ''}`} style={themeVars}>
          <div className="h-24 bg-gradient-to-br from-garnet-700/50 to-ink-900" />
          <div className="px-4 pb-4">
            <div className="flex items-end justify-between -mt-10 mb-3">
              <Avatar username={username ?? '?'} avatarUrl={info.avatar_url} size="w-20 h-20" sizes="96px" textSize="text-2xl" photoClassName="border-4 border-ink-950 shadow-[0_0_0_2px] shadow-garnet-500/45" />
              <span className="rounded-full bg-garnet-600 text-white text-sm font-semibold px-4 py-1.5">Seguir</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-neutral-50 leading-tight"><NameText name={display} color={draft.name_color} density="full" /></h2>
            <p className="text-sm text-neutral-500 mb-3">@{username}</p>
            <ProfileCard color={draft.card_color} mode={draft.card_mode}>
              <p className="text-sm text-neutral-200 mb-3 leading-relaxed">{info.bio || 'Así se verá tu biografía dentro de la tarjeta.'}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {info.grado && <span className="bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs px-3 py-1.5 rounded-full">{info.grado}</span>}
                <span className="inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs px-3 py-1.5 rounded-full"><HeartIcon className="w-3.5 h-3.5 text-garnet-400" />Estado</span>
              </div>
              <div className="flex gap-4 text-sm"><span><b className="text-neutral-100">12</b> <span className="text-neutral-500">publicaciones</span></span><span className="text-garnet-400">enlaces y botones</span></div>
            </ProfileCard>
            <div className="rounded-xl border border-ink-800 p-3 flex items-center gap-2.5">
              <Avatar username={username ?? '?'} avatarUrl={info.avatar_url} size="w-10 h-10" sizes="48px" textSize="text-sm" />
              <div className="min-w-0"><NameText name={display} color={draft.name_color} className="text-[15px] font-bold text-neutral-50" /><p className="text-xs text-neutral-500">así se ve tu nombre en publicaciones</p></div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {['w-7 h-7', 'w-10 h-10', 'w-[52px] h-[52px]'].map((s) => <Avatar key={s} username={username ?? '?'} avatarUrl={info.avatar_url} size={s} sizes="64px" textSize="text-xs" />)}
              <span className="text-xs text-neutral-600">tamaños del avatar</span>
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4 h-fit">
          <div className="flex gap-1.5 mb-4 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`px-3.5 py-1.5 rounded-full text-sm border whitespace-nowrap transition ${tab === t.id ? 'bg-garnet-600 text-white border-garnet-500' : 'bg-ink-800/70 border-ink-700 text-neutral-300 hover:bg-ink-700'}`}>{t.label}</button>
            ))}
          </div>

          {tab === 'color' && (
            <>
              <p className="text-xs text-neutral-500 mb-3">Este color lo ven <b>todas las personas</b> al entrar a tu perfil (botones, enlaces, íconos). No cambia el color de tu propia aplicación: eso sigue en Configuración → Apariencia.</p>
              <Swatches value={draft.profile_color} onPick={(hex) => set({ profile_color: hex })} allowNone="Color de la app" />
            </>
          )}
          {tab === 'nombre' && (
            <>
              <p className="text-xs text-neutral-500 mb-3">El color de tu nombre se ve en publicaciones, comentarios y mensajes. Se ajusta solo para que siempre se pueda leer, en tema claro y oscuro. Tu @usuario siempre va en texto normal.</p>
              <Swatches value={draft.name_color} onPick={(hex) => set({ name_color: hex })} allowNone="Sin color" />
            </>
          )}
          {tab === 'tarjeta' && (
            <>
              <p className="text-xs text-neutral-500 mb-3">La tarjeta envuelve tu biografía, canción y datos.</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {CARD_MODES.map((m) => (
                  <button key={m.id} onClick={() => set({ card_mode: m.id })} className={`rounded-xl border px-2 py-2 text-center transition ${draft.card_mode === m.id ? 'border-garnet-400 bg-garnet-600/15 text-neutral-50' : 'border-ink-700 text-neutral-400'}`}>
                    <p className="text-sm font-medium">{m.label}</p><p className="text-[10.5px] text-neutral-500">{m.hint}</p>
                  </button>
                ))}
              </div>
              <Swatches value={draft.card_color} onPick={(hex) => set({ card_color: hex })} allowNone="Sin color" />
            </>
          )}

          <div className="mt-5 pt-4 border-t border-ink-800 flex items-center gap-3">
            <button onClick={save} disabled={!dirty || busy} className="press rounded-xl bg-garnet-600 hover:bg-garnet-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 transition">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
            {dirty && <button onClick={() => setDraft(saved)} className="text-sm text-neutral-400 hover:text-neutral-100">Descartar</button>}
          </div>
          {msg && <p className="text-sm text-neutral-300 mt-3" role="status">{msg}</p>}
          <p className="text-[11px] text-neutral-600 mt-4">Lo que ven los demás es lo guardado; la vista previa es un borrador. Las decoraciones de avatar, fuentes y efectos llegarán con la tienda.</p>
        </div>
      </div>
    </div>
  )
}
