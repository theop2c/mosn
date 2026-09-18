import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Avatar, uidHue } from "../components/Avatar";
import { FollowButton } from "../components/FollowButton";
import { PostCard } from "../components/PostCard";
import type { Post, UserProfile } from "../types";

type Tab = "posts" | "about";

export function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const { user, settings, t } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [counts, setCounts] = useState<{
    followers: number;
    following: number;
    posts: number;
  }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  const isOwn = user?.uid === uid;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid), (snap) => {
      const data = (snap.data() as UserProfile | undefined) ?? null;
      setProfile(data);
      setBio(data?.bio ?? "");
    });
  }, [uid]);

  useEffect(() => {
    if (!uid || !user) return;
    void Promise.all([
      getCountFromServer(collection(db, "users", uid, "followers")),
      getCountFromServer(collection(db, "users", uid, "following")),
      getCountFromServer(
        query(
          collection(db, "posts"),
          where("groupId", "==", null),
          where("authorId", "==", uid),
        ),
      ),
    ])
      .then(([followers, following, postCount]) =>
        setCounts({
          followers: followers.data().count,
          following: following.data().count,
          posts: postCount.data().count,
        }),
      )
      .catch(() => setCounts(undefined));
  }, [uid, user]);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "posts"),
      where("groupId", "==", null),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(settings.pageSize),
    );
    return onSnapshot(
      q,
      (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
      },
      () => setPosts([]),
    );
  }, [uid, settings.pageSize]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), { bio });
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!uid || !profile) {
    return <p className="center">{t.profile.notFound}</p>;
  }

  const hue = uidHue(uid);

  return (
    <div className="profile">
      <div className="card profile-card">
        <div
          className="profile-cover"
          style={{
            background: `linear-gradient(120deg, hsl(${hue} 65% 45%), hsl(${(hue + 60) % 360} 70% 55%), hsl(${(hue + 110) % 360} 65% 45%))`,
          }}
        />
        <div className="profile-head">
          <Avatar name={profile.displayName} uid={uid} size={88} />
          <div className="profile-id">
            <h1>
              {profile.displayName}
              {profile.role === "admin" && (
                <span className="badge">{t.profile.badgeAdmin}</span>
              )}
              {profile.banned && (
                <span className="badge danger">{t.profile.badgeBanned}</span>
              )}
            </h1>
            {counts && (
              <p className="profile-stats">
                {t.profile.stats(counts.followers, counts.following)} ·{" "}
                {t.profile.postsCount(counts.posts)}
              </p>
            )}
          </div>
          <div className="row-actions">
            {isOwn ? (
              <button
                className="secondary"
                onClick={() => setEditing((e) => !e)}
              >
                {saved ? t.common.saved : t.profile.editBio}
              </button>
            ) : (
              user && (
                <>
                  <FollowButton targetUid={uid} />
                  <Link
                    to={`/messages/${uid}`}
                    className="button-link secondary"
                  >
                    {t.profile.message}
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="profile-bio-form">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.profile.bioPlaceholder}
              maxLength={300}
              rows={3}
              autoFocus
            />
            <button type="submit">{t.common.save}</button>
          </form>
        ) : (
          <p className="profile-bio">{profile.bio || t.profile.noBio}</p>
        )}
      </div>

      <nav className="tabs">
        <button
          className={`link ${tab === "posts" ? "active" : ""}`}
          onClick={() => setTab("posts")}
        >
          {t.group.tabPosts}
        </button>
        <button
          className={`link ${tab === "about" ? "active" : ""}`}
          onClick={() => setTab("about")}
        >
          {t.profile.tabAbout}
        </button>
      </nav>

      {tab === "about" ? (
        <div className="card">
          <p>
            <strong>{t.profile.memberSince}</strong> :{" "}
            {profile.createdAt?.toDate().toLocaleDateString() ?? "—"}
          </p>
          {counts && (
            <p>
              <strong>{t.profile.postsCount(counts.posts)}</strong> ·{" "}
              {t.profile.stats(counts.followers, counts.following)}
            </p>
          )}
          <p className="profile-bio">{profile.bio || t.profile.noBio}</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <p className="center">{t.feed.emptyAll}</p>
          )}
        </>
      )}
    </div>
  );
}
