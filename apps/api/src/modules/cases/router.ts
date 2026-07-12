import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireUser } from "../auth/middleware";
import { getStageRoles, type WorkflowStage } from "../settings/approvals";
import {
  assignSchema,
  caseIntakeSchema,
  casesQuerySchema,
  caseUpdateSchema,
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
  reopenCase,
  submitVerification,
  triageCase,
  updateCase,
} from "./services";

function handleCaseError(error: unknown) {
  if (error instanceof CaseError) {
    const status =
      error.code === "not_found" ? 404 : error.code === "verifier_not_found" ? 404 : 409;
    return { body: { error: error.code, message: error.message }, status } as const;
  }
  throw error;
}

// Stage roles are configurable by super_admin (Pengaturan → Approval); defaults in
// settings/approvals.ts mirror the original hardcoded guards.
async function requireStage(c: Parameters<typeof requireRole>[0], stage: WorkflowStage) {
  const roles = await getStageRoles();
  return requireRole(c, roles[stage]);
}

function actorRoles(user: { role?: string | null }) {
  return user.role?.split(",") ?? [];
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
  // Form 1 intake (PRD §2 tahap 1).
  .post("/", zValidator("json", caseIntakeSchema), async (c) => {
    const user = await requireStage(c, "intake");
    if (!user) return c.json({ error: "forbidden" }, 403);
    const detail = await intakeCase(c.req.valid("json"), user);
    return c.json({ case: detail }, 201);
  })
  // Perbaikan data pengajuan — closes the needs_revision loop; a revised case goes
  // back to `submitted` for re-triage.
  .patch("/:id", zValidator("json", caseUpdateSchema), async (c) => {
    const user = await requireStage(c, "intake");
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await updateCase(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Triase (tahap 2).
  .post("/:id/triage", zValidator("json", triageSchema), async (c) => {
    const user = await requireStage(c, "triage");
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await triageCase(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Penugasan verifikator wilayah.
  .post("/:id/assign", zValidator("json", assignSchema), async (c) => {
    const user = await requireStage(c, "assign");
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await assignVerifier(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Form 2 verifikasi lapangan (tahap 3, HK calc tahap 4).
  .post("/:id/verification", zValidator("json", verificationSchema), async (c) => {
    const user = await requireStage(c, "verification");
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await submitVerification(c.req.param("id"), c.req.valid("json"), {
        id: user.id,
        name: user.name,
        roles: actorRoles(user),
      });
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Keputusan nominal (tahap 5).
  .post("/:id/decision", zValidator("json", decisionSchema), async (c) => {
    const user = await requireStage(c, "decision");
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await decideCase(c.req.param("id"), c.req.valid("json"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Penyaluran + tutup kasus, bukti foto wajib (tahap 6).
  .post("/:id/disburse", zValidator("json", disburseSchema), async (c) => {
    const user = await requireStage(c, "disburse");
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await disburseCase(c.req.param("id"), c.req.valid("json"), {
        id: user.id,
        name: user.name,
        roles: actorRoles(user),
      });
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  })
  // Buka kembali kasus yang ditolak (koreksi keputusan).
  .post("/:id/reopen", async (c) => {
    const user = await requireStage(c, "reopen");
    if (!user) return c.json({ error: "forbidden" }, 403);
    try {
      const detail = await reopenCase(c.req.param("id"), user);
      return c.json({ case: detail }, 200);
    } catch (error) {
      const { body, status } = handleCaseError(error);
      return c.json(body, status);
    }
  });
