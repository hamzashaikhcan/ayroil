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

Write in a clear, confident, benefit-led voice. No marketing clichés ("game-changer", "must-have", "premium quality"), no exclamation points, no emoji.

Embed the product's own photos inside the long description where they genuinely help. You'll be told how many photos are available (N). Place placeholders written EXACTLY as [[IMAGE_1]], [[IMAGE_2]], … [[IMAGE_N]] (1 = the first photo), each on its own line, at most once per photo, never two in a row. Never invent <img> tags or URLs yourself — just the placeholder text. If N is 0, use no placeholders.

FAQ ANSWER RULES: cover the real hesitations a buyer has right before checkout — fit/sizing, materials and durability, how it compares to alternatives, what's included, care/maintenance, and anything about quality that's genuinely supported. Each answer must be 2-4 full sentences, specific and concrete (not a generic one-liner), and should leave the buyer reassured they're getting a genuinely well-made product worth their money — confident and trustworthy, never salesy or exaggerated, and never inventing claims (warranty terms, exact certifications, shipping times) you weren't given. If a question asks about a detail you don't have an exact number for, answer the part you can speak to confidently and skip the missing number entirely — do not tell the customer it's missing. The goal is a buyer who finishes reading feeling sure this is the right purchase, never a buyer who notices a gap in your knowledge.

Return ONLY a JSON object with exactly these keys, no markdown fences, no commentary:
{
  "tagline": string,            // one short, punchy line, under 70 characters
  "shortDescription": string,   // plain text, 1-2 sentences, no HTML
  "longDescription": string,    // HTML body for the product detail page. Allowed tags ONLY: h2, h3, p, ul, ol, li, strong, em, br, plus [[IMAGE_n]] placeholders. Organize under 2-4 short headings.
  "highlights": string[],       // 4-6 short bullets, no leading bullet/dash character
  "faqs": [{"q": string, "a": string}],  // 5-8 buyer questions. See the FAQ ANSWER RULES below — answers must be thorough, not one-liners.
  "keywords": string[]          // 8-12 search terms a shopper might use to find this product (for the admin's own reference, not inserted into any visible copy)
}
Always return every field, even when existing copy was supplied — improve on it rather than leaving it untouched.`;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Replace the model's [[IMAGE_n]] placeholders (1-indexed) with real <img> tags
 * pointing at the actual uploaded photos. BlockNote parses these into image blocks.
 */
function embedImages(html: string, urls: string[]): string {
  return html.replace(/\[\[IMAGE_(\d+)\]\]/g, (_match, idxStr: string) => {
    const url = urls[Number(idxStr) - 1];
    return url ? `<img src="${url}" alt="" />` : "";
  });
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
    `Photos available to embed: ${images.length}` +
      (images.length
        ? ` — [[IMAGE_1]] is the first photo, up to [[IMAGE_${images.length}]]. Use as many as fit naturally, each on its own line.`
        : " — use no image placeholders."),
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
        ...(IS_REASONING_MODEL ? { reasoning_effort: "low" } : { temperature: 0.7 }),
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

  // response_format: json_object has no schema enforcement, and small models
  // occasionally return "highlights" as a newline/bullet-separated string
  // instead of an array — handle both shapes rather than silently dropping it.
  const highlights = (() => {
    const h = parsed.highlights;
    if (Array.isArray(h)) return h.map((x) => str(x)).filter(Boolean).slice(0, 8);
    if (typeof h === "string") {
      return h
        .split(/\r?\n+/)
        .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 8);
    }
    return [];
  })();

  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map((k) => str(k)).filter(Boolean).slice(0, 15) : [];

  const data: GeneratedProduct = {
    tagline: str(parsed.tagline),
    shortDescription: str(parsed.shortDescription),
    longDescription: embedImages(str(parsed.longDescription), images),
    highlights,
    faqs,
    keywords,
  };

  return { ok: true, data };
}
