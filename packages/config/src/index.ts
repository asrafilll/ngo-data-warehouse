import type { StorageConfig } from "@repo/storage";
import { z } from "zod";

export type RuntimeEnv = "development" | "test" | "production";

const defaultClientOrigins = "http://localhost:3000,http://localhost:4000";
const defaultDatabaseUrl =
  "postgresql://postgres:postgres@localhost:15432/monorepo_template?schema=public";

const runtimeEnvSchema = z.enum(["development", "test", "production"]).default("development");
const optionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);
const booleanSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return value;
}, z.boolean());

const serverEnvSchema = z
  .object({
    NODE_ENV: runtimeEnvSchema,
    API_PORT: z.coerce.number().int().positive().default(8000),
    AUTH_COOKIE_SECURE: booleanSchema.default(false),
    AUTH_SECRET: z.string().trim().min(1).default("dev-change-me"),
    CLIENT_ORIGINS: z.string().trim().min(1).default(defaultClientOrigins),
    DATABASE_URL: z.string().trim().min(1).default(defaultDatabaseUrl),
    REDIS_URL: z.string().trim().min(1).default("redis://localhost:16379"),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === "production" && env.AUTH_SECRET === "dev-change-me") {
      context.addIssue({
        code: "custom",
        message: "AUTH_SECRET must be changed in production.",
        path: ["AUTH_SECRET"],
      });
    }
  });

const storageEnvSchema = z.object({
  S3_ACCESS_KEY_ID: z.string().trim().min(1),
  S3_BUCKET: z.string().trim().min(1),
  S3_ENDPOINT: optionalStringSchema,
  S3_FORCE_PATH_STYLE: booleanSchema.default(true),
  S3_PUBLIC_BASE_URL: optionalStringSchema,
  S3_REGION: z.string().trim().min(1).default("auto"),
  S3_SECRET_ACCESS_KEY: z.string().trim().min(1),
});

export const env = serverEnvSchema.parse(process.env);

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
} as const;

export const apiConfig = {
  port: env.API_PORT,
  clientOrigins: parseCsv(env.CLIENT_ORIGINS),
} as const;

export const authConfig = {
  cookieName: "auth_token",
  cookieSecure: env.AUTH_COOKIE_SECURE,
  maxAgeSeconds: 60 * 60 * 24 * 7,
  secret: env.AUTH_SECRET,
} as const;

export const databaseConfig = {
  url: env.DATABASE_URL,
} as const;

export const redisConfig = {
  url: env.REDIS_URL,
} as const;

export function getStorageConfig(): StorageConfig {
  const storageEnv = storageEnvSchema.parse(process.env);

  return {
    accessKeyId: storageEnv.S3_ACCESS_KEY_ID,
    bucket: storageEnv.S3_BUCKET,
    endpoint: storageEnv.S3_ENDPOINT,
    forcePathStyle: storageEnv.S3_FORCE_PATH_STYLE,
    publicBaseUrl: storageEnv.S3_PUBLIC_BASE_URL,
    region: storageEnv.S3_REGION,
    secretAccessKey: storageEnv.S3_SECRET_ACCESS_KEY,
  };
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
