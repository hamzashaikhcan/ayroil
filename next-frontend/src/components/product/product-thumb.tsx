import Image from "next/image";
import { ProductArt } from "./product-art";
import { cn } from "@/lib/utils";

/**
 * Shows a product image when one exists, otherwise falls back to the
 * procedurally-drawn SVG (so the storefront never looks broken before the
 * admin uploads a real photo).
 */
export function ProductThumb({
  image,
  slug,
  name,
  className,
  sizes = "(max-width: 768px) 50vw, 33vw",
  priority = false,
}: {
  image?: string | null;
  slug: string;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (image) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-surface", className)}>
        <Image
          src={image}
          alt={name}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }
  return <ProductArt seed={slug} label={name} className={className} />;
}
