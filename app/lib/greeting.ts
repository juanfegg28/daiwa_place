// Saludo de la caja de publicar según la hora LOCAL de quien abre la página (v1.0.6)

export type DayPart = 'madrugada' | 'manana' | 'almuerzo' | 'tarde' | 'noche'

export function dayPartFor(date: Date = new Date()): DayPart {
  const h = date.getHours()
  if (h < 5) return 'madrugada' // 12 a.m. – 4:59 a.m.
  if (h < 11) return 'manana' // 5 a.m. – 10:59 a.m.
  if (h < 14) return 'almuerzo' // 11 a.m. – 1:59 p.m.
  if (h < 19) return 'tarde' // 2 p.m. – 6:59 p.m.
  return 'noche' // 7 p.m. – 11:59 p.m.
}

// {n} se reemplaza por el primer nombre. Puedes agregar o cambiar frases libremente.
const MESSAGES: Record<DayPart, string[]> = {
  manana: [
    'Buenos días, {n} ☀️ ¿Cómo amaneciste? Cuéntale algo a Daiwa',
    '¡Buen día, {n}! ☕ ¿Qué trae esta mañana?',
    'Buenos días, {n} 🌤️ ¿Con qué ánimo arrancas hoy?',
    'Arriba, {n} 🌅 ¿Qué se te ocurre para empezar el día?',
  ],
  almuerzo: [
    '¡Buen provecho, {n}! 🍽️ ¿Qué almorzaste hoy?',
    'Hora del almuerzo, {n} 🥪 ¿Qué se cuenta?',
    'Mediodía, {n} ☀️ ¿Ya almorzaste? Cuéntanos',
    '¿Qué hay de comer, {n}? 🍜 Cuéntale a Daiwa',
  ],
  tarde: [
    'Buenas tardes, {n} 🌇 ¿Cómo va el día?',
    'Hola, {n} 🍃 ¿Qué tal la tarde? Escribe algo',
    'Buenas tardes, {n} ☕ ¿Qué estás haciendo?',
    '¿Qué tal ese día, {n}? 🌤️ Cuéntanos',
  ],
  noche: [
    'Buenas noches, {n} 🌙 ¿Qué tal estuvo tu día?',
    'Noche tranquila, {n} ✨ ¿Qué pasa por esa cabeza?',
    'Buenas noches, {n} 🌃 Cuéntale a Daiwa cómo te fue',
    'Ya cayó la noche, {n} 🌌 ¿Qué quieres compartir?',
  ],
  madrugada: [
    '¿Trasnochando, {n}? 🦉 Cuéntanos qué te desvela',
    'Madrugada en Daiwa, {n} 🌌 ¿No puedes dormir?',
    'Ya es muy tarde, {n} 🌙 ¿Qué te tiene despierto?',
    'Hola, {n} 🕯️ A estas horas salen los mejores pensamientos',
  ],
}

/** Primer nombre a partir del nombre del personaje (si es puro adorno, se usa el @usuario) */
export function firstNameOf(displayName: string | null | undefined, username: string | null | undefined): string {
  // Una "palabra de verdad" tiene letras o números normales (los adornos como ˘ᵕ˘ o ✦ no cuentan)
  const REAL = /[\p{Lu}\p{Ll}\p{Lt}\p{Lo}\p{N}]/u
  const tokens = (displayName ?? '').trim().split(/\s+/)
  const real = tokens.find((t) => REAL.test(t))
  const name = (real ?? username ?? '').replace(/^[^\p{Lu}\p{Ll}\p{Lt}\p{Lo}\p{N}]+|[^\p{Lu}\p{Ll}\p{Lt}\p{Lo}\p{N}]+$/gu, '')
  return (name || username || 'tú').slice(0, 18)
}

export function pickGreeting(part: DayPart, name: string): string {
  const list = MESSAGES[part]
  return list[Math.floor(Math.random() * list.length)].replace('{n}', name)
}
