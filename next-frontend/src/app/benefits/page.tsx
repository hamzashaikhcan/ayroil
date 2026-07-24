import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductDescription } from "@/components/product/product-description";
import { fetchSettings } from "@/lib/settings";
import { ANSWER_PAGES } from "@/content/answer-pages";

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

          <div className="mt-16 border-t border-line pt-8">
            <h2 className="font-display text-2xl tracking-tight text-ink">Go deeper on a specific concern</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Every scalp is a little different. These guides walk through the routine, ingredients, and honest
              expectations for the concern closest to yours:
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ANSWER_PAGES.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`}
                    className="block rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink underline-offset-4 hover:border-line-strong hover:text-accent-deep hover:underline"
                  >
                    {p.question}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
