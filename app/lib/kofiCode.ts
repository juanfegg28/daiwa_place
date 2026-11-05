// v1.7.2 · Código de verificación para las propinas de Ko-fi.
//
// Ko-fi no le da al que paga un «ID de transacción», así que el comprobante es un código que genera esta página
// y que la persona pega en el MENSAJE de su propina. Formato: DW-<4 primeros caracteres de su id>-<5 al azar>.
// Ejemplo: DW-3FA9-K7M2Q. La base de datos (supporter_manual_submit) exige que los 4 primeros coincidan con el id de
// quien envía la solicitud, así nadie puede reclamar el código que otra persona escribió en su propina.
//
// Este archivo no importa nada a propósito: así se puede probar solo.

// Sin 0/O ni 1/I para que no se confundan al copiarlos a mano. 32 letras/números: 256 es múltiplo de 32, no hay sesgo.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const STORAGE_KEY = 'daiwa_kofi_code'

export function newKofiCode(userId: string): string {
  const prefix = userId.replace(/-/g, '').slice(0, 4).toUpperCase()
  const bytes = new Uint8Array(5)
  crypto.getRandomValues(bytes)
  let rnd = ''
  for (const b of bytes) rnd += ALPHABET[b % ALPHABET.length]
  return `DW-${prefix}-${rnd}`
}

/** ¿El código tiene el formato que acepta la base de datos para esta persona? */
export function isKofiCodeFor(userId: string, code: string): boolean {
  const prefix = userId.replace(/-/g, '').slice(0, 4).toUpperCase()
  return new RegExp(`^DW-${prefix}-[A-Z0-9]{4,8}$`, 'i').test(code)
}

/**
 * El código se recuerda en este dispositivo hasta que la solicitud se envíe: así, si alguien paga y cierra la página
 * antes de avisar, al volver sigue viendo el MISMO código que escribió en su propina.
 */
export function loadKofiCode(userId: string): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && isKofiCodeFor(userId, saved)) return saved.toUpperCase()
  } catch {
    /* sin almacenamiento (modo privado, etc.): se genera uno nuevo y ya */
  }
  const fresh = newKofiCode(userId)
  try {
    window.localStorage.setItem(STORAGE_KEY, fresh)
  } catch {
    /* igual funciona, solo que no se recuerda */
  }
  return fresh
}

/** Se llama cuando la solicitud se envió bien: el próximo pago usará un código nuevo. */
export function clearKofiCode(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nada que hacer */
  }
}
