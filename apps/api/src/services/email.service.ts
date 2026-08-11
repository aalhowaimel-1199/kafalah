import nodemailer from "nodemailer";
import { prisma } from "@ramh/db";
import { settingsService } from "./settings.service";
import { barcodePng } from "../lib/barcode";

type Vars = Record<string, string>;

function render(tpl: string, vars: Vars): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

async function transport() {
  const s = await settingsService.getSmtp();
  if (!s.host) return null;
  return nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.port === 465 ? true : false,
    requireTLS: s.secure,
    auth: s.user ? { user: s.user, pass: s.pass } : undefined,
  });
}

async function log(to: string, subject: string, type: string, status: string, error?: string) {
  await prisma.emailLog.create({ data: { to, subject, type, status, error: error ?? null } });
}

export const emailService = {
  async send(opts: { to: string; type: string; vars: Vars; barcode?: string }) {
    const templates = await settingsService.getTemplates();
    const t = templates[opts.type];
    if (!t) return { ok: false, message: "no template" };
    const subject = render(t.subjectAr, opts.vars);
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;color:#1b2a3a;line-height:1.8">${render(
      t.bodyAr,
      opts.vars,
    ).replace(/\n/g, "<br/>")}${opts.barcode ? '<br/><br/><img src="cid:barcode" alt="barcode"/>' : ""}</div>`;

    const tx = await transport();
    if (!tx) {
      await log(opts.to, subject, opts.type, "skipped", "SMTP not configured");
      return { ok: false, message: "SMTP not configured" };
    }
    try {
      const s = await settingsService.getSmtp();
      const attachments = opts.barcode ? [{ filename: "barcode.png", content: await barcodePng(opts.barcode), cid: "barcode" }] : [];
      await tx.sendMail({ from: s.from || s.user, to: opts.to, subject, html, attachments });
      await log(opts.to, subject, opts.type, "sent");
      return { ok: true, message: "sent" };
    } catch (e) {
      await log(opts.to, subject, opts.type, "failed", (e as Error).message);
      return { ok: false, message: (e as Error).message };
    }
  },

  async test(to: string) {
    const tx = await transport();
    if (!tx) return { ok: false, message: "SMTP not configured" };
    try {
      const s = await settingsService.getSmtp();
      await tx.sendMail({ from: s.from || s.user, to, subject: "رسالة اختبار — نظام زيارة كفالة", text: "تم الإعداد بنجاح." });
      await log(to, "test", "TEST", "sent");
      return { ok: true, message: "sent" };
    } catch (e) {
      await log(to, "test", "TEST", "failed", (e as Error).message);
      return { ok: false, message: (e as Error).message };
    }
  },
};
