import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export function Register() {
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
        bio: "",
        createdAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'inscription");
    }
  }

  return (
    <div className="card auth-card">
      <h1>Créer un compte</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nom affiché"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={50}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe (6 caractères min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit">S'inscrire</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Déjà inscrit ? <Link to="/login">Connexion</Link>
      </p>
    </div>
  );
}
