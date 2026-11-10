# DaiwaPlace v1.9.0 · «Constelaciones» — instrucciones

Esta versión se hizo **sobre la 1.8.0**, sin reconstruir nada: todo lo anterior sigue igual. No agrega paquetes nuevos (no hace falta `npm install` de nada extra).

## 1) Qué trae

**Círculo Lunar (miembros)**
- Las **31 piezas exclusivas** (14 decoraciones, 5 tarjetas, 3 efectos de entrada, 3 efectos de nombre, 6 títulos), cada una con 10 paletas + color libre. Ya no dice «Pronto».
- **Entrega automática**: quien ya tiene plan activo recibe todo lo de su nivel solo (sin pagar otra vez y sin pulsar «Reclamar»). Lo que ya había reclamado se queda. Si alguien sube de nivel o renueva, también se entrega solo. Lo recibido se conserva aunque la membresía venza (igual que antes).
- **Pestañas nuevas** en `/apoyar`: *Planes · Estilos · Mi membresía*.
- **Estilos** (`/apoyar/estilos`): todas las piezas por nivel (Creciente 8 · Llena 19 · Eclipse 31), con TU foto y TU nombre, para ver cómo quedarían en tu perfil, combinarlas y cambiar de paleta. Las miniaturas se dibujan solo al acercarse y solo se mueve la que señalas.
- **Looks** (en Personalizar, cajón nuevo «Looks»): guarda combinaciones con nombre (2 gratis · 5 Creciente · 10 Llena · 20 Eclipse) y prueba **9 temas** listos.

**Para toda la comunidad (gratis)**
- **Encuestas** en publicaciones normales y de club (2–6 opciones, 1 h a 7 días, % de resultados, un voto por persona; heredan los permisos de publicación del club).
- **Eventos** (`/eventos`, lista + calendario del mes): oficiales y de clubes, «Voy / Quizá», enlace para participar, «Añadir a Google Calendar», aviso al crearlos y recordatorio antes de empezar. Pestaña «Eventos» en cada club y pestaña «Eventos» en el Centro de Mando.
- **Guardados** (`/guardados`): privado, con colecciones (crear, renombrar, eliminar, mover). Botón de marcador en cada publicación.
- **Vitrina** opcional en el perfil (publicaciones tuyas, frases, canciones, recuerdos): la activas/desactivas y es un carrusel compacto en celular.
- **Explorar 2.0**: temas, publicaciones populares, clubes, cuentas nuevas y activas, top 5; la búsqueda también encuentra clubes. Todo sale de UN paquete guardado.
- **Barra lateral** ordenada en secciones (Comunidad · Tu espacio · Equipo); Eventos y Guardados quedan como atajos rápidos junto a Avisos y Mensajes y hay un ícono de Eventos en la barra de arriba del celular.

**Seguridad**
- La **palabra secreta ya no se guarda legible**: solo un hash (bcrypt). Las cuentas existentes se migran en el SQL y la recuperación sigue funcionando. Al recuperar la cuenta se cierran las demás sesiones. Cambiar la palabra ahora tiene límite de intentos.
- RLS reforzado en membresías, economía, códigos, reportes y contenido privado: esas tablas solo se tocan con funciones del servidor (el navegador ya no puede escribir ahí ni `anon` leerlas).
- Los planes Supporter siguen siendo solo estética/comodidad: **sin** moderación y **sin** acceso a datos privados.

**Ahorro (Supabase gratis: egress y log ingestion)**
- Arranque de la app en **1 petición** (`shell_bootstrap`) en vez de 5; el perfil pide sus contadores en **1** llamada (`profile_stats`) en vez de 5–6.
- Los canales en tiempo real (avisos, chats, «conectado») **ya no se cierran y reabren en cada página** (antes eran ~6 aperturas/cierres por cambio de página y un aviso a todos los conectados).
- Contadores con caché de 30 s al cambiar de página; Explorar con caché de 10 min en el dispositivo y 30 min en Supabase.
- Perfil y etiquetas: **me gusta y comentarios ya no vuelven a descargar toda la lista**; «Ver más» del perfil solo baja lo nuevo.
- Vistas previas de enlaces (Discord, WhatsApp…) guardadas 5 min en el servidor: las visitas repetidas no tocan Supabase.
- Fotos de clubes, perfiles e historias con caché de 1 año; `console.*` fuera del código de producción.
- Limpieza diaria más corta de tablas de «registro» (avisos leídos 30 d, eventos de misiones 45 d, intentos de recuperar/canjear 3 d, historial del cron y respuestas de pg_net 1 d / 12 h). **No se toca** `coin_ledger` ni los pagos.

