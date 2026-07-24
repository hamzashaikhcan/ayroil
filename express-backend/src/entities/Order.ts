import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  type OrderStatus,
  type PaymentStatus,
} from "@consts";
import { User } from "./User.js";
import { OrderItem } from "./OrderItem.js";

@Entity({ name: "orders" })
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 24 })
  number!: string;

  @ManyToOne(() => User, (u) => u.orders, { nullable: true, onDelete: "SET NULL" })
  user!: User | null;

  @Column({ type: "varchar", length: 254 })
  email!: string;

  @Column({ type: "varchar", length: 120 })
  customerName!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: "jsonb" })
  shippingAddress!: {
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone?: string | null;
  };

  @Column({ type: "varchar", length: 24, default: ORDER_STATUS.PENDING })
  status!: OrderStatus;

  @Column({ type: "varchar", length: 24, default: PAYMENT_STATUS.UNPAID })
  paymentStatus!: PaymentStatus;

  @Column({ type: "int", default: 0 })
  subtotalCents!: number;

  @Column({ type: "int", default: 0 })
  shippingCents!: number;

  @Column({ type: "int", default: 0 })
  taxCents!: number;

  @Column({ type: "int", default: 0 })
  totalCents!: number;

  @Column({ type: "int", default: 0 })
  costCents!: number;

  // Actual courier cost for this order, admin-entered once known (differs
  // order-to-order and from `shippingCents`, the flat amount charged to the
  // customer at checkout). Feeds profitCents below; falls back to
  // shippingCents as an estimate until the admin fills this in.
  @Column({ type: "int", nullable: true })
  actualShippingCostCents!: number | null;

  @Column({ type: "int", default: 0 })
  profitCents!: number;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true, eager: true })
  items!: OrderItem[];

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  // Shipping — courier tracking number, admin-entered. The "shipped" email
  // is only sendable once this is set (see POST /orders/:id/notify-shipped).
  @Column({ type: "varchar", length: 64, nullable: true })
  trackingNumber!: string | null;

  // Review flow — set when an order transitions to DELIVERED. The token is
  // a one-time bearer credential for the public, unauthenticated review
  // page; reviewTokenUsedAt being non-null is what makes the link single-use.
  @Column({ type: "varchar", length: 64, nullable: true })
  reviewToken!: string | null;

  @Column({ type: "timestamp", nullable: true })
  reviewTokenUsedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
