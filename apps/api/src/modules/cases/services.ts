import { Prisma, type WorkflowStatus } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../../utils/prisma";
import { calculateHadKifayah, toMonthlyIncome } from "./had-kifayah";
import type {
  assignSchema,
  caseIntakeSchema,
  casesQuerySchema,
  caseUpdateSchema,
  decisionSchema,
  disburseSchema,
  triageSchema,
  verificationSchema,
} from "./schema";

export class CaseError extends Error {
  constructor(
    public code:
      | "not_found"
      | "invalid_transition"
      | "missing_nominal"
      | "verifier_not_found"
      | "nominal_mismatch"
      | "not_assigned",
    message: string,
  ) {
    super(message);
    this.name = "CaseError";
  }
}

const nextActionByStatus: Record<WorkflowStatus, string> = {
  submitted: "Pengurus melakukan triase: lanjut verifikasi, revisi, atau tolak.",
  approved_for_verification: "Pengurus menugaskan verifikator wilayah.",
  assigned: "Verifikator melengkapi Form Verifikasi Lapangan.",
  surveyed: "Pengurus menentukan nominal bantuan dan alasan keputusan.",
  approved: "Verifikator menyalurkan bantuan dan mengunggah bukti foto.",
  disbursement_pending: "Verifikator menyalurkan bantuan dan mengunggah bukti foto.",
  completed: "Kasus selesai.",
  rejected: "Pengajuan ditolak.",
  needs_revision: "Admin melengkapi data pengajuan lalu mengajukan ulang.",
};

const caseListInclude = {
  mustahik: { include: { region: true } },
  program: true,
  assignedVerifier: { select: { id: true, name: true, region: true } },
} satisfies Prisma.AidCaseInclude;

const caseDetailInclude = {
  mustahik: { include: { region: true } },
  pelapor: true,
  program: true,
  submittedBy: { select: { id: true, name: true } },
  assignedVerifier: { select: { id: true, name: true, region: true, phone: true } },
  verification: { include: { verifier: { select: { id: true, name: true } } } },
  disbursement: true,
  photos: { orderBy: { createdAt: "asc" } },
  events: { orderBy: { at: "asc" } },
} satisfies Prisma.AidCaseInclude;

