import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { prisma } from "../../utils/prisma";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireUser } from "../auth/middleware";
import { regionCreateSchema, regionUpdateSchema } from "./schema";

const writerRoles = ["admin", "pengurus"];

export const regionsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const regions = await prisma.regionalIndex.findMany({
      orderBy: [{ province: "asc" }, { city: "asc" }],
    });
    return c.json({ regions }, 200);
  })
  .post("/", zValidator("json", regionCreateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const region = await prisma.regionalIndex.create({ data: c.req.valid("json") });
    return c.json({ region }, 201);
  })
  .patch("/:id", zValidator("json", regionUpdateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const region = await prisma.regionalIndex.update({
      where: { id: c.req.param("id") },
      data: c.req.valid("json"),
    });
    return c.json({ region }, 200);
  })
  .delete("/:id", async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const linked = await prisma.mustahik.count({ where: { regionId: c.req.param("id") } });
    if (linked > 0) {
      return c.json({ error: "region_in_use", linked }, 409);
    }
    await prisma.regionalIndex.delete({ where: { id: c.req.param("id") } });
    return c.json({ deleted: true }, 200);
  });
