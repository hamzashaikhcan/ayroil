"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { SidebarCounts } from "@/lib/server-api";

export function AdminShell({
  email,
  siteName,
  storefrontUrl,
  logoUrl,
  counts,
  children,
}: {
  email: string;
  siteName: string;
  storefrontUrl: string;
  logoUrl?: string;
  counts?: SidebarCounts | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        email={email}
        siteName={siteName}
        storefrontUrl={storefrontUrl}
        logoUrl={logoUrl}
        counts={counts}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
