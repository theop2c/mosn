import type { Config } from "@netlify/functions";
import { adminAuth, adminDb } from "./_shared/firebase.js";
import { json, safe } from "./_shared/auth.js";

/**
 * Création du compte administrateur à partir des variables d'environnement
 * ADMIN_EMAIL et ADMIN_PASSWORD (renseignées par l'assistant
 * d'installation). Aucune commande console : il suffit d'ouvrir
 * https://<site>/api/bootstrap-admin dans le navigateur.
 *
 * Idempotent : si le compte existe déjà, il est simplement (re)promu admin,
 * son mot de passe n'est pas modifié — sauf si l'URL contient ?reset=1,
 * auquel cas le mot de passe est forcé à la valeur de ADMIN_PASSWORD
 * (utile quand le compte existait déjà avec un autre mot de passe).
 * Un attaquant ne peut rien contrôler ici (tout vient de l'environnement).
 * Supprimez ADMIN_PASSWORD des variables une fois l'admin créé.
 */
export default safe(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return json(403, {
      error:
        "Bootstrap désactivé : définissez ADMIN_EMAIL et ADMIN_PASSWORD dans les variables d'environnement.",
    });
  }

  const auth = adminAuth();
  const resetPassword = new URL(req.url).searchParams.get("reset") === "1";
  let uid: string;
  let created = false;
  try {
    uid = (await auth.getUserByEmail(email)).uid;
    if (resetPassword) {
      await auth.updateUser(uid, { password });
    }
  } catch {
    const user = await auth.createUser({
      email,
      password,
      displayName: "Admin",
      emailVerified: true,
    });
    uid = user.uid;
    created = true;
  }

  await auth.setCustomUserClaims(uid, { admin: true });
  const db = adminDb();
  await db
    .doc(`users/${uid}`)
    .set({ displayName: "Admin", role: "admin" }, { merge: true });

  // Paramètres initiaux du site (ex. hébergement d'images choisi dans
  // l'assistant d'installation). On ne les écrit qu'à la création pour ne
  // pas écraser un réglage modifié ensuite dans /admin/settings.
  const settingsRef = db.doc("settings/app");
  if (!(await settingsRef.get()).exists) {
    await settingsRef.set({
      imagesEnabled: process.env.ENABLE_IMAGES === "true",
      theme: process.env.SITE_THEME || "indigo",
      language: process.env.SITE_LANGUAGE || "fr",
    });
  }

  return json(200, {
    ok: true,
    uid,
    created,
    message: created
      ? "Compte admin créé. Supprimez ADMIN_PASSWORD des variables d'environnement, puis connectez-vous."
      : resetPassword
        ? "Ce compte est (déjà) admin. Mot de passe réinitialisé à la valeur de ADMIN_PASSWORD."
        : "Ce compte est (déjà) admin. Mot de passe inchangé (ajoutez ?reset=1 à l'URL pour le forcer à la valeur de ADMIN_PASSWORD).",
  });
});

export const config: Config = { path: "/api/bootstrap-admin" };
