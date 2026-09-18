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
import type { DirectMessage, UserProfile } from "../types";

export function Conversation() {
  const { uid: otherUid } = useParams<{ uid: string }>();
  const { user, profile } = useAuth();
  const [other, setOther] = useState<UserProfile | null>(null);
  const [convExists, setConvExists] = useState(false);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    return <p className="center">Impossible de s'écrire à soi-même.</p>;
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
            [user.uid]: profile?.displayName ?? user.displayName ?? "Moi",
            [otherUid]: other?.displayName ?? "Utilisateur",
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
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    }
  }

  return (
    <div className="conversation">
      <h1>
        <Link to="/messages" className="link-plain">←</Link>{" "}
        {other?.displayName ?? "Utilisateur"}
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
          <p className="center">Envoyez le premier message 👋</p>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="composer-inline" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre message…"
          maxLength={2000}
        />
        <button type="submit" disabled={!text.trim()}>
          Envoyer
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
