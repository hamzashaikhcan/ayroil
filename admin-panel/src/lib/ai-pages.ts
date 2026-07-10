"use server";

import { azureChatJSON, cleanText } from "./ai-azure";
import { adminServerFetch } from "./server-api";

// The store's one public contact address — used verbatim in every generated
// page. Requested by the owner; do not swap in the DB support email.
const CONTACT_EMAIL = "ayroil.pk@gmail.com";

// How many h2 sections each model call writes. Small chunks keep the small
// model focused and thorough; the accumulated draft is passed back so later
// chunks extend the page instead of repeating it.
const SECTIONS_PER_CALL = 3;

export type AiPageKind = "privacy" | "terms" | "shipping" | "returns" | "benefits" | "faqs";

export type GeneratedPage = {
  title: string;
  body: string;
  faqs: { q: string; a: string }[];
};

export type AiPageResult = { ok: true; data: GeneratedPage } | { ok: false; error: string };

type SettingsFacts = {
  siteName: string;
  slogan: string;
  shortDescription: string;
  domain: string;
  phone: string;
  address: string;
  currencyCode: string;
  currencySymbol: string;
  freeShippingEnabled: boolean;
  freeShippingThresholdCents: number;
  standardShippingCents: number;
  estStandardDays: string;
  returnsWindowDays: number;
  companyName: string;
  foundedYear: number;
};

type ProductFacts = {
  name: string;
  tagline: string | null;
  shortDescription: string;
  active: boolean;
};

const BASE_RULES = `BRAND DNA (every page must fit this):
Ayroil is a doctor-guided, scalp-first natural hair oil brand for Pakistani men and women dealing with dry scalp, dandruff-prone hair, weak roots, hair fall concerns, and dull hair. Core idea: "Scalp first. Hair follows." Brand promise: "Healthier scalp. Stronger roots. Better hair days." Dr. Maria is the trust signal: guidance and credibility, never medical claims. Ayroil does not sell panic; it sells a calmer, cleaner, more credible hair care routine. Voice: simple, direct, caring, credible, calm, honest, slightly premium. Sell confidence, never fear.

CLAIM RULES (non-negotiable; Ayroil is a cosmetic hair oil, not a medicine):
SAY things like: helps nourish the scalp; supports stronger-looking hair; helps improve dry and dull hair; made for dandruff-prone scalp care; helps reduce breakage caused by dryness; supports a healthier hair routine; doctor-guided natural hair care; designed for consistent use.
NEVER say: cures dandruff; cures or treats fungal infection; regrows hair; stops hair fall; guaranteed results; 100% results; clinically proven; dermatologist-approved; medical treatment; instant results; works for everyone. Never invent statistics or percentages.
Where scalp problems come up, it is good to note: Ayroil is a cosmetic hair oil, not a medical treatment; for persistent itching, flaking, infection, or severe hair fall, a dermatologist is the right call.

GENERAL RULES:
- Write for the CUSTOMER reading the storefront. Never mention AI, prompts, templates, or missing information.
- Use ONLY the brand facts provided. Never invent numbers (fees, day counts, thresholds), certifications, legal registrations, statistics, or guarantees that are not in the facts.
- The store's only contact email is ${CONTACT_EMAIL}. Use exactly this address wherever readers should reach out. Never invent any other email address.
- NEVER use an em dash ("—") or en dash ("–") anywhere; restructure the sentence, or use a comma, colon, or period instead.
- No emoji. No exclamation points. No marketing clichés ("game-changer", "must-have", "premium quality").
- HTML allowed tags ONLY: h2, h3, p, ul, ol, li, strong, em, br. No images, no links.
- Write full, helpful sentences a real store would publish. Every section needs real substance: at least 2 paragraphs, or a paragraph plus a list with 4 or more items. Aim for 120-180 words per section (short contact sections may be less). An outline or bullet-point notes is a failure.`;

