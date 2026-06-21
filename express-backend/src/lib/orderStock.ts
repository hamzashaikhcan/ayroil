import { ORDER_STATUS, type OrderStatus } from "@consts";
import { AppDataSource } from "../data-source.js";
import { Order } from "../entities/Order.js";
import { Product } from "../entities/Product.js";

/** Statuses that mean the order no longer reserves stock. */
export const STOCK_RELEASED_STATUSES: ReadonlySet<OrderStatus> = new Set([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);

/**
 * Adjust product stock by `sign` (+1 to restore, -1 to re-deduct) for every
 * line item on the order. Items whose product was since deleted are skipped
 * — there's nothing left to restock.
 */
async function adjustStock(order: Order, sign: 1 | -1): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  for (const item of order.items) {
    if (!item.product) continue;
    await productRepo.increment({ id: item.product.id }, "stock", sign * item.quantity);
  }
}

/**
 * Called whenever an order's status changes (or it's deleted). Restores
 * stock the first time an order moves into a released state, and re-deducts
 * it if a released order is reactivated. Pass `toStatus: null` for deletes.
 */
export async function reconcileStockForStatusChange(
  order: Order,
  fromStatus: OrderStatus,
  toStatus: OrderStatus | null,
): Promise<void> {
  const wasReleased = STOCK_RELEASED_STATUSES.has(fromStatus);
  const isReleased = toStatus === null ? true : STOCK_RELEASED_STATUSES.has(toStatus);

  if (!wasReleased && isReleased) {
    await adjustStock(order, 1);
  } else if (wasReleased && !isReleased) {
    await adjustStock(order, -1);
  }
}
