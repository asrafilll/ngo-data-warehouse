import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireUser } from "../auth/middleware";
import { programCreateSchema, programsQuerySchema, programUpdateSchema } from "./schema";
import { createProgram, deleteProgram, listPrograms, updateProgram } from "./services";

const writerRoles = ["admin", "pengurus"];

export const programsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("query", programsQuerySchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const { type, active } = c.req.valid("query");
    const programs = await listPrograms({
      type,
      active: active === undefined ? undefined : active === "true",
    });
    return c.json({ programs }, 200);
  })
  .post("/", zValidator("json", programCreateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const program = await createProgram(c.req.valid("json"));
    return c.json({ program }, 201);
  })
  .patch("/:id", zValidator("json", programUpdateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const program = await updateProgram(c.req.param("id"), c.req.valid("json"));
    return c.json({ program }, 200);
  })
  .delete("/:id", async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const result = await deleteProgram(c.req.param("id"));
    return c.json(result, 200);
  });
