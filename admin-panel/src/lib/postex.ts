import { adminServerFetch } from "./server-api";

export type PostexCity = {
  operationalCityName: string;
  countryName: string;
  isPickupCity: boolean;
  isDeliveryCity: boolean;
};

export type PostexPickupAddress = {
  phone1: string;
  phone2: string;
  contactPersonName: string;
  cityName: string;
  address: string;
  addressCode: string;
};

export type PostexSettings = {
  postexApiToken: string;
  postexDefaultPickupAddressCode: string;
  /** The "Use PostEx for order fulfillment" switch — independent of whether a token is saved. */
  postexEnabled: boolean;
  /** True once an admin has saved a non-empty token — PostEx is opt-in, there is no env-var fallback. */
  configured: boolean;
  /** postexEnabled && configured — the single flag that gates auto-booking and the order-detail tracking field lock. */
  active: boolean;
};

export type PostexShipment = {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  trackingNumber: string;
  orderRefNumber: string;
  orderType: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  cityName: string;
  invoicePayment: number;
  items: number;
  orderDetail: string | null;
  transactionNotes: string | null;
  pickupAddressCode: string | null;
  weightGrams: number | null;
  status: string;
  lastTrackedAt: string | null;
  createdAt: string;
};

export const POSTEX_ORDER_TYPES = ["Normal", "Reverse", "Replacement"] as const;

export async function fetchPostexSettings(): Promise<PostexSettings | null> {
  try {
    return await adminServerFetch<PostexSettings>("/postex/settings");
  } catch {
    return null;
  }
}

export async function fetchPostexShipments(orderId?: string): Promise<PostexShipment[]> {
  try {
    const qs = orderId ? `?orderId=${encodeURIComponent(orderId)}` : "";
    return await adminServerFetch<PostexShipment[]>(`/postex/shipments${qs}`);
  } catch {
    return [];
  }
}

export async function fetchPostexPickupAddresses(): Promise<PostexPickupAddress[]> {
  try {
    return await adminServerFetch<PostexPickupAddress[]>("/postex/pickup-addresses");
  } catch {
    return [];
  }
}

export async function fetchPostexCities(): Promise<PostexCity[]> {
  try {
    return await adminServerFetch<PostexCity[]>("/postex/cities");
  } catch {
    return [];
  }
}
