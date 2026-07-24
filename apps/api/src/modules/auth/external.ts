import { zValidator } from "@hono/zod-validator";
import { externalAuthConfig } from "@repo/config";
import { Hono } from "hono";
import { z } from "zod";
import { auth } from "./auth";
import {
  ApprovalSipError,
  syncApprovalSipLoginUser,
  type ApprovalSipUser,
  verifyApprovalSipCredentials,
} from "./approval-sip";
import type { AuthVariables } from "./middleware";

// Single-account login: credentials are verified against approval-sip
// (sip.rekapdana.com), then mirrored into a local better-auth user so the normal
// session machinery applies. approval-sip stays the source of truth for passwords —
// every successful login re-syncs the local hash and role.

const loginSchema = z.object({
  phoneNumber: z.string().trim().min(6).max(20),
  password: z.string().min(1),
});

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
    let external: ApprovalSipUser | null;
    try {
      external = await verifyApprovalSipCredentials(phoneNumber, password);
    } catch (error) {
      return c.json(
        {
          error: error instanceof ApprovalSipError ? error.code : "external_auth_unreachable",
          message:
            error instanceof ApprovalSipError
              ? error.message
              : "Server akun SIP tidak bisa dihubungi. Coba lagi nanti.",
        },
        502,
      );
    }
    if (!external) {
      return c.json({ error: "invalid_credentials", message: "No. HP atau password salah." }, 401);
    }

    const email = await syncApprovalSipLoginUser(external, password);
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
