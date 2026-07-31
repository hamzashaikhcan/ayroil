import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "./Order.js";

/**
 * Local mirror of a PostEx booking. PostEx is the source of truth for
 * delivery status, but we keep our own row so the PostEx tab has something
 * to list without round-tripping every field to their API, and so an
 * internal Order can be linked to the shipment that fulfills it.
 */
@Entity({ name: "postex_shipments" })
export class PostexShipment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Order, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn()
  order!: Order | null;

  // PostEx-issued tracking number, e.g. "CX-XXXXXXXXXXX".
  @Index({ unique: true })
  @Column({ type: "varchar", length: 32 })
  trackingNumber!: string;

  @Column({ type: "varchar", length: 64 })
  orderRefNumber!: string;

  @Column({ type: "varchar", length: 16, default: "Normal" })
  orderType!: string;

  @Column({ type: "varchar", length: 120 })
  customerName!: string;

  @Column({ type: "varchar", length: 32 })
  customerPhone!: string;

  @Column({ type: "text" })
  deliveryAddress!: string;

  @Column({ type: "varchar", length: 80 })
  cityName!: string;

  // Cash-on-delivery invoice amount in whole currency units (PKR), as PostEx
  // itself works in decimal rupees rather than cents.
  @Column({ type: "numeric", precision: 12, scale: 2 })
  invoicePayment!: string;

  @Column({ type: "int", default: 1 })
  items!: number;

  // Total shipment weight — order-linked shipments derive this from each
  // product's weightGrams (see lib/postexOrders.ts::orderWeightGrams);
  // manual/unlinked shipments take an admin-entered value. PostEx's
  // create-order API has no weight parameter, so this is also folded into
  // orderDetail as free text for the courier's benefit.
  @Column({ type: "int", nullable: true })
  weightGrams!: number | null;

  @Column({ type: "text", nullable: true })
  orderDetail!: string | null;

  @Column({ type: "text", nullable: true })
  transactionNotes!: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  pickupAddressCode!: string | null;

  // Locally-cached last-known PostEx status (e.g. "Unbooked", "Booked",
  // "Delivered", "Cancelled") — refreshed on demand via the Track action.
  @Column({ type: "varchar", length: 32, default: "Unbooked" })
  status!: string;

  @Column({ type: "timestamp", nullable: true })
  lastTrackedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
