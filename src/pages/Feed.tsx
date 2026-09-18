import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { PostCard } from "../components/PostCard";
import { PostComposer } from "../components/PostComposer";
import type { Post } from "../types";

type Tab = "all" | "following";

export function Feed() {
  const { user, t } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);

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

  return (
    <div className="feed">
      {user ? (
        <PostComposer />
      ) : (
        <p className="card">{t.feed.signInToPost}</p>
      )}

      {user && (
        <nav className="tabs">
          <button
            className={`link ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            {t.feed.tabAll}
          </button>
          <button
            className={`link ${tab === "following" ? "active" : ""}`}
            onClick={() => setTab("following")}
          >
            {t.feed.tabFollowing}
          </button>
        </nav>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {posts.length === 0 && (
        <p className="center">
          {tab === "following" ? t.feed.emptyFollowing : t.feed.emptyAll}
        </p>
      )}
    </div>
  );
}
