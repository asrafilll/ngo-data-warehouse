import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  ApprovalSipError,
  hasValidUserSyncApiKey,
  syncApprovalSipUsers,
} from "../auth/approval-sip";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireSuperAdmin, requireUser } from "../auth/middleware";
import { amilCreateSchema, amilUpdateSchema, usersQuerySchema } from "./schema";
import { createAmil, listAmil, updateAmil } from "./services";

export const usersRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/sync", async (c) => {
    const authorized =
      requireSuperAdmin(c) || hasValidUserSyncApiKey(c.req.header("x-user-sync-key"));
    if (!authorized) return c.json({ error: "forbidden" }, 403);

    c.header("Cache-Control", "no-store");
    try {
      const result = await syncApprovalSipUsers();
      return c.json({ success: true, ...result }, 200);
    } catch (error) {
      if (!(error instanceof ApprovalSipError)) {
        return c.json(
          { error: "sync_failed", message: "Sinkronisasi pengguna gagal dijalankan." },
          500,
        );
      }

      if (error.code === "not_configured") {
        return c.json({ error: error.code, message: error.message }, 503);
      }
      return c.json({ error: error.code, message: error.message }, 502);
    }
  })
  // Amil roster — readable by any signed-in amil (verifier pickers need it).
  .get("/", zValidator("query", usersQuerySchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const { role, active } = c.req.valid("query");
    const users = await listAmil({
      role,
      active: active === undefined ? undefined : active === "true",
    });
    return c.json({ users }, 200);
  })
  .post("/", zValidator("json", amilCreateSchema), async (c) => {
    if (!requireRole(c, ["admin"])) return c.json({ error: "forbidden" }, 403);
    const user = await createAmil(c.req.valid("json"));
    return c.json({ user }, 201);
  })
  .patch("/:id", zValidator("json", amilUpdateSchema), async (c) => {
    if (!requireRole(c, ["admin"])) return c.json({ error: "forbidden" }, 403);
    const user = await updateAmil(c.req.param("id"), c.req.valid("json"));
    return c.json({ user }, 200);
  });
