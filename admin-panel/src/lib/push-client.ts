"use client";

import { adminClientFetch } from "./admin-client";

/**
 * Client helpers for the admin PWA push flow. All backend calls go through the
 * same-origin relay (adminClientFetch), so they're authenticated by the admin
 * session. Push requires a service worker + HTTPS (localhost is exempt).
 */

export type PushSupport =
  | "unsupported" // browser lacks service worker / push
  | "needs-install" // iOS Safari: must be added to Home Screen first
  | "ready"; // can subscribe

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag when launched from Home Screen.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function detectSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    // iOS only exposes PushManager inside an installed PWA — guide the user there.
    if (isIos() && !isStandalone()) return "needs-install";
    return "unsupported";
  }
  if (isIos() && !isStandalone()) return "needs-install";
  return "ready";
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function currentPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

export async function isSubscribed(): Promise<boolean> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return Boolean(sub);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  // Back the array with a concrete ArrayBuffer so it's a valid BufferSource
  // for pushManager.subscribe (not a SharedArrayBuffer-backed view).
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Full enable flow: register SW → request permission → subscribe with the
 * server's VAPID key → persist the subscription on the backend. Returns the
 * resulting permission so the caller can show "blocked" if denied.
 */
export async function enablePush(): Promise<NotificationPermission> {
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const { publicKey, configured } = await adminClientFetch<{ publicKey: string; configured: boolean }>(
    "/push/public-key",
  );
  if (!configured || !publicKey) throw new Error("Push is not configured on the server.");

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = sub.toJSON();
  await adminClientFetch("/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
  });

  return permission;
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await adminClientFetch("/push/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function sendTestPush(): Promise<void> {
  await adminClientFetch("/push/test", { method: "POST" });
}
