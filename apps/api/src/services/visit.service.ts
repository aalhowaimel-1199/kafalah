import { prisma } from "@ramh/db";
import type { CreateVisitInput, ApproveVisitInput, InviteVisitInput, StaffVisitInput } from "@ramh/shared";
import { env } from "../env";
import { generateRequestNo, generateCardNumber } from "../lib/ids";
import { floorService } from "./floor.service";
import { biotimeService, type BioGate } from "./biotime.service";
import { blacklistService } from "./blacklist.service";
import { emailService } from "./email.service";

function fmtWindow(from: Date | null, to: Date | null): string {
  if (!from || !to) return "—";
  const f = (d: Date) => d.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
  return `${f(from)} — ${f(to)}`;
}

async function issueAndEnroll(visitId: string, opts: ApproveVisitInput, approverId: string | null) {
  const visit = await prisma.visitRequest.findUnique({ where: { id: visitId } });
  if (!visit) throw new Error("الطلب غير موجود");

  const { floors, gates } = await floorService.resolve({ floorKeys: opts.floorKeys, gateCodes: opts.gateCodes });
  if (!floors.length && !gates.length) throw new Error("لا توجد أدوار أو بوابات صالحة");

  const cardNumber = generateCardNumber();
  const barcode = cardNumber;
  const bioGates: BioGate[] = gates.map((g) => ({ code: g.code, nameAr: g.nameAr, biotimeDoorId: g.biotimeDoorId, isExit: g.isExit }));

  const deviceResults = await biotimeService.enroll({
    cardNumber,
    barcode,
    visitorName: visit.visitorName,
    floorKeys: floors.map((f) => f.key),
    gates: bioGates,
    entryFrom: new Date(opts.entryFrom),
    entryTo: new Date(opts.entryTo),
  });

  const updated = await prisma.visitRequest.update({
    where: { id: visitId },
    data: {
      status: "APPROVED",
      entryFrom: new Date(opts.entryFrom),
      entryTo: new Date(opts.entryTo),
      cardNumber,
      barcode,
      approvedById: approverId,
      deviceLog: deviceResults,
      floors: { set: floors.map((f) => ({ key: f.key })) },
      gates: { set: gates.map((g) => ({ id: g.id })) },
    },
    include: { floors: true, gates: true },
  });

  return { visit: updated, deviceResults, floors, barcode };
}

