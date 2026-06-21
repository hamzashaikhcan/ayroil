import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { fetchSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  return {
    title: "Contact",
    description: `Get in touch with ${settings.siteName}. We reply to every email.`,
    alternates: { canonical: "/contact" },
    openGraph: {
      title: `Contact · ${settings.siteName}`,
      description: `Get in touch with ${settings.siteName}.`,
      url: "/contact",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Contact · ${settings.siteName}`,
      description: `Get in touch with ${settings.siteName}.`,
    },
  };
}

export default async function ContactPage() {
  const settings = await fetchSettings();

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    url: "/",
    email: settings.supportEmail || undefined,
    telephone: settings.phone || undefined,
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address }
      : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <section className="py-12 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">Contact</span>
            </div>
            <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl md:text-6xl">
              Get in touch.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted">
              We read and reply to every email. Most messages get an answer within
              one business day.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {settings.supportEmail ? (
                <ContactCard
                  label="Email"
                  value={settings.supportEmail}
                  href={`mailto:${settings.supportEmail}`}
                />
              ) : null}
              {settings.phone ? (
                <ContactCard
                  label="Phone"
                  value={settings.phone}
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                />
              ) : null}
              {settings.address ? (
                <ContactCard label="Address" value={settings.address} />
              ) : null}
              {settings.salesEmail && settings.salesEmail !== settings.supportEmail ? (
                <ContactCard
                  label="Press / Sales"
                  value={settings.salesEmail}
                  href={`mailto:${settings.salesEmail}`}
                />
              ) : null}
            </div>

            <div className="mt-12 border-t border-line pt-8">
              <h2 className="font-display text-2xl tracking-tight text-ink">
                Frequently asked
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Before you write to us, check the{" "}
                <a href="/faq" className="text-ink underline underline-offset-4">
                  FAQ
                </a>{" "}
                — the answer is often there. For shipping and returns, see our{" "}
                <a href="/shipping" className="text-ink underline underline-offset-4">
                  shipping policy
                </a>{" "}
                and{" "}
                <a href="/returns" className="text-ink underline underline-offset-4">
                  returns policy
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function ContactCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-lg leading-snug text-ink break-words">
        {value}
      </div>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
      >
        {inner}
      </a>
    );
  }
  return <div className="rounded-2xl border border-line bg-surface p-5">{inner}</div>;
}
