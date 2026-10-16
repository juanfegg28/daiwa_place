export type ConfigProfile = {
  id: string
  username: string
  is_frozen: boolean
  posts_visibility: 'public' | 'followers'
  ghost_mode: boolean
  theme: 'dark' | 'light'
  accent_color: string | null
  badge_color: string | null
  show_online_status: boolean
  show_read_receipts: boolean
  /** Qué se ve en el Inicio: todos, solo seguidos o solo amigos (mutuals) */
  feed_pref: 'all' | 'following' | 'mutuals'
  notif_prefs: { comments: boolean; mentions: boolean; likes: boolean; follows: boolean; note_likes: boolean; whispers: boolean; tags: boolean; reposts: boolean }
}
