/**
 * Injects a Cloudinary transformation string right after `/upload/` in a
 * Cloudinary delivery URL. No-ops for non-Cloudinary URLs (e.g. a logo the
 * admin hosted elsewhere) so this is always safe to call.
 */
export function cloudinaryTransform(url: string, transform: string): string {
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1 || !url.includes("res.cloudinary.com")) return url;
  const insertAt = i + marker.length;
  return `${url.slice(0, insertAt)}${transform}/${url.slice(insertAt)}`;
}
