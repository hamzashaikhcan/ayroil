import "dotenv/config";

function need(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const STOREFRONT_SECRET = process.env.AUTH_SECRET_STOREFRONT ?? process.env.AUTH_SECRET ?? "dev-storefront-secret-change-me";
const ADMIN_SECRET = process.env.AUTH_SECRET_ADMIN ?? process.env.AUTH_SECRET ?? "dev-admin-secret-change-me";

export const ENV = {
  nodeEnv: need("NODE_ENV", "development"),
  port: Number(need("PORT", "4000")),

  db: {
    host: need("DB_HOST", "localhost"),
    port: Number(need("DB_PORT", "5432")),
    user: need("DB_USER", "templates"),
    password: need("DB_PASSWORD", "templates"),
    name: need("DB_NAME", "templates_dev"),
  },

  auth: {
    storefrontSecret: STOREFRONT_SECRET,
    adminSecret: ADMIN_SECRET,
    /**
     * The JWT `aud` claim is used to keep storefront-signed tokens out of
     * admin-only routes, and vice versa. A storefront login can never
     * elevate to admin even if the user's role flips in the DB.
     */
    storefrontAudience: "storefront",
    adminAudience: "admin",
  },

  corsOrigins: need("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  seed: {
    adminEmail: need("SEED_ADMIN_EMAIL", "admin@productone.example"),
    adminPassword: need("SEED_ADMIN_PASSWORD", "admin1234"),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    uploadFolder: process.env.CLOUDINARY_FOLDER ?? "products",
  },

  slack: {
    token: process.env.SLACK_TOKEN ?? "",
    alertChannel: process.env.SLACK_ALERT_CHANNEL ?? "",
  },

  // Web Push (VAPID) — powers admin PWA new-order notifications. When the
  // keys are absent, push is simply skipped (never blocks checkout).
  webPush: {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
    privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    subject: process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
  },
};
