import { headers } from "next/headers";
import { fetchAllProducts } from "@/lib/server-api";
import { fetchSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Convert stored page HTML into readable plain text, preserving line structure. */
function htmlToText(html: string): string {
  return html
    .replace(/<\/(h1|h2|h3|h4|p|li|ol|ul)>/gi, "\n")
    .replace(/<(li)[^>]*>/gi, "- ")
    .replace(/<(h2|h3)[^>]*>/gi, "\n## ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * llms-full.txt: the storefront's full readable content in one document, so
 * AI assistants can answer customer questions from the source instead of
 * guessing. Everything is pulled live from settings and the catalog.
 */
export async function GET() {
  const [h, settings, products] = await Promise.all([headers(), fetchSettings(), fetchAllProducts()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? settings.domain;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const price = (cents: number) =>
    `${settings.currencySymbol} ${Math.round(cents / 100).toLocaleString("en-US")} ${settings.currencyCode}`;

  const sections: string[] = [
    `# ${settings.siteName}: full site content`,
    "",
    `> ${settings.shortDescription}`,
    "",
    "## About the brand",
    "",
    htmlToText(settings.longDescription || ""),
  ];

  for (const p of products) {
    sections.push(
      "",
      `## Product: ${p.name}`,
      "",
      `URL: ${base}/shop/${p.slug}`,
      `Price: ${price(p.priceCents)}${p.compareAtCents ? ` (compare at ${price(p.compareAtCents)})` : ""}`,
      `Availability: ${p.stock > 0 ? "in stock" : "out of stock"}`,
      p.tagline ? `Tagline: ${p.tagline}` : "",
      "",
      p.shortDescription,
      "",
      p.highlights?.length ? `Highlights:\n${p.highlights.map((x) => `- ${x}`).join("\n")}` : "",
      "",
      htmlToText(p.longDescription || ""),
      "",
      p.faqs?.length ? `Product FAQs:\n${p.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}` : "",
    );
  }

  const pages: Array<[string, string, string]> = [
    ["Benefits", `${base}/benefits`, settings.benefitsBody],
    ["Shipping policy", `${base}/shipping`, settings.shippingPolicyBody],
    ["Returns & refunds", `${base}/returns`, settings.returnsPolicyBody],
    ["Terms of service", `${base}/terms`, settings.termsBody],
    ["Privacy policy", `${base}/privacy`, settings.privacyBody],
  ];
  for (const [name, url, body] of pages) {
    if (!body?.trim()) continue;
    sections.push("", `## ${name}`, "", `URL: ${url}`, "", htmlToText(body));
  }

  if (settings.faqs?.length) {
    sections.push(
      "",
      "## Frequently asked questions",
      "",
      `URL: ${base}/faq`,
      "",
      settings.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n"),
    );
  }

  sections.push(
    "",
    "## Contact",
    "",
    `Email: ${settings.supportEmail}`,
    settings.phone ? `Phone: ${settings.phone}` : "",
    `Contact page: ${base}/contact`,
    "",
  );

  return new Response(sections.filter((s) => s !== null).join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
