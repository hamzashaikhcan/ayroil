import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Order } from "./Order.js";
import { Product } from "./Product.js";

/**
 * One review per order, submitted via the single-use tokenized review link
 * sent when an order is marked DELIVERED (see Order.reviewToken). `product`
 * is the first line item's product at submission time — kept nullable/SET
 * NULL since the product can be deleted later, for future display use.
 */
@Entity({ name: "reviews" })
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @OneToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn()
  order!: Order;

  @ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL" })
  product!: Product | null;

  @Column({ type: "int" })
  rating!: number;

  @Column({ type: "text", default: "" })
  comment!: string;

  @Column({ type: "varchar", length: 120 })
  customerName!: string;

  @Column({ type: "boolean", default: false })
  visible!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
