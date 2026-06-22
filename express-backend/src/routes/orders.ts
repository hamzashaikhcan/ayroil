import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { ORDER_STATUS, PAYMENT_STATUS } from "@consts";
import { AppDataSource } from "../data-source.js";
import { Order } from "../entities/Order.js";
import { OrderItem } from "../entities/OrderItem.js";
import { Review } from "../entities/Review.js";
import { Cart } from "../entities/Cart.js";
import { CartItem } from "../entities/CartItem.js";
import { Product } from "../entities/Product.js";
import { User } from "../entities/User.js";
import { SiteSettings } from "../entities/SiteSettings.js";
import { newOrderNumber } from "../lib/orderNumber.js";
import { guestKeyFromRequest } from "../lib/guest.js";
import { sendOrderConfirmationEmail, sendShippedOrderEmail, sendDeliveredReviewEmail } from "../lib/email.js";
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

  const settings = await AppDataSource.getRepository(SiteSettings).findOne({ where: {} });
  const discountPercent = cart.offerExpiresAt && cart.offerExpiresAt.getTime() > Date.now()
    ? Math.max(0, Math.min(95, cart.offerDiscountPercent ?? 0))
    : 0;
  const effectivePriceCents = (priceCents: number) =>
    discountPercent > 0 ? Math.max(0, Math.round(priceCents * (100 - discountPercent) / 100)) : priceCents;

  let subtotalCents = 0;
  let costCents = 0;
  const lineSnapshots = cart.items.map((i) => {
    const unitPriceCents = effectivePriceCents(i.product.priceCents);
    const line = unitPriceCents * i.quantity;
    const cost = i.product.costCents * i.quantity;
    subtotalCents += line;
    costCents += cost;
    return {
      product: i.product,
      productName: i.product.name,
      unitPriceCents,
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

/**
 * Public, token-based review lookup/submission — no session involved. The
 * token (minted on DELIVERED, see PATCH /:id below) is the only credential;
 * same trust model as a password-reset link. reviewTokenUsedAt being set is
 * what makes the link single-use: both routes re-check it on every call.
 *
 * Keep these before the admin /:id routes, otherwise Express treats an order
 * number as the :id segment and the nested /review path never gets here.
 */
function reviewTokenIsValid(order: Order | null, token: string | undefined): order is Order {
  return !!order && !!token && order.reviewToken === token && !order.reviewTokenUsedAt && order.status === ORDER_STATUS.DELIVERED;
}

ordersRouter.get("/:number/review", async (req, res) => {
  const order = await AppDataSource.getRepository(Order).findOne({
    where: { number: String(req.params.number) },
    relations: { items: { product: true } },
  });
  if (!reviewTokenIsValid(order, req.query.token as string | undefined)) {
    return res.status(410).json({ error: "This review link is invalid or has already been used." });
  }
  res.json({
    number: order.number,
    customerName: order.customerName,
    items: order.items.map((i) => ({
      productName: i.productName,
      slug: i.product?.slug ?? null,
      image: i.product?.images?.[0] ?? null,
    })),
  });
});

const reviewSubmitSchema = z.object({
  token: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(""),
});

ordersRouter.post("/:number/review", async (req, res) => {
  const parsed = reviewSubmitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });

  const orderRepo = AppDataSource.getRepository(Order);
  const order = await orderRepo.findOne({
    where: { number: String(req.params.number) },
    relations: { items: { product: true } },
  });
  if (!reviewTokenIsValid(order, parsed.data.token)) {
    return res.status(410).json({ error: "This review link is invalid or has already been used." });
  }

  await AppDataSource.getRepository(Review).save({
    order,
    product: order.items[0]?.product ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment.trim(),
    customerName: order.customerName,
    visible: false,
  });
  await orderRepo.update({ id: order.id }, { reviewTokenUsedAt: new Date() });

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
  trackingNumber: z.string().max(64).optional().nullable(),
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

  // Transitioning into DELIVERED mints a one-time review token and fires the
  // "please review" email automatically — no separate admin action needed.
  if (parsed.data.status === ORDER_STATUS.DELIVERED && fromStatus !== ORDER_STATUS.DELIVERED) {
    const reviewToken = crypto.randomBytes(32).toString("hex");
    await repo.update({ id }, { reviewToken, reviewTokenUsedAt: null });
    const settings = await AppDataSource.getRepository(SiteSettings).findOne({ where: {} });
    if (settings) void sendDeliveredReviewEmail(existing, settings, reviewToken);
  }

  const fresh = await repo.findOne({ where: { id } });
  res.json(fresh);
});

/**
 * Manual "your order shipped" notification — decoupled from the status
 * PATCH above so the admin can set/update the tracking number first and
 * choose when to actually email the customer (and resend if needed).
 */
ordersRouter.post("/:id/notify-shipped", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const order = await AppDataSource.getRepository(Order).findOne({
    where: { id },
    relations: { items: { product: true } },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  if (!order.trackingNumber?.trim()) {
    return res.status(400).json({ error: "Add a tracking number before sending the shipped email." });
  }
  const settings = await AppDataSource.getRepository(SiteSettings).findOne({ where: {} });
  if (!settings) return res.status(400).json({ error: "Email isn't configured yet." });
  await sendShippedOrderEmail(order, settings);
  res.json({ ok: true });
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
