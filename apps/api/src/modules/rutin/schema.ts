import { z } from "zod";

const periodSchema = z.string().regex(/^\d{4}-\d{2}$/, "Periode harus format YYYY-MM");

export const rosterQuerySchema = z.object({
  programId: z.string().min(1),
  period: periodSchema,
});

export const beneficiaryCreateSchema = z.object({
  programId: z.string().min(1),
  name: z.string().trim().min(1).max(150),
  region: z.string().trim().max(100).default(""),
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "NIK harus 16 digit"),
  nominal: z.number().int().positive(),
  since: periodSchema,
});

export const beneficiaryUpdateSchema = z.object({
  nominal: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export const disburseToggleSchema = z.object({
  beneficiaryId: z.string().min(1),
  period: periodSchema,
  disbursed: z.boolean(),
});

export const disburseAllSchema = z.object({
  programId: z.string().min(1),
  period: periodSchema,
});
