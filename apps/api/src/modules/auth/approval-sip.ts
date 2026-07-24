import { randomBytes, timingSafeEqual } from "node:crypto";
import { externalAuthConfig, userSyncConfig } from "@repo/config";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { auth } from "./auth";

const approvalSipUserSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().trim().min(1).max(150),
  phoneNumber: z.string().trim().min(6).max(30),
  userType: z.enum(["EMPLOYEE", "MANAGER", "VALIDATOR"]),
  role: z.enum(["ADMIN", "STAFF", "APPROVER", "VIEWER"]),
});

const approvalSipUsersResponseSchema = z.object({
  users: z.array(approvalSipUserSchema),
});

const approvalSipUserResponseSchema = z.object({
  user: approvalSipUserSchema,
});

export type ApprovalSipUser = z.infer<typeof approvalSipUserSchema>;

export type ApprovalSipSyncResult = {
  source: "approval-sip";
  fetched: number;
  created: number;
  updated: number;
  deactivated: number;
  syncedAt: string;
};

export class ApprovalSipError extends Error {
  constructor(
    public code:
      | "not_configured"
      | "unreachable"
      | "upstream_rejected"
      | "upstream_failed"
      | "invalid_response"
      | "invalid_credentials",
    message: string,
  ) {
    super(message);
    this.name = "ApprovalSipError";
  }
}

export function mapApprovalSipRole(user: ApprovalSipUser) {
  if (user.role === "ADMIN") return "super_admin";
  if (user.userType === "MANAGER") return "pengurus";
  if (user.userType === "VALIDATOR") return "verifikator";
  return "admin";
}

export function approvalSipBridgeEmail(phoneNumber: string) {
  return `${phoneNumber.replace(/[^\d]/g, "")}@rekapdana.local`;
}

export function parseApprovalSipUsers(payload: unknown) {
  const parsed = approvalSipUsersResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.users.length === 0) {
    throw new ApprovalSipError(
      "invalid_response",
      "Direktori pengguna SIP Approval kosong atau tidak valid.",
    );
  }

  const bridgeEmails = parsed.data.users.map((user) => approvalSipBridgeEmail(user.phoneNumber));
  if (new Set(bridgeEmails).size !== bridgeEmails.length) {
    throw new ApprovalSipError(
      "invalid_response",
      "Direktori pengguna SIP Approval memiliki nomor telepon duplikat.",
    );
  }

  return parsed.data.users;
}

async function requestApprovalSip(path: string, init?: RequestInit) {
  if (!externalAuthConfig.enabled || !externalAuthConfig.url || !externalAuthConfig.apiKey) {
    throw new ApprovalSipError("not_configured", "Integrasi SIP Approval belum dikonfigurasi.");
  }

  let response: Response;
  try {
    response = await fetch(new URL(path, externalAuthConfig.url), {
      ...init,
      headers: {
        ...init?.headers,
        "x-api-key": externalAuthConfig.apiKey,
      },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApprovalSipError("unreachable", "Server SIP Approval tidak dapat dihubungi.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApprovalSipError("upstream_rejected", "SIP Approval menolak kredensial integrasi.");
  }
  if (!response.ok) {
    throw new ApprovalSipError(
      "upstream_failed",
      `SIP Approval gagal merespons (${response.status}).`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new ApprovalSipError("invalid_response", "Respons SIP Approval tidak valid.");
  }
}

export async function verifyApprovalSipCredentials(phoneNumber: string, password: string) {
  let payload: unknown;
  try {
    payload = await requestApprovalSip("/api/external/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
    });
  } catch (error) {
    if (error instanceof ApprovalSipError && error.code === "upstream_rejected") {
      return null;
    }
    throw error;
  }

  const parsed = approvalSipUserResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApprovalSipError("invalid_response", "Respons SIP Approval tidak valid.");
  }
  return parsed.data.user;
}

export async function syncApprovalSipLoginUser(external: ApprovalSipUser, password: string) {
  const email = approvalSipBridgeEmail(external.phoneNumber);
  const role = mapApprovalSipRole(external);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const { user } = await auth.api.createUser({
      body: { email, name: external.fullName, password, role: role as "admin" },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        active: true,
        banned: false,
        banExpires: null,
        banReason: null,
        emailVerified: true,
        phone: external.phoneNumber,
        role,
      },
    });
    return email;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      active: true,
      banned: false,
      banExpires: null,
      banReason: null,
      emailVerified: true,
      name: external.fullName,
      phone: external.phoneNumber,
      role,
    },
  });

  const context = await auth.$context;
  const hash = await context.password.hash(password);
  await context.internalAdapter.updatePassword(existing.id, hash);

  return email;
}

export async function fetchApprovalSipUsers() {
  return parseApprovalSipUsers(await requestApprovalSip("/api/external/users"));
}

let activeSync: Promise<ApprovalSipSyncResult> | null = null;

export function syncApprovalSipUsers() {
  activeSync ??= performApprovalSipUserSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

async function performApprovalSipUserSync(): Promise<ApprovalSipSyncResult> {
  const users = await fetchApprovalSipUsers();
  const bridgeEmails = users.map((user) => approvalSipBridgeEmail(user.phoneNumber));
  let created = 0;
  let updated = 0;

  for (const external of users) {
    const email = approvalSipBridgeEmail(external.phoneNumber);
    const role = mapApprovalSipRole(external);
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          active: true,
          banned: false,
          banExpires: null,
          banReason: null,
          emailVerified: true,
          name: external.fullName,
          phone: external.phoneNumber,
          role,
        },
      });
      updated += 1;
      continue;
    }

    const { user } = await auth.api.createUser({
      body: {
        email,
        name: external.fullName,
        password: randomBytes(32).toString("base64url"),
        role: role as "admin",
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        active: true,
        banned: false,
        banExpires: null,
        banReason: null,
        emailVerified: true,
        phone: external.phoneNumber,
        role,
      },
    });
    created += 1;
  }

  const staleUsers = await prisma.user.findMany({
    where: {
      active: true,
      email: {
        endsWith: "@rekapdana.local",
        notIn: bridgeEmails,
      },
    },
    select: { id: true },
  });
  const staleUserIds = staleUsers.map((user) => user.id);

  if (staleUserIds.length > 0) {
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: { in: staleUserIds } } }),
      prisma.user.updateMany({
        where: { id: { in: staleUserIds } },
        data: {
          active: false,
          banned: true,
          banExpires: null,
          banReason: "Akun tidak lagi tersedia di SIP Approval.",
        },
      }),
    ]);
  }

  return {
    source: "approval-sip",
    fetched: users.length,
    created,
    updated,
    deactivated: staleUserIds.length,
    syncedAt: new Date().toISOString(),
  };
}

export function hasValidUserSyncApiKey(provided: string | undefined) {
  if (!provided || !userSyncConfig.apiKey) return false;

  const expectedBuffer = Buffer.from(userSyncConfig.apiKey);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
