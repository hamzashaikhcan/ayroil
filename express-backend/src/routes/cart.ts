import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { Cart } from "../entities/Cart.js";
import { CartItem } from "../entities/CartItem.js";
import { Product } from "../entities/Product.js";
import { SiteSettings } from "../entities/SiteSettings.js";
import { User } from "../entities/User.js";
import { guestKeyFromRequest } from "../lib/guest.js";
import { requireAdmin } from "../middleware/auth.js";

export const cartRouter: Router = Router();

async function getOrCreateCart(req: import("express").Request): Promise<Cart> {
  const repo = AppDataSource.getRepository(Cart);
  if (req.auth) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.auth.sub } });
    let cart = await repo.findOne({ where: { user: { id: req.auth.sub } } });
    if (!cart) {
      cart = await repo.save(repo.create({ user: user ?? null, items: [] }));
    }
    // merge guest cart into user cart, if a guest cart exists for this IP/UA
    const guestKey = guestKeyFromRequest(req);
    const guestCart = await repo.findOne({ where: { guestKey } });
    if (guestCart && guestCart.id !== cart.id) {
      for (const gi of guestCart.items) {
        const existing = cart.items.find((i) => i.product.id === gi.product.id);
        if (existing) existing.quantity += gi.quantity;
        else cart.items.push(gi);
      }
      cart = await repo.save(cart);
      await repo.delete({ id: guestCart.id });
    }
    return cart;
  }
  const guestKey = guestKeyFromRequest(req);
  let cart = await repo.findOne({ where: { guestKey } });
  if (!cart) cart = await repo.save(repo.create({ guestKey, items: [] }));
  return cart;
}

cartRouter.get("/", async (req, res) => {
  const cart = await getOrCreateCart(req);
  res.json(await serialize(cart));
});

const addSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
  offer: z
    .object({
      discountPercent: z.number().int().min(1).max(95),
      expiresAt: z.string().datetime(),
    })
    .optional(),
});

