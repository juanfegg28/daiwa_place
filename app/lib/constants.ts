// Opciones fijas para el campo "situación sentimental" (columna profiles.estado_personal).
// Se guarda tal cual el texto de la opción elegida.
export const ESTADOS_SENTIMENTALES = [
  'Soltero/a',
  'Casado/a',
  'En una relación',
  'Es confuso',
  'Misterioso/a',
  'Sin interés',
] as const

export type EstadoSentimental = (typeof ESTADOS_SENTIMENTALES)[number]
