import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, string> = {
  pending: "pill-warn",
  paid: "pill-info",
  fulfilled: "pill-info",
  shipped: "pill-info",
  delivered: "pill-good",
  cancelled: "pill-mute",
  refunded: "pill-mute",
  unpaid: "pill-warn",
  authorized: "pill-info",
  active: "pill-good",
  draft: "pill-mute",
  admin: "pill-info",
  user: "pill-mute",
  visible: "pill-good",
  hidden: "pill-warn",
};

export function StatusPill({ value }: { value: string }) {
  const cls = STATUS_MAP[value.toLowerCase()] ?? "pill-mute";
  return <span className={cn("pill", cls)}>{capitalize(value)}</span>;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
