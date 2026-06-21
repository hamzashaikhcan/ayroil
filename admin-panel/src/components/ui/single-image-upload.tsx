"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { adminClientFetch } from "@/lib/admin-client";
import { IconPlus } from "@/components/ui/icons";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
};

async function uploadOne(file: File): Promise<string> {
  const sign = await adminClientFetch<SignResponse>("/uploads/sign");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("folder", sign.folder);
  fd.append("signature", sign.signature);
  const res = await fetch(sign.uploadUrl, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }
  const body = (await res.json()) as CloudinaryUploadResponse;
  return body.secure_url;
}

/**
 * Single-image picker for things like the site icon, brand logos, and OG
 * image. Click or drop to upload to Cloudinary; the secure_url is written
 * back to the parent.
 *
 * `transparent` swaps the preview background to a checkerboard pattern so a
 * transparent PNG/SVG reads correctly when you upload a logo.
 */
export function SingleImageUpload({
  value,
  onChange,
  label,
  hint,
  aspect = "square",
  transparent = false,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
  hint?: string;
  aspect?: "square" | "wide" | "tall";
  transparent?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function pick(file: File) {
    setPending(true);
    setError(null);
    try {
      const url = await uploadOne(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (file) void pick(file);
  }

  const aspectClass = aspect === "wide" ? "aspect-[16/9]" : aspect === "tall" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted">{label}</label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted underline-offset-2 hover:text-bad hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mt-1.5 relative overflow-hidden rounded-md border transition-colors ${
          dragOver
            ? "border-accent bg-accent-soft"
            : value
              ? "border-line"
              : "border-dashed border-line-strong bg-surface-2"
        } ${aspectClass}`}
        style={
          transparent && value
            ? {
                backgroundImage:
                  "linear-gradient(45deg, #eceef1 25%, transparent 25%), linear-gradient(-45deg, #eceef1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eceef1 75%), linear-gradient(-45deg, transparent 75%, #eceef1 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
              }
            : undefined
        }
      >
        {value ? (
          <Image
            src={value}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-3"
            unoptimized
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-xs text-muted hover:text-ink"
          >
            {pending ? (
              <span className="font-medium">Uploading…</span>
            ) : (
              <>
                <IconPlus className="h-4 w-4" />
                <span className="font-medium">Upload image</span>
                <span className="text-xs">drop or click</span>
              </>
            )}
          </button>
        )}

        {value && pending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <span className="rounded-full bg-surface px-2 py-1 text-xs font-medium text-ink">Replacing…</span>
          </div>
        ) : null}
      </div>

      {value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="mt-1.5 text-xs font-medium text-accent underline-offset-2 hover:text-accent-deep hover:underline"
        >
          Replace image
        </button>
      ) : null}

      {hint && !value ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-bad">{error}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}
