import { useEffect, useState, type FormEvent } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { AdminTabs } from "../../components/AdminTabs";
import type { Invite } from "../../types";

export function AdminInvites() {
  const { user, t } = useAuth();
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "invites"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      setInvites(snap.docs.map((d) => d.data() as Invite));
    });
  }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const target = email.trim().toLowerCase();
    if (!target) return;
    setError(null);
    setSent(false);
    setBusy(true);
    try {
      // Firebase envoie lui-même l'email (gratuit, aucun service tiers).
      // L'invité atterrit sur /invite, déjà authentifié par le lien.
      await sendSignInLinkToEmail(auth, target, {
        url: `${window.location.origin}/invite?email=${encodeURIComponent(target)}`,
        handleCodeInApp: true,
      });
      await setDoc(doc(db, "invites", target), {
        email: target,
        invitedBy: user.uid,
        status: "sent",
        createdAt: serverTimestamp(),
      });
      setEmail("");
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.admin.sendFailed;
      setError(
        message.includes("operation-not-allowed")
          ? t.admin.linkNotEnabled
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminTabs />
      <h1>{t.admin.invitesTitle}</h1>

      <form className="card search-form" onSubmit={handleSend}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.com"
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? t.admin.sending : t.admin.invite}
        </button>
      </form>
      {sent && <p className="hint">{t.admin.inviteSent}</p>}
      {error && <p className="error">{error}</p>}

      <p className="hint">{t.admin.inviteHint}</p>

      {invites.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>{t.admin.thEmail}</th>
              <th>{t.admin.thStatus}</th>
              <th>{t.admin.thSentAt}</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.email}>
                <td>{invite.email}</td>
                <td>
                  {invite.status === "accepted"
                    ? t.admin.statusAccepted
                    : t.admin.statusSent}
                </td>
                <td>{invite.createdAt?.toDate().toLocaleDateString() ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
