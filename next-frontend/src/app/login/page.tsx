import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted"><span className="marker-dot">Account</span></div>
            <h1 className="font-display mt-3 text-4xl tracking-tight text-ink md:text-5xl">Sign in.</h1>
            <p className="mt-3 text-sm text-muted">Track orders, save addresses, manage your wishlist.</p>
          </div>
          <LoginForm />
        </div>
      </Container>
    </section>
  );
}
