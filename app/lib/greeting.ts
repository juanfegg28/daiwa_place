// Saludo de la caja de publicar según la hora LOCAL de quien abre la página (v1.0.6)
// v1.1.0: más frases por momento del día + frases especiales según el día de la semana y horas puntuales

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
    'Mañanita, {n} 🥐 ¿Ya desayunaste? Cuéntanos',
    'Despertó Daiwa, {n} 🌞 ¿Cómo viene el día?',
    'Buen día, {n} 🎒 ¿Listo/a para lo que venga?',
    'Arrancó la mañana, {n} ☁️ ¿Qué estás escuchando hoy?',
  ],
  almuerzo: [
    '¡Buen provecho, {n}! 🍽️ ¿Qué almorzaste hoy?',
    'Hora del almuerzo, {n} 🥪 ¿Qué se cuenta?',
    'Mediodía, {n} ☀️ ¿Ya almorzaste? Cuéntanos',
    '¿Qué hay de comer, {n}? 🍜 Cuéntale a Daiwa',
    'Se acerca el recreo, {n} 🍙 ¿Qué se cuenta a esta hora?',
    'Pausa para comer, {n} 🥢 ¿Qué tal tu día hasta ahora?',
    'Hola, {n} 🌞 En pleno mediodía, ¿qué tienes en mente?',
  ],
  tarde: [
    'Buenas tardes, {n} 🌇 ¿Cómo va el día?',
    'Hola, {n} 🍃 ¿Qué tal la tarde? Escribe algo',
    'Buenas tardes, {n} ☕ ¿Qué estás haciendo?',
    '¿Qué tal ese día, {n}? 🌤️ Cuéntanos',
    'Tardecita, {n} 🍵 ¿Qué tal te va?',
    'Hola, {n} 🌆 ¿Algo que contar de la tarde?',
    '¿Cómo va todo, {n}? 🍂 Daiwa te escucha',
    'Buenas, {n} 🎧 ¿Qué suena esta tarde?',
  ],
  noche: [
    'Buenas noches, {n} 🌙 ¿Qué tal estuvo tu día?',
    'Noche tranquila, {n} ✨ ¿Qué pasa por esa cabeza?',
    'Buenas noches, {n} 🌃 Cuéntale a Daiwa cómo te fue',
    'Ya cayó la noche, {n} 🌌 ¿Qué quieres compartir?',
    'Hola, {n} 🌠 ¿Cómo cerró el día?',
    'Buenas noches, {n} 🛋️ Un buen momento para contar algo',
    'Noche de Daiwa, {n} 🌙 ¿Qué tienes para hoy?',
    'Ya casi es hora de descansar, {n} 😴 ¿Algo antes de dormir?',
  ],
  madrugada: [
    '¿Trasnochando, {n}? 🦉 Cuéntanos qué te desvela',
    'Madrugada en Daiwa, {n} 🌌 ¿No puedes dormir?',
    'Ya es muy tarde, {n} 🌙 ¿Qué te tiene despierto?',
    'Hola, {n} 🕯️ A estas horas salen los mejores pensamientos',
    'Silencio total, {n} 🌑 ¿Qué piensas a estas horas?',
    '¿Sigues despierto/a, {n}? 🌙 Cuéntale a Daiwa',
    'Hora de los pensamientos raros, {n} 🕰️ ¿Cuál es el tuyo?',
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

// Frases especiales: se mezclan con las de arriba solo cuando toca (día de la semana u hora puntual)
const WEEKDAY: Record<number, string[]> = {
  0: ['Domingo tranquilo, {n} 🛋️ ¿Qué tal el descanso?', 'Feliz domingo, {n} ☀️ ¿Qué plan tienes para hoy?', 'Domingo de pereza, {n} 🍃 ¿Cómo vas?'],
  1: ['Lunes otra vez, {n} 💪 ¿Cómo arrancó la semana?', 'Feliz lunes, {n} ☕ Ánimo, que se puede', '¿Cómo se siente el lunes, {n}? 🎒 Cuéntanos'],
  2: ['Martes, {n} 📚 ¿Cómo va la semana?', 'Mitad de camino al finde, {n} 🚶 ¿Qué se cuenta?'],
  3: ['Mitad de semana, {n} ⚖️ ¿Cómo la llevas?', 'Miércoles, {n} 🌤️ Ya pasó lo más difícil, ¿no?'],
  4: ['Jueves, {n} ✨ Ya casi es viernes, ¿cómo vas?', 'Jueves en Daiwa, {n} 🎵 ¿Qué se cuenta?'],
  5: ['¡Viernes, {n}! 🎉 ¿Algún plan para el finde?', 'Llegó el viernes, {n} 🥳 ¿Cómo te fue en la semana?', 'Viernes, {n} 🌇 Cuéntale a Daiwa cómo cierras la semana'],
  6: ['¡Sábado, {n}! 🌈 ¿Qué vas a hacer hoy?', 'Sábado de Daiwa, {n} 🎮 ¿Con qué ánimo amaneciste?', 'Finde, {n} 🍿 ¿Qué se cuenta?'],
}

/** Frases que solo salen en ciertos momentos (hora puntual o noche de domingo) */
function specialFor(date: Date): string[] {
  const h = date.getHours()
  const d = date.getDay()
  const list: string[] = []
  if (h === 0) list.push('Pasó la medianoche, {n} 🌌 ¿Todavía por aquí?')
  if (h >= 15 && h < 18) list.push('Hora de la merienda, {n} 🍪 ¿Qué se antoja?')
  if (d === 0 && h >= 19) list.push('Domingo por la noche, {n} 🌙 ¿Listo/a para la semana?')
  if (d === 5 && h >= 19) list.push('Noche de viernes, {n} 🌃 ¿Qué se cuenta?')
  if (d === 6 && h >= 19) list.push('Noche de sábado, {n} 🎶 ¿Cómo estuvo el día?')
  if (h >= 5 && h < 7) list.push('Madrugador/a, {n} 🌄 Qué temprano por aquí')
  return list
}

/** Elige un saludo: casi siempre uno del momento del día; a veces uno del día de la semana o de una hora especial */
export function pickGreeting(part: DayPart, name: string, date: Date = new Date()): string {
  const roll = Math.random()
  const special = specialFor(date)
  let list = MESSAGES[part]
  if (special.length > 0 && roll < 0.25) list = special
  else if (roll < 0.55) list = WEEKDAY[date.getDay()] ?? list
  return list[Math.floor(Math.random() * list.length)].replace('{n}', name)
}
