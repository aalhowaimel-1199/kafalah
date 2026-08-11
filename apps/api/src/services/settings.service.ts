import { prisma } from "@ramh/db";

export type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string; from: string };
export type BiotimeConfig = { baseUrl: string; username: string; password: string; simulation: boolean };
export type TemplateEntry = { subjectAr: string; bodyAr: string };
export type Templates = Record<string, TemplateEntry>;

const DEFAULT_SMTP: SmtpConfig = { host: "", port: 587, secure: true, user: "", pass: "", from: "" };
const DEFAULT_BIOTIME: BiotimeConfig = { baseUrl: "", username: "", password: "", simulation: true };
const DEFAULT_TEMPLATES: Templates = {
  REQUEST_RECEIVED: { subjectAr: "تم استلام طلب زيارتك — كفالة", bodyAr: "مرحباً {visitorName}،\nتم استلام طلبك رقم {requestNo}." },
  APPROVED: { subjectAr: "تمت الموافقة على زيارتك — كفالة", bodyAr: "مرحباً {visitorName}،\nتمت الموافقة. الرمز: {barcode}" },
  INVITATION: { subjectAr: "دعوة زيارة — كفالة", bodyAr: "مرحباً {visitorName}،\nأنت مدعو. الرمز: {barcode}" },
};

async function get<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row ? ({ ...fallback, ...(row.value as object) } as T) : fallback;
}

async function set(key: string, value: object) {
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export const settingsService = {
  getSmtp: () => get<SmtpConfig>("smtp", DEFAULT_SMTP),
  setSmtp: (v: SmtpConfig) => set("smtp", v),
  getBiotime: () => get<BiotimeConfig>("biotime", DEFAULT_BIOTIME),
  setBiotime: (v: BiotimeConfig) => set("biotime", v),
  getTemplates: () => get<Templates>("templates", DEFAULT_TEMPLATES),
  setTemplates: (v: Templates) => set("templates", v),
};
