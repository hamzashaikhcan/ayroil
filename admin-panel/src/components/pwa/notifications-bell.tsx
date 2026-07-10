"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  detectSupport,
  registerServiceWorker,
  currentPermission,
  isSubscribed,
  enablePush,
  disablePush,
  sendTestPush,
  type PushSupport,
} from "@/lib/push-client";

export function NotificationsBell() {
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tested, setTested] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = detectSupport();
      if (cancelled) return;
      setSupport(s);
      if (s === "unsupported") return;
      await registerServiceWorker();
      if (cancelled) return;
      setPermission(await currentPermission());
      try {
        const sub = await isSubscribed();
        if (!cancelled) setSubscribed(sub);
      } catch {
        if (!cancelled) setSubscribed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the popover on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function onEnable() {
    setBusy(true);
    setError(null);
    try {
      const result = await enablePush();
      setPermission(result);
      if (result === "granted") {
        setSubscribed(true);
        await sendTestPush().catch(() => {});
        setTested(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function onDisable() {
    setBusy(true);
    setError(null);
    try {
      await disablePush();
      setSubscribed(false);
      setTested(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setBusy(true);
    setError(null);
    try {
      await sendTestPush();
      setTested(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send a test.");
    } finally {
      setBusy(false);
    }
  }

  // Hide entirely on browsers that can't do push at all (and aren't iOS-installable).
  if (support === "unsupported") return null;

  const active = subscribed && permission === "granted";

  return (
		<div className='relative' ref={ref}>
			<button
				type='button'
				onClick={() => setOpen((v) => !v)}
				aria-label='Order notifications'
				title='Order notifications'
				className='relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-surface-2'>
				<BellIcon className='h-4 w-4' />
				{/* Dot: accent when active, warn when action needed. */}
				<span
					className={cn(
						'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface',
						active ? 'bg-good' : permission === 'denied' ? 'bg-bad' : 'bg-warn',
					)}
					aria-hidden
				/>
			</button>

			{open ? (
				<div className='absolute right-0 z-50 mt-2 w-72 rounded-lg border border-line bg-surface p-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]'>
					<div className='text-sm font-semibold text-ink'>
						Order notifications
					</div>
					<p className='mt-1 text-xs leading-relaxed text-muted'>
						Get a push on this device whenever a new order comes in — even when
						the admin is closed.
					</p>

					{support === 'needs-install' ? (
						<div className='mt-3 rounded-md bg-surface-2 p-2.5 text-xs leading-relaxed text-ink-soft'>
							On iPhone/iPad, open this in{' '}
							<span className='font-medium'>Safari</span>, tap the Share icon,
							then <span className='font-medium'>Add to Home Screen</span>. Open
							the installed app and enable notifications from there.
						</div>
					) : permission === 'denied' ? (
						<div className='mt-3 rounded-md bg-bad-soft p-2.5 text-xs leading-relaxed text-bad'>
							Notifications are blocked for this site. Re-enable them in your
							browser’s site settings, then try again.
						</div>
					) : active ? (
						<div className='mt-3 space-y-2'>
							<div className='flex items-center gap-2 rounded-md bg-good-soft px-2.5 py-2 text-xs font-medium text-good'>
								<span className='h-1.5 w-1.5 rounded-full bg-good' />
								Enabled on this device{tested ? ' · test sent' : ''}
							</div>
							<div className='flex gap-2'>
								{/* <button
                  type="button"
                  onClick={onTest}
                  disabled={busy}
                  className="flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
                >
                  Send test
                </button> */}
								<button
									type='button'
									onClick={onDisable}
									disabled={busy}
									className='flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-bad hover:bg-bad-soft disabled:opacity-50'>
									Turn off
								</button>
							</div>
						</div>
					) : (
						<button
							type='button'
							onClick={onEnable}
							disabled={busy}
							className='mt-3 w-full rounded-md bg-ink px-3 py-2 text-xs font-semibold text-background hover:bg-ink-soft disabled:opacity-50'>
							{busy ? 'Enabling…' : 'Enable notifications'}
						</button>
					)}

					{error ? <div className='mt-2 text-xs text-bad'>{error}</div> : null}
				</div>
			) : null}
		</div>
	);
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
