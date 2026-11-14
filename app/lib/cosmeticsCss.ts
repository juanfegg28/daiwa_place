// v1.10.0 · Dirección versionada del CSS de cosméticos (/cosmetics.css?v=<hash del contenido>): si el CSS cambia en una versión nueva,
// la dirección cambia y nadie se queda con la copia vieja aunque el archivo se guarde un año. Solo se usa en el servidor (layout raíz).
import { createHash } from 'node:crypto'
import { RELEASED_CSS } from '../components/cosmetics/kit'

export const COSMETICS_CSS_HREF = `/cosmetics.css?v=${createHash('sha1').update(RELEASED_CSS).digest('base64url').slice(0, 10)}`
