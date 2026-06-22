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
import { User } from "./User.js";
import { CartItem } from "./CartItem.js";

@Entity({ name: "carts" })
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  user!: User | null;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 80, nullable: true })
  guestKey!: string | null;

  @OneToMany(() => CartItem, (ci) => ci.cart, { cascade: true, eager: true })
  items!: CartItem[];

  @Column({ type: "int", default: 0 })
  offerDiscountPercent!: number;

  @Column({ type: "timestamp", nullable: true })
  offerExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
