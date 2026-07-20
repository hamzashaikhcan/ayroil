"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function DeleteCartButton({ cartId, label }: { cartId: string; label: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this cart?",
      description: "This permanently removes the cart and all of its items. This cannot be undone.",
      targetName: label,
      destructive: true,
      confirmLabel: "Delete cart",
      typeToConfirm: "DELETE",
    });
    if (!ok) return;

    setPending(true);
    try {
      try {
        await adminClientFetch(`/cart/active/${cartId}`, { method: "DELETE" });
      } catch (err) {
        // Already deleted (e.g. stale row from another tab) — treat as success.
        if (!(err instanceof Error) || !err.message.startsWith("API 404")) throw err;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button onClick={onDelete} disabled={pending} variant="danger" size="sm">
      Delete cart
    </Button>
  );
}
