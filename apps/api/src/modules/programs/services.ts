import type { z } from "zod";
import { prisma } from "../../utils/prisma";
import type { programCreateSchema, programUpdateSchema } from "./schema";

export function listPrograms(filter: { type?: "insidental" | "rutin"; active?: boolean }) {
  return prisma.program.findMany({
    where: {
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.active === undefined ? {} : { active: filter.active }),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { cases: true, rutinBeneficiaries: { where: { active: true } } } },
    },
  });
}

export function createProgram(input: z.infer<typeof programCreateSchema>) {
  return prisma.program.create({
    data: { ...input, defaultNominal: input.defaultNominal ?? null },
  });
}

export function updateProgram(id: string, input: z.infer<typeof programUpdateSchema>) {
  return prisma.program.update({ where: { id }, data: input });
}

export async function deleteProgram(id: string) {
  const [caseCount, rosterCount] = await Promise.all([
    prisma.aidCase.count({ where: { programId: id } }),
    prisma.rutinBeneficiary.count({ where: { programId: id } }),
  ]);

  // Programs referenced by history are deactivated instead of deleted so past cases
  // keep their labels.
  if (caseCount > 0 || rosterCount > 0) {
    await prisma.program.update({ where: { id }, data: { active: false } });
    return { deleted: false, deactivated: true };
  }

  await prisma.program.delete({ where: { id } });
  return { deleted: true, deactivated: false };
}
