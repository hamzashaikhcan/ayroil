"use client";

import { RichTextPageForm } from "../_shared/rich-text-page-form";
import type { SettingsLike } from "../_shared/types";

export function BenefitsForm({ initial }: { initial: SettingsLike }) {
  return (
    <RichTextPageForm
      initial={initial}
      titleKey="benefitsTitle"
      bodyKey="benefitsBody"
      titleLabel="Benefits page"
      bodyLabel="Body"
      titleHint="Title is the H1 on /benefits; body is the long-form copy."
      bodyHint="Rich text · headings, lists, links. Rendered as sanitized HTML on the storefront /benefits page."
      placeholder="Tell your customers about the brand, the product, the team…"
    />
  );
}
