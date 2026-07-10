import bcrypt from "bcryptjs";
import { ROLES, SITE } from "@consts";
import { AppDataSource } from "./data-source.js";
import { ENV } from "./config/env.js";
import { User } from "./entities/User.js";
import { Product } from "./entities/Product.js";
import { Review } from "./entities/Review.js";
import { SiteSettings } from "./entities/SiteSettings.js";

/**
 * Launch reviews seeded once (only while the reviews table is empty) onto the
 * primary product, so the storefront and its Product JSON-LD have review
 * content from day one. Fully manageable afterwards from the admin Reviews
 * page (hide/delete), like any other review.
 */
const SEED_REVIEWS: Array<Pick<Review, "rating" | "comment" | "customerName"> & { createdAt: string }> = [
  {
    rating: 5,
    comment:
      "Mujhe khushki ka bohat masla tha, 3 hafte use karne ke baad scalp kaafi behtar feel hota hai. Oil bilkul greasy nahi hai aur smell bhi halki hai.",
    customerName: "Ahmed Raza",
    createdAt: "2026-06-28T14:20:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Baal pehle bohat rukhay aur bejaan thay. Ab kaafi soft aur shiny lagte hain. Hafte mein 2 dafa lagati hoon, results ke liye consistency zaroori hai.",
    customerName: "Fatima Khan",
    createdAt: "2026-06-15T09:05:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Hair fall kaafi kam mehsoos ho raha hai kuch haftoon ke istemaal ke baad. Massage karne ke baad scalp fresh feel hota hai. Order bhi jaldi deliver ho gaya.",
    customerName: "Muhammad Bilal",
    createdAt: "2026-06-02T18:40:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Sar mein kharish aur khushki rehti thi, is oil se bohat aaram mila. Raat ko laga kar subah dho leti hoon, bilkul chip chipa nahi lagta.",
    customerName: "Ayesha Siddiqui",
    createdAt: "2026-05-19T11:30:00.000Z",
  },
  {
    rating: 4,
    comment:
      "Acha oil hai, baal soft ho gaye hain aur khushki bhi kam hui hai. Thora patla hai isliye 4 star, lekin overall quality achi hai.",
    customerName: "Hassan Ali",
    createdAt: "2026-05-06T16:10:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Doctor-guided formula parh kar try kiya tha. Do mahine se use kar rahi hoon, baal pehle se ghanay aur healthy lagte hain. Family ko bhi recommend kiya hai.",
    customerName: "Zainab Malik",
    createdAt: "2026-04-22T08:55:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Pehli dafa koi hair oil pura use kiya. Halka hai, jaldi absorb hota hai aur dhona bhi asaan hai. Scalp ki dryness khatam ho gayi.",
    customerName: "Usman Sheikh",
    createdAt: "2026-04-08T20:15:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Onion aur kalonji wale oils pehle alag alag use karti thi, is mein sab kuch ek hi bottle mein mil gaya. Baal kam tootte hain ab.",
    customerName: "Maria Iqbal",
    createdAt: "2026-03-25T13:45:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Genuine product hai. Smell strong nahi hai jo mere liye plus point hai. 6 hafton mein baal behtar aur mazboot mehsoos hote hain.",
    customerName: "Abdul Rehman",
    createdAt: "2026-03-11T10:25:00.000Z",
  },
  {
    rating: 5,
    comment:
      "Delivery time par hui aur packing achi thi. Oil use karne ke baad scalp par sukoon milta hai, khaas kar sardiyon ki khushki mein. Zaroor try karein.",
    customerName: "Sana Tariq",
    createdAt: "2026-02-26T17:35:00.000Z",
  },
];

