import { z } from "zod";

export const programCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(["insidental", "rutin"]),
  description: z.string().trim().max(500).default(""),
  active: z.boolean().default(true),
  defaultNominal: z.number().int().positive().nullable().optional(),
});

export const programUpdateSchema = programCreateSchema.partial();

export const programsQuerySchema = z.object({
  type: z.enum(["insidental", "rutin"]).optional(),
  active: z.enum(["true", "false"]).optional(),
});
