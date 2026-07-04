import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { fetchSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = "Hair Oil FAQs: How to Use, Results, Shipping & Returns";
  const description = `Answers about using ${settings.siteName} hair oil, when to expect results, delivery in ${settings.estStandardDays} days, our ${settings.returnsWindowDays}-day returns, and how to reach us.`;
  return {
    title,
    description,
    alternates: { canonical: "/faq" },
    openGraph: {
      title: `${title} · ${settings.siteName}`,
      description,
      url: "/faq",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${settings.siteName}`,
      description,
    },
  };
}

export default async function FAQPage() {
  const settings = await fetchSettings();
  const faqs = settings.faqs ?? [];

  const ld = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      {ld ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ) : null}
      <section className="py-12 md:py-20">
        <Container>
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">FAQ</span>
            </div>
            <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl md:text-6xl">
              Frequently asked questions
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
              Honest answers to the things customers ask most often. Can&apos;t find what you&apos;re looking for?{" "}
              <a href={`mailto:${settings.supportEmail}`} className="text-ink underline underline-offset-4">
                Email us
              </a>{" "}
              and we&apos;ll reply.
            </p>
          </div>

          <h2 className="font-display mt-12 text-2xl tracking-tight text-ink sr-only">
            Frequently Asked Questions
          </h2>

          {faqs.length === 0 ? (
            <p className="mt-10 max-w-2xl text-base text-muted">
              No FAQs added yet. Check back soon.
            </p>
          ) : (
            <div className="mt-10 divide-y divide-line border-t border-line">
              {faqs.map((f, i) => (
                <article key={i} className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[1fr_2fr] md:gap-6">
                  <h3 className="font-display text-lg leading-snug text-ink">{f.q}</h3>
                  <p className="text-sm leading-relaxed text-muted">{f.a}</p>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
