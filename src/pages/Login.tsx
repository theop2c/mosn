import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

const siteEnv = import.meta.env.VITE_SITE_ENV;
// Bouton de connexion anonyme uniquement en environnement dev/test
const showAnonymous = siteEnv === "dev" || siteEnv === "test";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    }
  }

  async function handleAnonymous() {
    setError(null);
    try {
      await signInAnonymously(auth);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — vérifiez que le fournisseur « Anonyme » est activé dans Firebase Authentication.`
          : "Échec de la connexion anonyme",
      );
    }
  }

  return (
    <div className="card auth-card">
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>
      <button className="secondary" onClick={handleGoogle}>
        Continuer avec Google
      </button>
      {showAnonymous && (
        <>
          <button className="secondary" onClick={handleAnonymous}>
            Connexion anonyme ({siteEnv})
          </button>
          <p className="hint">
            Visible uniquement en dev/test. Nécessite le fournisseur
            « Anonyme » activé dans Firebase Authentication.
          </p>
        </>
      )}
      {error && <p className="error">{error}</p>}
      <p>
        Pas de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </div>
  );
}
