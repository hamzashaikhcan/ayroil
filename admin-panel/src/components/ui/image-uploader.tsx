"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
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

type Upload = {
  id: string;
  status: "uploading" | "error";
  preview: string;
  error?: string;
};

async function uploadOne(file: File): Promise<string> {
  // 1. Get signed params from the backend (admin-only endpoint).
  const sign = await adminClientFetch<SignResponse>("/uploads/sign");

  // 2. POST the file directly to Cloudinary using the signed params.
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

export function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [pending, setPending] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;

      const stubs: Upload[] = list.map((f) => ({
        id: `tmp-${Math.random().toString(36).slice(2)}-${f.name}`,
        status: "uploading",
        preview: URL.createObjectURL(f),
      }));
      setPending((prev) => [...prev, ...stubs]);

      const uploaded: string[] = [];
      for (let i = 0; i < list.length; i++) {
        const stub = stubs[i];
        try {
          const url = await uploadOne(list[i]);
          uploaded.push(url);
          setPending((prev) => prev.filter((p) => p.id !== stub.id));
          URL.revokeObjectURL(stub.preview);
        } catch (err) {
          setPending((prev) =>
            prev.map((p) =>
              p.id === stub.id
                ? { ...p, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
                : p,
            ),
          );
        }
      }
      if (uploaded.length) onChange([...images, ...uploaded]);
    },
    [images, onChange],
  );

  function removeAt(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  function makePrimary(idx: number) {
    if (idx === 0) return;
    const next = images.slice();
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  }

  function dismissError(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  function onDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void upload(e.dataTransfer.files);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((url, idx) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-md border border-line bg-surface-2"
          >
            <Image
              src={url}
              alt={`Product image ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              unoptimized
            />
            {idx === 0 ? (
              <div className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-background">
                Primary
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/85 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-0.5">
                <IconButton onClick={() => move(idx, -1)} disabled={idx === 0} label="Move left">←</IconButton>
                <IconButton onClick={() => move(idx, 1)} disabled={idx === images.length - 1} label="Move right">→</IconButton>
                {idx !== 0 ? (
                  <IconButton onClick={() => makePrimary(idx)} label="Make primary">★</IconButton>
                ) : null}
              </div>
              <IconButton onClick={() => removeAt(idx)} label="Remove image" variant="danger">✕</IconButton>
            </div>
          </div>
        ))}

        {pending.map((p) => (
          <div
            key={p.id}
            className="relative aspect-square overflow-hidden rounded-md border border-line bg-surface-2"
          >
            <Image
              src={p.preview}
              alt="Uploading"
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              unoptimized
            />
            {p.status === "uploading" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                <div className="rounded-full bg-surface px-2 py-1 text-xs font-medium text-ink">
                  Uploading…
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bad/85 p-3 text-center text-xs font-medium text-white">
                <div>Upload failed</div>
                {p.error ? <div className="line-clamp-2 text-xs opacity-90">{p.error}</div> : null}
                <button
                  onClick={() => dismissError(p.id)}
                  className="rounded-full bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border border-dashed text-xs transition-colors ${
            dragOver
              ? "border-accent bg-accent-soft text-accent-deep"
              : "border-line-strong bg-surface-2 text-muted hover:border-line-strong hover:bg-background hover:text-ink"
          }`}
        >
          <IconPlus className="h-4 w-4" />
          <span className="font-medium">Add image</span>
          <span className="text-xs">drop or click</span>
        </button>
      </div>

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

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          {images.length} {images.length === 1 ? "image" : "images"}
          {images.length > 0 ? " · first image is used as the storefront cover" : ""}
        </span>
        {images.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Upload more
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  label,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors disabled:opacity-30 ${
        variant === "danger"
          ? "bg-bad/90 text-white hover:bg-bad"
          : "bg-white/95 text-ink hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
