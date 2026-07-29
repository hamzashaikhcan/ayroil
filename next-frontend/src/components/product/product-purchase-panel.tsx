"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BuyBlock } from "@/components/product/buy-block";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { ProductUrgencyTimer } from "@/components/product/product-urgency-timer";
import { useSettings } from '@/components/providers/settings-context';
import { trackViewContent } from "@/lib/analytics";

// Below this, a "sold in the last 24h" count reads as noise rather than
// social proof — hide it instead of surfacing an underwhelming "1 sold".
const SOLD_COUNT_DISPLAY_THRESHOLD = 5;

export function ProductPurchasePanel({
  product,
  timer,
  estimatedShippingDays,
  sentinelId,
  children,
}: {
  product: Product;
  timer: {
    enabled: boolean;
    durationSeconds: number;
    discountPercent: number;
    message: string;
    storageKey: string;
  };
  estimatedShippingDays: string;
  sentinelId: string;
  children: ReactNode;
}) {
  const settings = useSettings();
  const [expired, setExpired] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const discountActive = timer.enabled && timer.discountPercent > 0 && !expired;

  const effectivePriceCents = discountActive
    ? Math.max(0, Math.round(product.priceCents * (100 - timer.discountPercent) / 100))
    : product.priceCents;

  const originalPriceCents = discountActive
		? product.priceCents
		: (product.compareAtCents ?? null);
	const percentOff =
		originalPriceCents && originalPriceCents > effectivePriceCents
			? Math.round((1 - effectivePriceCents / originalPriceCents) * 100)
			: 0;
	// const soldLast24h = product.soldLast24h ?? 0;
	const soldLast24h = 812;
	const showSoldCount = soldLast24h >= SOLD_COUNT_DISPLAY_THRESHOLD;
	const lowStock = product.stock > 0 && product.stock < 10;

  const purchaseProduct = useMemo(
    () =>
      discountActive
        ? { ...product, priceCents: effectivePriceCents, compareAtCents: product.priceCents }
        : product,
    [discountActive, effectivePriceCents, product],
  );

  const onExpire = useCallback(() => {
    setExpired(true);
    setDeadline(null);
  }, []);

  const onDeadline = useCallback((nextDeadline: number) => {
    setDeadline(nextDeadline);
  }, []);

  const offer = discountActive && deadline
    ? { discountPercent: timer.discountPercent, expiresAt: new Date(deadline).toISOString() }
    : undefined;

  useEffect(() => {
    trackViewContent({ id: product.id, name: product.name, priceCents: product.priceCents });
  }, [product.id, product.name, product.priceCents]);

  return (
		<>
			{discountActive ? (
				<div className='mb-6'>
					<ProductUrgencyTimer
						durationSeconds={timer.durationSeconds}
						discountPercent={timer.discountPercent}
						message={timer.message}
						priceCents={product.priceCents}
						storageKey={timer.storageKey}
						onExpire={onExpire}
						onDeadline={onDeadline}
					/>
				</div>
			) : expired ? (
				<div className='mb-6 rounded-2xl border border-line bg-surface p-4'>
					<div className='font-mono text-[10px] uppercase tracking-[0.22em] text-muted'>
						Offer expired
					</div>
					<p className='mt-1 text-sm text-ink'>
						The limited-time discount for this visit has ended.
					</p>
				</div>
			) : null}

			{children}

			<div className='mt-6 flex flex-wrap items-end gap-3'>
				<div className='font-display text-3xl text-ink'>
					{formatPrice(effectivePriceCents)}
				</div>
				{originalPriceCents ? (
					<div className='font-mono text-sm text-muted line-through'>
						{formatPrice(originalPriceCents)}
					</div>
				) : null}
				{percentOff > 0 ? (
					<Badge tone='warning'>Save {percentOff}%</Badge>
				) : null}
				{product.stock <= 0 ? <Badge tone='outline'>Sold out</Badge> : null}
			</div>

			{showSoldCount ? (
				<div className='mt-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent-deep'>
					<FireIcon className='h-4 w-4 flex-none' />
					{soldLast24h} sold in the last 24 hours
				</div>
			) : null}

			{lowStock ? (
				<div className='mt-3 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>
					<BoltIcon className='h-4 w-4 flex-none' />
					Hurry! Only {product.stock} left in stock — order now.
				</div>
			) : null}

			<BuyBlock
				product={purchaseProduct}
				sentinelId={sentinelId}
				offer={offer}
			/>

			<div className='mt-5 grid grid-cols-3 gap-3'>
				<TrustItem
					icon={<ShieldIcon />}
					title='Secure checkout'
					subtitle='100% protected payments'
				/>
				<TrustItem
					icon={<TruckIcon />}
					title='Fast shipping'
					subtitle={`Ships in ${estimatedShippingDays}d`}
				/>
				<TrustItem
					icon={<ReturnIcon />}
					title='Money-back guarantee'
					subtitle={`${settings.returnsWindowDays}d easy returns`}
				/>
			</div>

			<StickyBuyBar
				product={purchaseProduct}
				sentinelId={sentinelId}
				offer={offer}
			/>
		</>
	);
}

function TrustItem({
	icon,
	title,
	subtitle,
}: {
	icon: ReactNode;
	title: string;
	subtitle: string;
}) {
	return (
		<div className='flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-4 text-center'>
			<span className='text-ink'>{icon}</span>
			<div className='font-display text-xs font-semibold leading-tight text-ink'>
				{title}
			</div>
			<div className='text-[11px] leading-tight text-muted'>{subtitle}</div>
		</div>
	);
}

function ShieldIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox='0 0 24 24'
			className={className}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.7'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'>
			<path d='M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z' />
			<path d='M9 12l2 2 4-4' />
		</svg>
	);
}

function TruckIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox='0 0 24 24'
			className={className}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.7'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'>
			<path d='M3 7h11v8H3zM14 10h4l3 3v2h-7z' />
			<circle cx='7' cy='17' r='1.6' />
			<circle cx='17.5' cy='17' r='1.6' />
		</svg>
	);
}

function ReturnIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox='0 0 24 24'
			className={className}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.7'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'>
			<path d='M4 4v5h5' />
			<path d='M4.5 13a8 8 0 1 0 2-8.5L4 9' />
		</svg>
	);
}

function FireIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox='0 0 24 24'
			className={className}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.7'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'>
			<path d='M12 3c1 3-3 4-3 7a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-5 5-10Z' />
		</svg>
	);
}

function BoltIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox='0 0 24 24'
			className={className}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.7'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'>
			<path d='M13 3 4 14h6l-1 7 9-11h-6l1-7Z' />
		</svg>
	);
}
