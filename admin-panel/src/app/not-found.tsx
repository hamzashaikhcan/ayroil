import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          404 · Not found
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          That page doesn&apos;t exist in the console.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The route you tried to reach has moved, been deprecated, or never existed. Pick a section below to get back to work.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md bg-ink px-4 text-sm font-medium text-background hover:bg-ink-soft"
          >
            Overview
          </Link>
          <Link
            href="/orders"
            className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Orders
          </Link>
          <Link
            href="/products"
            className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Products
          </Link>
        </div>
      </div>
    </div>
  );
}
