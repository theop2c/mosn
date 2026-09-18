import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialisation unique de firebase-admin à partir du service account
// fourni en variable d'environnement (JSON sur une seule ligne).
function app() {
  const existing = getApps()[0];
  if (existing) return existing;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
  }
  const serviceAccount = JSON.parse(raw);
  // Les UI d'env vars transforment parfois les \n de la clé privée.
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
  return initializeApp({ credential: cert(serviceAccount) });
}

export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());
