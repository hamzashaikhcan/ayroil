"use client";

import { useState } from "react";
import { TabBar } from "../_shared/tab-bar";
import { TestimonialsForm } from "../testimonials/testimonials-form";
import { BeforeAfterForm } from "../before-after/before-after-form";
import type { SettingsLike } from "../_shared/types";

type Tab = "testimonials" | "before-after";

const TABS: { id: Tab; label: string }[] = [
  { id: "testimonials", label: "Testimonials" },
  { id: "before-after", label: "Before / after" },
];

export function SocialProofTabs({ initial }: { initial: SettingsLike }) {
  const [tab, setTab] = useState<Tab>("testimonials");

  return (
    <div className="space-y-5">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "testimonials" ? <TestimonialsForm key="testimonials" initial={initial} /> : null}
      {tab === "before-after" ? <BeforeAfterForm key="before-after" initial={initial} /> : null}
    </div>
  );
}
