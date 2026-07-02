import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import type { AuthVariables } from "../auth/middleware";
import { requireUser } from "../auth/middleware";

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
  });
