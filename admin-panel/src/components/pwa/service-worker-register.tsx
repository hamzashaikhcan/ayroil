"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push-client";

/**
 * Registers the PWA service worker once on load so the admin is installable
 * and ready to receive push notifications. Renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);
  return null;
}
