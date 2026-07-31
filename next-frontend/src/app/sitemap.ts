import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { ANSWER_PAGES } from "@/content/answer-pages";
import { fetchAllProducts } from "@/lib/server-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "productone.example";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const now = new Date();

  const products = await fetchAllProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/shop`,     lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/benefits`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/reviews`,  lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/faq`,      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`,  lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/track`,    lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/returns`,  lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`,    lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${base}/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/shop/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const answerRoutes: MetadataRoute.Sitemap = ANSWER_PAGES.map((p) => ({
    url: `${base}/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...answerRoutes];
}
