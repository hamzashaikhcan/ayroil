import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User.js";
import { Product } from "./Product.js";

@Entity({ name: "wishlist_items" })
@Index(["user", "product"], { unique: true })
export class WishlistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (u) => u.wishlist, { onDelete: "CASCADE" })
  user!: User;

  @ManyToOne(() => Product, { eager: true, onDelete: "CASCADE" })
  product!: Product;

  @CreateDateColumn()
  createdAt!: Date;
}
