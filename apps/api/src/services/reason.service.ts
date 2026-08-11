import { prisma } from "@ramh/db";
import type { ReasonInput } from "@ramh/shared";

export const reasonService = {
  listActive: () => prisma.visitReason.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  listAll: () => prisma.visitReason.findMany({ orderBy: { sortOrder: "asc" } }),

  async add(input: ReasonInput) {
    const count = await prisma.visitReason.count();
    return prisma.visitReason.create({ data: { nameAr: input.nameAr, nameEn: input.nameEn || input.nameAr, sortOrder: count } });
  },

  toggle: (id: string, active: boolean) => prisma.visitReason.update({ where: { id }, data: { active } }),
  remove: (id: string) => prisma.visitReason.delete({ where: { id } }),
};
