import { useEffect, useState, type FormEvent } from "react";
import {
  buildEnvFile,
  parseFirebaseConfig,
} from "../lib/parseFirebaseConfig";
import { DEFAULT_THEME, THEMES } from "../lib/themes";
import { detectBrowserLanguage, getLabels, LANGUAGES } from "../i18n";

const ENVIRONMENTS = ["test", "dev", "preprod", "production"] as const;

/**
 * Assistant d'installation, affiché automatiquement au premier déploiement,
 * tant que les variables VITE_FIREBASE_* ne sont pas configurées.
 * Son en-tête permet de changer la langue de l'assistant lui-même ; la
 * langue et le design choisis deviennent ceux du site (via bootstrap-admin).
 */
export function Install() {
  const [uiLanguage, setUiLanguage] = useState(detectBrowserLanguage);
  const [siteName, setSiteName] = useState("");
  const [siteEnv, setSiteEnv] = useState<string>("production");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [imagesEnabled, setImagesEnabled] = useState(false);
  const [snippet, setSnippet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [envFile, setEnvFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const t = getLabels(uiLanguage);
  const isDevLike = siteEnv === "dev" || siteEnv === "test";

  // Aperçu en direct du design sélectionné
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { values, missing } = parseFirebaseConfig(snippet);
    if (missing.length > 0) {
      setError(t.install.parseError(missing.join(", ")));
      return;
    }
    setEnvFile(
      buildEnvFile({
        siteName: siteName.trim(),
        siteEnv,
        adminEmail: adminEmail.trim(),
        adminPassword,
        imagesEnabled,
        theme,
        language: uiLanguage,
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

  const languageHeader = (
    <div className="install-langs">
      {LANGUAGES.map((language) => (
        <button
          key={language.id}
          type="button"
          className={`link ${uiLanguage === language.id ? "active" : ""}`}
          onClick={() => setUiLanguage(language.id)}
        >
          {language.label}
        </button>
      ))}
    </div>
  );

  if (envFile) {
    return (
      <div className="install">
        {languageHeader}
        <h1>{t.install.doneTitle}</h1>
        <p>{t.install.doneIntro}</p>
        <pre className="env-preview">{envFile}</pre>
        <div className="install-actions">
          <button onClick={download}>{t.install.download}</button>
          <button className="secondary" onClick={copy}>
            {copied ? t.install.copied : t.install.copy}
          </button>
        </div>
        <ol>
          {t.install.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button className="link" onClick={() => setEnvFile(null)}>
          {t.install.editAnswers}
        </button>
      </div>
    );
  }

  return (
    <div className="install">
      {languageHeader}
      <h1>{t.install.title}</h1>
      <p>{t.install.intro}</p>
      <form onSubmit={handleSubmit}>
        <label>
          {t.install.siteName}
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder={t.install.siteNamePlaceholder}
            required
            maxLength={50}
          />
        </label>
        <label>
          {t.install.environment}
          <select value={siteEnv} onChange={(e) => setSiteEnv(e.target.value)}>
            {ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </select>
        </label>
        {isDevLike && <p className="notice">{t.install.envNotice(siteEnv)}</p>}
        <label>
          {t.install.adminEmail}
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@exemple.com"
            required
          />
        </label>
        <label>
          {t.install.adminPassword}
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder={t.install.adminPasswordPlaceholder}
            required
            minLength={6}
          />
        </label>
        <span className="label-title">{t.install.design}</span>
        <div className="theme-grid">
          {THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`theme-swatch ${theme === option.id ? "selected" : ""}`}
              onClick={() => setTheme(option.id)}
            >
              <span className="swatches">
                {option.preview.map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </span>
              {option.label}
              {theme === option.id && " ✓"}
            </button>
          ))}
        </div>
        <p className="hint">
          {t.install.language} : {LANGUAGES.find((l) => l.id === uiLanguage)?.label}
        </p>
        <label className="toggle">
          <input
            type="checkbox"
            checked={imagesEnabled}
            onChange={(e) => setImagesEnabled(e.target.checked)}
          />
          <span>{t.install.imagesToggle}</span>
        </label>
        {imagesEnabled && <p className="notice">{t.install.imagesNotice}</p>}
        <label>
          {t.install.firebaseConfig}
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            rows={10}
            required
            placeholder={`${t.install.firebaseConfigPlaceholder}

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
        <button type="submit">{t.install.submit}</button>
      </form>
    </div>
  );
}
