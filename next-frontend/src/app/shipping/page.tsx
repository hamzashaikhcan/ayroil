import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductDescription } from "@/components/product/product-description";
import { fetchSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = settings.shippingPolicyTitle || "Shipping";
  const description = "Shipping policy and delivery times.";
  return {
    title,
    description,
    alternates: { canonical: "/shipping" },
    openGraph: {
      title: `${title} · ${settings.siteName}`,
      description,
      url: "/shipping",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${settings.siteName}`,
      description,
    },
  };
}

export default async function ShippingPage() {
  const settings = await fetchSettings();
  const title = settings.shippingPolicyTitle || "Shipping Policy";
  const body = settings.shippingPolicyBody?.trim();

  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Shipping</span>
          </div>
          <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <div className="mt-3 text-xs text-muted">
            Last updated{" "}
            {new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          {body ? (
            <ProductDescription html={body} className="mt-8" />
          ) : (
            <p className="mt-8 text-base leading-relaxed text-muted">
              Our shipping policy is still being written. Email{" "}
              <a
                href={`mailto:${settings.supportEmail}`}
                className="text-ink underline underline-offset-4"
              >
                {settings.supportEmail}
              </a>{" "}
              with shipping questions in the meantime.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
