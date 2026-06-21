import { adminServerFetch } from "@/lib/server-api";
import type { SettingsLike } from "./types";

export async function fetchSettingsForAdmin(): Promise<SettingsLike | null> {
  try {
    return await adminServerFetch<SettingsLike>("/settings");
  } catch {
    return null;
  }
}
