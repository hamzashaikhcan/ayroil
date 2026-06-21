import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ROLES } from "@consts";
import { AppDataSource } from "../data-source.js";
import { User } from "../entities/User.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter: Router = Router();

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120).optional(),
  marketingOptIn: z.boolean().optional(),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
  }
  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await repo.save(
    repo.create({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name ?? null,
      passwordHash,
      role: ROLES.USER,
      marketingOptIn: parsed.data.marketingOptIn ?? false,
    }),
  );

  return res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

const verifySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Called by Auth.js Credentials provider.
 * Returns the user record (without passwordHash) on a valid match.
 */
authRouter.post("/verify-credentials", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user?.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: req.auth!.sub } });
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    marketingOptIn: user.marketingOptIn,
    createdAt: user.createdAt,
  });
});

const updateMeSchema = z.object({
  email: z.string().email().max(254).optional(),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(5).max(32).optional().nullable(),
  marketingOptIn: z.boolean().optional(),
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const repo = AppDataSource.getRepository(User);

  // If email is being changed, normalize it and make sure no other user
  // owns it. We compare against the current user too so a no-op save
  // (same email re-submitted) doesn't 409.
  const patch = { ...parsed.data };
  if (typeof patch.email === "string") {
    patch.email = patch.email.toLowerCase();
    const me = await repo.findOne({ where: { id: req.auth!.sub } });
    if (me && patch.email !== me.email) {
      const conflict = await repo.findOne({ where: { email: patch.email } });
      if (conflict) return res.status(409).json({ error: "Email already in use" });
    }
  }

  await repo.update({ id: req.auth!.sub }, patch);
  const user = await repo.findOne({ where: { id: req.auth!.sub } });
  return res.json(user);
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: req.auth!.sub } });
  if (!user?.passwordHash) return res.status(400).json({ error: "Password not set" });
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Wrong current password" });
  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await repo.save(user);
  return res.json({ ok: true });
});
