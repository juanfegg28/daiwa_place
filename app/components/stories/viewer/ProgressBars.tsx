/** Una barra por historia de esa persona: las anteriores llenas, la actual avanza, las siguientes vacías */
export default function ProgressBars({ count, index, progress }: { count: number; index: number; progress: number }) {
  return (
    <div className="flex gap-[3px] w-full" aria-label={`Historia ${index + 1} de ${count}`}>
      {Array.from({ length: count }).map((_, i) => {
        const w = i < index ? 100 : i === index ? Math.round(Math.min(1, Math.max(0, progress)) * 1000) / 10 : 0
        return (
          <div
            key={i}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(w)}
            aria-current={i === index ? 'step' : undefined}
            className="h-[2.5px] flex-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,.32)' }}
          >
            <div className="h-full bg-white rounded-full" style={{ width: `${w}%`, transition: i === index ? 'width .1s linear' : 'none' }} />
          </div>
        )
      })}
    </div>
  )
}
