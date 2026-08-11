import { prisma } from "@ramh/db";
import type { PageInput } from "@ramh/shared";

const data = (input: PageInput, fallbackOrder: number) => ({
  titleAr: input.titleAr,
  titleEn: input.titleEn,
  contentAr: input.contentAr || "",
  contentEn: input.contentEn || "",
  published: input.published ?? true,
  sortOrder: input.sortOrder ?? fallbackOrder,
});

export const pageService = {
  // عام: الصفحات المنشورة فقط (تظهر في تذييل الموقع)
  listPublished: () =>
    prisma.page.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, titleAr: true, titleEn: true },
    }),

  getPublished: (id: string) => prisma.page.findFirst({ where: { id, published: true } }),

  // إدارة
  listAll: () => prisma.page.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),

  async create(input: PageInput) {
    const count = await prisma.page.count();
    return prisma.page.create({ data: data(input, count) });
  },

  update: (id: string, input: PageInput) => prisma.page.update({ where: { id }, data: data(input, 0) }),

  remove: (id: string) => prisma.page.delete({ where: { id } }),
};
