"use client";

import { usePathname } from "next/navigation";
import { SettingsNav } from "./settings-nav";

// Paths that still belong to the Settings module (chrome = left rail).
// Everything else under /settings/* is content management surfaced in the
// main admin sidebar and should render full-width without the rail.
const SETTINGS_PATHS = new Set([
  "/settings",
  "/settings/general",
  "/settings/commerce",
  "/settings/appearance",
  "/settings/email",
  "/settings/profile",
]);

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettingsChrome = SETTINGS_PATHS.has(pathname);

  if (!isSettingsChrome) {
    return <div className="min-w-0">{children}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
      <SettingsNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
