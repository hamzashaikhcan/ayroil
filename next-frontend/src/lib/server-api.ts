import { API_URL, type Product, type ProductReview } from "./api";

export async function fetchPrimaryProduct(): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
    if (!res.ok) return null;
    const items = (await res.json()) as Product[];
    return items[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchAllProducts(q?: string): Promise<Product[]> {
  try {
    const url = q ? `${API_URL}/products?q=${encodeURIComponent(q)}` : `${API_URL}/products`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Product[];
  } catch {
    return [];
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

/**
 * Site-wide review pool — every product detail page shows the same combined
 * list, since the catalog is one physical product in different bundle sizes.
 */
export async function fetchReviews(): Promise<ProductReview[]> {
  try {
    const res = await fetch(`${API_URL}/products/reviews`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ProductReview[];
  } catch {
    return [];
  }
}

export const FALLBACK_PRODUCT: Product = {
	id: '00000000-0000-0000-0000-000000000000',
	slug: 'product-one',
	name: 'Product One',
	tagline: 'Built with intent.',
	metaTitle: null,
	shortDescription:
		'Our first product — engineered around a single problem and one quiet promise.',
	longDescription:
		'Product One is the first thing we have ever made for sale. It came out of two years of testing, a pile of rejected prototypes, and a stubborn opinion about how a single product should feel in your hands.',
	priceCents: 2400,
	compareAtCents: 2900,
	costCents: 900,
	stock: 250,
	sku: 'PO-001',
	active: true,
	recommended: true,
	sortOrder: null,
	images: [],
	highlights: [
		'Engineered around one job',
		'Designed and built in Brooklyn',
		'7-days  return window',
		'Carbon-neutral shipping',
	],
	ingredients: [
		{
			name: 'Active 01',
			description: 'The core compound that does the actual work.',
		},
		{
			name: 'Active 02',
			description: 'Stabilizes the formula and keeps it shelf-stable.',
		},
		{
			name: 'Carrier',
			description:
				'A gentle base that helps the actives reach where they need to go.',
		},
	],
	faqs: [
		{
			q: 'How long does one bottle last?',
			a: 'Used as directed, about 30 days.',
		},
		{
			q: 'Is it gentle?',
			a: 'Yes — no sulfates, parabens, or artificial dyes.',
		},
		{ q: 'Where is it made?', a: 'Brooklyn, NY. Hand-finished in-house.' },
		{
			q: 'What is your return policy?',
			a: '30 days, full refund, no questions.',
		},
	],
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};
