import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User.js";

@Entity({ name: "addresses" })
export class Address {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (u) => u.addresses, { onDelete: "CASCADE" })
  user!: User;

  @Column({ type: "varchar", length: 60, default: "Home" })
  label!: string;

  @Column({ type: "varchar", length: 120 })
  fullName!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 200 })
  line1!: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  line2!: string | null;

  @Column({ type: "varchar", length: 80 })
  city!: string;

  @Column({ type: "varchar", length: 80 })
  region!: string;

  @Column({ type: "varchar", length: 20 })
  postalCode!: string;

  @Column({ type: "varchar", length: 2, default: "US" })
  country!: string;

  @Column({ type: "boolean", default: false })
  isDefault!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
