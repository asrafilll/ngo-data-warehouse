// Dashboard aggregates, computed server-side in one pass. Spans the whole domain:
// caseload, workflow health, money flow, verifier workload, and stuck-case alerts.
import type { WorkflowStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { calculateHadKifayah, toMonthlyIncome } from "../cases/had-kifayah";

const activeStatuses: WorkflowStatus[] = [
  "submitted",
  "approved_for_verification",
  "assigned",
  "surveyed",
  "disbursement_pending",
  "needs_revision",
];

const funnelSteps: Array<{ status: WorkflowStatus; label: string }> = [
  { status: "submitted", label: "Pengajuan" },
  { status: "approved_for_verification", label: "Triase" },
  { status: "assigned", label: "Penugasan" },
  { status: "surveyed", label: "Verifikasi" },
  { status: "approved", label: "Keputusan" },
  { status: "disbursement_pending", label: "Penyaluran" },
  { status: "completed", label: "Selesai" },
];
const stageOrder = funnelSteps.map((s) => s.status);

function countBy<T>(items: T[], key: (t: T) => string) {
  const map = new Map<string, number>();
  for (const it of items) map.set(key(it), (map.get(key(it)) ?? 0) + 1);
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function sumBy<T>(items: T[], key: (t: T) => string, val: (t: T) => number) {
  const map = new Map<string, number>();
  for (const it of items) map.set(key(it), (map.get(key(it)) ?? 0) + val(it));
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const dayMs = 86_400_000;
const daysSince = (from: Date, now: Date) =>
  Math.max(0, Math.round((now.getTime() - from.getTime()) / dayMs));

type DashboardSource = Awaited<ReturnType<typeof loadDashboardSource>>;
type CaseRow = DashboardSource["cases"][number];
type CaseFact = ReturnType<typeof buildCaseFact>;
type RutinProgressItem = ReturnType<typeof buildRutinProgress>[number];

export async function buildDashboard() {
  const now = new Date();
  const currentPeriod = toPeriod(now);
  const { cases, donors, rutinPrograms, verifiers } = await loadDashboardSource(currentPeriod);
  const facts = cases.map((row) => buildCaseFact(row, now));
  const volume = buildVolume(facts, now);
  const rutinRoster = buildRutinRoster(rutinPrograms);
  const rutinProgress = buildRutinProgress(rutinPrograms);

  return {
    period: {
      label: new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(now),
      count: volume.periodCount,
    },
    volume: {
      total: volume.total,
      needsAction: volume.needsAction,
      triage: volume.triage,
      approval: volume.approval,
      disbursement: volume.disbursement,
      completionRate: volume.completionRate,
      avgProcessDays: volume.avgProcessDays,
    },
    money: buildMoney(facts, donors, rutinRoster),
    trend: buildTrend(facts, now),
    geo: {
      provinces: countBy(facts, (c) => c.province),
      cities: countBy(facts, (c) => c.region),
    },
    programsQty: countBy(facts, (c) => c.program),
    programsValue: sumBy(
      facts,
      (c) => c.program,
      (c) => c.decisionNominal ?? c.recommendedAid,
    ),
    funnel: buildFunnel(facts),
    demographics: buildDemographics(facts),
    stuckCases: buildStuckCases(facts),
    verifierLoad: buildVerifierLoad(facts, verifiers),
    rutinProgress,
    funding: buildFunding(facts, donors, rutinProgress),
    override: buildOverride(facts),
    recentActivity: buildRecentActivity(facts),
  };
}

function toPeriod(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function loadDashboardSource(currentPeriod: string) {
  const [cases, donors, rutinPrograms, verifiers] = await Promise.all([
    prisma.aidCase.findMany({
      include: {
        mustahik: { include: { region: true } },
        program: { select: { name: true } },
        assignedVerifier: { select: { id: true, name: true, region: true } },
        verification: { select: { actualIncome: true, rentCost: true } },
        disbursement: { select: { nominal: true } },
        events: { orderBy: { at: "desc" }, take: 1 },
      },
    }),
    prisma.donor.findMany(),
    prisma.program.findMany({
      where: { type: "rutin", active: true },
      include: {
        rutinBeneficiaries: {
          where: { active: true, since: { lte: currentPeriod } },
          include: { disbursements: { where: { period: currentPeriod } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "verifikator", active: true },
      select: { id: true, name: true, region: true },
    }),
  ]);

  return { cases, donors, rutinPrograms, verifiers };
}

function buildCaseFact(row: CaseRow, now: Date) {
  const monthlyIncome = row.verification
    ? row.verification.actualIncome
    : toMonthlyIncome(row.mustahik.incomeAmount, row.mustahik.incomePeriod);
  const hk = calculateHadKifayah({
    region: row.mustahik.region,
    monthlyIncome,
    dependents: row.mustahik.dependents,
    rentCost: row.verification?.rentCost ?? row.mustahik.rentCost,
  });
  const lastEvent = row.events[0];

  return {
    id: row.id,
    caseNumber: row.caseNumber,
    status: row.status,
    program: row.program.name,
    name: row.mustahik.name,
    region: hk.region,
    province: hk.province,
    submittedAt: row.submittedAt,
    disbursedAt: row.disbursedAt,
    decisionNominal: row.decisionNominal,
    disbursedNominal: row.disbursement?.nominal ?? null,
    recommendedAid: hk.recommendedAid,
    eligibility: hk.eligibility,
    marital: row.mustahik.maritalStatus,
    housing: row.mustahik.housingStatus,
    gender: row.mustahik.gender,
    dependents: row.mustahik.dependents,
    verifierName: row.assignedVerifier?.name ?? null,
    verifierId: row.assignedVerifier?.id ?? null,
    lastEvent: lastEvent
      ? { label: lastEvent.label, actor: lastEvent.actor, at: lastEvent.at }
      : null,
    daysInStage: daysSince(lastEvent?.at ?? row.submittedAt, now),
  };
}

function buildVolume(facts: CaseFact[], now: Date) {
  const completed = facts.filter((c) => c.status === "completed");
  const triage = facts.filter((c) => c.status === "submitted");
  const approval = facts.filter((c) => c.status === "surveyed");
  const disbursementQ = facts.filter(
    (c) => c.status === "disbursement_pending" || c.status === "approved",
  );
  const periodCount = facts.filter((c) => {
    const d = c.submittedAt;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const processDays = completed
    .filter((c) => c.disbursedAt)
    .map((c) => daysSince(c.submittedAt, c.disbursedAt as Date));
  const avgProcessDays = processDays.length
    ? Math.round(processDays.reduce((a, b) => a + b, 0) / processDays.length)
    : null;

  return {
    periodCount,
    total: facts.length,
    needsAction: triage.length + approval.length + disbursementQ.length,
    triage: triage.length,
    approval: approval.length,
    disbursement: disbursementQ.length,
    completionRate: Math.round((completed.length / (facts.length || 1)) * 100),
    avgProcessDays,
  };
}

function buildRutinRoster(rutinPrograms: DashboardSource["rutinPrograms"]) {
  return rutinPrograms.flatMap((p) =>
    p.rutinBeneficiaries.map((b) => ({
      program: p.name,
      nominal: b.nominal,
      disbursed: b.disbursements.length > 0,
    })),
  );
}

function buildMoney(
  facts: CaseFact[],
  donors: DashboardSource["donors"],
  rutinRoster: ReturnType<typeof buildRutinRoster>,
) {
  return {
    approvedTotal: facts.reduce((t, c) => t + (c.decisionNominal ?? 0), 0),
    disbursedTotal:
      facts.reduce((t, c) => t + (c.disbursedNominal ?? 0), 0) +
      rutinRoster.filter((b) => b.disbursed).reduce((t, b) => t + b.nominal, 0),
    rutinMonthlyCommitment: rutinRoster.reduce((t, b) => t + b.nominal, 0),
    donorRecorded: donors.reduce((t, d) => t + d.totalDonation, 0),
    donorRecurring: donors.filter((d) => d.recurring).length,
    donorDormant: donors.filter((d) => d.status !== "Aktif").length,
  };
}

function buildTrend(facts: CaseFact[], now: Date) {
  const weekMs = 7 * dayMs;
  return Array.from({ length: 8 }, (_, i) => {
    const end = new Date(now.getTime() - (7 - i) * weekMs + weekMs);
    const start = new Date(end.getTime() - weekMs);
    return {
      label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(start),
      count: facts.filter((c) => c.submittedAt >= start && c.submittedAt < end).length,
    };
  });
}

function reachedStage(status: WorkflowStatus, stage: WorkflowStatus) {
  if (status === "rejected") return stage === "submitted";
  if (status === "needs_revision") return stage === "submitted";
  return stageOrder.indexOf(status) >= stageOrder.indexOf(stage);
}

function buildFunnel(facts: CaseFact[]) {
  return funnelSteps.map((step) => {
    const here = facts.filter((c) => c.status === step.status);
    return {
      status: step.status,
      label: step.label,
      count: facts.filter((c) => reachedStage(c.status, step.status)).length,
      hereNow: here.length,
      avgAge: here.length
        ? Math.round(here.reduce((t, c) => t + c.daysInStage, 0) / here.length)
        : 0,
    };
  });
}

function buildStuckCases(facts: CaseFact[]) {
  return facts
    .filter((c) => activeStatuses.includes(c.status))
    .sort((a, b) => b.daysInStage - a.daysInStage)
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      name: c.name,
      status: c.status,
      region: c.region,
      verifierName: c.verifierName,
      daysInStage: c.daysInStage,
    }));
}

function buildVerifierLoad(facts: CaseFact[], verifiers: DashboardSource["verifiers"]) {
  const openByVerifier = new Map<string, number>();
  for (const c of facts) {
    if (c.verifierId && activeStatuses.includes(c.status)) {
      openByVerifier.set(c.verifierId, (openByVerifier.get(c.verifierId) ?? 0) + 1);
    }
  }
  return verifiers
    .map((v) => ({
      name: v.name,
      region: v.region ?? "-",
      open: openByVerifier.get(v.id) ?? 0,
    }))
    .sort((a, b) => b.open - a.open);
}

function buildRutinProgress(rutinPrograms: DashboardSource["rutinPrograms"]) {
  return rutinPrograms.map((p) => {
    const roster = p.rutinBeneficiaries;
    const done = roster.filter((b) => b.disbursements.length > 0);
    return {
      programId: p.id,
      name: p.name,
      total: roster.length,
      disbursed: done.length,
      nominalTotal: roster.reduce((t, b) => t + b.nominal, 0),
      nominalDisbursed: done.reduce((t, b) => t + b.nominal, 0),
    };
  });
}

function buildFunding(
  facts: CaseFact[],
  donors: DashboardSource["donors"],
  rutinProgress: RutinProgressItem[],
) {
  const demand = sumBy(
    facts,
    (c) => c.program,
    (c) => c.decisionNominal ?? c.recommendedAid,
  );
  const supplyMap = new Map<string, number>();
  for (const d of donors) {
    supplyMap.set(d.programPreference, (supplyMap.get(d.programPreference) ?? 0) + d.totalDonation);
  }
  for (const p of rutinProgress) {
    const existing = demand.find((x) => x.label === p.name);
    if (existing) existing.value += p.nominalTotal;
    else demand.push({ label: p.name, value: p.nominalTotal });
  }
  return demand
    .sort((a, b) => b.value - a.value)
    .map((d) => ({ program: d.label, demand: d.value, supply: supplyMap.get(d.label) ?? 0 }));
}

function buildOverride(facts: CaseFact[]) {
  const decided = facts.filter((c) => c.decisionNominal && c.recommendedAid > 0);
  const overrideAvgPct = decided.length
    ? Math.round(
        (decided.reduce(
          (t, c) => t + ((c.decisionNominal as number) - c.recommendedAid) / c.recommendedAid,
          0,
        ) /
          decided.length) *
          100,
      )
    : null;

  return { decidedCount: decided.length, avgPct: overrideAvgPct };
}

function buildDemographics(facts: CaseFact[]) {
  return {
    marital: countBy(facts, (c) => c.marital),
    housing: countBy(facts, (c) => c.housing),
    gender: countBy(facts, (c) => c.gender),
    eligibility: ["Sangat Layak", "Layak", "Perlu Review", "Tidak Layak"]
      .map((label) => ({ label, count: facts.filter((c) => c.eligibility === label).length }))
      .filter((e) => e.count > 0),
    avgDependents: (facts.reduce((t, c) => t + c.dependents, 0) / (facts.length || 1)).toFixed(1),
  };
}

function buildRecentActivity(facts: CaseFact[]) {
  return facts
    .flatMap((c) =>
      c.lastEvent
        ? [{ ...c.lastEvent, caseNumber: c.caseNumber, id: c.id, applicant: c.name }]
        : [],
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);
}
