import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <section className="py-12">
      <Container>
        <div className="mb-10">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted"><span className="marker-dot">Signed in as {session.user.email}</span></div>
          <h1 className="font-display mt-3 text-4xl tracking-tight text-ink md:text-5xl">Account</h1>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <aside className="space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "block rounded-md px-3.5 py-2 text-sm text-ink hover:bg-ink/5",
                )}
              >
                {n.label}
              </Link>
            ))}
            <div className="pt-3">
              <SignOutButton />
            </div>
          </aside>
          <div>{children}</div>
        </div>
      </Container>
    </section>
  );
}
