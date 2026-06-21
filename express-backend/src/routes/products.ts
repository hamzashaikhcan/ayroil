import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { Product } from "../entities/Product.js";
import { requireAdmin } from "../middleware/auth.js";

export const productsRouter: Router = Router();

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
  res.json(items);
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
