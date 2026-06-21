import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Cart } from "./Cart.js";
import { Product } from "./Product.js";

@Entity({ name: "cart_items" })
export class CartItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Cart, (c) => c.items, { onDelete: "CASCADE" })
  cart!: Cart;

  @ManyToOne(() => Product, { eager: true, onDelete: "CASCADE" })
  product!: Product;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
