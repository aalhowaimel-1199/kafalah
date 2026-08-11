import { prisma } from "@ramh/db";
import type { GateInput } from "@ramh/shared";

export const floorService = {
  listFloors: () => prisma.floor.findMany({ orderBy: { sortOrder: "asc" } }),
  listGates: () => prisma.gate.findMany({ orderBy: { code: "asc" }, include: { floor: true } }),

  async resolve(opts: { floorKeys?: string[]; gateCodes?: string[] }) {
    const floorKeys = new Set<string>(opts.floorKeys ?? []);
    let gates = opts.gateCodes && opts.gateCodes.length
      ? await prisma.gate.findMany({ where: { code: { in: opts.gateCodes }, isActive: true } })
      : [];
    for (const g of gates) floorKeys.add(g.floorKey);
    if (opts.floorKeys && opts.floorKeys.length) {
      const floorGates = await prisma.gate.findMany({ where: { floorKey: { in: opts.floorKeys }, isActive: true } });
      const have = new Set(gates.map((g) => g.id));
      for (const g of floorGates) if (!have.has(g.id)) gates.push(g);
    }
    const floors = await prisma.floor.findMany({ where: { key: { in: [...floorKeys] } }, orderBy: { sortOrder: "asc" } });
    return { floors, gates };
  },

  async createGate(input: GateInput) {
    return prisma.gate.create({
      data: {
        code: input.code,
        nameAr: input.nameAr,
        nameEn: input.nameEn || input.nameAr,
        floorKey: input.floorKey,
        isExit: input.isExit ?? false,
        biotimeDoorId: input.biotimeDoorId || null,
      },
    });
  },

  deleteGate: (id: string) => prisma.gate.delete({ where: { id } }),
  gateByDoorId: (doorId: string) => prisma.gate.findFirst({ where: { biotimeDoorId: doorId } }),
};
