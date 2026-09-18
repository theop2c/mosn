import { useState } from "react";
import { Link } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types";

export function PostCard({ post }: { post: Post }) {
  const { user, isAdmin } = useAuth();
  const [reported, setReported] = useState(false);

  const isOwner = user?.uid === post.authorId;
  const date = post.createdAt?.toDate().toLocaleString() ?? "";

  async function handleDelete() {
    if (!confirm("Supprimer ce post ?")) return;
    if (isOwner) {
      await deleteDoc(doc(db, "posts", post.id));
    } else if (isAdmin) {
      await api("/api/admin/delete-post", { body: { postId: post.id } });
    }
  }

  async function handleReport() {
    const reason = prompt("Raison du signalement :");
    if (!reason) return;
    await api("/api/report", {
      body: { targetType: "post", targetId: post.id, reason },
    });
    setReported(true);
  }

  return (
    <article className="card post">
      <header>
        <Link to={`/u/${post.authorId}`} className="author">
          {post.authorName}
        </Link>
        <time>{date}</time>
      </header>
      <p className="post-text">{post.text}</p>
      {post.imageUrl && (
        <img className="post-image" src={post.imageUrl} alt="" loading="lazy" />
      )}
      <footer className="post-actions">
        {(isOwner || isAdmin) && (
          <button className="link danger" onClick={handleDelete}>
            Supprimer
          </button>
        )}
        {user && !isOwner && (
          <button className="link" onClick={handleReport} disabled={reported}>
            {reported ? "Signalé ✓" : "Signaler"}
          </button>
        )}
      </footer>
    </article>
  );
}
