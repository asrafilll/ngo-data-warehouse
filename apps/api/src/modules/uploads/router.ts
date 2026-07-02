// Presigned S3 uploads for case photos. Per PRD §6, the client compresses and converts
// images to WebP before uploading, so only image/webp is presigned. Storage is lazy so
// the API boots without S3 credentials (uploads then return 503).
import { zValidator } from "@hono/zod-validator";
import { getStorageConfig } from "@repo/config";
import { createStorage } from "@repo/storage";
import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../auth/middleware";
import { requireUser } from "../auth/middleware";

const presignSchema = z.object({
  caseId: z.string().min(1),
  kind: z.enum(["hunian", "penyaluran", "dokumen"]),
  fileName: z.string().trim().min(1).max(200),
});

const signGetSchema = z.object({ key: z.string().min(1) });

let storage: ReturnType<typeof createStorage> | null | undefined;

function getStorage() {
  if (storage === undefined) {
    try {
      storage = createStorage(getStorageConfig());
    } catch {
      storage = null;
    }
  }
  return storage;
}

function sanitizeFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.webp`;
}

export const uploadsRouter = new Hono<{ Variables: AuthVariables }>()
  .post("/presign", zValidator("json", presignSchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const client = getStorage();
    if (!client) return c.json({ error: "storage_unconfigured" }, 503);

    const { caseId, kind, fileName } = c.req.valid("json");
    const key = `cases/${caseId}/${kind}/${Date.now()}-${sanitizeFileName(fileName)}`;
    const url = await client.getSignedPutObjectUrl({
      key,
      contentType: "image/webp",
      expiresIn: 60 * 10,
    });

    return c.json({ key, url, contentType: "image/webp" }, 200);
  })
  .get("/sign", zValidator("query", signGetSchema), async (c) => {
    if (!requireUser(c)) return c.json({ error: "unauthorized" }, 401);
    const client = getStorage();
    if (!client) return c.json({ error: "storage_unconfigured" }, 503);

    const { key } = c.req.valid("query");
    const url = await client.getSignedGetObjectUrl({ key, expiresIn: 60 * 30 });
    return c.json({ url }, 200);
  });
