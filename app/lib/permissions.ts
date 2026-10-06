// Sistema de permisos de DaiwaPlace (Centro de Mando).
// Los dos nombres de abajo tienen bypass total (Admin Supremo, Nivel 0) y
// además son quienes llevan la insignia fundacional "Creador de DaiwaPlace".
// Debe coincidir SIEMPRE con la función is_supreme_admin(uid) del SQL.
export const SUPREME_ADMIN_USERNAMES = ['renshsh', 'are_you_rena']

export function isSupremeAdmin(username: string | null | undefined): boolean {
  return !!username && SUPREME_ADMIN_USERNAMES.includes(username.toLowerCase())
}

export type PermissionLevel = 1 | 2 | 3

export const PERMISSION_KEYS = [
  'view_reports',
  'view_evidence',
  'delete_content',
  'freeze_accounts',
  'assign_badges',
  'override_identity',
  'global_announcements',
  'moderate_whispers',
  'reveal_whisper_authors',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export type Permissions = Partial<Record<PermissionKey, boolean>>

export const PERMISSION_INFO: Record<PermissionKey, { label: string; level: PermissionLevel; description: string }> = {
  view_reports: {
    label: 'Ver bandeja de reportes',
    level: 1,
    description: 'Ve todos los reportes de perfiles, publicaciones y comentarios que manda la comunidad.',
  },
  view_evidence: {
    label: 'Ver visor de evidencia',
    level: 1,
    description: 'Puede abrir la publicación, comentario o perfil exacto que se reportó, para revisarlo.',
  },
  delete_content: {
    label: 'Eliminar publicaciones/comentarios infractores',
    level: 1,
    description: 'Puede borrar cualquier publicación o comentario, no solo los suyos.',
  },
  freeze_accounts: {
    label: 'Congelar/descongelar cuentas',
    level: 2,
    description: 'Puede congelar o descongelar la cuenta de cualquier estudiante. No puede cambiar nada más de su perfil.',
  },
  assign_badges: {
    label: 'Asignar o quitar roles a usuarios',
    level: 2,
    description: 'Puede darle o quitarle a cualquier estudiante los roles que ya existen en el Taller de Roles.',
  },
  override_identity: {
    label: 'Sobreescribir identidades (editar perfiles ajenos)',
    level: 3,
    description: 'Puede editar por completo el perfil de cualquier persona (nombre, usuario, foto, bio, etc.) sin su contraseña.',
  },
  global_announcements: {
    label: 'Lanzar Anuncios Globales',
    level: 3,
    description: 'Puede publicar un banner fijado arriba del Inicio de TODOS los estudiantes de la red.',
  },
  moderate_whispers: {
    label: 'Moderar el Muro de los Susurros',
    level: 2,
    description:
      'Ve los reportes del Muro, puede ocultar, restaurar o eliminar confesiones y comentarios, y silenciar a su autor por unos días sin saber quién es.',
  },
  reveal_whisper_authors: {
    label: 'Ver quién escribió un susurro anónimo',
    level: 3,
    description:
      'Puede revelar la identidad detrás de una confesión o comentario anónimo en casos graves. Debe escribir un motivo y queda registrado en un historial.',
  },
}

const LEVEL_LABEL: Record<PermissionLevel, string> = {
  1: '🟢 Nivel 1 · Seguro',
  2: '🟡 Nivel 2 · Avanzado',
  3: '🔴 Nivel 3 · Crítico',
}

export function levelLabel(level: PermissionLevel): string {
  return LEVEL_LABEL[level]
}

/** Junta (con OR) los permisos de todos los roles que tiene asignados un usuario. */
export function mergePermissions(roles: { permissions: Permissions }[]): Permissions {
  const merged: Permissions = {}
  for (const r of roles) {
    for (const key of PERMISSION_KEYS) {
      if (r.permissions?.[key]) merged[key] = true
    }
  }
  return merged
}

export function hasAny(perms: Permissions, keys: PermissionKey[]): boolean {
  return keys.some((k) => !!perms[k])
}
