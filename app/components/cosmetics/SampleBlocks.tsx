'use client'

/** Bloques de muestra (bio, chips, contadores) con las mismas clases del perfil real: para el estudio y la galería de pruebas. */
export default function SampleBlocks({ bio, grado = '3er año' }: { bio?: string | null; grado?: string }) {
  return (
    <>
      <div className="pf-box">
        <p className="text-sm text-neutral-200 mb-0 leading-relaxed whitespace-pre-wrap">{bio || 'Colecciono estrellas, playlists y atardeceres. Así se verá tu biografía.'}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="pf-chip inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">🎓 {grado}</span>
        <span className="pf-chip inline-flex items-center gap-1.5 bg-ink-800/70 border border-ink-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">📅 28 de febrero</span>
      </div>
      <p className="text-xs text-neutral-600 mb-4">Se unió en septiembre de 2026</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm [&>*]:whitespace-nowrap">
        <span><b className="text-neutral-100">9</b> <span className="text-neutral-500">publicaciones</span></span>
        <span><b className="text-neutral-100">35</b> <span className="text-neutral-500">seguidores</span></span>
        <span><b className="text-neutral-100">37</b> <span className="text-neutral-500">seguidos</span></span>
      </div>
    </>
  )
}
