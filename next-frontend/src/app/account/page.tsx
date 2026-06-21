import Link from "next/link";
import { auth } from "@/auth";

export default async function AccountOverview() {
  const session = await auth();
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-7">
        <div className="font-display text-2xl text-ink">Welcome back{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.</div>
        <p className="mt-2 text-sm text-muted">Manage your orders, addresses, and profile from here.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { href: "/account/orders", title: "Orders", body: "Track shipments and re-order in one tap." },
          { href: "/account/addresses", title: "Addresses", body: "Save addresses for faster checkout." },
          { href: "/account/wishlist", title: "Wishlist", body: "Save products you are watching." },
          { href: "/account/profile", title: "Profile", body: "Name, phone, and marketing preferences." },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-ink">
            <div className="font-display text-xl text-ink">{t.title}</div>
            <p className="mt-2 text-sm text-muted">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
