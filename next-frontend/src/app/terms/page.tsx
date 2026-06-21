import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductDescription } from "@/components/product/product-description";
import { fetchSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = settings.termsTitle || "Terms";
  const description = "Terms of service";
  return {
    title,
    description,
    alternates: { canonical: "/terms" },
    openGraph: {
      title: `${title} · ${settings.siteName}`,
      description,
      url: "/terms",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${settings.siteName}`,
      description,
    },
  };
}

export default async function TermsPage() {
  const settings = await fetchSettings();
  const title = settings.termsTitle || "Terms of Service";
  const body = settings.termsBody?.trim();

  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Legal</span>
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
              No terms have been added yet. Check back soon.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
