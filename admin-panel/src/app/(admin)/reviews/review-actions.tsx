"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function ReviewActions({
  id,
  visible,
  label,
}: {
  id: string;
  visible: boolean;
  label: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);

  async function setVisible(nextVisible: boolean) {
    const ok = await confirm({
      title: nextVisible ? "Show this review?" : "Hide this review?",
      description: nextVisible
        ? "This review will appear on the storefront product page."
        : "This review will be removed from the storefront product page, but kept in admin.",
      targetName: label,
      confirmLabel: nextVisible ? "Show review" : "Hide review",
    });
    if (!ok) return;

    setPending(true);
    try {
      await adminClientFetch(`/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ visible: nextVisible }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this review?",
      description: "This permanently removes the review. This cannot be undone.",
      targetName: label,
      destructive: true,
      confirmLabel: "Delete review",
      typeToConfirm: "DELETE",
    });
    if (!ok) return;

    setPending(true);
    try {
      await adminClientFetch(`/reviews/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible ? (
        <Button onClick={() => setVisible(false)} disabled={pending} variant="secondary" size="sm">
          Hide
        </Button>
      ) : (
        <Button onClick={() => setVisible(true)} disabled={pending} size="sm">
          Show
        </Button>
      )}
      <Button onClick={onDelete} disabled={pending} variant="danger" size="sm">
        Delete
      </Button>
    </div>
  );
}
