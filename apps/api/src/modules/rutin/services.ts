import type { z } from "zod";
import { prisma } from "../../utils/prisma";
import type { beneficiaryCreateSchema } from "./schema";

// Roster for a program + period: beneficiaries who joined at or before the period,
// with their disbursement flag for that period.
export async function getRoster(programId: string, period: string) {
  const beneficiaries = await prisma.rutinBeneficiary.findMany({
    where: { programId, active: true, since: { lte: period } },
    include: {
      mustahik: {
        select: { name: true, nik: true, address: true, region: { select: { city: true } } },
      },
      disbursements: { where: { period, canceledAt: null } },
    },
    orderBy: { createdAt: "asc" },
  });

  return beneficiaries.map((b) => ({
    id: b.id,
    programId: b.programId,
    name: b.mustahik.name,
    nik: b.mustahik.nik,
    region: b.mustahik.region?.city ?? b.mustahik.address,
    nominal: b.nominal,
    since: b.since,
    disbursed: b.disbursements.length > 0,
    disbursedAt: b.disbursements[0]?.disbursedAt ?? null,
  }));
}

export async function addBeneficiary(input: z.infer<typeof beneficiaryCreateSchema>) {
  const region = input.region
    ? await prisma.regionalIndex.findFirst({
        where: { city: { equals: input.region, mode: "insensitive" } },
      })
    : null;

  const mustahik = await prisma.mustahik.upsert({
    where: { nik: input.nik },
    update: { isRutin: true },
    // Placeholder profile (roster only knows name + NIK). Flagged incomplete so it is
    // visible in the master list and excluded from demographics until edited.
    create: {
      nik: input.nik,
      name: input.name,
      profileComplete: false,
      age: 0,
      gender: "Laki-laki",
      maritalStatus: "Belum Menikah",
      address: input.region || "-",
      housingStatus: "Menumpang",
      job: "-",
      incomeAmount: 0,
      incomePeriod: "per bulan",
      dependents: 0,
      phone: "-",
      prayerStatus: "Ya",
      smokingStatus: "Tidak",
      sktmStatus: "Belum ada",
      isRutin: true,
      regionId: region?.id ?? null,
    },
  });

  return prisma.rutinBeneficiary.upsert({
    where: { programId_mustahikId: { programId: input.programId, mustahikId: mustahik.id } },
    update: { nominal: input.nominal, active: true, since: input.since },
    create: {
      programId: input.programId,
      mustahikId: mustahik.id,
      nominal: input.nominal,
      since: input.since,
    },
  });
}

// Un-toggling soft-cancels the row (canceledAt/canceledBy) so the correction stays
// auditable; re-toggling revives it.
export async function setDisbursed(
  beneficiaryId: string,
  period: string,
  disbursed: boolean,
  actor: string,
) {
  if (disbursed) {
    await prisma.rutinDisbursement.upsert({
      where: { beneficiaryId_period: { beneficiaryId, period } },
      update: { canceledAt: null, canceledBy: "", actor, disbursedAt: new Date() },
      create: { beneficiaryId, period, actor },
    });
  } else {
    await prisma.rutinDisbursement.updateMany({
      where: { beneficiaryId, period, canceledAt: null },
      data: { canceledAt: new Date(), canceledBy: actor },
    });
  }
}

export async function disburseAll(programId: string, period: string, actor: string) {
  const eligible = await prisma.rutinBeneficiary.findMany({
    where: { programId, active: true, since: { lte: period } },
    select: { id: true },
  });

  await prisma.rutinDisbursement.createMany({
    data: eligible.map((b) => ({ beneficiaryId: b.id, period, actor })),
    skipDuplicates: true,
  });
  // Revive rows that were previously canceled for this period.
  await prisma.rutinDisbursement.updateMany({
    where: {
      period,
      canceledAt: { not: null },
      beneficiaryId: { in: eligible.map((b) => b.id) },
    },
    data: { canceledAt: null, canceledBy: "", actor, disbursedAt: new Date() },
  });

  return eligible.length;
}
