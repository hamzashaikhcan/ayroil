import Link from "next/link";
import { fetchPublicBranding } from "@/lib/public-branding";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const branding = await fetchPublicBranding();
  return (
    <div className="space-y-5">
      <div>
        <Link href="/products" className="text-xs text-muted hover:text-ink">← Back to products</Link>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">New product</h2>
        <p className="mt-1 text-sm text-muted">Add a product to the catalog. It will appear on the storefront once it&apos;s active.</p>
      </div>
      <ProductForm mode="create" logoUrl={branding.iconUrl || branding.darkLogoUrl} />
    </div>
  );
}
