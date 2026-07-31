"use client";

import { useEffect, useState } from "react";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import type { PostexCity, PostexPickupAddress, PostexShipment } from "@/lib/postex";

export type OrderOption = {
  id: string;
  number: string;
  customerName: string;
  email: string;
  phone: string | null;
  totalCents: number;
  shippingAddress: { line1: string; line2?: string | null; city: string };
};

export function NewShipmentModal({
  cities,
  pickupAddresses,
  defaultPickupAddressCode,
  lockedOrder,
  onClose,
  onCreated,
}: {
  cities: PostexCity[];
  pickupAddresses: PostexPickupAddress[];
  defaultPickupAddressCode: string;
  /** When set (e.g. embedded on an order detail page), skips the order picker and locks the shipment to this order. */
  lockedOrder?: OrderOption;
  onClose: () => void;
  onCreated: (shipment: PostexShipment) => void;
}) {
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [orderId, setOrderId] = useState<string>(lockedOrder?.id ?? "");

  const [orderRefNumber, setOrderRefNumber] = useState(lockedOrder?.number ?? "");
  const [customerName, setCustomerName] = useState(lockedOrder?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(lockedOrder?.phone ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(
    lockedOrder ? [lockedOrder.shippingAddress.line1, lockedOrder.shippingAddress.line2].filter(Boolean).join(", ") : "",
  );
  const [cityName, setCityName] = useState(lockedOrder?.shippingAddress.city || cities[0]?.operationalCityName || "");
  const [invoicePayment, setInvoicePayment] = useState(lockedOrder ? (lockedOrder.totalCents / 100).toFixed(0) : "");
  const [items, setItems] = useState("1");
  const [invoiceDivision, setInvoiceDivision] = useState("1");
  const [orderType, setOrderType] = useState<"Normal" | "Reverse" | "Replacement">("Normal");
  const [orderDetail, setOrderDetail] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [transactionNotes, setTransactionNotes] = useState("");
  const [pickupAddressCode, setPickupAddressCode] = useState(defaultPickupAddressCode);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lockedOrder) return;
    adminClientFetch<OrderOption[]>("/orders")
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [lockedOrder]);

  function applyOrder(id: string) {
    setOrderId(id);
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    setOrderRefNumber(order.number);
    setCustomerName(order.customerName);
    setCustomerPhone(order.phone ?? "");
    const addr = order.shippingAddress;
    setDeliveryAddress([addr.line1, addr.line2].filter(Boolean).join(", "));
    setCityName(addr.city || cityName);
    setInvoicePayment((order.totalCents / 100).toFixed(0));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const shipment = await adminClientFetch<PostexShipment>("/postex/shipments", {
        method: "POST",
        body: JSON.stringify({
          orderId: orderId || undefined,
          orderRefNumber,
          customerName,
          customerPhone,
          deliveryAddress,
          cityName,
          invoicePayment: Number(invoicePayment),
          items: Number(items),
          invoiceDivision: Number(invoiceDivision),
          orderType,
          orderDetail: orderDetail || undefined,
          weightGrams: !orderId && weightGrams ? Number(weightGrams) : undefined,
          transactionNotes: transactionNotes || undefined,
          pickupAddressCode: pickupAddressCode || undefined,
        }),
      });
      onCreated(shipment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shipment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-line bg-surface shadow-[0_24px_80px_-24px_rgba(16,24,40,0.25)]"
      >
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-semibold text-ink">New PostEx shipment</h2>
          <p className="mt-0.5 text-xs text-muted">Books a COD order with PostEx and issues a tracking number.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {lockedOrder ? (
            <div className="mb-4 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
              Booking for order <span className="font-mono font-medium">{lockedOrder.number}</span>
            </div>
          ) : (
            <label className="mb-4 block">
              <span className="text-xs font-medium text-muted">Link to an existing order (optional)</span>
              <select
                value={orderId}
                onChange={(e) => applyOrder(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              >
                <option value="">— Manual entry —</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.number} — {o.customerName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label>
              <span className="text-xs font-medium text-muted">Order ref #</span>
              <input
                required
                value={orderRefNumber}
                onChange={(e) => setOrderRefNumber(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-muted">Order type</span>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as typeof orderType)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Reverse">Reverse</option>
                <option value="Replacement">Replacement</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-medium text-muted">Pickup address</span>
              <select
                value={pickupAddressCode}
                onChange={(e) => setPickupAddressCode(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              >
                <option value="">Merchant default</option>
                {pickupAddresses.map((a) => (
                  <option key={a.addressCode} value={a.addressCode}>
                    {a.address} — {a.addressCode}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-medium text-muted">Customer name</span>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-muted">Customer phone</span>
              <input
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="03xxxxxxxxx"
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-muted">City</span>
              {cities.length > 0 ? (
                <select
                  required
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
                >
                  {cities.map((c) => (
                    <option key={c.operationalCityName} value={c.operationalCityName}>
                      {c.operationalCityName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
                />
              )}
            </label>

            <label className="md:col-span-2">
              <span className="text-xs font-medium text-muted">Delivery address</span>
              <input
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-muted">COD amount (Rs)</span>
              <input
                required
                type="number"
                min={0}
                step="1"
                value={invoicePayment}
                onChange={(e) => setInvoicePayment(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-muted">Items</span>
              <input
                required
                type="number"
                min={1}
                value={items}
                onChange={(e) => setItems(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-muted">Invoice division</span>
              <input
                required
                type="number"
                min={1}
                value={invoiceDivision}
                onChange={(e) => setInvoiceDivision(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
            {!orderId ? (
              <label>
                <span className="text-xs font-medium text-muted">Weight (grams, optional)</span>
                <input
                  type="number"
                  min={0}
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  placeholder="e.g. 500"
                  className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
                />
              </label>
            ) : (
              <div>
                <span className="text-xs font-medium text-muted">Weight</span>
                <p className="mt-1.5 flex h-9 items-center text-sm text-muted">Calculated from the order&apos;s items</p>
              </div>
            )}
            <label className="md:col-span-3">
              <span className="text-xs font-medium text-muted">Order detail (optional)</span>
              <input
                value={orderDetail}
                onChange={(e) => setOrderDetail(e.target.value)}
                placeholder="1x Product Name, SKU-123"
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
            <label className="md:col-span-3">
              <span className="text-xs font-medium text-muted">Notes (optional)</span>
              <input
                value={transactionNotes}
                onChange={(e) => setTransactionNotes(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
          </div>

          {error ? <div className="mt-3 text-sm text-bad">{error}</div> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line p-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Cancel
          </button>
          <Button type="submit" disabled={pending}>
            {pending ? "Booking…" : "Book shipment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
