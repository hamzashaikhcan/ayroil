import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductDescription } from "@/components/product/product-description";
import { fetchSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = "Hair Oil Benefits: Scalp Care, Stronger Roots & Shine";
  const description = `How ${settings.siteName}'s doctor-guided, scalp-first natural hair oil helps nourish dry, dandruff-prone scalp, support stronger roots, and revive natural shine.`;
  return {
    title,
    description,
    alternates: { canonical: "/benefits" },
    openGraph: {
      title: `${title} · ${settings.siteName}`,
      description,
      url: "/benefits",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${settings.siteName}`,
      description,
    },
  };
}

export default async function BenefitsPage() {
  const settings = await fetchSettings();
  const title = settings.benefitsTitle || "Benefits";
  const body = settings.benefitsBody?.trim();

  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Benefits</span>
          </div>
          <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {body ? (
            <ProductDescription html={body} className="mt-6" />
          ) : (
            <p className="mt-6 text-base leading-relaxed text-muted">
              {settings.longDescription}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
