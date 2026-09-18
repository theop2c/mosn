import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./Avatar";
import type { Comment } from "../types";

/** Commentaires sous un post : compteur, liste repliable temps réel, saisie. */
export function Comments({ postId }: { postId: string }) {
  const { user, profile, isAdmin, t } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCountFromServer(collection(db, "posts", postId, "comments"))
      .then((snap) => setCount(snap.data().count))
      .catch(() => setCount(null));
  }, [postId]);

  useEffect(() => {
    if (!open) return;
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
      limit(100),
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment));
      setCount(snap.size);
    });
  }, [open, postId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setError(null);
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName:
          profile?.displayName ?? user.displayName ?? t.common.anonymous,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  async function remove(commentId: string) {
    await deleteDoc(doc(db, "posts", postId, "comments", commentId));
  }

  return (
    <div className="comments">
      <button
        type="button"
        className={`reaction comments-toggle ${open ? "selected" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        💬{count != null && count > 0 && (
          <span className="reaction-count">{count}</span>
        )}
      </button>

      {open && (
        <div className="comments-panel">
          {comments.length === 0 && (
            <p className="hint">{t.post.noComments}</p>
          )}
          {comments.map((comment) => (
            <div className="comment" key={comment.id}>
              <Avatar name={comment.authorName} uid={comment.authorId} size={28} />
              <div className="comment-body">
                <div className="comment-head">
                  <Link to={`/u/${comment.authorId}`} className="author">
                    {comment.authorName}
                  </Link>
                  <time>
                    {comment.createdAt?.toDate().toLocaleString() ?? ""}
                  </time>
                </div>
                <p>{comment.text}</p>
              </div>
              {(isAdmin || user?.uid === comment.authorId) && (
                <button
                  type="button"
                  className="link danger comment-delete"
                  onClick={() => remove(comment.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {user && (
            <form className="composer-inline" onSubmit={handleSubmit}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.post.commentPlaceholder}
                maxLength={1000}
              />
              <button type="submit" disabled={!text.trim()}>
                {t.messages.send}
              </button>
            </form>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}
