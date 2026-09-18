import type { Config } from "@netlify/functions";
import { adminAuth, adminDb } from "./_shared/firebase.js";
import { json } from "./_shared/auth.js";

/**
 * Promotion du PREMIER admin, protégée par un secret d'environnement.
 *
 *   curl -X POST https://<site>/api/bootstrap-admin \
 *     -H "content-type: application/json" \
 *     -d '{"secret":"<ADMIN_BOOTSTRAP_SECRET>","email":"vous@exemple.com"}'
 *
 * Supprimez ensuite ADMIN_BOOTSTRAP_SECRET des variables d'environnement.
 * Les admins suivants sont promus via admin-set-role.
 */
export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!secret) return json(403, { error: "Bootstrap disabled" });

  const body = await req.json().catch(() => null);
  if (!body || body.secret !== secret || typeof body.email !== "string") {
    return json(403, { error: "Forbidden" });
  }

  const user = await adminAuth().getUserByEmail(body.email);
  await adminAuth().setCustomUserClaims(user.uid, { admin: true });
  await adminDb().doc(`users/${user.uid}`).set({ role: "admin" }, { merge: true });

  return json(200, { ok: true, uid: user.uid });
};

export const config: Config = { path: "/api/bootstrap-admin" };
