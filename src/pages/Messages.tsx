import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import type { Conversation } from "../types";

export function Messages() {
  const { user, t } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "dms"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      setConversations(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation),
      );
    });
  }, [user]);

  if (!user) return null;

  return (
    <div>
      <h1>{t.messages.title}</h1>
      {conversations.length === 0 && (
        <p className="center">
          {t.messages.emptyBefore}{" "}
          <Link to="/search">{t.messages.searchLink}</Link>{" "}
          {t.messages.emptyAfter}
        </p>
      )}
      {conversations.map((conv) => {
        const otherUid = conv.participants.find((p) => p !== user.uid);
        if (!otherUid) return null;
        return (
          <Link
            to={`/messages/${otherUid}`}
            className="card row conv"
            key={conv.id}
          >
            <div>
              <span className="author">
                {conv.participantNames?.[otherUid] ?? t.common.user}
              </span>
              {conv.lastMessage && <p className="hint">{conv.lastMessage}</p>}
            </div>
            <time className="hint">
              {conv.updatedAt?.toDate().toLocaleString() ?? ""}
            </time>
          </Link>
        );
      })}
    </div>
  );
}
