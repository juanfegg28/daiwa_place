'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { applyTheme, ACCENT_PRESETS, DEFAULT_ACCENT, isValidHex } from '../lib/theme'
import { HeartIcon, CommentIcon, MusicIcon } from '../components/icons'
import { readMusicDisabled, setMusicDisabled } from '../components/MusicProvider'
import RoleBadges from '../components/RoleBadge'
import type { ConfigProfile } from './types'

export default function AparienciaTab({
  profile,
  onUpdate,
  showVipBadge = false,
}: {
  profile: ConfigProfile
  onUpdate: (p: ConfigProfile) => void
  showVipBadge?: boolean
}) {
  const [theme, setTheme] = useState<'dark' | 'light'>(profile.theme)
  const [accent, setAccent] = useState<string>(profile.accent_color ?? DEFAULT_ACCENT)
  const [customHex, setCustomHex] = useState<string>(profile.accent_color ?? '')
  const [badgeColor, setBadgeColor] = useState<string>(profile.badge_color ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedRef = useRef({ theme: profile.theme, accent: profile.accent_color })

  // Vista previa en vivo de toda la página mientras eliges, sin guardar todavía
  useEffect(() => {
    applyTheme(theme, accent)
  }, [theme, accent])

  // Si sales de esta pestaña sin guardar, vuelve a como estaba
  useEffect(() => {
    return () => {
      applyTheme(savedRef.current.theme, savedRef.current.accent)
    }
  }, [])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    const accentToSave = accent.toLowerCase() === DEFAULT_ACCENT.toLowerCase() ? null : accent
    const badgeColorToSave = showVipBadge && isValidHex(badgeColor) ? badgeColor : null
    const { error } = await supabase
      .from('profiles')
      .update({ theme, accent_color: accentToSave, badge_color: badgeColorToSave })
      .eq('id', profile.id)
    setSaving(false)
    if (!error) {
      savedRef.current = { theme, accent: accentToSave }
      onUpdate({ ...profile, theme, accent_color: accentToSave, badge_color: badgeColorToSave })
      applyTheme(theme, accentToSave)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    }
  }

  const pickPreset = (hex: string) => {
    setAccent(hex)
    setCustomHex(hex)
  }

  const [musicOff, setMusicOff] = useState(false)
  useEffect(() => {
    function run() {
      setMusicOff(readMusicDisabled())
    }
    run()
  }, [])

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50 mb-1">
              <MusicIcon className="w-4 h-4 text-garnet-400" />
              Música en la página
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
              Apágala si no quieres oír las canciones de las publicaciones, notas y perfiles (nunca suenan solas, solo al
              darle play). Este ajuste se guarda en este dispositivo.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!musicOff}
            aria-label="Activar o desactivar la música"
            onClick={() => {
              const next = !musicOff
              setMusicOff(next)
              setMusicDisabled(next)
            }}
            className={`shrink-0 w-12 h-7 rounded-full transition relative ${musicOff ? 'bg-ink-600' : 'bg-garnet-600'}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${musicOff ? '' : 'translate-x-5'}`}
            />
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Modo visual</h2>
        <p className="text-sm text-neutral-500 mb-4">Elige si prefieres la página en oscuro o en claro.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              theme === 'dark'
                ? 'border-garnet-600 bg-garnet-600/10 text-neutral-100'
                : 'border-ink-700 text-neutral-300 hover:bg-ink-800'
            }`}
          >
            Oscuro
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              theme === 'light'
                ? 'border-garnet-600 bg-garnet-600/10 text-neutral-100'
                : 'border-ink-700 text-neutral-300 hover:bg-ink-800'
            }`}
          >
            Claro
          </button>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-semibold text-neutral-50 mb-1">Color de acento</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Es el color de los botones y los detalles de toda la página (por defecto, granate). Elige uno de
          estos o pon el tuyo.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => pickPreset(p.hex)}
              title={p.name}
              aria-label={p.name}
              className={`w-9 h-9 rounded-full border-2 transition ${
                accent.toLowerCase() === p.hex.toLowerCase() ? 'border-neutral-100 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: p.hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isValidHex(customHex) ? customHex : DEFAULT_ACCENT}
            onChange={(e) => {
              setCustomHex(e.target.value)
              setAccent(e.target.value)
            }}
            aria-label="Elegir color personalizado"
            className="w-10 h-10 rounded-lg border border-ink-700 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => {
              const v = e.target.value
              setCustomHex(v)
              if (isValidHex(v)) setAccent(v)
            }}
            placeholder="#c81b3e"
            className="w-32 bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
          />
        </div>
      </section>

      {showVipBadge && (
        <section className="surface-card rounded-2xl p-5">
          <h2 className="text-base font-semibold text-neutral-50 mb-1">Color de tu insignia VIP</h2>
          <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
            Esta opción solo la ven las cuentas con un rol oficial. Elige el color exacto de tu placa de rol
            (la insignia junto a tu nombre), independiente del color de acento del resto de tu interfaz. Si no
            eliges nada, se usa el color por defecto del rol.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={isValidHex(badgeColor) ? badgeColor : '#c81b3e'}
              onChange={(e) => setBadgeColor(e.target.value)}
              aria-label="Elegir color de insignia"
              className="w-10 h-10 rounded-lg border border-ink-700 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={badgeColor}
              onChange={(e) => setBadgeColor(e.target.value)}
              placeholder="Color por defecto del rol"
              className="w-40 bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-garnet-600"
            />
            {badgeColor && (
              <button
                type="button"
                onClick={() => setBadgeColor('')}
                className="text-xs text-neutral-500 hover:text-garnet-400 transition"
              >
                Quitar
              </button>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-neutral-400 mb-2">Vista previa</h2>
        <div className="surface-card rounded-2xl p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-garnet-400 text-xs font-semibold shrink-0">
              R
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <p className="text-[15px] font-bold text-neutral-50">Ren Shiraishi</p>
                {showVipBadge && (
                  <RoleBadges
                    username="estudiante_staff"
                    roles={[{ roles: { name: 'Staff', badge_color: '#c81b3e' } }]}
                    badgeColorOverride={isValidHex(badgeColor) ? badgeColor : null}
                    size="xs"
                  />
                )}
              </div>
              <p className="text-xs text-neutral-600">@renshsh</p>
            </div>
          </div>
          <p className="text-[15px] text-neutral-100 mb-3">Así se ve el feed con estos colores ✨</p>
          <div className="flex items-center gap-5 text-neutral-500">
            <span className="flex items-center gap-1.5 text-sm text-garnet-500">
              <HeartIcon filled className="w-[18px] h-[18px]" /> 12
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <CommentIcon className="w-[18px] h-[18px]" /> 4
            </span>
            <button type="button" className="ml-auto bg-garnet-600 text-white text-xs font-medium rounded-full px-4 py-1.5">
              Botón de ejemplo
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-garnet-600 hover:bg-garnet-500 disabled:opacity-60 text-white text-sm font-medium rounded-full px-5 py-2 transition"
        >
          {saving ? 'Guardando...' : 'Guardar apariencia'}
        </button>
        {saved && <span className="text-sm text-emerald-500">Guardado</span>}
      </div>
    </div>
  )
}
