import { Router } from "express";
import { z } from "zod";
import { ORDER_STATUS } from "@consts";
import { AppDataSource } from "../data-source.js";
import { Product } from "../entities/Product.js";
import { Review } from "../entities/Review.js";
import { OrderItem } from "../entities/OrderItem.js";
import { requireAdmin } from "../middleware/auth.js";

// Same "real sale" definition used by admin analytics — cancelled/refunded
// orders never counted as demand, everything else (including pending COD) does.
const EXCLUDED_FROM_SALES_COUNT = [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED];

export const productsRouter: Router = Router();

productsRouter.get("/", async (req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const q = (req.query.q as string | undefined)?.trim();
  const includeInactive = req.auth?.role === "admin" && req.query.all === "1";
  const qb = repo
    .createQueryBuilder("p")
    .orderBy("p.sortOrder", "ASC", "NULLS LAST")
    .addOrderBy("p.createdAt", "DESC");
  if (!includeInactive) qb.andWhere("p.active = true");
  if (q) qb.andWhere("(p.name ILIKE :q OR p.slug ILIKE :q)", { q: `%${q}%` });
  const items = await qb.getMany();

  if (!items.length) return res.json(items);

  // Reviews are shown site-wide (not scoped per product — the catalog is one
  // physical product sold in different bundle sizes), so every product gets
  // the same combined rating/count rather than its own slice.
  const { reviewCount, averageRating } = await siteWideReviewSummary();

  res.json(items.map((item) => ({ ...item, reviewCount, averageRating })));
});

async function siteWideReviewSummary(): Promise<{ reviewCount: number; averageRating: number }> {
  const row = await AppDataSource.getRepository(Review)
    .createQueryBuilder("r")
    .select("COUNT(r.id)", "reviewCount")
    .addSelect("AVG(r.rating)", "averageRating")
    .where("r.visible = true")
    .getRawOne<{ reviewCount: string; averageRating: string | null }>();
  return {
    reviewCount: Number(row?.reviewCount ?? 0),
    averageRating: row?.averageRating ? Number(row.averageRating) : 0,
  };
}

// Site-wide review pool — every product detail page shows the same combined
// list, since the catalog is one physical product in different bundle sizes.
// Registered before /:slug so "reviews" isn't swallowed as a slug value.
productsRouter.get("/reviews", async (_req, res) => {
  const reviews = await AppDataSource.getRepository(Review).find({
    where: { visible: true },
    order: { createdAt: "DESC" },
    take: 100,
  });

  res.json(
    reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerName,
      images: review.images ?? [],
      createdAt: review.createdAt,
    })),
  );
});

productsRouter.get("/:slug", async (req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const product = await repo.findOne({ where: { slug: req.params.slug } });
  if (!product) return res.status(404).json({ error: "Not found" });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const soldRow = await AppDataSource.getRepository(OrderItem)
    .createQueryBuilder("oi")
    .innerJoin("oi.order", "o")
    .select("COALESCE(SUM(oi.quantity), 0)::int", "units")
    .where("oi.product = :productId", { productId: product.id })
    .andWhere("o.createdAt >= :since", { since })
    .andWhere("o.status NOT IN (:...excluded)", { excluded: EXCLUDED_FROM_SALES_COUNT })
    .getRawOne<{ units: number }>();

  res.json({ ...product, soldLast24h: soldRow?.units ?? 0 });
});

const productSchema = z.object({
  slug: z.string().min(2).max(160),
  name: z.string().min(1).max(200),
  tagline: z.string().max(240).optional().nullable(),
  metaTitle: z.string().max(160).optional().nullable(),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).optional().nullable(),
  costCents: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(64).optional().nullable(),
  active: z.boolean().default(true),
  recommended: z.boolean().default(false),
  sortOrder: z.number().int().min(1).optional().nullable(),
  images: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  ingredients: z
    .array(z.object({ name: z.string(), description: z.string() }))
    .default([]),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

productsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  const repo = AppDataSource.getRepository(Product);
  const created = await repo.save(repo.create(parsed.data));
  res.status(201).json(created);
});

productsRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  const repo = AppDataSource.getRepository(Product);
  const product = await repo.findOne({ where: { id: String(req.params.id) } });
  if (!product) return res.status(404).json({ error: "Not found" });
  repo.merge(product, parsed.data);
  const saved = await repo.save(product);
  res.json(saved);
});

productsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const r = await repo.delete({ id: String(req.params.id) });
  if (!r.affected) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});
