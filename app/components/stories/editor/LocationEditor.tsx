'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { LOCATION_STYLES, MAX_LOCATION_CHARS, TEXT_COLORS, type StoryLocation } from '../../../lib/stories'
import LocationSticker from '../elements/LocationSticker'

const THEMES: { id: StoryLocation['theme']; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'accent', label: 'Acento' },
  { id: 'color', label: 'Color' },
]

/**
 * Ubicación: campo de texto (máx. 40), sugerencias del colegio, «usar mi ubicación actual» (opcional; solo se
 * guarda el NOMBRE del lugar, jamás coordenadas), 4 estilos y 4 temas.
 */
export default function LocationEditor({ el, places, onChange }: { el: StoryLocation; places: string[]; onChange: (patch: Partial<StoryLocation>) => void }) {
  const [gpsBusy, setGpsBusy] = useState(false)
  const [gpsMsg, setGpsMsg] = useState('')
  const [askGps, setAskGps] = useState(false)
  const [warned, setWarned] = useState(() => {
    try {
      return window.localStorage.getItem('daiwa_story_loc_warned') === '1'
    } catch {
      return false
    }
  })

  const locateMe = async () => {
    setAskGps(false)
    setGpsBusy(true)
    setGpsMsg('')
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 }))
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch(`/api/places/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, { headers: { Authorization: `Bearer ${token ?? ''}` } })
      const json = (await res.json()) as { label?: string; error?: string }
      if (!res.ok || !json.label) setGpsMsg(json.error ?? 'No se pudo averiguar el lugar. Escríbelo a mano.')
      else onChange({ label: json.label.slice(0, MAX_LOCATION_CHARS) })
    } catch {
      setGpsMsg('No pudimos usar tu ubicación. Escribe el lugar a mano.')
    }
    setGpsBusy(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center py-3 rounded-2xl bg-[linear-gradient(160deg,#3a3a40,#1b1b1f)]" style={{ containerType: 'inline-size' }}>
        <div style={{ width: '260px', fontSize: 0 }}>
          <div style={{ containerType: 'size', width: '260px', height: '60px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
              <LocationSticker el={{ ...el, label: el.label || 'Tu lugar' }} />
            </div>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-[12.5px] text-neutral-400 flex justify-between mb-1">
          <span>¿Dónde estás?</span>
          <span>{el.label.length}/{MAX_LOCATION_CHARS}</span>
        </span>
        <input value={el.label} maxLength={MAX_LOCATION_CHARS} onChange={(e) => onChange({ label: e.target.value })} placeholder="Biblioteca, patio…" className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-[15px] outline-none focus:border-garnet-500" />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {places.map((p) => (
          <button key={p} type="button" onClick={() => onChange({ label: p.slice(0, MAX_LOCATION_CHARS) })} className="rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[13px]">
            {p}
          </button>
        ))}
      </div>

      <div>
        <button type="button" onClick={() => (warned ? void locateMe() : setAskGps(true))} disabled={gpsBusy || !('geolocation' in navigator)} className="rounded-full border border-white/20 px-3.5 py-2 text-[13px] hover:bg-white/10 disabled:opacity-50">
          {gpsBusy ? 'Buscando…' : '📍 Usar mi ubicación actual'}
        </button>
        {askGps && (
          <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[12.5px] text-amber-100 space-y-2">
            <p>Solo se guardará el nombre del lugar (por ejemplo, la ciudad o el barrio), nunca tus coordenadas exactas. Puedes editar o borrar el nombre antes de publicar.</p>
            <div className="flex gap-2">
              <button type="button" className="rounded-full bg-white text-black px-3 py-1.5 text-xs font-medium" onClick={() => { try { window.localStorage.setItem('daiwa_story_loc_warned', '1') } catch { /* nada */ } setWarned(true); void locateMe() }}>Entendido, continuar</button>
              <button type="button" className="rounded-full border border-white/30 px-3 py-1.5 text-xs" onClick={() => setAskGps(false)}>Cancelar</button>
            </div>
          </div>
        )}
        {gpsMsg && <p className="mt-1.5 text-[12px] text-garnet-300">{gpsMsg}</p>}
      </div>

      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">Estilo</p>
        <div className="grid grid-cols-4 gap-1.5">
          {LOCATION_STYLES.map((s) => (
            <button key={s.id} type="button" onClick={() => onChange({ style: s.id })} aria-pressed={el.style === s.id} className={`rounded-xl py-2 text-[12.5px] border ${el.style === s.id ? 'bg-white text-black border-white' : 'border-white/20'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12px] text-neutral-400 mb-1.5">Tema</p>
        <div className="grid grid-cols-4 gap-1.5">
          {THEMES.map((t) => (
            <button key={t.id} type="button" onClick={() => onChange({ theme: t.id })} aria-pressed={el.theme === t.id} className={`rounded-xl py-2 text-[12.5px] border ${el.theme === t.id ? 'bg-white text-black border-white' : 'border-white/20'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {el.theme === 'color' && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {TEXT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => onChange({ color: c })} aria-label={`Color ${c}`} className={`w-6 h-6 rounded-full border-2 ${el.color === c ? 'border-white' : 'border-white/30'}`} style={{ background: c }} />
            ))}
          </div>
        )}
      </div>
      {!warned && <p className="text-[11.5px] text-neutral-500">Compartir tu ubicación puede mostrar dónde estás. Piensa bien si quieres que tus seguidores lo sepan.</p>}
    </div>
  )
}
