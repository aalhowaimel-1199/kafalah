import { prisma } from "@ramh/db";
import type { DepartmentInput } from "@ramh/shared";

export const departmentService = {
  listActive: () => prisma.department.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  listAll: () => prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),

  async add(input: DepartmentInput) {
    const count = await prisma.department.count();
    return prisma.department.create({ data: { nameAr: input.nameAr, nameEn: input.nameEn || input.nameAr, sortOrder: count } });
  },

  update: (id: string, input: Partial<DepartmentInput>) =>
    prisma.department.update({
      where: { id },
      data: {
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    }),

  remove: (id: string) => prisma.department.delete({ where: { id } }),
};
