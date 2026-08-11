import { Hono } from "hono";
import { createVisitSchema, trackVisitSchema } from "@ramh/shared";
import { visitService } from "../services/visit.service";
import { reasonService } from "../services/reason.service";
import { parseBody, isHttpError } from "../lib/validate";

export const visitsRoutes = new Hono();

visitsRoutes.get("/reasons", async (c) => c.json(await reasonService.listActive()));

visitsRoutes.post("/", async (c) => {
  try {
    const input = await parseBody(c, createVisitSchema);
    const visit = await visitService.create(input);
    return c.json({ requestNo: visit.requestNo, id: visit.id, status: visit.status }, 201);
  } catch (e) {
    if (isHttpError(e)) return c.json(e.body, e.status as 400);
    if ((e as Error).message === "BLOCKED") return c.json({ error: "BLOCKED" }, 403);
    return c.json({ error: (e as Error).message }, 500);
  }
});

visitsRoutes.post("/track", async (c) => {
  try {
    const { requestNo, phone } = await parseBody(c, trackVisitSchema);
    const visit = await visitService.track(requestNo, phone);
    if (!visit) return c.json({ error: "not_found" }, 404);
    return c.json({
      requestNo: visit.requestNo,
      visitorName: visit.visitorName,
      status: visit.status,
      rejectReason: visit.rejectReason,
      entryFrom: visit.entryFrom,
      entryTo: visit.entryTo,
      barcode: visit.status === "APPROVED" ? visit.barcode : null,
      floors: visit.floors.map((f) => ({ key: f.key, nameAr: f.nameAr, nameEn: f.nameEn })),
    });
  } catch (e) {
    if (isHttpError(e)) return c.json(e.body, e.status as 400);
    return c.json({ error: (e as Error).message }, 500);
  }
});
