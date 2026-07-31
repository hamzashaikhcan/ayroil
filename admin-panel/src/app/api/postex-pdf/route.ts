import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";
import { ROLES } from "@consts";

/**
 * Binary-safe proxy for PostEx PDF endpoints (airway bill / load sheet).
 * The generic /api/relay route reads bodies as text, which corrupts binary
 * PDF bytes — this route stays on arrayBuffer end-to-end instead.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SECRET = process.env.AUTH_SECRET_ADMIN ?? "";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const trackingNumbers = (url.searchParams.get("trackingNumbers") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const pickupAddress = url.searchParams.get("pickupAddress") ?? undefined;
  if (!kind || trackingNumbers.length === 0) {
    return NextResponse.json({ error: "Missing kind or trackingNumbers" }, { status: 400 });
  }

  const token = jwt.sign(
    { sub: session.user.id, email: session.user.email, role: session.user.role },
    SECRET,
    { expiresIn: 60, audience: "admin" },
  );

  let backendRes: Response;
  if (kind === "airway-bill") {
    backendRes = await fetch(`${API_URL}/postex/shipments/airway-bill`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ trackingNumbers }),
    });
  } else if (kind === "load-sheet") {
    backendRes = await fetch(`${API_URL}/postex/load-sheet`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ trackingNumbers, pickupAddress }),
    });
  } else {
    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  }

  if (!backendRes.ok) {
    const text = await backendRes.text().catch(() => "");
    return NextResponse.json({ error: text || "PostEx request failed" }, { status: backendRes.status });
  }

  const buf = await backendRes.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${kind}.pdf"`,
    },
  });
}
