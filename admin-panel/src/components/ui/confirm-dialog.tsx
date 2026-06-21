"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "./button";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Optional name of the specific record being acted on — surfaced in the dialog. */
  targetName?: string;
  /** Require the user to type a value to enable the confirm button. */
  typeToConfirm?: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options);
    setTyped("");
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setOpen(false);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(result);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Enter" && e.target instanceof HTMLElement && e.target.tagName !== "TEXTAREA") {
        if (opts?.typeToConfirm && typed !== opts.typeToConfirm) return;
        e.preventDefault();
        close(true);
      }
    };
    window.addEventListener("keydown", onKey);
    (opts?.typeToConfirm ? inputRef.current : cancelRef.current)?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, opts, typed, close]);

  const value = useMemo(() => confirm, [confirm]);
  const gateUnmet = !!(opts?.typeToConfirm && typed !== opts.typeToConfirm);

  return (
    <Ctx.Provider value={value}>
      {children}
      {open && opts ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => close(false)}
            aria-hidden
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={opts.description ? "confirm-desc" : undefined}
            className="relative w-full max-w-2xl rounded-xl border border-line bg-surface shadow-[0_24px_80px_-24px_rgba(16,24,40,0.25)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
              <div className="p-6">
                <div className="text-xs font-medium uppercase tracking-wider text-muted">
                  {opts.destructive ? "Destructive action" : "Confirm"}
                </div>
                <h2
                  id="confirm-title"
                  className="mt-2 text-xl font-semibold leading-tight tracking-tight text-ink"
                >
                  {opts.title}
                </h2>
                {opts.description ? (
                  <p
                    id="confirm-desc"
                    className="mt-3 max-w-lg text-sm leading-relaxed text-muted"
                  >
                    {opts.description}
                  </p>
                ) : null}

                {opts.targetName ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-line bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink">
                    {opts.targetName}
                  </div>
                ) : null}

                {opts.typeToConfirm ? (
                  <div className="mt-5">
                    <label htmlFor="confirm-gate" className="text-xs font-medium text-muted">
                      Type{" "}
                      <span className="font-mono font-semibold text-ink">
                        {opts.typeToConfirm}
                      </span>{" "}
                      to confirm
                    </label>
                    <input
                      id="confirm-gate"
                      ref={inputRef}
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="mt-1.5 h-9 w-full rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-ink focus:border-ink/40 focus:bg-surface focus:outline-none"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-stretch gap-2 border-t border-line p-6 md:flex-col md:border-l md:border-t-0">
                <Button
                  variant={opts.destructive ? "danger" : "primary"}
                  onClick={() => close(true)}
                  disabled={gateUnmet}
                >
                  {opts.confirmLabel ?? (opts.destructive ? "Delete" : "Confirm")}
                </Button>
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={() => close(false)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  {opts.cancelLabel ?? "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
