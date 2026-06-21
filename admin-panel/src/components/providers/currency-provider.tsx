"use client";

import { useState } from "react";
import { setActiveCurrency } from "@/lib/utils";

type CurrencyConfig = { code: string; symbol: string; locale: string };

/**
 * Client-side mirror of the active currency. The server layout already calls
 * setActiveCurrency() before rendering, but client navigations (after
 * `router.refresh`, etc.) preserve module state — so we re-apply on mount in
 * case the user just saved a new currency in Settings.
 *
 * Using lazy useState initializer is the React 19-recommended pattern for
 * "run once at mount" without violating react-hooks/refs.
 */
export function CurrencyProvider({
  config,
  children,
}: {
  config: CurrencyConfig;
  children: React.ReactNode;
}) {
  useState(() => {
    setActiveCurrency(config);
    return true;
  });
  return <>{children}</>;
}
