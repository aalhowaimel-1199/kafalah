import { Hono } from "hono";
import type { Context } from "hono";
import {
  approveVisitSchema,
  rejectVisitSchema,
  inviteVisitSchema,
  blacklistSchema,
  noteSchema,
  reasonSchema,
  gateSchema,
  userSchema,
  userUpdateSchema,
  smtpSchema,
  biotimeSchema,
  templatesSchema,
  pageSchema,
  departmentSchema,
  staffVisitSchema,
} from "@ramh/shared";
import { z } from "zod";
import { requireAuth, requireAdmin, requireCapability } from "../middleware/auth";
import { parseBody, isHttpError } from "../lib/validate";
import { visitService } from "../services/visit.service";
import { floorService } from "../services/floor.service";
import { blacklistService } from "../services/blacklist.service";
import { noteService } from "../services/note.service";
import { reasonService } from "../services/reason.service";
import { userService } from "../services/user.service";
import { movementService } from "../services/movement.service";
import { settingsService } from "../services/settings.service";
import { emailService } from "../services/email.service";
import { biotimeService } from "../services/biotime.service";
import { pageService } from "../services/page.service";
import { departmentService } from "../services/department.service";

export const adminRoutes = new Hono();
adminRoutes.use("*", requireAuth());

function fail(c: Context, e: unknown) {
  if (isHttpError(e)) return c.json(e.body, e.status as 400);
  return c.json({ error: (e as Error).message }, 400);
}

adminRoutes.get("/me", (c) => c.json(c.get("user")));

adminRoutes.get("/floors", async (c) => c.json(await floorService.listFloors()));
adminRoutes.get("/gates", async (c) => c.json(await floorService.listGates()));

adminRoutes.get("/visits", async (c) => c.json(await visitService.list(c.req.query("status") || undefined)));
adminRoutes.get("/visits/counts", async (c) => c.json(await visitService.counts()));

adminRoutes.post("/visits/:id/approve", requireCapability("canApprove"), async (c) => {
  try {
    const input = await parseBody(c, approveVisitSchema);
    const { visit, deviceResults } = await visitService.approve(c.req.param("id")!, input, c.get("user").id);
    return c.json({ visit, deviceResults });
  } catch (e) {
    return fail(c, e);
  }
});

adminRoutes.post("/visits/:id/reject", requireCapability("canApprove"), async (c) => {
  try {
    const { reason } = await parseBody(c, rejectVisitSchema);
    return c.json({ visit: await visitService.reject(c.req.param("id")!, reason) });
  } catch (e) {
    return fail(c, e);
  }
});

adminRoutes.post("/invitations", requireCapability("canInvite"), async (c) => {
  try {
    const input = await parseBody(c, inviteVisitSchema);
    const user = c.get("user");
    return c.json(await visitService.invite(input, { id: user.id, inviteAutoApprove: user.inviteAutoApprove }));
  } catch (e) {
    return fail(c, e);
  }
});

// تسجيل زيارة من داخل اللوحة (الأمن/الموظف). الاعتماد المباشر يتطلب canApprove.
adminRoutes.post("/visits/staff", async (c) => {
  try {
    const input = await parseBody(c, staffVisitSchema);
    const user = c.get("user");
    return c.json(await visitService.createByStaff(input, { id: user.id, canApprove: user.canApprove }));
  } catch (e) {
    if ((e as Error).message === "BLOCKED") return c.json({ error: "BLOCKED" }, 403);
    return fail(c, e);
  }
});

