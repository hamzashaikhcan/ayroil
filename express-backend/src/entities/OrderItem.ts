import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Order } from "./Order.js";
import { Product } from "./Product.js";

@Entity({ name: "order_items" })
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: "CASCADE" })
  order!: Order;

  @ManyToOne(() => Product, { onDelete: "SET NULL", nullable: true })
  product!: Product | null;

  @Column({ type: "varchar", length: 200 })
  productName!: string;

  @Column({ type: "int" })
  unitPriceCents!: number;

  @Column({ type: "int" })
  unitCostCents!: number;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
