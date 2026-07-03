export type GenerateProductInput = {
  name: string;
  tagline?: string | null;
  shortDescription?: string;
  highlights?: string[];
  images: string[];
};

export type GeneratedProduct = {
  tagline: string;
  metaTitle: string;
  shortDescription: string;
  longDescription: string;
  highlights: string[];
  faqs: { q: string; a: string }[];
  keywords: string[];
};

export type AiGenerateResult = { ok: true; data: GeneratedProduct } | { ok: false; error: string };