## 2) Cómo instalarla (3 pasos)

1. **Código**: reemplaza tu carpeta del proyecto por la de este ZIP (conserva tu `.env.local`, `.git` y `node_modules`; no cambies `app/icon.png` ni el favicon) y súbelo a GitHub → Vercel despliega solo. Si lo despliegas antes del SQL no pasa nada: las pantallas nuevas avisan «falta correr el SQL» y todo lo anterior sigue funcionando (hay respaldos).
2. **Supabase → SQL Editor** → corre, en este orden y cada uno completo (se pueden repetir sin problema):
   1. `sql/v1.9.0_1_decoraciones_miembros.sql`  (las 31 piezas de miembros; corrige además un fallo del inventario que impedía reclamar)
   2. `sql/v1.9.0_2_constelaciones.sql`  (todo lo demás)
   
   *Requiere haber corrido antes hasta la v1.8.0.* Si algún bloque falla, copia el mensaje de error y mándamelo.
3. **Permiso para eventos oficiales**: Centro de Mando → Roles → activa «Organizar eventos oficiales» (`manage_events`) en el rol que quieras (el administrador supremo ya puede). Los líderes de club crean los eventos de su club sin permiso extra.

Comprobaciones rápidas (SQL Editor, opcionales):
```sql
-- las membresías activas ya recibieron todo (debe haber filas):
select count(*) from public.supporter_perk_claims;
-- palabras secretas ya sin texto legible (en_claro debe ser 0):
select count(*) filter (where security_word is not null) as en_claro,
       count(*) filter (where security_word_hash is not null) as con_hash from public.profiles;
-- las 31 piezas de miembros (decoraciones 14 · tarjetas 5 · entradas 3 · nombres 3 · títulos 6):
select type, count(*) from public.cosmetic_items where collection = 'supporters' group by 1;
```

## 3) Qué probar (5 minutos)
- Una cuenta con membresía: `/apoyar/estilos` (se abre en tu nivel), `/personalizar` → cajón **Looks** (probar tema, guardar look), `/apoyar/mi-membresia` (todo «entregado»).
- Publica con **Encuesta** (en el Inicio y eligiendo un club) y vota desde otra cuenta.
- `/eventos`: crea uno oficial desde el Centro de Mando → Eventos, y uno de club desde la pestaña Eventos del club; confirma «Voy» desde otra cuenta.
- Guarda una publicación (marcador), crea una colección en `/guardados`.
- Perfil → «Crear» vitrina; míralo desde otra cuenta (y con la cuenta privada: no debe verse).
- Recuperar cuenta con la palabra secreta (`/recuperar`) con una cuenta de prueba.
- En el celular: menú lateral, `/eventos`, la vitrina (carrusel) y la galería de estilos.

## 4) Qué se probó y qué NO
- **Probado**: `tsc` sin errores nuevos; `eslint` sin errores nuevos (3 → 2 avisos respecto a la 1.8.0); `next build` completo (con las fuentes de Google simuladas porque aquí no hay internet hacia ellas); el **SQL** corrido dos veces seguido en un Postgres 16 local con un esquema simulado (idempotente) con pruebas de: encuestas (voto único, cerrada, voto a nombre de otro), guardadas (RLS), eventos (permisos, asistencia, avisos, recordatorios), vitrina (privacidad, límites, validación), looks (límite por nivel), entrega automática de membresías (sube de nivel, vence y conserva), Explorar, hash de palabra secreta (incluida la migración de cuentas viejas) y bloqueo de `anon`.
- **No probado**: tu Supabase real, un navegador ni un teléfono reales, PayPal/Ko-fi en vivo. Revisa sobre todo cómo se ven las miniaturas de la galería de Estilos en tu teléfono.

## 5) Notas
- Los eventos **de club** los crean los líderes; los oficiales, quien tenga `manage_events`. El aviso de «evento nuevo» se puede apagar en Configuración → Notificaciones → «Eventos».
- El recordatorio de eventos usa `pg_cron` (cada 30 min). Si tu proyecto no lo tiene, el SQL lo omite y los eventos funcionan igual (solo no hay recordatorio previo).
- Límites por nivel: looks 2/5/10/20 · vitrina 4/6/8/12.
- Si más adelante quieres ahorrar aún más: `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=1` (ya existía) y revisa en Supabase → Reports qué endpoints piden más.
