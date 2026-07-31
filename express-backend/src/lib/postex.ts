import type { SiteSettings } from "../entities/SiteSettings.js";

/**
 * Thin client over PostEx's Merchant API (see
 * PostEx-COD_API_Integration_Guide_V4.1.9.pdf at the repo root). The guide's
 * shipper-advice URLs use a "service/integration" (singular) base path, but
 * that 404s in practice — verified against the live API that every endpoint,
 * including shipper-advice, actually lives under "services/integration"
 * (plural), same as the rest.
 */

export class PostexApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "PostexApiError";
  }
}

/**
 * PostEx is opt-in: it only becomes active once an admin explicitly saves a
 * token in PostEx > Settings. There is no environment-variable fallback —
 * without a saved token, this returns "" and every caller (auto-booking on
 * checkout, every /postex/* route) must treat that as "PostEx is off,
 * behave exactly like it were never integrated."
 */
export function resolvePostexToken(settings: Pick<SiteSettings, "postexApiToken"> | null): string {
  return settings?.postexApiToken?.trim() ?? "";
}

type PostexEnvelope<T> = {
  statusCode: string;
  statusMessage: string;
  dist: T;
};

async function postexRequest<T>(
  url: string,
  token: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      token,
      "Content-Type": "application/json",
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new PostexApiError(`PostEx returned a non-JSON response (HTTP ${res.status})`, res.status, text);
  }

  if (!res.ok) {
    const message = (json as { statusMessage?: string })?.statusMessage ?? `PostEx request failed (HTTP ${res.status})`;
    throw new PostexApiError(message, res.status, json);
  }

  // PostEx sometimes reports failure (e.g. an unknown tracking number) as
  // HTTP 200 with its own {statusCode: "404", statusMessage: "..."} body
  // instead of a real HTTP error — verified live against track-order.
  // Trust the body's statusCode over the HTTP status when both are present.
  const bodyStatusCode = (json as { statusCode?: string })?.statusCode;
  if (bodyStatusCode !== undefined && !bodyStatusCode.startsWith("2")) {
    const message = (json as { statusMessage?: string })?.statusMessage ?? `PostEx request failed (status ${bodyStatusCode})`;
    throw new PostexApiError(message, Number(bodyStatusCode) || res.status, json);
  }

  return ((json as PostexEnvelope<T>)?.dist ?? json) as T;
}

async function postexBinary(url: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<Buffer> {
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: { token, "Content-Type": "application/json" },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PostexApiError(`PostEx request failed (HTTP ${res.status})`, res.status, text);
  }
  return Buffer.from(await res.arrayBuffer());
}

export type PostexCity = {
  operationalCityName: string;
  countryName: string;
  isPickupCity: boolean;
  isDeliveryCity: boolean;
};

export function getOperationalCities(token: string, operationalCityType?: "Pickup" | "Delivery") {
  const qs = operationalCityType ? `?operationalCityType=${operationalCityType}` : "";
  return postexRequest<PostexCity[]>(
    `https://api.postex.pk/services/integration/api/order/v2/get-operational-city${qs}`,
    token,
  );
}

export type PostexPickupAddress = {
  phone1: string;
  phone2: string;
  contactPersonName: string;
  cityName: string;
  address: string;
  addressCode: string;
};

export function getPickupAddresses(token: string, cityName?: string) {
  const qs = cityName ? `?cityName=${encodeURIComponent(cityName)}` : "";
  return postexRequest<PostexPickupAddress[]>(
    `https://api.postex.pk/services/integration/api/order/v1/get-merchant-address${qs}`,
    token,
  );
}

export type CreatePickupAddressInput = {
  address: string;
  addressTypeId: 1 | 2; // 1 = Return, 2 = Pickup
  cityName: string;
  contactPersonName: string;
  phone1: string;
  phone2: string;
  phone3?: string;
  wareHouseManagerName?: string;
};

export function createPickupAddress(token: string, input: CreatePickupAddressInput) {
  return postexRequest<null>(`https://api.postex.pk/services/integration/api/order/v2/create-merchant-address`, token, {
    method: "POST",
    body: input,
  });
}

