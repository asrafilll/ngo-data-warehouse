import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireUser } from "../auth/middleware";

const donorCreateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  type: z.enum(["Individu", "Komunitas", "Perusahaan"]),
  channel: z.enum(["Transfer Bank", "QRIS", "Tunai", "Payroll"]),
  lastDonationAt: z.string().date().nullable().optional(),
  totalDonation: z.number().int().min(0).default(0),
  recurring: z.boolean().default(false),
  programPreference: z.string().trim().max(100).default("Umum"),
  status: z.enum(["Aktif", "Perlu follow-up", "Dormant"]).default("Aktif"),
});

const donorUpdateSchema = donorCreateSchema.partial();

const donorsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.string().trim().optional(),
  type: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

const writerRoles = ["admin", "pengurus"];

export const donorsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("query", donorsQuerySchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const { q, status, type, page, perPage } = c.req.valid("query");
    const where = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { programPreference: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [total, donors, allCount, activeCount, recurringCount, aggregate] = await Promise.all([
      prisma.donor.count({ where }),
      prisma.donor.findMany({
        where,
        orderBy: { lastDonationAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.donor.count(),
      prisma.donor.count({ where: { status: "Aktif" } }),
      prisma.donor.count({ where: { recurring: true } }),
      prisma.donor.aggregate({ _sum: { totalDonation: true } }),
    ]);
    return c.json(
      {
        donors,
        total,
        page,
        perPage,
        stats: {
          total: allCount,
          active: activeCount,
          recurring: recurringCount,
          totalDonation: aggregate._sum.totalDonation ?? 0,
        },
      },
      200,
    );
  })
  .post("/", zValidator("json", donorCreateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const input = c.req.valid("json");
    const donor = await prisma.donor.create({
      data: {
        ...input,
        lastDonationAt: input.lastDonationAt ? new Date(input.lastDonationAt) : null,
      },
    });
    return c.json({ donor }, 201);
  })
  .patch("/:id", zValidator("json", donorUpdateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const { lastDonationAt, ...rest } = c.req.valid("json");
    const donor = await prisma.donor.update({
      where: { id: c.req.param("id") },
      data: {
        ...rest,
        ...(lastDonationAt === undefined
          ? {}
          : { lastDonationAt: lastDonationAt ? new Date(lastDonationAt) : null }),
      },
    });
    return c.json({ donor }, 200);
  })
  .delete("/:id", async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    await prisma.donor.delete({ where: { id: c.req.param("id") } });
    return c.json({ deleted: true }, 200);
  });