export async function runSeeds(): Promise<void> {
  const users = AppDataSource.getRepository(User);
  const products = AppDataSource.getRepository(Product);
  const settings = AppDataSource.getRepository(SiteSettings);

  // Site settings — one row, seeded from consts/index.ts on first boot.
  const settingsCount = await settings.count();
  if (settingsCount === 0) {
    await settings.save(
      settings.create({
        siteName: SITE.siteName,
        slogan: SITE.slogan,
        shortDescription: SITE.shortDescription,
        longDescription: SITE.longDescription,
        iconUrl: SITE.iconUrl,
        whiteLogoUrl: SITE.whiteLogoUrl,
        darkLogoUrl: SITE.darkLogoUrl,
        ogImageUrl: SITE.ogImageUrl,
        domain: SITE.domain,
        supportEmail: SITE.supportEmail,
        salesEmail: SITE.salesEmail,
        phone: SITE.phone,
        address: SITE.address,
        social: { ...SITE.social },
        brand: { ...SITE.brand },
        currencyCode: SITE.currency.code,
        currencySymbol: SITE.currency.symbol,
        currencyLocale: SITE.currency.locale,
        freeShippingThresholdCents: SITE.shipping.freeShippingThresholdCents,
        standardShippingCents: SITE.shipping.standardCostCents,
        estStandardDays: SITE.shipping.estStandardDays,
        returnsWindowDays: SITE.returns.windowDays,
        returnsPolicyUrl: SITE.returns.policyUrl,
        productTimerEnabled: false,
        productTimerDurationSeconds: 300,
        productTimerDiscountPercent: 10,
        productTimerMessage: "Offer ends in",
        companyName: SITE.legal.companyName,
        foundedYear: SITE.legal.foundedYear,
        taxId: SITE.legal.taxId,
        pageCopy: {},
        heroEyebrow: `A single-product brand · Est. ${SITE.legal.foundedYear}`,
        heroTitle: SITE.siteName,
        heroSubtitle: SITE.slogan,
        heroDescription: SITE.shortDescription,
        heroImageUrl: "",
        heroPrimaryCtaLabel: "Shop now",
        heroPrimaryCtaHref: "/shop",
        heroSecondaryCtaLabel: "Read the spec",
        heroSecondaryCtaHref: "/shop",
        benefitsTitle: `Benefits`,
        benefitsBody: `<p>${SITE.longDescription}</p>`,
        faqs: [
          { q: "How long does shipping take?", a: `Standard shipping arrives in ${SITE.shipping.estStandardDays} business days.` },
          { q: "What is your return policy?", a: "Returns are accepted within 30 days of delivery, full refund, no questions asked." },
          { q: "Do you ship internationally?", a: "Right now we ship within the country only. We're working on international shipping." },
        ],
        termsTitle: "Terms of Service",
        termsBody: `<p>These terms govern your use of ${SITE.siteName}. By placing an order or browsing this site, you agree to be bound by them.</p><h2>1. Orders</h2><p>All orders are subject to acceptance and availability.</p><h2>2. Pricing</h2><p>Prices may change without notice; the price on your order confirmation is the final price.</p><h2>3. Liability</h2><p>To the fullest extent permitted by law, ${SITE.legal.companyName} is not liable for indirect or consequential damages.</p><p><em>This is placeholder copy — edit it from the admin Settings → Terms page.</em></p>`,
        privacyTitle: "Privacy Policy",
        privacyBody: `<p>${SITE.siteName} respects your privacy. This policy describes what we collect and how we use it.</p><h2>What we collect</h2><p>Account information you provide (email, name, address), order history, and basic usage analytics.</p><h2>How we use it</h2><p>To fulfill orders, send order updates, and improve the product. We don't sell personal information.</p><h2>Your rights</h2><p>You can request a copy of your data or its deletion at any time by emailing ${SITE.supportEmail}.</p><p><em>This is placeholder copy — edit it from the admin Settings → Privacy page.</em></p>`,
        shippingPolicyTitle: "Shipping Policy",
        shippingPolicyBody: `<p>We ship every order from our ${(SITE.address as string).split(",").slice(-1)[0]?.trim() || "warehouse"} location.</p><h2>Methods & timing</h2><ul><li><strong>Standard shipping:</strong> ${SITE.shipping.estStandardDays} business days.</li><li>Orders over ${SITE.currency.symbol}${(SITE.shipping.freeShippingThresholdCents / 100).toFixed(0)} ship free.</li></ul><h2>Processing time</h2><p>Most orders ship within 1 business day. You'll get a tracking email the moment we hand it to the carrier.</p><h2>International orders</h2><p>If we ship to your country, import duties may apply at delivery — those are the recipient's responsibility.</p><p><em>This is placeholder copy — edit it from the admin Settings → Shipping page.</em></p>`,
        returnsPolicyTitle: "Returns & Refunds",
        returnsPolicyBody: `<p>We want you to be happy with your order. If something's not right, here's how returns work.</p><h2>Return window</h2><p>You have <strong>${SITE.returns.windowDays} days</strong> from delivery to request a return.</p><h2>What's eligible</h2><ul><li>Unopened items in their original packaging.</li><li>Defective or damaged items — we'll send a replacement or refund.</li></ul><h2>How to start a return</h2><p>Email <a href="mailto:${SITE.supportEmail}">${SITE.supportEmail}</a> with your order number and a sentence about what's wrong. We'll send a prepaid label.</p><h2>Refunds</h2><p>Refunds land on the original payment method within 5–10 business days of us receiving your return.</p><p><em>This is placeholder copy — edit it from the admin Settings → Returns page.</em></p>`,
      }),
    );
    console.log(`[seed] Seeded SiteSettings from consts/index.ts`);
  } else {
    const existingSettings = await settings.findOne({ where: {}, order: { createdAt: "ASC" } });
    if (
      existingSettings &&
      (!existingSettings.productTimerMessage ||
        existingSettings.productTimerMessage === "Your cart price is reserved for" ||
        existingSettings.productTimerMessage === "Buy before the timer ends to claim this discount")
    ) {
      existingSettings.productTimerMessage = "Offer ends in";
      await settings.save(existingSettings);
      console.log(`[seed] Updated product timer message default`);
    }
  }

  const existing = await users.findOne({ where: { email: ENV.seed.adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(ENV.seed.adminPassword, 10);
    await users.save(
      users.create({
        email: ENV.seed.adminEmail,
        name: "Admin",
        passwordHash,
        role: ROLES.ADMIN,
        emailVerified: true,
      }),
    );
    console.log(`[seed] Created admin user: ${ENV.seed.adminEmail}`);
  }

  const productCount = await products.count();
  if (productCount === 0) {
    await products.save(
			products.create({
				slug: 'product-one',
				name: 'Product One',
				tagline: 'Built with intent.',
				shortDescription:
					'Our first product — engineered around a single problem and one quiet promise.',
				longDescription:
					"Product One is the first thing we've ever made for sale. It came out of two years of testing, a pile of rejected prototypes, and a stubborn opinion about how a single product should feel in someone's hands.",
				priceCents: 2400,
				compareAtCents: 2900,
				costCents: 900,
				stock: 250,
				sku: 'PO-001',
				active: true,
				images: [],
				highlights: [
					'Engineered around one job',
					'Designed and built in Brooklyn',
					'7-days return window',
					'Carbon-neutral shipping',
				],
				ingredients: [
					{
						name: 'Active 01',
						description:
							'The core compound that does the actual work — measured and verified per batch.',
					},
					{
						name: 'Active 02',
						description:
							'Stabilizes the formula and keeps it shelf-stable without preservatives.',
					},
					{
						name: 'Carrier',
						description:
							'A gentle base that helps the actives reach where they need to go.',
					},
				],
				faqs: [
					{
						q: 'How long does one bottle last?',
						a: 'Used as directed, one bottle covers about 30 days of regular use.',
					},
					{
						q: 'Is it safe for sensitive skin / sensitive teeth?',
						a: "Yes — it's formulated without sulfates, parabens, or artificial dyes.",
					},
					{
						q: 'Where is it made?',
						a: "Brooklyn, NY. Every batch is hand-finished and QA'd in-house.",
					},
					{
						q: "What's your return policy?",
						a: `30 days, full refund, no questions. Email ${SITE.supportEmail}.`,
					},
				],
			}),
		);
    console.log(`[seed] Created placeholder product: product-one`);
  }

  // Launch reviews — only while the reviews table is empty, attached to the
  // primary product (same ordering the storefront uses to pick it).
  const reviews = AppDataSource.getRepository(Review);
  const reviewCount = await reviews.count();
  if (reviewCount === 0) {
    const primaryProduct = await products
      .createQueryBuilder("p")
      .where("p.active = true")
      .orderBy("p.sortOrder", "ASC", "NULLS LAST")
      .addOrderBy("p.createdAt", "DESC")
      .getOne();
    if (primaryProduct) {
      await reviews.save(
        SEED_REVIEWS.map((r) =>
          reviews.create({
            order: null,
            product: primaryProduct,
            rating: r.rating,
            comment: r.comment,
            customerName: r.customerName,
            visible: true,
            createdAt: new Date(r.createdAt),
          }),
        ),
      );
      console.log(`[seed] Created ${SEED_REVIEWS.length} launch reviews for: ${primaryProduct.slug}`);
    }
  }
}
