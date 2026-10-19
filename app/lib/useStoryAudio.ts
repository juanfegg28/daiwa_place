'use client'

// Motor de audio del visor de historias (v1.2.0).
//  · Todo arranca en SILENCIO. Solo suena cuando la persona toca el altavoz; una vez activado se mantiene
//    activado al pasar de una historia a otra dentro de esa misma sesión del visor.
//  · Volumen de 0 a 100 %, recordado en el navegador (por defecto 35 %). Nunca se amplifica por encima de 100 %.
//  · Un <audio> propio (no el de MusicProvider). Cada canción pide su enlace FRESCO (los de Deezer caducan).
//  · Sincronía: si activas el sonido a los 6 s de la historia, el audio entra en music_start + 6.
//  · Fundidos de 250 ms al entrar y de 400 ms al salir.
//  · iPhone/Safari: audio.volume es de solo lectura. Se detecta y entonces el audio pasa por Web Audio
//    (GainNode). Para que Web Audio pueda procesarlo, en ese caso el fragmento se baja a través de nuestro
//    servidor (/api/music/stream), que es del mismo dominio y no depende del CORS de Deezer.
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPreview } from './music'
import { supabase } from './supabaseClient'
import { readMusicDisabled } from '../components/MusicProvider'
import { useMusic } from '../components/MusicProvider'
import { lsGet, lsSet } from './stories'

export const STORY_VOLUME_KEY = 'daiwa_story_volume'
export const DEFAULT_STORY_VOLUME = 0.35

export type StoryTrackRef = { id: number; start: number; clip: number }

type Engine = {
  audio: HTMLAudioElement
  ctx: AudioContext | null
  gain: GainNode | null
  needsGain: boolean
  blobUrl: string | null
  trackKey: string | null
  loading: number
  fade: number
  fadeValue: number
  volume: number
}

function readVolume(): number {
  const raw = lsGet(STORY_VOLUME_KEY)
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : DEFAULT_STORY_VOLUME
}

function detectReadOnlyVolume(a: HTMLAudioElement): boolean {
  try {
    a.volume = 0.5
    return a.volume !== 0.5
  } catch {
    return true
  }
}

