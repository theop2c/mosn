import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const siteEnv = import.meta.env.VITE_SITE_ENV;
// Bouton de connexion anonyme uniquement en environnement dev/test
const showAnonymous = siteEnv === "dev" || siteEnv === "test";

export function Login() {
  const { t } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  async function handleForgotPassword() {
    setError(null);
    if (!email) {
      setError(t.login.forgotNeedEmail);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.failed);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.failed);
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
          ? `${err.message} — ${t.login.anonymousHint}`
          : t.login.failed,
      );
    }
  }

  return (
    <div className="card auth-card">
      <h1>{t.login.title}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t.login.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t.login.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{t.login.submit}</button>
      </form>
      <button className="link" onClick={handleForgotPassword}>
        {resetSent ? t.login.forgotSent : t.login.forgot}
      </button>
      <button className="secondary" onClick={handleGoogle}>
        {t.login.google}
      </button>
      {showAnonymous && (
        <>
          <button className="secondary" onClick={handleAnonymous}>
            {t.login.anonymous(siteEnv ?? "dev")}
          </button>
          <p className="hint">{t.login.anonymousHint}</p>
        </>
      )}
      {error && <p className="error">{error}</p>}
      <p>
        {t.login.noAccount} <Link to="/register">{t.login.createAccount}</Link>
      </p>
    </div>
  );
}
