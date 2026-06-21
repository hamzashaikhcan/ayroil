"use client";

import { signOut } from "next-auth/react";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function SignOutButton() {
  const confirm = useConfirm();

  async function onSignOut() {
    const ok = await confirm({
      title: "Sign out of your account?",
      description:
        "You'll be returned to the homepage. Your bag will stay with you on this device.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
    });
    if (ok) await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      onClick={onSignOut}
      className="text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
    >
      Sign out
    </button>
  );
}
