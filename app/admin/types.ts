export type RoleRow = {
  id: string
  name: string
  badge_color: string
  permissions: Record<string, boolean>
}

export type ReportTargetType = 'profile' | 'post' | 'comment'

export type ReportRow = {
  id: string
  reporter_id: string
  reported_user_id: string
  post_id: string | null
  comment_id: string | null
  target_type: ReportTargetType
  reason: string | null
  status: string
  created_at: string
  reporter: { username: string } | null
  reported: { username: string; id_student: string | null; is_frozen: boolean } | null
  post: { id: string; content: string } | null
}

export type UserSearchResult = {
  id: string
  username: string
  id_student: string | null
  avatar_url?: string | null
}
