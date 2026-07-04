import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// Private/transactional routes no crawler should index.
const PRIVATE_PATHS = [
  "/account/",
  "/checkout",
  "/cart",
  "/orders/",
  "/login",
  "/register",
  "/api/",
];

// Main search engine crawlers, named explicitly so search access is never
// collateral damage if the wildcard rule ever tightens.
const SEARCH_CRAWLERS = ["Googlebot", "Bingbot"];

// AI assistant and answer-engine crawlers, allowed explicitly so the brand
// can be cited by ChatGPT, Claude, Gemini, Perplexity, and friends.
// OAI-SearchBot surfaces sites in ChatGPT search; PerplexityBot does the
// same for Perplexity — blocking either removes the site from those answers.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "DuckAssistBot",
  "cohere-ai",
  "MistralAI-User",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "productone.example";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: SEARCH_CRAWLERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
