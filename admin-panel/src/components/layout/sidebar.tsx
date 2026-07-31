"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { SidebarCounts } from "@/lib/server-api";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  IconHome,
  IconOrders,
  IconProducts,
  IconCustomers,
  IconAnalytics,
  IconStar,
  IconSettings,
  IconStore,
  IconLogout,
  IconExternal,
  IconCart,
  IconHero,
  IconDoc,
  IconHelp,
  IconChat,
  IconScale,
  IconPackage,
} from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactNode;
};

const NAV: NavItem[] = [
  { href: "/", label: "Overview", Icon: IconHome },
  { href: "/orders", label: "Orders", Icon: IconOrders },
  { href: "/postex", label: "PostEx", Icon: IconPackage },
  { href: "/carts", label: "Active carts", Icon: IconCart },
  { href: "/products", label: "Products", Icon: IconProducts },
  { href: "/reviews", label: "Reviews", Icon: IconStar },
  { href: "/customers", label: "Customers", Icon: IconCustomers },
  { href: "/analytics", label: "Analytics", Icon: IconAnalytics },
];

const CONTENT: NavItem[] = [
  { href: "/settings/hero", label: "Hero", Icon: IconHero },
  { href: "/settings/benefits", label: "Benefits page", Icon: IconDoc },
  { href: "/settings/faqs", label: "FAQs", Icon: IconHelp },
  { href: "/settings/social-proof", label: "Social proof", Icon: IconChat },
  { href: "/settings/legal", label: "Legal & policies", Icon: IconScale },
];

const SECONDARY: NavItem[] = [
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

export function Sidebar({
  email,
  siteName,
  storefrontUrl,
  logoUrl,
  counts,
  open,
  onClose,
}: {
  email: string;
  siteName: string;
  storefrontUrl: string;
  logoUrl?: string;
  counts?: SidebarCounts | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const confirm = useConfirm();

  // Maps a nav href to its badge count. Orders shows only NEW (pending)
  // orders; the rest are simple totals. Undefined → no badge.
  const countByHref: Record<string, number | undefined> = {
    "/orders": counts?.newOrders,
    "/carts": counts?.activeCarts,
    "/products": counts?.products,
    "/reviews": counts?.reviews,
  };

  async function onSignOut() {
    const ok = await confirm({
      title: "Sign out of the admin console?",
      description:
        "You'll be returned to the sign-in screen. Any unsaved edits on the current page will be lost.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
    });
    if (ok) await signOut({ callbackUrl: "/login" });
  }

  // Close drawer on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const inner = (
    <>
      <div className="border-b border-line p-3">
        <div className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-2 p-2 text-left">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- need natural width for a logo
            <img
              src={logoUrl}
              alt={siteName}
              className="h-8 w-auto flex-none object-contain"
              draggable={false}
            />
          ) : (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-ink to-ink-soft text-background">
              <span className="text-xs font-semibold tracking-tight">
                {siteName.charAt(0)}
              </span>
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-tight text-ink">
              {siteName}
            </span>
            <span className="block truncate text-xs leading-tight text-muted">
              Admin workspace
            </span>
          </span>
        </div>

        <a
          href={storefrontUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted hover:bg-background hover:text-ink"
        >
          <IconStore className="h-3.5 w-3.5" />
          View storefront
          <IconExternal className="ml-auto h-3 w-3" />
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="px-2 pb-1.5 pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft">
          Manage
        </div>
        <ul className="space-y-0.5">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            const count = countByHref[n.href];
            const hasCount = typeof count === "number" && count > 0;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium md:py-1.5",
                    active
                      ? "bg-ink/[0.04] text-ink"
                      : "text-ink-soft hover:bg-ink/[0.03] hover:text-ink",
                  )}
                >
                  <n.Icon
                    className={cn(
                      "h-4 w-4 flex-none",
                      active ? "text-ink" : "text-muted group-hover:text-ink",
                    )}
                  />
                  <span className="truncate">{n.label}</span>
                  {hasCount ? (
                    <span
                      className="ml-auto inline-flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-ink/[0.07] px-1.5 text-xs font-semibold tabular-nums text-ink-soft"
                      title={n.href === "/orders" ? `${count} new ${count === 1 ? "order" : "orders"}` : undefined}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : active ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mx-2 my-3 h-px bg-line" />

        <div className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft">
          Content
        </div>
        <ul className="space-y-0.5">
          {CONTENT.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium md:py-1.5",
                    active
                      ? "bg-ink/[0.04] text-ink"
                      : "text-ink-soft hover:bg-ink/[0.03] hover:text-ink",
                  )}
                >
                  <n.Icon
                    className={cn(
                      "h-4 w-4 flex-none",
                      active ? "text-ink" : "text-muted group-hover:text-ink",
                    )}
                  />
                  <span className="truncate">{n.label}</span>
                  {active ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mx-2 my-3 h-px bg-line" />

        <div className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft">
          Account
        </div>
        <ul className="space-y-0.5">
          {SECONDARY.map((n) => {
            // Settings is active on /settings root and its non-content sub-pages.
            const active =
              pathname === n.href ||
              pathname === `${n.href}/general` ||
              pathname === `${n.href}/commerce` ||
              pathname === `${n.href}/appearance` ||
              pathname === `${n.href}/profile`;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium md:py-1.5",
                    active
                      ? "bg-ink/[0.04] text-ink"
                      : "text-ink-soft hover:bg-ink/[0.03] hover:text-ink",
                  )}
                >
                  <n.Icon
                    className={cn(
                      "h-4 w-4 flex-none",
                      active ? "text-ink" : "text-muted group-hover:text-ink",
                    )}
                  />
                  <span className="truncate">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 p-2">
          <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-accent-deep">
            {email.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium leading-tight text-ink">
              {email}
            </div>
            <div className="text-xs leading-tight text-muted">Administrator</div>
          </div>
          <button
            onClick={onSignOut}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-background hover:text-ink"
            aria-label="Sign out"
            title="Sign out"
          >
            <IconLogout className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col self-start border-r border-line bg-surface md:flex">
        {inner}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={onClose}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-[0_24px_80px_-24px_rgba(0,0,0,0.3)] transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
        >
          {inner}
        </aside>
      </div>
    </>
  );
}
