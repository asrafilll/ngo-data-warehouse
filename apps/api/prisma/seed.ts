// Seeds the SIP database from the demo mock data in @repo/sip-domain so the admin UI
// stays populated once it switches from mocks to the API. Idempotent: upserts by the
// natural unique keys (email, city, NIK, caseNumber, program name).
import { aidCases, donors, regionalIndexes, sipUsers } from "@repo/sip-domain";
import { auth } from "../src/modules/auth/auth";
import { prisma } from "../src/utils/prisma";

const DEFAULT_PASSWORD = "sip-demo-12345";

// Program master — mirrors apps/admin/src/modules/programs/data.ts seedPrograms.
const programs = [
  {
    name: "Kesehatan",
    type: "insidental",
    description: "Bantuan biaya berobat, obat rutin, dan tindakan medis darurat.",
  },
  {
    name: "Pendidikan",
    type: "insidental",
    description: "Bantuan biaya sekolah, seragam, dan perlengkapan belajar.",
  },
  {
    name: "Kebutuhan Pokok",
    type: "insidental",
    description: "Bantuan sembako dan kebutuhan pangan mendesak.",
  },
  {
    name: "Darurat Hunian",
    type: "insidental",
    description: "Bantuan perbaikan rumah tidak layak huni dan darurat tempat tinggal.",
  },
  {
    name: "Anak Yatim",
    type: "rutin",
    description: "Santunan bulanan untuk anak yatim binaan.",
    defaultNominal: 500_000,
  },
  {
    name: "Anak Asuh",
    type: "rutin",
    description: "Beasiswa dan santunan bulanan anak asuh.",
    defaultNominal: 750_000,
  },
  {
    name: "Tahfidz",
    type: "rutin",
    description: "Dukungan bulanan santri program tahfidz.",
    defaultNominal: 400_000,
  },
] as const;

// Rutin roster — mirrors apps/admin/src/modules/rutin/data.ts rutinBeneficiaries.
const rutinRoster: Array<{
  program: string;
  name: string;
  region: string;
  nik: string;
  nominal: number;
  since: string;
}> = [
  {
    program: "Anak Asuh",
    name: "Nabila Putri",
    region: "Bogor",
    nik: "3271056009100002",
    nominal: 750_000,
    since: "2025-09",
  },
  {
    program: "Anak Asuh",
    name: "Rizky Aditya",
    region: "Bekasi",
    nik: "3275041203110004",
    nominal: 1_000_000,
    since: "2026-01",
  },
  {
    program: "Anak Asuh",
    name: "Salsa Nur Aini",
    region: "Jakarta Timur",
    nik: "3172054507120006",
    nominal: 750_000,
    since: "2026-03",
  },
  {
    program: "Anak Yatim",
    name: "Fatimah Zahra",
    region: "Bogor",
    nik: "3271052208130001",
    nominal: 500_000,
    since: "2025-06",
  },
  {
    program: "Anak Yatim",
    name: "Yusuf Abdullah",
    region: "Bekasi",
    nik: "3275040110120003",
    nominal: 500_000,
    since: "2025-11",
  },
  {
    program: "Anak Yatim",
    name: "Aisyah Rahma",
    region: "Tangerang Selatan",
    nik: "3674051503140005",
    nominal: 600_000,
    since: "2026-02",
  },
  {
    program: "Anak Yatim",
    name: "Zaid Malik",
    region: "Bogor",
    nik: "3271050907130007",
    nominal: 500_000,
    since: "2026-04",
  },
  {
    program: "Tahfidz",
    name: "Hafiz Ananda",
    region: "Bekasi",
    nik: "3275042605100008",
    nominal: 400_000,
    since: "2025-08",
  },
  {
    program: "Tahfidz",
    name: "Ummu Kultsum",
    region: "Bogor",
    nik: "3271056812110009",
    nominal: 450_000,
    since: "2026-05",
  },
  {
    program: "Anak Asuh",
    name: "Dimas Prasetyo",
    region: "Depok",
    nik: "3276041104100010",
    nominal: 750_000,
    since: "2025-12",
  },
  {
    program: "Anak Asuh",
    name: "Kirana Maharani",
    region: "Bogor",
    nik: "3271055503120011",
    nominal: 800_000,
    since: "2026-04",
  },
  {
    program: "Anak Yatim",
    name: "Ibrahim Musa",
    region: "Bekasi",
    nik: "3275040207120012",
    nominal: 500_000,
    since: "2025-10",
  },
  {
    program: "Anak Yatim",
    name: "Khadijah Amira",
    region: "Kota Tangerang",
    nik: "3671052809130013",
    nominal: 550_000,
    since: "2026-01",
  },
  {
    program: "Anak Yatim",
    name: "Ali Firmansyah",
    region: "Karawang",
    nik: "3215041506110014",
    nominal: 500_000,
    since: "2026-03",
  },
  {
    program: "Tahfidz",
    name: "Bilal Saputra",
    region: "Bekasi",
    nik: "3275041712100015",
    nominal: 400_000,
    since: "2025-09",
  },
  {
    program: "Tahfidz",
    name: "Maryam Solehah",
    region: "Depok",
    nik: "3276046011120016",
    nominal: 450_000,
    since: "2026-02",
  },
];

