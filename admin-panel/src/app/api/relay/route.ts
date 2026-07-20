import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";
import { ROLES } from "@consts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SECRET = process.env.AUTH_SECRET_ADMIN ?? "";
const AUDIENCE = "admin";

async function handle(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const token = jwt.sign(
    { sub: session.user.id, email: session.user.email, role: session.user.role },
    SECRET,
    { expiresIn: 60, audience: AUDIENCE },
  );

  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await req.text();

  const res = await fetch(`${API_URL}${path}`, {
    method: req.method,
    body,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new NextResponse(null, { status: res.status });
  }
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
