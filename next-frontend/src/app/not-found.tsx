import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">404 · Lost in the shop</span>
          </div>
          <h1 className="font-display mt-4 text-5xl tracking-tight text-ink sm:text-6xl md:text-7xl">
            We couldn&apos;t find that.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted">
            The page you were looking for has moved, been deprecated, or never existed. No big deal — let&apos;s get you somewhere useful.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/" variant="primary" size="lg">
              Back to home
            </Button>
            <Button href="/shop" variant="secondary" size="lg">
              Browse the shop
            </Button>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-md px-5 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Contact us
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
