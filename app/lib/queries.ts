// Consultas compartidas de Supabase (feed, perfil y vista individual de publicación)

const COMMENTS_SELECT =
  'comments(id, user_id, content, created_at, edited_at, parent_comment_id, profiles!comments_user_id_fkey(username, avatar_url), comment_likes(user_id))'

// Feed general y vista individual: incluye al autor de la publicación
// (id_student e is_frozen se usan para la jerarquía de nombres y para
// desactivar los botones si la cuenta del autor está congelada; user_roles
// trae sus insignias para mostrarlas junto al nombre)
export const POST_SELECT = `id, user_id, content, created_at, edited_at, images, profiles!posts_user_id_fkey(username, avatar_url, id_student, is_frozen, badge_color, user_roles!user_id(roles(name, badge_color))), likes(user_id), ${COMMENTS_SELECT}`

// Perfil: ya sabemos quién es el autor, no hace falta traerlo
export const PROFILE_POST_SELECT = `id, user_id, content, created_at, edited_at, images, likes(user_id), ${COMMENTS_SELECT}`

export const POST_IMAGES_BUCKET = 'post-images'
export const MAX_POST_IMAGES = 4

// Notificaciones: quién la generó, y un pedacito de la publicación / comentario
// al que se refiere (para mostrar el fragmento en la lista)
export const NOTIFICATION_SELECT =
  'id, type, read, created_at, post_id, comment_id, actor:profiles!notifications_actor_id_fkey(username, id_student, avatar_url), post:posts!notifications_post_id_fkey(content, images), comment:comments!notifications_comment_id_fkey(content), note:notes!notifications_note_id_fkey(content)'
