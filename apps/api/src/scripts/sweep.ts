import "dotenv/config";
import { prisma } from "@ramh/db";
import { visitService } from "../services/visit.service";
import { movementService } from "../services/movement.service";

async function main() {
  const expired = await visitService.sweepExpired();
  const overstay = await movementService.overstaying();
  for (const v of overstay) {
    await prisma.visitRequest.update({ where: { id: v.id }, data: { overstayAlerted: true } });
  }
  console.log(`Expired: ${expired}, overstaying: ${overstay.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
