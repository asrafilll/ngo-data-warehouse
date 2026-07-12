import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireSuperAdmin, requireUser } from "../auth/middleware";
import { getStageRoles, saveStageRoles, stageRolesSchema } from "./approvals";

const settingsUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  legalName: z.string().trim().max(200).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(150).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

async function getOrgSettings() {
  return prisma.orgSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export const settingsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const settings = await getOrgSettings();
    return c.json({ settings }, 200);
  })
  .patch("/", zValidator("json", settingsUpdateSchema), async (c) => {
    if (!requireRole(c, ["admin"])) return c.json({ error: "forbidden" }, 403);
    await getOrgSettings();
    const { preferences, ...rest } = c.req.valid("json");
    const settings = await prisma.orgSettings.update({
      where: { id: 1 },
      data: { ...rest, ...(preferences ? { preferences: preferences as object } : {}) },
    });
    return c.json({ settings }, 200);
  })
  // Per-stage approval roles. Readable by any user (UI gates actions with it);
  // writable only by super_admin.
  .get("/approvals", async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const approvals = await getStageRoles();
    return c.json({ approvals }, 200);
  })
  .put("/approvals", zValidator("json", stageRolesSchema), async (c) => {
    if (!requireSuperAdmin(c)) return c.json({ error: "forbidden" }, 403);
    await saveStageRoles(c.req.valid("json"));
    const approvals = await getStageRoles();
    return c.json({ approvals }, 200);
  });