export const visitService = {
  async create(input: CreateVisitInput) {
    const blocked = await blacklistService.isBlocked([input.nationalId, input.phone, input.email]);
    if (blocked) throw new Error("BLOCKED");

    const requestNo = generateRequestNo();
    const visit = await prisma.visitRequest.create({
      data: {
        requestNo,
        source: "PUBLIC",
        visitorName: input.visitorName,
        phone: input.phone,
        email: input.email,
        nationalId: input.nationalId || null,
        company: input.company || null,
        hostName: input.hostName || null,
        hostDept: input.hostDept || null,
        reasonId: input.reasonId || null,
        reasonText: input.reasonText || null,
        note: input.note || null,
        visitDate: input.visitDate ? new Date(input.visitDate) : null,
      },
    });

    await emailService.send({
      to: visit.email,
      type: "REQUEST_RECEIVED",
      vars: { visitorName: visit.visitorName, requestNo: visit.requestNo, trackUrl: `${env.PUBLIC_WEB_URL}/track` },
    });
    return visit;
  },

  async createByStaff(input: StaffVisitInput, user: { id: string; canApprove: boolean }) {
    const blocked = await blacklistService.isBlocked([input.nationalId || "", input.phone, input.email || ""]);
    if (blocked) throw new Error("BLOCKED");

    const requestNo = generateRequestNo();
    const visit = await prisma.visitRequest.create({
      data: {
        requestNo,
        source: "STAFF",
        visitorName: input.visitorName,
        phone: input.phone,
        email: input.email || "",
        nationalId: input.nationalId || null,
        company: input.company || null,
        hostName: input.hostName || null,
        departmentId: input.departmentId,
        approvalNo: input.approvalNo || null,
        reasonId: input.reasonId || null,
        reasonText: input.reasonText || null,
        note: input.note || null,
        createdById: user.id,
      },
    });

    // اعتماد مباشر (الأمن/من يملك صلاحية الاعتماد) مع إصدار الباركود فوراً
    if (input.approveNow && user.canApprove && input.entryFrom && input.entryTo) {
      const result = await issueAndEnroll(
        visit.id,
        { floorKeys: input.floorKeys, gateCodes: input.gateCodes, entryFrom: input.entryFrom, entryTo: input.entryTo },
        user.id,
      );
      if (visit.email) {
        await emailService.send({
          to: visit.email,
          type: "APPROVED",
          vars: {
            visitorName: visit.visitorName,
            requestNo: visit.requestNo,
            floors: result.floors.map((f) => f.nameAr).join("، "),
            entryWindow: fmtWindow(result.visit.entryFrom, result.visit.entryTo),
            barcode: result.barcode,
          },
          barcode: result.barcode,
        });
      }
      return { visit: result.visit, barcode: result.barcode, autoApproved: true };
    }
    return { visit, barcode: null, autoApproved: false };
  },

  async track(requestNo: string, phone: string) {
    const visit = await prisma.visitRequest.findUnique({
      where: { requestNo },
      include: { floors: { orderBy: { sortOrder: "asc" } } },
    });
    if (!visit || visit.phone !== phone) return null;
    return visit;
  },

  list: (status?: string) =>
    prisma.visitRequest.findMany({
      where: status ? { status: status as never } : undefined,
      include: { floors: { orderBy: { sortOrder: "asc" } }, reason: true, approvedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),

  async counts() {
    const rows = await prisma.visitRequest.groupBy({ by: ["status"], _count: true });
    const out: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, EXPIRED: 0, CANCELLED: 0, TOTAL: 0 };
    for (const r of rows) {
      const n = r._count as unknown as number;
      out[r.status] = n;
      out.TOTAL = (out.TOTAL ?? 0) + n;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    out.TODAY = await prisma.visitRequest.count({ where: { createdAt: { gte: start } } });
    return out;
  },

  async approve(id: string, input: ApproveVisitInput, approverId: string) {
    const result = await issueAndEnroll(id, input, approverId);
    await emailService.send({
      to: result.visit.email,
      type: "APPROVED",
      vars: {
        visitorName: result.visit.visitorName,
        requestNo: result.visit.requestNo,
        floors: result.floors.map((f) => f.nameAr).join("، "),
        entryWindow: fmtWindow(result.visit.entryFrom, result.visit.entryTo),
        barcode: result.barcode,
      },
      barcode: result.barcode,
    });
    return result;
  },

  async reject(id: string, reason: string) {
    return prisma.visitRequest.update({ where: { id }, data: { status: "REJECTED", rejectReason: reason } });
  },

  async invite(input: InviteVisitInput, user: { id: string; inviteAutoApprove: boolean }) {
    const requestNo = generateRequestNo();
    const visit = await prisma.visitRequest.create({
      data: {
        requestNo,
        source: "INVITATION",
        visitorName: input.visitorName,
        email: input.email,
        phone: input.phone,
        company: input.company || null,
        hostName: input.hostName || null,
        reasonText: input.reasonText || null,
        createdById: user.id,
      },
    });

    if (user.inviteAutoApprove) {
      const result = await issueAndEnroll(
        visit.id,
        { floorKeys: input.floorKeys, gateCodes: input.gateCodes, entryFrom: input.entryFrom, entryTo: input.entryTo },
        user.id,
      );
      await emailService.send({
        to: visit.email,
        type: "INVITATION",
        vars: {
          visitorName: visit.visitorName,
          requestNo: visit.requestNo,
          floors: result.floors.map((f) => f.nameAr).join("، "),
          entryWindow: fmtWindow(result.visit.entryFrom, result.visit.entryTo),
          barcode: result.barcode,
        },
        barcode: result.barcode,
      });
      return { visit: result.visit, autoApproved: true };
    }

    await emailService.send({
      to: visit.email,
      type: "REQUEST_RECEIVED",
      vars: { visitorName: visit.visitorName, requestNo: visit.requestNo, trackUrl: `${env.PUBLIC_WEB_URL}/track` },
    });
    return { visit, autoApproved: false };
  },

  async sweepExpired() {
    const now = new Date();
    const expired = await prisma.visitRequest.findMany({ where: { status: "APPROVED", entryTo: { lt: now } } });
    let count = 0;
    for (const v of expired) {
      const stillInside = await prisma.accessMovement.findFirst({ where: { visitId: v.id }, orderBy: { at: "desc" } });
      if (stillInside?.direction === "IN") continue;
      if (v.cardNumber) await biotimeService.revoke(v.cardNumber);
      await prisma.visitRequest.update({ where: { id: v.id }, data: { status: "EXPIRED" } });
      count++;
    }
    return count;
  },
};
