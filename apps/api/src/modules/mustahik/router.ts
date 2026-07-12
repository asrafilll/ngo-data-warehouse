import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import type { AuthVariables } from "../auth/middleware";
import { requireRole, requireUser } from "../auth/middleware";

const writerRoles = ["admin", "pengurus"];

// Corrections to the master profile (typos, completing rutin placeholders). NIK is
// immutable — it is the dedup key.
const mustahikUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  birthPlace: z.string().trim().max(100).optional(),
  birthDate: z.string().trim().max(50).optional(),
  age: z.number().int().min(0).max(120).optional(),
  gender: z.enum(["Laki-laki", "Perempuan"]).optional(),
  maritalStatus: z.enum(["Menikah", "Duda", "Janda", "Janda Mati", "Belum Menikah"]).optional(),
  address: z.string().trim().min(1).max(500).optional(),
  housingStatus: z
    .enum(["Milik Sendiri", "Sewa/Kontrak", "Menumpang", "Tidak Memiliki"])
    .optional(),
  rentCost: z.number().int().min(0).nullable().optional(),
  job: z.string().trim().max(150).optional(),
  incomeAmount: z.number().int().min(0).optional(),
  incomePeriod: z.enum(["per hari", "per pekan", "per bulan"]).optional(),
  dependents: z.number().int().min(0).max(30).optional(),
  phone: z.string().trim().max(30).optional(),
  prayerStatus: z.enum(["Ya", "Jarang", "Tidak"]).optional(),
  smokingStatus: z.enum(["Ya", "Jarang", "Tidak"]).optional(),
  priorHelp: z.string().trim().max(1000).optional(),
  publishConsent: z.boolean().optional(),
  sktmStatus: z.enum(["Belum ada", "Bersedia mengurus", "Sudah ada"]).optional(),
  infoSource: z.string().trim().max(200).optional(),
  regionCity: z.string().trim().max(100).optional(),
});

const mustahikQuerySchema = z.object({
  q: z.string().trim().optional(),
  isRutin: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

export const mustahikRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("query", mustahikQuerySchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const { q, isRutin, page, perPage } = c.req.valid("query");
    const where = {
      ...(isRutin === undefined ? {} : { isRutin: isRutin === "true" }),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { nik: { contains: q } },
              { address: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.mustahik.count({ where }),
      prisma.mustahik.findMany({
        where,
        include: {
          region: { select: { city: true, province: true } },
          _count: { select: { cases: true, rutinBeneficiaries: { where: { active: true } } } },
          cases: {
            orderBy: { submittedAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              submittedAt: true,
              program: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return c.json({ rows, total, page, perPage }, 200);
  })
  .get("/:id", async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const mustahik = await prisma.mustahik.findUnique({
      where: { id: c.req.param("id") },
      include: {
        region: true,
        cases: {
          orderBy: { submittedAt: "desc" },
          include: { program: { select: { name: true } } },
        },
        rutinBeneficiaries: { include: { program: { select: { name: true } } } },
      },
    });
    if (!mustahik) return c.json({ error: "not_found" }, 404);
    return c.json({ mustahik }, 200);
  })
  .patch("/:id", zValidator("json", mustahikUpdateSchema), async (c) => {
    if (!requireRole(c, writerRoles)) return c.json({ error: "forbidden" }, 403);
    const { regionCity, ...fields } = c.req.valid("json");
    const region = regionCity
      ? await prisma.regionalIndex.findFirst({
          where: { city: { equals: regionCity, mode: "insensitive" } },
        })
      : null;
    const existing = await prisma.mustahik.findUnique({ where: { id: c.req.param("id") } });
    if (!existing) return c.json({ error: "not_found" }, 404);
    const mustahik = await prisma.mustahik.update({
      where: { id: existing.id },
      data: {
        ...fields,
        ...(region ? { regionId: region.id } : {}),
        // An edited profile counts as complete — placeholders graduate here.
        profileComplete: true,
      },
    });
    return c.json({ mustahik }, 200);
  });
