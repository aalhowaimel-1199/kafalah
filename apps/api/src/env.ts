import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(10),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:8787"),
  API_PORT: z.coerce.number().default(8787),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  ADMIN_ORIGIN: z.string().url().default("http://localhost:5174"),
  PUBLIC_WEB_URL: z.string().url().default("http://localhost:5173"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@kafalah.sa"),
  SEED_ADMIN_PASSWORD: z.string().min(6).default("Kafalah@2026"),
  EXTRA_ORIGINS: z.string().default(""),
});

export const env = envSchema.parse(process.env);

const extra = env.EXTRA_ORIGINS.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const allowedOrigins = [...new Set([env.WEB_ORIGIN, env.ADMIN_ORIGIN, ...extra])];
