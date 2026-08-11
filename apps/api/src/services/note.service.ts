import { prisma } from "@ramh/db";
import type { NoteInput } from "@ramh/shared";

export const noteService = {
  listByVisitor: (visitorKey: string) =>
    prisma.visitorNote.findMany({ where: { visitorKey }, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } }),

  recent: () => prisma.visitorNote.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { author: { select: { name: true } } } }),

  add: (input: NoteInput, userId: string) => prisma.visitorNote.create({ data: { visitorKey: input.visitorKey, body: input.body, authorId: userId } }),
};
