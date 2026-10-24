// Guardia de versiones de los cosméticos (archivo PURO: sin React ni Supabase, para poder usarlo también en el servidor).
// La autoridad es la base de datos (is_active + guardián de profiles); esto es una defensa extra en el navegador.

/** Colecciones de la 1.5.0: existen en el código pero NO se dibujan hasta que se lancen. */
export const NEXT_KIT_COLLECTIONS: readonly string[] = ['crimson', 'emo']
export const RELEASED_VERSION = '1.4.0'

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
