'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { MUSIC_VOLUME, fetchPreview } from '../lib/music'

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

type MusicContextValue = {
  currentId: number | null
  status: Status
  /** 0 a 1 */
  progress: number
  error: string
  /** La persona apagó la música en Configuración */
  disabled: boolean
  toggle: (track: { id: number; preview?: string | null }) => void
  stop: () => void
}

const MusicContext = createContext<MusicContextValue>({
  currentId: null,
  status: 'idle',
  progress: 0,
  error: '',
  disabled: false,
  toggle: () => {},
  stop: () => {},
})

export const useMusic = () => useContext(MusicContext)

const PREF_KEY = 'daiwa_music_off'
const PREF_EVENT = 'daiwa-music-pref'

/** Apaga o enciende la música en este dispositivo (se guarda en el navegador). */
export function setMusicDisabled(off: boolean) {
  try {
    if (off) window.localStorage.setItem(PREF_KEY, '1')
    else window.localStorage.removeItem(PREF_KEY)
  } catch {
    /* sin acceso al almacenamiento: no pasa nada */
  }
  window.dispatchEvent(new Event(PREF_EVENT))
}

export function readMusicDisabled(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Un solo reproductor para toda la app: si suena una canción, la anterior se pausa.
 * Volumen fijo al 70 %. Nunca arranca sola: solo cuando alguien le da play.
 */
export default function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const requestRef = useRef(0)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [disabled, setDisabled] = useState(false)

  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current
    const audio = new Audio()
    audio.preload = 'none'
    audio.volume = MUSIC_VOLUME
    audio.addEventListener('timeupdate', () => {
      if (audio.duration > 0) setProgress(Math.min(1, audio.currentTime / audio.duration))
    })
    audio.addEventListener('ended', () => {
      setStatus('idle')
      setProgress(0)
      setCurrentId(null)
    })
    audio.addEventListener('error', () => {
      // Si no hay fuente (src vacío) no es un error real
      if (!audio.getAttribute('src')) return
      setStatus('error')
      setError('No se pudo reproducir esta canción.')
    })
    audioRef.current = audio
    return audio
  }, [])

  const stop = useCallback(() => {
    requestRef.current += 1
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    setStatus('idle')
    setProgress(0)
    setCurrentId(null)
    setError('')
  }, [])

  // Preferencia "No reproducir música" (Configuración)
  useEffect(() => {
    function sync() {
      const off = readMusicDisabled()
      setDisabled(off)
      if (off) stop()
    }
    sync()
    window.addEventListener(PREF_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PREF_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [stop])

  // Al cerrar la pestaña o salir, se calla
  useEffect(() => {
    const onHide = () => audioRef.current?.pause()
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      audioRef.current?.pause()
    }
  }, [])

  const toggle = useCallback(
    (track: { id: number; preview?: string | null }) => {
      if (disabled) {
        setError('La música está desactivada en Configuración.')
        setStatus('error')
        setCurrentId(track.id)
        return
      }
      const audio = getAudio()

      // La misma canción: pausa o sigue
      if (currentId === track.id && (status === 'playing' || status === 'paused')) {
        if (status === 'playing') {
          audio.pause()
          setStatus('paused')
        } else {
          audio.volume = MUSIC_VOLUME
          audio.play().then(() => setStatus('playing')).catch(() => {
            setStatus('error')
            setError('Tu navegador no dejó reproducir el audio.')
          })
        }
        return
      }

      // Otra canción: se corta la anterior y se carga esta
      const myRequest = ++requestRef.current
      audio.pause()
      setCurrentId(track.id)
      setStatus('loading')
      setProgress(0)
      setError('')

      const start = async () => {
        // El enlace que viene de la búsqueda es fresco; si no hay, se pide uno nuevo
        const url = track.preview || (await fetchPreview(track.id))
        if (myRequest !== requestRef.current) return // se eligió otra mientras cargaba
        if (!url) {
          setStatus('error')
          setError('Esta canción no tiene fragmento de audio disponible.')
          return
        }
        audio.src = url
        audio.volume = MUSIC_VOLUME
        try {
          await audio.play()
          if (myRequest === requestRef.current) setStatus('playing')
        } catch {
          if (myRequest !== requestRef.current) return
          setStatus('error')
          setError('Tu navegador no dejó reproducir el audio. Toca de nuevo el botón de play.')
        }
      }
      void start()
    },
    [currentId, status, disabled, getAudio]
  )

  return (
    <MusicContext.Provider value={{ currentId, status, progress, error, disabled, toggle, stop }}>
      {children}
    </MusicContext.Provider>
  )
}
