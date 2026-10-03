export type ConfigProfile = {
  id: string
  username: string
  is_frozen: boolean
  posts_visibility: 'public' | 'followers'
  ghost_mode: boolean
  theme: 'dark' | 'light'
  accent_color: string | null
  badge_color: string | null
  notif_prefs: { comments: boolean; mentions: boolean; likes: boolean; follows: boolean }
}