adminRoutes.get("/departments", async (c) => c.json(await departmentService.listAll()));
adminRoutes.post("/departments", requireCapability("canManageSettings"), async (c) => {
  try {
    return c.json(await departmentService.add(await parseBody(c, departmentSchema)));
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.patch("/departments/:id", requireCapability("canManageSettings"), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json(await departmentService.update(c.req.param("id")!, body));
});
adminRoutes.delete("/departments/:id", requireCapability("canManageSettings"), async (c) => c.json(await departmentService.remove(c.req.param("id")!)));

adminRoutes.get("/monitor/movements", async (c) => c.json(await movementService.recent()));
adminRoutes.get("/monitor/inside", async (c) => c.json(await movementService.insideNow()));
adminRoutes.get("/monitor/overstay", async (c) => c.json(await movementService.overstaying()));

adminRoutes.get("/blacklist", async (c) => c.json(await blacklistService.list()));
adminRoutes.post("/blacklist", async (c) => {
  try {
    const input = await parseBody(c, blacklistSchema);
    return c.json(await blacklistService.add(input, c.get("user").id));
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.delete("/blacklist/:id", async (c) => c.json(await blacklistService.remove(c.req.param("id"))));

adminRoutes.get("/notes", async (c) => {
  const key = c.req.query("visitorKey");
  return c.json(key ? await noteService.listByVisitor(key) : await noteService.recent());
});
adminRoutes.post("/notes", async (c) => {
  try {
    const input = await parseBody(c, noteSchema);
    return c.json(await noteService.add(input, c.get("user").id));
  } catch (e) {
    return fail(c, e);
  }
});

adminRoutes.get("/reasons", async (c) => c.json(await reasonService.listAll()));
adminRoutes.post("/reasons", async (c) => {
  try {
    return c.json(await reasonService.add(await parseBody(c, reasonSchema)));
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.patch("/reasons/:id", async (c) => {
  const body = z.object({ active: z.boolean() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "invalid" }, 400);
  return c.json(await reasonService.toggle(c.req.param("id"), body.data.active));
});

adminRoutes.post("/gates", requireCapability("canManageSettings"), async (c) => {
  try {
    return c.json(await floorService.createGate(await parseBody(c, gateSchema)));
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.delete("/gates/:id", requireCapability("canManageSettings"), async (c) => c.json(await floorService.deleteGate(c.req.param("id")!)));

adminRoutes.get("/users", requireAdmin(), async (c) => c.json(await userService.list()));
adminRoutes.post("/users", requireAdmin(), async (c) => {
  try {
    return c.json(await userService.create(await parseBody(c, userSchema)));
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.patch("/users/:id", requireAdmin(), async (c) => {
  try {
    return c.json(await userService.update(c.req.param("id")!, await parseBody(c, userUpdateSchema)));
  } catch (e) {
    return fail(c, e);
  }
});

adminRoutes.get("/pages", async (c) => c.json(await pageService.listAll()));
adminRoutes.post("/pages", requireCapability("canManageSettings"), async (c) => {
  try {
    return c.json(await pageService.create(await parseBody(c, pageSchema)));
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.patch("/pages/:id", requireCapability("canManageSettings"), async (c) => {
  try {
    return c.json(await pageService.update(c.req.param("id")!, await parseBody(c, pageSchema)));
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.delete("/pages/:id", requireCapability("canManageSettings"), async (c) => c.json(await pageService.remove(c.req.param("id")!)));

adminRoutes.get("/settings/smtp", requireCapability("canManageSettings"), async (c) => c.json(await settingsService.getSmtp()));
adminRoutes.put("/settings/smtp", requireCapability("canManageSettings"), async (c) => {
  try {
    const input = await parseBody(c, smtpSchema);
    await settingsService.setSmtp({ host: input.host || "", port: input.port, secure: input.secure, user: input.user || "", pass: input.pass || "", from: input.from || "" });
    return c.json({ ok: true });
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.post("/settings/smtp/test", requireCapability("canManageSettings"), async (c) => {
  const body = z.object({ to: z.string().email() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "أدخل بريداً صحيحاً" }, 400);
  return c.json(await emailService.test(body.data.to));
});

adminRoutes.get("/settings/biotime", requireCapability("canManageSettings"), async (c) => c.json(await settingsService.getBiotime()));
adminRoutes.put("/settings/biotime", requireCapability("canManageSettings"), async (c) => {
  try {
    const input = await parseBody(c, biotimeSchema);
    await settingsService.setBiotime({ baseUrl: input.baseUrl || "", username: input.username || "", password: input.password || "", simulation: input.simulation });
    return c.json({ ok: true });
  } catch (e) {
    return fail(c, e);
  }
});
adminRoutes.get("/settings/biotime/status", requireCapability("canManageSettings"), async (c) => c.json(await biotimeService.status()));

adminRoutes.get("/settings/templates", requireCapability("canManageSettings"), async (c) => c.json(await settingsService.getTemplates()));
adminRoutes.put("/settings/templates", requireCapability("canManageSettings"), async (c) => {
  try {
    const input = await parseBody(c, templatesSchema);
    await settingsService.setTemplates(input);
    return c.json({ ok: true });
  } catch (e) {
    return fail(c, e);
  }
});
