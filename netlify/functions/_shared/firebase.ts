import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Lit le compte de service depuis FIREBASE_SERVICE_ACCOUNT.
 * Accepte le JSON brut (contenu complet du fichier .json téléchargé depuis
 * la console Firebase) ou sa version encodée en base64. Erreurs explicites
 * plutôt qu'un crash : elles sont renvoyées en JSON par le wrapper safe().
 */
function loadServiceAccount(): Record<string, string> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    throw new Error(
      "La variable d'environnement FIREBASE_SERVICE_ACCOUNT est absente. " +
        "Console Firebase → Paramètres → Comptes de service → Générer une clé privée, " +
        "puis collez le contenu COMPLET du fichier .json téléchargé comme valeur de la variable.",
    );
  }

  let text = raw;
  if (!text.startsWith("{")) {
    // Peut-être encodé en base64
    try {
      text = Buffer.from(text, "base64").toString("utf8").trim();
    } catch {
      /* ignore */
    }
  }
  if (!text.startsWith("{")) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT ne contient pas le JSON du compte de service ` +
        `(la valeur commence par « ${raw.slice(0, 20)}… »). Collez le contenu ` +
        `COMPLET du fichier .json téléchargé (il commence par « { »), ou sa ` +
        `version encodée en base64.`,
    );
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(text);
  } catch (err) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT n'est pas un JSON valide : " +
        (err instanceof Error ? err.message : String(err)) +
        ". Recollez le contenu complet du fichier .json du compte de service.",
    );
  }

  // Les UI d'env vars transforment parfois les \n de la clé privée.
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
  return serviceAccount;
}

function app() {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({ credential: cert(loadServiceAccount()) });
}

export const adminAuth = () => getAuth(app());
// FIRESTORE_DATABASE_ID : à définir uniquement si votre base Firestore a un
// ID personnalisé (créée hors console Firebase) ; sinon "(default)".
export const adminDb = () => {
  const databaseId = process.env.FIRESTORE_DATABASE_ID;
  return databaseId ? getFirestore(app(), databaseId) : getFirestore(app());
};
