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
 * Customer reviews come from the single-use tokenized review link sent when
 * an order is marked DELIVERED (see Order.reviewToken) — at most one per
 * order. Admins can also create reviews directly from the admin panel; those
 * have no order (`order` is null). `product` is kept nullable/SET NULL since
 * the product can be deleted later, for future display use.
 */
@Entity({ name: "reviews" })
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @OneToOne(() => Order, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn()
  order!: Order | null;

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
