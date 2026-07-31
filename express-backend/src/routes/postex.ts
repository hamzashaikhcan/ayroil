import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { SiteSettings } from "../entities/SiteSettings.js";
import { PostexShipment } from "../entities/PostexShipment.js";
import { Order } from "../entities/Order.js";
import { requireAdmin } from "../middleware/auth.js";
import { orderWeightGrams, withWeight } from "../lib/postexOrders.js";
import {
  PostexApiError,
  resolvePostexToken,
  getOperationalCities,
  getPickupAddresses,
  createPickupAddress,
  createOrder,
  trackOrder,
  trackBulkOrders,
  cancelOrder,
  getAirwayBill,
  generateLoadSheet,
  saveShipperAdvice,
  getShipperAdvice,
  getPaymentStatus,
  listOrders,
  listUnbookedOrders,
  POSTEX_ORDER_TYPES,
  POSTEX_ORDER_STATUSES,
} from "../lib/postex.js";

export const postexRouter: Router = Router();
postexRouter.use(requireAdmin);

async function getSettings(): Promise<SiteSettings> {
  const repo = AppDataSource.getRepository(SiteSettings);
  const existing = await repo.findOne({ where: {}, order: { createdAt: "ASC" } });
  if (existing) return existing;
  return repo.save(repo.create());
}

/**
 * PostEx is opt-in — every route that talks to their API goes through this
 * instead of resolvePostexToken directly, so a missing token surfaces as a
 * clear "not configured" 400 rather than PostEx itself rejecting an empty
 * token with a confusing error.
 */
class PostexNotConfiguredError extends Error {}

async function requireToken(settings: SiteSettings): Promise<string> {
  const token = resolvePostexToken(settings);
  if (!token) throw new PostexNotConfiguredError();
  return token;
}

function handlePostexError(res: import("express").Response, err: unknown) {
  if (err instanceof PostexNotConfiguredError) {
    return res.status(400).json({ error: "PostEx isn't configured yet — add an API token in PostEx > Settings." });
  }
  if (err instanceof PostexApiError) {
    return res.status(502).json({ error: err.message, details: err.body });
  }
  console.error("[postex]", err);
  return res.status(502).json({ error: "PostEx request failed" });
}

// ---- Settings -------------------------------------------------------------

function serializeSettings(settings: SiteSettings) {
  const configured = !!settings.postexApiToken.trim();
  return {
    postexApiToken: settings.postexApiToken,
    postexDefaultPickupAddressCode: settings.postexDefaultPickupAddressCode,
    postexEnabled: settings.postexEnabled,
    // Token saved — the admin PostEx tab (manual booking, tracking, etc.) works whenever this is true.
    configured,
    // Both the toggle is on AND a token is saved — checkout auto-books and
    // order-detail tracking numbers lock to PostEx only when this is true.
    active: settings.postexEnabled && configured,
  };
}

postexRouter.get("/settings", async (_req, res) => {
  const settings = await getSettings();
  res.json(serializeSettings(settings));
});

const settingsSchema = z
  .object({
    postexApiToken: z.string().max(255),
    postexEnabled: z.boolean(),
    postexDefaultPickupAddressCode: z.string().max(64),
  })
  .partial();

postexRouter.put("/settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  const repo = AppDataSource.getRepository(SiteSettings);
  const settings = await getSettings();
  repo.merge(settings, parsed.data);
  await repo.save(settings);
  res.json(serializeSettings(settings));
});

postexRouter.get("/order-types", (_req, res) => res.json(POSTEX_ORDER_TYPES));
postexRouter.get("/order-statuses", (_req, res) => res.json(POSTEX_ORDER_STATUSES));

// ---- Operational cities -----------------------------------------------------

postexRouter.get("/cities", async (req, res) => {
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const type = req.query.type as "Pickup" | "Delivery" | undefined;
    const cities = await getOperationalCities(token, type);
    res.json(cities);
  } catch (err) {
    handlePostexError(res, err);
  }
});

// ---- Pickup addresses -------------------------------------------------------

