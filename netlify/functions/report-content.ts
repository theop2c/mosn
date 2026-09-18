import type { Config } from "@netlify/functions";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./_shared/firebase.js";
import { json, requireUser, safe } from "./_shared/auth.js";

/**
 * POST /api/report { targetType: "post" | "comment" | "user", targetId, reason }
 * Tout utilisateur connecté peut signaler un contenu ; les signalements ne
 * sont lisibles que par les admins (via Firestore rules).
 */
export default safe(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const user = await requireUser(req);
  if (!user) return json(401, { error: "Authentification requise" });

  const body = await req.json().catch(() => null);
  const types = ["post", "comment", "user"];
  if (
    !body ||
    !types.includes(body.targetType) ||
    typeof body.targetId !== "string" ||
    typeof body.reason !== "string" ||
    body.reason.length === 0 ||
    body.reason.length > 500
  ) {
    return json(400, { error: "Expected { targetType, targetId, reason }" });
  }

  await adminDb().collection("reports").add({
    targetType: body.targetType,
    targetId: body.targetId,
    reason: body.reason,
    reporterId: user.uid,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });

  return json(200, { ok: true });
});

export const config: Config = { path: "/api/report" };
