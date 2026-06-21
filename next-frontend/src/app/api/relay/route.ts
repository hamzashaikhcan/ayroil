import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SECRET = process.env.AUTH_SECRET_STOREFRONT ?? "";
const AUDIENCE = "storefront";

/**
 * Same-origin relay for authenticated browser → backend calls from the
 * storefront. Mints a short-lived plain JWT signed with the storefront
 * secret and the storefront audience so the backend treats this token
 * as a storefront-scope session.
 */
async function handle(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session) {
    const token = jwt.sign(
      { sub: session.user.id, email: session.user.email, role: session.user.role },
      SECRET,
      { expiresIn: 60, audience: AUDIENCE },
    );
    headers.Authorization = `Bearer ${token}`;
  }
  const fwd = req.headers.get("cookie");
  if (fwd) headers.Cookie = fwd;
  const ua = req.headers.get("user-agent");
  if (ua) headers["User-Agent"] = ua;
  const lang = req.headers.get("accept-language");
  if (lang) headers["Accept-Language"] = lang;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) headers["X-Forwarded-For"] = xff;

  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await req.text();
  const res = await fetch(`${API_URL}${path}`, { method: req.method, headers, body });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
