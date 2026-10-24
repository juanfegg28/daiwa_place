// Notas de versión de DaiwaPlace.
// Para publicar una actualización nueva: agrega un objeto AL PRINCIPIO de la lista.
// La versión que se ve en la barra lateral es APP_VERSION (al final de este archivo).

export type Release = {
  version: string
  date: string // AAAA-MM-DD
  title: string
  sections: { heading: string; items: string[] }[]
}

// 'beta' muestra el aviso y la etiqueta "Beta" en Novedades; 'stable' los oculta.
// Desde la v1.0.0 DaiwaPlace ya está lanzado oficialmente.
export const RELEASE_STAGE: 'beta' | 'stable' = 'stable'

export const CHANGELOG: Release[] = [
  {
    version: '1.4.0',
    date: '2026-10-23',
    title: 'Tienda y Estilo',
    sections: [
      {
        heading: 'La tienda abre ✨',
        items: [
          'Ya puedes gastar tus Lunas ☾: decoraciones de avatar animadas, tarjetas de perfil, efectos de entrada, efectos de nombre, fuentes, fondos y títulos.',
          'Cada cosmético se ve sobre TU foto y TU nombre antes de comprarlo. Elige entre las paletas que trae, y los Legendarios admiten color libre.',
          'Colecciones con pack (−20 %): al completar una colección ganas su insignia, un título exclusivo y 400 ☾.',
          'Pack Bienvenida gratis (elige 3 decoraciones, 3 fuentes y 3 títulos comunes) y, para las cuentas de la beta, el Pack Fundador ahora trae también su Marco Fundador, insignia, título y Oro foil.',
        ],
      },
      {
        heading: 'Tu perfil con estilo',
        items: [
          'Estudio de personalización con vista previa en vivo y probador: toca lo que no es tuyo para probarlo gratis y cómpralo desde la barra de abajo.',
          'Tu inventario en la tienda: equipa y quita cosas con un toque.',
          'Las tarjetas de la tienda reemplazan el encabezado del perfil (tu banner va dentro) y debajo quedan tus botones, roles y clubes. Los fondos y los efectos de entrada se ven al abrir tu perfil.',
          'Las decoraciones y los efectos de nombre también aparecen en tus publicaciones y comentarios.',
          'Nuevo en Configuración → Apariencia: animaciones de perfiles (todas / solo en perfiles / ninguna) y efectos de nombre (completa / ligera / plana). Respetamos «reducir movimiento» de tu teléfono.',
        ],
      },
      {
        heading: 'Misiones y Lunas más claras',
        items: [
          'Tu racha ahora se entiende de un vistazo: días seguidos, si hoy ya cuenta, tus últimos 7 días y cuánto falta para el siguiente premio.',
          'Tu saldo se ve más destacado en el menú, en el celular y en Misiones.',
          'Cuando completes una misión aparece un puntito dorado en todos los íconos de Misiones hasta que reclames el premio.',
          'Nuevos logros: «5 cosméticos en tu colección» y «Primera colección completa».',
        ],
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-10-20',
    title: 'Lunas y Misiones',
    sections: [
      {
        heading: 'Las Lunas ☾',
        items: [
          'Nueva moneda de DaiwaPlace: las Lunas ☾. Se ganan con misiones, rachas y logros; no se compran ni se regalan.',
          'Chip con tu saldo en el menú (y en la cabecera del celular) y un historial de movimientos en Mi saldo.',
          'Bienvenida de 150 ☾ para todas las cuentas y Pack Fundador (+300 ☾) para quienes llegaron durante la beta.',
        ],
      },
      {
        heading: 'Misiones',
        items: [
          '3 misiones diarias (fácil, media y difícil) y 4 semanales, con bono por completar las 3 del día y cofre semanal.',
          'Misiones de bienvenida y logros, racha diaria con premios a los 3, 7, 14 y 30 días, y la opción de cambiar una misión del día.',
          'El progreso lo cuenta el servidor con lo que haces de verdad: no se puede completar a mano ni repitiendo seguir y dejar de seguir.',
        ],
      },
      {
        heading: 'Personaliza tu perfil (gratis)',
        items: [
          'Color del perfil: lo ven todas las personas al entrar a tu perfil (24 colores o uno libre). No cambia el color de tu propia app.',
          'Color de tu nombre en publicaciones, comentarios y mensajes, y color de tu tarjeta (sólida, degradado o vidrio).',
          'Nuevo Estudio de personalización con vista previa en vivo. El texto siempre se lee, elijas el color que elijas.',
        ],
      },
      {
        heading: 'Identidad',
        items: [
          'Las identidades comunes (Hombre, Mujer, No binario, Género fluido, Agénero y Andrógino) ahora salen como un chip más, solo con el nombre.',
          'Las identidades especiales conservan su tarjeta y estrenan un sello animado propio.',
          'Nuevo: tú decides quién ve tu identidad (todos, solo seguidores o nadie).',
        ],
      },
      {
        heading: 'Tienda y códigos',
        items: [
          'Nueva Tienda (el catálogo llega muy pronto) con la sección Canjear código para los códigos que reparte el equipo.',
          'Centro de Mando: nueva pestaña Tienda y Lunas con códigos (en lote y CSV), misiones editables, economía, ajuste manual y ajustes.',
        ],
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-10-18',
    title: 'Historias',
    sections: [
      {
        heading: 'Historias de 24 horas',
        items: [
          'Publica una historia con foto o solo texto: texto en 8 estilos y colores, emojis, ubicación y una hora que tú personalizas (8 diseños de reloj).',
          'Música en tus historias: elige el momento de la canción (5, 10 o 15 s) y un sticker con su carátula en 6 diseños. Al ver una historia el sonido empieza apagado y tú controlas el volumen.',
          'Solo ves a quien sigues, y tus amigos van primero. Elige si tu historia la ven tus seguidores o solo tus amigos. Máximo 3 historias cada 24 horas.',
        ],
      },
      {
        heading: 'Interacción',
        items: [
          'Responde a una historia (te llega como mensaje directo con una tarjeta de contexto) o dale like con doble toque. Los likes te llegan como aviso.',
          'En tu historia ves quién la vio y a quién le gustó: las personas con corazón salen arriba de todo.',
        ],
      },
      {
        heading: 'Destacadas y archivo',
        items: [
          'Guarda tus mejores historias en destacadas con portada y título, en tu perfil. Tus historias vencidas se quedan 30 días en tu archivo privado.',
          'Reporta historias y silencia las de alguien desde el menú ⋯. El equipo las revisa en el Centro de Mando.',
        ],
      },
      {
        heading: 'Menú más limpio',
        items: ['Avisos y Mensajes ahora son más pequeños y Clubes y Pandillas ya no resalta: se ve igual que las demás opciones.'],
      },
    ],
  },
  {
    version: '1.1.10',
    date: '2026-10-17',
    title: 'Compartidos, ocultar usuarios, identidades y tarjetas para Discord',
    sections: [
      {
        heading: 'Compartidos',
        items: [
          'Nuevo botón 🔁 junto al like y los comentarios, con su contador. Un toque comparte la publicación en tu perfil y otro toque la quita. Si ya la compartiste, el ícono se ve del color de acento.',
          'En el Inicio y en el perfil, lo compartido aparece mezclado con las publicaciones, del más nuevo al más viejo, con una cabecera «@usuario compartió».',
          'Solo se pueden compartir publicaciones de cuentas públicas. No puedes compartir las tuyas ni las de cuentas que bloqueaste o que te bloquearon, y solo una vez por publicación. Si se borra la original, también desaparecen sus compartidos.',
          'Recibes un aviso cuando alguien comparte una publicación tuya. Lo puedes apagar en Configuración → Notificaciones.',
        ],
      },
      {
        heading: 'Ocultar usuarios y preferencia del feed',
        items: [
          'En el menú ⋯ de cualquier publicación ya puedes elegir «Ocultar publicaciones de este usuario». Dejas de verlo en el Inicio y en Clubes y Pandillas, pero sí lo ves si entras a su perfil. Nadie se entera.',
          'Configuración → Feed: elige qué ves en el Inicio (Todos, Siguiendo o Amigos) y mira o deshaz tu lista de usuarios ocultos.',
        ],
      },
      {
        heading: 'Identidades',
        items: [
          'Nuevo selector de Identidad en el registro y en Editar perfil, con más de 20 opciones (de Hombre y Mujer a Ángel caído, Alien, Diva, NPC, Supernova, Batman y Vampiro/a).',
          'Algunas identidades desbloquean un campo especial (por ejemplo, Planeta natal para Alien o Año de conversión para Vampiro/a) que se muestra destacado en la cabecera de tu perfil.',
        ],
      },
      {
        heading: 'Tarjetas de enlace',
        items: [
          'Al pegar un enlace de DaiwaPlace en Discord y otras redes, ahora sale una tarjeta con título, descripción e imagen: para el sitio, las publicaciones, los perfiles y los clubes.',
          'Si la cuenta es solo para seguidores, está congelada o ya no existe, la tarjeta es la genérica de DaiwaPlace: nunca se muestra contenido privado.',
        ],
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-16',
    title: 'Clubes y Pandillas, fotos que se autodestruyen y menú nuevo',
    sections: [
      {
        heading: 'Clubes y Pandillas',
        items: [
          'Nueva sección «Clubes y Pandillas» en el menú, con un feed exclusivo: solo salen las publicaciones de personas que pertenecen a un club o a una pandilla.',
          'A la derecha (en PC) o en una tira deslizable (en celular) descubres los clubes y pandillas que existen, en un orden distinto cada vez que recargas. Cada uno muestra su foto, su banner y si es «Club» o «Pandilla». Arriba hay un buscador por nombre.',
          '¿Eres el líder oficial de un grupo? Toca «Solicitar crear Club/Pandilla». Es solo para crear la página web: el grupo ya debe estar oficializado en Discord y en el rol de Gakuran. El equipo la acepta o la declina desde el Centro de Mando (pestaña Clubes).',
          'Si te aprueban, te llega una notificación con un enlace personal, de un solo uso, para crear la página con el mismo editor de recorte y zoom del registro.',
          'Cada club tiene su propia página: información, miembros, feed de sus integrantes y un Tablón de anuncios fijado donde el líder deja comunicados («Hoy a las 8 PM reunión en la azotea»).',
          '«Solicitar Unirse»: avisa que debes haber coordinado tu ingreso con el líder por Discord. El líder acepta o declina desde su panel.',
          'El líder administra solo su club: recibe el rol «Líder de [nombre]» y puede crear roles de adorno (Tesorero, Comandante...) para sus miembros. Esos roles NO dan ningún permiso en DaiwaPlace.',
          'Las etiquetas de club se ven junto al nombre en el feed y en el perfil, con un diseño distinto (borde punteado, color del club) al de las insignias oficiales de Staff y Dev, para que nadie las confunda con una autoridad.',
        ],
      },
      {
        heading: 'Fotos que se autodestruyen en los DMs',
        items: [
          'Ahora puedes enviar fotos por mensaje directo. Antes de enviar tienes que elegir cuánto duran: 1, 4, 8, 12 o 24 horas.',
          'La foto muestra una cuenta regresiva y desaparece del chat cuando se cumple el tiempo. Se guardan en un espacio privado: nadie con el enlace puede verlas.',
          'No se puede impedir que alguien haga una captura de pantalla. Envía solo lo que te sientas cómodo/a compartiendo.',
        ],
      },
      {
        heading: 'Menú nuevo',
        items: [
          'En el celular ya no hay barra de abajo: ahora hay un botón de 3 rayitas arriba que abre un panel lateral con todas las opciones. Una burbuja roja con número te avisa cuando tienes mensajes o notificaciones nuevas.',
          'En PC, Notificaciones y Mensajes salieron de la lista y ahora están arriba del menú lateral, en botones grandes y separados, con su numerito.',
        ],
      },
      {
        heading: 'Comentarios más claros',
        items: [
          'Cada respuesta dice «En respuesta a @usuario». Al tocarlo te lleva al comentario original y lo resalta.',
          'Mientras respondes, aparece un recuadro «Respondiendo a @usuario» con un resumen de lo que le contestas, y ese comentario queda resaltado. La caja de abajo ahora dice «Comenta la publicación».',
          'Los comentarios muestran el nombre del personaje, el @usuario y una etiqueta «Autor» si lo escribió quien publicó. La línea del hilo (como en Reddit) se puede tocar para ocultar las respuestas.',
        ],
      },
      {
        heading: 'Más saludos',
        items: [
          'La caja de publicar tiene muchos más saludos según la hora, y ahora también según el día de la semana (lunes de ánimo, viernes de plan, domingo de pereza) y horas especiales como la merienda o la madrugada.',
        ],
      },
    ],
  },
  {
    version: '1.0.6',
    date: '2026-10-15',
    title: 'Pregunta del día, formato de texto y publicación fijada',
    sections: [
      {
        heading: '#PreguntaDelDia',
        items: [
          'Nueva tarjeta en el Inicio con la pregunta del día. Al darle «Responder», la caja de publicar se llena sola con #PreguntaDelDia y la pregunta, y el cursor queda en el renglón de abajo para escribir tu respuesta.',
          'Con «Ver respuestas» entras a la página de #PreguntaDelDia y ves lo que respondió todo el mundo.',
        ],
      },
      {
        heading: 'Escribe con estilo',
        items: [
          'Ahora puedes poner texto en negrita, cursiva y subrayado en tus publicaciones, con los botones B, I y U de la caja de publicar (también al editar) o con Ctrl + B, I y U en el computador. También funciona escribiéndolo: **negrita**, *cursiva* y __subrayado__.',
          'La caja de publicar te saluda según la hora de tu dispositivo: buenos días, buen provecho a la hora del almuerzo, buenas noches o hasta un «¿trasnochando?» de madrugada, con tu primer nombre.',
        ],
      },
      {
        heading: 'Tu perfil',
        items: [
          'Puedes fijar una de tus publicaciones en tu perfil: aparece de primera con la etiqueta «Publicación fijada». Entra a tu perfil, abre el menú ⋯ de la publicación y elige «Fijar en mi perfil» (o «Desfijar»). Solo puede haber una fijada a la vez.',
        ],
      },
      {
        heading: 'Pequeños detalles',
        items: [
          'En el computador, la fila de notas de Mensajes ahora tiene flechas para desplazarte hacia los lados.',
          'La música ahora suena al 40 % de volumen.',
        ],
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-13',
    title: 'Inauguración de DaiwaPlace',
    sections: [
      {
        heading: 'Ya es oficial',
        items: [
          '¡DaiwaPlace se inaugura! Termina la etapa beta y arranca la versión 1.0.0: perfiles, publicaciones, mensajes, notas, música, etiquetas y el Muro de los Susurros, todo listo para el servidor.',
          'Gracias a todas las personas que probaron la página y reportaron detalles durante la beta: gracias a ustedes llegamos pulidos al lanzamiento.',
        ],
      },
      {
        heading: 'Etiquetas (@)',
        items: [
          'Ahora puedes etiquetar a alguien escribiendo @ en una publicación, un comentario, una respuesta o una confesión del Muro. Se abre una lista con tus amigos (las personas que se siguen mutuamente) y, mientras sigues escribiendo, se vuelve un buscador de cualquiera en DaiwaPlace. En el computador la manejas con ↑ ↓ y Enter; en el celular, con el dedo.',
          'En la caja de publicar hay un nuevo botón «Etiquetar» (@) por si prefieres abrir la lista desde ahí.',
          'Las etiquetas se ven como enlaces que llevan directo al perfil de la persona.',
          'A quien etiquetas le llega una notificación: «te etiquetó en su publicación», «te etiquetó en un comentario» o, en el Muro, «Chismoso Anónimo te etiquetó en una confesión» (sin revelar quién fue). Si ya le avisamos por ese mismo comentario, no se duplica.',
          'Puedes apagar estos avisos en Configuración → Notificaciones → Etiquetas. No se avisa a quien te bloqueó o a quien no puede ver tu publicación, y hay un límite de 5 etiquetas por publicación o comentario (3 en el Muro) para evitar el spam.',
        ],
      },
      {
        heading: 'Pequeños detalles',
        items: [
          'Susurros estrena un nuevo ícono en la barra lateral y en la barra de abajo del celular: un fantasmita.',
          'La caja de «¿Qué está pasando en Daiwa?» ya no se ve chiquita ni recorta lo que escribes: crece a medida que redactas para que veas tu texto completo. Pasa lo mismo al editar una publicación.',
        ],
      },
    ],
  },
  {
    version: '0.15.0',
    date: '2026-10-11',
    title: 'Acceso premium',
    sections: [
      {
        heading: 'Un acceso más bonito',
        items: [
          'Iniciar sesión y Registrarse se rediseñaron por completo: fondo oscuro con destellos suaves de tu color, tarjeta de cristal esmerilado y campos amplios con íconos que se iluminan cuando escribes.',
          'Dan la bienvenida con un mensaje cálido («Descubre tu lugar. Únete a DaiwaPlace»).',
          'Al cambiar entre Iniciar sesión y Registrarse, el formulario se desliza suavemente en vez de recargar la página: el fondo y la tarjeta se quedan quietos.',
        ],
      },
      {
        heading: 'Registro ameno, en 2 pasos',
        items: [
          'El registro ahora es en dos pasos cortos: «Tu cuenta» y «Tu perfil» (este último es todo opcional).',
          'Todo se valida mientras escribes, con avisos suaves y sin textos rojos gigantes.',
          'Tu @usuario se corrige solo mientras tecleas: minúsculas, guion bajo en vez de espacios, sin tildes ni símbolos raros. Si está libre, aparece un ✓ verde con «¡Gran nombre!».',
        ],
      },
      {
        heading: 'Seguridad amable',
        items: [
          'Medidor de contraseña con textos cercanos: «Un poco débil», «Casi lista» y «¡Inquebrantable!». Para crear la cuenta se piden mínimo 8 caracteres y al menos un número, y se avisa si la contraseña es muy fácil de adivinar.',
          'Si fallas la contraseña 4 veces, el botón se pone en gris con una cuenta regresiva: «Demasiados intentos. Tómate un respiro de 60s ☕». La pausa se mantiene aunque recargues la página.',
          'La palabra secreta ahora debe tener al menos 4 caracteres.',
        ],
      },
    ],
  },
  {
    version: '0.14.5',
    date: '2026-10-10',
    title: 'Optimización móvil',
    sections: [
      {
        heading: 'Se siente como una app',
        items: [
          'La barra de abajo y la de arriba en el celular tienen un efecto de cristal más limpio y respetan el borde de los iPhone y Android modernos, para que los íconos no queden pegados al borde de la pantalla.',
          'Los íconos de la barra de abajo rebotan suavemente al activarse y la pestaña activa se resalta con una píldora de color.',
          'Los menús de tres puntitos y los cuadros de diálogo (reportar, confirmar, notas, apodo…) ahora suben desde abajo como una hoja nativa en el celular. En el computador siguen centrados.',
          'Todos los botones se hunden un poquito al tocarlos, así sientes la respuesta al instante, incluso antes de que el servidor conteste.',
        ],
      },
      {
        heading: 'Más rápido y con menos datos',
        items: [
          'Las fotos de perfil, el banner y las fotos de las publicaciones ahora se optimizan: se descargan en el tamaño justo para tu pantalla y en un formato más liviano.',
          'Solo se cargan con prioridad lo primero que ves (la primera publicación y tu perfil); el resto se carga cuando te acercas, y el espacio de cada foto se reserva para que nada salte mientras carga.',
          'Márgenes y espacios más ajustados en pantallas pequeñas para aprovechar mejor el espacio sin amontonar el texto.',
        ],
      },
    ],
  },
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
// Versión que se muestra en la app. Si un parche pequeño (1.0.x) no lleva notas en el changelog, igual se sube este número a mano.
export const APP_VERSION = '1.4.0'
