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

  @Column({ type: "int", default: 0 })
  profitCents!: number;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true, eager: true })
  items!: OrderItem[];

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
