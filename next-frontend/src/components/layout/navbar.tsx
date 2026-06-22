"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Wordmark } from "./wordmark";
import { useCart } from "@/stores/cart-store";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { cn } from "@/lib/utils";
import { AUTH_UI_ENABLED } from "@/lib/auth-ui";

const PRIMARY = [
  { href: "/shop", label: "Shop" },
  { href: "/benefits", label: "Benefits" },
  { href: "/faq", label: "FAQ" },
];

const noopSubscribe = () => () => {};

export function Navbar() {
  const pathname = usePathname();
  const totalUnitsRaw = useCart((s) => s.cart?.totalUnits ?? 0);
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<{ path: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const totalUnits = mounted ? totalUnitsRaw : 0;
  const menuIsOpen = openMenu?.path === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (!menuIsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuIsOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
        <nav
          className={cn(
            "flex w-full max-w-5xl items-center justify-between gap-2 rounded-full border px-2 py-1.5 transition-all duration-300 sm:gap-4 sm:px-3 sm:py-2",
            scrolled
              ? "border-line-strong bg-surface/95 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]"
              : "border-line bg-surface/80 backdrop-blur",
          )}
        >
          <div className="flex min-w-0 items-center pl-1 sm:pl-2">
            <Wordmark />
          </div>

          <div className="hidden md:flex items-center gap-1">
            {PRIMARY.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm transition-colors",
                    active ? "bg-ink text-background" : "text-ink hover:bg-ink/5",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1 pr-0.5 sm:pr-1">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink hover:bg-ink/5 sm:h-10 sm:w-10"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" fill="none" />
                <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>

            {AUTH_UI_ENABLED ? (
              status === "authenticated" && session ? (
                <Link
                  href="/account"
                  className="hidden sm:inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-2 text-sm text-ink hover:bg-ink/5"
                >
                  {session.user.name?.split(" ")[0] ?? "Account"}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-sm text-ink hover:bg-ink/5"
                >
                  Sign in
                </Link>
              )
            ) : null}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Cart, ${totalUnits} item${totalUnits === 1 ? "" : "s"}`}
              className="relative inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-deep sm:gap-2 sm:px-4"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="sm:hidden">
                <path d="M2 3h1.5l1 6.3a1 1 0 001 .85h5a1 1 0 001-.8L12.5 5H4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="5.5" cy="12" r="0.75" fill="currentColor" />
                <circle cx="10" cy="12" r="0.75" fill="currentColor" />
              </svg>
              <span className="hidden sm:inline" aria-hidden>Cart</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs font-mono text-background" aria-hidden>
                {totalUnits}
              </span>
            </button>

            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuIsOpen}
              onClick={() => setOpenMenu(menuIsOpen ? null : { path: pathname })}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                {menuIsOpen ? (
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                ) : (
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {searchOpen ? (
          <div className="absolute left-3 right-3 top-15 z-40 sm:left-1/2 sm:right-auto sm:top-17 sm:w-[min(640px,calc(100vw-2rem))] sm:-translate-x-1/2">
            <form
              action="/shop"
              className="flex items-center gap-2 rounded-2xl border border-line-strong bg-surface p-2 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.25)]"
            >
              <input
                name="q"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search the catalog…"
                autoFocus
                className="h-10 w-full rounded-md bg-transparent px-3 text-sm text-ink placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md bg-ink px-4 text-sm font-medium text-background"
              >
                Search
              </button>
            </form>
          </div>
        ) : null}
      </header>

      {/* Mobile menu sheet */}
      {menuIsOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm md:hidden"
            onClick={() => setOpenMenu(null)}
            aria-hidden
          />
          <div className="fixed inset-x-3 top-15 z-40 md:hidden">
            <div className="rounded-2xl border border-line-strong bg-surface p-3 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.3)]">
              {PRIMARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-3 text-sm font-medium text-ink hover:bg-ink/5"
                >
                  {item.label}
                </Link>
              ))}
              {AUTH_UI_ENABLED ? (
                <>
                  <div className="my-2 h-px bg-line" />
                  <Link
                    href={session ? "/account" : "/login"}
                    className="block rounded-md px-3 py-3 text-sm font-medium text-ink hover:bg-ink/5"
                  >
                    {session ? "Account" : "Sign in"}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
