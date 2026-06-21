"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin:global]", error);
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
          background: "#f1f2f4",
          color: "#1a1c1f",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#b42318",
              fontWeight: 500,
            }}
          >
            Critical error
          </div>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            The admin console couldn&apos;t load.
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#616a73",
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
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #e4e6ea",
                background: "#fff",
                fontFamily: "monospace",
                fontSize: 11,
                color: "#616a73",
              }}
            >
              Reference: {error.digest}
            </div>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "8px 16px",
              borderRadius: 6,
              border: 0,
              background: "#1a1c1f",
              color: "#fff",
              fontSize: 13,
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
