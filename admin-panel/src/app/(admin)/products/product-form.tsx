"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import { getActiveCurrency, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ImageUploader } from "@/components/ui/image-uploader";
import { SwitchField } from "@/components/ui/switch-field";
import { AiProductWidget } from "@/components/ai-product-widget";
import type { GeneratedProduct } from "@/lib/ai-types";

// BlockNote depends on `window` at import time — load it client-only.
const RichEditor = dynamic(
  () => import("@/components/ui/rich-editor").then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-full rounded-md border border-line bg-surface-2 p-3 text-sm text-muted">
        Loading editor…
      </div>
    ),
  },
);

type ProductLike = {
  id?: string;
  slug: string;
  name: string;
  tagline: string | null;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  compareAtCents: number | null;
  costCents: number;
  stock: number;
  sku: string | null;
  active: boolean;
  images: string[];
  highlights: string[];
  ingredients: { name: string; description: string }[];
  faqs: { q: string; a: string }[];
};

const EMPTY: ProductLike = {
  slug: "",
  name: "",
  tagline: null,
  shortDescription: "",
  longDescription: "",
  priceCents: 0,
  compareAtCents: null,
  costCents: 0,
  stock: 0,
  sku: null,
  active: true,
  images: [],
  highlights: [],
  ingredients: [],
  faqs: [],
};

