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
    version: '0.10.0',
    date: '2026-10-01',
    title: 'Autoridad, Control y Estatus (Centro de Mando)',
    sections: [
      {
        heading: 'Sistema de roles y permisos',
        items: [
          'Nuevo Centro de Mando (ícono de escudo en la barra lateral), que solo aparece si tienes al menos un rol asignado — y cada quien solo ve ahí las herramientas que su rol le permite usar.',
          'Taller de Roles: se pueden crear roles con nombre y color propios, y marcarles permisos agrupados por riesgo (🟢 seguros, 🟡 avanzados, 🔴 críticos).',
          'Los roles se asignan a cualquier estudiante desde el mismo Centro de Mando, y aparecen como insignia pública junto a su nombre en el inicio y su perfil.',
          'Insignia especial "Creador de Daiwa Place" fija para las cuentas fundadoras, aparte de cualquier rol.',
        ],
      },
      {
        heading: 'Reportes y moderación',
        items: [
          'Además de reportar un perfil, ahora se puede reportar una publicación directamente desde sus tres puntitos.',
          'Bandeja de reportes con botones para ver la evidencia, eliminar la publicación, congelar la cuenta o marcar el caso como resuelto — cada botón solo sale si tienes el permiso correspondiente.',
        ],
      },
      {
        heading: 'Herramientas para el staff',
        items: [
          'Titiritero de Identidades: edita el perfil completo de cualquier estudiante sin necesitar su contraseña, para corregir perfiles que rompan el rol.',
          'Anuncios Globales: un banner que se fija arriba del Inicio de todos los estudiantes.',
          'Modo Mantenimiento: bloquea la página para estudiantes normales mientras se arregla algo, dejando libre el paso solo al staff.',
          'Eliminación Maestra: borra la cuenta de cualquier estudiante directamente desde el Centro de Mando.',
          'Nueva opción oculta en Configuración → Apariencia (solo para cuentas con rol): elegir el color exacto de tu propia insignia.',
        ],
      },
    ],
  },
  {
    version: '0.9.5',
    date: '2026-09-29',
    title: 'Exploración, Conexión y Control',
    sections: [
      {
        heading: 'Conexión entre estudiantes',
        items: [
          'Nuevo botón de Seguir / Siguiendo en cada perfil, con contador público de seguidores y seguidos.',
          'Menú de tres puntitos en cada perfil: Reportar perfil (le llega al admin) y Bloquear usuario (deja de seguirse mutuamente y no pueden interactuar).',
        ],
      },
      {
        heading: 'Explorar',
        items: [
          'Nueva pestaña Explorar en la barra lateral, con buscador por nombre de personaje, @usuario o grado.',
          'Cualquier #hashtag dentro de una publicación ahora es un enlace clicable a un muro exclusivo con todo lo de esa tendencia.',
          'Sección de Tendencias con los 5 hashtags más usados, Top 5 Estudiantes Populares y Nuevos Ingresos para dar la bienvenida a quien acaba de llegar.',
        ],
      },
      {
        heading: 'Publicaciones más claras',
        items: [
          'El nombre del personaje ahora aparece grande y en blanco arriba de cada publicación, con el @usuario chico y discreto debajo — tanto en el inicio como en el perfil.',
        ],
      },
      {
        heading: 'Configuración nueva',
        items: [
          'Nueva página de Configuración con cinco secciones, cada una explicada: Cuenta y Seguridad (cambiar contraseña, cambiar palabra secreta, congelar cuenta, eliminar cuenta), Privacidad (publicaciones públicas o solo para seguidores, Modo Fantasma), Apariencia (modo claro/oscuro y color de acento personalizado con vista previa en vivo), Notificaciones (qué avisos quieres recibir) y Cuentas Bloqueadas.',
          'Para cambiar la contraseña ahora se pide la palabra secreta, y para cambiar la palabra secreta se pide la contraseña — así nadie puede cambiar el otro dato sin saber el primero.',
          'Botón de "ojito" para mostrar u ocultar la contraseña en el registro, inicio de sesión, recuperación de cuenta y en Configuración.',
        ],
      },
      {
        heading: 'Registro más seguro',
        items: [
          'El nombre de personaje ya no acepta fuentes "aesthetic" copiadas y pegadas (matemáticas, góticas, etc.) — solo letras normales.',
          'La palabra secreta ahora queda protegida en la base de datos: ni siquiera se puede leer desde el navegador, solo el servidor la usa para verificarla.',
        ],
      },
    ],
  },
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
