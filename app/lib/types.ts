export type AuthorProfile = {
  username: string
  avatar_url: string | null
} | null

export type Comment = {
  id: string
  content: string
  created_at: string
  parent_comment_id: string | null
  profiles: AuthorProfile
  comment_likes: { user_id: string }[]
}

export type Post = {
  id: string
  content: string
  created_at: string
  profiles: AuthorProfile
  likes: { user_id: string }[]
  comments: Comment[]
}
