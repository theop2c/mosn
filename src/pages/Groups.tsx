import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import type { Group } from "../types";

export function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "groups"),
      where("visibility", "==", "public"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      setPublicGroups(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Group),
      );
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    // Mes groupes : toutes mes adhésions (collection group), puis les groupes parents
    const q = query(collectionGroup(db, "members"), where("uid", "==", user.uid));
    return onSnapshot(q, (snap) => {
      void Promise.all(
        snap.docs.map(async (member) => {
          const groupRef = member.ref.parent.parent;
          if (!groupRef) return null;
          const group = await getDoc(doc(db, "groups", groupRef.id));
          return group.exists()
            ? ({ id: group.id, ...group.data() } as Group)
            : null;
        }),
      ).then((groups) => setMyGroups(groups.filter((g) => g !== null)));
    });
  }, [user]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    try {
      const groupRef = await addDoc(collection(db, "groups"), {
        name: name.trim(),
        description: description.trim(),
        visibility,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "groups", groupRef.id, "members", user.uid), {
        uid: user.uid,
        role: "owner",
        joinedAt: serverTimestamp(),
      });
      navigate(`/g/${groupRef.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création");
    }
  }

  return (
    <div>
      <h1>Groupes</h1>

      <form className="card" onSubmit={handleCreate}>
        <h2>Créer un groupe</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du groupe"
          required
          maxLength={60}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          maxLength={300}
          rows={2}
        />
        <select
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as "public" | "private")
          }
        >
          <option value="public">Public — tout le monde peut rejoindre</option>
          <option value="private">
            Privé — adhésion sur demande, contenu réservé aux membres
          </option>
        </select>
        <button type="submit">Créer</button>
        {error && <p className="error">{error}</p>}
      </form>

      {myGroups.length > 0 && (
        <>
          <h2>Mes groupes</h2>
          {myGroups.map((g) => (
            <GroupRow key={g.id} group={g} />
          ))}
        </>
      )}

      <h2>Groupes publics</h2>
      {publicGroups.length === 0 && (
        <p className="center">Aucun groupe public pour le moment.</p>
      )}
      {publicGroups.map((g) => (
        <GroupRow key={g.id} group={g} />
      ))}
    </div>
  );
}

function GroupRow({ group }: { group: Group }) {
  return (
    <div className="card row">
      <div>
        <Link to={`/g/${group.id}`} className="author">
          {group.name}
        </Link>{" "}
        <span className="badge">{group.visibility === "public" ? "public" : "privé"}</span>
        {group.description && <p className="hint">{group.description}</p>}
      </div>
    </div>
  );
}
