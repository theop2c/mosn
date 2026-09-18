import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload d'une image de post vers Firebase Storage (posts/{uid}/…).
 * Ne fonctionne que si l'hébergement d'images est activé dans
 * /admin/settings ET que Storage est activé côté Firebase (plan Blaze).
 */
export async function uploadPostImage(uid: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]/g, "_").slice(-60);
  const path = `posts/${uid}/${Date.now()}-${safeName}`;
  const snapshot = await uploadBytes(ref(storage, path), file, {
    contentType: file.type,
  });
  return getDownloadURL(snapshot.ref);
}