async function fetchStreamBlob(id: number): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  try {
    const res = await fetch(`/api/music/stream?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    return URL.createObjectURL(await res.blob())
  } catch {
    return null
  }
}

export function useStoryAudio() {
  const music = useMusic()
  const [muted, setMuted] = useState(true)
  const [volume, setVolumeState] = useState(DEFAULT_STORY_VOLUME)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const engineRef = useRef<Engine | null>(null)
  const wantRef = useRef<{ track: StoryTrackRef | null; running: boolean; elapsedMs: () => number }>({
    track: null,
    running: false,
    elapsedMs: () => 0,
  })
  const mutedRef = useRef(true)
  const disabled = music.disabled

  useEffect(() => {
    function init() {
      const v = readVolume()
      setVolumeState(v)
    }
    init()
  }, [])

  const getEngine = useCallback((): Engine => {
    if (engineRef.current) return engineRef.current
    const audio = new Audio()
    audio.preload = 'auto'
    const needsGain = detectReadOnlyVolume(audio)
    const eng: Engine = {
      audio, ctx: null, gain: null, needsGain, blobUrl: null, trackKey: null, loading: 0, fade: 0, fadeValue: 1, volume: readVolume(),
    }
    engineRef.current = eng
    return eng
  }, [])

  // Aplica volumen * fundido a lo que corresponda (GainNode en iPhone, audio.volume en el resto)
  const applyOutput = useCallback((eng: Engine) => {
    const v = Math.min(1, Math.max(0, eng.volume * eng.fadeValue))
    if (eng.gain) eng.gain.gain.value = v
    else if (!eng.needsGain) eng.audio.volume = v
  }, [])

  const fadeTo = useCallback(
    (eng: Engine, target: number, ms: number, done?: () => void) => {
      window.clearInterval(eng.fade)
      const from = eng.fadeValue
      const t0 = performance.now()
      if (ms <= 0) {
        eng.fadeValue = target
        applyOutput(eng)
        done?.()
        return
      }
      eng.fade = window.setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms)
        eng.fadeValue = from + (target - from) * k
        applyOutput(eng)
        if (k >= 1) {
          window.clearInterval(eng.fade)
          done?.()
        }
      }, 25)
    },
    [applyOutput]
  )

  // El contexto de Web Audio se crea/reanuda DENTRO del toque de la persona (política de los navegadores)
  const ensureContext = useCallback(
    (eng: Engine) => {
      if (!eng.needsGain) return
      try {
        if (!eng.ctx) {
          const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          eng.ctx = new Ctor()
          const src = eng.ctx.createMediaElementSource(eng.audio)
          eng.gain = eng.ctx.createGain()
          src.connect(eng.gain)
          eng.gain.connect(eng.ctx.destination)
          applyOutput(eng)
        }
        if (eng.ctx.state === 'suspended') void eng.ctx.resume()
      } catch {
        /* sin Web Audio: se intenta con audio.volume */
      }
    },
    [applyOutput]
  )

  const pauseNow = useCallback(
    (eng: Engine, fadeMs = 0) => {
      const stopIt = () => {
        eng.audio.pause()
        setPlaying(false)
      }
      if (fadeMs > 0 && !eng.audio.paused) fadeTo(eng, 0, fadeMs, stopIt)
      else {
        window.clearInterval(eng.fade)
        stopIt()
      }
    },
    [fadeTo]
  )

  // Reconcilia lo que se quiere (canción, si corre la historia, si hay sonido) con lo que está sonando
  const reconcile = useCallback(async () => {
    const eng = getEngine()
    const want = wantRef.current
    const track = want.track
    if (!track || disabled || readMusicDisabled()) {
      pauseNow(eng, 0)
      if (!track) eng.trackKey = null
      return
    }
    const key = `${track.id}:${track.start}:${track.clip}`
    // otra canción: se carga la nueva (con fundido de salida de la anterior)
    if (eng.trackKey !== key) {
      eng.trackKey = key
      const my = ++eng.loading
      setError('')
      pauseNow(eng, 0)
      let src: string | null = null
      if (eng.needsGain) src = await fetchStreamBlob(track.id)
      else src = await fetchPreview(track.id)
      if (my !== eng.loading) {
        if (eng.needsGain && src) URL.revokeObjectURL(src)
        return
      }
      if (!src) {
        eng.trackKey = null
        setError('No se pudo reproducir la canción')
        return
      }
      if (eng.blobUrl) URL.revokeObjectURL(eng.blobUrl)
      eng.blobUrl = eng.needsGain ? src : null
      eng.audio.src = src
    }
    const elapsed = want.elapsedMs() / 1000
    const wantPlay = want.running && !mutedRef.current && elapsed < track.clip
    if (!wantPlay) {
      pauseNow(eng, 0)
      return
    }
    const pos = track.start + elapsed
    try {
      eng.audio.currentTime = pos
    } catch {
      /* algunos navegadores no dejan mover antes de cargar: se reintenta al empezar */
    }
    eng.fadeValue = 0
    applyOutput(eng)
    try {
      await eng.audio.play()
      setPlaying(true)
      setError('')
      fadeTo(eng, 1, 250)
    } catch {
      setPlaying(false)
      setError('No se pudo reproducir la canción')
    }
  }, [applyOutput, disabled, fadeTo, getEngine, pauseNow])

  // Corta al llegar al final del fragmento, con fundido de salida de 400 ms
  useEffect(() => {
    const id = window.setInterval(() => {
      const eng = engineRef.current
      const t = wantRef.current.track
      if (!eng || !t || eng.audio.paused) return
      if (eng.audio.currentTime >= t.start + t.clip - 0.4) pauseNow(eng, 400)
    }, 120)
    return () => window.clearInterval(id)
  }, [pauseNow])

  // Se calla si se oculta la pestaña
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        const eng = engineRef.current
        if (eng) pauseNow(eng, 0)
      } else void reconcile()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [pauseNow, reconcile])

  // Al montar el visor se calla la música general de la app; al desmontar no queda nada sonando
  const stopGlobal = music.stop
  useEffect(() => {
    stopGlobal()
    return () => {
      const eng = engineRef.current
      if (!eng) return
      window.clearInterval(eng.fade)
      eng.audio.pause()
      eng.audio.removeAttribute('src')
      if (eng.blobUrl) URL.revokeObjectURL(eng.blobUrl)
      void eng.ctx?.close().catch(() => {})
      engineRef.current = null
    }
  }, [stopGlobal])

  /** Dile al motor qué canción corresponde a la historia actual y si el tiempo corre. Se llama en cada cambio. */
  const sync = useCallback(
    (track: StoryTrackRef | null, running: boolean, elapsedMs: () => number) => {
      wantRef.current = { track, running, elapsedMs }
      void reconcile()
    },
    [reconcile]
  )

  /** Altavoz: debe llamarse DENTRO de un toque/clic de la persona */
  const toggleMuted = useCallback(() => {
    if (disabled) return
    const eng = getEngine()
    ensureContext(eng)
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    void reconcile()
  }, [disabled, ensureContext, getEngine, reconcile])

  const setVolume = useCallback(
    (v: number) => {
      const val = Math.min(1, Math.max(0, v))
      setVolumeState(val)
      lsSet(STORY_VOLUME_KEY, String(val))
      const eng = getEngine()
      eng.volume = val
      applyOutput(eng)
      // mover el volumen con sonido apagado lo enciende (como espera la persona)
      if (val > 0 && mutedRef.current && wantRef.current.track) {
        ensureContext(eng)
        mutedRef.current = false
        setMuted(false)
        void reconcile()
      }
    },
    [applyOutput, ensureContext, getEngine, reconcile]
  )

  return { muted, volume, error, playing, disabled, sync, toggleMuted, setVolume }
}
