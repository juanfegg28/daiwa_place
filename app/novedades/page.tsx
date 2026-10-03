'use client'

import AppShell from '../components/AppShell'
import { CHANGELOG, RELEASE_STAGE } from '../lib/changelog'

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function NovedadesPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-display font-semibold mb-1 text-neutral-50">Novedades</h1>
        <p className="text-neutral-500 text-sm mb-6">Todo lo que va cambiando en DaiwaPlace</p>

        {RELEASE_STAGE === 'beta' && (
          <div className="rounded-2xl border border-garnet-700/60 bg-garnet-700/10 px-4 py-3 mb-6">
            <p className="text-sm font-semibold text-garnet-300 mb-0.5">Etapa beta</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              DaiwaPlace todavía no se ha lanzado oficialmente. Estamos probando y puliendo detalles, así que
              pueden aparecer cambios y errores mientras tanto.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {CHANGELOG.map((release, index) => (
            <section key={release.version} className="surface-card rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-garnet-400">v{release.version}</span>
                {RELEASE_STAGE === 'beta' && (
                  <span className="text-[10px] uppercase tracking-wide border border-garnet-500/60 text-garnet-300 rounded-full px-2 py-0.5">
                    Beta
                  </span>
                )}
                {index === 0 && (
                  <span className="text-[10px] uppercase tracking-wide bg-garnet-600/90 text-white rounded-full px-2 py-0.5">
                    Última actualización
                  </span>
                )}
                <span className="text-xs text-neutral-500">{formatDate(release.date)}</span>
              </div>
              <h2 className="text-lg font-semibold text-neutral-50 mb-4">{release.title}</h2>

              <div className="space-y-4">
                {release.sections.map((section) => (
                  <div key={section.heading}>
                    <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{section.heading}</h3>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm text-neutral-200 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-garnet-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
