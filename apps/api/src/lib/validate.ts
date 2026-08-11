import type { Context } from "hono";
import type { ZodSchema } from "zod";

export async function parseBody<T>(c: Context, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw { status: 400 as const, body: { error: "صيغة الطلب غير صحيحة" } };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw { status: 400 as const, body: { error: "تحقق من البيانات", issues: result.error.flatten().fieldErrors } };
  }
  return result.data;
}

export function isHttpError(e: unknown): e is { status: number; body: unknown } {
  return typeof e === "object" && e !== null && "status" in e && "body" in e;
}
