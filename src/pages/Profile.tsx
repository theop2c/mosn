import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getCountFromServer,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { FollowButton } from "../components/FollowButton";
import type { UserProfile } from "../types";

export function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const { user, t } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [counts, setCounts] = useState<{ followers: number; following: number }>();
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
    ]).then(([followers, following]) =>
      setCounts({
        followers: followers.data().count,
        following: following.data().count,
      }),
    );
  }, [uid, user]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), { bio });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return <p className="center">{t.profile.notFound}</p>;

  return (
    <div className="card">
      <div className="row">
        <div>
          <h1>{profile.displayName}</h1>
          {profile.role === "admin" && (
            <span className="badge">{t.profile.badgeAdmin}</span>
          )}
          {profile.banned && (
            <span className="badge danger">{t.profile.badgeBanned}</span>
          )}
          {counts && (
            <p className="hint">
              {t.profile.stats(counts.followers, counts.following)}
            </p>
          )}
        </div>
        {!isOwn && user && uid && (
          <div className="row-actions">
            <FollowButton targetUid={uid} />
            <Link to={`/messages/${uid}`} className="button-link secondary">
              {t.profile.message}
            </Link>
          </div>
        )}
      </div>
      {isOwn ? (
        <form onSubmit={handleSave}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t.profile.bioPlaceholder}
            maxLength={300}
            rows={3}
          />
          <button type="submit">
            {saved ? t.common.saved : t.common.save}
          </button>
        </form>
      ) : (
        <p>{profile.bio || t.profile.noBio}</p>
      )}
    </div>
  );
}
