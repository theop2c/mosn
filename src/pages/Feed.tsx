import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { PostCard } from "../components/PostCard";
import type { Post } from "../types";

type Tab = "all" | "following";

export function Feed() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Liste des personnes que je suis (pour l'onglet Abonnements)
  useEffect(() => {
    if (!user) {
      setFollowingIds(null);
      return;
    }
    void getDocs(collection(db, "users", user.uid, "following")).then((snap) =>
      // Firestore limite les requêtes "in" à 30 valeurs
      setFollowingIds(snap.docs.map((d) => d.id).slice(0, 30)),
    );
  }, [user, tab]);

  useEffect(() => {
    if (tab === "following") {
      if (!followingIds || followingIds.length === 0) {
        setPosts([]);
        return;
      }
      const q = query(
        collection(db, "posts"),
        where("groupId", "==", null),
        where("authorId", "in", followingIds),
        orderBy("createdAt", "desc"),
        limit(50),
      );
      return onSnapshot(q, (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
      });
    }
    const q = query(
      collection(db, "posts"),
      where("groupId", "==", null),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
    });
  }, [tab, followingIds]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setError(null);
    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile?.displayName ?? user.displayName ?? "Anonyme",
        text: text.trim(),
        groupId: null,
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

      {user && (
        <nav className="tabs">
          <button
            className={`link ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            Tout
          </button>
          <button
            className={`link ${tab === "following" ? "active" : ""}`}
            onClick={() => setTab("following")}
          >
            Abonnements
          </button>
        </nav>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {posts.length === 0 && (
        <p className="center">
          {tab === "following"
            ? "Aucun post de vos abonnements. Suivez des utilisateurs via la recherche !"
            : "Aucun post pour le moment."}
        </p>
      )}
    </div>
  );
}
