import { SITE } from "@consts";
import { API_URL } from "./api";

type PublicBranding = {
  siteName: string;
  iconUrl: string;
  whiteLogoUrl: string;
  darkLogoUrl: string;
  companyName: string;
};

/**
 * Unauthenticated fetch of the public branding fields. Used by the admin
 * root layout (which renders the login screen) and the login page itself —
 * neither has an authenticated session yet, so we can't use adminServerFetch.
 *
 * The backend's GET /settings is public; we just pluck the brand-identity
 * fields and fall back to the static SITE seed if the backend is unreachable.
 */
export async function fetchPublicBranding(): Promise<PublicBranding> {
  try {
    const res = await fetch(`${API_URL}/settings`, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    const body = (await res.json()) as Partial<PublicBranding> | null;
    return {
      siteName: body?.siteName?.trim() || SITE.siteName,
      iconUrl: body?.iconUrl || SITE.iconUrl,
      whiteLogoUrl: body?.whiteLogoUrl || SITE.whiteLogoUrl,
      darkLogoUrl: body?.darkLogoUrl || SITE.darkLogoUrl,
      companyName: body?.companyName?.trim() || SITE.legal.companyName,
    };
  } catch {
    return {
      siteName: SITE.siteName,
      iconUrl: SITE.iconUrl,
      whiteLogoUrl: SITE.whiteLogoUrl,
      darkLogoUrl: SITE.darkLogoUrl,
      companyName: SITE.legal.companyName,
    };
  }
}