postexRouter.get("/pickup-addresses", async (req, res) => {
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const addresses = await getPickupAddresses(token, req.query.cityName as string | undefined);
    res.json(addresses);
  } catch (err) {
    handlePostexError(res, err);
  }
});

const createAddressSchema = z.object({
  address: z.string().min(1),
  addressTypeId: z.union([z.literal(1), z.literal(2)]),
  cityName: z.string().min(1),
  contactPersonName: z.string().min(1),
  phone1: z.string().min(1),
  phone2: z.string().min(1),
  phone3: z.string().optional(),
  wareHouseManagerName: z.string().optional(),
});

postexRouter.post("/pickup-addresses", async (req, res) => {
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    await createPickupAddress(token, parsed.data);
    res.status(201).json({ ok: true });
  } catch (err) {
    handlePostexError(res, err);
  }
});

// ---- Shipments (local mirror) ----------------------------------------------

function serializeShipment(s: PostexShipment) {
  return {
    id: s.id,
    orderId: s.order?.id ?? null,
    orderNumber: s.order?.number ?? null,
    trackingNumber: s.trackingNumber,
    orderRefNumber: s.orderRefNumber,
    orderType: s.orderType,
    customerName: s.customerName,
    customerPhone: s.customerPhone,
    deliveryAddress: s.deliveryAddress,
    cityName: s.cityName,
    invoicePayment: Number(s.invoicePayment),
    items: s.items,
    orderDetail: s.orderDetail,
    transactionNotes: s.transactionNotes,
    pickupAddressCode: s.pickupAddressCode,
    weightGrams: s.weightGrams,
    status: s.status,
    lastTrackedAt: s.lastTrackedAt,
    createdAt: s.createdAt,
  };
}

postexRouter.get("/shipments", async (req, res) => {
  const repo = AppDataSource.getRepository(PostexShipment);
  const orderId = req.query.orderId as string | undefined;
  const items = await repo.find({
    where: orderId ? { order: { id: orderId } } : {},
    relations: { order: true },
    order: { createdAt: "DESC" },
    take: 200,
  });
  res.json(items.map(serializeShipment));
});

const createShipmentSchema = z.object({
  orderId: z.string().uuid().optional().nullable(),
  cityName: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  deliveryAddress: z.string().min(1),
  invoiceDivision: z.number().int().min(1).default(1),
  invoicePayment: z.number().min(0),
  items: z.number().int().min(1),
  orderDetail: z.string().optional(),
  orderRefNumber: z.string().min(1),
  orderType: z.enum(["Normal", "Reverse", "Replacement"]),
  transactionNotes: z.string().optional(),
  pickupAddressCode: z.string().optional(),
  storeAddressCode: z.string().optional(),
  // Only meaningful without orderId — order-linked shipments always derive
  // weight from the order's line items (see orderWeightGrams()).
  weightGrams: z.number().int().min(0).optional(),
});

postexRouter.post("/shipments", async (req, res) => {
  const parsed = createShipmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  const { orderId, weightGrams: manualWeightGrams, ...input } = parsed.data;

  let order: Order | null = null;
  if (orderId) {
    order = await AppDataSource.getRepository(Order).findOne({ where: { id: orderId }, relations: { items: true } });
    if (!order) return res.status(404).json({ error: "Order not found" });
  }

  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const pickupAddressCode = input.pickupAddressCode || settings.postexDefaultPickupAddressCode || undefined;
    const weightGrams = order ? orderWeightGrams(order) : (manualWeightGrams ?? 0);
    const orderDetail = withWeight(input.orderDetail ?? "", weightGrams).trim() || undefined;
    const result = await createOrder(token, { ...input, orderDetail, pickupAddressCode });

    const repo = AppDataSource.getRepository(PostexShipment);
    const shipment = await repo.save(
      repo.create({
        order,
        trackingNumber: result.trackingNumber,
        orderRefNumber: input.orderRefNumber,
        orderType: input.orderType,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        cityName: input.cityName,
        invoicePayment: String(input.invoicePayment),
        weightGrams: weightGrams || null,
        items: input.items,
        orderDetail: input.orderDetail ?? null,
        transactionNotes: input.transactionNotes ?? null,
        pickupAddressCode: pickupAddressCode ?? null,
        status: result.orderStatus || "Unbooked",
      }),
    );

    if (order) {
      await AppDataSource.getRepository(Order).update({ id: order.id }, { trackingNumber: result.trackingNumber });
    }

    res.status(201).json(serializeShipment(shipment));
  } catch (err) {
    handlePostexError(res, err);
  }
});

