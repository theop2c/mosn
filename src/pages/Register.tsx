import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const { t } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName,
        displayNameLower: displayName.toLowerCase(),
        bio: "",
        createdAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.register.failed);
    }
  }

  return (
    <div className="card auth-card">
      <h1>{t.register.title}</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder={t.register.displayName}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={50}
        />
        <input
          type="email"
          placeholder={t.login.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t.register.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit">{t.register.submit}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        {t.register.already} <Link to="/login">{t.nav.login}</Link>
      </p>
    </div>
  );
}
