import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

/**
 * Renders product longDescription HTML (authored in the admin's BlockNote
 * editor) on the storefront. Sanitized with DOMPurify so a compromised admin
 * payload can't inject scripts or click-jacking iframes.
 */
export function ProductDescription({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  if (!html?.trim()) return null;

  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
    ADD_ATTR: ["target", "rel"],
  });

  return (
    <div
      className={cn("product-prose", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
