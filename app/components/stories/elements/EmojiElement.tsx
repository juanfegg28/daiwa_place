import type { StoryEmoji } from '../../../lib/stories'

export default function EmojiElement({ el }: { el: StoryEmoji }) {
  return (
    <div style={{ fontSize: `${el.size}cqw`, lineHeight: 1, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.25))' }} aria-hidden="true">
      {el.emoji}
    </div>
  )
}