export function ProductForm({
  mode,
  initial,
  logoUrl,
}: {
  mode: "create" | "edit";
  initial?: ProductLike;
  logoUrl?: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [p, setP] = useState<ProductLike>(initial ?? EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped whenever AI-generated copy is applied, forcing RichEditor and
  // HighlightsField to remount — both only read their initial value once.
  const [aiKey, setAiKey] = useState(0);

  function patch<K extends keyof ProductLike>(k: K, v: ProductLike[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
  }

  function applyAi(data: GeneratedProduct) {
    setP((prev) => ({
      ...prev,
      tagline: data.tagline,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      highlights: data.highlights,
      faqs: data.faqs,
    }));
    setAiKey((k) => k + 1);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "create") {
        await adminClientFetch("/products", { method: "POST", body: JSON.stringify(p) });
      } else {
        await adminClientFetch(`/products/${initial!.id}`, { method: "PUT", body: JSON.stringify(p) });
      }
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!initial?.id) return;
    const ok = await confirm({
      title: "Delete this product?",
      description:
        "This removes the product from the catalog and the storefront immediately. Past orders that reference it are kept, but its image, copy, and inventory record are gone for good.",
      targetName: `${initial.name} · ${initial.slug}`,
      destructive: true,
      confirmLabel: "Delete product",
      typeToConfirm: "DELETE",
    });
    if (!ok) return;
    await adminClientFetch(`/products/${initial.id}`, { method: "DELETE" });
    router.push("/products");
  }

  return (
    <>
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <Card title="Basics" subtitle="Name, slug, and the descriptions shown on the PDP.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name" value={p.name} onChange={(v) => patch("name", v)} required />
            <Field label="Slug" value={p.slug} onChange={(v) => patch("slug", v)} required placeholder="product-one" />
            <Field label="Tagline" value={p.tagline ?? ""} onChange={(v) => patch("tagline", v || null)} className="md:col-span-2" placeholder="One short, sharp line" />
            <TextField label="Short description" value={p.shortDescription} onChange={(v) => patch("shortDescription", v)} className="md:col-span-2" required />
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Long description</label>
              <div className="mt-1.5">
                <RichEditor
                  key={aiKey}
                  value={p.longDescription}
                  onChange={(html) => patch("longDescription", html)}
                  placeholder="Tell the customer what's special about this product…"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Rich text · headings, lists, links, and bold/italic. Rendered as HTML on the storefront PDP.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Images" subtitle="Drop or click to upload. The first image is the storefront cover.">
          <ImageUploader
            images={p.images}
            onChange={(next) => patch("images", next)}
          />
        </Card>

        <Card title="Pricing" subtitle={`Enter prices in whole ${getActiveCurrency().code}; stored as sub-units in the database.`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <CentsField label="Price" value={p.priceCents} onChange={(v) => patch("priceCents", v)} />
            <CentsField label="Compare at" value={p.compareAtCents ?? 0} onChange={(v) => patch("compareAtCents", v || null)} />
            <CentsField label="Unit cost" value={p.costCents} onChange={(v) => patch("costCents", v)} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Profit per unit ={" "}
            <span className="font-mono text-ink">{formatPrice(p.priceCents - p.costCents)}</span>
            {" "}—{" "}
            <span className="font-mono">
              {p.priceCents > 0
                ? `${Math.round(((p.priceCents - p.costCents) / p.priceCents) * 100)}% margin`
                : "—"}
            </span>
          </p>
        </Card>

        <Card title="Inventory" subtitle="Stock count and SKU for fulfillment.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <NumberField label="Stock on hand" value={p.stock} onChange={(v) => patch("stock", v)} />
            <SkuField
              value={p.sku ?? ""}
              onChange={(v) => patch("sku", v || null)}
              seedSlug={p.slug}
              seedName={p.name}
              className="md:col-span-2"
            />
          </div>
        </Card>

        <Card title="Highlights" subtitle="One bullet per line. Shown as a list on the PDP.">
          <HighlightsField
            key={aiKey}
            value={p.highlights}
            onChange={(next) => patch("highlights", next)}
          />
        </Card>

        <Card title="FAQs" subtitle="Shown on the PDP and added to FAQPage structured data for SEO/AEO.">
          <FaqsField
            value={p.faqs}
            onChange={(next) => patch("faqs", next)}
          />
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Status">
          <SwitchField
            checked={p.active}
            onChange={(checked) => patch("active", checked)}
            label="Active"
            description="Visible on the storefront."
          />
        </Card>

        {error ? (
          <div className="rounded-md border border-bad/30 bg-bad-soft px-3 py-2 text-xs text-bad">
            {error}
          </div>
        ) : null}

        <div className="card sticky top-20 p-4">
          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
          </Button>
          {mode === "edit" ? (
            <Button type="button" onClick={onDelete} variant="secondary" size="md" className="mt-2 w-full text-bad hover:bg-bad-soft">
              Delete product
            </Button>
          ) : null}
          <p className="mt-3 text-xs text-muted">
            {mode === "edit" ? "Changes go live as soon as you save." : "The product will be created in the catalog."}
          </p>
        </div>
      </div>
    </form>
    <AiProductWidget
      name={p.name}
      tagline={p.tagline}
      shortDescription={p.shortDescription}
      highlights={p.highlights}
      images={p.images}
      logoUrl={logoUrl}
      onApply={applyAi}
    />
    </>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="border-b border-line p-5">
        <div className="text-sm font-semibold text-ink">{title}</div>
        {subtitle ? <div className="mt-0.5 text-xs text-muted">{subtitle}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, required, className, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; className?: string; placeholder?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

function TextField({ label, value, onChange, required, className, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; className?: string; rows?: number }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        className="mt-1.5 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

function CentsField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const { symbol } = getActiveCurrency();
  return (
    <div>
      <label className="text-xs font-medium text-muted">{label}</label>
      <div className="mt-1.5 flex h-9 items-center rounded-md border border-line bg-surface-2 px-3 text-sm focus-within:border-ink/30 focus-within:bg-surface">
        <span className="text-muted">{symbol}</span>
        <input
          type="number"
          step="0.01"
          min={0}
          value={(value / 100).toString()}
          onChange={(e) => onChange(Math.round(Number(e.target.value || 0) * 100))}
          className="ml-1 w-full bg-transparent text-sm text-ink focus:outline-none"
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

function HighlightsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  // Local raw string lets the textarea carry empty lines mid-edit (so the
  // cursor can sit on a blank line). The parent only sees the normalized
  // string[] with empties stripped.
  const [raw, setRaw] = useState(value.join("\n"));

  function handleChange(next: string) {
    setRaw(next);
    const normalized = next.split("\n").map((s) => s.trim()).filter(Boolean);
    onChange(normalized);
  }

  return (
		<textarea
			rows={5}
			value={raw}
			onChange={(e) => handleChange(e.target.value)}
			placeholder={'Built in-house\n7-days returns\nCarbon-neutral shipping'}
			className='w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none'
		/>
	);
}

function FaqsField({
  value,
  onChange,
}: {
  value: { q: string; a: string }[];
  onChange: (next: { q: string; a: string }[]) => void;
}) {
  function update(i: number, patch: Partial<{ q: string; a: string }>) {
    onChange(value.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { q: "", a: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? <p className="text-xs text-muted">No FAQs yet.</p> : null}
      {value.map((f, i) => (
        <div key={i} className="rounded-md border border-line bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-muted">Question {i + 1}</label>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs font-medium text-muted hover:text-bad"
            >
              Remove
            </button>
          </div>
          <input
            value={f.q}
            onChange={(e) => update(i, { q: e.target.value })}
            placeholder="What size does this come in?"
            className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
          />
          <textarea
            value={f.a}
            onChange={(e) => update(i, { a: e.target.value })}
            rows={2}
            placeholder="Answer shown to customers…"
            className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-medium text-accent underline-offset-2 hover:text-accent-deep hover:underline"
      >
        + Add FAQ
      </button>
    </div>
  );
}

const SKU_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(n = 4): string {
  let out = "";
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  for (let i = 0; i < n; i++) out += SKU_ALPHABET[buf[i] % SKU_ALPHABET.length];
  return out;
}

function generateSku(seedSlug: string, seedName: string): string {
  const source = (seedSlug || seedName || "PRODUCT").trim();
  const prefix = source
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .filter(Boolean)
    .map((seg) => seg.slice(0, 4))
    .slice(0, 2)
    .join("-")
    .slice(0, 12) || "SKU";
  return `${prefix}-${randomSuffix(4)}`;
}

function SkuField({
  value,
  onChange,
  seedSlug,
  seedName,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  seedSlug: string;
  seedName: string;
  className?: string;
}) {
  function regenerate() {
    onChange(generateSku(seedSlug, seedName));
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <label htmlFor="product-sku" className="text-xs font-medium text-muted">
          SKU
        </label>
        <button
          type="button"
          onClick={regenerate}
          className="text-xs font-medium text-accent underline-offset-2 hover:text-accent-deep hover:underline"
        >
          {value ? "Regenerate" : "Auto-generate"}
        </button>
      </div>
      <input
        id="product-sku"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="PO-001"
        autoComplete="off"
        spellCheck={false}
        className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 font-mono text-sm uppercase tracking-wide text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
      />
      <p className="mt-1.5 text-xs text-muted">
        Stock-keeping unit. Derived from the slug when generated, but fully editable.
      </p>
    </div>
  );
}
