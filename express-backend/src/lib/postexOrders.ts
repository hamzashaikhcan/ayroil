import { AppDataSource } from "../data-source.js";
import { SiteSettings } from "../entities/SiteSettings.js";
import { PostexShipment } from "../entities/PostexShipment.js";
import { Order } from "../entities/Order.js";
import { PostexApiError, resolvePostexToken, createOrder, getPickupAddresses } from "./postex.js";

/** Total shipment weight from each line's snapshotted per-unit weight — 0 if none of the items have a weight set. */
export function orderWeightGrams(order: Order): number {
  return order.items.reduce((sum, i) => sum + (i.unitWeightGrams ?? 0) * i.quantity, 0);
}

/** Folds a weight into free-text orderDetail — PostEx's create-order API has no structured weight field. */
export function withWeight(orderDetail: string, weightGrams: number): string {
  return weightGrams > 0 ? `${orderDetail} | Weight: ${weightGrams}g`.slice(0, 500) : orderDetail;
}

/**
 * Books a PostEx shipment for a freshly-checked-out order automatically —
 * this storefront is COD-only, so every order is a PostEx candidate. Mirrors
 * the fire-and-forget pattern used by the email/Slack/WhatsApp notifiers in
 * routes/orders.ts: never blocks or fails checkout. Skipped entirely unless
 * the admin has both saved a token AND flipped the "Use PostEx for order
 * fulfillment" switch on (SiteSettings.postexEnabled) — with it off, orders
 * fall back to the pre-PostEx manual-courier flow untouched. If PostEx is
 * unreachable or the city isn't one they serve, this just logs and leaves
 * the order unbooked — the admin can always book it manually from the order
 * detail page's PostEx card afterward.
 */
export async function autoCreatePostexShipment(order: Order, settings: SiteSettings | null): Promise<void> {
  if (!settings?.postexEnabled) return;
  const token = resolvePostexToken(settings);
  if (!token) return;

  try {
    const items = order.items.reduce((sum, i) => sum + i.quantity, 0) || 1;
    const weightGrams = orderWeightGrams(order);
    const orderDetail = withWeight(
      order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", "),
      weightGrams,
    );
    const deliveryAddress = [order.shippingAddress.line1, order.shippingAddress.line2].filter(Boolean).join(", ");
    const customerPhone = order.phone || order.shippingAddress.phone || "";
    // PostEx requires a pickup or store address code on every order. Fall
    // back to the merchant's first registered pickup address when no
    // default has been configured yet, so auto-booking works out of the
    // box — an admin only needs to set a default if they have more than one.
    const pickupAddressCode =
      settings?.postexDefaultPickupAddressCode || (await getPickupAddresses(token))[0]?.addressCode || undefined;

    const result = await createOrder(token, {
      cityName: order.shippingAddress.city,
      customerName: order.customerName,
      customerPhone,
      deliveryAddress,
      invoiceDivision: 1,
      invoicePayment: order.totalCents / 100,
      items,
      orderDetail,
      orderRefNumber: order.number,
      orderType: "Normal",
      pickupAddressCode,
    });

    const shipmentRepo = AppDataSource.getRepository(PostexShipment);
    await shipmentRepo.save(
      shipmentRepo.create({
        order,
        trackingNumber: result.trackingNumber,
        orderRefNumber: order.number,
        orderType: "Normal",
        customerName: order.customerName,
        customerPhone,
        deliveryAddress,
        cityName: order.shippingAddress.city,
        invoicePayment: String(order.totalCents / 100),
        items,
        orderDetail,
        weightGrams: weightGrams || null,
        pickupAddressCode: pickupAddressCode ?? null,
        status: result.orderStatus || "Unbooked",
      }),
    );

    await AppDataSource.getRepository(Order).update({ id: order.id }, { trackingNumber: result.trackingNumber });
  } catch (err) {
    if (err instanceof PostexApiError) {
      console.error(`[postex] auto-booking failed for order ${order.number}:`, err.message);
    } else {
      console.error(`[postex] auto-booking failed for order ${order.number}:`, err);
    }
  }
}
