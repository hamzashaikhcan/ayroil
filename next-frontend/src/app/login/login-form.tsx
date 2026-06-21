"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-7">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Email</label>
          <input id="email" name="email" type="email" required className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 text-sm focus:border-ink focus:outline-none" />
        </div>
        <div>
          <label htmlFor="password" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Password</label>
          <PasswordInput id="password" name="password" required minLength={8} autoComplete="current-password" className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 pr-11 text-sm focus:border-ink focus:outline-none" />
        </div>
      </div>
      {error ? <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}
      <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="mt-4 text-xs text-muted">
        New here? <Link href="/register" className="text-ink underline underline-offset-4">Create an account</Link>
      </p>
    </form>
  );
}
