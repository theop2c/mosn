import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { THEMES } from "../../lib/themes";
import { LANGUAGES } from "../../i18n";
import { useAuth } from "../../context/AuthContext";
import { AdminTabs } from "../../components/AdminTabs";

export function AdminSettings() {
  const { settings, t } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function save(fields: Record<string, unknown>) {
    setError(null);
    try {
      await setDoc(doc(db, "settings", "app"), fields, { merge: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  return (
    <div>
      <AdminTabs />
      <h1>{t.admin.settingsTitle}</h1>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>{t.admin.designTitle}</h2>
        <p className="hint">{t.admin.designHint}</p>
        <div className="theme-grid">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`theme-swatch ${
                settings.theme === theme.id ? "selected" : ""
              }`}
              onClick={() => save({ theme: theme.id })}
            >
              <span className="swatches">
                {theme.preview.map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </span>
              {theme.label}
              {settings.theme === theme.id && " ✓"}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{t.admin.languageTitle}</h2>
        <p className="hint">{t.admin.languageHint}</p>
        <div className="theme-grid">
          {LANGUAGES.map((language) => (
            <button
              key={language.id}
              type="button"
              className={`theme-swatch ${
                settings.language === language.id ? "selected" : ""
              }`}
              onClick={() => save({ language: language.id })}
            >
              {language.label}
              {settings.language === language.id && " ✓"}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.publicFeed}
            onChange={(e) => save({ publicFeed: e.target.checked })}
          />
          <span>
            <strong>{t.admin.publicFeedTitle}</strong>
            <br />
            {t.admin.publicFeedDesc}
          </span>
        </label>
      </div>

      <div className="card">
        <h2>{t.admin.paginationTitle}</h2>
        <p className="hint">{t.admin.paginationDesc}</p>
        <div className="theme-grid">
          {[10, 20, 50, 100].map((size) => (
            <button
              key={size}
              type="button"
              className={`theme-swatch ${
                settings.pageSize === size ? "selected" : ""
              }`}
              onClick={() => save({ pageSize: size })}
            >
              {size}
              {settings.pageSize === size && " ✓"}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.imagesEnabled}
            onChange={(e) => save({ imagesEnabled: e.target.checked })}
          />
          <span>
            <strong>{t.admin.imagesTitle}</strong>
            <br />
            {t.admin.imagesDesc}
          </span>
        </label>

        <div className="notice">
          <p>{t.admin.blazeIntro}</p>
          <ol>
            {t.admin.blazeSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>{t.admin.blazeOutro}</p>
        </div>
      </div>
    </div>
  );
}
