#!/usr/bin/env node
// Assistant d'installation local : pose les mêmes questions que l'écran
// d'installation du site et écrit le fichier .env à la racine du projet.
//   npm run setup
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const ENVIRONMENTS = ["test", "dev", "preprod", "production"];
const rl = createInterface({ input: process.stdin, output: process.stdout });

function parseFirebaseConfig(text) {
  const keys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];
  const values = {};
  for (const key of keys) {
    const match = text.match(
      new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`),
    );
    values[key] = match?.[1] ?? "";
  }
  const missing = ["apiKey", "authDomain", "projectId", "appId"].filter(
    (key) => !values[key],
  );
  return { values, missing };
}

const siteName = (await rl.question("Nom du site : ")).trim();

let siteEnv = "";
while (!ENVIRONMENTS.includes(siteEnv)) {
  siteEnv = (
    await rl.question(`Environnement (${ENVIRONMENTS.join(" / ")}) : `)
  ).trim();
}
if (siteEnv === "dev" || siteEnv === "test") {
  console.log(
    "→ En dev/test, la page de connexion affichera un bouton de connexion " +
      "anonyme (activez le fournisseur « Anonyme » dans Firebase Authentication).",
  );
}

const adminEmail = (await rl.question("Email de l'administrateur : ")).trim();
const adminPassword = (
  await rl.question("Mot de passe de l'administrateur (6 car. min) : ")
).trim();

console.log(
  "\nCollez la configuration Firebase (le bloc « const firebaseConfig = { … } »)," +
    "\npuis terminez par une ligne vide :\n",
);
let snippet = "";
for (;;) {
  const line = await rl.question("");
  if (line.trim() === "" && snippet.trim() !== "") break;
  snippet += line + "\n";
  if (line.includes("}")) break;
}
rl.close();

const { values, missing } = parseFirebaseConfig(snippet);
if (missing.length > 0) {
  console.error(`\n✗ Champs introuvables : ${missing.join(", ")}. Abandon.`);
  process.exit(1);
}

// Préserve les secrets déjà présents dans un .env existant
let serviceAccount = "";
if (existsSync(".env")) {
  const existing = readFileSync(".env", "utf8");
  serviceAccount =
    existing.match(/^FIREBASE_SERVICE_ACCOUNT=(.*)$/m)?.[1] ?? "";
}

const env = `# Généré par npm run setup (assistant d'installation MOSN)

# ── Site ───────────────────────────────────────────────────────────
VITE_SITE_NAME=${siteName}
VITE_SITE_ENV=${siteEnv}

# ── Firebase (config web, exposée au navigateur) ───────────────────
VITE_FIREBASE_API_KEY=${values.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${values.authDomain}
VITE_FIREBASE_PROJECT_ID=${values.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${values.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${values.messagingSenderId}
VITE_FIREBASE_APP_ID=${values.appId}

# ── Compte administrateur ──────────────────────────────────────────
# Utilisé une seule fois par /api/bootstrap-admin pour créer le compte.
# Supprimez ADMIN_PASSWORD une fois l'admin créé.
ADMIN_EMAIL=${adminEmail}
ADMIN_PASSWORD=${adminPassword}

# ── Netlify Functions (secret serveur, à compléter à la main) ──────
# Console Firebase → Paramètres → Comptes de service → Générer une clé
# privée, JSON sur une seule ligne :
FIREBASE_SERVICE_ACCOUNT=${serviceAccount}
`;

writeFileSync(".env", env);
console.log(
  "\n✓ Fichier .env écrit." +
    (serviceAccount
      ? ""
      : "\n→ Complétez FIREBASE_SERVICE_ACCOUNT (clé de compte de service Firebase)."),
);
console.log(
  "→ Lancez `npm run dev` puis ouvrez http://localhost:8888/api/bootstrap-admin pour créer l'admin.",
);
