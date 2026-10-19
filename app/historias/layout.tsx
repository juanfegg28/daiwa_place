import type { ReactNode } from 'react'
import { STORY_FONT_CLASSES } from '../lib/storyFonts'

// Todas las pantallas de historias (editor, visor, archivo) cargan sus fuentes aquí y nada más.
export default function HistoriasLayout({ children }: { children: ReactNode }) {
  return <div className={STORY_FONT_CLASSES}>{children}</div>
}
