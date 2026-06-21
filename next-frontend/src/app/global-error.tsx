"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary — catches errors in the root layout itself
 * (when even `<html>`/`<body>` failed to render). Must include its own
 * <html> and <body>, no providers, no settings — anything could be broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront:global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          background: "#fafaf9",
          color: "#0a0a0b",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#6b6b70",
              fontFamily: "monospace",
            }}
          >
            Critical error
          </div>
          <h1
            style={{
              margin: "16px 0 0",
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            The site couldn&apos;t load.
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 15,
              lineHeight: 1.6,
              color: "#6b6b70",
            }}
          >
            Something went wrong before the page could render. Try refreshing
            in a moment.
          </p>
          {error?.digest ? (
            <div
              style={{
                marginTop: 16,
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #e6e6e3",
                background: "#fff",
                fontFamily: "monospace",
                fontSize: 11,
                color: "#6b6b70",
              }}
            >
              Reference: {error.digest}
            </div>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 24px",
              borderRadius: 6,
              border: 0,
              background: "#0a0a0b",
              color: "#fafaf9",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
