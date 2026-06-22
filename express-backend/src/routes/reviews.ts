import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { Review } from "../entities/Review.js";
import { requireAdmin } from "../middleware/auth.js";

export const reviewsRouter: Router = Router();

reviewsRouter.use(requireAdmin);

reviewsRouter.get("/", async (req, res) => {
  const status = String(req.query.status ?? "all");
  const repo = AppDataSource.getRepository(Review);
  const qb = repo
    .createQueryBuilder("r")
    .leftJoinAndSelect("r.product", "p")
    .leftJoinAndSelect("r.order", "o")
    .orderBy("r.createdAt", "DESC")
    .take(200);

  if (status === "visible") qb.andWhere("r.visible = true");
  if (status === "hidden") qb.andWhere("r.visible = false");

  const reviews = await qb.getMany();
  res.json(
    reviews.map((review) => ({
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
  );
});

const updateReviewSchema = z.object({
  visible: z.boolean(),
});

reviewsRouter.patch("/:id", async (req, res) => {
  const parsed = updateReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });

  const repo = AppDataSource.getRepository(Review);
  const review = await repo.findOne({ where: { id: String(req.params.id) } });
  if (!review) return res.status(404).json({ error: "Not found" });

  review.visible = parsed.data.visible;
  const saved = await repo.save(review);
  res.json(saved);
});

reviewsRouter.delete("/:id", async (req, res) => {
  const r = await AppDataSource.getRepository(Review).delete({ id: String(req.params.id) });
  if (!r.affected) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});
