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

  // Best-effort location from the IP at cart creation (see lib/geo.ts).
  // Never re-resolved after creation; null in local dev (no real client IP)
  // or when the IP isn't in the geo dataset. Admin-facing only — shown on
  // the "Active carts" page, not used for any business logic.
  @Column({ type: "varchar", length: 120, nullable: true })
  city!: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  region!: string | null;

  @Column({ type: "varchar", length: 2, nullable: true })
  country!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
