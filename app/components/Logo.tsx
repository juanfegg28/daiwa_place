import { SealIcon } from './icons'

const sizes = {
  sm: { seal: 'w-6 h-6', text: 'text-base', gap: 'gap-1.5' },
  md: { seal: 'w-8 h-8', text: 'text-xl', gap: 'gap-2' },
  lg: { seal: 'w-11 h-11', text: 'text-3xl', gap: 'gap-3' },
} as const

export default function Logo({ size = 'md' }: { size?: keyof typeof sizes }) {
  const s = sizes[size]
  return (
    <div className={`flex items-center ${s.gap} text-garnet-400`}>
      <SealIcon className={`${s.seal} shrink-0 drop-shadow-[0_0_10px_rgba(200,27,62,0.35)]`} />
      <span
        className={`font-display font-semibold tracking-wide text-neutral-50 ${s.text}`}
        style={{ letterSpacing: '0.03em' }}
      >
        Daiwa Place
      </span>
    </div>
  )
}