const rutinPeriods = ["2026-05", "2026-06", "2026-07"];
const currentPeriod = "2026-07";

function slugEmail(name: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")}@sip.or.id`;
}

async function seedOrgSettings() {
  await prisma.orgSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Solidaritas Insan Peduli",
      legalName: "Yayasan Solidaritas Insan Peduli",
      address: "Bekasi, Jawa Barat",
      phone: "0812-0000-0000",
      email: "info@sip.or.id",
      preferences: { notifyOnSubmission: true, autoAssignByRegion: true },
    },
  });
}

async function seedPrograms() {
  const byName = new Map<string, string>();
  for (const p of programs) {
    const row = await prisma.program.upsert({
      where: { name: p.name },
      update: {
        description: p.description,
        type: p.type,
        defaultNominal: "defaultNominal" in p ? p.defaultNominal : null,
      },
      create: {
        name: p.name,
        type: p.type,
        description: p.description,
        active: true,
        defaultNominal: "defaultNominal" in p ? p.defaultNominal : null,
      },
    });
    byName.set(row.name, row.id);
  }
  return byName;
}

async function seedRegions() {
  const byCity = new Map<string, string>();
  for (const r of regionalIndexes) {
    const row = await prisma.regionalIndex.upsert({
      where: { city: r.city },
      update: {
        province: r.province,
        familyMonthlyNeed: r.familyMonthlyNeed,
        perCapitaNeed: r.perCapitaNeed,
        foodIndex: r.foodIndex,
      },
      create: {
        city: r.city,
        province: r.province,
        familyMonthlyNeed: r.familyMonthlyNeed,
        perCapitaNeed: r.perCapitaNeed,
        foodIndex: r.foodIndex,
      },
    });
    byCity.set(row.city, row.id);
  }
  return byCity;
}

async function seedUsers() {
  // Map mock usr-xxx ids -> real User ids so case assignments carry over.
  const byMockId = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const u of sipUsers) {
    const email = slugEmail(u.name);
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const created = await auth.api.createUser({
        body: { email, name: u.name, password: DEFAULT_PASSWORD, role: u.role as "admin" },
      });
      user = await prisma.user.update({
        where: { id: created.user.id },
        data: {
          role: u.role,
          phone: u.phone,
          region: u.region,
          active: u.status === "Aktif",
          emailVerified: true,
        },
      });
    }
    byMockId.set(u.id, user.id);
    byName.set(u.name, user.id);
  }

  return { byMockId, byName };
}

