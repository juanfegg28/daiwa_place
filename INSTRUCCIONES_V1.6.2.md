# DaiwaPlace v1.6.2 «Estado, menciones en historias y sugerencias» — paso a paso (en criollo)

Qué trae: (1) **Estado** tipo SpaceHey («Estado: Vegetal») que sale en el perfil y como tarjetita en el Inicio, (2) **menciones @ en las historias**, (3) **sugerencias de seguimiento** en el Inicio y (4) **mejoras para celular y APK**.

Trae **1 archivo SQL** y **ninguna variable nueva** en Vercel. Hazlo en este orden.

---------------------------------------------------------------------
## PASO 1 · SQL (Supabase)
Supabase → **SQL Editor** → New query → pega TODO `sql/v1.6.2_estado_menciones_sugerencias.sql` → **Run**. No hay que cambiar nada. Se puede correr más de una vez.

Qué hace: crea las tablas del Estado (`user_status`, `status_likes`) y sus funciones; deja que las historias acepten el sticker «mention» (máx. 5) y avisa a la persona mencionada; y crea `follow_suggestions()` para las sugerencias.

⚠️ Importante: corre el SQL **antes o justo después** de subir el código. Si subes el código primero, el botón «Estado» y las sugerencias simplemente no mostrarán nada hasta que corras el SQL (no se rompe nada).

## PASO 2 · Subir el código
En la carpeta `daiwa_place`: `git add .` → `git commit -m "v1.6.2 estado, menciones y sugerencias"` → `git push`. Espera a que Vercel termine. No hace falta `npm install` (no hay librerías nuevas).

## PASO 3 · Probar (con 2 cuentas)
1. **Estado**: en el Inicio toca «Estado» (junto a Fotos / Canción / Etiquetar), elige una idea o escribe la tuya y «Poner estado». Debe verse en tu perfil («Estado: …») y como tarjeta «Tú estás …» en tu Inicio. Desde la otra cuenta (que te siga) debe aparecer «<nombre> está …» y poder darle like.
2. **Menciones en historias**: Historias → crear una → pestaña/hoja de stickers → **Mención** → busca a la otra cuenta → colócala → publica. En la otra cuenta debe llegar el aviso «te mencionó en su historia» (y la notificación del celular), y al abrirla, tocar el sticker lleva al perfil. Prueba también que la otra cuenta pueda ver la historia aunque NO siga a la primera (con audiencia «seguidores»).
3. **Sugerencias**: salen solo ~6 de cada 10 visitas, entre la 4.ª y la 7.ª publicación (o al final si hay pocas), y solo si hay 2+ personas para sugerir y tienes 3+ elementos en el feed. Para forzarlas mientras pruebas: abre la consola del navegador y corre `localStorage.removeItem('daiwa_sugg_hidden_until'); localStorage.removeItem('daiwa_sugg_skipped')` y recarga varias veces.
4. **Celular**: toca un campo de texto en iPhone (no debe hacer zoom). En el APK: mantén pulsado el ícono → deben salir «Nueva historia» y «Notificaciones» (los atajos del menú pueden requerir volver a generar el APK, ver abajo).

## Si algo no funciona
| Pasa | Significa |
|---|---|
| «Falta correr el SQL de la v1.6.2» | No corriste el SQL del Paso 1 (o hay que recargar el esquema: Supabase → Settings → API → «Reload schema»). |
| Al publicar una historia con mención dice «Hay demasiadas cosas (o alguna no es válida)» | El SQL no se corrió completo: la función `story_elements_valid` sigue siendo la vieja. Vuelve a correr el SQL. |
| La persona mencionada no recibe aviso | Tiene apagado «Etiquetas» en Configuración → Notificaciones, hay un bloqueo entre las dos, o la historia es «solo amigos» y no son amigas. |
| No salen sugerencias | Normal: es aleatorio (~60 %) y se esconde 1 día si la cierras con la ✕. Mira la prueba del paso 3.3. También puede que ya sigas a casi todos. |
| El Estado no aparece en el Inicio de otra persona | Solo les sale a quienes te siguen, si tu cuenta es visible para ellos, y por 3 días desde que lo cambias (en el perfil dura hasta que lo cambies). |

## Sobre el APK
Los cambios de interfaz (zoom en campos, alturas, sin conexión) llegan **solos** al APK porque la app carga la página de Vercel. Lo que depende del APK en sí (los **atajos nuevos del ícono**: «Nueva historia» y «Notificaciones») solo aparecen si **vuelves a generar el APK** con PWABuilder después de desplegar (usa la misma llave de firma, ver `INSTRUCCIONES_V1.6.0.md`). Si no lo regeneras no pasa nada: todo lo demás funciona.

---------------------------------------------------------------------
## Cómo funciona (por si lo tocas después)
- **Estado**: tabla `user_status` (1 por persona, máx. 60 caracteres + emoji). `status_set` borra los likes del estado anterior. El Inicio pide `status_feed` (el tuyo + gente que sigues, últimos 3 días: constante `STATUS_FEED_DAYS` en `app/lib/status.ts`) y los mezcla con las publicaciones por fecha en `app/page.tsx` (`feedList`). Tarjeta: `components/StatusCard.tsx`; hoja: `components/StatusSheet.tsx`; perfil: `components/ProfileStatus.tsx`. No es lo mismo que `estado_personal` (el chip de relación del perfil) ni que las Notas de Mensajes.
- **Menciones en historias**: capa `mention` (`StoryMention` en `app/lib/stories.ts`), dibujo en `components/stories/elements/MentionSticker.tsx`, buscador `editor/MentionPicker.tsx`, estilo/color `editor/MentionEditor.tsx`. El visor detecta el toque con `data-story-mention`. En SQL: `story_elements_valid` (máx. 5), `story_visible` (la persona mencionada la ve si la audiencia es «followers»), trigger `notify_story_mentions` y el tipo de aviso `mention_story`.
- **Sugerencias**: función `follow_suggestions(p_limit)`; el Inicio decide UNA vez por visita si las muestra y dónde (`suggestPlan` en `app/page.tsx`: probabilidad 0.6 y posición 4–7). Componente: `components/FollowSuggestions.tsx`; descartes y «esconder 1 día» en `app/lib/suggestions.ts`.
- **Móvil**: `app/globals.css` (bloque «v1.6.2»), `vh → dvh`, `public/sw.js` (v1.6.2), `PwaRegister` (busca actualización al volver), `app/manifest.ts` (atajos), `public/offline.html`.

## Verificado y no verificado
Verificado aquí: `tsc` y ESLint sin errores nuevos; `next dev` sirve `/`, `/historias/nueva`, `/perfil/x`, `/notificaciones` y el manifest (200).
NO verificado (no se puede desde aquí): el SQL contra tu Supabase real, el flujo con 2 cuentas, ni cómo se ve en un teléfono real/iPhone/APK. Eso lo confirmas con el Paso 3. Si el SQL da algún error, copia el mensaje completo y lo arreglamos en la 1.6.3.