postexRouter.post("/shipments/:trackingNumber/track", async (req, res) => {
  const trackingNumber = String(req.params.trackingNumber);
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const record = await trackOrder(token, trackingNumber);

    const repo = AppDataSource.getRepository(PostexShipment);
    const shipment = await repo.findOne({ where: { trackingNumber }, relations: { order: true } });
    if (shipment) {
      shipment.status = record.transactionStatus || shipment.status;
      shipment.lastTrackedAt = new Date();
      await repo.save(shipment);
    }
    res.json({ record, shipment: shipment ? serializeShipment(shipment) : null });
  } catch (err) {
    handlePostexError(res, err);
  }
});

const bulkTrackSchema = z.object({ trackingNumbers: z.array(z.string().min(1)).min(1).max(50) });

postexRouter.post("/shipments/track-bulk", async (req, res) => {
  const parsed = bulkTrackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const results = await trackBulkOrders(token, parsed.data.trackingNumbers);

    const repo = AppDataSource.getRepository(PostexShipment);
    for (const r of results) {
      const shipment = await repo.findOne({ where: { trackingNumber: r.trackingNumber } });
      if (shipment) {
        shipment.status = r.trackingResponse?.transactionStatus || shipment.status;
        shipment.lastTrackedAt = new Date();
        await repo.save(shipment);
      }
    }
    res.json(results);
  } catch (err) {
    handlePostexError(res, err);
  }
});

postexRouter.post("/shipments/:trackingNumber/cancel", async (req, res) => {
  const trackingNumber = String(req.params.trackingNumber);
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    await cancelOrder(token, trackingNumber);

    const repo = AppDataSource.getRepository(PostexShipment);
    await repo.update({ trackingNumber }, { status: "Cancelled", lastTrackedAt: new Date() });
    const shipment = await repo.findOne({ where: { trackingNumber }, relations: { order: true } });
    res.json(shipment ? serializeShipment(shipment) : { ok: true });
  } catch (err) {
    handlePostexError(res, err);
  }
});

postexRouter.get("/shipments/:trackingNumber/payment-status", async (req, res) => {
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const status = await getPaymentStatus(token, String(req.params.trackingNumber));
    res.json(status);
  } catch (err) {
    handlePostexError(res, err);
  }
});

postexRouter.get("/shipments/:trackingNumber/airway-bill", async (req, res) => {
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const pdf = await getAirwayBill(token, [String(req.params.trackingNumber)]);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${req.params.trackingNumber}.pdf"`);
    res.send(pdf);
  } catch (err) {
    handlePostexError(res, err);
  }
});

const bulkPdfSchema = z.object({ trackingNumbers: z.array(z.string().min(1)).min(1).max(10) });

postexRouter.post("/shipments/airway-bill", async (req, res) => {
  const parsed = bulkPdfSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid — max 10 tracking numbers per airway bill" });
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const pdf = await getAirwayBill(token, parsed.data.trackingNumbers);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="airway-bills.pdf"`);
    res.send(pdf);
  } catch (err) {
    handlePostexError(res, err);
  }
});

const loadSheetSchema = z.object({
  trackingNumbers: z.array(z.string().min(1)).min(1),
  pickupAddress: z.string().optional(),
});

postexRouter.post("/load-sheet", async (req, res) => {
  const parsed = loadSheetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const pdf = await generateLoadSheet(token, parsed.data.trackingNumbers, parsed.data.pickupAddress);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="load-sheet.pdf"`);
    res.send(pdf);
  } catch (err) {
    handlePostexError(res, err);
  }
});

