"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-bad">
          Error · Something tripped
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          We hit an unexpected error.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The console caught the error before anything broke. Try again, or jump back to the overview while we look into it.
        </p>
        {error?.digest ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted">
            Reference: {error.digest}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center rounded-md bg-ink px-4 text-sm font-medium text-background hover:bg-ink-soft"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
