import { z } from "zod";

export const usersQuerySchema = z.object({
  role: z.enum(["super_admin", "admin", "pengurus", "verifikator"]).optional(),
  active: z.enum(["true", "false"]).optional(),
});

export const amilCreateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["super_admin", "admin", "pengurus", "verifikator"]),
  phone: z.string().trim().max(30).default(""),
  region: z.string().trim().max(100).default(""),
});

export const amilUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  role: z.enum(["super_admin", "admin", "pengurus", "verifikator"]).optional(),
  phone: z.string().trim().max(30).optional(),
  region: z.string().trim().max(100).optional(),
  active: z.boolean().optional(),
});
