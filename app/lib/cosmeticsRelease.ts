// Guardia de versiones de los cosméticos (archivo PURO: sin React ni Supabase, para poder usarlo también en el servidor).
// La autoridad es la base de datos (is_active + guardián de profiles); esto es una defensa extra en el navegador.

/** Colecciones de una versión futura: existen en el código pero NO se dibujan hasta que se lancen.
 *  v1.5.0: Sangre Noir, Emo Abismo y las 7 de Halloween ya se lanzaron, así que la lista queda vacía.
 *  Cuando llegue la siguiente tanda (1.5.10…), se escriben aquí sus ids para esconderla hasta su día. */
export const NEXT_KIT_COLLECTIONS: readonly string[] = []
export const RELEASED_VERSION = '1.5.0'

let allowNext = false
/** Solo el estudio del equipo (cuenta con acceso total) enciende esto para PROBAR lo que viene. Nunca en perfiles. */
export function setAllowNextKits(v: boolean) {
  allowNext = v
}
export function nextKitsAllowed() {
  return allowNext
}
export function isReleasedColl(coll: string | null | undefined): boolean {
  return !coll || allowNext || !NEXT_KIT_COLLECTIONS.includes(coll)
}
