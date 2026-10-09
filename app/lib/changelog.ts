// Notas de versión de DaiwaPlace.
// Para publicar una actualización nueva: agrega un objeto AL PRINCIPIO de la lista.
// La versión que se ve en la barra lateral sale automáticamente del primer elemento.

export type Release = {
  version: string
  date: string // AAAA-MM-DD
  title: string
  sections: { heading: string; items: string[] }[]
}

// DaiwaPlace todavía no se ha lanzado oficialmente: sigue en etapa beta.
export const RELEASE_STAGE = 'beta'

export const CHANGELOG: Release[] = [
  {
    version: '0.14.0',
    date: '2026-10-08',
    title: 'Música con Deezer',
    sections: [
      {
        heading: 'Música en notas, publicaciones y perfiles',
        items: [
          'Ahora puedes poner una canción en tu perfil (Editar perfil → Canción del perfil), en tus publicaciones (botón Canción) y en tus notas. Se ve como una tarjeta con la carátula, el título, el artista y un botón de play.',
          'Al darle play suena un fragmento de 30 segundos (así lo permite Deezer), con una barra de progreso, un ecualizador y la carátula girando como un disco. Debajo hay un enlace para escuchar la canción completa en Deezer.',
          'El volumen está fijo al 70 %. La música nunca suena sola: solo cuando alguien le da play, y si empiezas otra canción, la anterior se pausa.',
          'Una nota puede ser solo una canción: si no escribes nada, se usa el título.',
        ],
      },
      {
        heading: 'Buscador de canciones',
        items: [
          'Un buscador nuevo con todo el catálogo de Deezer: escribes el nombre de la canción o del artista, escuchas un fragmento antes de elegir y tocas Elegir. Hay botón Ver más canciones para seguir viendo resultados.',
          'Por defecto se ocultan las canciones marcadas como explícitas. El Admin Supremo puede permitirlas en Centro de Mando → Sistema.',
          'En Configuración → Apariencia hay un interruptor para apagar la música en tu dispositivo.',
        ],
      },
      {
        heading: 'Me gusta y publicaciones',
        items: [
          'Al tocar el número de me gusta de una publicación se abre la lista de quién le dio like: primero las personas que sigues y después el resto, con botón de Seguir, igual que en seguidores y seguidos.',
          'Las publicaciones ahora tienen un máximo de 1000 caracteres (con contador mientras escribes) y hasta 4 fotos. Los textos muy largos se recortan en el inicio con un botón Ver más.',
        ],
      },
      {
        heading: 'Detalles',
        items: [
          'Si Supabase rechaza la sesión por un instante (error de relojes desfasados), el inicio ahora reintenta solo en vez de quedarse vacío.',
          'El buscador de música ahora verifica de verdad que tu sesión sea válida y limita las búsquedas por persona.',
        ],
      },
    ],
  },
  {
    version: '0.13.5',
    date: '2026-10-07',
    title: 'Parche de detalles',
    sections: [
      {
        heading: 'Seguidores y seguidos',
        items: [
          'Los números de seguidores y seguidos de cada perfil ahora se pueden tocar y abren la lista completa, con pestañas Seguidores y Siguiendo.',
          'En todos los perfiles aparecen primero las personas que tú sigues y después el resto. Cada fila tiene su botón de Seguir, la etiqueta Amigos o Te sigue, y el puntico verde si un amigo está conectado.',
        ],
      },
      {
        heading: 'Registro y recuperación de cuenta',
        items: [
          'El campo de nombre ahora trae un ejemplo (Ren Shiraishi) y una ayuda: va tu nombre de estudiante, no un usuario como Kai_panzer. Si tiene guion bajo o números te avisamos qué corregir.',
          'Recuperar la cuenta con la palabra secreta ahora tiene límite de intentos y un solo mensaje de error, para que nadie pueda adivinarla ni averiguar qué usuarios existen.',
          'Si un registro se quedaba a medias, ahora puedes terminarlo con la misma contraseña en vez de quedar bloqueado.',
        ],
      },
      {
        heading: 'Mensajes',
        items: [
          'Puedes reportar una conversación completa o un mensaje en particular. El equipo solo ve una copia de los últimos mensajes, nunca el resto del chat.',
          'Nuevo interruptor en Configuración → Privacidad para esconder el «Visto». Si lo apagas, tampoco ves cuándo leen tus mensajes.',
          'El título de la pestaña del navegador muestra cuántas notificaciones y chats tienes sin leer, por ejemplo (3) DaiwaPlace.',
        ],
      },
      {
        heading: 'Rendimiento',
        items: [
          'El inicio y los perfiles cargan las publicaciones de 15 en 15, con botón Ver más, y ya no se traban cuando hay muchas.',
          'En el inicio aparece un aviso cuando hay publicaciones nuevas, sin recargar y sin moverte de donde estás leyendo.',
          'Las fotos cargan solo cuando se acercan a la pantalla y el perfil pide sus datos todos a la vez.',
        ],
      },
      {
        heading: 'Notificaciones y pulido',
        items: [
          'Los me gusta sobre lo mismo se juntan: «Ana, Luis y 3 más le dieron like a tu publicación».',
          'Los reportes del Muro se agrupan por contenido, con el conteo de reportes y los motivos más repetidos, en vez de una tarjeta por cada reporte.',
          'Explorar ya no muestra a las personas que bloqueaste ni a quienes te bloquearon.',
          'Se reemplazaron las ventanas del navegador (alertas y confirmaciones) por avisos de la propia app, y las pantallas de error ahora están en español.',
        ],
      },
    ],
  },
  {
    version: '0.13.0',
    date: '2026-10-05',
    title: 'Muro de los Susurros',
    sections: [
      {
        heading: 'Confesiones anónimas',
        items: [
          'Nueva sección Susurros en la barra lateral: publica una confesión y todos te verán como \"Chismoso Anónimo\". Nadie, ni los demás estudiantes ni los moderadores, puede ver quién la escribió.',
          'Cada susurro tiene un tipo (Confesión, Crush, Chisme, Pregunta u Otro) y se puede filtrar por tipo. Puedes verlos en Recientes o en Populares (hoy, esta semana o siempre), y en Mis susurros están los tuyos, marcados con (tú).',
          'Se vota como en Reddit: flecha hacia arriba o hacia abajo. No puedes votar tu propia confesión y los votos son privados.',
          'Para cuidar el Muro: máximo 5 susurros por día, sin enlaces, y no se puede publicar con la cuenta congelada.',
        ],
      },
      {
        heading: 'Comentarios',
        items: [
          'Al comentar eliges cómo salir: de forma anónima o con tu perfil. Los anónimos aparecen como \"Chismoso Anónimo #1\", \"#2\"… y cada persona conserva su mismo número dentro de la confesión.',
          'Si el autor de la confesión comenta de forma anónima, su comentario lleva la insignia \"Autor\" sin revelar quién es.',
          'Puedes responder comentarios y borrar los tuyos. Te avisamos en Notificaciones cuando comentan tu confesión o responden tu comentario, aunque lo hagan de forma anónima (sin mostrar quién). Puedes apagar estos avisos en Configuración → Notificaciones.',
        ],
      },
      {
        heading: 'Reportes y moderación',
        items: [
          'Puedes reportar una confesión o un comentario por ser muy duro, acoso, datos personales, odio o spam. Tu reporte es privado.',
          'Si 3 personas distintas reportan algo, se oculta solo mientras se revisa.',
          'En el Centro de Mando hay una pestaña nueva, Susurros, para moderar: descartar, eliminar y silenciar al autor por unos días sin saber quién es.',
          'En casos graves, solo quien tenga el permiso especial \"Ver quién escribió un susurro anónimo\" (y el Admin Supremo) puede revelar al autor. Debe escribir un motivo y cada revelación queda registrada en un historial que no se puede borrar.',
          'El Admin Supremo puede pausar todo el Muro con un interruptor si hace falta.',
        ],
      },
    ],
  },
  {
    version: '0.12.0',
    date: '2026-10-04',
    title: 'Mensajes directos y amigos',
    sections: [
      {
        heading: 'Mensajes directos',
        items: [
          'Ya puedes escribirle a otras personas. En cada perfil hay un botón de mensaje (solo el ícono) al lado de Seguir, y en la barra lateral el ícono de Mensajes te muestra cuántos chats tienen mensajes sin leer.',
          'Puedes reaccionar a un mensaje (❤️ 😂 😮 😢 😡 👍), responder a uno en específico, editar tus mensajes, eliminarlos y copiarlos. Con doble clic (o doble toque en el celular) le das ❤️ rápido.',
          'Verás \"Enviado\" y \"Visto\" debajo de tu último mensaje, y los mensajes nuevos llegan solos, sin recargar la página.',
          'Puedes ponerle un apodo a la otra persona (solo tú lo ves) y ese es el nombre que aparece en el chat. También puedes eliminar un chat solo para ti.',
        ],
      },
      {
        heading: 'Solicitudes de mensaje',
        items: [
          'Si alguien que no sigues te escribe, su mensaje llega a la sección Solicitudes y puedes aceptarlo, eliminarlo o bloquear a esa persona.',
          'Las solicitudes no suman en el numerito del ícono de Mensajes de la barra lateral: solo se avisan dentro de la sección Solicitudes. Mientras no te acepten, quien escribe puede enviar hasta 3 mensajes.',
          'Si empiezas a seguir a quien te escribió, la solicitud se acepta sola.',
        ],
      },
      {
        heading: 'Amigos y estado «conectado»',
        items: [
          'Dos personas son amigas cuando se siguen mutuamente. En el perfil verás la etiqueta \"Amigos\".',
          'Tus amigos conectados aparecen con un puntico verde en las fotos (bandeja, chat y notas) y el chat dice \"Conectado\". Se actualiza en cuanto entran o salen de la página.',
          'Puedes apagarlo en Configuración → Privacidad: si lo apagas, nadie te ve conectado y tú tampoco ves el puntico verde de los demás.',
        ],
      },
      {
        heading: 'Notas',
        items: [
          'Arriba de tus mensajes está la fila de notas, como en Instagram: comparte una frase de hasta 60 caracteres que ven tus amigos durante 24 horas.',
          'Con doble clic (o doble toque) en la nota de un amigo le das like. Al abrir una nota ves quiénes le dieron like.',
          'Te avisamos en Notificaciones cuando un amigo le da like a tu nota. Puedes apagar este aviso en Configuración → Notificaciones.',
        ],
      },
      {
        heading: 'Música (primeros pasos)',
        items: [
          'Dejamos preparada la base para conectar Deezer: más adelante podrás poner canciones en tus notas, publicaciones y perfil. Por ahora todavía no se puede elegir música.',
        ],
      },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-10-03',
    title: 'Notificaciones',
    sections: [
      {
        heading: 'Sistema de notificaciones',
        items: [
          'Ahora te llega un aviso cuando alguien le da like a tu publicación o a un comentario tuyo, comenta tu publicación, responde uno de tus comentarios o empieza a seguirte.',
          'La campana de la barra lateral (y la de abajo en el celular) muestra un numerito con las notificaciones que todavía no has leído, y se actualiza sola, sin recargar la página.',
          'Nueva pantalla de Notificaciones: las no leídas se ven resaltadas, puedes filtrar solo las \"Sin leer\", marcar todo como leído o borrar una por una.',
          'Al tocar una notificación te lleva directo a la publicación (abriendo y marcando el comentario del que se trata) o al perfil de quien te siguió.',
          'Si le quitas el like a algo o dejas de seguir a alguien, su aviso desaparece, para que nadie pueda llenarte de notificaciones dando y quitando likes.',
          'No te llegan avisos de tus propias acciones ni de personas bloqueadas.',
        ],
      },
      {
        heading: 'Configuración',
        items: [
          'En Configuración → Notificaciones ya puedes elegir qué avisos recibir: comentarios, respuestas, likes y nuevos seguidores. Lo que apagues deja de llegarte.',
        ],
      },
      {
        heading: 'Perfiles y publicaciones',
        items: [
          'Las publicaciones dentro de un perfil ahora se ven igual que en el inicio: con la foto, el nombre del personaje y el @usuario de quien publica.',
          'La insignia \"Creador de DaiwaPlace\" se ve completa solo en el encabezado del perfil. En las publicaciones (del inicio y del perfil) aparece solo la coronita.',
        ],
      },
    ],
  },
  {
    version: '0.10.1',
    date: '2026-10-02',
    title: 'Ajustes visuales y carrusel de fotos',
    sections: [
      {
        heading: 'Marca',
        items: [
          'Logo actualizado: ahora usa la luna en vez del escudo genérico, y el nombre pasó de "Daiwa Place" a "DaiwaPlace".',
        ],
      },
      {
        heading: 'Arreglos visuales',
        items: [
          'El ícono de comentarios y el de "Mensajes directos" ya no se ven recortados.',
          'El ícono de Configuración ahora es un engranaje de verdad (antes parecía un sol).',
          'La tarjeta de tu cuenta, abajo en la barra lateral de escritorio, ahora es un botón que te lleva directo a tu perfil, con tu nombre de personaje grande arriba y tu @usuario chico debajo — igual que en las publicaciones.',
        ],
      },
      {
        heading: 'Fotos',
        items: [
          'Las publicaciones con varias fotos ahora se ven como un carrusel estilo Instagram: una foto a la vez, con flechas para pasar con el mouse en computador y deslizando con el dedo en el celular.',
          'Cada foto respeta su tamaño real, sin recortarla en cuadros forzados, y el tamaño del post se ajusta solo (de forma suave) según cada foto.',
          'En pantallas grandes, el alto de la foto queda limitado para que el nombre del autor y los botones de like/comentar siempre se vean sin necesidad de hacer scroll.',
        ],
      },
    ],
  },
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
          'Insignia especial "Creador de DaiwaPlace" fija para las cuentas fundadoras, aparte de cualquier rol.',
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