cartRouter.post("/items", async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const cart = await getOrCreateCart(req);
  const productRepo = AppDataSource.getRepository(Product);
  const product = await productRepo.findOne({ where: { id: parsed.data.productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (parsed.data.offer) {
    const settings = await AppDataSource.getRepository(SiteSettings).findOne({ where: {} });
    const expiresAt = new Date(parsed.data.offer.expiresAt);
    const now = Date.now();
    const maxExpiresAt = now + (settings?.productTimerDurationSeconds ?? 0) * 1000 + 5000;
    const validOffer =
      !!settings?.productTimerEnabled &&
      parsed.data.offer.discountPercent === settings.productTimerDiscountPercent &&
      expiresAt.getTime() > now &&
      expiresAt.getTime() <= maxExpiresAt;
    if (validOffer) {
      cart.offerDiscountPercent = parsed.data.offer.discountPercent;
      cart.offerExpiresAt = expiresAt;
      await AppDataSource.getRepository(Cart).save(cart);
    }
  }

  const itemRepo = AppDataSource.getRepository(CartItem);
  const existing = cart.items.find((i) => i.product.id === product.id);
  if (existing) {
    existing.quantity += parsed.data.quantity;
    await itemRepo.save(existing);
  } else {
    await itemRepo.save(
      itemRepo.create({ cart, product, quantity: parsed.data.quantity }),
    );
  }
  const fresh = await AppDataSource.getRepository(Cart).findOne({
    where: { id: cart.id },
  });
  res.json(await serialize(fresh!));
});

const updateSchema = z.object({ quantity: z.number().int().min(0).max(99) });

cartRouter.patch("/items/:itemId", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const cart = await getOrCreateCart(req);
  const itemRepo = AppDataSource.getRepository(CartItem);
  const item = await itemRepo.findOne({
    where: { id: req.params.itemId, cart: { id: cart.id } },
  });
  if (!item) return res.status(404).json({ error: "Not found" });
  if (parsed.data.quantity === 0) {
    await itemRepo.delete({ id: item.id });
  } else {
    item.quantity = parsed.data.quantity;
    await itemRepo.save(item);
  }
  const fresh = await AppDataSource.getRepository(Cart).findOne({
    where: { id: cart.id },
  });
  res.json(await serialize(fresh!));
});

cartRouter.delete("/items/:itemId", async (req, res) => {
  const cart = await getOrCreateCart(req);
  const itemRepo = AppDataSource.getRepository(CartItem);
  await itemRepo.delete({ id: req.params.itemId, cart: { id: cart.id } });
  const fresh = await AppDataSource.getRepository(Cart).findOne({
    where: { id: cart.id },
  });
  res.json(await serialize(fresh!));
});

cartRouter.delete("/", async (req, res) => {
  const cart = await getOrCreateCart(req);
  const itemRepo = AppDataSource.getRepository(CartItem);
  await itemRepo.delete({ cart: { id: cart.id } });
  const fresh = await AppDataSource.getRepository(Cart).findOne({
    where: { id: cart.id },
  });
  res.json(await serialize(fresh!));
});

function discountedPriceCents(priceCents: number, discountPercent: number): number {
  if (discountPercent <= 0) return priceCents;
  return Math.max(0, Math.round(priceCents * (100 - discountPercent) / 100));
}

async function serialize(cart: Cart) {
  const discountPercent =
    cart.offerExpiresAt && cart.offerExpiresAt.getTime() > Date.now()
      ? Math.max(0, Math.min(95, cart.offerDiscountPercent ?? 0))
      : 0;
  const items = cart.items.map((i) => ({
    id: i.id,
    productId: i.product.id,
    slug: i.product.slug,
    name: i.product.name,
    priceCents: discountedPriceCents(i.product.priceCents, discountPercent),
    image: i.product.images?.[0] ?? null,
    quantity: i.quantity,
    lineTotalCents: discountedPriceCents(i.product.priceCents, discountPercent) * i.quantity,
  }));
  const subtotalCents = items.reduce((a, i) => a + i.lineTotalCents, 0);
  return {
    id: cart.id,
    items,
    subtotalCents,
    totalUnits: items.reduce((a, i) => a + i.quantity, 0),
  };
}

/**
 * Admin: list every active cart in the system, with owner info and line items.
 * "Active" = has at least one item.
 */
cartRouter.get("/active", requireAdmin, async (_req, res) => {
  const carts = await AppDataSource.getRepository(Cart)
    .createQueryBuilder("cart")
    .leftJoinAndSelect("cart.user", "user")
    .leftJoinAndSelect("cart.items", "items")
    .leftJoinAndSelect("items.product", "product")
    .where("items.id IS NOT NULL")
    .orderBy("cart.updatedAt", "DESC")
    .getMany();

  const payload = carts.map((cart) => {
    const items = cart.items.map((i) => ({
      id: i.id,
      productId: i.product?.id ?? null,
      productSlug: i.product?.slug ?? null,
      productName: i.product?.name ?? "(deleted product)",
      unitPriceCents: i.product?.priceCents ?? 0,
      quantity: i.quantity,
      lineTotalCents: (i.product?.priceCents ?? 0) * i.quantity,
    }));
    const subtotalCents = items.reduce((a, i) => a + i.lineTotalCents, 0);
    const totalUnits = items.reduce((a, i) => a + i.quantity, 0);
    return {
      id: cart.id,
      ownerType: cart.user ? "user" : "guest",
      user: cart.user
        ? {
            id: cart.user.id,
            email: cart.user.email,
            name: cart.user.name,
            phone: cart.user.phone,
          }
        : null,
      guestKey: cart.guestKey,
      items,
      subtotalCents,
      totalUnits,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  });

  const summary = {
    totalCarts: payload.length,
    totalUnits: payload.reduce((a, c) => a + c.totalUnits, 0),
    totalCents: payload.reduce((a, c) => a + c.subtotalCents, 0),
    guestCarts: payload.filter((c) => c.ownerType === "guest").length,
    userCarts: payload.filter((c) => c.ownerType === "user").length,
  };

  res.json({ summary, carts: payload });
});
