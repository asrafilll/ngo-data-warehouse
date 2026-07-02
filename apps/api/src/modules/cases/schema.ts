import { z } from "zod";

export const casesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z
    .enum([
      "submitted",
      "approved_for_verification",
      "assigned",
      "surveyed",
      "approved",
      "rejected",
      "disbursement_pending",
      "completed",
      "needs_revision",
    ])
    .optional(),
  program: z.string().trim().optional(),
  aidType: z.enum(["insidental", "rutin_bulanan"]).optional(),
});

// Form 1 — Pengajuan Bantuan (PRD §3.1). Applicant + reporter + recommended program.
export const caseIntakeSchema = z.object({
  applicant: z.object({
    name: z.string().trim().min(1).max(150),
    nik: z
      .string()
      .trim()
      .regex(/^\d{16}$/, "NIK harus 16 digit"),
    birthPlace: z.string().trim().max(100).default(""),
    birthDate: z.string().trim().max(50).default(""),
    age: z.number().int().min(0).max(120),
    gender: z.enum(["Laki-laki", "Perempuan"]),
    maritalStatus: z.enum(["Menikah", "Duda", "Janda", "Janda Mati", "Belum Menikah"]),
    address: z.string().trim().min(1).max(500),
    housingStatus: z.enum(["Milik Sendiri", "Sewa/Kontrak", "Menumpang", "Tidak Memiliki"]),
    rentCost: z.number().int().min(0).nullable().optional(),
    job: z.string().trim().max(150).default(""),
    incomeAmount: z.number().int().min(0),
    incomePeriod: z.enum(["per hari", "per pekan", "per bulan"]),
    dependents: z.number().int().min(0).max(30),
    phone: z.string().trim().max(30),
    prayerStatus: z.enum(["Ya", "Jarang", "Tidak"]),
    smokingStatus: z.enum(["Ya", "Jarang", "Tidak"]),
    priorHelp: z.string().trim().max(1000).default(""),
    publishConsent: z.boolean(),
    sktmStatus: z.enum(["Belum ada", "Bersedia mengurus", "Sudah ada"]),
    infoSource: z.string().trim().max(200).default(""),
    regionCity: z.string().trim().max(100).optional(),
  }),
  reporter: z.object({
    name: z.string().trim().min(1).max(150),
    relation: z.string().trim().max(100).default(""),
    institution: z.string().trim().max(150).default(""),
    address: z.string().trim().max(500).default(""),
    phone: z.string().trim().max(30).default(""),
  }),
  programId: z.string().min(1),
  problem: z.string().trim().min(1).max(2000),
  priority: z.enum(["urgent", "normal", "monitor"]).default("normal"),
});

// Triase (Pengurus): forward to verification, send back for revision, or reject.
export const triageSchema = z.object({
  decision: z.enum(["approve", "needs_revision", "reject"]),
  note: z.string().trim().max(1000).default(""),
});

export const assignSchema = z.object({
  verifierId: z.string().min(1),
  note: z.string().trim().max(1000).default(""),
});

// Form 2 — Verifikasi lapangan (PRD §3.2). Auto-populated from Form 1 client-side;
// this payload carries the verifier's corrections + qualitative findings.
export const verificationSchema = z.object({
  coverage: z.string().trim().max(100).default(""),
  verifiedAt: z.string().datetime({ offset: true }).optional(),
  rentCost: z.number().int().min(0).nullable().optional(),
  rentPeriod: z.enum(["per_bulan", "per_tahun", "tidak_sewa"]).default("tidak_sewa"),
  actualJob: z.string().trim().max(150).default(""),
  actualIncome: z.number().int().min(0),
  actualIncomePeriod: z.enum(["per hari", "per pekan", "per bulan"]).default("per bulan"),
  dependentsDetail: z.string().trim().max(2000).default(""),
  background: z.string().trim().max(2000).default(""),
  currentCondition: z.string().trim().max(2000).default(""),
  requestedNeed: z.string().trim().max(2000).default(""),
  effortsTaken: z.string().trim().max(2000).default(""),
  housingObservation: z.string().trim().max(2000).default(""),
  lengthOfStay: z.string().trim().max(100).default(""),
  socialRecord: z.string().trim().max(2000).default(""),
  recommendation: z.string().trim().max(2000).default(""),
  neighborContact: z.string().trim().max(300).default(""),
  notes: z.string().trim().max(2000).default(""),
  housingPhotoKeys: z.array(z.string().min(1)).max(10).default([]),
});

// Keputusan nominal (Pengurus) — full manual override allowed per PRD.
export const decisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  nominal: z.number().int().positive().optional(),
  note: z.string().trim().max(1000).default(""),
});

export const disburseSchema = z.object({
  nominal: z.number().int().positive(),
  buktiKey: z.string().min(1, "Bukti foto penyaluran wajib diunggah"),
  note: z.string().trim().max(1000).default(""),
});
