import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { Order } from "../entities/Order.js";
import { SiteSettings } from "../entities/SiteSettings.js";
import { PostexApiError, resolvePostexToken, trackOrder, customerFacingStatus } from "../lib/postex.js";

/**
 * Public order-tracking lookup — no session/auth involved, same trust model
 * as the public order-detail page. A customer can enter either their own
 * order number (e.g. "PO-XXXXXXXX") or a raw PostEx tracking number; we try
 * both interpretations server-side so the customer doesn't need to know
 * which one they have.
 *
 * Deliberately never returns PII (customerName/phone/deliveryAddress) even
 * though PostEx's track-order API includes it — unlike our own CSPRNG order
 * number, PostEx tracking numbers are sequential and easily guessable, so
 * echoing that data back here would let anyone enumerate other customers'
 * names/phones/addresses.
 */
export const trackRouter: Router = Router();

type TrackResponse = {
  found: boolean;
  orderNumber: string | null;
  orderStatus: string | null;
  trackingNumber: string | null;
  courier: "postex" | null;
  status: string | null;
  cityName: string | null;
  transactionDate: string | null;
  history: { message: string; code: string }[];
};

function orderStatusOnly(order: Order): TrackResponse {
  return {
    found: true,
    orderNumber: order.number,
    orderStatus: order.status,
    trackingNumber: order.trackingNumber,
    courier: null,
    status: null,
    cityName: null,
    transactionDate: null,
    history: [],
  };
}

const querySchema = z.object({ query: z.string().trim().min(1).max(64) });

trackRouter.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter an order number or tracking number." });
  }
  const query = parsed.data.query;

  const order = await AppDataSource.getRepository(Order).findOne({ where: { number: query.toUpperCase() } });
  const trackingNumber = order?.trackingNumber || query;

  // Order exists locally but has never been booked with a courier yet —
  // nothing to ask PostEx for, just report our own order status.
  if (order && !order.trackingNumber) {
    return res.json(orderStatusOnly(order));
  }

  const settings = await AppDataSource.getRepository(SiteSettings).findOne({ where: {}, order: { createdAt: "ASC" } });
  const token = resolvePostexToken(settings);
  if (!token) {
    if (order) return res.json(orderStatusOnly(order));
    return res.status(404).json({ error: "We couldn't find that order or tracking number." });
  }

  try {
    const record = await trackOrder(token, trackingNumber);
    const response: TrackResponse = {
      found: true,
      orderNumber: order?.number ?? null,
      orderStatus: order?.status ?? null,
      trackingNumber: record.trackingNumber,
      courier: "postex",
      status: customerFacingStatus(record.transactionStatus),
      cityName: record.cityName,
      transactionDate: record.transactionDate,
      history: (record.transactionStatusHistory ?? []).map((h) => ({
        message: h.transactionStatusMessage,
        code: h.transactionStatusMessageCode,
      })),
    };
    return res.json(response);
  } catch (err) {
    // PostEx doesn't recognize this tracking number. If it's at least a
    // known order of ours, fall back to reporting our own order status
    // instead of a bare "not found".
    if (order) return res.json(orderStatusOnly(order));
    if (err instanceof PostexApiError) {
      return res.status(404).json({ error: "We couldn't find that order or tracking number." });
    }
    console.error("[track]", err);
    return res.status(502).json({ error: "Tracking is temporarily unavailable. Please try again shortly." });
  }
});