async function seedMustahikFromCase(
  applicant: (typeof aidCases)[number]["applicant"],
  regionId?: string,
) {
  return prisma.mustahik.upsert({
    where: { nik: applicant.nik },
    update: {},
    create: {
      nik: applicant.nik,
      name: applicant.name,
      birthPlace: applicant.birthPlace,
      birthDate: applicant.birthDate,
      age: applicant.age,
      gender: applicant.gender,
      maritalStatus: applicant.maritalStatus,
      address: applicant.address,
      housingStatus: applicant.housingStatus,
      rentCost: applicant.rentCost ?? null,
      job: applicant.job,
      incomeAmount: applicant.incomeAmount,
      incomePeriod: applicant.incomePeriod,
      dependents: applicant.dependents,
      phone: applicant.phone,
      prayerStatus: applicant.prayerStatus,
      smokingStatus: applicant.smokingStatus,
      priorHelp: applicant.priorHelp,
      publishConsent: applicant.publishConsent,
      sktmStatus: applicant.sktmStatus,
      infoSource: applicant.infoSource,
      regionId: regionId ?? null,
    },
  });
}

async function seedCases(
  programsByName: Map<string, string>,
  regionsByCity: Map<string, string>,
  usersByMockId: Map<string, string>,
  usersByName: Map<string, string>,
) {
  for (const c of aidCases) {
    const existing = await prisma.aidCase.findUnique({ where: { caseNumber: c.caseNumber } });
    if (existing) continue;

    const regionId = regionsByCity.get(c.hadKifayah.region);
    const mustahik = await seedMustahikFromCase(c.applicant, regionId);
    const programId = programsByName.get(c.program);
    if (!programId) throw new Error(`Unknown program: ${c.program}`);

    const pelapor = await prisma.pelapor.create({
      data: {
        name: c.reporter.name,
        relation: c.reporter.relation,
        institution: c.reporter.institution,
        address: c.reporter.address,
        phone: c.reporter.phone,
      },
    });

    const submittedAt = new Date(c.submittedAt);
    const row = await prisma.aidCase.create({
      data: {
        caseNumber: c.caseNumber,
        aidType: c.aidType,
        programId,
        status: c.status,
        priority: c.priority,
        problem: c.problem,
        nextAction: c.nextAction,
        mustahikId: mustahik.id,
        pelaporId: pelapor.id,
        submittedById: usersByName.get(c.submittedBy) ?? null,
        submittedAt,
        assignedVerifierId: c.assignedVerifierId
          ? (usersByMockId.get(c.assignedVerifierId) ?? null)
          : null,
        decisionNominal: c.decisionNominal ?? null,
        disbursedAt: c.disbursedAt ? new Date(c.disbursedAt) : null,
      },
    });

    // Timeline: mock `at` strings are display labels, so anchor events to submittedAt
    // with hour offsets to preserve ordering.
    await prisma.caseEvent.createMany({
      data: c.timeline.map((t, i) => ({
        caseId: row.id,
        label: t.label,
        actor: t.actor,
        note: t.note,
        at: new Date(submittedAt.getTime() + i * 26 * 60 * 60 * 1000),
      })),
    });

    if (c.verification) {
      const v = c.verification;
      await prisma.fieldVerification.create({
        data: {
          caseId: row.id,
          verifierId: usersByName.get(v.verifierName) ?? null,
          coverage: v.coverage,
          verifiedAt: new Date(v.verifiedAt),
          rentCost: c.applicant.rentCost ?? null,
          rentPeriod: c.applicant.rentCost ? "per_bulan" : "tidak_sewa",
          actualJob: c.applicant.job,
          actualIncome: c.hadKifayah.actualMonthlyIncome,
          background: v.background,
          currentCondition: v.currentCondition,
          requestedNeed: v.requestedNeed,
          effortsTaken: v.effortsTaken,
          housingObservation: v.housingObservation,
          socialRecord: v.socialRecord,
          recommendation: v.recommendation,
          neighborContact: v.neighborContact,
          notes: v.notes,
          hadKifayahValue: c.hadKifayah.familyMonthlyNeed,
        },
      });

      await prisma.casePhoto.createMany({
        data: v.photos
          .filter((p) => p.status === "Tersimpan")
          .map((p) => ({
            caseId: row.id,
            kind:
              p.kind === "Hunian" ? "hunian" : p.kind === "Penyaluran" ? "penyaluran" : "dokumen",
            label: p.label,
            storageKey: `seed/${row.caseNumber}/${p.label.toLowerCase().replace(/\s+/g, "-")}.webp`,
          })) as never,
      });
    }

    if (c.status === "completed" && c.decisionNominal) {
      await prisma.disbursement.create({
        data: {
          caseId: row.id,
          nominal: c.decisionNominal,
          disbursedAt: c.disbursedAt ? new Date(c.disbursedAt) : submittedAt,
          buktiKey: `seed/${row.caseNumber}/bukti-penyaluran.webp`,
        },
      });
    }
  }
}

