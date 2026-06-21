import { Router } from "express";
import { ILike } from "typeorm";
import { AppDataSource } from "../data-source.js";
import { Order } from "../entities/Order.js";
import { Product } from "../entities/Product.js";
import { User } from "../entities/User.js";
import { requireAdmin } from "../middleware/auth.js";

export const searchRouter: Router = Router();

searchRouter.use(requireAdmin);

/**
 * Unified admin search across orders, products, and customers.
 * Returns up to 6 of each so the autocomplete popover stays scannable.
 */
searchRouter.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  if (!q || q.length < 2) {
    return res.json({ orders: [], products: [], customers: [] });
  }
  const like = `%${q}%`;

  const [orders, products, customers] = await Promise.all([
    AppDataSource.getRepository(Order)
      .createQueryBuilder("o")
      .leftJoin("o.user", "u")
      .where("o.number ILIKE :q", { q: like })
      .orWhere("o.email ILIKE :q", { q: like })
      .orWhere("o.customerName ILIKE :q", { q: like })
      .orderBy("o.createdAt", "DESC")
      .take(6)
      .getMany(),
    AppDataSource.getRepository(Product).find({
      where: [{ name: ILike(like) }, { slug: ILike(like) }, { sku: ILike(like) }],
      order: { createdAt: "DESC" },
      take: 6,
    }),
    AppDataSource.getRepository(User).find({
      where: [{ email: ILike(like) }, { name: ILike(like) }],
      order: { createdAt: "DESC" },
      take: 6,
    }),
  ]);

  res.json({
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      email: o.email,
      totalCents: o.totalCents,
      status: o.status,
      createdAt: o.createdAt,
    })),
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      priceCents: p.priceCents,
      stock: p.stock,
      active: p.active,
    })),
    customers: customers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    })),
  });
});
