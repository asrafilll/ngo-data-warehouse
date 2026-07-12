import type { Context, Next } from "hono";
import { auth, type AuthSession, type AuthUser } from "./auth";

export type AuthVariables = {
  session: AuthSession | null;
  user: AuthUser | null;
};

export async function loadAuthSession(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("session", session?.session ?? null);
  c.set("user", session?.user ?? null);

  await next();
}

export function requireAdmin(c: Context<{ Variables: AuthVariables }>) {
  return requireRole(c, ["admin"]);
}

// Only super_admin passes (requireRole grants super_admin every role).
export function requireSuperAdmin(c: Context<{ Variables: AuthVariables }>) {
  return requireRole(c, []);
}

// SIP roles: super_admin | admin | pengurus | verifikator. super_admin passes every
// guard. `role` is better-auth's comma-separated string.
export function requireRole(c: Context<{ Variables: AuthVariables }>, roles: string[]) {
  const user = c.get("user");
  const userRoles = user?.role?.split(",") ?? [];

  if (
    !user ||
    (!userRoles.includes("super_admin") && !roles.some((role) => userRoles.includes(role)))
  ) {
    return null;
  }

  return user;
}

export function requireUser(c: Context<{ Variables: AuthVariables }>) {
  return c.get("user");
}
