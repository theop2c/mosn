import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { PostCard } from "../components/PostCard";
import { PostComposer } from "../components/PostComposer";
import type { Group as GroupType, JoinRequest, Post } from "../types";

export function Group() {
  const { gid } = useParams<{ gid: string }>();
  const { user, profile, t } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupType | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user != null && group?.ownerId === user.uid;
  const canView = group != null && (group.visibility === "public" || isMember);

  useEffect(() => {
    if (!gid) return;
    return onSnapshot(doc(db, "groups", gid), (snap) => {
      setGroup(
        snap.exists() ? ({ id: snap.id, ...snap.data() } as GroupType) : null,
      );
    });
  }, [gid]);

  useEffect(() => {
    if (!gid || !user) return;
    const unsubMember = onSnapshot(
      doc(db, "groups", gid, "members", user.uid),
      (snap) => setIsMember(snap.exists()),
    );
    const unsubRequest = onSnapshot(
      doc(db, "groups", gid, "requests", user.uid),
      (snap) => setHasRequested(snap.exists()),
    );
    return () => {
      unsubMember();
      unsubRequest();
    };
  }, [gid, user]);

  useEffect(() => {
    if (!gid || !isOwner) {
      setRequests([]);
      return;
    }
    return onSnapshot(collection(db, "groups", gid, "requests"), (snap) => {
      setRequests(snap.docs.map((d) => d.data() as JoinRequest));
    });
  }, [gid, isOwner]);

  useEffect(() => {
    if (!gid || !canView) {
      setPosts([]);
      return;
    }
    const q = query(
      collection(db, "posts"),
      where("groupId", "==", gid),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
    });
  }, [gid, canView]);

  if (!group) return <p className="center">{t.group.notFound}</p>;

  async function join() {
    if (!gid || !user || !group) return;
    setError(null);
    try {
      if (group.visibility === "public") {
        await setDoc(doc(db, "groups", gid, "members", user.uid), {
          uid: user.uid,
          role: "member",
          joinedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, "groups", gid, "requests", user.uid), {
          uid: user.uid,
          displayName: profile?.displayName ?? t.common.user,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  async function leave() {
    if (!gid || !user) return;
    await deleteDoc(doc(db, "groups", gid, "members", user.uid));
  }

  async function approve(request: JoinRequest) {
    if (!gid) return;
    const batch = writeBatch(db);
    batch.set(doc(db, "groups", gid, "members", request.uid), {
      uid: request.uid,
      role: "member",
      joinedAt: serverTimestamp(),
    });
    batch.delete(doc(db, "groups", gid, "requests", request.uid));
    await batch.commit();
  }

  async function reject(request: JoinRequest) {
    if (!gid) return;
    await deleteDoc(doc(db, "groups", gid, "requests", request.uid));
  }

  async function deleteGroup() {
    if (!gid || !confirm(t.group.confirmDelete)) return;
    await deleteDoc(doc(db, "groups", gid));
    navigate("/groups");
  }

  return (
    <div>
      <div className="card">
        <div className="row">
          <div>
            <h1>{group.name}</h1>
            <span className="badge">
              {group.visibility === "public"
                ? t.groups.badgePublic
                : t.groups.badgePrivate}
            </span>
            {group.description && <p>{group.description}</p>}
          </div>
          <div className="row-actions">
            {user && !isMember && !hasRequested && (
              <button onClick={join}>
                {group.visibility === "public" ? t.group.join : t.group.request}
              </button>
            )}
            {hasRequested && !isMember && (
              <span className="hint">{t.group.requestSent}</span>
            )}
            {isMember && !isOwner && (
              <button className="secondary" onClick={leave}>
                {t.group.leave}
              </button>
            )}
            {isOwner && (
              <button className="link danger" onClick={deleteGroup}>
                {t.group.deleteGroup}
              </button>
            )}
          </div>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {isOwner && requests.length > 0 && (
        <div className="card">
          <h2>{t.group.requests}</h2>
          {requests.map((r) => (
            <div className="row" key={r.uid}>
              <span>{r.displayName}</span>
              <div className="row-actions">
                <button onClick={() => approve(r)}>{t.group.accept}</button>
                <button className="secondary" onClick={() => reject(r)}>
                  {t.group.refuse}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {canView ? (
        <>
          {isMember && (
            <PostComposer
              groupId={gid ?? null}
              placeholder={t.group.postIn(group.name)}
            />
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && <p className="center">{t.group.empty}</p>}
        </>
      ) : (
        <p className="card">{t.group.privateLocked}</p>
      )}
    </div>
  );
}
