import { z } from "zod";

export const VisitStatus = z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED"]);
export type VisitStatus = z.infer<typeof VisitStatus>;

export const VisitSource = z.enum(["PUBLIC", "INVITATION"]);
export type VisitSource = z.infer<typeof VisitSource>;

export const Role = z.enum(["ADMIN", "APPROVER", "RECEPTION", "SECURITY", "EMPLOYEE"]);
export type Role = z.infer<typeof Role>;

export const MovementDirection = z.enum(["IN", "OUT"]);
export type MovementDirection = z.infer<typeof MovementDirection>;

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?966|0)?5\d{8}$/, { message: "رقم جوال غير صحيح" });

const optionalStr = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const createVisitSchema = z.object({
  visitorName: z.string().trim().min(3, "الاسم مطلوب").max(120),
  phone: phoneSchema,
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "رقم الهوية/الإقامة 10 أرقام")
    .optional()
    .or(z.literal("")),
  company: optionalStr(160),
  hostName: optionalStr(120),
  hostDept: optionalStr(120),
  reasonId: optionalStr(40),
  reasonText: optionalStr(200),
  note: optionalStr(500),
  visitDate: z.string().datetime().optional().or(z.literal("")),
});
export type CreateVisitInput = z.infer<typeof createVisitSchema>;

export const trackVisitSchema = z.object({
  requestNo: z.string().trim().min(4),
  phone: phoneSchema,
});
export type TrackVisitInput = z.infer<typeof trackVisitSchema>;

const accessAndWindow = {
  floorKeys: z.array(z.string().trim()).optional(),
  gateCodes: z.array(z.string().trim()).optional(),
  entryFrom: z.string().datetime({ message: "وقت بداية غير صحيح" }),
  entryTo: z.string().datetime({ message: "وقت نهاية غير صحيح" }),
};

const refineAccess = (d: { floorKeys?: string[]; gateCodes?: string[] }) =>
  (d.floorKeys && d.floorKeys.length > 0) || (d.gateCodes && d.gateCodes.length > 0);
const refineWindow = (d: { entryFrom: string; entryTo: string }) => new Date(d.entryTo) > new Date(d.entryFrom);

export const approveVisitSchema = z
  .object(accessAndWindow)
  .refine(refineAccess, { message: "حدّد دوراً أو بوابة واحدة على الأقل", path: ["floorKeys"] })
  .refine(refineWindow, { message: "وقت النهاية يجب أن يكون بعد البداية", path: ["entryTo"] });
export type ApproveVisitInput = z.infer<typeof approveVisitSchema>;

export const rejectVisitSchema = z.object({
  reason: z.string().trim().min(3, "سبب الرفض مطلوب").max(300),
});
export type RejectVisitInput = z.infer<typeof rejectVisitSchema>;

export const inviteVisitSchema = z
  .object({
    visitorName: z.string().trim().min(3, "الاسم مطلوب").max(120),
    email: z.string().trim().email("بريد إلكتروني غير صحيح"),
    phone: phoneSchema,
    company: optionalStr(160),
    hostName: optionalStr(120),
    reasonText: optionalStr(200),
    ...accessAndWindow,
  })
  .refine(refineAccess, { message: "حدّد دوراً أو بوابة واحدة على الأقل", path: ["floorKeys"] })
  .refine(refineWindow, { message: "وقت النهاية يجب أن يكون بعد البداية", path: ["entryTo"] });
export type InviteVisitInput = z.infer<typeof inviteVisitSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("بريد غير صحيح"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const blacklistSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  identifier: z.string().trim().min(3, "الهوية أو الجوال مطلوب").max(40),
  reason: optionalStr(200),
});
export type BlacklistInput = z.infer<typeof blacklistSchema>;

export const noteSchema = z.object({
  visitorKey: z.string().trim().min(3).max(40),
  body: z.string().trim().min(2, "الملاحظة مطلوبة").max(500),
});
export type NoteInput = z.infer<typeof noteSchema>;

