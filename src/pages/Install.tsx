import { useState, type FormEvent } from "react";
import {
  buildEnvFile,
  parseFirebaseConfig,
} from "../lib/parseFirebaseConfig";

const ENVIRONMENTS = ["test", "dev", "preprod", "production"] as const;

/**
 * Assistant d'installation, affiché automatiquement au premier déploiement,
 * tant que les variables VITE_FIREBASE_* ne sont pas configurées.
 */
export function Install() {
  const [siteName, setSiteName] = useState("");
  const [siteEnv, setSiteEnv] = useState<string>("production");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [snippet, setSnippet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [envFile, setEnvFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isDevLike = siteEnv === "dev" || siteEnv === "test";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { values, missing } = parseFirebaseConfig(snippet);
    if (missing.length > 0) {
      setError(
        `Impossible de trouver dans le code collé : ${missing.join(", ")}. ` +
          "Collez le bloc complet « const firebaseConfig = { … } » depuis la console Firebase.",
      );
      return;
    }
    setEnvFile(
      buildEnvFile({
        siteName: siteName.trim(),
        siteEnv,
        adminEmail: adminEmail.trim(),
        adminPassword,
        config: values,
      }),
    );
  }

  function download() {
    if (!envFile) return;
    const blob = new Blob([envFile], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    if (!envFile) return;
    await navigator.clipboard.writeText(envFile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (envFile) {
    return (
      <div className="install">
        <h1>Installation — dernière étape</h1>
        <p>
          Voici votre fichier <code>.env</code>. Un site statique ne peut pas
          modifier sa propre configuration : il faut fournir ces variables à
          Netlify, puis relancer un déploiement.
        </p>
        <pre className="env-preview">{envFile}</pre>
        <div className="install-actions">
          <button onClick={download}>Télécharger .env</button>
          <button className="secondary" onClick={copy}>
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
        <ol>
          <li>
            Sur Netlify : <strong>Site configuration → Environment
            variables → Add a variable → Import from a .env file</strong>,
            collez le contenu ci-dessus et validez.
          </li>
          <li>
            Complétez à la main <code>FIREBASE_SERVICE_ACCOUNT</code> :
            console Firebase → Paramètres → Comptes de service → Générer une
            clé privée (JSON sur une seule ligne).
          </li>
          <li>
            Relancez un déploiement : <strong>Deploys → Trigger deploy →
            Deploy site</strong>.
          </li>
          <li>
            Ouvrez <code>https://votre-site/api/bootstrap-admin</code> dans
            le navigateur : le compte administrateur est créé à partir de{" "}
            <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code>. Supprimez
            ensuite <code>ADMIN_PASSWORD</code> des variables Netlify.
          </li>
          <li>
            En local : placez le fichier <code>.env</code> à la racine du
            projet (ou lancez <code>npm run setup</code>).
          </li>
        </ol>
        <button className="link" onClick={() => setEnvFile(null)}>
          ← Modifier les réponses
        </button>
      </div>
    );
  }

  return (
    <div className="install">
      <h1>Bienvenue sur MOSN 👋</h1>
      <p>
        Ce site vient d'être déployé mais n'est pas encore configuré.
        Répondez à ces questions pour générer la configuration.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Nom du site
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Mon réseau social"
            required
            maxLength={50}
          />
        </label>
        <label>
          Environnement
          <select value={siteEnv} onChange={(e) => setSiteEnv(e.target.value)}>
            {ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </select>
        </label>
        {isDevLike && (
          <p className="notice">
            En environnement <strong>{siteEnv}</strong>, la page de connexion
            affichera un bouton de <strong>connexion anonyme</strong> (Google
            Firebase Anonymous Auth) — à condition d'activer le fournisseur
            « Anonyme » dans Firebase Authentication.
          </p>
        )}
        <label>
          Email de l'administrateur
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@exemple.com"
            required
          />
        </label>
        <label>
          Mot de passe de l'administrateur
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="6 caractères minimum"
            required
            minLength={6}
          />
        </label>
        <label>
          Configuration Firebase
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            rows={10}
            required
            placeholder={`Console Firebase → Paramètres du projet → Vos applications → votre app Web, puis collez le bloc :

const firebaseConfig = {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…"
};`}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Générer la configuration</button>
      </form>
    </div>
  );
}
