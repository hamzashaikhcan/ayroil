import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ANSWER_PAGES, getAnswerPage } from "@/content/answer-pages";
import { fetchSettings } from "@/lib/settings";
import { fetchPrimaryProduct, FALLBACK_PRODUCT } from "@/lib/server-api";

/**
 * Answer-style guide pages at the site root (e.g. /hair-oil-for-dry-scalp).
 * One clear question per page, answered in a format search and AI engines can
 * quote directly. Unknown slugs fall through to the 404 page.
 */

export function generateStaticParams() {
  return ANSWER_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getAnswerPage(slug);
  if (!page) return {};
  const settings = await fetchSettings();
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: `${page.metaTitle} · ${settings.siteName}`,
      description: page.metaDescription,
      url: `/${page.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.metaTitle} · ${settings.siteName}`,
      description: page.metaDescription,
    },
  };
}

export default async function AnswerPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const page = getAnswerPage(slug);
  if (!page) notFound();

  const [settings, product] = await Promise.all([
    fetchSettings(),
    fetchPrimaryProduct().then((p) => p ?? FALLBACK_PRODUCT),
  ]);

  // The page's own question leads the FAQPage entity, so the direct answer is
  // liftable by answer engines alongside the FAQ block.
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: page.question, acceptedAnswer: { "@type": "Answer", text: page.answer } },
      ...page.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ],
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.metaTitle,
    description: page.metaDescription,
    mainEntityOfPage: { "@type": "WebPage", "@id": `/${page.slug}` },
    image: settings.ogImageUrl || undefined,
    author: { "@type": "Organization", name: settings.siteName },
    publisher: {
      "@type": "Organization",
      name: settings.siteName,
      logo: settings.darkLogoUrl
        ? { "@type": "ImageObject", url: settings.darkLogoUrl }
        : undefined,
    },
  };

  // The usage guide has a literal step-by-step list — lift it into HowTo
  // structured data instead of duplicating it as new copy.
  const stepSection = page.sections.find((s) => s.heading.toLowerCase() === "step by step");
  const howToLd = stepSection?.list?.length
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: page.question,
        description: page.answer,
        step: stepSection.list.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text,
        })),
      }
    : null;

  const relatedPages = page.related.map((s) => getAnswerPage(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="py-12 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {howToLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      ) : null}
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Guide</span>
          </div>
          <h1 className="font-display mt-4 text-3xl tracking-tight text-ink sm:text-4xl md:text-5xl">
            {page.question}
          </h1>

          <div className="mt-8 rounded-lg border border-line bg-surface p-5 md:p-6">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Answer</div>
            <p className="mt-2 text-base leading-relaxed text-ink">{page.answer}</p>
          </div>

          <div className="mt-10 space-y-10">
            {page.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-display text-xl tracking-tight text-ink sm:text-2xl">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
                {section.list ? (
                  <ul className="mt-3 space-y-2">
                    {section.list.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted">
                        <span className="mt-2 h-1 w-1 flex-none rounded-full bg-accent-deep" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.table ? (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-line">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-line bg-surface">
                          {section.table.headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-muted">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {section.table.rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className={j === 0 ? "px-4 py-3 font-medium text-ink" : "px-4 py-3 text-muted"}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="font-display text-xl tracking-tight text-ink sm:text-2xl">Frequently Asked Questions</h2>
            <div className="mt-4 space-y-6">
              {page.faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="text-sm font-semibold text-ink">{f.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {relatedPages.length ? (
            <div className="mt-12 border-t border-line pt-8">
              <h2 className="font-display text-xl tracking-tight text-ink sm:text-2xl">Related guides</h2>
              <ul className="mt-4 space-y-2">
                {relatedPages.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/${r.slug}`}
                      className="text-sm font-medium text-ink underline underline-offset-4 hover:text-accent-deep"
                    >
                      {r.question}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-6 text-sm">
            <Link
              href={`/shop/${product.slug}`}
              className="font-medium text-ink underline underline-offset-4 hover:text-accent-deep"
            >
              Shop {product.name}
            </Link>
            <Link href="/benefits" className="text-muted hover:text-ink">
              All benefits
            </Link>
            <Link href="/faq" className="text-muted hover:text-ink">
              FAQ
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
