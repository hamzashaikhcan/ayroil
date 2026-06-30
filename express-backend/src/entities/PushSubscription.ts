import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * A Web Push subscription for an admin device (one row per browser/PWA that
 * opted in). Keyed by the push service `endpoint`, which is unique per device.
 * `userId` records which admin enabled it; dead subscriptions are pruned
 * automatically when the push service returns 404/410 (see lib/push.ts).
 */
@Entity({ name: "push_subscriptions" })
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 512 })
  endpoint!: string;

  @Column({ type: "varchar", length: 255 })
  p256dh!: string;

  @Column({ type: "varchar", length: 255 })
  auth!: string;

  // The admin user who subscribed this device (nullable for safety).
  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "varchar", length: 300, default: "" })
  userAgent!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
