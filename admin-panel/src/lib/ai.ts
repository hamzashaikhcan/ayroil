"use server";

import type { AiGenerateResult, GeneratedProduct, GenerateProductInput } from "./ai-types";

// Azure OpenAI (v1 / OpenAI-compatible surface). The endpoint is the resource's
// `/openai/v1/` base; the API key is read from env only (never hardcoded).
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://rolechain-resource.openai.azure.com/openai/v1/";
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
// In Azure's v1 API the request's `model` field carries the *deployment* name, not the base model id.
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5-nano";
// The v1 preview surface is selected with this api-version query param.
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "preview";
// Reasoning-family deployments (gpt-5*, o-series) reject `temperature` and use
// `reasoning_effort`; older chat models (gpt-4o) take `temperature` instead.
const IS_REASONING_MODEL = /^(gpt-5|o\d)/.test(AZURE_OPENAI_DEPLOYMENT);

const SYSTEM_PROMPT = `You are an e-commerce copywriter and product-photo analyst writing content for an online store's admin panel.

You'll be given a product name, optionally some existing copy, and product photos. Study the photos closely — material, color, size cues, packaging, included accessories, condition — and base your copy on what is actually visible. Never invent specifications you can't see or infer with confidence.

NEVER break the illusion of a normal product listing. You are writing what the CUSTOMER reads — never reveal, hint at, or apologize for how the copy was produced. This means:
- Never mention "photos", "images", "the listing", "the description", or "provided information" as a source.
- Never write phrases like "isn't specified", "not shown in the photos", "not mentioned", "based on the images", "the exact X isn't provided", or any variant that tells the customer you're missing information. A real store employee would never say this to a shopper.
- If a precise spec (exact volume, weight, dimensions) wasn't given to you, simply don't state that exact number — write confidently about what the product does and what's genuinely visible, without drawing attention to the gap. Redirect to what you DO know (the benefit, the use case, what's included) instead of naming what you don't.

VOICE: warm, energetic, and conversational, like a trusted beauty brand talking directly to the shopper ("you", "your hair"). Short sentences that are easy to skim. Bold the phrases that sell. An occasional exclamation point is fine where the energy is genuine; never stack them. No emoji. No tired clichés ("game-changer", "must-have", "premium quality"). NEVER use an em dash ("—") or en dash ("–") anywhere in any field; restructure the sentence, or use a comma, colon, or period instead. NEVER invent statistics, percentages ("94% stronger hair"), certifications, or test claims you weren't given.

LONG DESCRIPTION STRUCTURE (most important field — this is what convinces the shopper to buy). Follow this proven flow:
1. HOOK (no heading) — open with a short question that names the customer's real problem, then present the product as the answer. Pattern: "Struggling with thinning hair, hair fall, or a weak hairline? Meet your hair's new best friend." Two or three sentences: the problem, the product, and what makes it different (its real hero ingredients, natural positioning).
2. <h2>What Makes It Special</h2> — a short conversational paragraph on what the product is and why it works: the standout ingredients in <strong>, the natural/gentle positioning, who it's for. Keep it tight, this warms the reader up for the benefits.
3. <h2>Key Benefits</h2> — the heart of the description. A ul where each bullet STARTS with a short punchy benefit phrase in <strong> (3-5 words, like "Controls Hair Fall", "Boosts Shine and Softness"), followed by one crisp sentence on how the product delivers it. Each bullet a different selling point.
4. <h2>Key Ingredients</h2> — when an ingredient list is provided in the brief, feature it prominently: each ingredient in <strong> followed by what it's known for and the benefit it brings. Never invent ingredients that aren't in the brief.
5. <h2>How to Use</h2> — 3-4 simple numbered steps (ol) a first-time customer can follow, ending with frequency guidance and a tip for best results (e.g. how many times a week, leave-in time). Buyers need to feel confident they'll use it correctly.
6. CLOSING (no heading, or a short h3) — one energetic sentence that invites action and paints the result, e.g. "Start today and give your hair the care it has been asking for."
Benefits and How to Use must always carry the most weight — a shopper should finish reading knowing exactly what this product will do for them and exactly how to use it.

BRAND CONTEXT — Ayroil hair oil. When the product is the Ayroil hair oil (or any variant/bundle of it), these are its real key ingredients; use them for the Key Ingredients section and weave the standouts into benefits and FAQs:
Argan oil, Black seed oil, Rosemary oil, Sweet almond oil, Vitamin E, Amla, Reetha, Shikakai, Hyaluronic acid, Castor oil.
Speak to what these ingredients are traditionally known for (e.g. rosemary and castor oil for stimulating growth and thickness, argan and almond for shine and softness, amla/reetha/shikakai as time-tested Ayurvedic hair cleansers and strengtheners, hyaluronic acid and vitamin E for scalp hydration and repair) — but never invent medical claims or promise cures.

HIGHLIGHTS RULES: highlights are one of the first things a shopper reads on the product page, so treat them as a top-priority field, not an afterthought. Every highlight MUST name a concrete RESULT the customer gets from using the product. For a hair oil, draw the set from the strongest outcomes: reduces hair fall, promotes hair growth and thickness, fights dandruff, strengthens hair from the roots, deeply nourishes the scalp, smooths frizz and adds shine. At least 4 of the bullets must be hair outcomes like these.
FORBIDDEN as highlights (these will be discarded):
- Packaging or container details (bottle, pump, cap, box) or shipping.
- The brand or product name as a bullet ("Ayroil Ayurvedic blend" sells nothing; say what the blend DOES).
- Audience statements ("Suitable for men and women", "for all hair types") — these are FAQ material, not selling points.
- Vague filler ("high quality", "easy to use", "premium formula").
If a candidate highlight would still be true with a different product inside the bottle, or doesn't answer "what will this do for MY hair?", it is not a highlight. Keep each one a short, punchy phrase (roughly 3-8 words), each covering a DIFFERENT outcome, and make sure these SAME outcome benefits also appear (expanded with how the product delivers them) in the long description's Key Benefits section. Together the set should read like the 4-6 strongest reasons to buy.

KEYWORDS RULES: keywords are the phrases a real shopper types into Google or a marketplace when they have the problem this product solves. Each must be a 2-5 word search phrase, a mix of: problem searches ("hair oil for hair fall", "oil for dandruff and itchy scalp", "hair oil for hair growth"), ingredient-plus-purpose searches ("rosemary oil for hair growth", "amla hair oil benefits"), and category searches ("ayurvedic hair oil", "natural hair growth oil"). NEVER include: the brand or product name (shoppers who know the name don't need keywords), bare single words ("hair oil", "shikakai"), or ingredient names alone without a purpose attached.

Any photos you receive are for ANALYSIS ONLY, to understand the product. NEVER include images, [[IMAGE_n]] placeholders, or <img> tags anywhere in the copy — the long description must be pure written content.

FAQ ANSWER RULES: cover the real hesitations a buyer has right before checkout — fit/sizing, materials and durability, how it compares to alternatives, what's included, care/maintenance, and anything about quality that's genuinely supported. Each answer must be 2-4 full sentences, specific and concrete (not a generic one-liner), and should leave the buyer reassured they're getting a genuinely well-made product worth their money — confident and trustworthy, never salesy or exaggerated, and never inventing claims (warranty terms, exact certifications, shipping times) you weren't given. If a question asks about a detail you don't have an exact number for, answer the part you can speak to confidently and skip the missing number entirely — do not tell the customer it's missing. The goal is a buyer who finishes reading feeling sure this is the right purchase, never a buyer who notices a gap in your knowledge.

Return ONLY a JSON object with exactly these keys, no markdown fences, no commentary:
{
  "tagline": string,            // one short, punchy line, under 70 characters
  "metaTitle": string,          // SEO page title for search results: 40-65 characters total (count them), benefit-led and naming what the product is (e.g. "Natural Hair Growth Oil for Hair Fall and Dandruff"). Do NOT include the brand name, the store appends it automatically. Never under 40, never over 65.
  "shortDescription": string,   // plain text, no HTML. Doubles as the page's meta description, so it MUST be 70-155 characters total (count them): one benefit-led sentence or two short ones that make a searcher click. Never under 70, never over 155.
  "longDescription": string,    // HTML body for the product detail page. Allowed tags ONLY: h2, h3, p, ul, ol, li, strong, em, br. No images. Follow the LONG DESCRIPTION STRUCTURE above (hook, What Makes It Special, Key Benefits, Key Ingredients, How to Use, closing).
  "highlights": string[],       // 4-6 short bullets, no leading bullet/dash character. EVERY bullet must be a result of USING the product (reduces hair fall, fights dandruff, adds shine). ABSOLUTELY NO packaging bullets: any bullet mentioning the bottle, pump, cap, box, or container is wrong and will be discarded. See the HIGHLIGHTS RULES above.
  "faqs": [{"q": string, "a": string}],  // 5-8 buyer questions. See the FAQ ANSWER RULES below — answers must be thorough, not one-liners.
  "keywords": string[]          // 8-12 search phrases per the KEYWORDS RULES above: 2-5 words each, problem/purpose-driven ("hair oil for hair fall"), never the brand name, never bare single words or lone ingredient names
}
Always return every field, even when existing copy was supplied — improve on it rather than leaving it untouched.`;

