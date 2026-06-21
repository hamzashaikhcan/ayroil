"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminClientFetch } from "@/lib/admin-client";
import { formatPrice } from "@/lib/utils";
import { IconSearch } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/status-pill";

type Hit = {
  orders: {
    id: string;
    number: string;
    customerName: string;
    email: string;
    totalCents: number;
    status: string;
    createdAt: string;
  }[];
  products: {
    id: string;
    slug: string;
    name: string;
    sku: string | null;
    priceCents: number;
    stock: number;
    active: boolean;
  }[];
  customers: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }[];
};

const EMPTY: Hit = { orders: [], products: [], customers: [] };

export function AdminSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cmd/Ctrl + K opens the search and focuses the input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Debounced fetch as the user types. We only call setState inside the
  // timer callback (not directly in the effect body), so React 19's
  // strict effect rules are happy.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      adminClientFetch<Hit>(`/search?q=${encodeURIComponent(term)}`)
        .then((data) => {
          if (cancelled) return;
          setHits(data ?? EMPTY);
          setActiveIdx(0);
        })
        .catch(() => {
          if (!cancelled) setHits(EMPTY);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, open]);

  // Derive a "below threshold" view at render time so the empty state for
  // short queries doesn't require a setState.
  const visibleHits = q.trim().length < 2 ? EMPTY : hits;

  // Flatten all hits so arrow-key navigation works across groups.
  const flat: { href: string; label: string }[] = [
    ...visibleHits.orders.map((o) => ({ href: `/orders/${o.id}`, label: o.number })),
    ...visibleHits.products.map((p) => ({ href: `/products/${p.id}`, label: p.name })),
    ...visibleHits.customers.map((c) => ({ href: `/customers`, label: c.email })),
  ];

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && flat[activeIdx]) {
      e.preventDefault();
      router.push(flat[activeIdx].href);
      setOpen(false);
      setQ("");
    }
  }

  const total = visibleHits.orders.length + visibleHits.products.length + visibleHits.customers.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="hidden h-9 w-56 items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 text-left text-sm text-muted hover:border-line-strong md:inline-flex lg:w-72"
        aria-label="Search"
      >
        <IconSearch className="h-3.5 w-3.5 flex-none" />
        <span className="flex-1 truncate">Search orders, products, customers…</span>
        <span className="hidden items-center gap-0.5 rounded border border-line bg-surface px-1 text-xs font-medium text-muted lg:inline-flex">
          ⌘K
        </span>
      </button>

      {/* Mobile-only icon button */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-surface-2 md:hidden"
        aria-label="Search"
      >
        <IconSearch className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:bg-transparent md:backdrop-blur-none">
          <div className="absolute inset-x-3 top-16 md:static md:inset-auto md:w-96">
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_24px_80px_-24px_rgba(16,24,40,0.25)]">
              <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                <IconSearch className="h-3.5 w-3.5 flex-none text-muted" />
                <input
                  ref={inputRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search by order #, product name, SKU, email, name…"
                  className="h-8 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-line bg-surface-2 px-1 text-xs font-medium text-muted"
                >
                  Esc
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {q.trim().length < 2 ? (
                  <div className="px-4 py-8 text-center text-xs text-muted">
                    Type at least 2 characters to search.
                  </div>
                ) : loading ? (
                  <div className="px-4 py-8 text-center text-xs text-muted">Searching…</div>
                ) : total === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="text-sm font-medium text-ink">No matches</div>
                    <p className="mt-1 text-xs text-muted">
                      Try a different keyword, order number, or email.
                    </p>
                  </div>
                ) : (
                  <>
                    {visibleHits.orders.length > 0 ? (
                      <Group title="Orders">
                        {visibleHits.orders.map((o) => (
                          <ResultLink
                            key={o.id}
                            href={`/orders/${o.id}`}
                            onPick={() => {
                              setOpen(false);
                              setQ("");
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-mono text-xs font-medium text-ink">{o.number}</div>
                                <div className="truncate text-xs text-muted">
                                  {o.customerName} · {o.email}
                                </div>
                              </div>
                              <div className="flex flex-none items-center gap-2">
                                <StatusPill value={o.status} />
                                <span className="font-mono text-xs tabular-nums text-ink">
                                  {formatPrice(o.totalCents)}
                                </span>
                              </div>
                            </div>
                          </ResultLink>
                        ))}
                      </Group>
                    ) : null}

                    {visibleHits.products.length > 0 ? (
                      <Group title="Products">
                        {visibleHits.products.map((p) => (
                          <ResultLink
                            key={p.id}
                            href={`/products/${p.id}`}
                            onPick={() => {
                              setOpen(false);
                              setQ("");
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-ink truncate">{p.name}</div>
                                <div className="text-xs text-muted">
                                  {p.sku ?? "—"} · {p.stock} in stock
                                </div>
                              </div>
                              <div className="flex flex-none items-center gap-2">
                                <StatusPill value={p.active ? "active" : "draft"} />
                                <span className="font-mono text-xs tabular-nums text-ink">
                                  {formatPrice(p.priceCents)}
                                </span>
                              </div>
                            </div>
                          </ResultLink>
                        ))}
                      </Group>
                    ) : null}

                    {visibleHits.customers.length > 0 ? (
                      <Group title="Customers">
                        {visibleHits.customers.map((c) => (
                          <ResultLink
                            key={c.id}
                            href="/customers"
                            onPick={() => {
                              setOpen(false);
                              setQ("");
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-ink truncate">
                                  {c.email}
                                </div>
                                <div className="text-xs text-muted truncate">
                                  {c.name ?? "No name"}
                                </div>
                              </div>
                              <StatusPill value={c.role} />
                            </div>
                          </ResultLink>
                        ))}
                      </Group>
                    ) : null}
                  </>
                )}
              </div>

              {total > 0 ? (
                <div className="flex items-center justify-between border-t border-line bg-surface-2 px-3 py-1.5 text-xs text-muted">
                  <span>
                    {total} match{total === 1 ? "" : "es"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span>
                      <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
                    </span>
                    <span>
                      <Kbd>↵</Kbd> open
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-line bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </div>
      <ul className="divide-y divide-line">{children}</ul>
    </div>
  );
}

function ResultLink({
  href,
  children,
  onPick,
}: {
  href: string;
  children: React.ReactNode;
  onPick: () => void;
}) {
  return (
    <li>
      <Link href={href} onClick={onPick} className="block px-3 py-2.5 hover:bg-surface-2">
        {children}
      </Link>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-line bg-surface px-1 text-xs font-medium text-ink">
      {children}
    </span>
  );
}
