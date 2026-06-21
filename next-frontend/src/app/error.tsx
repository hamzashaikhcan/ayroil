"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

/**
 * Per-route error boundary. Catches anything thrown during render of a
 * storefront route. `reset()` re-mounts the segment.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side observability hook — wire this to your logger of choice
    // (Sentry, Logtail, etc.) when you have one.
    console.error("[storefront]", error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">500 · Something tripped</span>
          </div>
          <h1 className="font-display mt-4 text-5xl tracking-tight text-ink sm:text-6xl md:text-7xl">
            Something went wrong.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted">
            We hit an unexpected error rendering this page. The team has been notified — meanwhile try again, or head somewhere safe.
          </p>
          {error?.digest ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted">
              Reference: {error.digest}
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={reset} variant="primary" size="lg">
              Try again
            </Button>
            <Button href="/" variant="secondary" size="lg">
              Back to home
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