export type CreateOrderInput = {
  cityName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  invoiceDivision: number;
  invoicePayment: number;
  items: number;
  orderDetail?: string;
  orderRefNumber: string;
  orderType: "Normal" | "Reverse" | "Replacement";
  transactionNotes?: string;
  pickupAddressCode?: string;
  storeAddressCode?: string;
};

export type CreateOrderResult = {
  trackingNumber: string;
  orderStatus: string;
  orderDate: string;
};

export function createOrder(token: string, input: CreateOrderInput) {
  return postexRequest<CreateOrderResult>(`https://api.postex.pk/services/integration/api/order/v3/create-order`, token, {
    method: "POST",
    body: input,
  });
}

export type PostexTrackingRecord = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  invoicePayment: number;
  orderDetail: string;
  orderRefNumber: string;
  transactionTax: number;
  transactionFee: number;
  trackingNumber: string;
  transactionDate: string;
  upfrontPayment: number;
  merchantName: string;
  transactionStatus: string;
  reversalTax: number;
  reversalFee: number;
  cityName: string;
  transactionNotes: string;
  balancePayment: number;
  transactionStatusHistory?: { transactionStatusMessage: string; transactionStatusMessageCode: string }[];
};

export function trackOrder(token: string, trackingNumber: string) {
  return postexRequest<PostexTrackingRecord>(
    `https://api.postex.pk/services/integration/api/order/v1/track-order/${encodeURIComponent(trackingNumber)}`,
    token,
  );
}

export function trackBulkOrders(token: string, trackingNumbers: string[]) {
  const qs = encodeURIComponent(trackingNumbers.join(","));
  return postexRequest<{ trackingNumber: string; message: string; trackingResponse: PostexTrackingRecord }[]>(
    `https://api.postex.pk/services/integration/api/order/v1/track-bulk-order?trackingNumber=${qs}`,
    token,
  );
}

export function cancelOrder(token: string, trackingNumber: string) {
  return postexRequest<null>(`https://api.postex.pk/services/integration/api/order/v1/cancel-order`, token, {
    method: "PUT",
    body: { trackingNumber },
  });
}

export function getAirwayBill(token: string, trackingNumbers: string[]) {
  const qs = encodeURIComponent(trackingNumbers.slice(0, 10).join(","));
  return postexBinary(
    `https://api.postex.pk/services/integration/api/order/v1/get-invoice?trackingNumbers=${qs}`,
    token,
  );
}

export function generateLoadSheet(token: string, trackingNumbers: string[], pickupAddress?: string) {
  return postexBinary(`https://api.postex.pk/services/integration/api/order/v2/generate-load-sheet`, token, {
    method: "POST",
    body: { trackingNumbers, pickupAddress },
  });
}

export type SaveShipperAdviceInput = {
  trackingNumber: string;
  statusId: 1 | 2; // 1 = Mark Return Requested, 2 = Mark Retry Attempt
  remarks: string;
};

export function saveShipperAdvice(token: string, input: SaveShipperAdviceInput) {
  return postexRequest<null>(`https://api.postex.pk/services/integration/api/order/v2/save-shipper-advice`, token, {
    method: "PUT",
    body: input,
  });
}

export type ShipperAdviceRecord = { remarks: string; remarksDate: string; username: string };

export function getShipperAdvice(token: string, trackingNumber: string) {
  return postexRequest<{ trackingNumber: string; message: string; trackingResponse: ShipperAdviceRecord[] }[]>(
    `https://api.postex.pk/services/integration/api/order/v1/get-shipper-advice/${encodeURIComponent(trackingNumber)}`,
    token,
  );
}

export type PostexPaymentStatus = {
  orderRefNumber: string;
  trackingNumber: string;
  settle: boolean;
  settlementDate: string | null;
  upfrontPaymentDate: string | null;
  cprNumber_1: string | null;
  reservePaymentDate: string | null;
  cprNumber_2: string | null;
};

export function getPaymentStatus(token: string, trackingNumber: string) {
  return postexRequest<PostexPaymentStatus>(
    `https://api.postex.pk/services/integration/api/order/v1/payment-status/${encodeURIComponent(trackingNumber)}`,
    token,
  );
}

// Static enum lists published by PostEx (order/v1/get-order-types and
// order/v1/get-order-status) — fixed values, not worth a round trip per page load.
export const POSTEX_ORDER_TYPES = ["Normal", "Reverse", "Replacement"] as const;

