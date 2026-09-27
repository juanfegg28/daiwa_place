import Logo from './Logo'

export default function AuthLayout({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="min-h-screen bg-ink-950 text-neutral-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'} surface-card rounded-2xl p-6 sm:p-8`}>
        {children}
      </div>
    </div>
  )
}
