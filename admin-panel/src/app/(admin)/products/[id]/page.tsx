import Link from "next/link";
import { notFound } from "next/navigation";
import { adminServerFetch } from "@/lib/server-api";
import { fetchPublicBranding } from "@/lib/public-branding";
import { ProductForm } from "../product-form";

type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  compareAtCents: number | null;
  costCents: number;
  stock: number;
  sku: string | null;
  active: boolean;
  recommended: boolean;
  images: string[];
  highlights: string[];
  ingredients: { name: string; description: string }[];
  faqs: { q: string; a: string }[];
};

export default async function EditProductPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  let product: Product | null = null;
  try {
    const list = await adminServerFetch<Product[]>(`/products?all=1`);
    product = list.find((p) => p.id === id) ?? null;
  } catch {
    notFound();
  }
  if (!product) notFound();
  const branding = await fetchPublicBranding();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/products" className="text-xs text-muted hover:text-ink">← Back to products</Link>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">{product.name}</h2>
        <p className="mt-1 text-sm text-muted">Edit product details, pricing, and inventory.</p>
      </div>
      <ProductForm mode="edit" initial={product} logoUrl={branding.iconUrl || branding.darkLogoUrl} />
    </div>
  );
}
