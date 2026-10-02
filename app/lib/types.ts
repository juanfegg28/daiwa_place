export type RoleBadgeInfo = {
  roles: { name: string; badge_color: string } | null
}

export type AuthorProfile = {
  username: string
  avatar_url: string | null
  id_student: string | null
  is_frozen: boolean
  badge_color?: string | null
  user_roles?: RoleBadgeInfo[]
} | null

export type PostImage = {
  url: string
  path: string // ruta dentro del bucket "post-images" (para poder borrarla)
  w: number
  h: number
}

export type Comment = {
  id: string
  user_id: string
  content: string
  created_at: string
  edited_at: string | null
  parent_comment_id: string | null
  profiles: AuthorProfile
  comment_likes: { user_id: string }[]
}

export type Post = {
  id: string
  user_id: string
  content: string
  created_at: string
  edited_at: string | null
  images: PostImage[] | null
  profiles: AuthorProfile
  likes: { user_id: string }[]
  comments: Comment[]
}

export type ProfileSummary = {
  id: string
  username: string
  id_student: string | null
  avatar_url: string | null
  followers_count?: number
  created_at?: string
}
