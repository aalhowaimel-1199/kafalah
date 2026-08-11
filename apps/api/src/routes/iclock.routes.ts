import { Hono } from "hono";
import { prisma } from "@ramh/db";
import { z } from "zod";
import { ingestMovement } from "../services/ingest";

export const iclockRoutes = new Hono();

const pushSchema = z.object({
  card: z.string().trim().min(1),
  doorId: z.string().trim().optional(),
  direction: z.enum(["IN", "OUT"]).optional(),
  at: z.string().datetime().optional(),
});

iclockRoutes.post("/push", async (c) => {
  const parsed = pushSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "invalid" }, 400);
  const { card, doorId, direction, at } = parsed.data;
  const visit = await prisma.visitRequest.findFirst({ where: { OR: [{ barcode: card }, { cardNumber: card }] } });
  if (!visit) return c.json({ error: "unknown_card" }, 404);
  const movement = await ingestMovement({ visitId: visit.id, doorId, direction, at: at ? new Date(at) : undefined });
  return c.json({ ok: true, direction: movement.direction });
});
