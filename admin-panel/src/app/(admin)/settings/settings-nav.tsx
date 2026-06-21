"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; hint: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Store",
    items: [
      { href: "/settings/general", label: "General", hint: "Name, logos, contact" },
      { href: "/settings/commerce", label: "Commerce", hint: "Currency, shipping, returns" },
      { href: "/settings/appearance", label: "Appearance", hint: "Brand palette" },
      { href: "/settings/email", label: "Email", hint: "Resend API key, sender" },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/settings/profile", label: "Your profile", hint: "Email, name, password" }],
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <aside>
      {/* Horizontal scroller on mobile, grouped vertical list on desktop */}
      <nav className="-mx-1 flex overflow-x-auto pb-1 md:mx-0 md:block md:overflow-visible md:pb-0">
        {GROUPS.map((group, gi) => (
          <div key={group.title} className={cn("flex md:block", gi > 0 && "md:mt-4")}>
            <div className="hidden px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft md:block">
              {group.title}
            </div>
            <div className="flex md:block">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block flex-none rounded-md px-3 py-2 text-sm transition-colors mx-0.5 md:mx-0",
                      active
                        ? "bg-ink/[0.05] text-ink"
                        : "text-ink-soft hover:bg-ink/[0.03] hover:text-ink",
                    )}
                  >
                    <div className="font-medium">{item.label}</div>
                    <div className="hidden text-xs text-muted md:block">{item.hint}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
