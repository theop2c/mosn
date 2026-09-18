import { useState } from "react";
import { Link } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./Avatar";
import { Comments } from "./Comments";
import { Reactions } from "./Reactions";
import type { Post } from "../types";

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
        <span className="post-menu">
          {(isOwner || isAdmin) && (
            <button className="link danger" onClick={handleDelete}>
              {t.post.delete}
            </button>
          )}
          {user && !isOwner && (
            <button
              className="link"
              onClick={handleReport}
              disabled={reported}
            >
              {reported ? t.post.reported : t.post.report}
            </button>
          )}
        </span>
      </header>
      <p className="post-text">{post.text}</p>
      {images.length > 0 && (
        <div className="post-images">
          {images.map((url) => (
            <img key={url} src={url} alt="" loading="lazy" />
          ))}
        </div>
      )}
      <footer className="post-actions">
        <Reactions postId={post.id} />
        <Comments postId={post.id} />
      </footer>
    </article>
  );
}
