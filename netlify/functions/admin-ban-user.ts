import type { Config } from "@netlify/functions";
import { adminAuth, adminDb } from "./_shared/firebase.js";
import { json, requireAdmin, safe } from "./_shared/auth.js";

/** POST /api/admin/ban-user { uid, banned: boolean } — désactive/réactive un compte. */
export default safe(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const caller = await requireAdmin(req);
  if (!caller) return json(403, { error: "Admin only" });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.uid !== "string" || typeof body.banned !== "boolean") {
    return json(400, { error: "Expected { uid: string, banned: boolean }" });
  }
  if (body.uid === caller.uid) {
    return json(400, { error: "Impossible de se bannir soi-même" });
  }

  await adminAuth().updateUser(body.uid, { disabled: body.banned });
  if (body.banned) {
    // Invalide les sessions en cours
    await adminAuth().revokeRefreshTokens(body.uid);
  }
  await adminDb().doc(`users/${body.uid}`).set({ banned: body.banned }, { merge: true });

  return json(200, { ok: true });
});

export const config: Config = { path: "/api/admin/ban-user" };
