# Pruebas de la v1.10.0 (no son parte de la página)

Se corrieron en un entorno de trabajo, **no contra tu proyecto de Supabase**: PostgreSQL 16 + PostgREST 12.2.12 (el mismo motor de API que usa Supabase)
con un esquema mínimo que imita las tablas que tocan los SQL nuevos. Sirven para comprobar la lógica; no reemplazan probar en tu proyecto.

| Archivo | Qué comprueba |
| --- | --- |
| `01_esquema_minimo.sql`, `02_roles_y_datos.sql`, `03_datos_feed.sql` | Tablas, roles y datos de ejemplo |
| `prueba_contadores.sql` | Triggers de `post_counters`: like/comentario/compartido, borrado en cascada de una publicación, recálculo, RLS, idempotencia |
| `prueba_recuperacion.sql` | Enlaces de recuperación: un solo uso, vencimiento, revocación, límites por cuenta/administrador, permisos (solo `service_role`) |
| `prueba_postgrest_feed.py` | Consulta ligera del feed contra PostgREST: contador embebido, «tu like» y «tu compartido» por filtro embebido, comentarios, búsqueda del buscador de cuentas, RLS |
| `prueba_api_recuperacion.py` + `proxy_supabase_local.js` | Las dos rutas de la API de recuperación de punta a punta (42 comprobaciones: autorización, búsqueda, cuentas del staff protegidas, un solo uso, auditoría, revocación, freno de intentos) |

Cómo repetirlas (Linux): instalar `postgresql` y descargar el binario de PostgREST; crear una base con los tres `.sql` de datos y correr los SQL de `sql/`;
iniciar PostgREST (puerto 3000), `node proxy_supabase_local.js` (puerto 54321, imita `/rest/v1` + `/auth/v1`), compilar la página con
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` y las claves firmadas con el mismo secreto, `next start -p 3001` y ejecutar los `.py`.
