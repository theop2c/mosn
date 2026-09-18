import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { FollowButton } from "../components/FollowButton";
import type { UserProfile } from "../types";

type Result = UserProfile & { id: string };

export function Search() {
  const { t } = useAuth();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const needle = term.trim().toLowerCase();
    if (!needle) return;
    try {
      // Recherche par préfixe (insensible à la casse) sur displayNameLower
      const q = query(
        collection(db, "users"),
        orderBy("displayNameLower"),
        startAt(needle),
        endAt(needle + ""),
        limit(20),
      );
      const snap = await getDocs(q);
      setResults(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserProfile) })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.search.failed);
    }
  }

  return (
    <div>
      <h1>{t.search.title}</h1>
      <form className="card search-form" onSubmit={handleSearch}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t.search.placeholder}
          required
        />
        <button type="submit">{t.search.submit}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {results?.length === 0 && <p className="center">{t.search.none}</p>}
      {results?.map((u) => (
        <div className="card row" key={u.id}>
          <div>
            <Link to={`/u/${u.id}`} className="author">
              {u.displayName}
            </Link>
            {u.bio && <p className="hint">{u.bio}</p>}
          </div>
          <div className="row-actions">
            <FollowButton targetUid={u.id} />
            <Link to={`/messages/${u.id}`} className="button-link secondary">
              {t.profile.message}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
