import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../types";

export function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  const isOwn = user?.uid === uid;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid), (snap) => {
      const data = (snap.data() as UserProfile | undefined) ?? null;
      setProfile(data);
      setBio(data?.bio ?? "");
    });
  }, [uid]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), { bio });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return <p className="center">Profil introuvable.</p>;

  return (
    <div className="card">
      <h1>{profile.displayName}</h1>
      {profile.role === "admin" && <span className="badge">admin</span>}
      {profile.banned && <span className="badge danger">banni</span>}
      {isOwn ? (
        <form onSubmit={handleSave}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Votre bio…"
            maxLength={300}
            rows={3}
          />
          <button type="submit">{saved ? "Enregistré ✓" : "Enregistrer"}</button>
        </form>
      ) : (
        <p>{profile.bio || "Pas de bio."}</p>
      )}
    </div>
  );
}
