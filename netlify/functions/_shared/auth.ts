import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase.js";

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Enveloppe un handler pour renvoyer les erreurs en JSON lisible
 * (configuration manquante, etc.) au lieu de la page de crash Netlify.
 */
export function safe(
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req) => {
    try {
      return await handler(req);
    } catch (err) {
      console.error(err);
      return json(500, {
        error: err instanceof Error ? err.message : "Erreur interne",
      });
    }
  };
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
