// Reporting facts — one slim row per case with the computed Had Kifayah numbers.
// Dashboard and Laporan aggregate these client-side (grouping by program/wilayah/
// status/demographics), so the API stays a single stable endpoint.
import { Hono } from "hono";
import { prisma } from "../../utils/prisma";
import type { AuthVariables } from "../auth/middleware";
import { requireUser } from "../auth/middleware";
import { calculateHadKifayah, toMonthlyIncome } from "../cases/had-kifayah";
import { buildDashboard } from "./dashboard";

export const reportsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/dashboard", async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const dashboard = await buildDashboard();
    return c.json({ dashboard }, 200);
  })
  .get("/case-facts", async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);

    const cases = await prisma.aidCase.findMany({
      include: {
        mustahik: { include: { region: true } },
        program: { select: { name: true } },
        assignedVerifier: { select: { name: true } },
        verification: { select: { actualIncome: true, rentCost: true } },
        events: { orderBy: { at: "desc" }, take: 1 },
      },
      orderBy: { submittedAt: "desc" },
    });

    const facts = cases.map((row) => {
      const monthlyIncome = row.verification
        ? row.verification.actualIncome
        : toMonthlyIncome(row.mustahik.incomeAmount, row.mustahik.incomePeriod);
      const hadKifayah = calculateHadKifayah({
        region: row.mustahik.region,
        monthlyIncome,
        dependents: row.mustahik.dependents,
        rentCost: row.verification?.rentCost ?? row.mustahik.rentCost,
      });
      const lastEvent = row.events[0];

      return {
        id: row.id,
        caseNumber: row.caseNumber,
        aidType: row.aidType,
        status: row.status,
        program: row.program.name,
        submittedAt: row.submittedAt,
        disbursedAt: row.disbursedAt,
        decisionNominal: row.decisionNominal,
        applicant: {
          name: row.mustahik.name,
          gender: row.mustahik.gender,
          maritalStatus: row.mustahik.maritalStatus,
          housingStatus: row.mustahik.housingStatus,
          dependents: row.mustahik.dependents,
        },
        assignedVerifierName: row.assignedVerifier?.name ?? null,
        region: hadKifayah.region,
        province: hadKifayah.province,
        recommendedAid: hadKifayah.recommendedAid,
        eligibility: hadKifayah.eligibility,
        lastEvent: lastEvent
          ? {
              label: lastEvent.label,
              actor: lastEvent.actor,
              note: lastEvent.note,
              at: lastEvent.at,
            }
          : null,
      };
    });

    return c.json({ facts }, 200);
  });
