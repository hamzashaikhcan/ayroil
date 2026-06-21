import { Router } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source.js";
import { Address } from "../entities/Address.js";
import { requireAuth } from "../middleware/auth.js";

export const addressesRouter: Router = Router();

addressesRouter.use(requireAuth);

addressesRouter.get("/", async (req, res) => {
  const items = await AppDataSource.getRepository(Address).find({
    where: { user: { id: req.auth!.sub } },
    order: { isDefault: "DESC", createdAt: "DESC" },
  });
  res.json(items);
});

const addressSchema = z.object({
  label: z.string().min(1).max(60).default("Home"),
  fullName: z.string().min(1).max(120),
  phone: z.string().max(32).optional().nullable(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(80),
  region: z.string().min(1).max(80),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(80).default("US"),
  isDefault: z.boolean().default(false),
});

addressesRouter.post("/", async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  const repo = AppDataSource.getRepository(Address);
  if (parsed.data.isDefault) {
    await repo.update({ user: { id: req.auth!.sub } as never }, { isDefault: false });
  }
  const created = await repo.save(
    repo.create({ ...parsed.data, user: { id: req.auth!.sub } as never }),
  );
  res.status(201).json(created);
});

addressesRouter.put("/:id", async (req, res) => {
  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  const id = String(req.params.id);
  const repo = AppDataSource.getRepository(Address);
  if (parsed.data.isDefault) {
    await repo.update({ user: { id: req.auth!.sub } as never }, { isDefault: false });
  }
  await repo.update(
    { id, user: { id: req.auth!.sub } as never },
    parsed.data,
  );
  const fresh = await repo.findOne({ where: { id } });
  res.json(fresh);
});

addressesRouter.delete("/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(Address);
  await repo.delete({
    id: String(req.params.id),
    user: { id: req.auth!.sub } as never,
  });
  res.json({ ok: true });
});
