import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 160 })
  slug!: string;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "varchar", length: 240, nullable: true })
  tagline!: string | null;

  // SEO <title> for the storefront PDP; the storefront's title template
  // appends the brand name. Null falls back to the product name.
  @Column({ type: "varchar", length: 160, nullable: true })
  metaTitle!: string | null;

  @Column({ type: "text" })
  shortDescription!: string;

  @Column({ type: "text" })
  longDescription!: string;

  @Column({ type: "int" })
  priceCents!: number;

  @Column({ type: "int", nullable: true })
  compareAtCents!: number | null;

  @Column({ type: "int" })
  costCents!: number;

  @Column({ type: "int", default: 0 })
  stock!: number;

  @Column({ type: "varchar", length: 64, nullable: true })
  sku!: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  // Editorially flagged as a recommended pick — surfaced with a badge on the
  // storefront shop grid and product detail page.
  @Column({ type: "boolean", default: false })
  recommended!: boolean;

  // Admin-controlled display position (1 = first). Null means "automatic":
  // positioned products list first in ascending order, the rest follow newest-first.
  @Column({ type: "int", nullable: true })
  sortOrder!: number | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  images!: string[];

  @Column({ type: "jsonb", default: () => "'[]'" })
  highlights!: string[];

  @Column({ type: "jsonb", default: () => "'[]'" })
  ingredients!: { name: string; description: string }[];

  @Column({ type: "jsonb", default: () => "'[]'" })
  faqs!: { q: string; a: string }[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
