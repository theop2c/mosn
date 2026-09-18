import type { Config } from "@netlify/functions";
import { adminAuth } from "./_shared/firebase.js";
import { json, requireAdmin, safe } from "./_shared/auth.js";

/** GET /api/admin/users — liste paginée des comptes (admin uniquement). */
export default safe(async (req: Request) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const admin = await requireAdmin(req);
  if (!admin) return json(403, { error: "Admin only" });

  const pageToken = new URL(req.url).searchParams.get("pageToken") ?? undefined;
  const page = await adminAuth().listUsers(50, pageToken);

  return json(200, {
    users: page.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      disabled: u.disabled,
      admin: u.customClaims?.admin === true,
      createdAt: u.metadata.creationTime,
    })),
    nextPageToken: page.pageToken ?? null,
  });
});

export const config: Config = { path: "/api/admin/users" };
