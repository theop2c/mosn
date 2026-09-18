import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const { user, settings, t } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // Un clic sur un #hashtag navigue vers /?q=… : on synchronise le champ
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  // Filtre client sur les posts chargés : nom d'utilisateur, #hashtag ou
  // regex sur le contenu texte (repli en recherche littérale si la regex
  // est invalide).
  const visiblePosts = useMemo(() => {
    const needle = search.trim();
    if (!needle) return posts;
    let regex: RegExp;
    try {
      regex = new RegExp(needle, "iu");
    } catch {
      regex = new RegExp(
        needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "iu",
      );
    }
    return posts.filter(
      (post) => regex.test(post.text) || regex.test(post.authorName),
    );
  }, [posts, search]);

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

  const canView = user != null || settings.publicFeed;

  useEffect(() => {
    if (!canView) {
      setPosts([]);
      return;
    }
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
        limit(settings.pageSize),
      );
      return onSnapshot(q, (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
      });
    }
    const q = query(
      collection(db, "posts"),
      where("groupId", "==", null),
      orderBy("createdAt", "desc"),
      limit(settings.pageSize),
    );
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
    });
  }, [tab, followingIds, canView, settings.pageSize]);

  if (!canView) {
    return (
      <div className="feed">
        <p className="card">{t.feed.signInToView}</p>
      </div>
    );
  }

  return (
    <div className="feed">
      <div className="feed-search">
        <span aria-hidden>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.feed.searchPlaceholder}
        />
        {search && (
          <button
            type="button"
            className="link"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}
      </div>

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

      {visiblePosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {visiblePosts.length === 0 && (
        <p className="center">
          {search.trim()
            ? t.feed.noMatches
            : tab === "following"
              ? t.feed.emptyFollowing
              : t.feed.emptyAll}
        </p>
      )}
    </div>
  );
}
