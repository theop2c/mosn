export interface FirebaseConfigValues {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const KEYS: (keyof FirebaseConfigValues)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const REQUIRED: (keyof FirebaseConfigValues)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

/**
 * Parse le snippet `const firebaseConfig = { ... }` collé depuis la console
 * Firebase (accepte aussi du JSON, les quotes simples/doubles, les
 * commentaires…). Renvoie les valeurs trouvées et la liste des champs
 * obligatoires manquants.
 */
export function parseFirebaseConfig(text: string): {
  values: FirebaseConfigValues;
  missing: string[];
} {
  const values = {} as FirebaseConfigValues;
  for (const key of KEYS) {
    const match = text.match(
      new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`),
    );
    values[key] = match?.[1] ?? "";
  }
  const missing = REQUIRED.filter((key) => !values[key]);
  return { values, missing };
}

/** Génère le contenu du fichier .env à partir des réponses de l'assistant. */
export function buildEnvFile(options: {
  siteName: string;
  siteEnv: string;
  adminEmail: string;
  adminPassword: string;
  imagesEnabled: boolean;
  theme: string;
  language: string;
  publicFeed: boolean;
  pageSize: number;
  config: FirebaseConfigValues;
}): string {
  const {
    siteName,
    siteEnv,
    adminEmail,
    adminPassword,
    imagesEnabled,
    theme,
    language,
    publicFeed,
    pageSize,
    config,
  } = options;
  return [
    "# Généré par l'assistant d'installation MOSN",
    "",
    "# ── Site ───────────────────────────────────────────────────────────",
    `VITE_SITE_NAME=${siteName}`,
    `VITE_SITE_ENV=${siteEnv}`,
    "",
    "# ── Firebase (config web, exposée au navigateur) ───────────────────",
    `VITE_FIREBASE_API_KEY=${config.apiKey}`,
    `VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain}`,
    `VITE_FIREBASE_PROJECT_ID=${config.projectId}`,
    `VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket}`,
    `VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}`,
    `VITE_FIREBASE_APP_ID=${config.appId}`,
    "",
    "# ── Compte administrateur ──────────────────────────────────────────",
    "# Utilisé une seule fois par /api/bootstrap-admin pour créer le compte.",
    "# Supprimez ADMIN_PASSWORD une fois l'admin créé.",
    `ADMIN_EMAIL=${adminEmail}`,
    `ADMIN_PASSWORD=${adminPassword}`,
    "",
    "# ── Réglages initiaux du site (appliqués par /api/bootstrap-admin, ─",
    "# ── modifiables ensuite depuis /admin/settings, sans redéploiement) ─",
    `ENABLE_IMAGES=${imagesEnabled}`,
    `SITE_THEME=${theme}`,
    `SITE_LANGUAGE=${language}`,
    `PUBLIC_FEED=${publicFeed}`,
    `PAGE_SIZE=${pageSize}`,
    "",
    "# ── Netlify Functions (secret serveur, à compléter à la main) ──────",
    "# Console Firebase → Paramètres → Comptes de service → Générer une clé",
    "# privée, JSON sur une seule ligne :",
    "FIREBASE_SERVICE_ACCOUNT=",
    "",
  ].join("\n");
}
