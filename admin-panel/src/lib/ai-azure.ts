// Server-side only — reads the Azure API key from env. Import this module
// exclusively from "use server" files so the key never reaches the client.

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

export type AzureUserContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export type AzureChatResult = { ok: true; raw: string } | { ok: false; error: string };

export function isAzureConfigured(): boolean {
  return Boolean(AZURE_OPENAI_API_KEY);
}

/** Trim + enforce the no-dash copy rule on any model-returned string. */
export function cleanText(v: unknown): string {
  if (typeof v !== "string") return "";
  // Numeric ranges ("2–3") keep a plain hyphen, any other em/en dash becomes
  // a comma pause.
  return v
    .replace(/(\d)\s*[—–]\s*(\d)/g, "$1-$2")
    .replace(/\s*[—–]\s*/g, ", ")
    .trim();
}

async function callOnce(
  system: string,
  user: AzureUserContent,
  maxTokens: number,
): Promise<{ raw: string } | { raw?: undefined; error: string; retryable: boolean }> {
  const endpoint = `${AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "")}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY!,
      },
      body: JSON.stringify({
        model: AZURE_OPENAI_DEPLOYMENT,
        // Reasoning models spend their (invisible) reasoning tokens against
        // this cap too — at medium effort that can be many thousands before
        // a single output token, and running out yields a 200 with EMPTY
        // content. Keep this far above what the JSON itself needs.
        max_completion_tokens: maxTokens,
        response_format: { type: "json_object" },
        // "medium" (not "low"): low-effort nano runs kept half-ignoring the
        // copywriting rules (packaging highlights, brand-name keywords).
        ...(IS_REASONING_MODEL ? { reasoning_effort: "medium" } : { temperature: 0.7 }),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch (err) {
    return err instanceof Error && err.name === "AbortError"
      ? { error: "Azure OpenAI took too long to respond. Please try again.", retryable: false }
      : { error: "Could not reach Azure OpenAI. Check your connection and try again.", retryable: true };
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
    // 429/5xx are transient; 4xx config errors are not worth a retry.
    return { error: message, retryable: res.status === 429 || res.status >= 500 };
  }

  const json = (await res.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  } | null;
  const choice = json?.choices?.[0];
  const raw = choice?.message?.content;
  if (!raw) {
    return choice?.finish_reason === "length"
      ? { error: "The AI ran out of output tokens before finishing. Please try again.", retryable: true }
      : { error: "Azure OpenAI returned an empty response. Please try again.", retryable: true };
  }
  return { raw };
}

/**
 * One JSON-mode chat completion against the configured Azure deployment, with
 * a single automatic retry on transient failures (empty responses, 429, 5xx).
 */
export async function azureChatJSON(opts: {
  system: string;
  user: AzureUserContent;
  maxTokens?: number;
}): Promise<AzureChatResult> {
  if (!AZURE_OPENAI_API_KEY) {
    return { ok: false, error: "Azure OpenAI is not configured. Add AZURE_OPENAI_API_KEY to .env." };
  }
  const maxTokens = opts.maxTokens ?? 20_000;
  let attempt = await callOnce(opts.system, opts.user, maxTokens);
  if (attempt.raw === undefined && attempt.retryable) attempt = await callOnce(opts.system, opts.user, maxTokens);
  if (attempt.raw === undefined) return { ok: false, error: attempt.error };
  return { ok: true, raw: attempt.raw };
}
