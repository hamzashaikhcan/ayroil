import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { fetchSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = "Contact Us: Order Help, Returns & Product Questions";
  const description = `Reach the ${settings.siteName} team by email or WhatsApp for order help, delivery updates, ${settings.returnsWindowDays}-day returns, and hair oil questions. We reply to every message.`;
  return {
    title,
    description,
    alternates: { canonical: "/contact" },
    openGraph: {
      title: `${title} · ${settings.siteName}`,
      description,
      url: "/contact",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${settings.siteName}`,
      description,
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
                  href={whatsappUrl(settings.phone, "Hi, I have a question about Ayroil products.")}
                  external
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
                <Link href="/faq" className="text-ink underline underline-offset-4">
                  FAQ
                </Link>{" "}
                — the answer is often there. For shipping and returns, see our{" "}
                <Link href="/shipping" className="text-ink underline underline-offset-4">
                  shipping policy
                </Link>{" "}
                and{" "}
                <Link href="/returns" className="text-ink underline underline-offset-4">
                  returns policy
                </Link>
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
  external,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
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
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
      >
        {inner}
      </a>
    );
  }
  return <div className="rounded-2xl border border-line bg-surface p-5">{inner}</div>;
}

/** Same wa.me pattern used by the floating WhatsApp button and order pages — opens a chat with a pre-filled message instead of dialing. */
function whatsappUrl(phone: string, message: string): string {
  const number = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