async function generateCaseNumber() {
  const year = new Date().getFullYear();
  const prefix = `SIP-${year}-`;
  const last = await prisma.aidCase.findFirst({
    where: { caseNumber: { startsWith: prefix } },
    orderBy: { caseNumber: "desc" },
    select: { caseNumber: true },
  });
  const lastSeq = last ? Number.parseInt(last.caseNumber.slice(prefix.length), 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(3, "0")}`;
}

function computeHadKifayah(c: Prisma.AidCaseGetPayload<{ include: typeof caseDetailInclude }>) {
  const monthlyIncome = c.verification
    ? c.verification.actualIncome
    : toMonthlyIncome(c.mustahik.incomeAmount, c.mustahik.incomePeriod);

  return calculateHadKifayah({
    region: c.mustahik.region,
    monthlyIncome,
    dependents: c.mustahik.dependents,
    rentCost: c.verification?.rentCost ?? c.mustahik.rentCost,
  });
}

export async function listCases(query: z.infer<typeof casesQuerySchema>) {
  const where: Prisma.AidCaseWhereInput = {
    ...(query.aidType ? { aidType: query.aidType } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.program ? { program: { name: query.program } } : {}),
    ...(query.q
      ? {
          OR: [
            { caseNumber: { contains: query.q, mode: "insensitive" } },
            { mustahik: { name: { contains: query.q, mode: "insensitive" } } },
            { mustahik: { nik: { contains: query.q } } },
            { mustahik: { region: { city: { contains: query.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.aidCase.count({ where }),
    prisma.aidCase.findMany({
      where,
      include: caseListInclude,
      orderBy: { submittedAt: "desc" },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    }),
  ]);

  return { total, page: query.page, perPage: query.perPage, rows };
}

export async function getCaseDetail(id: string) {
  const row = await prisma.aidCase.findUnique({ where: { id }, include: caseDetailInclude });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  return { ...row, hadKifayah: computeHadKifayah(row) };
}

export async function intakeCase(
  input: z.infer<typeof caseIntakeSchema>,
  actor: { id: string; name: string },
) {
  const { applicant, reporter } = input;

  const region = applicant.regionCity
    ? await prisma.regionalIndex.findUnique({ where: { city: applicant.regionCity } })
    : null;

  const { regionCity: _regionCity, ...mustahikData } = applicant;
  const mustahik = await prisma.mustahik.upsert({
    where: { nik: applicant.nik },
    // Re-submission for a known NIK refreshes the master profile with the newest data.
    update: {
      ...mustahikData,
      rentCost: applicant.rentCost ?? null,
      regionId: region?.id ?? undefined,
    },
    create: { ...mustahikData, rentCost: applicant.rentCost ?? null, regionId: region?.id ?? null },
  });

  const pelapor = await prisma.pelapor.create({ data: reporter });

  // The case number comes from a max-scan, so two concurrent intakes can race to the
  // same number; retry on the unique-constraint violation.
  let created: { id: string } | null = null;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    const caseNumber = await generateCaseNumber();
    try {
      created = await prisma.aidCase.create({
        data: {
          caseNumber,
          aidType: "insidental",
          programId: input.programId,
          status: "submitted",
          priority: input.priority,
          problem: input.problem,
          nextAction: nextActionByStatus.submitted,
          mustahikId: mustahik.id,
          pelaporId: pelapor.id,
          submittedById: actor.id,
          events: {
            create: {
              label: "Pengajuan dibuat",
              actor: actor.name,
              note: "Data awal pemohon dan pelapor dicatat.",
            },
          },
        },
        select: { id: true },
      });
    } catch (error) {
      const isDuplicateNumber =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isDuplicateNumber || attempt === 2) throw error;
    }
  }
  if (!created) throw new Error("Gagal membuat nomor kasus.");

  return getCaseDetail(created.id);
}

// Perbaikan data pengajuan. Only allowed pre-verification; a needs_revision case goes
// back to `submitted` so pengurus can re-triage the corrected data.
export async function updateCase(
  id: string,
  input: z.infer<typeof caseUpdateSchema>,
  actor: { name: string },
) {
  const row = await prisma.aidCase.findUnique({ where: { id } });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  assertStatus(row.status, ["submitted", "needs_revision"], "memperbaiki data pengajuan");

  const { applicant, reporter } = input;

  if (applicant) {
    const region = applicant.regionCity
      ? await prisma.regionalIndex.findUnique({ where: { city: applicant.regionCity } })
      : null;
    const { regionCity: _regionCity, ...mustahikData } = applicant;
    await prisma.mustahik.update({
      where: { id: row.mustahikId },
      data: {
        ...mustahikData,
        rentCost: applicant.rentCost ?? null,
        ...(region ? { regionId: region.id } : {}),
      },
    });
  }

  if (reporter && row.pelaporId) {
    await prisma.pelapor.update({ where: { id: row.pelaporId }, data: reporter });
  }

  const wasRevision = row.status === "needs_revision";
  return transition(
    id,
    {
      ...(input.programId ? { program: { connect: { id: input.programId } } } : {}),
      ...(input.problem !== undefined ? { problem: input.problem } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      status: "submitted",
      nextAction: nextActionByStatus.submitted,
    },
    {
      label: wasRevision ? "Pengajuan diperbaiki" : "Data pengajuan diperbarui",
      actor: actor.name,
      note: wasRevision
        ? "Data dilengkapi dan diajukan ulang untuk triase."
        : "Data pengajuan diperbarui sebelum triase.",
    },
  );
}

function assertStatus(current: WorkflowStatus, allowed: WorkflowStatus[], action: string) {
  if (!allowed.includes(current)) {
    throw new CaseError("invalid_transition", `Tidak bisa ${action} dari status "${current}".`);
  }
}

async function transition(
  id: string,
  data: Prisma.AidCaseUpdateInput,
  event: { label: string; actor: string; note: string },
) {
  await prisma.aidCase.update({
    where: { id },
    data: { ...data, events: { create: event } },
  });
  return getCaseDetail(id);
}

export async function triageCase(
  id: string,
  input: z.infer<typeof triageSchema>,
  actor: { name: string },
) {
  const row = await prisma.aidCase.findUnique({ where: { id } });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  assertStatus(row.status, ["submitted", "needs_revision"], "melakukan triase");

  if (input.decision === "approve") {
    return transition(
      id,
      {
        status: "approved_for_verification",
        nextAction: nextActionByStatus.approved_for_verification,
      },
      {
        label: "Disetujui untuk verifikasi",
        actor: actor.name,
        note: input.note || "Kasus dinilai perlu survei lapangan.",
      },
    );
  }
  if (input.decision === "needs_revision") {
    return transition(
      id,
      { status: "needs_revision", nextAction: nextActionByStatus.needs_revision },
      {
        label: "Dikembalikan untuk revisi",
        actor: actor.name,
        note: input.note || "Data awal perlu dilengkapi.",
      },
    );
  }
  return transition(
    id,
    { status: "rejected", nextAction: nextActionByStatus.rejected },
    {
      label: "Pengajuan ditolak",
      actor: actor.name,
      note: input.note || "Belum memenuhi kriteria bantuan.",
    },
  );
}

export async function assignVerifier(
  id: string,
  input: z.infer<typeof assignSchema>,
  actor: { name: string },
) {
  const row = await prisma.aidCase.findUnique({ where: { id } });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  assertStatus(row.status, ["approved_for_verification", "assigned"], "menugaskan verifikator");

  const verifier = await prisma.user.findUnique({ where: { id: input.verifierId } });
  if (!verifier) throw new CaseError("verifier_not_found", "Verifikator tidak ditemukan.");

  return transition(
    id,
    {
      status: "assigned",
      nextAction: nextActionByStatus.assigned,
      assignedVerifier: { connect: { id: verifier.id } },
    },
    {
      label: "Ditugaskan",
      actor: actor.name,
      note: input.note || `Diteruskan ke verifikator ${verifier.region ?? ""}`.trim(),
    },
  );
}

// An actor whose only SIP role is verifikator may act only on cases assigned to them;
// admin/pengurus/super_admin may act on any case.
function assertAssignedVerifier(
  row: { assignedVerifierId: string | null },
  actor: { id: string; roles: string[] },
  action: string,
) {
  const elevated = actor.roles.some((role) => ["super_admin", "admin", "pengurus"].includes(role));
  if (!elevated && row.assignedVerifierId !== actor.id) {
    throw new CaseError("not_assigned", `Hanya verifikator yang ditugaskan bisa ${action}.`);
  }
}

export async function submitVerification(
  id: string,
  input: z.infer<typeof verificationSchema>,
  actor: { id: string; name: string; roles: string[] },
) {
  const row = await prisma.aidCase.findUnique({
    where: { id },
    include: { mustahik: { include: { region: true } } },
  });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  // Verification requires a prior assignment; `surveyed` stays allowed for corrections.
  assertStatus(row.status, ["assigned", "surveyed"], "menyimpan verifikasi");
  assertAssignedVerifier(row, actor, "mengisi verifikasi");

  const monthlyIncome = toMonthlyIncome(input.actualIncome, input.actualIncomePeriod);
  const hadKifayah = calculateHadKifayah({
    region: row.mustahik.region,
    monthlyIncome,
    dependents: row.mustahik.dependents,
    rentCost: input.rentCost ?? row.mustahik.rentCost,
  });

  const { housingPhotoKeys, actualIncomePeriod: _period, verifiedAt, ...fields } = input;

  await prisma.fieldVerification.upsert({
    where: { caseId: id },
    update: {
      ...fields,
      actualIncome: monthlyIncome,
      verifiedAt: verifiedAt ? new Date(verifiedAt) : new Date(),
      verifierId: actor.id,
      hadKifayahValue: hadKifayah.familyMonthlyNeed,
    },
    create: {
      ...fields,
      caseId: id,
      actualIncome: monthlyIncome,
      verifiedAt: verifiedAt ? new Date(verifiedAt) : new Date(),
      verifierId: actor.id,
      hadKifayahValue: hadKifayah.familyMonthlyNeed,
    },
  });

  if (housingPhotoKeys.length > 0) {
    await prisma.casePhoto.createMany({
      data: housingPhotoKeys.map((key, i) => ({
        caseId: id,
        kind: "hunian" as const,
        label: `Foto hunian ${i + 1}`,
        storageKey: key,
      })),
    });
  }

  return transition(
    id,
    { status: "surveyed", nextAction: nextActionByStatus.surveyed },
    { label: "Verifikasi selesai", actor: actor.name, note: "Hasil survei lapangan tersimpan." },
  );
}

export async function decideCase(
  id: string,
  input: z.infer<typeof decisionSchema>,
  actor: { name: string },
) {
  const row = await prisma.aidCase.findUnique({ where: { id } });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  assertStatus(row.status, ["surveyed"], "memutuskan nominal");

  if (input.decision === "reject") {
    return transition(
      id,
      { status: "rejected", nextAction: nextActionByStatus.rejected, decidedAt: new Date() },
      {
        label: "Pengajuan ditolak",
        actor: actor.name,
        note: input.note || "Tidak memenuhi kriteria setelah verifikasi.",
      },
    );
  }

  if (!input.nominal) {
    throw new CaseError("missing_nominal", "Nominal bantuan wajib diisi saat menyetujui.");
  }

  return transition(
    id,
    {
      status: "disbursement_pending",
      nextAction: nextActionByStatus.disbursement_pending,
      decisionNominal: input.nominal,
      decisionNote: input.note || null,
      decidedAt: new Date(),
    },
    {
      label: "Nominal disetujui",
      actor: actor.name,
      note: input.note || `Disetujui untuk disalurkan.`,
    },
  );
}

export async function disburseCase(
  id: string,
  input: z.infer<typeof disburseSchema>,
  actor: { id: string; name: string; roles: string[] },
) {
  const row = await prisma.aidCase.findUnique({ where: { id } });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  assertStatus(row.status, ["disbursement_pending", "approved"], "menyalurkan bantuan");
  assertAssignedVerifier(row, actor, "menyalurkan bantuan");

  // The disbursed amount is the amount pengurus approved — no silent overrides.
  const nominal = input.nominal ?? row.decisionNominal;
  if (!nominal) {
    throw new CaseError("missing_nominal", "Nominal penyaluran tidak ditemukan.");
  }
  if (row.decisionNominal && nominal !== row.decisionNominal) {
    throw new CaseError(
      "nominal_mismatch",
      `Nominal penyaluran harus sama dengan keputusan pengurus (Rp ${row.decisionNominal.toLocaleString("id-ID")}).`,
    );
  }

  const disbursedAt = new Date();
  await prisma.disbursement.create({
    data: { caseId: id, nominal, buktiKey: input.buktiKey, disbursedAt },
  });
  await prisma.casePhoto.create({
    data: { caseId: id, kind: "penyaluran", label: "Bukti penyaluran", storageKey: input.buktiKey },
  });

  return transition(
    id,
    { status: "completed", nextAction: nextActionByStatus.completed, disbursedAt },
    {
      label: "Bantuan disalurkan",
      actor: actor.name,
      note: input.note || "Bukti penyaluran tersimpan.",
    },
  );
}

// Koreksi keputusan: a rejected case can be reopened instead of forcing a brand-new
// submission. It resumes at `surveyed` when a survey exists, otherwise at `submitted`.
export async function reopenCase(id: string, actor: { name: string }) {
  const row = await prisma.aidCase.findUnique({ where: { id }, include: { verification: true } });
  if (!row) throw new CaseError("not_found", "Kasus tidak ditemukan.");
  assertStatus(row.status, ["rejected"], "membuka kembali kasus");

  const resumeAt: WorkflowStatus = row.verification?.verifiedAt ? "surveyed" : "submitted";
  return transition(
    id,
    {
      status: resumeAt,
      nextAction: nextActionByStatus[resumeAt],
      decidedAt: null,
      decisionNominal: null,
      decisionNote: null,
    },
    {
      label: "Kasus dibuka kembali",
      actor: actor.name,
      note:
        resumeAt === "surveyed"
          ? "Kembali ke tahap keputusan; hasil verifikasi sebelumnya tetap berlaku."
          : "Kembali ke tahap triase.",
    },
  );
}
