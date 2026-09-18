import { useState } from "react";

const EMOJIS = [
  "😀", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😅", "😭",
  "😡", "🥳", "😴", "🤯", "🥰", "😇", "🙃", "😉", "🤗", "🤩",
  "👍", "👎", "👏", "🙏", "💪", "🤝", "👀", "🔥", "✨", "🎉",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "💔", "💯", "✅", "❌",
  "⭐", "🌟", "☀️", "🌙", "🌈", "⚡", "🍕", "🍔", "☕", "🍺",
  "⚽", "🏀", "🎮", "🎵", "🚀", "✈️", "🐶", "🐱", "🌸", "🎁",
];

/** Petit sélecteur de smileys sans dépendance externe. */
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="emoji-picker">
      <button
        type="button"
        className="emoji-toggle"
        aria-label="Emoji"
        onClick={() => setOpen((o) => !o)}
      >
        🙂
      </button>
      {open && (
        <div className="emoji-panel">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onPick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
