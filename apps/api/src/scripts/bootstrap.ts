import "dotenv/config";
import { prisma } from "@ramh/db";
import { auth } from "../auth";
import { env } from "../env";

const caps = {
  role: "ADMIN" as const,
  emailVerified: true,
  active: true,
  canApprove: true,
  canInvite: true,
  inviteAutoApprove: true,
  canManageSettings: true,
};

async function main() {
  const email = env.SEED_ADMIN_EMAIL;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: caps });
    console.log(`Admin exists, capabilities set: ${email}`);
    return;
  }
  await auth.api.signUpEmail({ body: { email, password: env.SEED_ADMIN_PASSWORD, name: "مدير النظام" } });
  await prisma.user.update({ where: { email }, data: caps });
  console.log(`Admin created: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
