import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { prisma } from "../../utils/prisma";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireUser } from "../auth/middleware";
import {
  beneficiaryCreateSchema,
  beneficiaryUpdateSchema,
  disburseAllSchema,
  disburseToggleSchema,
  rosterQuerySchema,
} from "./schema";
import { addBeneficiary, disburseAll, getRoster, setDisbursed } from "./services";

const writerRoles = ["admin", "pengurus", "verifikator"];

export const rutinRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/roster", zValidator("query", rosterQuerySchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const { programId, period } = c.req.valid("query");
    const roster = await getRoster(programId, period);
    return c.json({ roster }, 200);
  })
  .post("/roster", zValidator("json", beneficiaryCreateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const beneficiary = await addBeneficiary(c.req.valid("json"));
    return c.json({ beneficiary }, 201);
  })
  .patch("/roster/:id", zValidator("json", beneficiaryUpdateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const beneficiary = await prisma.rutinBeneficiary.update({
      where: { id: c.req.param("id") },
      data: c.req.valid("json"),
    });
    return c.json({ beneficiary }, 200);
  })
  .post("/disburse", zValidator("json", disburseToggleSchema), async (c) => {
    const user = requireRole(c, writerRoles);
    if (!user) return c.json({ error: "forbidden" }, 403);
    const { beneficiaryId, period, disbursed } = c.req.valid("json");
    await setDisbursed(beneficiaryId, period, disbursed, user.name);
    return c.json({ ok: true }, 200);
  })
  .post("/disburse-all", zValidator("json", disburseAllSchema), async (c) => {
    const user = requireRole(c, writerRoles);
    if (!user) return c.json({ error: "forbidden" }, 403);
    const { programId, period } = c.req.valid("json");
    const count = await disburseAll(programId, period, user.name);
    return c.json({ ok: true, count }, 200);
  });
