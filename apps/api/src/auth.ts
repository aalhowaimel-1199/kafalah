import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@ramh/db";
import { env, allowedOrigins } from "./env";

const flag = { type: "boolean" as const, required: false, defaultValue: false, input: false };

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true, disableSignUp: false },
  trustedOrigins: allowedOrigins,
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "RECEPTION", input: false },
      canApprove: flag,
      canInvite: flag,
      inviteAutoApprove: flag,
      canManageSettings: flag,
      active: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  advanced: { defaultCookieAttributes: { sameSite: "lax" } },
});

export type AuthSession = typeof auth.$Infer.Session;
