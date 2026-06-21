"use client";

import { createContext, useContext, useMemo } from "react";
import type { Settings } from "@/lib/settings";
import { setActiveCurrency } from "@/lib/utils";

const Ctx = createContext<Settings | null>(null);

export function SettingsProvider({
  value,
  children,
}: {
  value: Settings;
  children: React.ReactNode;
}) {
  // Push currency to the module-level singleton so every formatPrice() call
  // (including server-rendered ones in the same request graph) uses the
  // admin-edited currency. Setting during render is safe here — it's an
  // idempotent update to a module-level config, not React state.
  setActiveCurrency({
    code: value.currencyCode,
    symbol: value.currencySymbol,
    locale: value.currencyLocale,
  });
  const memo = useMemo(() => value, [value]);
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
}

export function useSettings(): Settings {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSettings must be used inside <SettingsProvider>");
  return v;
}