const INGREDIENT_FACTS = `KEY INGREDIENTS (real, use these, never invent others; each has a purposeful role, never a random list): Almond oil (softness, nourishment, and dry hair care), Coconut oil (deep nourishment and traditional conditioning for softer, shinier hair), Pumpkin seed oil (known for root and stronger-looking hair support), Castor oil (traditional root and thickness care), Amla oil (hair strength, shine, and traditional hair care), Black seed oil, kalonji (nourishment and traditional scalp care), Flaxseed oil (smoothness and frizz care for dry, dull lengths), Sesame seed oil (traditional warm-massage nourishment for the scalp), Onion oil (traditionally used in hair fall-prone routines for stronger-looking roots), Mustard seed oil (traditional deep nourishment for scalp and roots), Coriander seed oil (traditionally used for a refreshed, comfortable scalp), Aloe vera oil (scalp soothing and hydration support), Lavender oil (calming scalp comfort and a light natural scent), Shikakai herbal oil (traditional Ayurvedic strengthening care), Reetha herbal oil (gentle, time-tested Ayurvedic cleansing care). Describe each with "traditionally used for" or "known for" framing; never claim any ingredient cures dandruff, infection, or hair loss.`;

type PageSpec = {
  label: string;
  /** Voice and framing guidance included in every chunk. */
  tone: string;
  /** Instruction for the opening paragraphs written with the first chunk (no heading). */
  intro: string;
  /** One instruction per h2 section, written in order across chunked calls. */
  sections: string[];
};

