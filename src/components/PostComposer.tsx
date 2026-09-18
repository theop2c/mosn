import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadPostImage } from "../lib/uploadImage";
import { useAuth } from "../context/AuthContext";
import { EmojiPicker } from "./EmojiPicker";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

/**
 * Formulaire de publication : smileys (insérés au curseur) et, si
 * l'hébergement d'images est activé par un admin (/admin/settings),
 * jusqu'à 3 images PNG/JPEG de 5 Mo max.
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
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setText((current) => current + emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? start;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = Array.from(e.target.files ?? []);
    const next = [...files];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t.composer.imageBadType);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError(t.composer.imageTooLarge(file.name));
        continue;
      }
      if (next.length >= MAX_IMAGES) {
        setError(t.composer.imageTooMany);
        break;
      }
      next.push(file);
    }
    setFiles(next);
    e.target.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      const imageUrls = await Promise.all(
        files.map((file) => uploadPostImage(user.uid, file)),
      );
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName:
          profile?.displayName ?? user.displayName ?? t.common.anonymous,
        text: text.trim(),
        groupId,
        imageUrls,
        createdAt: serverTimestamp(),
      });
      setText("");
      setFiles([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}${files.length > 0 ? ` — ${t.composer.uploadHint}` : ""}`
          : t.composer.failed,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card composer" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        placeholder={placeholder ?? t.feed.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        rows={3}
      />
      {files.length > 0 && (
        <div className="image-previews">
          {files.map((file, index) => (
            <div className="image-preview" key={`${file.name}-${index}`}>
              <img src={URL.createObjectURL(file)} alt={file.name} />
              <button
                type="button"
                aria-label="✕"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="composer-toolbar">
        <EmojiPicker onPick={insertEmoji} />
        {settings.imagesEnabled && (
          <label className="file-button">
            📷
            <input
              type="file"
              accept="image/png,image/jpeg"
              multiple
              onChange={handleFiles}
              disabled={files.length >= MAX_IMAGES}
            />
          </label>
        )}
        {settings.imagesEnabled && (
          <span className="hint">{t.composer.imagesHint}</span>
        )}
        <button
          type="submit"
          className="composer-submit"
          disabled={!text.trim() || busy}
        >
          {busy ? t.composer.publishing : t.composer.publish}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
