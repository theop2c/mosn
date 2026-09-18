import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./Avatar";
import { Comments } from "./Comments";
import { Reactions } from "./Reactions";
import type { Post } from "../types";

/** Rend le texte avec les #hashtags cliquables (recherche du fil). */
function renderText(text: string): ReactNode[] {
  return text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, index) =>
    part.startsWith("#") ? (
      <Link
        key={index}
        to={`/?q=${encodeURIComponent(part)}`}
        className="hashtag"
      >
        {part}
      </Link>
    ) : (
      part
    ),
  );
}

export function PostCard({ post }: { post: Post }) {
  const { user, isAdmin, t } = useAuth();
  const [reported, setReported] = useState(false);

  const isOwner = user?.uid === post.authorId;
  const date = post.createdAt?.toDate().toLocaleString() ?? "";
  const images = post.imageUrls ?? (post.imageUrl ? [post.imageUrl] : []);

  async function handleDelete() {
    if (!confirm(t.post.confirmDelete)) return;
    if (isOwner) {
      await deleteDoc(doc(db, "posts", post.id));
    } else if (isAdmin) {
      await api("/api/admin/delete-post", { body: { postId: post.id } });
    }
  }

  async function handleReport() {
    const reason = prompt(t.post.reportReason);
    if (!reason) return;
    await api("/api/report", {
      body: { targetType: "post", targetId: post.id, reason },
    });
    setReported(true);
  }

  return (
    <article className="card post">
      <header>
        <Link to={`/u/${post.authorId}`} className="post-author">
          <Avatar name={post.authorName} uid={post.authorId} />
          <span>
            <span className="author">{post.authorName}</span>
            <time>{date}</time>
          </span>
        </Link>
      </header>
      <p className="post-text">{renderText(post.text)}</p>
      {images.length > 0 && (
        <div className="post-images">
          {images.map((url) => (
            <img key={url} src={url} alt="" loading="lazy" />
          ))}
        </div>
      )}
      <footer className="post-actions">
        <div className="post-actions-row">
          <Reactions postId={post.id} />
          <div className="post-tools">
            {user && !isOwner && (
              <button
                type="button"
                className="icon-button"
                title={reported ? t.post.reported : t.post.report}
                aria-label={t.post.report}
                onClick={handleReport}
                disabled={reported}
              >
                {reported ? "✓" : "🚩"}
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button
                type="button"
                className="icon-button"
                title={t.post.delete}
                aria-label={t.post.delete}
                onClick={handleDelete}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        <Comments postId={post.id} />
      </footer>
    </article>
  );
}
