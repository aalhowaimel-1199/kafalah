import { prisma } from "@ramh/db";
import type { BlacklistInput } from "@ramh/shared";

export const blacklistService = {
  list: () => prisma.blacklistEntry.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } }),

  async isBlocked(identifiers: Array<string | null | undefined>): Promise<boolean> {
    const ids = identifiers.filter((x): x is string => Boolean(x && x.trim()));
    if (!ids.length) return false;
    const hit = await prisma.blacklistEntry.findFirst({ where: { active: true, identifier: { in: ids } } });
    return Boolean(hit);
  },

  add: (input: BlacklistInput, userId: string) =>
    prisma.blacklistEntry.create({ data: { name: input.name, identifier: input.identifier, reason: input.reason || null, createdById: userId } }),

  remove: (id: string) => prisma.blacklistEntry.update({ where: { id }, data: { active: false } }),
};
