import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const REACTIONS = ["👍", "❤️", "😂", "🎉", "😮", "😢"];

/**
 * Réactions emoji sous un post : un doc par utilisateur
 * (posts/{postId}/reactions/{uid} = { emoji }), temps réel.
 */
export function Reactions({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      collection(db, "posts", postId, "reactions"),
      (snap) => {
        const next: Record<string, number> = {};
        let my: string | null = null;
        snap.forEach((d) => {
          const emoji = (d.data() as { emoji?: string }).emoji;
          if (!emoji) return;
          next[emoji] = (next[emoji] ?? 0) + 1;
          if (d.id === user?.uid) my = emoji;
        });
        setCounts(next);
        setMine(my);
      },
    );
  }, [postId, user]);

  async function toggle(emoji: string) {
    if (!user) return;
    const ref = doc(db, "posts", postId, "reactions", user.uid);
    if (mine === emoji) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { emoji, createdAt: serverTimestamp() });
    }
  }

  return (
    <div className="reactions">
      {REACTIONS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        return (
          <button
            key={emoji}
            type="button"
            className={`reaction ${mine === emoji ? "selected" : ""}`}
            onClick={() => toggle(emoji)}
            disabled={!user}
          >
            {emoji}
            {count > 0 && <span className="reaction-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
