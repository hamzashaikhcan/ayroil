"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./rich-editor.css";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useRef, useState } from "react";
import type { Block, PartialBlock } from "@blocknote/core";

/**
 * Rich-text editor backed by BlockNote.
 *
 * The component receives an HTML string and emits an HTML string — that's
 * what the storefront PDP renders. Internally BlockNote uses its own block
 * model; we serialize to HTML on every change.
 */
export function RichEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | "loading">("loading");

  // Convert the incoming HTML to BlockNote's block model once on mount.
  const tempEditor = useCreateBlockNote();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const blocks = value
        ? await tempEditor.tryParseHTMLToBlocks(value)
        : ([] as PartialBlock[]);
      if (!cancelled) setInitialBlocks(blocks);
    })();
    return () => {
      cancelled = true;
    };
    // Only parse the incoming HTML once on mount — re-parsing on every keystroke
    // would clobber the cursor. Subsequent edits live in the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initialBlocks === "loading") {
    return (
      <div className="h-40 w-full rounded-md border border-line bg-surface-2 p-3 text-sm text-muted">
        Loading editor…
      </div>
    );
  }

  return (
    <BoundEditor
      initialContent={initialBlocks.length ? initialBlocks : undefined}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

function BoundEditor({
  initialContent,
  onChange,
  placeholder,
}: {
  initialContent?: PartialBlock[];
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useCreateBlockNote({ initialContent });
  const lastHtmlRef = useRef<string>("");

  async function emit() {
    const html = await editor.blocksToHTMLLossy(editor.document as Block[]);
    if (html !== lastHtmlRef.current) {
      lastHtmlRef.current = html;
      onChange(html);
    }
  }

  return (
    <div className="rich-editor rounded-md border border-line bg-surface-2 focus-within:border-ink/30 focus-within:bg-surface">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={emit}
        data-placeholder={placeholder}
      />
    </div>
  );
}
