import { zValidator } from "@hono/zod-validator";
import { externalAuthConfig } from "@repo/config";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { auth } from "./auth";
import type { AuthVariables } from "./middleware";

// Single-account login: credentials are verified against approval-sip
// (sip.rekapdana.com), then mirrored into a local better-auth user so the normal
// session machinery applies. approval-sip stays the source of truth for passwords —
// every successful login re-syncs the local hash and role.

const loginSchema = z.object({
  phoneNumber: z.string().trim().min(6).max(20),
  password: z.string().min(1),
});

type ExternalUser = {
  id: string;
  fullName: string;
  phoneNumber: string;
  userType: "EMPLOYEE" | "MANAGER" | "VALIDATOR";
  role: "ADMIN" | "STAFF" | "APPROVER" | "VIEWER";
};

// approval-sip role=ADMIN is its super admin; otherwise userType decides:
// MANAGER (pengurus) / VALIDATOR (verifikator) / EMPLOYEE (admin data entry).
function mapSipRole(user: ExternalUser): string {
  if (user.role === "ADMIN") return "super_admin";
  if (user.userType === "MANAGER") return "pengurus";
  if (user.userType === "VALIDATOR") return "verifikator";
  return "admin";
}

// Deterministic local identity for a bridged account. better-auth requires an email;
// approval-sip only has phone numbers.
function bridgeEmail(phoneNumber: string) {
  return `${phoneNumber.replace(/[^\d]/g, "")}@rekapdana.local`;
}

async function verifyAgainstApprovalSip(phoneNumber: string, password: string) {
  const response = await fetch(`${externalAuthConfig.url}/api/external/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": externalAuthConfig.apiKey ?? "",
    },
    body: JSON.stringify({ phoneNumber, password }),
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`approval-sip verify failed with status ${response.status}`);
  }
  const data = (await response.json()) as { user: ExternalUser };
  return data.user;
}

async function syncLocalUser(external: ExternalUser, password: string) {
  const email = bridgeEmail(external.phoneNumber);
  const role = mapSipRole(external);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const { user } = await auth.api.createUser({
      body: { email, name: external.fullName, password, role: role as "admin" },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: external.phoneNumber, role },
    });
    return email;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: { name: external.fullName, phone: external.phoneNumber, role },
  });

  // Keep the local credential in step with approval-sip so the better-auth sign-in
  // below succeeds even after a password change over there.
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  await ctx.internalAdapter.updatePassword(existing.id, hash);

  return email;
}

export const externalAuthRouter = new Hono<{ Variables: AuthVariables }>().post(
  "/login",
  zValidator("json", loginSchema),
  async (c) => {
    if (!externalAuthConfig.enabled) {
      return c.json(
        { error: "external_auth_disabled", message: "Login via akun SIP belum diaktifkan." },
        503,
      );
    }

    const { phoneNumber, password } = c.req.valid("json");
    let external: ExternalUser | null;
    try {
      external = await verifyAgainstApprovalSip(phoneNumber, password);
    } catch {
      return c.json(
        {
          error: "external_auth_unreachable",
          message: "Server akun SIP tidak bisa dihubungi. Coba lagi nanti.",
        },
        502,
      );
    }
    if (!external) {
      return c.json({ error: "invalid_credentials", message: "No. HP atau password salah." }, 401);
    }

    const email = await syncLocalUser(external, password);
    const { headers } = await auth.api.signInEmail({
      body: { email, password },
      returnHeaders: true,
    });

    for (const cookie of headers.getSetCookie()) {
      c.header("set-cookie", cookie, { append: true });
    }
    return c.json({ ok: true }, 200);
  },
);