async function seedRutin(programsByName: Map<string, string>, regionsByCity: Map<string, string>) {
  for (const b of rutinRoster) {
    const programId = programsByName.get(b.program);
    if (!programId) throw new Error(`Unknown rutin program: ${b.program}`);

    const mustahik = await prisma.mustahik.upsert({
      where: { nik: b.nik },
      update: { isRutin: true },
      create: {
        nik: b.nik,
        name: b.name,
        age: 12,
        gender: "Laki-laki",
        maritalStatus: "Belum Menikah",
        address: b.region,
        housingStatus: "Menumpang",
        job: "Pelajar",
        incomeAmount: 0,
        incomePeriod: "per bulan",
        dependents: 0,
        phone: "-",
        prayerStatus: "Ya",
        smokingStatus: "Tidak",
        sktmStatus: "Sudah ada",
        isRutin: true,
        regionId: regionsByCity.get(b.region) ?? null,
      },
    });

    const beneficiary = await prisma.rutinBeneficiary.upsert({
      where: { programId_mustahikId: { programId, mustahikId: mustahik.id } },
      update: { nominal: b.nominal, since: b.since },
      create: {
        programId,
        mustahikId: mustahik.id,
        nominal: b.nominal,
        since: b.since,
      },
    });

    // Past periods fully settled; current period: first half of the roster disbursed
    // (mirrors the demo's seedDisbursed helper).
    const rosterIndex = rutinRoster.indexOf(b);
    for (const period of rutinPeriods) {
      if (b.since > period) continue;
      const isCurrent = period === currentPeriod;
      if (isCurrent && rosterIndex % 2 === 1) continue;
      await prisma.rutinDisbursement.upsert({
        where: { beneficiaryId_period: { beneficiaryId: beneficiary.id, period } },
        update: {},
        create: {
          beneficiaryId: beneficiary.id,
          period,
          actor: "Fikri Ramadhan",
          disbursedAt: new Date(`${period}-05T10:00:00+07:00`),
        },
      });
    }
  }
}

async function seedDonors() {
  for (const d of donors) {
    const existing = await prisma.donor.findFirst({ where: { name: d.name } });
    if (existing) continue;
    await prisma.donor.create({
      data: {
        name: d.name,
        type: d.type,
        channel: d.channel,
        lastDonationAt: new Date(d.lastDonationAt),
        totalDonation: d.totalDonation,
        recurring: d.recurring,
        programPreference: d.programPreference,
        status: d.status,
      },
    });
  }
}

async function main() {
  await seedOrgSettings();
  const programsByName = await seedPrograms();
  const regionsByCity = await seedRegions();
  const { byMockId, byName } = await seedUsers();
  await seedCases(programsByName, regionsByCity, byMockId, byName);
  await seedRutin(programsByName, regionsByCity);
  await seedDonors();

  const counts = {
    users: await prisma.user.count(),
    programs: await prisma.program.count(),
    regions: await prisma.regionalIndex.count(),
    mustahik: await prisma.mustahik.count(),
    cases: await prisma.aidCase.count(),
    rutin: await prisma.rutinBeneficiary.count(),
    donors: await prisma.donor.count(),
  };
  console.log("Seed done:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
