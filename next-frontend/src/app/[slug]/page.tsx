import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ANSWER_PAGES, getAnswerPage } from "@/content/answer-pages";
import { fetchSettings } from "@/lib/settings";

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

  return (
    <section className="py-12 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
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

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-6 text-sm">
            <Link href="/shop" className="font-medium text-ink underline underline-offset-4 hover:text-accent-deep">
              Shop Ayroil
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
