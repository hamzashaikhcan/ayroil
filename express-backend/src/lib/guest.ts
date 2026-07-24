import { createHash } from "node:crypto";
import type { Request } from "express";

export function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length) return fwd[0];
  return req.socket.remoteAddress ?? "0.0.0.0";
}

/**
 * Stable guest key derived from IP + browser fingerprint headers.
 * Used to identify anonymous carts without a session cookie.
 */
export function guestKeyFromRequest(req: Request): string {
  const ip = getClientIp(req);
  const ua = req.header("user-agent") ?? "";
  const lang = req.header("accept-language") ?? "";
  const enc = req.header("accept-encoding") ?? "";
  return createHash("sha256")
    .update(`${ip}::${ua}::${lang}::${enc}`)
    .digest("hex")
    .slice(0, 40);
}
