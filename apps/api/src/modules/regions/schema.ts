import { z } from "zod";

export const regionCreateSchema = z.object({
  province: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  familyMonthlyNeed: z.number().int().positive(),
  perCapitaNeed: z.number().int().positive(),
  foodIndex: z.number().positive().max(5).default(1),
});

export const regionUpdateSchema = regionCreateSchema.partial();
