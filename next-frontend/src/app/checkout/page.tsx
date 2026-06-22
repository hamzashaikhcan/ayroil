import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CheckoutClient } from "./checkout-client";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";
import { API_URL } from "@/lib/api";
import { AUTH_UI_ENABLED } from "@/lib/auth-ui";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

async function fetchAddresses(): Promise<Address[]> {
  const session = await auth();
  if (!session) return [];
  try {
    const secret = process.env.AUTH_SECRET_STOREFRONT ?? "";
    const token = jwt.sign(
      { sub: session.user.id, email: session.user.email, role: session.user.role },
      secret,
      { expiresIn: 60, audience: "storefront" },
    );
    const res = await fetch(`${API_URL}/addresses`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as Address[];
  } catch {
    return [];
  }
}

export default async function CheckoutPage() {
  const session = await auth();
  const addresses = await fetchAddresses();

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="mb-10">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted"><span className="marker-dot">Checkout</span></div>
          <h1 className="font-display mt-3 text-4xl tracking-tight text-ink md:text-5xl">
            {session ? "Confirm and pay" : "Checkout as guest"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            {session
              ? "Signed in as " + session.user.email + ". You can also create an account during checkout."
              : AUTH_UI_ENABLED
                ? "No account needed. We will email your order confirmation. Want to save your details for next time? "
                : "No account needed. We will email your order confirmation."}
            {!session && AUTH_UI_ENABLED ? (
              <a href="/login" className="text-ink underline underline-offset-4">Sign in</a>
            ) : null}
          </p>
        </div>

        <CheckoutClient
          session={session ? { email: session.user.email ?? "", name: session.user.name ?? "" } : null}
          addresses={addresses}
        />
      </Container>
    </section>
  );
}
