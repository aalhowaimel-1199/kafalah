import "dotenv/config";
import { prisma } from "@ramh/db";
import { biotimeService } from "../services/biotime.service";
import { ingestMovement } from "../services/ingest";

async function main() {
  const key = "biotime_last_poll";
  const row = await prisma.setting.findUnique({ where: { key } });
  const since = row ? new Date((row.value as { at: string }).at) : new Date(Date.now() - 5 * 60 * 1000);
  const movements = await biotimeService.fetchMovements(since);
  let recorded = 0;
  for (const m of movements) {
    const visit = await prisma.visitRequest.findFirst({ where: { OR: [{ barcode: m.card }, { cardNumber: m.card }] } });
    if (!visit) continue;
    await ingestMovement({ visitId: visit.id, doorId: m.doorId ?? undefined, direction: m.direction, at: m.at });
    recorded++;
  }
  await prisma.setting.upsert({ where: { key }, update: { value: { at: new Date().toISOString() } }, create: { key, value: { at: new Date().toISOString() } } });
  console.log(`Polled ${movements.length}, recorded ${recorded}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
