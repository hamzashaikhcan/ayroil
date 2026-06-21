import type { NextConfig } from "next";
import path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Pin Turbopack to *this* directory so the workspace auto-detection
  // doesn't walk up and grab ~/package-lock.json as the project root.
  turbopack: {
    root: PROJECT_ROOT,
  },
  // Same anchor for the file-tracing layer used by `next build`.
  outputFileTracingRoot: PROJECT_ROOT,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "index, follow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/(account|checkout|cart|orders|login|register|api)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
