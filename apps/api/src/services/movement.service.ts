import { prisma } from "@ramh/db";

export const movementService = {
  recent: () =>
    prisma.accessMovement.findMany({
      orderBy: { at: "desc" },
      take: 100,
      include: { visit: { select: { visitorName: true, requestNo: true } }, gate: { select: { nameAr: true, nameEn: true, floorKey: true } } },
    }),

  async insideNow() {
    const visits = await prisma.visitRequest.findMany({
      where: { status: "APPROVED" },
      include: { movements: { orderBy: { at: "desc" }, take: 1 } },
    });
    return visits
      .filter((v) => v.movements[0]?.direction === "IN")
      .map((v) => ({ id: v.id, visitorName: v.visitorName, since: v.movements[0]!.at }));
  },

  async overstaying() {
    const now = new Date();
    const visits = await prisma.visitRequest.findMany({
      where: { status: "APPROVED", entryTo: { lt: now } },
      include: { movements: { orderBy: { at: "desc" }, take: 1 } },
    });
    return visits
      .filter((v) => v.movements[0]?.direction === "IN")
      .map((v) => ({ id: v.id, visitorName: v.visitorName, entryTo: v.entryTo, phone: v.phone }));
  },

  record: (data: { visitId: string; gateId?: string | null; floorKey?: string | null; direction: "IN" | "OUT"; source?: string }) =>
    prisma.accessMovement.create({ data }),
};
