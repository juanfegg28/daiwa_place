// Consultas compartidas de Supabase (feed, perfil y vista individual de publicación)

const COMMENTS_SELECT =
  'comments(id, user_id, content, created_at, edited_at, parent_comment_id, profiles!comments_user_id_fkey(username, avatar_url), comment_likes(user_id))'

// Feed general y vista individual: incluye al autor de la publicación
// (id_student e is_frozen se usan para la jerarquía de nombres y para
// desactivar los botones si la cuenta del autor está congelada)
export const POST_SELECT = `id, user_id, content, created_at, edited_at, images, profiles!posts_user_id_fkey(username, avatar_url, id_student, is_frozen), likes(user_id), ${COMMENTS_SELECT}`

// Perfil: ya sabemos quién es el autor, no hace falta traerlo
export const PROFILE_POST_SELECT = `id, user_id, content, created_at, edited_at, images, likes(user_id), ${COMMENTS_SELECT}`

export const POST_IMAGES_BUCKET = 'post-images'
export const MAX_POST_IMAGES = 4
