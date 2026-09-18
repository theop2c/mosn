import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { EmojiPicker } from "../components/EmojiPicker";
import type { DirectMessage, UserProfile } from "../types";

export function Conversation() {
  const { uid: otherUid } = useParams<{ uid: string }>();
  const { user, profile, t } = useAuth();
  const [other, setOther] = useState<UserProfile | null>(null);
  const [convExists, setConvExists] = useState(false);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
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

  const convId =
    user && otherUid ? [user.uid, otherUid].sort().join("_") : null;

  useEffect(() => {
    if (!otherUid) return;
    return onSnapshot(doc(db, "users", otherUid), (snap) => {
      setOther((snap.data() as UserProfile | undefined) ?? null);
    });
  }, [otherUid]);

  useEffect(() => {
    if (!convId) return;
    return onSnapshot(doc(db, "dms", convId), (snap) =>
      setConvExists(snap.exists()),
    );
  }, [convId]);

  useEffect(() => {
    // On ne s'abonne aux messages qu'une fois la conversation créée
    // (les règles lisent le doc parent pour vérifier les participants).
    if (!convId || !convExists) return;
    const q = query(
      collection(db, "dms", convId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    return onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DirectMessage),
      );
    });
  }, [convId, convExists]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user || !otherUid) return null;
  if (user.uid === otherUid) {
    return <p className="center">{t.messages.self}</p>;
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!user || !convId || !otherUid || !text.trim()) return;
    setError(null);
    try {
      // Crée/actualise la conversation (doit exister avant le message)
      await setDoc(
        doc(db, "dms", convId),
        {
          participants: [user.uid, otherUid].sort(),
          participantNames: {
            [user.uid]:
              profile?.displayName ?? user.displayName ?? t.messages.me,
            [otherUid]: other?.displayName ?? t.common.user,
          },
          lastMessage: text.trim().slice(0, 80),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await addDoc(collection(db, "dms", convId, "messages"), {
        senderId: user.uid,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.messages.failed);
    }
  }

  return (
    <div className="conversation">
      <h1>
        <Link to="/messages" className="link-plain">←</Link>{" "}
        {other?.displayName ?? t.common.user}
      </h1>
      <div className="messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`msg ${m.senderId === user.uid ? "mine" : ""}`}
          >
            <p>{m.text}</p>
            <time>{m.createdAt?.toDate().toLocaleTimeString() ?? ""}</time>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="center">{t.messages.first}</p>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="composer-inline" onSubmit={send}>
        <EmojiPicker onPick={insertEmoji} />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.messages.placeholder}
          maxLength={2000}
        />
        <button type="submit" disabled={!text.trim()}>
          {t.messages.send}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
