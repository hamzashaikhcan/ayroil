import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductThumb } from '@/components/product/product-thumb';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { fetchPrimaryProduct, FALLBACK_PRODUCT } from '@/lib/server-api';
import { fetchSettings } from '@/lib/settings';

const HOME_TITLE =
	'Ayroil Herbal Hair Oil — Nourishing Care for Hair Fall & Dandruff';
const HOME_DESCRIPTION =
	'Ayroil is a cold-pressed herbal hair oil that nourishes dry, dull hair, helps reduce hair fall, and soothes an itchy, flaky scalp. No mineral oil, ever.';

export async function generateMetadata(): Promise<Metadata> {
	// Next.js replaces (not deep-merges) nested metadata objects like
	// `openGraph`/`twitter` when a page defines its own — re-supply the
	// settings-driven image/siteName/locale here so they aren't dropped.
	const settings = await fetchSettings();
	const ogImages = settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined;

	return {
		// `absolute` bypasses the root layout's title template, so this page's
		// title is exactly what's below — not suffixed with the site-wide name.
		title: { absolute: HOME_TITLE },
		description: HOME_DESCRIPTION,
		keywords: [
			'herbal hair oil',
			'nourishing hair oil',
			'cold-pressed hair oil',
			'hair fall control oil',
			'dandruff relief hair oil',
			'flaky scalp care',
			'frizz control hair oil',
			'natural scalp care',
		],
		alternates: { canonical: '/' },
		openGraph: {
			type: 'website',
			siteName: settings.siteName,
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			url: '/',
			locale: 'en_US',
			images: ogImages,
		},
		twitter: {
			card: 'summary_large_image',
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
		},
	};
}

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
						'Cold-pressed, not heat-extracted',
						'No mineral oil, ever',
						'Dermatologically tested',
						'7-days returns',
						'Made in small batches',
						'Cold-pressed, not heat-extracted',
						'No mineral oil, ever',
						'Dermatologically tested',
						'7-days returns',
						'Made in small batches',
					].map((t, i) => (
						<div
							key={i}
							className='mx-4 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] sm:mx-6 sm:tracking-[0.25em]'>
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
							We only make one oil.
							<span className='block text-muted'>So we can make it right.</span>
						</h2>
						<p className='mt-5 text-base leading-relaxed text-muted'>
							Most hair oil brands sell a dozen variants cut with cheap mineral
							oil and silicone, and hope you cannot tell the difference. We make
							one formula, cold-pressed in small batches, and put our name on it.
						</p>
					</div>

					<div className='mt-12 grid grid-cols-1 gap-5 md:grid-cols-3'>
						{[
							{
								k: 'Cold-pressed extraction',
								d: 'Pressed at low temperature so the actives never get cooked out, unlike heat-extracted oils.',
							},
							{
								k: 'Batch traceability',
								d: 'Each bottle is tied to a batch number you can look up. We know exactly when and how it was pressed.',
							},
							{
								k: 'No filler oils',
								d: 'No mineral oil, no synthetic silicones standing in for the real thing.',
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
						<div className='relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface'>
							<Image
								src='https://res.cloudinary.com/dm2cefx8m/image/upload/v1782082474/the-problem_oareuu.png'
								alt='Heavy, heat-extracted hair oil leaving a greasy residue'
								fill
								sizes='(max-width: 768px) 100vw, 50vw'
								className='object-cover'
							/>
						</div>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
								<span className='marker-dot'>The problem</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
								Most hair oils leave a greasy film and call it &ldquo;nourishment.&rdquo;
							</h2>
							<p className='mt-5 text-base leading-relaxed text-muted'>
								Heavy, heat-extracted oils sit on top of your hair instead of
								absorbing into it. Ours was built to do one job — feed dry,
								dull, frizzy hair without the residue you have to wash out the
								next morning.
							</p>
							<ul className='mt-8 space-y-3'>
								{[
									'Cold-pressed at low temperature to protect the actives.',
									'Tested against five leading hair oils, head to head.',
									'Reformulated three times before we agreed to ship it.',
									'Shipped only after a 30-day in-house trial on real hair.',
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
							From cold press to your shelf.
						</h2>
					</div>

					<div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-4'>
						{[
							{
								k: '01',
								t: 'Cold-pressed',
								d: 'Pressed at low temperature, batch sized so every run gets the same care as the prototype.',
							},
							{
								k: '02',
								t: 'Lab-tested',
								d: 'Every batch is sampled and verified for purity before it is bottled.',
							},
							{ k: '03', t: 'Hand-bottled', d: 'Hand-filled and capped in recyclable glass.' },
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
					<div className='mx-auto max-w-2xl text-center'>
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
					<div className='mt-12 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3'>
							{[
								{
									q: 'honestly mujhe zyada umeed nahi thi par 3 hafte hue hain aur takiye pe baal kaafi kam aa rahe hain ab. dekhte hain aage kya hota hai',
									n: 'Sadia R.',
									role: 'Verified buyer',
								},
								{
									q: 'mere baal bht rough thay. ye laga ke ab thore soft lagte hain. start me thora chipchipa lagta hai but raat ko lagao subah dho lo to theek hai',
									n: 'Anum K.',
									role: 'Verified buyer',
								},
								{
									q: 'dandruff ke liye le tha. khujli kaafi kam hui hai sach me. abhi puri tarah gaya to nahi but pehle se behtar hai',
									n: 'Bilal P.',
									role: 'Verified buyer',
								},
								{
									q: 'itni oils try kar chuka hun yaar, koi kaam nahi karti thi. ye pehli baar hai k bottle khatam ki maine. paisa wasool',
									n: 'Hanif Z.',
									role: 'Verified buyer',
								},
								{
									q: 'ammi ke kehne pe mangwaya tha. smell achi hai light si, mujhe pasand aayi. ab ghar me sab use kar rahe',
									n: 'Maryam S.',
									role: 'Verified buyer',
								},
								{
									q: 'thora mehnga laga pehle but bottle kaafi chal jati hai, 2 mahine se upar ho gaye abhi bhi bachi hui hai. thori thori lagani parti hai bas',
									n: 'Usman T.',
									role: 'Verified buyer',
								},
								{
									q: 'shadi ki wajah se start kiya tha. growth ka pata nahi abhi itni jaldi but baal pehle se thore ghane lag rahe hain shayad. continue kar rahi hun',
									n: 'Hira N.',
									role: 'Verified buyer',
									s: 4,
								},
								{
									q: 'delivery me 4 din lage thay but packaging sahi thi leak waghera nahi hua. oil baqi sastay walon jaisa chipchipa nahi hai ye acha hai',
									n: 'Faizan A.',
									role: 'Verified buyer',
								},
								{
									q: 'mere baal patle ho rahe thay. abhi 1 mahina hua hai, thora difference lag raha hai par pura yakeen se nahi keh sakta. update karunga baad me',
									n: 'Komal J.',
									role: 'Verified buyer',
									s: 4,
								},
								{
									q: 'raat ko lagata hun subah dho leta hun. scalp halka feel hota hai. bas dhone me thora effort lagta hai warna theek hai',
									n: 'Ahmed R.',
									role: 'Verified buyer',
									s: 4,
								},
								{
									q: 'was a bit skeptical ngl but after a month my hairfall is def less. texture bhi softer feel hoti hai. happy so far',
									n: 'Zoya M.',
									role: 'Verified buyer',
								},
								{
									q: 'main roz to nahi laga pata, week me 3 4 din laga leta hun. itne me bhi baal pehle se behtar lag rahe hain. khushboo zyada tez nahi hai ye achi baat hai mujhe strong smell pasand nahi',
									n: 'Tariq H.',
									role: 'Verified buyer',
								},
								{
									q: 'split ends ka masla tha bht. thora behtar hua hai. roz lagana parta hai consistency se warna farq nahi parta itna',
									n: 'Nida F.',
									role: 'Verified buyer',
									s: 4,
								},
								{
									q: 'travel ke liye le tha, bottle leak nahi karti bag me. light hai zyada heavy nahi karta baalon ko. ok hai overall',
									n: 'Salman K.',
									role: 'Verified buyer',
									s: 4,
								},
						].map((r) => (
							<figure
								key={r.n}
								className='mb-4 break-inside-avoid rounded-2xl border border-line bg-surface p-6'>
								<div className='flex gap-0.5' aria-hidden>
									{Array.from({ length: 5 }).map((_, i) => (
										<svg
											key={i}
											viewBox='0 0 20 20'
											className={`size-4 fill-current ${
												i < (r.s ?? 5) ? 'text-accent-deep' : 'text-line'
											}`}>
											<path d='M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z' />
										</svg>
									))}
								</div>
								<blockquote className='mt-4 text-sm leading-relaxed text-ink'>
									&ldquo;{r.q}&rdquo;
								</blockquote>
								<figcaption className='mt-5 flex items-center gap-3'>
									<span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm text-accent-ink'>
										{r.n.charAt(0)}
									</span>
									<span className='leading-tight'>
										<span className='block text-sm font-medium text-ink'>
											{r.n}
										</span>
										<span className='block text-xs text-muted'>{r.role}</span>
									</span>
								</figcaption>
							</figure>
						))}
					</div>
				</Container>
			</section>

			<section className='border-t border-line bg-surface py-20'>
				<Container>
					<div className='max-w-3xl'>
						<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
							<span className='marker-dot'>What to expect</span>
						</div>
						<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl'>
							Real results take a little patience.
						</h2>
						<p className='mt-5 text-base leading-relaxed text-muted'>
							No overnight miracles. Here is an honest timeline of what most
							people notice when they use it consistently.
						</p>
					</div>

					<ol className='mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4'>
						{[
							{
								w: 'Week 1',
								t: 'Settling in',
								d: 'Scalp feels calmer and less itchy. Hair is softer and easier to manage straight away.',
							},
							{
								w: 'Week 2–3',
								t: 'Less fall',
								d: 'Most people notice fewer strands on the pillow and in the shower drain.',
							},
							{
								w: 'Week 4–6',
								t: 'Stronger feel',
								d: 'Hair feels thicker to the touch, with less breakage at the ends.',
							},
							{
								w: 'Week 8+',
								t: 'New growth',
								d: 'Baby hairs start showing along the hairline with consistent use.',
							},
						].map((s, i) => (
							<li key={s.w} className='bg-background p-6'>
								<div className='flex items-center gap-3'>
									<span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs text-accent-ink'>
										{i + 1}
									</span>
									<span className='font-mono text-xs uppercase tracking-[0.18em] text-muted'>
										{s.w}
									</span>
								</div>
								<div className='font-display mt-4 text-xl text-ink'>{s.t}</div>
								<p className='mt-2 text-sm leading-relaxed text-muted'>{s.d}</p>
							</li>
						))}
					</ol>

					<p className='mt-6 text-xs text-muted'>
						Everyone&rsquo;s hair is different — some see changes sooner, some
						later. Consistency matters more than quantity.
					</p>
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
								Every bottle ships in recyclable glass, we route freight to
								consolidate carbon, and offset what is left through a verified
								registry.
							</p>
						</div>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
							{[
								{ k: '100%', v: 'Recyclable glass bottle' },
								{ k: '0.4 kg', v: 'CO₂ per shipment' },
								{ k: '100%', v: 'Carbon offset' },
							].map((s) => (
								<div
									key={s.v}
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
					<div className='grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.2fr] md:items-start'>
						<div className='md:sticky md:top-24'>
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
					<div className='grid grid-cols-1 gap-10 md:grid-cols-[1.25fr_1fr] md:items-end'>
						<div>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-background/60'>
								<span className='marker-dot'>Ready when you are</span>
							</div>
							<h2 className='font-display mt-4 text-4xl leading-tight tracking-tight md:text-5xl'>
								Find the formula that fits your routine.
							</h2>
							<p className='mt-4 max-w-lg text-base leading-relaxed text-background/70'>
								Browse the full storefront, compare what is available, and choose
								the product that makes sense for your hair and scalp.
							</p>
							<div className='mt-8 grid max-w-2xl grid-cols-1 gap-4 border-t border-background/15 pt-6 sm:grid-cols-3'>
								{[
									{ k: `${settings.estStandardDays}d`, v: 'Standard shipping' },
									{ k: `${settings.returnsWindowDays}d`, v: 'Returns window' },
									{ k: 'Support', v: 'Before or after you order' },
								].map((s) => (
									<div key={s.v}>
										<div className='font-display text-2xl'>{s.k}</div>
										<div className='mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-background/55 sm:text-xs'>
											{s.v}
										</div>
									</div>
								))}
							</div>
						</div>
						<div className='flex flex-wrap gap-3 md:justify-end'>
							<Button
								href='/shop'
								variant='accent'
								size='lg'>
								Shop products
							</Button>
							<Button
								href='/benefits'
								variant='ghost'
								size='lg'
								className='border border-background/25 !bg-background !text-ink hover:!bg-background/90'>
								Benefits
							</Button>
						</div>
					</div>
				</Container>
			</section>
		</>
	);
}
