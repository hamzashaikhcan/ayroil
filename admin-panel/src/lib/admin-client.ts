/**
 * Client-side helper for admin pages. Calls the admin's own /api/relay
 * endpoint, which mints a short-lived JWT from the user's Auth.js session
 * and forwards the request to the Express backend.
 */

export async function adminClientFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api/relay?path=${encodeURIComponent(path)}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