export const POSTEX_ORDER_STATUSES = [
  "Unbooked",
  "Booked",
  "PostEx WareHouse",
  "Out For Delivery",
  "Delivered",
  "Returned",
  "Un-Assigned By Me",
  "Expired",
  "Delivery Under Review",
  "Picked By PostEx",
  "Out For Return",
  "Attempted",
  "En-Route to PostEx warehouse",
] as const;

// Customer-facing copy for PostEx's raw status strings — used by the public
// /track endpoint. PostEx's own labels are written for merchants, not
// shoppers (e.g. "Un-Assigned By Me" is what a cancelled-before-pickup
// booking shows as, which reads as a system glitch to a customer). The
// admin console's PostEx tab intentionally keeps the raw label instead —
// ops staff want the literal PostEx status, not a simplified one.
const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  Unbooked: "Order received",
  Booked: "Booked for pickup",
  "PostEx WareHouse": "At courier warehouse",
  "Out For Delivery": "Out for delivery",
  Delivered: "Delivered",
  Returned: "Returned",
  "Un-Assigned By Me": "Cancelled",
  Cancelled: "Cancelled",
  Expired: "Expired",
  "Delivery Under Review": "Delivery under review",
  "Picked By PostEx": "Picked up by courier",
  "Out For Return": "Being returned",
  Attempted: "Delivery attempted",
  "En-Route to PostEx warehouse": "En route to courier warehouse",
};

export function customerFacingStatus(rawStatus: string): string {
  return CUSTOMER_STATUS_LABELS[rawStatus] ?? rawStatus;
}

// orderStatusID values accepted by get-all-order — PostEx skips 10-14.
export const POSTEX_ORDER_STATUS_IDS: Record<(typeof POSTEX_ORDER_STATUSES)[number], number> = {
  Unbooked: 1,
  Booked: 2,
  "PostEx WareHouse": 3,
  "Out For Delivery": 4,
  Delivered: 5,
  Returned: 6,
  "Un-Assigned By Me": 7,
  Expired: 8,
  "Delivery Under Review": 9,
  "Picked By PostEx": 15,
  "Out For Return": 16,
  Attempted: 17,
  "En-Route to PostEx warehouse": 18,
};

export type PostexOrderListRecord = PostexTrackingRecord & { items: number; invoiceDivision: number };

/**
 * order/v1/get-all-order — every order booked with PostEx in a date range,
 * regardless of whether it was created through this admin console. Used to
 * reconcile local records against the merchant's actual PostEx account.
 * orderStatusId 0 means "all statuses" per the guide. Note: verified against
 * the live API — the guide's request params (orderStatusID/fromDate/toDate)
 * are wrong; the real query params are orderStatusId/startDate/endDate, and
 * the response `dist` is a flat array of records, not the nested
 * {trackingResponse, trackingNumber, message}[] shape the guide shows.
 */
export function listOrders(token: string, params: { orderStatusId: number; startDate: string; endDate: string }) {
  const qs = new URLSearchParams({
    orderStatusId: String(params.orderStatusId),
    startDate: params.startDate,
    endDate: params.endDate,
  });
  return postexRequest<PostexOrderListRecord[]>(
    `https://api.postex.pk/services/integration/api/order/v1/get-all-order?${qs.toString()}`,
    token,
  );
}

export type PostexUnbookedOrder = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  invoicePayment: number;
  orderDetail: string;
  orderPickupDate: string | null;
  orderDeliveryDate: string | null;
  orderRefNumber: string;
  transactionTax: number;
  transactionFee: number;
  trackingNumber: string;
  transactionDate: string;
  cityName: string;
};

/** order/v2/get-unbooked-orders — orders sitting in PostEx that haven't been booked for pickup yet. */
export function listUnbookedOrders(token: string, params: { startDate: string; endDate: string; cityName?: string }) {
  const qs = new URLSearchParams({ startDate: params.startDate, endDate: params.endDate });
  if (params.cityName) qs.set("cityName", params.cityName);
  return postexRequest<PostexUnbookedOrder[]>(
    `https://api.postex.pk/services/integration/api/order/v2/get-unbooked-orders?${qs.toString()}`,
    token,
  );
}
