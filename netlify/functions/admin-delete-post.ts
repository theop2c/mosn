import type { Config } from "@netlify/functions";
import { adminDb } from "./_shared/firebase.js";
import { json, requireAdmin } from "./_shared/auth.js";

/** POST /api/admin/delete-post { postId } — supprime un post et ses commentaires. */
export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const caller = await requireAdmin(req);
  if (!caller) return json(403, { error: "Admin only" });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.postId !== "string") {
    return json(400, { error: "Expected { postId: string }" });
  }

  const db = adminDb();
  const postRef = db.doc(`posts/${body.postId}`);
  await db.recursiveDelete(postRef); // supprime aussi la sous-collection comments

  // Marque les signalements liés comme traités
  const reports = await db
    .collection("reports")
    .where("targetId", "==", body.postId)
    .get();
  const batch = db.batch();
  reports.forEach((r) => batch.update(r.ref, { status: "resolved" }));
  await batch.commit();

  return json(200, { ok: true });
};

export const config: Config = { path: "/api/admin/delete-post" };
