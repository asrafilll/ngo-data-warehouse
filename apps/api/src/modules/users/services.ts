import type { z } from "zod";
import { prisma } from "../../utils/prisma";
import { auth } from "../auth/auth";
import type { amilCreateSchema, amilUpdateSchema } from "./schema";

const amilSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  region: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function listAmil(filter: { role?: string; active?: boolean }) {
  return prisma.user.findMany({
    where: {
      role: filter.role ?? { in: ["super_admin", "admin", "pengurus", "verifikator"] },
      ...(filter.active === undefined ? {} : { active: filter.active }),
    },
    select: amilSelect,
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function createAmil(input: z.infer<typeof amilCreateSchema>) {
  const { user } = await auth.api.createUser({
    body: {
      email: input.email,
      name: input.name,
      password: input.password,
      role: input.role as "admin",
    },
  });

  return prisma.user.update({
    where: { id: user.id },
    data: { phone: input.phone, region: input.region, emailVerified: true },
    select: amilSelect,
  });
}

export function updateAmil(id: string, input: z.infer<typeof amilUpdateSchema>) {
  return prisma.user.update({ where: { id }, data: input, select: amilSelect });
}
