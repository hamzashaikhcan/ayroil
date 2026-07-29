"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { API_URL } from "@/lib/api";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
};

type CloudinaryUploadResponse = { secure_url: string };

const MAX_IMAGES = 5;

async function uploadOne(file: File, number: string, token: string): Promise<string> {
  const signRes = await fetch(
    `${API_URL}/orders/${encodeURIComponent(number)}/review/upload-sign?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  if (!signRes.ok) throw new Error("Couldn't prepare the upload. Please try again.");
  const sign = (await signRes.json()) as SignResponse;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("folder", sign.folder);
  fd.append("signature", sign.signature);

  const res = await fetch(sign.uploadUrl, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed. Please try again.");
  const body = (await res.json()) as CloudinaryUploadResponse;
  return body.secure_url;
}

/**
 * Lets a customer attach photos to their review. Uploads go straight from
 * the browser to Cloudinary using a signature minted by the backend (gated
 * by the same one-time review token as the rest of this page — see
 * GET /orders/:number/review/upload-sign). Uploaded URLs are carried into
 * the surrounding <form> as hidden inputs so the page's server action picks
 * them up with formData.getAll("images").
 */
export function ReviewImages({ number, token }: { number: string; token: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const remaining = MAX_IMAGES - images.length;
      const list = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, remaining);
      if (!list.length) return;
      setPending(true);
      setError(null);
      try {
        const uploaded = await Promise.all(list.map((f) => uploadOne(f, number, token)));
        setImages((prev) => [...prev, ...uploaded]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setPending(false);
      }
    },
    [images.length, number, token],
  );

  function removeAt(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Photos <span className="normal-case text-muted/70">(optional)</span>
      </label>
      <div className="mt-2 flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="group relative h-20 w-20 flex-none overflow-hidden rounded-lg border border-line bg-surface">
            <Image src={url} alt={`Upload ${i + 1}`} fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100"
            >
              ✕
            </button>
            <input type="hidden" name="images" value={url} />
          </div>
        ))}
        {images.length < MAX_IMAGES ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex h-20 w-20 flex-none flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong text-xs text-muted hover:border-line-strong hover:text-ink disabled:opacity-50"
          >
            {pending ? "Uploading…" : "+ Add"}
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-muted">Up to {MAX_IMAGES} photos.</p>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) void upload(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}