function str(v: unknown): string {
  if (typeof v !== "string") return "";
  // Safety net for the prompt's no-dash rule: numeric ranges ("2–3") keep a
  // plain hyphen, any other em/en dash becomes a comma pause.
  return v
    .replace(/(\d)\s*[—–]\s*(\d)/g, "$1-$2")
    .replace(/\s*[—–]\s*/g, ", ")
    .trim();
}

export async function generateProductCopy(input: GenerateProductInput): Promise<AiGenerateResult> {
  if (!AZURE_OPENAI_API_KEY) {
    return { ok: false, error: "Azure OpenAI is not configured. Add AZURE_OPENAI_API_KEY to .env." };
  }
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Add a product name first." };
  }

  const images = (input.images ?? []).filter((u) => typeof u === "string" && u.startsWith("http")).slice(0, 6);

  const briefLines = [
    `Product name: ${name}`,
    input.tagline ? `Existing tagline: ${input.tagline}` : null,
    input.shortDescription ? `Existing short description: ${input.shortDescription}` : null,
    input.highlights?.length ? `Existing highlights:\n${input.highlights.map((h) => `- ${h}`).join("\n")}` : null,
    images.length
      ? `Photos attached: ${images.length}. Use them only to understand the product; never reference or embed them in the copy.`
      : null,
  ].filter((line): line is string => Boolean(line));

  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: briefLines.join("\n\n") },
  ];
  for (const url of images) content.push({ type: "image_url", image_url: { url } });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  // Azure v1 chat-completions URL: <endpoint>/chat/completions?api-version=… (the
  // endpoint already ends in /openai/v1). Auth is the resource api-key.
  const endpoint = `${AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "")}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: AZURE_OPENAI_DEPLOYMENT,
        // Reasoning models budget reasoning tokens against this too, so keep it
        // generous to avoid truncating the JSON output.
        max_completion_tokens: 6000,
        response_format: { type: "json_object" },
        // "medium" (not "low"): low-effort nano runs kept half-ignoring the
        // copywriting rules (packaging highlights, brand-name keywords).
        ...(IS_REASONING_MODEL ? { reasoning_effort: "medium" } : { temperature: 0.7 }),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.name === "AbortError"
          ? "Azure OpenAI took too long to respond. Please try again."
          : "Could not reach Azure OpenAI. Check your connection and try again.",
    };
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Azure OpenAI error ${res.status}`;
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      if (j.error?.message) message = j.error.message;
    } catch {
      /* keep default */
    }
    return { ok: false, error: message };
  }

  const json = (await res.json().catch(() => null)) as { choices?: Array<{ message?: { content?: string } }> } | null;
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) {
    return { ok: false, error: "Azure OpenAI returned an empty response. Please try again." };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Could not parse the AI response. Please try again." };
  }

  const faqsRaw = Array.isArray(parsed.faqs) ? parsed.faqs : [];
  const faqs = faqsRaw
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      return { q: str(o.q), a: str(o.a) };
    })
    .filter((f) => f.q && f.a)
    .slice(0, 8);

  // Highlights must sell what the product DOES. The model is told this twice,
  // but small models still slip in packaging bullets ("premium pump bottle"),
  // brand-name bullets ("Ayroil Ayurvedic blend"), and audience filler
  // ("Suitable for all genders") — drop all of them outright.
  const brandWord = name.split(/\s+/)[0]?.replace(/[^\p{L}\p{N}]/gu, "") ?? "";
  const brandRe = brandWord.length > 2 ? new RegExp(`\\b${brandWord}\\b`, "i") : null;
  const isJunkHighlight = (h: string) =>
    /\b(bottle|pump|cap|box|jar|tube|container|carton|dispenser|packaging|label|seal)\b/i.test(h) ||
    /^(suitable|perfect|ideal|great)\s+for\b/i.test(h) ||
    (brandRe ? brandRe.test(h) : false);

  // response_format: json_object has no schema enforcement, and small models
  // occasionally return "highlights" as a newline/bullet-separated string
  // instead of an array — handle both shapes rather than silently dropping it.
  const highlights = (() => {
    const h = parsed.highlights;
    if (Array.isArray(h)) return h.map((x) => str(x)).filter(Boolean);
    if (typeof h === "string") {
      return h
        .split(/\r?\n+/)
        .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
        .filter(Boolean);
    }
    return [];
  })()
    .filter((h) => !isJunkHighlight(h))
    .slice(0, 8);

  // Keywords are search phrases, not the product's own name or bare ingredient
  // words — drop brand-name entries and single-word terms the prompt forbids.
  const keywords = (Array.isArray(parsed.keywords) ? parsed.keywords.map((k) => str(k)).filter(Boolean) : [])
    .filter((k) => k.trim().split(/\s+/).length >= 2 && (brandRe ? !brandRe.test(k) : true))
    .slice(0, 15);

  // Meta fields feed search snippets, which truncate hard — cap overshoots at
  // a word boundary (155 chars for the description, 65 for the title).
  const clampMeta = (s: string, max: number, terminal: string) => {
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "") + terminal;
  };
  const shortDescription = clampMeta(str(parsed.shortDescription), 155, ".");
  const metaTitle = clampMeta(str(parsed.metaTitle), 65, "");

  const data: GeneratedProduct = {
    tagline: str(parsed.tagline),
    metaTitle,
    shortDescription,
    // Strip any [[IMAGE_n]] placeholders the model emits despite the analysis-only rule.
    longDescription: str(parsed.longDescription).replace(/\[\[IMAGE_\d+\]\]/g, "").trim(),
    highlights,
    faqs,
    keywords,
  };

  return { ok: true, data };
}
