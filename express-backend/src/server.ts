import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ENV } from "./config/env.js";
import { AppDataSource } from "./data-source.js";
import { runSeeds } from "./seed.js";
import { attachAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { addressesRouter } from "./routes/addresses.js";
import { ordersRouter } from "./routes/orders.js";
import { usersRouter } from "./routes/users.js";
import { reviewsRouter } from "./routes/reviews.js";
import { analyticsRouter } from "./routes/analytics.js";
import { uploadsRouter } from "./routes/uploads.js";
import { settingsRouter } from "./routes/settings.js";
import { searchRouter } from "./routes/search.js";
import { pushRouter } from "./routes/push.js";
import { postexRouter } from "./routes/postex.js";
import { trackRouter } from "./routes/track.js";

async function main() {
  await AppDataSource.initialize();
  console.log(`[db] Connected — synchronize: true (schema synced)`);
  await runSeeds();

  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (ENV.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(attachAuth);

  app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use("/auth", authRouter);
  app.use("/products", productsRouter);
  app.use("/cart", cartRouter);
  app.use("/wishlist", wishlistRouter);
  app.use("/addresses", addressesRouter);
  app.use("/orders", ordersRouter);
  app.use("/users", usersRouter);
  app.use("/reviews", reviewsRouter);
  app.use("/analytics", analyticsRouter);
  app.use("/uploads", uploadsRouter);
  app.use("/settings", settingsRouter);
  app.use("/search", searchRouter);
  app.use("/push", pushRouter);
  app.use("/postex", postexRouter);
  app.use("/track", trackRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message ?? "Server error" });
  });

  app.listen(ENV.port, () => {
    console.log(`[api] http://localhost:${ENV.port}`);
  });
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