const PAGE_SPECS: Record<Exclude<AiPageKind, "faqs">, PageSpec> = {
  privacy: {
    label: "Privacy Policy",
    tone: "Plain-English and reassuring, not legalese. Honest and modest for a small e-commerce store.",
    intro: "One short opening paragraph: the store respects the reader's privacy, and this page explains what is collected and why, in plain words.",
    sections: [
      "What information is collected: account details customers provide, order and delivery information, payment confirmation, and basic analytics about how the site is used. Be concrete about each.",
      "How that information is used: fulfilling and delivering orders, sending order updates, answering support requests, and improving the store. Tie each use back to something the customer benefits from.",
      "What is never done with personal data: it is not sold or rented to anyone. Explain the limited sharing that does happen (e.g. giving a courier the delivery address) and why it is necessary.",
      "Cookies and analytics: what cookies do on this site (keeping the cart, remembering sessions, basic anonymous usage stats) and that customers can control cookies in their browser.",
      "Data security and retention: reasonable technical measures, data kept only as long as needed for orders, support, and legal record keeping.",
      "The customer's choices and rights: they can ask to see, correct, or delete their data by emailing the store, and can ask questions about anything in this policy.",
      "Contact: how to reach the store about privacy, with the email address. This section may be short.",
    ],
  },
  terms: {
    label: "Terms of Service",
    tone: "Clear, firm, and fair, in plain English. Do NOT invent a governing-law jurisdiction, company registration numbers, or arbitration clauses.",
    intro: "One short opening paragraph: using the store and placing an order means agreeing to these terms; they exist to keep things fair and clear for both sides.",
    sections: [
      "Acceptance of these terms and who they apply to, including that continued use of the site means acceptance of the current version.",
      "Products and order acceptance: orders may be refused or cancelled in rare cases such as stock issues or obvious pricing errors, and the customer is informed and refunded when that happens. Product photos are accurate but minor variations can occur.",
      "Pricing and payment: prices are shown in the store currency from the facts, what the price includes, and that the total (including any shipping fee) is shown before the order is confirmed.",
      "Shipping and delivery: summarize the delivery time, fee, and free shipping rules using EXACTLY the numbers from the facts, and refer readers to the shipping policy page for full details.",
      "Returns and refunds: summarize the return window using EXACTLY the day count from the facts and refer readers to the returns page for the full process.",
      "Product use disclaimer: this is a cosmetic hair-care product for external use only; results vary from person to person; a patch test is recommended; discontinue use if irritation occurs. No medical claims.",
      "Intellectual property: the site's content, branding, and images belong to the brand and may not be copied for commercial use.",
      "Limitation of liability in reasonable plain terms: the store is responsible for delivering what was ordered, and its liability is limited to the amount paid for the order.",
      "Changes to these terms: the store may update them, the current version always lives on this page, and significant changes apply to new orders.",
      "Contact: how to reach the store about these terms, with the email address. This section may be short.",
    ],
  },
  shipping: {
    label: "Shipping Policy",
    tone: "Friendly and factual, answering every question a customer could have about delivery so they never need to email. Do not invent courier names, tracking systems, or international shipping rules.",
    intro: "One short opening paragraph: every order is packed carefully and dispatched quickly, and this page explains exactly what to expect from checkout to doorstep.",
    sections: [
      "Order processing: orders are prepared and dispatched promptly after confirmation, what happens right after checkout (confirmation), and anything the customer should double-check (delivery address and phone number).",
      "Delivery time: use EXACTLY the estimated days from the facts, explain the estimate counts from dispatch, and that remote areas can take slightly longer.",
      "Shipping cost: use EXACTLY the fee and free-shipping rules from the facts, spelling out the currency amounts, and make the free-shipping condition impossible to misread.",
      "Knowing your order is on the way: order confirmation and delivery updates, and that customers can email anytime for a status check.",
      "Late, lost, or damaged deliveries: what to do if the package is late, arrives damaged, or does not arrive, including contacting the store with the order number. Make it reassuring: the store makes it right.",
      "Contact: how to reach the store about a delivery, with the email address. This section may be short.",
    ],
  },
  returns: {
    label: "Returns & Refunds",
    tone: "Reassuring and clear, so a hesitant buyer feels safe ordering. Do not invent restocking fees, return shipping rules, or address details.",
    intro: "One short opening paragraph: the store wants customers to feel completely safe ordering, and returns are simple and honest.",
    sections: [
      "The return window: use EXACTLY the day count from the facts, counted from the day the order is delivered, and encourage customers to reach out within that window.",
      "What is eligible for return: unused or lightly used product in its original packaging, and damaged, defective, or wrong items are ALWAYS covered regardless.",
      "How to start a return: email the store with the order number and the reason, what to include (a photo if the item arrived damaged), and what happens next step by step.",
      "Refunds: issued after the return is received and checked, back to the original payment method or as agreed with the customer, and roughly when to expect confirmation.",
      "Exchanges: damaged or incorrect items are replaced, and how that process works.",
      "Contact: how to reach the store about a return, with the email address. This section may be short.",
    ],
  },
  benefits: {
    label: "Benefits",
    tone: `Calm, caring, confident marketing voice talking directly to the shopper ("you", "your scalp", "your hair"). Bold the phrases that matter. This page is read by shoppers and search engines, so depth matters, but every claim must stay within the claim rules. ${INGREDIENT_FACTS}`,
    intro: `A hook of 2-3 paragraphs built on the brand's core insight, calm and confident, never fear-driven: "Hair fall is not always about your hair. Sometimes your scalp needs care first." Name the reader's real concerns (dry scalp, dandruff-prone hair, weak roots, hair fall stress, dull hair), present Ayroil as the doctor-guided, scalp-first answer, and say in one line what makes it different from oils that only chase length and shine.`,
    sections: [
      "Why scalp first: own the core idea. Dryness, buildup, and a dandruff-prone scalp can make hair look dull and fragile, yet most oils ignore the scalp entirely. Explain how Ayroil's scalp-first approach is different, and how Dr. Maria's guidance shapes it: purposeful ingredients and a realistic routine, not miracle promises.",
      'The key benefits: a rich ul built around the four product pillars, each bullet starting with a short phrase in strong: "Scalp Nourishment", "Root Strength Support", "Dryness Care", "Natural Shine", plus 2-3 more claim-safe outcomes (dandruff-prone scalp care, less breakage from dryness, a simpler routine). Each followed by 1-2 full sentences on how the oil delivers it.',
      "The key ingredients: ALL FIFTEEN from the ingredient facts, each in strong with 1-2 sentences on its purposeful role, using traditionally-known-for framing.",
      "Who it is for: address several concerns individually (dry or itchy-feeling scalp, dandruff-prone hair, hair fall stress and weak roots, dryness and frizz, dull tired-looking hair), a sentence or two each, always reassuring, never shaming.",
      "How to use it, the Ayroil routine: numbered steps (apply a small amount directly to the scalp, massage gently for 3-5 minutes, leave in for a few hours or overnight, wash as usual), 2-3 times a week, and why the scalp massage matters more than coating the lengths.",
      "What to expect with consistency: an honest, realistic arc (first weeks: the scalp feels nourished and hair softer; over the following weeks: hair looks and feels healthier and stronger; results vary from person to person, consistency is what counts). Include the gentle note that Ayroil is a cosmetic hair oil, and persistent scalp concerns belong with a dermatologist. Close with one calm sentence inviting the reader to start their scalp-first routine.",
    ],
  },
};

