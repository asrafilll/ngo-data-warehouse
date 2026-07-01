// Superadmin dashboard aggregates derived from @repo/sip-domain (mock domain data).
// Grounded in what the intake data (Form 1 + workflow) actually yields at launch:
// volume, geography, program mix, demographics, workflow health. No donor/expense
// metrics — those modules don't exist yet.
import {
  aidCases,
  donors,
  regionalIndexes,
  sipUsers,
  statusLabels,
  workflowSteps,
  type AidCase,
  type Eligibility,
  type WorkflowStatus,
} from "@repo/sip-domain";

const isActive = (c: AidCase) => c.status !== "completed" && c.status !== "rejected";

// Reference "now" for aging/period math. Uses real clock; falls back sensibly on mock data.
const NOW = new Date("2026-07-01T00:00:00+07:00");
const daysBetween = (from: string, to: Date = NOW) =>
  Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / 86_400_000));

// Generic count-by helper → sorted [{ label, count }].
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

// ── Volume KPIs ──────────────────────────────────────────────────────────────
export const totalPengajuan = aidCases.length;
export const activeCases = aidCases.filter(isActive);
export const completedCases = aidCases.filter((c) => c.status === "completed");
export const approvalQueue = aidCases.filter((c) => c.status === "surveyed");
export const triageQueue = aidCases.filter((c) => c.status === "submitted");
export const disbursementQueue = aidCases.filter((c) => c.status === "disbursement_pending");
export const needsAction = triageQueue.length + approvalQueue.length + disbursementQueue.length;
export const completionRate = Math.round((completedCases.length / (totalPengajuan || 1)) * 100);

// Latest month present in the data (mock spans one month) → honest "this period" count.
const latestMonth = aidCases
  .map((c) => new Date(c.submittedAt))
  .sort((a, b) => b.getTime() - a.getTime())[0];
export const periodLabel = latestMonth
  ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(latestMonth)
  : "—";
export const periodCount = aidCases.filter((c) => {
  const d = new Date(c.submittedAt);
  return d.getMonth() === latestMonth.getMonth() && d.getFullYear() === latestMonth.getFullYear();
}).length;

// Avg processing time for closed cases (submitted → disbursed), in days.
export const avgProcessDays = (() => {
  const closed = aidCases.flatMap((c) =>
    c.disbursedAt ? [{ submittedAt: c.submittedAt, disbursedAt: c.disbursedAt }] : [],
  );
  if (closed.length === 0) return null;
  return Math.round(
    closed.reduce((t, c) => t + daysBetween(c.submittedAt, new Date(c.disbursedAt)), 0) /
      closed.length,
  );
})();

// ── Geography ────────────────────────────────────────────────────────────────
export const provinceMix = countBy(aidCases, (c) => c.hadKifayah.province);
export const kotaMix = countBy(aidCases, (c) => c.hadKifayah.region);

// ── Program mix — two lenses ─────────────────────────────────────────────────
export const programByQty = countBy(aidCases, (c) => c.program);
// Rupiah lens: approved nominal where decided, else HK recommendation as proxy.
export const programByValue = sumBy(
  aidCases,
  (c) => c.program,
  (c) => c.decisionNominal ?? c.hadKifayah.recommendedAid,
);

// ── Jenis bantuan (insidental vs rutin) ──────────────────────────────────────
export const aidTypeMix = countBy(aidCases, (c) =>
  c.aidType === "rutin_bulanan" ? "Rutin bulanan" : "Insidental",
);

// ── Demographics (Form 1) ────────────────────────────────────────────────────
export const maritalMix = countBy(aidCases, (c) => c.applicant.maritalStatus);
export const housingMix = countBy(aidCases, (c) => c.applicant.housingStatus);
export const genderMix = countBy(aidCases, (c) => c.applicant.gender);
export const avgDependents = (
  aidCases.reduce((t, c) => t + c.applicant.dependents, 0) / (totalPengajuan || 1)
).toFixed(1);

// ── Asnaf / eligibility ──────────────────────────────────────────────────────
const eligibilityOrder: Eligibility[] = ["Sangat Layak", "Layak", "Perlu Review", "Tidak Layak"];
export const eligibilityMix = eligibilityOrder
  .map((label) => ({
    label,
    count: aidCases.filter((c) => c.hadKifayah.eligibility === label).length,
  }))
  .filter((e) => e.count > 0);

// HK regional index (reference master that drives the calc), sorted by household need.
export const regionalIndex = [...regionalIndexes].sort(
  (a, b) => b.familyMonthlyNeed - a.familyMonthlyNeed,
);

// Recent activity — latest workflow event per case, newest first.
export const recentActivity = aidCases
  .map((c) => {
    const last = c.timeline[c.timeline.length - 1];
    return {
      ...last,
      caseNumber: c.caseNumber,
      applicant: c.applicant.name,
      sortKey: c.submittedAt,
    };
  })
  .sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime());

// ── Workflow funnel + aging (bottleneck detection) ───────────────────────────
const stageOrder = workflowSteps.map((s) => s.status);
function reached(status: WorkflowStatus, stage: WorkflowStatus) {
  if (status === "rejected") return stage === "submitted";
  const cur = stageOrder.indexOf(status);
  return cur >= stageOrder.indexOf(stage) && cur !== -1;
}
export const funnel = workflowSteps.map((step) => {
  const here = aidCases.filter((c) => c.status === step.status);
  const ages = here.map((c) => daysBetween(c.submittedAt));
  return {
    status: step.status,
    label: step.label,
    count: aidCases.filter((c) => reached(c.status, step.status)).length,
    hereNow: here.length,
    avgAge: ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0,
  };
});
export const funnelMax = Math.max(...funnel.map((f) => f.count), 1);

export { aidCases, donors, regionalIndexes, sipUsers, statusLabels, workflowSteps, daysBetween };
