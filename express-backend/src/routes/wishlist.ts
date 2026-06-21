import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { WishlistItem } from "../entities/WishlistItem.js";
import { Product } from "../entities/Product.js";
import { requireAuth } from "../middleware/auth.js";

export const wishlistRouter: Router = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get("/", async (req, res) => {
  const items = await AppDataSource.getRepository(WishlistItem).find({
    where: { user: { id: req.auth!.sub } },
    order: { createdAt: "DESC" },
  });
  res.json(items);
});

const addSchema = z.object({ productId: z.string().uuid() });

wishlistRouter.post("/", async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const repo = AppDataSource.getRepository(WishlistItem);
  const product = await AppDataSource.getRepository(Product).findOne({
    where: { id: parsed.data.productId },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  const existing = await repo.findOne({
    where: { user: { id: req.auth!.sub }, product: { id: product.id } },
  });
  if (existing) return res.json(existing);
  const created = await repo.save(
    repo.create({ user: { id: req.auth!.sub } as never, product }),
  );
  res.status(201).json(created);
});

wishlistRouter.delete("/:productId", async (req, res) => {
  const repo = AppDataSource.getRepository(WishlistItem);
  await repo.delete({
    user: { id: req.auth!.sub } as never,
    product: { id: String(req.params.productId) } as never,
  });
  res.json({ ok: true });
});
