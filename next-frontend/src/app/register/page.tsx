import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted"><span className="marker-dot">Account</span></div>
            <h1 className="font-display mt-3 text-4xl tracking-tight text-ink md:text-5xl">Create an account.</h1>
            <p className="mt-3 text-sm text-muted">Faster checkouts. Saved addresses. Order history.</p>
          </div>
          <RegisterForm />
        </div>
      </Container>
    </section>
  );
}
