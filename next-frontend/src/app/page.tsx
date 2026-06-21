import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductArt } from '@/components/product/product-art';
import { ProductThumb } from '@/components/product/product-thumb';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { fetchPrimaryProduct, FALLBACK_PRODUCT } from '@/lib/server-api';
import { fetchSettings } from '@/lib/settings';
import { formatPrice } from '@/lib/utils';

export default async function HomePage() {
	const [product, settings] = await Promise.all([
		fetchPrimaryProduct().then((p) => p ?? FALLBACK_PRODUCT),
		fetchSettings(),
	]);
	// Prefer site-wide FAQs from settings; fall back to the product's own FAQs if none set.
	const faqs = settings.faqs?.length
		? settings.faqs
		: product.faqs?.length
			? product.faqs
			: FALLBACK_PRODUCT.faqs;

	const faqLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	};

	const productLd = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: product.shortDescription,
		brand: { '@type': 'Brand', name: settings.siteName },
		offers: {
			'@type': 'Offer',
			priceCurrency: settings.currencyCode,
			price: (product.priceCents / 100).toFixed(2),
			availability:
				product.stock > 0
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock',
		},
	};

	return (
		<>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
			/>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
			/>

			<section className='relative overflow-hidden'>
				<Container className='pt-10 pb-20 md:pt-16 md:pb-28'>
					<div className='grid grid-cols-1 gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center'>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
								<span className='marker-dot'>
									{settings.heroEyebrow ||
										`A single-product brand · Est. ${settings.foundedYear}`}
								</span>
							</div>
							<h1 className='font-display mt-5 text-5xl leading-[0.98] tracking-tight text-ink sm:text-6xl md:text-7xl'>
								{settings.heroTitle || settings.siteName}.
							</h1>
							{settings.heroSubtitle || settings.slogan ? (
								<p className='font-display mt-3 text-4xl leading-tight tracking-tight text-muted sm:text-4xl md:text-5xl'>
									{settings.heroSubtitle || settings.slogan}
								</p>
							) : null}
							<p className='mt-6 max-w-xl text-lg leading-relaxed text-muted'>
								{settings.heroDescription || settings.shortDescription}
							</p>
							<div className='mt-8 flex flex-wrap items-center gap-3'>
								{settings.heroPrimaryCtaLabel && settings.heroPrimaryCtaHref ? (
									<Button
										href={settings.heroPrimaryCtaHref}
										variant='primary'
										size='lg'>
										{settings.heroPrimaryCtaLabel}
									</Button>
								) : product ? (
									<AddToCartButton product={product} />
								) : null}
								{settings.heroSecondaryCtaLabel &&
								settings.heroSecondaryCtaHref ? (
									<Button
										href={settings.heroSecondaryCtaHref}
										variant='secondary'
										size='lg'>
										{settings.heroSecondaryCtaLabel}
									</Button>
								) : product ? (
									<Button
										href={`/shop/${product.slug}`}
										variant='secondary'
										size='lg'>
										Read the spec
									</Button>
								) : null}
								{/* {product ? (
									<div className='ml-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted'>
										<span className='inline-block h-1.5 w-1.5 rounded-full bg-accent' />
										{formatPrice(product.priceCents)} · ships free over{' '}
										{formatPrice(settings.freeShippingThresholdCents)}
									</div>
								) : null} */}
							</div>
							<div className='mt-12 grid grid-cols-3 gap-3 border-t border-line pt-6 sm:gap-6'>
								{[
									{ k: settings.estStandardDays + 'd', v: 'Shipping' },
									{ k: settings.returnsWindowDays + 'd', v: 'Returns' },
									{ k: 'Lightweight', v: 'Non-greasy feel' },
								].map((s) => (
									<div key={s.k} className='min-w-0'>
										<div className='font-display text-lg text-ink sm:text-2xl'>{s.k}</div>
										<div className='mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted sm:text-xs sm:tracking-[0.2em]'>
											{s.v}
										</div>
									</div>
								))}
							</div>
						</div>

						<div className='relative'>
							{settings.heroImageUrl ? (
								<Link
									href={product ? `/shop/${product.slug}` : '/shop'}
									className='relative block aspect-square overflow-hidden rounded-2xl bg-surface'>
									<Image
										src={settings.heroImageUrl}
										alt={settings.heroTitle || settings.siteName}
										fill
										priority
										sizes='(max-width: 768px) 100vw, 50vw'
										className='object-cover'
									/>
								</Link>
							) : product ? (
								<ProductThumb
									image={product.images?.[0]}
									slug={product.slug}
									name={product.name}
									className='aspect-square'
									priority
									sizes='(max-width: 768px) 100vw, 50vw'
								/>
							) : null}
							{product && product.stock > 0 ? (
								<div className='absolute -left-3 -top-3 rotate-[-4deg]'>
									<Badge tone='accent'>In stock</Badge>
								</div>
							) : null}
						</div>
					</div>
				</Container>
			</section>

			<div className='overflow-hidden border-y border-line bg-ink py-3 text-background'>
				<div className='ticker flex whitespace-nowrap'>
					{[
						'Built in-house',
						'30-day returns',
						'Carbon-neutral shipping',
						'Made in small batches',
						'Verified per batch',
						'Built in-house',
						'30-day returns',
						'Carbon-neutral shipping',
						'Made in small batches',
						'Verified per batch',
					].map((t, i) => (
						<div
							key={i}
							className='mx-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em]'>
							<span className='inline-block h-1 w-1 rounded-full bg-accent' />
							{t}
						</div>
					))}
				</div>
			</div>

			<section className='py-20'>
				<Container>
					<div className='max-w-3xl'>
						<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
							<span className='marker-dot'>Why one product</span>
						</div>
						<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
							We only make one thing.
							<span className='block text-muted'>So we can make it right.</span>
						</h2>
						<p className='mt-5 text-base leading-relaxed text-muted'>
							Most brands ship a hundred SKUs and quietly hope you do not notice
							the ones that are quietly bad. We do the opposite — one product,
							signed batches, and our name on the label.
						</p>
					</div>

					<div className='mt-12 grid grid-cols-1 gap-5 md:grid-cols-3'>
						{[
							{
								k: 'Focused R&D',
								d: 'Every test, every prototype, every lab — all of it points at one thing.',
							},
							{
								k: 'Batch traceability',
								d: 'Each unit is tied to a batch number you can look up. We know who made it and when.',
							},
							{
								k: 'No filler SKUs',
								d: 'We do not pad the catalog with adjacent products to drive AOV.',
							},
						].map((s) => (
							<div
								key={s.k}
								className='rounded-2xl border border-line bg-surface p-6'>
								<div className='font-display text-xl text-ink'>{s.k}</div>
								<p className='mt-3 text-sm leading-relaxed text-muted'>{s.d}</p>
							</div>
						))}
					</div>
				</Container>
			</section>

			<section className='border-t border-line bg-surface py-20'>
				<Container>
					<div className='grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center'>
						<ProductArt
							seed={`${product.slug}-spec`}
							label={product.name}
							className='aspect-[4/5]'
						/>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
								<span className='marker-dot'>The problem</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
								Most of what you buy was designed for a shelf, not for you.
							</h2>
							<p className='mt-5 text-base leading-relaxed text-muted'>
								The category we work in is full of products built to look good
								on a planogram and survive a year on a pallet. Ours was built to
								be opened, used, and finished — and then replaced because it
								actually got used up.
							</p>
							<ul className='mt-8 space-y-3'>
								{[
									'Designed around a single, specific job.',
									'Tested against five competing products head to head.',
									'Reformulated three times before we agreed to ship it.',
									'Shipped only after a 30-day in-house trial.',
								].map((t) => (
									<li key={t} className='flex gap-3 text-sm text-ink'>
										<span className='mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent' />
										{t}
									</li>
								))}
							</ul>
						</div>
					</div>
				</Container>
			</section>

			<section className='py-20'>
				<Container>
					<div className='max-w-3xl'>
						<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
							<span className='marker-dot'>How it works</span>
						</div>
						<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
							From our workshop to your doorstep.
						</h2>
					</div>

					<div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-4'>
						{[
							{
								k: '01',
								t: 'Formulated',
								d: 'Batch sized so each run gets the same care as the prototype.',
							},
							{
								k: '02',
								t: 'Tested',
								d: 'Every batch is sampled and verified against our in-house reference.',
							},
							{ k: '03', t: 'Packed', d: 'Hand-packed in recyclable mailers.' },
							{
								k: '04',
								t: 'Shipped',
								d: 'Carbon-neutral 3-5 day shipping. Tracking sent the moment it leaves.',
							},
						].map((s) => (
							<div
								key={s.k}
								className='rounded-2xl border border-line bg-surface p-6'>
								<div className='font-mono text-xs text-muted'>{s.k}</div>
								<div className='font-display mt-3 text-xl text-ink'>{s.t}</div>
								<p className='mt-2 text-sm leading-relaxed text-muted'>{s.d}</p>
							</div>
						))}
					</div>
				</Container>
			</section>

			{product.ingredients?.length ? (
				<section className='border-t border-line bg-ink text-background py-20'>
					<Container>
						<div className='max-w-3xl'>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-background/60'>
								<span className='marker-dot'>What is inside</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight md:text-5xl'>
								Every ingredient earns its line on the label.
							</h2>
							<p className='mt-5 text-base leading-relaxed text-background/70'>
								If we cannot explain in a sentence why an ingredient is in the
								formula, it is not in the formula.
							</p>
						</div>
						<div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-3'>
							{product.ingredients.map((ing) => (
								<div
									key={ing.name}
									className='rounded-2xl border border-background/15 bg-background/[0.04] p-6'>
									<div className='font-mono text-xs uppercase tracking-[0.22em] text-background/60'>
										Ingredient
									</div>
									<div className='font-display mt-3 text-2xl'>{ing.name}</div>
									<p className='mt-3 text-sm leading-relaxed text-background/70'>
										{ing.description}
									</p>
								</div>
							))}
						</div>
					</Container>
				</section>
			) : null}

			<section className='py-20'>
				<Container>
					<div className='grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.2fr] md:items-center'>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
								<span className='marker-dot'>From customers</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
								Real people. Real reviews.
							</h2>
							<p className='mt-5 text-base leading-relaxed text-muted'>
								We do not pay for reviews and we do not delete the bad ones. The
								quotes here are pulled straight from our inbox.
							</p>
						</div>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							{[
								{
									q: 'I switched two months ago and never went back.',
									n: 'Sadia R.',
									role: 'Verified buyer',
								},
								{
									q: 'I appreciate that they did not bury the price in a subscription wall.',
									n: 'Anum K.',
									role: 'Verified buyer',
								},
								{
									q: 'The packaging is the least precious in this category. Refreshing.',
									n: 'Bilal P.',
									role: 'Verified buyer',
								},
								{
									q: 'I have tried four. This is the one I tell people about.',
									n: 'Hanif Z.',
									role: 'Verified buyer',
								},
							].map((r) => (
								<div
									key={r.n}
									className='rounded-2xl border border-line bg-surface p-5'>
									<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
										{r.n}
									</div>
									<p className='mt-3 text-sm leading-relaxed text-ink'>
										&ldquo;{r.q}&rdquo;
									</p>
									<div className='mt-4 text-xs text-muted'>
										{r.n} · {r.role}
									</div>
								</div>
							))}
						</div>
					</div>
				</Container>
			</section>

			<section className='border-t border-line bg-surface py-20'>
				<Container>
					<div className='max-w-3xl'>
						<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
							<span className='marker-dot'>Compare</span>
						</div>
						<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
							How we stack up.
						</h2>
						<p className='mt-5 text-base leading-relaxed text-muted'>
							An honest side-by-side against the category average.
						</p>
					</div>

					<div className='mt-10 overflow-x-auto rounded-2xl border border-line bg-background'>
						<table className='w-full min-w-2xl text-left text-sm'>
							<thead className='border-b border-line'>
								<tr>
									<th className='px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] text-muted'>
										Spec
									</th>
									<th className='px-5 py-4 font-display text-base text-ink'>
										{settings.siteName}
									</th>
									<th className='px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] text-muted'>
										Category avg
									</th>
								</tr>
							</thead>
							<tbody>
								{[
									['Setup fees', '$0', '$5–25'],
									['MOQ', '1 unit', 'Subscription required'],
									[
										'Ingredient list',
										'Published, plain language',
										'Trade-secret',
									],
									['Returns', `${settings.returnsWindowDays} days`, '14 days'],
									['Made', 'In-house', 'Outsourced'],
									['Carbon offset', 'Standard', 'Add-on'],
								].map(([k, a, b]) => (
									<tr key={k} className='border-b border-line last:border-b-0'>
										<td className='px-5 py-4 text-muted'>{k}</td>
										<td className='px-5 py-4 font-medium text-ink'>{a}</td>
										<td className='px-5 py-4 text-muted'>{b}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Container>
			</section>

			<section className='py-20'>
				<Container>
					<div className='grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.2fr]'>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
								<span className='marker-dot'>Sustainability</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
								Less plastic. Less freight. Less talk.
							</h2>
							<p className='mt-5 text-base leading-relaxed text-muted'>
								We ship in recyclable mailers, route freight to consolidate
								carbon, and offset what is left through a verified registry.
							</p>
						</div>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
							{[
								{ k: '84%', v: 'Recyclable packaging' },
								{ k: '0.4 kg', v: 'CO₂ per shipment' },
								{ k: '100%', v: 'Carbon offset' },
							].map((s) => (
								<div
									key={s.k}
									className='rounded-2xl border border-line bg-surface p-6'>
									<div className='font-display text-3xl text-ink'>{s.k}</div>
									<div className='mt-2 font-mono text-xs uppercase tracking-[0.18em] text-muted'>
										{s.v}
									</div>
								</div>
							))}
						</div>
					</div>
				</Container>
			</section>

			<section className='border-t border-line bg-surface py-20'>
				<Container>
					<div className='grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.2fr]'>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
								<span className='marker-dot'>FAQ</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
								Frequently asked questions
							</h2>
							<p className='mt-5 text-base leading-relaxed text-muted'>
								The answers we give over and over again. Email us if your
								question is not here.
							</p>
						</div>
						<div className='divide-y divide-line border-t border-line'>
							{faqs.map((f) => (
								<div key={f.q} className='py-5'>
									<h3 className='font-display text-lg text-ink'>{f.q}</h3>
									<p className='mt-2 text-sm leading-relaxed text-muted'>
										{f.a}
									</p>
								</div>
							))}
						</div>
					</div>
				</Container>
			</section>

			<section className='border-t border-line bg-ink text-background'>
				<Container className='py-20'>
					<div className='grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:items-end'>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-background/60'>
								<span className='marker-dot'>Order now</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight md:text-5xl'>
								One product. Yours, today.
							</h2>
							<p className='mt-4 max-w-lg text-base leading-relaxed text-background/70'>
								{formatPrice(product.priceCents)} · ships in{' '}
								{settings.estStandardDays} business days · free over{' '}
								{formatPrice(settings.freeShippingThresholdCents)}.
							</p>
						</div>
						<div className='flex flex-wrap gap-3 md:justify-end'>
							<AddToCartButton product={product} />
							<Button
								href={`/shop/${product.slug}`}
								variant='ghost'
								size='lg'
								className='text-background hover:bg-background/10'>
								Read the spec →
							</Button>
						</div>
					</div>
				</Container>
			</section>
		</>
	);
}
