import Link from "next/link";
import { fetchProducts } from "@/lib/server-api";
import { formatPrice } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/ui/icons";

export default async function ProductsPage() {
  const products = await fetchProducts();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        subtitle={`${products.length} products in the catalog`}
        actions={
          <Button href="/products/new" size="md">
            <IconPlus className="h-3.5 w-3.5" />
            Add product
          </Button>
        }
      />

      <div className="card table-card-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Position</th>
                <th className="px-5 py-2.5 font-medium">Product</th>
                <th className="px-5 py-2.5 font-medium">SKU</th>
                <th className="px-5 py-2.5 font-medium">Price</th>
                <th className="px-5 py-2.5 font-medium">Stock</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted">No products yet.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-b-0 row-hover">
                  <td className="px-5 py-3 tabular-nums text-muted" data-label="Position">{p.sortOrder ?? "—"}</td>
                  <td className="px-5 py-3" data-label="Product">
                    <Link href={`/products/${p.id}`} className="font-medium text-ink hover:text-accent">{p.name}</Link>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted" data-label="SKU">{p.sku ?? "—"}</td>
                  <td className="px-5 py-3 font-medium tabular-nums text-ink" data-label="Price">{formatPrice(p.priceCents)}</td>
                  <td className="px-5 py-3 tabular-nums text-ink" data-label="Stock">{p.stock}</td>
                  <td className="px-5 py-3" data-label="Status"><StatusPill value={p.active ? "active" : "draft"} /></td>
                  <td className="px-5 py-3 text-right" data-label="">
                    <Link href={`/products/${p.id}`} className="text-xs font-medium text-accent hover:text-accent-deep">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
