import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

/**
 * Bouton Suivre / Ne plus suivre. Écrit deux docs miroirs :
 * users/{moi}/following/{cible} et users/{cible}/followers/{moi}.
 */
export function FollowButton({ targetUid }: { targetUid: string }) {
  const { user, t } = useAuth();
  const [following, setFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || user.uid === targetUid) return;
    return onSnapshot(
      doc(db, "users", user.uid, "following", targetUid),
      (snap) => setFollowing(snap.exists()),
    );
  }, [user, targetUid]);

  if (!user || user.uid === targetUid || following === null) return null;

  async function toggle() {
    if (!user) return;
    const batch = writeBatch(db);
    const followingRef = doc(db, "users", user.uid, "following", targetUid);
    const followerRef = doc(db, "users", targetUid, "followers", user.uid);
    if (following) {
      batch.delete(followingRef);
      batch.delete(followerRef);
    } else {
      batch.set(followingRef, { createdAt: serverTimestamp() });
      batch.set(followerRef, { createdAt: serverTimestamp() });
    }
    await batch.commit();
  }

  return (
    <button className={following ? "secondary" : ""} onClick={toggle}>
      {following ? t.follow.unfollow : t.follow.follow}
    </button>
  );
}
