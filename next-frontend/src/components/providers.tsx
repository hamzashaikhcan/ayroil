"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useCart } from "@/stores/cart-store";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

function CartBootstrap() {
  useEffect(() => {
    if (!useCart.getState().ready) {
      void useCart.getState().hydrate();
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfirmProvider>
        <CartBootstrap />
        {children}
      </ConfirmProvider>
    </SessionProvider>
  );
}
