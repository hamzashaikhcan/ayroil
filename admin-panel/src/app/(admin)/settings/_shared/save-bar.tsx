"use client";

import { Button } from "@/components/ui/button";

/**
 * Sticky save bar at the bottom of a settings sub-page.
 *
 * On desktop the bar stops at the sidebar's right edge (offset 240px = w-60)
 * so it doesn't overlay the sidebar's bottom user card. On mobile it spans
 * the full viewport width because the sidebar is a drawer.
 */
export function StickySaveBar({
  pending,
  saved,
  error,
}: {
  pending: boolean;
  saved: boolean;
  error?: string | null;
}) {
  return (
    <>
      {error ? (
        <div className="rounded-md border border-bad/30 bg-bad-soft px-3 py-2 text-xs text-bad">
          {error}
        </div>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:left-60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 truncate text-xs text-muted">
            {saved ? (
              <span className="font-medium text-good">✓ Saved · changes are live on the storefront.</span>
            ) : (
              "Unsaved changes auto-revert if you leave."
            )}
          </div>
          <Button type="submit" disabled={pending} size="md">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
