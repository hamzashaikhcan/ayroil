import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { Product } from "../entities/Product.js";
import { Review } from "../entities/Review.js";
import { requireAdmin } from "../middleware/auth.js";

export const reviewsRouter: Router = Router();

reviewsRouter.use(requireAdmin);

reviewsRouter.get("/", async (req, res) => {
  const status = String(req.query.status ?? "all");
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const repo = AppDataSource.getRepository(Review);
  const qb = repo
    .createQueryBuilder("r")
    .leftJoinAndSelect("r.product", "p")
    .leftJoinAndSelect("r.order", "o")
    .orderBy("r.createdAt", "DESC")
    .skip((page - 1) * limit)
    .take(limit);

  if (status === "visible") qb.andWhere("r.visible = true");
  if (status === "hidden") qb.andWhere("r.visible = false");

  const [reviews, total] = await qb.getManyAndCount();
  res.json({
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / limit)),
    items: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerName,
      visible: review.visible,
      createdAt: review.createdAt,
      product: review.product
        ? {
            id: review.product.id,
            slug: review.product.slug,
            name: review.product.name,
          }
        : null,
      order: review.order
        ? {
            id: review.order.id,
            number: review.order.number,
          }
        : null,
    })),
  });
});

const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(4000).default(""),
  customerName: z.string().min(1).max(120),
  visible: z.boolean().default(true),
  /** Optional backdate so admin-added reviews can carry a realistic date. */
  createdAt: z.coerce.date().optional(),
});

// Admin-created review: no order behind it, attached directly to a product.
reviewsRouter.post("/", async (req, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });

  const product = await AppDataSource.getRepository(Product).findOne({
    where: { id: parsed.data.productId },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const repo = AppDataSource.getRepository(Review);
  const review = repo.create({
    order: null,
    product,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    customerName: parsed.data.customerName,
    visible: parsed.data.visible,
    ...(parsed.data.createdAt ? { createdAt: parsed.data.createdAt } : {}),
  });
  const saved = await repo.save(review);
  res.status(201).json({ id: saved.id });
});

const updateReviewSchema = z.object({
  visible: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(4000).optional(),
  customerName: z.string().min(1).max(120).optional(),
  createdAt: z.coerce.date().optional(),
});

reviewsRouter.patch("/:id", async (req, res) => {
  const parsed = updateReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });

  const repo = AppDataSource.getRepository(Review);
  const review = await repo.findOne({ where: { id: String(req.params.id) } });
  if (!review) return res.status(404).json({ error: "Not found" });

  const { visible, rating, comment, customerName, createdAt } = parsed.data;
  if (visible !== undefined) review.visible = visible;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (customerName !== undefined) review.customerName = customerName;
  if (createdAt !== undefined) review.createdAt = createdAt;
  const saved = await repo.save(review);
  res.json(saved);
});

reviewsRouter.delete("/:id", async (req, res) => {
  const r = await AppDataSource.getRepository(Review).delete({ id: String(req.params.id) });
  if (!r.affected) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});
