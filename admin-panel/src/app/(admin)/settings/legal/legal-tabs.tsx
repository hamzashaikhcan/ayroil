"use client";

import { useState } from "react";
import { TabBar } from "../_shared/tab-bar";
import { RichTextPageForm } from "../_shared/rich-text-page-form";
import type { SettingsLike } from "../_shared/types";

type Tab = "shipping" | "returns" | "terms" | "privacy";

const TABS: { id: Tab; label: string }[] = [
  { id: "shipping", label: "Shipping policy" },
  { id: "returns", label: "Returns policy" },
  { id: "terms", label: "Terms" },
  { id: "privacy", label: "Privacy" },
];

export function LegalTabs({ initial }: { initial: SettingsLike }) {
  const [tab, setTab] = useState<Tab>("shipping");

  return (
    <div className="space-y-5">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "shipping" ? (
        <RichTextPageForm
          key="shipping"
          initial={initial}
          titleKey="shippingPolicyTitle"
          bodyKey="shippingPolicyBody"
          titleLabel="Shipping page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full shipping policy content."
          bodyHint="Rich text — headings, lists, links. Rendered as sanitized HTML on the storefront /shipping page."
          placeholder="Standard shipping arrives in 3-5 business days. Orders over $50 ship free…"
          aiPage="shipping"
        />
      ) : null}

      {tab === "returns" ? (
        <RichTextPageForm
          key="returns"
          initial={initial}
          titleKey="returnsPolicyTitle"
          bodyKey="returnsPolicyBody"
          titleLabel="Returns page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full returns policy content."
          bodyHint="Rich text — headings, lists, links. Rendered as sanitized HTML on the storefront /returns page."
          placeholder="You have 30 days from delivery to start a return…"
          aiPage="returns"
        />
      ) : null}

      {tab === "terms" ? (
        <RichTextPageForm
          key="terms"
          initial={initial}
          titleKey="termsTitle"
          bodyKey="termsBody"
          titleLabel="Terms page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full terms content."
          bodyHint="Rich text · headings, lists, links. Rendered as sanitized HTML on the storefront /terms page."
          placeholder="1. Orders — All orders are subject to acceptance and availability…"
          aiPage="terms"
        />
      ) : null}

      {tab === "privacy" ? (
        <RichTextPageForm
          key="privacy"
          initial={initial}
          titleKey="privacyTitle"
          bodyKey="privacyBody"
          titleLabel="Privacy page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full privacy policy content."
          bodyHint="Rich text · headings, lists, links. Rendered as sanitized HTML on the storefront /privacy page."
          placeholder="What we collect — Account information you provide, order history, and basic analytics…"
          aiPage="privacy"
        />
      ) : null}
    </div>
  );
}
