import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

type Step = "confirm" | "password" | "invalid";

/**
 * Page d'atterrissage des invitations envoyées par un admin.
 * Le lien email Firebase connecte automatiquement l'invité, qui choisit
 * ensuite son nom et crée son mot de passe.
 */
export function Invite() {
  const { t } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("confirm");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStep("invalid");
    }
  }, []);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Connexion automatique via le lien reçu par email
      await signInWithEmailLink(auth, email.trim(), window.location.href);
      setStep("password");
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — ${t.invite.expired}`
          : t.common.error,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPassword(e: FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      await updatePassword(user, password);
      await updateProfile(user, { displayName: displayName.trim() });
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: displayName.trim(),
          displayNameLower: displayName.trim().toLowerCase(),
        },
        { merge: true },
      );
      try {
        // Marque l'invitation comme acceptée (si le doc existe)
        await updateDoc(doc(db, "invites", email.trim().toLowerCase()), {
          status: "accepted",
          acceptedAt: serverTimestamp(),
        });
      } catch {
        /* invitation absente : sans gravité */
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (step === "invalid") {
    return (
      <div className="card auth-card">
        <h1>{t.invite.invalidTitle}</h1>
        <p>
          {t.invite.invalidBody}{" "}
          <Link to="/register">{t.invite.registerLink}</Link>.
        </p>
      </div>
    );
  }

  if (step === "password") {
    return (
      <div className="card auth-card">
        <h1>{t.invite.welcomeTitle}</h1>
        <p>{t.invite.welcomeBody}</p>
        <form onSubmit={handleSetPassword}>
          <input
            placeholder={t.register.displayName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={50}
          />
          <input
            type="password"
            placeholder={t.register.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={busy}>
            {busy ? t.invite.saving : t.invite.finish}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h1>{t.invite.confirmTitle}</h1>
      <p>{t.invite.confirmBody}</p>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.invite.yourEmail}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? t.invite.connecting : t.invite.continue}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
