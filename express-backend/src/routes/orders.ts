import { Router } from "express";
import { z } from "zod";
import { ORDER_STATUS, PAYMENT_STATUS } from "@consts";
import { AppDataSource } from "../data-source.js";
import { Order } from "../entities/Order.js";
import { OrderItem } from "../entities/OrderItem.js";
import { Cart } from "../entities/Cart.js";
import { CartItem } from "../entities/CartItem.js";
import { Product } from "../entities/Product.js";
import { User } from "../entities/User.js";
import { SiteSettings } from "../entities/SiteSettings.js";
import { newOrderNumber } from "../lib/orderNumber.js";
import { guestKeyFromRequest } from "../lib/guest.js";
import { sendOrderConfirmationEmail } from "../lib/email.js";
import { reconcileStockForStatusChange, STOCK_RELEASED_STATUSES } from "../lib/orderStock.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const ordersRouter: Router = Router();

const checkoutSchema = z.object({
  email: z.string().email(),
  customerName: z.string().min(1).max(120),
  phone: z.string().max(32).optional().nullable(),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    region: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
    phone: z.string().optional().nullable(),
  }),
  shippingCents: z.number().int().min(0).default(0),
  taxCents: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
});

ordersRouter.post("/checkout", async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });

  const cartRepo = AppDataSource.getRepository(Cart);
  let cart: Cart | null = null;
  if (req.auth) {
    cart = await cartRepo.findOne({ where: { user: { id: req.auth.sub } } });
  } else {
    cart = await cartRepo.findOne({ where: { guestKey: guestKeyFromRequest(req) } });
  }
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  let subtotalCents = 0;
  let costCents = 0;
  const lineSnapshots = cart.items.map((i) => {
    const line = i.product.priceCents * i.quantity;
    const cost = i.product.costCents * i.quantity;
    subtotalCents += line;
    costCents += cost;
    return {
      product: i.product,
      productName: i.product.name,
      unitPriceCents: i.product.priceCents,
      unitCostCents: i.product.costCents,
      quantity: i.quantity,
    };
  });

  const totalCents = subtotalCents + parsed.data.shippingCents + parsed.data.taxCents;
  const profitCents = totalCents - costCents - parsed.data.shippingCents;

  const orderRepo = AppDataSource.getRepository(Order);
  const order = await orderRepo.save(
    orderRepo.create({
      number: newOrderNumber(),
      user: req.auth
        ? await AppDataSource.getRepository(User).findOne({ where: { id: req.auth.sub } })
        : null,
      email: parsed.data.email,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone ?? null,
      shippingAddress: parsed.data.shippingAddress,
      status: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.UNPAID,
      subtotalCents,
      shippingCents: parsed.data.shippingCents,
      taxCents: parsed.data.taxCents,
      totalCents,
      costCents,
      profitCents,
      notes: parsed.data.notes ?? null,
      items: lineSnapshots.map((s) => {
        const oi = new OrderItem();
        oi.product = s.product;
        oi.productName = s.productName;
        oi.unitPriceCents = s.unitPriceCents;
        oi.unitCostCents = s.unitCostCents;
        oi.quantity = s.quantity;
        return oi;
      }),
    }),
  );

  // decrement stock + clear cart
  const productRepo = AppDataSource.getRepository(Product);
  for (const s of lineSnapshots) {
    await productRepo.decrement({ id: s.product.id }, "stock", s.quantity);
  }
  await AppDataSource.getRepository(CartItem).delete({ cart: { id: cart.id } });

  // Order confirmation email — fire-and-forget, never blocks checkout.
  const settings = await AppDataSource.getRepository(SiteSettings).findOne({ where: {} });
  if (settings) void sendOrderConfirmationEmail(order, settings);

  res.status(201).json(order);
});

ordersRouter.get("/mine", requireAuth, async (req, res) => {
  const items = await AppDataSource.getRepository(Order).find({
    where: { user: { id: req.auth!.sub } },
    order: { createdAt: "DESC" },
  });
  res.json(items);
});