const FAQS_BRIEF = `Write 10-12 site-wide FAQs for the storefront. Cover the questions real shoppers ask before buying: what Ayroil is and the scalp-first idea behind it, how to use it and how often (small amount on the scalp, gentle 3-5 minute massage, leave a few hours or overnight, 2-3 times a week), when to expect visible change (honest: consistent use over weeks, results vary), whether it suits different hair and scalp types, what is inside and why each ingredient is there, whether it feels greasy, what "doctor-guided" means (guidance and credibility, not a medical claim), shipping time and cost using EXACTLY the facts, the return window using EXACTLY the day count from the facts, how to start a return or reach support (use the contact email), and one FAQ for persistent scalp concerns whose answer notes Ayroil is a cosmetic hair oil, not a medical treatment, and recommends a dermatologist for persistent itching, flaking, infection, or severe hair fall. Each answer MUST be 3-5 full sentences that genuinely resolve the question, calm, specific, and reassuring, never salesy, never inventing claims; one-line answers are a failure. Order them from most to least important for a first-time buyer.
${INGREDIENT_FACTS}`;

function money(cents: number, symbol: string, code: string): string {
  const whole = Math.round(cents / 100);
  return `${symbol} ${whole.toLocaleString("en-US")} ${code}`;
}

function buildFacts(s: SettingsFacts, products: ProductFacts[]): string {
  const active = products.filter((p) => p.active);
  const lines = [
    `Brand: ${s.siteName}${s.slogan ? ` (${s.slogan})` : ""}`,
    s.shortDescription ? `About the brand: ${s.shortDescription}` : null,
    s.companyName ? `Company name: ${s.companyName}` : null,
    s.foundedYear ? `Founded: ${s.foundedYear}` : null,
    s.domain ? `Website: ${s.domain}` : null,
    `Contact email: ${CONTACT_EMAIL}`,
    s.phone ? `Phone: ${s.phone}` : null,
    s.address ? `Address: ${s.address}` : null,
    `Currency: ${s.currencyCode} (${s.currencySymbol})`,
    `Standard delivery time: ${s.estStandardDays} days`,
    s.freeShippingEnabled
      ? `Shipping cost: FREE on every order`
      : `Shipping cost: ${money(s.standardShippingCents, s.currencySymbol, s.currencyCode)} standard; FREE on orders over ${money(s.freeShippingThresholdCents, s.currencySymbol, s.currencyCode)}`,
    `Return window: ${s.returnsWindowDays} days from delivery`,
    active.length
      ? `Products sold:\n${active.map((p) => `- ${p.name}${p.tagline ? ` (${p.tagline})` : ""}${p.shortDescription ? `: ${p.shortDescription}` : ""}`).join("\n")}`
      : null,
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\n");
}

function parseJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function loadFacts(): Promise<{ settings: SettingsFacts; facts: string } | null> {
  try {
    const [settings, products] = await Promise.all([
      adminServerFetch<SettingsFacts>("/settings"),
      adminServerFetch<ProductFacts[]>("/products?all=1"),
    ]);
    return { settings, facts: buildFacts(settings, products) };
  } catch {
    return null;
  }
}

async function generateFaqs(siteName: string, facts: string): Promise<AiPageResult> {
  const system = `You are the copywriter for ${siteName}, a small e-commerce store selling a natural Ayurvedic hair oil.

${BASE_RULES}

Return ONLY a JSON object, no markdown fences, no commentary: { "faqs": [{"q": string, "a": string}] } with 10-12 entries.`;

  const user = `${FAQS_BRIEF}

BRAND FACTS (the only source of truth for names, numbers, and contact details):
${facts}`;

  const result = await azureChatJSON({ system, user });
  if (!result.ok) return result;
  const parsed = parseJson(result.raw);
  if (!parsed) return { ok: false, error: "Could not parse the AI response. Please try again." };

  const faqsRaw = Array.isArray(parsed.faqs) ? parsed.faqs : [];
  const faqs = faqsRaw
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      return { q: cleanText(o.q), a: cleanText(o.a) };
    })
    .filter((f) => f.q && f.a)
    .slice(0, 12);

  if (faqs.length === 0) return { ok: false, error: "The AI returned no usable content. Please try again." };
  return { ok: true, data: { title: "", body: "", faqs } };
}

