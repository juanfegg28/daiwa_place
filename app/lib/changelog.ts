// Notas de versión de Daiwa Place.
// Para publicar una actualización nueva: agrega un objeto AL PRINCIPIO de la lista.
// La versión que se ve en la barra lateral sale automáticamente del primer elemento.

export type Release = {
  version: string
  date: string // AAAA-MM-DD
  title: string
  sections: { heading: string; items: string[] }[]
}

// Daiwa Place todavía no se ha lanzado oficialmente: sigue en etapa beta.
export const RELEASE_STAGE = 'beta'

export const CHANGELOG: Release[] = [
  {
    version: '0.9.2',
    date: '2026-09-28',
    title: 'Fotos, edición y enlaces',
    sections: [
      {
        heading: 'Novedades',
        items: [
          'Ahora puedes subir hasta 4 fotos en una publicación. Se acomodan solas en marcos estilo Facebook según la forma de tus fotos (cuadradas, verticales u horizontales).',
          'Toca cualquier foto para verla completa, sin recortes, y pasa de una a otra con las flechas.',
          'Menú de tres puntitos en publicaciones y comentarios: edita para corregir errores o elimina lo que te arrepientas de haber escrito.',
          'Cada publicación tiene su propio enlace. Desde los tres puntitos puedes copiarlo para compartir esa publicación directamente con otra persona.',
          'Los hilos largos de comentarios ahora se pueden ocultar con "Ocultar respuestas" y volver a abrir con "Ver respuestas".',
          'Al subir tu banner ahora puedes moverlo y hacerle zoom para encuadrarlo, igual que la foto de perfil.',
          'La biografía ahora admite hasta 300 caracteres.',
          'Esta página de novedades, para que siempre sepas qué cambió.',
        ],
      },
      {
        heading: 'Arreglos',
        items: [
          'Las respuestas anidadas ya no se corren cada vez más hacia la derecha en conversaciones largas.',
          'Publicar sin sesión iniciada ya no deja el botón "Publicando..." atascado.',
        ],
      },
    ],
  },
]

export const LATEST_RELEASE = CHANGELOG[0]
export const APP_VERSION = LATEST_RELEASE.version
