import { Router } from "express";
import { Between, In, Not } from "typeorm";
import { ORDER_STATUS, ROLES } from "@consts";
import { AppDataSource } from "../data-source.js";
import { Order } from "../entities/Order.js";
import { OrderItem } from "../entities/OrderItem.js";
import { User } from "../entities/User.js";
import { Product } from "../entities/Product.js";
import { Cart } from "../entities/Cart.js";
import { Review } from "../entities/Review.js";
import { bucketSize, resolveRange, type RangePreset } from "../lib/dateRange.js";
import { requireAdmin } from "../middleware/auth.js";

export const analyticsRouter: Router = Router();

analyticsRouter.use(requireAdmin);

/**
 * Lightweight counts for the admin sidebar badges. Kept separate from
 * /overview (which is range-scoped and heavier) so it can be fetched cheaply
 * on every page render. "newOrders" is the actionable count of orders still
 * awaiting fulfillment (status = pending); the rest are simple totals.
 */
analyticsRouter.get("/counts", async (_req, res) => {
  const [newOrders, activeCarts, products, reviews] = await Promise.all([
    AppDataSource.getRepository(Order).count({ where: { status: ORDER_STATUS.PENDING } }),
    AppDataSource.getRepository(Cart)
      .createQueryBuilder("cart")
      .innerJoin("cart.items", "items")
      .getCount(),
    AppDataSource.getRepository(Product).count(),
    AppDataSource.getRepository(Review).count(),
  ]);

  res.json({ newOrders, activeCarts, products, reviews });
});

// Cancelled/refunded orders never reserve stock or count as net revenue —
// exclude them from every revenue/profit/units calculation below. They
// still show up in the plain order list elsewhere in the admin console.
const EXCLUDED_FROM_KPIS = [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED];

function parseRange(req: import("express").Request) {
  return resolveRange(
    req.query.preset as RangePreset | undefined,
    req.query.from as string | undefined,
    req.query.to as string | undefined,
  );
}

analyticsRouter.get("/overview", async (req, res) => {
  const range = parseRange(req);
  const orderRepo = AppDataSource.getRepository(Order);
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);

  const ordersInRange = await orderRepo.find({
    where: { createdAt: Between(range.from, range.to), status: Not(In(EXCLUDED_FROM_KPIS)) },
  });
  const totalOrders = ordersInRange.length;
  const revenueCents = ordersInRange.reduce((a, o) => a + o.totalCents, 0);
  const profitCents = ordersInRange.reduce((a, o) => a + o.profitCents, 0);
  const aovCents = totalOrders ? Math.round(revenueCents / totalOrders) : 0;
  const unitsSold = ordersInRange.reduce(
    (a, o) => a + o.items.reduce((b, i) => b + i.quantity, 0),
    0,
  );

  const newUsers = await userRepo.count({
    where: { createdAt: Between(range.from, range.to), role: Not(ROLES.ADMIN) },
  });

  const totalUsers = await userRepo.count({ where: { role: Not(ROLES.ADMIN) } });
  const totalProducts = await productRepo.count();

  const recentOrders = await orderRepo.find({
    order: { createdAt: "DESC" },
    take: 10,
    relations: { user: true },
  });

  res.json({
    range,
    bucket: bucketSize(range),
    kpis: {
      revenueCents,
      profitCents,
      totalOrders,
      aovCents,
      unitsSold,
      newUsers,
      totalUsers,
      totalProducts,
    },
    recentOrders,
  });
});

analyticsRouter.get("/orders-timeseries", async (req, res) => {
  const range = parseRange(req);
  const bucket = bucketSize(range);
  const trunc =
    bucket === "day" ? "day" : bucket === "week" ? "week" : "month";

  const rows = (await AppDataSource.getRepository(Order)
    .createQueryBuilder("o")
    .select(`DATE_TRUNC('${trunc}', o.createdAt)`, "bucket")
    .addSelect("COUNT(*)::int", "orders")
    .addSelect("COALESCE(SUM(o.totalCents), 0)::bigint", "revenueCents")
    .addSelect("COALESCE(SUM(o.profitCents), 0)::bigint", "profitCents")
    .where("o.createdAt BETWEEN :from AND :to", { from: range.from, to: range.to })
    .andWhere("o.status NOT IN (:...excluded)", { excluded: EXCLUDED_FROM_KPIS })
    .groupBy("bucket")
    .orderBy("bucket", "ASC")
    .getRawMany()) as Array<{
      bucket: string;
      orders: number;
      revenueCents: string;
      profitCents: string;
    }>;

  res.json({
    bucket,
    series: rows.map((r) => ({
      bucket: r.bucket,
      orders: Number(r.orders),
      revenueCents: Number(r.revenueCents),
      profitCents: Number(r.profitCents),
    })),
  });
});

analyticsRouter.get("/top-products", async (req, res) => {
  const range = parseRange(req);
  const rows = (await AppDataSource.getRepository(OrderItem)
    .createQueryBuilder("oi")
    .innerJoin("oi.order", "o")
    .select("oi.productName", "productName")
    .addSelect("SUM(oi.quantity)::int", "units")
    .addSelect("SUM(oi.quantity * oi.unitPriceCents)::bigint", "revenueCents")
    .where("o.createdAt BETWEEN :from AND :to", { from: range.from, to: range.to })
    .andWhere("o.status NOT IN (:...excluded)", { excluded: EXCLUDED_FROM_KPIS })
    .groupBy("oi.productName")
    .orderBy("units", "DESC")
    .limit(10)
    .getRawMany()) as Array<{
      productName: string;
      units: string;
      revenueCents: string;
    }>;

  res.json(
    rows.map((r) => ({
      productName: r.productName,
      units: Number(r.units),
      revenueCents: Number(r.revenueCents),
    })),
  );
});
