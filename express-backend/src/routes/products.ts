import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { Product } from "../entities/Product.js";
import { Review } from "../entities/Review.js";
import { requireAdmin } from "../middleware/auth.js";

export const productsRouter: Router = Router();

function maskCustomerName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  if (first.length <= 1) return first ? `${first}****` : "A****";
  return `${first[0]}${"*".repeat(Math.max(4, first.length - 2))}${first[first.length - 1]}`;
}

productsRouter.get("/", async (req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const q = (req.query.q as string | undefined)?.trim();
  const includeInactive = req.auth?.role === "admin" && req.query.all === "1";
  const qb = repo
    .createQueryBuilder("p")
    .orderBy("p.createdAt", "DESC");
  if (!includeInactive) qb.andWhere("p.active = true");
  if (q) qb.andWhere("(p.name ILIKE :q OR p.slug ILIKE :q)", { q: `%${q}%` });
  const items = await qb.getMany();

  if (!items.length) return res.json(items);

  const productIds = items.map((item) => item.id);
  const reviewRows = await AppDataSource.getRepository(Review)
    .createQueryBuilder("r")
    .leftJoin("r.product", "p")
    .select("p.id", "productId")
    .addSelect("COUNT(r.id)", "reviewCount")
    .addSelect("AVG(r.rating)", "averageRating")
    .where("p.id IN (:...productIds)", { productIds })
    .andWhere("r.visible = true")
    .groupBy("p.id")
    .getRawMany<{ productId: string; reviewCount: string; averageRating: string | null }>();

  const reviewSummaryByProductId = new Map(
    reviewRows.map((row) => [
      row.productId,
      {
        reviewCount: Number(row.reviewCount),
        averageRating: row.averageRating ? Number(row.averageRating) : 0,
      },
    ]),
  );

  res.json(
    items.map((item) => ({
      ...item,
      reviewCount: reviewSummaryByProductId.get(item.id)?.reviewCount ?? 0,
      averageRating: reviewSummaryByProductId.get(item.id)?.averageRating ?? 0,
    })),
  );
});

productsRouter.get("/:slug/reviews", async (req, res) => {
  const product = await AppDataSource.getRepository(Product).findOne({
    where: { slug: req.params.slug, active: true },
  });
  if (!product) return res.status(404).json({ error: "Not found" });

  const reviews = await AppDataSource.getRepository(Review).find({
    where: { product: { id: product.id }, visible: true },
    order: { createdAt: "DESC" },
    take: 50,
  });

  res.json(
    reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: maskCustomerName(review.customerName),
      createdAt: review.createdAt,
    })),
  );
});

productsRouter.get("/:slug", async (req, res) => {
  const repo = AppDataSource.getRepository(Product);
  const product = await repo.findOne({ where: { slug: req.params.slug } });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

const productSchema = z.object({
  slug: z.string().min(2).max(160),
  name: z.string().min(1).max(200),
  tagline: z.string().max(240).optional().nullable(),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).optional().nullable(),
  costCents: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(64).optional().nullable(),
  active: z.boolean().default(true),
  recommended: z.boolean().default(false),
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
