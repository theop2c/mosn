import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase.js";

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Vérifie le header `Authorization: Bearer <idToken>` et renvoie le token
 * décodé, ou null si absent/invalide.
 */
export async function requireUser(req: Request): Promise<DecodedIdToken | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await adminAuth().verifyIdToken(match[1], true);
  } catch {
    return null;
  }
}

/** Comme requireUser, mais exige en plus le custom claim `admin: true`. */
export async function requireAdmin(req: Request): Promise<DecodedIdToken | null> {
  const user = await requireUser(req);
  if (!user || user.admin !== true) return null;
  return user;
}
