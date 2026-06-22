import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { AUTH_UI_ENABLED } from "@/lib/auth-ui";

export async function generateMetadata(props: PageProps<"/orders/[number]">): Promise<Metadata> {
  const { number } = await props.params;
  return {
    title: "Order confirmed",
    alternates: { canonical: `/orders/${number}` },
    robots: { index: false, follow: false },
  };
}

export default async function OrderConfirmedPage(props: PageProps<"/orders/[number]">) {
  const { number } = await props.params;
  return (
    <section className="py-20">
      <Container>
        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-10">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted"><span className="marker-dot">Order confirmed</span></div>
          <h1 className="font-display mt-4 text-4xl tracking-tight text-ink">Order {number}</h1>
          <p className="mt-4 text-sm text-muted">
            We have your order. You will receive a confirmation email shortly.
            {AUTH_UI_ENABLED ? " If you signed in, you can also track it from your account." : null}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/" variant="primary">Back to home</Button>
            {AUTH_UI_ENABLED ? (
              <Link href="/account/orders" className="inline-flex h-11 items-center rounded-md border border-line-strong px-5 text-sm font-medium text-ink hover:bg-ink/5">
                View my orders
              </Link>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
