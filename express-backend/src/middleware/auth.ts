import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ROLES, type Role } from "@consts";
import { ENV } from "../config/env.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: { sub: string; email: string; role: Role; aud: "storefront" | "admin" };
  }
}

/**
 * Pull a JWT off the request. We accept Bearer first (used by the same-origin
 * /api/relay endpoints in both frontends) and fall back to legacy session
 * cookies for direct hits in dev.
 */
function pickToken(req: Request): string | null {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie =
    req.cookies?.["__Secure-authjs-storefront.session-token"] ??
    req.cookies?.["authjs-storefront.session-token"] ??
    req.cookies?.["__Secure-authjs-admin.session-token"] ??
    req.cookies?.["authjs-admin.session-token"] ??
    null;
  return cookie ?? null;
}

type DecodedClaims = {
  sub?: string;
  email?: string;
  role?: Role;
  aud?: string;
};

/**
 * Verify the token against EITHER secret. Whichever one validates determines
 * the token's audience — storefront tokens cannot impersonate admin tokens
 * (different signing key + we check the aud claim), and vice versa.
 */
function verifyEither(token: string): DecodedClaims | null {
  try {
    const decoded = jwt.verify(token, ENV.auth.storefrontSecret, {
      audience: ENV.auth.storefrontAudience,
    }) as DecodedClaims;
    return { ...decoded, aud: ENV.auth.storefrontAudience };
  } catch {
    // fall through
  }
  try {
    const decoded = jwt.verify(token, ENV.auth.adminSecret, {
      audience: ENV.auth.adminAudience,
    }) as DecodedClaims;
    return { ...decoded, aud: ENV.auth.adminAudience };
  } catch {
    return null;
  }
}

export function attachAuth(req: Request, _res: Response, next: NextFunction) {
  const token = pickToken(req);
  if (!token) return next();
  const decoded = verifyEither(token);
  if (decoded?.sub && decoded.email) {
    req.auth = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role ?? ROLES.USER,
      aud: (decoded.aud as "storefront" | "admin") ?? "storefront",
    };
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  next();
}

/**
 * Admin routes require BOTH: the token's role must be admin AND the token
 * must have been signed with the admin secret (aud=admin). A storefront
 * session for an admin user — even though they're an admin in the DB —
 * cannot perform admin actions; they have to sign in to the admin console.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  if (req.auth.role !== ROLES.ADMIN || req.auth.aud !== ENV.auth.adminAudience) {
    return res.status(403).json({ error: "Admin console session required" });
  }
  next();
}
