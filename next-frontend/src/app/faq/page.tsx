import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { fetchSettings } from "@/lib/settings";
import { ANSWER_PAGES } from "@/content/answer-pages";

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
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              This page collects the questions we hear most from first-time buyers and repeat customers alike,
              grouped loosely by topic below so you can jump to what you need. If your question is specific to a
              particular concern, like a dandruff-prone scalp or a dry scalp, our in-depth guides further down go
              further than a short answer can.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-display text-lg text-ink">Shipping &amp; delivery</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Orders are typically dispatched within a day of being placed, with delivery across Pakistan in{" "}
                {settings.estStandardDays} days. Cash on delivery and online payment are both accepted, and
                you&apos;ll get a tracking link the moment your order ships.{" "}
                <Link href="/shipping" className="text-ink underline underline-offset-4">
                  See our full shipping policy
                </Link>{" "}
                for city-by-city delivery windows and any exceptions.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-display text-lg text-ink">Using Ayroil</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                A small amount, massaged into the scalp two to three times a week, is the whole routine. Most
                people apply it in the evening and wash it out the next morning, though a shorter one to two hour
                soak works just as well. Our{" "}
                <Link href="/how-to-use-ayroil-hair-oil" className="text-ink underline underline-offset-4">
                  step-by-step usage guide
                </Link>{" "}
                covers dosage by hair length and how to fit it into a weekly habit.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-display text-lg text-ink">Ingredients &amp; safety</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Ayroil is built on fifteen purposeful oils, from almond and coconut to onion, black seed, and
                shikakai, with no mineral oil or synthetic fillers, and every ingredient is named on the label. If
                you have sensitive skin, a small patch test before first use is always a good idea. Our{" "}
                <Link href="/ayroil-ingredients" className="text-ink underline underline-offset-4">
                  ingredients guide
                </Link>{" "}
                breaks down what each oil is traditionally known for.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-display text-lg text-ink">Returns &amp; refunds</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Not the right fit? You have {settings.returnsWindowDays} days from delivery to request a return.
                Reach out by email and we&apos;ll walk you through the next steps.{" "}
                <Link href="/returns" className="text-ink underline underline-offset-4">
                  Full details are on our returns policy page
                </Link>
                , including condition requirements and refund timing.
              </p>
            </div>
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted">
            We keep this list intentionally straightforward. Ayroil is a cosmetic hair oil, not a medicine, and
            none of the answers below claim to cure dandruff, regrow hair, or guarantee results overnight. What
            you will find is honest detail on how the product is meant to be used, what it is formulated with, and
            how shipping and returns actually work, so you can decide with real information rather than marketing
            language. If a question about your specific scalp or hair concern is not covered here, our guides
            below go into more depth, and our team is always available by email for anything that is still
            unclear.
          </p>

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

          <div className="mt-16 border-t border-line pt-8">
            <h2 className="font-display text-2xl tracking-tight text-ink">Explore our in-depth guides</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              The answers above are kept short on purpose. If you want the full picture on a specific concern,
              causes, routines, and what to realistically expect, these guides go deeper:
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
        </Container>
      </section>
    </>
  );
}
