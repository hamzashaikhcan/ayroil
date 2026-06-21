import { Router } from "express";
import { createHash } from "node:crypto";
import { ENV } from "../config/env.js";
import { requireAdmin } from "../middleware/auth.js";

export const uploadsRouter: Router = Router();

uploadsRouter.use(requireAdmin);

/**
 * Mint signed upload params for Cloudinary.
 *
 * Cloudinary's signed upload protocol:
 *   1. Collect all upload params except `file`, `api_key`, `resource_type`,
 *      and `signature` itself.
 *   2. Sort them alphabetically by key.
 *   3. Encode as `key1=value1&key2=value2&...`.
 *   4. Append the API secret.
 *   5. SHA-1 the resulting string.
 *
 * The admin app then POSTs to
 *   https://api.cloudinary.com/v1_1/<cloudName>/image/upload
 * with the file + these returned params + the signature.
 */
uploadsRouter.get("/sign", (_req, res) => {
  if (!ENV.cloudinary.cloudName || !ENV.cloudinary.apiKey || !ENV.cloudinary.apiSecret) {
    return res.status(503).json({
      error:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the backend .env.",
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = ENV.cloudinary.uploadFolder;

  // Params that participate in the signature, sorted alphabetically by key.
  const signedParams: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
  };

  const toSign = Object.keys(signedParams)
    .sort()
    .map((k) => `${k}=${signedParams[k]}`)
    .join("&");

  const signature = createHash("sha1")
    .update(toSign + ENV.cloudinary.apiSecret)
    .digest("hex");

  res.json({
    cloudName: ENV.cloudinary.cloudName,
    apiKey: ENV.cloudinary.apiKey,
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${ENV.cloudinary.cloudName}/image/upload`,
  });
});
