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
      const message = err instanceof Error ? err.message : "Erreur interne";
      // Erreurs gRPC Firestore courantes, traduites en conseils actionnables
      if (/\b5 NOT_FOUND\b/.test(message)) {
        return json(500, {
          error:
            "Firestore répond NOT_FOUND : la base de données n'existe pas dans ce projet. " +
            "Console Firebase → Firestore Database → « Créer une base de données » (mode production). " +
            "Si vous l'avez créée avec un ID personnalisé (autre que « (default) »), définissez la " +
            "variable d'environnement FIRESTORE_DATABASE_ID avec cet ID. Vérifiez aussi que le compte " +
            "de service appartient bien au même projet Firebase que le site.",
          detail: message,
        });
      }
      if (/\b7 PERMISSION_DENIED\b/.test(message)) {
        return json(500, {
          error:
            "Firestore répond PERMISSION_DENIED : activez la « Cloud Firestore API » pour ce projet " +
            "sur https://console.cloud.google.com/apis/library/firestore.googleapis.com puis réessayez.",
          detail: message,
        });
      }
      return json(500, { error: message });
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
