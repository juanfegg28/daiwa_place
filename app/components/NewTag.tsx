'use client'

/**
 * v1.5.10 · Etiqueta chiquita y brillante de «novedad». Toma el color del tema de la persona (las variables garnet-* siguen su color de acento),
 * no cambia el tamaño de ningún ícono y respeta «reducir movimiento».
 *   · variante «text»: solo letras que brillan (barra lateral, pestañas)
 *   · variante «dot»: puntito que brilla (barra lateral minimizada)
 */
export default function NewTag({ children = 'Novedad', variant = 'text', className = '' }: { children?: string; variant?: 'text' | 'dot'; className?: string }) {
  if (variant === 'dot') {
    return <span className={`new-glow-dot pointer-events-none absolute ${className}`} role="img" aria-label={children} />
  }
  return (
    <span className={`new-glow pointer-events-none select-none shrink-0 ${className}`} role="status" aria-label={children}>
      {children}
    </span>
  )
}
