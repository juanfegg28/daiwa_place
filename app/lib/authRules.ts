// Reglas del acceso (login y registro). Todo vive en el navegador: no toca el servidor.

export const USERNAME_MIN = 3
export const USERNAME_MAX = 24
export const USERNAME_REGEX = /^[a-z0-9_.]+$/

/**
 * Auto-corrección silenciosa del @usuario mientras la persona teclea:
 * minúsculas, espacios y guiones → "_", sin tildes ni símbolos raros.
 * Así nunca siente que se equivocó: "Juan Pérez" pasa solo a "juan_perez".
 */
export function normalizeUsername(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes (é → e, ñ → n)
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, USERNAME_MAX)
}

// ───────────────────────── contraseña ─────────────────────────

export const PASSWORD_MIN = 8

export type PasswordLevel = 0 | 1 | 2 | 3

export type PasswordReport = {
  /** 0 = vacía · 1 = débil · 2 = casi lista · 3 = inquebrantable */
  level: PasswordLevel
  label: string
  hint: string
  checks: { length: boolean; number: boolean; letter: boolean }
  /** Cumple lo mínimo para poder crear la cuenta */
  meetsRules: boolean
}

const COMMON = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  'password',
  'password1',
  'password123',
  'contrasena',
  'contrasena1',
  'contrasena123',
  'qwerty123',
  'qwertyuiop',
  'abc12345',
  'iloveyou1',
  'daiwaplace',
  'daiwaplace1',
  'daiwaplace123',
  '11111111',
  '00000000',
])

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Mide la contraseña y devuelve textos cercanos para guiar a la persona (sin regaños). */
export function passwordReport(password: string, username = ''): PasswordReport {
  const checks = {
    length: password.length >= PASSWORD_MIN,
    number: /\d/.test(password),
    letter: /[A-Za-z\u00C0-\u024F]/.test(password),
  }

  if (password.length === 0) {
    return { level: 0, label: '', hint: `Mínimo ${PASSWORD_MIN} caracteres y al menos un número`, checks, meetsRules: false }
  }

  const plain = stripAccents(password).toLowerCase()
  const user = username.trim().toLowerCase()
  const tooObvious = COMMON.has(plain) || (user.length >= 3 && plain.includes(user))
  if (tooObvious) {
    return {
      level: 1,
      label: 'Un poco débil',
      hint: 'Esa es muy fácil de adivinar. ¡Prueba con algo más tuyo!',
      checks,
      meetsRules: false,
    }
  }

  if (!checks.length || !checks.number || !checks.letter) {
    const hint = !checks.length
      ? `Te faltan ${PASSWORD_MIN - password.length} caracteres`
      : !checks.number
        ? 'Agrega un número y quedará mejor'
        : 'Agrega alguna letra para completarla'
    return { level: 1, label: 'Un poco débil', hint, checks, meetsRules: false }
  }

  const hasLower = /[a-z\u00E0-\u00FF]/.test(password)
  const hasUpper = /[A-Z\u00C0-\u00DE]/.test(password)
  const hasSymbol = /[^A-Za-z0-9\u00C0-\u00FF]/.test(password)
  let score = 0
  if (password.length >= 12) score += 2
  else if (password.length >= 10) score += 1
  if (hasLower && hasUpper) score += 1
  if (hasSymbol) score += 1

  if (score >= 2) {
    return { level: 3, label: '¡Inquebrantable!', hint: 'A prueba de balas. ¡Buena elección!', checks, meetsRules: true }
  }
  return {
    level: 2,
    label: 'Casi lista',
    hint: 'Una mayúscula, un símbolo o unas letras más y queda perfecta',
    checks,
    meetsRules: true,
  }
}
