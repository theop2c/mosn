import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { AdminTabs } from "../../components/AdminTabs";

export function AdminSettings() {
  const { settings } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function toggleImages(enabled: boolean) {
    setError(null);
    try {
      await setDoc(
        doc(db, "settings", "app"),
        { imagesEnabled: enabled },
        { merge: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div>
      <AdminTabs />
      <h1>Paramètres du site</h1>

      <div className="card">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.imagesEnabled}
            onChange={(e) => toggleImages(e.target.checked)}
          />
          <span>
            <strong>Hébergement d'images (Firebase Storage)</strong>
            <br />
            Permet aux utilisateurs de joindre une image à leurs posts.
          </span>
        </label>
        {error && <p className="error">{error}</p>}

        <div className="notice">
          <p>
            ⚠️ Firebase Storage nécessite le <strong>forfait payant Blaze</strong>{" "}
            (facturation à l'usage). Avant d'activer cette option :
          </p>
          <ol>
            <li>
              Console Firebase → ⚙️ en bas à gauche → <strong>Passer au plan
              Blaze</strong> (carte bancaire requise, facturation à l'usage).
            </li>
            <li>
              <strong>Build → Storage → Commencer</strong> pour créer le
              bucket.
            </li>
            <li>
              Onglet <strong>Règles</strong> de Storage : copiez-collez le
              contenu du fichier <code>storage.rules</code> du repo, puis
              <strong> Publier</strong>.
            </li>
            <li>
              Vérifiez que <code>VITE_FIREBASE_STORAGE_BUCKET</code> est bien
              renseignée dans les variables Netlify (l'assistant
              d'installation la remplit automatiquement).
            </li>
          </ol>
          <p>
            Le réglage est stocké dans Firestore (<code>settings/app</code>) :
            il s'applique <strong>immédiatement</strong>, sans redéploiement,
            et vous pouvez le désactiver à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
}
