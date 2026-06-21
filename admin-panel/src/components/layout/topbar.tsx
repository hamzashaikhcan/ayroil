"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight } from "@/components/ui/icons";
import { AdminSearch } from "./admin-search";

type Crumb = { href?: string; label: string };

function crumbsFor(pathname: string): { title: string; crumbs: Crumb[] } {
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { title: "Overview", crumbs: [{ label: "Overview" }] };
  }

  const head = parts[0];
  const label = head.charAt(0).toUpperCase() + head.slice(1);

  if (parts.length === 1) {
    return { title: label, crumbs: [{ label }] };
  }

  return {
    title: label,
    crumbs: [{ href: `/${head}`, label }, { label: parts[1] === "new" ? "New" : "Detail" }],
  };
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { title, crumbs } = crumbsFor(pathname);

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="md:hidden inline-flex h-9 w-9 flex-none items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-surface-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 ? <IconChevronRight className="h-3 w-3 text-muted-soft" /> : null}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-ink">{c.label}</Link>
                  ) : (
                    <span className="text-ink-soft">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="mt-0 text-base font-semibold leading-tight tracking-tight text-ink sm:mt-0.5 sm:text-lg">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AdminSearch />
        </div>
      </div>
    </div>
  );
}
