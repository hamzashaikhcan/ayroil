import geoip from "geoip-lite";
import type { Request } from "express";
import { getClientIp } from "./guest.js";

export type CartLocation = {
  city: string | null;
  region: string | null;
  country: string | null;
};

/**
 * Best-effort city/region/country from the request's IP, via the bundled
 * GeoLite2-lite dataset (geoip-lite) — no outbound API call, no rate limits,
 * no key to manage. Looked up once when a cart is first created, not on
 * every request. Returns all-null for private/loopback IPs (local dev) or
 * when the IP isn't in the dataset — never throws.
 */
export function lookupCartLocation(req: Request): CartLocation {
  const ip = getClientIp(req);
  try {
    const hit = geoip.lookup(ip);
    if (!hit) return { city: null, region: null, country: null };
    return {
      city: hit.city || null,
      // geoip-lite gives region as a subdivision code (e.g. "PB"), not the
      // full name — good enough to disambiguate, not meant to be polished.
      region: hit.region || null,
      country: hit.country || null,
    };
  } catch {
    return { city: null, region: null, country: null };
  }
}
