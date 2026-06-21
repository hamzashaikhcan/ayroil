import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ROLES } from "@consts";
import { AppDataSource } from "../data-source.js";
import { User } from "../entities/User.js";
import { requireAdmin } from "../middleware/auth.js";

export const usersRouter: Router = Router();

usersRouter.use(requireAdmin);

usersRouter.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const qb = AppDataSource.getRepository(User)
    .createQueryBuilder("u")
    .orderBy("u.createdAt", "DESC")
    .take(500);
  if (q) qb.andWhere("(u.email ILIKE :q OR u.name ILIKE :q)", { q: `%${q}%` });
  const items = await qb.getMany();
  res.json(items.map(({ passwordHash: _ph, ...rest }) => { void _ph; return rest; }));
});

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  role: z.enum([ROLES.USER, ROLES.ADMIN]).default(ROLES.USER),
  password: z.string().min(8).max(200).optional(),
});

usersRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const repo = AppDataSource.getRepository(User);
  const exists = await repo.findOne({ where: { email: parsed.data.email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: "Email exists" });
  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 10)
    : null;
  const created = await repo.save(
    repo.create({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name ?? null,
      phone: parsed.data.phone ?? null,
      role: parsed.data.role,
      passwordHash,
    }),
  );
  const { passwordHash: _ph, ...rest } = created;
  void _ph;
  res.status(201).json(rest);
});

const updateSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  role: z.enum([ROLES.USER, ROLES.ADMIN]).optional(),
  emailVerified: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

usersRouter.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const id = String(req.params.id);
  const repo = AppDataSource.getRepository(User);
  const patch: Partial<User> = { ...parsed.data };
  if (parsed.data.password) {
    patch.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    delete (patch as { password?: string }).password;
  }
  await repo.update({ id }, patch);
  const fresh = await repo.findOne({ where: { id } });
  if (!fresh) return res.status(404).json({ error: "Not found" });
  const { passwordHash: _ph, ...rest } = fresh;
  void _ph;
  res.json(rest);
});

usersRouter.delete("/:id", async (req, res) => {
  const id = String(req.params.id);
  if (id === req.auth!.sub) {
    return res.status(400).json({ error: "Cannot delete yourself" });
  }
  const r = await AppDataSource.getRepository(User).delete({ id });
  if (!r.affected) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});
