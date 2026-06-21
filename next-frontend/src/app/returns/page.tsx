import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductDescription } from "@/components/product/product-description";
import { fetchSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = settings.returnsPolicyTitle || "Returns";
  const description = "Returns and refunds policy.";
  return {
    title,
    description,
    alternates: { canonical: "/returns" },
    openGraph: {
      title: `${title} · ${settings.siteName}`,
      description,
      url: "/returns",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${settings.siteName}`,
      description,
    },
  };
}

export default async function ReturnsPage() {
  const settings = await fetchSettings();
  const title = settings.returnsPolicyTitle || "Returns & Refunds";
  const body = settings.returnsPolicyBody?.trim();

  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Returns</span>
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
              Our returns policy is still being written. Email{" "}
              <a
                href={`mailto:${settings.supportEmail}`}
                className="text-ink underline underline-offset-4"
              >
                {settings.supportEmail}
              </a>{" "}
              with return questions in the meantime.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
