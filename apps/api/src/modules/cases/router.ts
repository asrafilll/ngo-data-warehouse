import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireUser } from "../auth/middleware";
import {
  assignSchema,
  caseIntakeSchema,
  casesQuerySchema,
  decisionSchema,
  disburseSchema,
  triageSchema,
  verificationSchema,
} from "./schema";
import {
  assignVerifier,
  CaseError,
  decideCase,
  disburseCase,
  getCaseDetail,
  intakeCase,
  listCases,
  submitVerification,
  triageCase,
} from "./services";

function handleCaseError(error: unknown) {
  if (error instanceof CaseError) {
    const status =
      error.code === "not_found" ? 404 : error.code === "verifier_not_found" ? 404 : 409;
    return { body: { error: error.code, message: error.message }, status } as const;
  }
  throw error;
}

export const casesRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("query", casesQuerySchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const result = await listCases(c.req.valid("query"));
    return c.json(result, 200);
  })
  .get("/:id", async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    try {
      const detail = await getCaseDetail(c.req.param("id"));
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Form 1 intake — Admin atau Verifikator (PRD §2 tahap 1).
  .post("/", zValidator("json", caseIntakeSchema), async (c) => {
    const user = requireRole(c, ["admin", "verifikator", "pengurus"]);
    if (!user) return c.json({ error: "forbidden" }, 403);
    const detail = await intakeCase(c.req.valid("json"), user);
    return c.json({ case: detail }, 201);
  })
  // Triase — Pengurus (tahap 2).
  .post("/:id/triage", zValidator("json", triageSchema), async (c) => {
    const user = requireRole(c, ["pengurus", "admin"]);
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await triageCase(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Penugasan verifikator wilayah — Pengurus/Admin.
  .post("/:id/assign", zValidator("json", assignSchema), async (c) => {
    const user = requireRole(c, ["pengurus", "admin"]);
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await assignVerifier(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Form 2 verifikasi lapangan — Verifikator (tahap 3, HK calc tahap 4).
  .post("/:id/verification", zValidator("json", verificationSchema), async (c) => {
    const user = requireRole(c, ["verifikator", "admin"]);
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await submitVerification(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Keputusan nominal — Pengurus, manual override penuh (tahap 5).
  .post("/:id/decision", zValidator("json", decisionSchema), async (c) => {
    const user = requireRole(c, ["pengurus"]);
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await decideCase(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Penyaluran + tutup kasus — Verifikator, bukti foto wajib (tahap 6).
  .post("/:id/disburse", zValidator("json", disburseSchema), async (c) => {
    const user = requireRole(c, ["verifikator", "admin", "pengurus"]);
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await disburseCase(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  });
