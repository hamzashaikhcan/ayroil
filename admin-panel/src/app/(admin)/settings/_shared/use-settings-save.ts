"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import type { SettingsLike } from "./types";

/**
 * Shared save handler used by every settings sub-page. Each sub-page only
 * sends the fields it owns, so partial PATCHes are safe.
 */
export function useSettingsSave<T extends Partial<SettingsLike>>(initial: T) {
  const router = useRouter();
  const [s, setS] = useState<T>(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof T>(k: K, v: T[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await adminClientFetch("/settings", {
        method: "PUT",
        body: JSON.stringify(s),
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return { s, setS, patch, pending, saved, error, onSubmit };
}
