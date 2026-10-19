'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PauseIcon, PlayIcon } from '../../icons'
import { fetchPreview, type MusicTrack } from '../../../lib/music'
import Sheet from '../Sheet'

/** Deezer solo da 30 s de cada canción: aquí eliges el momento (5, 10 o 15 s) como en Instagram */
function bars(seed: number, n = 60): number[] {
  let x = (seed % 2147483647) || 7
  return Array.from({ length: n }).map(() => {
    x = (x * 48271) % 2147483647
    return 22 + ((x % 1000) / 1000) * 78
  })
}

function seekAudio(a: HTMLAudioElement, t: number) {
  a.currentTime = t
}

function wireAudio(a: HTMLAudioElement, url: string, start: number, clip: number, onPos: (n: number) => void, onEnd: () => void) {
  a.src = url
  a.volume = 0.4
  a.onended = onEnd
  a.ontimeupdate = () => {
    onPos(a.currentTime)
    if (a.currentTime >= start + clip) a.currentTime = start // en bucle
  }
}

export default function MusicClipSheet({
  open,
  track,
  start,
  clip,
  onClose,
  onDone,
}: {
  open: boolean
  track: MusicTrack | null
  start: number
  clip: number
  onClose: () => void
  onDone: (start: number, clip: number) => void
}) {
  const [s, setS] = useState(start)
  const [c, setC] = useState(clip)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [msg, setMsg] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const noAudio = track?.hasPreview === false

  useEffect(() => {
    if (!open) return
    function init() {
      setS(start)
      setC(clip)
      setMsg('')
    }
    init()
  }, [open, start, clip])

  const stop = () => {
    audioRef.current?.pause()
    setPlaying(false)
  }
  useEffect(() => () => audioRef.current?.pause(), [])
  useEffect(() => {
    if (!open) {
      audioRef.current?.pause()
      function off() {
        setPlaying(false)
      }
      off()
    }
  }, [open])

  const maxStart = 30 - c
  const clampStart = (v: number) => Math.max(0, Math.min(maxStart, v))
  const safeStart = Math.round(clampStart(s))
  const heights = useMemo(() => bars(track?.id ?? 1), [track?.id])

  const play = async () => {
    if (!track) return
    if (playing) return stop()
    setMsg('')
    const url = await fetchPreview(track.id)
    if (!url) {
      setMsg('No se pudo reproducir la canción')
      return
    }
    const a = audioRef.current ?? new Audio()
    audioRef.current = a
    wireAudio(a, url, safeStart, c, setPos, () => setPlaying(false))
    try {
      seekAudio(a, safeStart)
      await a.play()
      setPlaying(true)
    } catch {
      setMsg('No se pudo reproducir la canción')
    }
  }

  const setFromPointer = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    if (!r) return
    const t = ((clientX - r.left) / r.width) * 30 - c / 2
    setS(Math.round(clampStart(t)))
  }

  return (
    <Sheet open={open} onClose={() => { stop(); onClose() }} title="Elige el momento" z={150}
      footer={<button type="button" onClick={() => { stop(); onDone(safeStart, c) }} className="w-full rounded-full bg-garnet-600 py-2.5 text-sm font-medium">Listo</button>}>
      {track && <p className="text-[13px] text-neutral-300 truncate mb-3">♪ {track.title} · {track.artist}</p>}
      {noAudio && <p className="mb-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[12.5px] text-amber-100">Esta canción no tiene fragmento de audio. Se mostrará el sticker pero no sonará.</p>}
      <div
        ref={trackRef}
        className="relative h-20 rounded-xl bg-white/5 flex items-center gap-[2px] px-1 touch-none select-none cursor-pointer"
        onPointerDown={(e) => { dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setFromPointer(e.clientX) }}
        onPointerMove={(e) => dragging.current && setFromPointer(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
      >
        {heights.map((h, i) => (
          <span key={i} className="flex-1 rounded-full bg-white/45" style={{ height: `${h}%` }} />
        ))}
        <div className="absolute top-0 bottom-0 rounded-lg border-2 border-garnet-400 bg-garnet-600/25 pointer-events-none" style={{ left: `${(safeStart / 30) * 100}%`, width: `${(c / 30) * 100}%` }}>
          {playing && <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${Math.min(100, Math.max(0, ((pos - safeStart) / c) * 100))}%` }} />}
        </div>
      </div>
      <div className="flex justify-between text-[11px] text-neutral-500 mt-1"><span>0 s</span><span>30 s</span></div>
      <input type="range" min={0} max={maxStart} step={1} value={safeStart} onChange={(e) => setS(Math.round(Number(e.target.value)))} aria-label="Inicio del fragmento" className="w-full mt-2 accent-[var(--color-garnet-500)]" />
      <div className="flex items-center gap-2 mt-3">
        {[5, 10, 15].map((d) => (
          <button key={d} type="button" onClick={() => { setC(d); setS((v) => Math.min(v, 30 - d)) }} aria-pressed={c === d} className={`flex-1 rounded-full py-2 text-sm border ${c === d ? 'bg-white text-black border-white font-medium' : 'border-white/20'}`}>
            {d} s
          </button>
        ))}
        <button type="button" onClick={play} disabled={noAudio} className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm disabled:opacity-40">
          {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />} Escuchar
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-garnet-300">{msg}</p>}
    </Sheet>
  )
}