/**
 * Pages are written in chunks: each call writes SECTIONS_PER_CALL h2 sections
 * and receives everything already written as reference, so the small model
 * gives every section real depth without repeating earlier content.
 */
async function generateRichPage(page: Exclude<AiPageKind, "faqs">, siteName: string, facts: string): Promise<AiPageResult> {
  const spec = PAGE_SPECS[page];
  const batches = chunk(spec.sections, SECTIONS_PER_CALL);

  let title = "";
  let body = "";

  for (let i = 0; i < batches.length; i++) {
    const first = i === 0;
    const batch = batches[i];

    const system = `You are the copywriter for ${siteName}, a small e-commerce store selling a natural Ayurvedic hair oil. You are writing the storefront's "${spec.label}" page one part at a time.

TONE FOR THIS PAGE: ${spec.tone}

${BASE_RULES}

Return ONLY a JSON object, no markdown fences, no commentary, with exactly these keys:
${
  first
    ? `{ "title": string, "intro": string, "sections": string[] }   // title: the page H1, short and plain (e.g. "${spec.label}"); intro: opening paragraph(s) as HTML <p> only, NO heading; sections: one HTML string per requested section, in order, each starting with its <h2>`
    : `{ "sections": string[] }   // one HTML string per requested section, in order, each starting with its <h2>`
}`;

    const already = body
      ? `\nALREADY WRITTEN (for reference only, do NOT repeat, rephrase, or summarize any of this content; your new sections must only add NEW information):\n${body}\n`
      : "";

    const user = `BRAND FACTS (the only source of truth for names, numbers, and contact details):
${facts}
${already}
${first ? `Write the page title, the intro (${spec.intro}), and then` : "Continue the page. Write"} the following ${batch.length} section${batch.length === 1 ? "" : "s"}, fully and in this order:
${batch.map((s, n) => `${n + 1}. ${s}`).join("\n")}`;

    const result = await azureChatJSON({ system, user });
    if (!result.ok) return result;
    const parsed = parseJson(result.raw);
    if (!parsed) return { ok: false, error: "Could not parse the AI response. Please try again." };

    if (first) {
      title = cleanText(parsed.title) || spec.label;
      const intro = cleanText(parsed.intro);
      if (intro) body += intro;
    }
    const sections = Array.isArray(parsed.sections) ? parsed.sections.map((s) => cleanText(s)).filter(Boolean) : [];
    if (sections.length === 0) {
      return { ok: false, error: "The AI returned no usable content. Please try again." };
    }
    body += (body ? "\n" : "") + sections.join("\n");
  }

  if (!body) return { ok: false, error: "The AI returned no usable content. Please try again." };
  return { ok: true, data: { title, body, faqs: [] } };
}

export async function generatePageCopy(page: AiPageKind): Promise<AiPageResult> {
  const loaded = await loadFacts();
  if (!loaded) {
    return { ok: false, error: "Could not load store settings from the backend. Is it running?" };
  }
  const { settings, facts } = loaded;

  return page === "faqs"
    ? generateFaqs(settings.siteName, facts)
    : generateRichPage(page, settings.siteName, facts);
}
