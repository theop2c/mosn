import type { Config } from "@netlify/functions";
import { adminAuth, adminDb } from "./_shared/firebase.js";
import { json } from "./_shared/auth.js";

/**
 * Création du compte administrateur à partir des variables d'environnement
 * ADMIN_EMAIL et ADMIN_PASSWORD (renseignées par l'assistant
 * d'installation). Aucune commande console : il suffit d'ouvrir
 * https://<site>/api/bootstrap-admin dans le navigateur.
 *
 * Idempotent : si le compte existe déjà, il est simplement (re)promu admin,
 * son mot de passe n'est pas modifié. Un attaquant ne peut rien contrôler
 * ici (tout vient de l'environnement). Supprimez ADMIN_PASSWORD des
 * variables une fois l'admin créé.
 */
export default async (req: Request) => {
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
  let uid: string;
  let created = false;
  try {
    uid = (await auth.getUserByEmail(email)).uid;
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
  await adminDb()
    .doc(`users/${uid}`)
    .set({ displayName: "Admin", role: "admin" }, { merge: true });

  return json(200, {
    ok: true,
    uid,
    created,
    message: created
      ? "Compte admin créé. Supprimez ADMIN_PASSWORD des variables d'environnement, puis connectez-vous."
      : "Ce compte est (déjà) admin. Mot de passe inchangé.",
  });
};

export const config: Config = { path: "/api/bootstrap-admin" };
