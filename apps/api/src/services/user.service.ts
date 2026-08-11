import { prisma } from "@ramh/db";
import type { UserInput, UserUpdateInput } from "@ramh/shared";
import { auth } from "../auth";

export const userService = {
  list: () =>
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        canApprove: true,
        canInvite: true,
        inviteAutoApprove: true,
        canManageSettings: true,
      },
    }),

  async create(input: UserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error("البريد مستخدم مسبقاً");
    await auth.api.signUpEmail({ body: { email: input.email, password: input.password, name: input.name } });
    return prisma.user.update({
      where: { email: input.email },
      data: {
        role: input.role,
        emailVerified: true,
        canApprove: input.canApprove ?? false,
        canInvite: input.canInvite ?? false,
        inviteAutoApprove: input.inviteAutoApprove ?? false,
        canManageSettings: input.canManageSettings ?? false,
      },
    });
  },

  update: (id: string, input: UserUpdateInput) => prisma.user.update({ where: { id }, data: input }),
};
