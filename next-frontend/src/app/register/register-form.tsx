"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { relayUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { trackCompleteRegistration } from "@/lib/analytics";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "");

    try {
      const res = await fetch(relayUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Registration failed");
      }
      const signed = await signIn("credentials", { email, password, redirect: false });
      if (signed?.error) throw new Error("Could not sign in after register");
      trackCompleteRegistration();
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-7">
      <div className="space-y-4">
        <Field name="name" label="Name" />
        <Field name="email" label="Email" type="email" required />
        <div>
          <label htmlFor="password" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Password</label>
          <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 pr-11 text-sm focus:border-ink focus:outline-none" />
        </div>
      </div>
      {error ? <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}
      <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
      <p className="mt-4 text-xs text-muted">
        Already have an account? <Link href="/login" className="text-ink underline underline-offset-4">Sign in</Link>
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  minLength,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 text-sm focus:border-ink focus:outline-none"
      />
    </div>
  );
}
