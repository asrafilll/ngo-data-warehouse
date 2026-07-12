import { z } from "zod";
import { prisma } from "../../utils/prisma";

// Per-stage approval roles (Pengaturan → Approval). Stored under
// OrgSettings.preferences.workflowApprovals; only super_admin may change them.
export const workflowStages = [
  "intake",
  "triage",
  "assign",
  "verification",
  "decision",
  "disburse",
  "reopen",
] as const;

export type WorkflowStage = (typeof workflowStages)[number];

export const defaultStageRoles: Record<WorkflowStage, string[]> = {
  intake: ["admin", "verifikator", "pengurus"],
  triage: ["pengurus", "admin"],
  assign: ["pengurus", "admin"],
  verification: ["verifikator", "admin"],
  decision: ["pengurus"],
  disburse: ["verifikator", "admin", "pengurus"],
  reopen: ["pengurus", "admin"],
};

const rolesArraySchema = z
  .array(z.enum(["super_admin", "admin", "pengurus", "verifikator"]))
  .min(1);

export const stageRolesSchema = z.object({
  intake: rolesArraySchema,
  triage: rolesArraySchema,
  assign: rolesArraySchema,
  verification: rolesArraySchema,
  decision: rolesArraySchema,
  disburse: rolesArraySchema,
  reopen: rolesArraySchema,
});

export async function getStageRoles(): Promise<Record<WorkflowStage, string[]>> {
  const settings = await prisma.orgSettings.findUnique({ where: { id: 1 } });
  const preferences = (settings?.preferences ?? {}) as Record<string, unknown>;
  const parsed = stageRolesSchema.partial().safeParse(preferences.workflowApprovals ?? {});
  const overrides = parsed.success ? parsed.data : {};
  return { ...defaultStageRoles, ...overrides };
}

export async function saveStageRoles(roles: Record<WorkflowStage, string[]>) {
  const settings = await prisma.orgSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  const preferences = (settings.preferences ?? {}) as Record<string, unknown>;
  return prisma.orgSettings.update({
    where: { id: 1 },
    data: { preferences: { ...preferences, workflowApprovals: roles } },
  });
}
