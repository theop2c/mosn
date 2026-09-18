import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Vrai quand les variables VITE_FIREBASE_* sont renseignées. Sinon,
 * main.tsx affiche l'assistant d'installation et rien ci-dessous n'est
 * utilisé (d'où les casts : pas d'init Firebase sans configuration).
 */
export const isConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

export const app: FirebaseApp = isConfigured
  ? initializeApp(firebaseConfig)
  : (undefined as unknown as FirebaseApp);
export const auth: Auth = isConfigured
  ? getAuth(app)
  : (undefined as unknown as Auth);
export const db: Firestore = isConfigured
  ? getFirestore(app)
  : (undefined as unknown as Firestore);
export const googleProvider = new GoogleAuthProvider();
