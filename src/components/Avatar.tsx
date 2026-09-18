/** Teinte stable (0-359) dérivée de l'uid — partagée avatar/couverture. */
export function uidHue(uid: string): number {
  let hash = 0;
  for (const char of uid) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % 360;
}

/**
 * Avatar en initiale, couleur stable dérivée de l'uid (pas d'upload
 * nécessaire — reste gratuit).
 */
export function Avatar({
  name,
  uid,
  size = 38,
}: {
  name: string;
  uid: string;
  size?: number;
}) {
  const hue = uidHue(uid);

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${hue} 65% 52%), hsl(${(hue + 40) % 360} 65% 42%))`,
      }}
      aria-hidden
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
