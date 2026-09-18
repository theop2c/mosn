import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { PostCard } from "../components/PostCard";
import type { Post } from "../types";

export function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post),
      );
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setError(null);
    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: user.displayName ?? "Anonyme",
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la publication");
    }
  }

  return (
    <div className="feed">
      {user ? (
        <form className="card composer" onSubmit={handleSubmit}>
          <textarea
            placeholder="Quoi de neuf ?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={3}
          />
          <button type="submit" disabled={!text.trim()}>
            Publier
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <p className="card">Connectez-vous pour publier.</p>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {posts.length === 0 && <p className="center">Aucun post pour le moment.</p>}
    </div>
  );
}
