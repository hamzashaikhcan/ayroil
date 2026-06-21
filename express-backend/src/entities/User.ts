import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ROLES, type Role } from "@consts";
import { Order } from "./Order.js";
import { Address } from "./Address.js";
import { WishlistItem } from "./WishlistItem.js";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 254 })
  email!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  name!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  passwordHash!: string | null;

  @Column({ type: "varchar", length: 16, default: ROLES.USER })
  role!: Role;

  @Column({ type: "boolean", default: false })
  emailVerified!: boolean;

  @Column({ type: "boolean", default: false })
  marketingOptIn!: boolean;

  @OneToMany(() => Order, (o) => o.user)
  orders!: Order[];

  @OneToMany(() => Address, (a) => a.user)
  addresses!: Address[];

  @OneToMany(() => WishlistItem, (w) => w.user)
  wishlist!: WishlistItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
