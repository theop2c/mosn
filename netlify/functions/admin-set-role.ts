import type { Config } from "@netlify/functions";
import { adminAuth, adminDb } from "./_shared/firebase.js";
import { json, requireAdmin, safe } from "./_shared/auth.js";

/** POST /api/admin/set-role { uid, admin: boolean } — promeut/rétrograde un admin. */
export default safe(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const caller = await requireAdmin(req);
  if (!caller) return json(403, { error: "Admin only" });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.uid !== "string" || typeof body.admin !== "boolean") {
    return json(400, { error: "Expected { uid: string, admin: boolean }" });
  }
  if (body.uid === caller.uid && !body.admin) {
    return json(400, { error: "Impossible de se rétrograder soi-même" });
  }

  await adminAuth().setCustomUserClaims(body.uid, { admin: body.admin });
  await adminDb()
    .doc(`users/${body.uid}`)
    .set({ role: body.admin ? "admin" : "user" }, { merge: true });

  return json(200, { ok: true });
});

export const config: Config = { path: "/api/admin/set-role" };
