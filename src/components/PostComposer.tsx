import { useRef, useState, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadPostImage } from "../lib/uploadImage";
import { useAuth } from "../context/AuthContext";

/**
 * Formulaire de publication, avec pièce jointe image si l'hébergement
 * d'images est activé par un admin (/admin/settings).
 */
export function PostComposer({
  groupId = null,
  placeholder,
}: {
  groupId?: string | null;
  placeholder?: string;
}) {
  const { user, profile, settings, t } = useAuth();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      const imageUrl = file ? await uploadPostImage(user.uid, file) : null;
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName:
          profile?.displayName ?? user.displayName ?? t.common.anonymous,
        text: text.trim(),
        groupId,
        imageUrl,
        createdAt: serverTimestamp(),
      });
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}${file ? ` — ${t.composer.uploadHint}` : ""}`
          : t.composer.failed,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card composer" onSubmit={handleSubmit}>
      <textarea
        placeholder={placeholder ?? t.feed.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        rows={3}
      />
      {settings.imagesEnabled && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      )}
      <button type="submit" disabled={!text.trim() || busy}>
        {busy ? t.composer.publishing : t.composer.publish}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
