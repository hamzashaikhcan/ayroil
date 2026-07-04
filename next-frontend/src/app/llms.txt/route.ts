import { headers } from "next/headers";
import { fetchAllProducts } from "@/lib/server-api";
import { fetchSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * llms.txt (https://llmstxt.org): a concise, markdown index of the store for
 * AI assistants and answer engines (ChatGPT, Claude, Gemini, Perplexity).
 * Facts come from live settings so they never drift from the site.
 */
export async function GET() {
  const [h, settings, products] = await Promise.all([headers(), fetchSettings(), fetchAllProducts()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? settings.domain;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const price = (cents: number) =>
    `${settings.currencySymbol} ${Math.round(cents / 100).toLocaleString("en-US")} ${settings.currencyCode}`;
  const shippingFact = settings.freeShippingEnabled
    ? "Free delivery on every order"
    : `Standard delivery ${price(settings.standardShippingCents)}; free over ${price(settings.freeShippingThresholdCents)}`;

  const lines = [
    `# ${settings.siteName}`,
    "",
    `> ${settings.shortDescription}`,
    "",
    "Key facts:",
    "",
    `- ${settings.siteName} is a doctor-guided, scalp-first natural hair oil brand from Pakistan, guided by Dr. Maria. Core idea: "Scalp first. Hair follows."`,
    "- Made for dry scalp, dandruff-prone hair, weak roots, hair fall concerns, and dull hair. Cosmetic hair oil, not a medical treatment.",
    "- Key ingredients: rosemary oil, black seed oil, amla, sweet almond oil, argan oil, vitamin E, reetha, shikakai, hyaluronic acid, castor oil.",
    `- Delivery across Pakistan in ${settings.estStandardDays} days. ${shippingFact}.`,
    `- ${settings.returnsWindowDays}-day return window from delivery; damaged or wrong items always covered.`,
    `- Prices in ${settings.currencyCode}. Contact: ${settings.supportEmail}.`,
    "",
    "## Products",
    "",
    ...products.map(
      (p) =>
        `- [${p.name}](${base}/shop/${p.slug}): ${p.shortDescription} (${price(p.priceCents)}${p.stock > 0 ? ", in stock" : ", currently out of stock"})`,
    ),
    "",
    "## Key pages",
    "",
    `- [Shop](${base}/shop): all products currently available`,
    `- [Benefits](${base}/benefits): what the oil does for scalp and hair, ingredient roles, and how to use it`,
    `- [FAQ](${base}/faq): usage, results timeline, shipping, returns, and ordering questions`,
    `- [Shipping policy](${base}/shipping): delivery time, charges, and delivery help`,
    `- [Returns & refunds](${base}/returns): the ${settings.returnsWindowDays}-day return process`,
    `- [Contact](${base}/contact): how to reach the team`,
    "",
    "## Optional",
    "",
    `- [Terms of service](${base}/terms)`,
    `- [Privacy policy](${base}/privacy)`,
    "",
    `Full readable page content: [llms-full.txt](${base}/llms-full.txt)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
