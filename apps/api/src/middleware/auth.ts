import type { Context, Next } from "hono";
import type { Role } from "@ramh/shared";
import { auth } from "../auth";

export type Capability = "canApprove" | "canInvite" | "canManageSettings";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  canApprove: boolean;
  canInvite: boolean;
  inviteAutoApprove: boolean;
  canManageSettings: boolean;
  active: boolean;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AppUser;
  }
}

async function resolveUser(c: Context): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return null;
  const u = session.user as Record<string, unknown>;
  const isAdmin = (u.role ?? "RECEPTION") === "ADMIN";
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (u.role ?? "RECEPTION") as Role,
    canApprove: isAdmin || Boolean(u.canApprove),
    canInvite: isAdmin || Boolean(u.canInvite),
    inviteAutoApprove: isAdmin || Boolean(u.inviteAutoApprove),
    canManageSettings: isAdmin || Boolean(u.canManageSettings),
    active: u.active !== false,
  };
}

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const user = await resolveUser(c);
    if (!user || !user.active) return c.json({ error: "Unauthorized" }, 401);
    c.set("user", user);
    await next();
  };
}

export function requireAdmin() {
  return async (c: Context, next: Next) => {
    const user = await resolveUser(c);
    if (!user || !user.active) return c.json({ error: "Unauthorized" }, 401);
    if (user.role !== "ADMIN") return c.json({ error: "Forbidden" }, 403);
    c.set("user", user);
    await next();
  };
}

export function requireCapability(cap: Capability) {
  return async (c: Context, next: Next) => {
    const user = await resolveUser(c);
    if (!user || !user.active) return c.json({ error: "Unauthorized" }, 401);
    if (!user[cap]) return c.json({ error: "Forbidden" }, 403);
    c.set("user", user);
    await next();
  };
}