const shipperAdviceSchema = z.object({
  statusId: z.union([z.literal(1), z.literal(2)]),
  remarks: z.string().min(1),
});

postexRouter.put("/shipments/:trackingNumber/shipper-advice", async (req, res) => {
  const parsed = shipperAdviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    await saveShipperAdvice(token, { trackingNumber: String(req.params.trackingNumber), ...parsed.data });
    res.json({ ok: true });
  } catch (err) {
    handlePostexError(res, err);
  }
});

postexRouter.get("/shipments/:trackingNumber/shipper-advice", async (req, res) => {
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const advice = await getShipperAdvice(token, String(req.params.trackingNumber));
    res.json(advice);
  } catch (err) {
    handlePostexError(res, err);
  }
});

// ---- Sync from PostEx --------------------------------------------------------

const syncSchema = z.object({
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  onlyUnbooked: z.boolean().optional().default(false),
});

/**
 * Pulls every order PostEx has on file for a date range — including ones
 * booked directly in the PostEx merchant portal, not through this admin
 * console — and upserts them into the local shipments mirror so this tab
 * reflects the merchant's real PostEx account, not just what we've booked.
 */
postexRouter.post("/shipments/sync", async (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  try {
    const settings = await getSettings();
    const token = await requireToken(settings);
    const { fromDate, toDate, onlyUnbooked } = parsed.data;

    const shipmentRepo = AppDataSource.getRepository(PostexShipment);
    const orderRepo = AppDataSource.getRepository(Order);
    let imported = 0;
    let updated = 0;

    if (onlyUnbooked) {
      const unbooked = await listUnbookedOrders(token, { startDate: fromDate, endDate: toDate });
      for (const rec of unbooked) {
        const existing = await shipmentRepo.findOne({ where: { trackingNumber: rec.trackingNumber } });
        if (existing) {
          existing.status = "Unbooked";
          existing.lastTrackedAt = new Date();
          await shipmentRepo.save(existing);
          updated++;
        } else {
          const order = await orderRepo.findOne({ where: { number: rec.orderRefNumber } });
          await shipmentRepo.save(
            shipmentRepo.create({
              order,
              trackingNumber: rec.trackingNumber,
              orderRefNumber: rec.orderRefNumber,
              orderType: "Normal",
              customerName: rec.customerName,
              customerPhone: rec.customerPhone,
              deliveryAddress: rec.deliveryAddress,
              cityName: rec.cityName,
              invoicePayment: String(rec.invoicePayment),
              items: 1,
              status: "Unbooked",
              lastTrackedAt: new Date(),
            }),
          );
          imported++;
        }
      }
    } else {
      const records = await listOrders(token, { orderStatusId: 0, startDate: fromDate, endDate: toDate });
      for (const rec of records) {
        const existing = await shipmentRepo.findOne({ where: { trackingNumber: rec.trackingNumber } });
        if (existing) {
          existing.status = rec.transactionStatus || existing.status;
          existing.lastTrackedAt = new Date();
          await shipmentRepo.save(existing);
          updated++;
        } else {
          const order = await orderRepo.findOne({ where: { number: rec.orderRefNumber } });
          await shipmentRepo.save(
            shipmentRepo.create({
              order,
              trackingNumber: rec.trackingNumber,
              orderRefNumber: rec.orderRefNumber,
              orderType: "Normal",
              customerName: rec.customerName,
              customerPhone: rec.customerPhone,
              deliveryAddress: rec.deliveryAddress,
              cityName: rec.cityName,
              invoicePayment: String(rec.invoicePayment),
              items: rec.items || 1,
              orderDetail: rec.orderDetail || null,
              status: rec.transactionStatus || "Unbooked",
              lastTrackedAt: new Date(),
            }),
          );
          imported++;
        }
      }
    }

    res.json({ imported, updated });
  } catch (err) {
    handlePostexError(res, err);
  }
});