ordersRouter.get("/mine/:number", requireAuth, async (req, res) => {
  const order = await AppDataSource.getRepository(Order).findOne({
    where: { number: String(req.params.number), user: { id: req.auth!.sub } },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

/**
 * Customer self-service cancel. Only allowed while the order hasn't started
 * fulfillment — once it's fulfilled/shipped/delivered, the customer has to
 * go through support so a human can decide whether the package can still be
 * stopped. Restores stock since the order no longer reserves it.
 */
ordersRouter.patch("/mine/:number/cancel", requireAuth, async (req, res) => {
  const repo = AppDataSource.getRepository(Order);
  const order = await repo.findOne({
    where: { number: String(req.params.number), user: { id: req.auth!.sub } },
    relations: { items: { product: true } },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  if (order.status !== ORDER_STATUS.PENDING) {
    return res.status(400).json({ error: "Only pending orders can be cancelled. Contact support for help with this order." });
  }

  const fromStatus = order.status;
  order.status = ORDER_STATUS.CANCELLED;
  await repo.save(order);
  await reconcileStockForStatusChange(order, fromStatus, ORDER_STATUS.CANCELLED);

  res.json(order);
});

/**
 * Customer self-service delete — removes the order from their history.
 * Only allowed once an order is cancelled, so an active/fulfilled order
 * (and its accounting record) can never disappear out from under the
 * business. Use the admin console to hard-delete anything else.
 */
ordersRouter.delete("/mine/:number", requireAuth, async (req, res) => {
  const repo = AppDataSource.getRepository(Order);
  const order = await repo.findOne({
    where: { number: String(req.params.number), user: { id: req.auth!.sub } },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  if (!STOCK_RELEASED_STATUSES.has(order.status)) {
    return res.status(400).json({ error: "Cancel this order before deleting it." });
  }

  await repo.delete({ id: order.id });
  res.json({ ok: true });
});

// Admin endpoints
ordersRouter.get("/", requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  const q = req.query.q as string | undefined;
  const qb = AppDataSource.getRepository(Order)
    .createQueryBuilder("o")
    .leftJoinAndSelect("o.user", "u")
    .orderBy("o.createdAt", "DESC")
    .take(200);
  if (status) qb.andWhere("o.status = :status", { status });
  if (q) qb.andWhere("(o.number ILIKE :q OR o.email ILIKE :q OR o.customerName ILIKE :q)", { q: `%${q}%` });
  res.json(await qb.getMany());
});

ordersRouter.get("/:id", requireAdmin, async (req, res) => {
  const order = await AppDataSource.getRepository(Order).findOne({
    where: { id: String(req.params.id) },
    relations: { user: true },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

const adminUpdateSchema = z.object({
  status: z.enum([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.FULFILLED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ]).optional(),
  paymentStatus: z.enum([
    PAYMENT_STATUS.UNPAID,
    PAYMENT_STATUS.AUTHORIZED,
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.REFUNDED,
  ]).optional(),
  notes: z.string().optional().nullable(),
});

ordersRouter.patch("/:id", requireAdmin, async (req, res) => {
  const parsed = adminUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const id = String(req.params.id);
  const repo = AppDataSource.getRepository(Order);
  const existing = await repo.findOne({ where: { id }, relations: { items: { product: true } } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const fromStatus = existing.status;
  await repo.update({ id }, parsed.data);

  if (parsed.data.status && parsed.data.status !== fromStatus) {
    await reconcileStockForStatusChange(existing, fromStatus, parsed.data.status);
  }

  const fresh = await repo.findOne({ where: { id } });
  res.json(fresh);
});

ordersRouter.delete("/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const repo = AppDataSource.getRepository(Order);
  const existing = await repo.findOne({ where: { id }, relations: { items: { product: true } } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  // Releasing the order on delete frees any stock it was still holding.
  await reconcileStockForStatusChange(existing, existing.status, null);
  await repo.delete({ id });
  res.json({ ok: true });
});