export const reasonSchema = z.object({
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  active: z.boolean().optional(),
});
export type ReasonInput = z.infer<typeof reasonSchema>;

export const gateSchema = z.object({
  code: z.string().trim().min(1).max(20),
  nameAr: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80).optional().or(z.literal("")),
  floorKey: z.string().trim().min(1).max(10),
  isExit: z.boolean().optional(),
  biotimeDoorId: optionalStr(40),
});
export type GateInput = z.infer<typeof gateSchema>;

export const userSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  email: z.string().trim().email("بريد غير صحيح"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
  role: Role,
  canApprove: z.boolean().optional(),
  canInvite: z.boolean().optional(),
  inviteAutoApprove: z.boolean().optional(),
  canManageSettings: z.boolean().optional(),
});
export type UserInput = z.infer<typeof userSchema>;

export const userUpdateSchema = z.object({
  role: Role.optional(),
  active: z.boolean().optional(),
  canApprove: z.boolean().optional(),
  canInvite: z.boolean().optional(),
  inviteAutoApprove: z.boolean().optional(),
  canManageSettings: z.boolean().optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const smtpSchema = z.object({
  host: z.string().trim().max(160).optional().or(z.literal("")),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: optionalStr(160),
  pass: optionalStr(200),
  from: optionalStr(200),
});
export type SmtpInput = z.infer<typeof smtpSchema>;

export const biotimeSchema = z.object({
  baseUrl: z.string().trim().max(200).optional().or(z.literal("")),
  username: optionalStr(80),
  password: optionalStr(200),
  simulation: z.boolean(),
});
export type BiotimeInput = z.infer<typeof biotimeSchema>;

export const templatesSchema = z.record(
  z.object({ subjectAr: z.string().trim().max(160), bodyAr: z.string().trim().max(4000) }),
);
export type TemplatesInput = z.infer<typeof templatesSchema>;

export const departmentSchema = z.object({
  nameAr: z.string().trim().min(2, "اسم القسم بالعربية مطلوب").max(120),
  nameEn: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  active: z.boolean().optional(),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

// تسجيل زيارة من داخل اللوحة (الأمن/الموظف). الأمن قد يعتمد مباشرة (approveNow + الأدوار + الوقت).
export const staffVisitSchema = z
  .object({
    visitorName: z.string().trim().min(3, "اسم الزائر مطلوب").max(120),
    phone: phoneSchema,
    email: z.string().trim().email("بريد غير صحيح").optional().or(z.literal("")),
    nationalId: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "رقم الهوية/الإقامة 10 أرقام")
      .optional()
      .or(z.literal("")),
    departmentId: z.string().trim().min(1, "القسم مطلوب"),
    reasonId: optionalStr(40),
    reasonText: optionalStr(200),
    approvalNo: optionalStr(60),
    hostName: optionalStr(120),
    company: optionalStr(160),
    note: optionalStr(500),
    approveNow: z.boolean().optional(),
    floorKeys: z.array(z.string().trim()).optional(),
    gateCodes: z.array(z.string().trim()).optional(),
    entryFrom: z.string().datetime().optional().or(z.literal("")),
    entryTo: z.string().datetime().optional().or(z.literal("")),
  })
  .refine(
    (d) => !d.approveNow || (((d.floorKeys && d.floorKeys.length) || (d.gateCodes && d.gateCodes.length)) && d.entryFrom && d.entryTo),
    { message: "للاعتماد المباشر حدّد الأدوار ووقت الدخول", path: ["floorKeys"] },
  );
export type StaffVisitInput = z.infer<typeof staffVisitSchema>;

export const pageSchema = z.object({
  titleAr: z.string().trim().min(2, "العنوان بالعربية مطلوب").max(160),
  titleEn: z.string().trim().min(2, "العنوان بالإنجليزية مطلوب").max(160),
  contentAr: z.string().trim().max(20000).optional().or(z.literal("")),
  contentEn: z.string().trim().max(20000).optional().or(z.literal("")),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});
export type PageInput = z.infer<typeof pageSchema>;
